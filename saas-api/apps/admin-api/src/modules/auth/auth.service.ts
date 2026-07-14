import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcryptjs'
import { getCurrentTenantId } from '../../common/tenant/tenant-context'
import { PrismaService } from '../prisma/prisma.service'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService
  ) {}

  async login(dto: LoginDto) {
    const tenantId = getCurrentTenantId()
    if (!tenantId) {
      throw new BadRequestException('请求头 X-Tenant-ID 不能为空')
    }

    const user = await this.prisma.user.findFirst({
      where: { tenantId, userName: { equals: dto.userName, mode: 'insensitive' } },
      include: { roles: { include: { role: true } } }
    })

    if (!user) throw new UnauthorizedException('用户名或密码错误')

    const matched = await bcrypt.compare(dto.password, user.passwordHash)
    if (!matched) throw new UnauthorizedException('用户名或密码错误')

    const roles = user.roles.map(({ role }: { role: { code: string } }) => role.code)
    const roleIds = user.roles.map(({ role }: { role: { id: number } }) => role.id)
    const payload = { sub: user.id, userName: user.userName, tenantId, roles, roleIds }

    const token = `Bearer ${await this.jwt.signAsync(payload)}`
    const refreshToken = `Bearer ${await this.jwt.signAsync(payload, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET', 'change-me-refresh-secret'),
        expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d')
      })}`

    return {
      token,
      refreshToken
    }
  }

  async register(dto: RegisterDto) {
    const tenantId = getCurrentTenantId()
    if (!tenantId) {
      throw new BadRequestException('请求头 X-Tenant-ID 不能为空')
    }

    // 检查用户名是否已存在
    const existing = await this.prisma.user.findFirst({
      where: { tenantId, userName: { equals: dto.userName, mode: 'insensitive' } }
    })
    if (existing) {
      throw new BadRequestException('用户名已存在')
    }

    // 加密密码
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(dto.password, salt)

    // 创建用户
    const user = await this.prisma.user.create({
      data: {
        tenantId,
        userName: dto.userName,
        passwordHash,
        nickName: dto.nickName,
        status: 'ACTIVE'
      }
    })

    return {
      id: user.id,
      userName: user.userName,
      nickName: user.nickName
    }
  }
}
