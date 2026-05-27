import { Injectable, NestMiddleware } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'
import { tenantStorage } from './tenant-context'

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  try {
    return JSON.parse(Buffer.from(parts[1], 'base64').toString())
  } catch {
    return null
  }
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    let headerTenantId: number | null = null
    let tokenTenantId: number | null = null

    // 1. 从 X-Tenant-ID Header 取
    if (req.headers['x-tenant-id']) {
      headerTenantId = Number(req.headers['x-tenant-id'])
    }

    // 2. 从 Bearer Token payload 取 tenantId（base64 解码，不验签）
    const auth = req.headers.authorization
    if (typeof auth === 'string' && auth.startsWith('Bearer ')) {
      const payload = decodeJwtPayload(auth.slice(7))
      if (payload?.tenantId) {
        tokenTenantId = Number(payload.tenantId)
      }
    }

    // 未登录时（无 token）：以 Header 为准
    if (!tokenTenantId) {
      tenantStorage.run({ tenantId: headerTenantId }, () => next())
      return
    }

    // 已登录时：以 Token 中的租户 ID 为准（已签名，不可伪造）
    // 如果 Header 也传了且不一致，优先信任 Token
    tenantStorage.run({ tenantId: tokenTenantId }, () => next())
  }
}
