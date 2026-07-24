import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcryptjs'
import * as crypto from 'crypto'
import { getCurrentTenantId } from '../../common/tenant/tenant-context'
import { PrismaService } from '../prisma/prisma.service'
import { CacheService } from '../redis/cache.service'
import { EmailService } from '../email/email.service'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly cache: CacheService,
    private readonly email: EmailService,
  ) {}

  async login(dto: LoginDto) {
    const tenantId = getCurrentTenantId()
    if (!tenantId) {
      throw new BadRequestException('请求头 X-Tenant-ID 不能为空')
    }

    const user = await this.prisma.user.findFirst({
      where: { tenantId, userName: { equals: dto.userName, mode: 'insensitive' } },
      include: { roles: { include: { role: true } }, dept: true },
    })

    if (!user) throw new UnauthorizedException('用户名或密码错误')

    const matched = await bcrypt.compare(dto.password, user.passwordHash)
    if (!matched) throw new UnauthorizedException('用户名或密码错误')

    const roles = user.roles.map(({ role }: { role: { code: string } }) => role.code)
    const roleIds = user.roles.map(({ role: { id } }) => id)
    // 通过部门推导所属机构，用于审计日志的 org 维度
    const orgId = user.dept?.orgId ?? null
    const payload = { userId: user.id, userName: user.userName, tenantId, orgId, roles, roleIds }

    const token = `Bearer ${await this.jwt.signAsync(payload)}`
    const refreshToken = `Bearer ${await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET', 'change-me-refresh-secret'),
      expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
    })}`

    return { token, refreshToken }
  }

  async register(dto: RegisterDto) {
    const tenantId = getCurrentTenantId()
    if (!tenantId) {
      throw new BadRequestException('请求头 X-Tenant-ID 不能为空')
    }

    const existing = await this.prisma.user.findFirst({
      where: { tenantId, userName: { equals: dto.userName, mode: 'insensitive' } },
    })
    if (existing) {
      throw new BadRequestException('该邮箱已注册')
    }

    // 验证邮箱验证码（兼容 send-code 默认 type=login 的情况）
    if (dto.email && dto.emailCode) {
      const codeKeys = [
        `email_code:${tenantId}:${dto.email}:register`,
        `email_code:${tenantId}:${dto.email}:login`,
      ]
      let cachedCode: string | null = null
      for (const key of codeKeys) {
        const c = await this.cache.get<string>(key)
        if (c) {
          cachedCode = c
          await this.cache.del(key)
          break
        }
      }
      if (!cachedCode || cachedCode !== dto.emailCode) {
        throw new BadRequestException('验证码错误或已过期')
      }
    }

    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(dto.password, salt)

    const user = await this.prisma.user.create({
      data: {
        tenantId,
        userName: dto.userName,
        passwordHash,
        nickName: dto.nickName,
        email: dto.email || null,
        status: 'ONLINE',
      },
    })

    return { id: user.id, userName: user.userName, nickName: user.nickName }
  }

  /** 发送邮箱验证码 */
  async sendEmailCode(email: string, type: 'login' | 'register' = 'login') {
    const tenantId = getCurrentTenantId()
    if (!tenantId) throw new BadRequestException('请求头 X-Tenant-ID 不能为空')

    // 检查发送频率（60秒内不能重复发送）
    const rateKey = `email_rate:${tenantId}:${email}`
    const recentSent = await this.cache.get(rateKey)
    if (recentSent) throw new BadRequestException('验证码发送过于频繁，请60秒后再试')

    // 生成6位安全随机验证码
    const code = crypto.randomInt(0, 1000000).toString().padStart(6, '0')

    // 存入Redis，5分钟有效
    const codeKey = `email_code:${tenantId}:${email}:${type}`
    await this.cache.set(codeKey, code, 300)

    // 设置发送频率限制，60秒
    await this.cache.set(rateKey, '1', 60)

    // 发送邮件
    const sent = await this.email.sendVerificationCode(email, code)
    if (!sent) throw new BadRequestException('邮件发送失败，请稍后再试')

    return { message: '验证码已发送' }
  }

  /** 邮箱验证码登录/注册 */
  async emailLogin(email: string, code: string) {
    const tenantId = getCurrentTenantId()
    if (!tenantId) throw new BadRequestException('请求头 X-Tenant-ID 不能为空')

    // 校验验证码
    const codeKey = `email_code:${tenantId}:${email}:login`
    const cachedCode = await this.cache.get<string>(codeKey)
    if (!cachedCode || cachedCode !== code) {
      throw new BadRequestException('验证码错误或已过期')
    }
    // 验证通过，删除验证码
    await this.cache.del(codeKey)

    // 查找或创建用户
    let user = await this.prisma.user.findFirst({
      where: { tenantId, email },
      include: { roles: { include: { role: true } }, dept: true },
    })

    if (!user) {
      // 自动注册（生成随机 passwordHash，禁止通过密码登录，仅邮箱验证码登录）
      const salt = await bcrypt.genSalt(10)
      const passwordHash = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), salt)
      user = await this.prisma.user.create({
        data: {
          tenantId,
          userName: email.split('@')[0] + '_' + Date.now().toString(36),
          email,
          nickName: email.split('@')[0],
          passwordHash,
          status: 'ONLINE',
        },
        include: { roles: { include: { role: true } }, dept: true },
      })
    }

    const roles = user.roles.map(({ role }: { role: { code: string } }) => role.code)
    const roleIds = user.roles.map(({ role: { id } }) => id)
    // 通过部门推导所属机构，用于审计日志的 org 维度（自动注册用户无部门，orgId 为 null）
    const orgId = user.dept?.orgId ?? null
    const payload = { userId: user.id, userName: user.userName, tenantId, orgId, roles, roleIds }

    const token = `Bearer ${await this.jwt.signAsync(payload)}`
    const refreshToken = `Bearer ${await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET', 'change-me-refresh-secret'),
      expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
    })}`

    return { token, refreshToken }
  }
}
