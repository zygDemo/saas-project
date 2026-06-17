import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NestMiddleware,
  UnauthorizedException
} from '@nestjs/common'
import { NextFunction, Request, Response } from 'express'
import { ApiStatus } from '../constants/api-status'
import { tenantStorage } from './tenant-context'

export const TENANT_HEADER = 'x-tenant-id'

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null

  try {
    return JSON.parse(Buffer.from(parts[1], 'base64url').toString())
  } catch {
    return null
  }
}

function parseTenantId(value: unknown, source: string): number | null {
  if (value == null || value === '') return null

  const raw = Array.isArray(value) ? value[0] : value
  const tenantId = Number(raw)

  if (!Number.isInteger(tenantId) || tenantId <= 0) {
    throw new BadRequestException(`${source} 必须是正整数`)
  }

  return tenantId
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    try {
      const headerTenantId = parseTenantId(req.headers[TENANT_HEADER], 'X-Tenant-ID header')
      let tokenTenantId: number | null = null

      const auth = req.headers.authorization
      if (typeof auth === 'string' && auth.startsWith('Bearer ')) {
        const payload = decodeJwtPayload(auth.slice(7))
        tokenTenantId = parseTenantId(payload?.tenantId, 'Token tenantId')
      }

      if (tokenTenantId && headerTenantId && tokenTenantId !== headerTenantId) {
        throw new ForbiddenException('X-Tenant-ID 与 token 中的 tenantId 不一致')
      }

      if (auth && !tokenTenantId) {
        throw new UnauthorizedException('token 中的 tenantId 无效')
      }

      tenantStorage.run({ tenantId: tokenTenantId ?? headerTenantId }, () => next())
    } catch (error) {
      const status = error instanceof HttpException ? error.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR
      const body = error instanceof HttpException ? error.getResponse() : null

      res.status(status).json({
        code: statusToApiCode(status),
        msg: extractMessage(body) ?? '服务器内部错误',
        data: null
      })
    }
  }
}

function extractMessage(body: unknown) {
  if (typeof body === 'string') return body
  if (!body || typeof body !== 'object') return undefined
  const message = (body as { message?: string | string[] }).message
  if (Array.isArray(message)) return message[0]
  return message
}

function statusToApiCode(status: number) {
  if (status === HttpStatus.UNAUTHORIZED) return ApiStatus.unauthorized
  if (status === HttpStatus.FORBIDDEN) return ApiStatus.forbidden
  if (status >= 500) return ApiStatus.internalServerError
  return ApiStatus.error
}
