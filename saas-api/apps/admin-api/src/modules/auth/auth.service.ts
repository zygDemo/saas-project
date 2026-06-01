import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcryptjs'
import { getCurrentTenantId } from '../../common/tenant/tenant-context'
import { PrismaService } from '../prisma/prisma.service'
import { LoginDto } from './dto/login.dto'

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
      throw new BadRequestException('X-Tenant-ID header is required')
    }

    const user = await this.prisma.user.findFirst({
      where: { tenantId, userName: { equals: dto.userName, mode: 'insensitive' } },
      include: { roles: { include: { role: true } } }
    })

    if (!user) throw new UnauthorizedException('Invalid username or password')

    const matched = await bcrypt.compare(dto.password, user.passwordHash)
    if (!matched) throw new UnauthorizedException('Invalid username or password')

    const roles = user.roles.map(({ role }: any) => role.code)
    const payload = { sub: user.id, userName: user.userName, tenantId, roles }

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
}
