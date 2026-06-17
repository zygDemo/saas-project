import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { RequestUser } from '../../common/types/request-user'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_ACCESS_SECRET', 'change-me-access-secret')
    })
  }

  validate(payload: RequestUser): RequestUser {
    return {
      sub: payload.sub,
      userName: payload.userName,
      tenantId: payload.tenantId,
      roles: payload.roles
    }
  }
}
