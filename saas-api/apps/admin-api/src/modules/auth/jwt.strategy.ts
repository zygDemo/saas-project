import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { RequestUser } from '../../common/types/request-user'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    const secret = config.get<string>('JWT_ACCESS_SECRET')
    if (!secret) {
      throw new Error('环境变量 JWT_ACCESS_SECRET 未配置，请先在 .env 或部署环境中设置访问令牌密钥。')
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret
    })
  }

  validate(payload: RequestUser): RequestUser {
    return {
      sub: payload.sub,
      userName: payload.userName,
      tenantId: payload.tenantId,
      orgId: payload.orgId,
      roles: payload.roles
    }
  }
}
