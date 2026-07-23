import { AsyncLocalStorage } from 'async_hooks'

export interface TenantContextData {
  tenantId: number | null
  /** 当前登录用户信息（由 TenantMiddleware 注入） */
  userId?: number
  userRoles?: number[]
}

export const tenantStorage = new AsyncLocalStorage<TenantContextData>()

export function getCurrentTenantId(): number | null {
  return tenantStorage.getStore()?.tenantId ?? null
}

/**
 * 获取当前租户 ID，无租户上下文时抛异常。
 * 用于管理端/业务写入场景，避免 tenantId 为空导致 where 条件失效（跨租户数据泄露）。
 */
export function getCurrentTenantIdOrThrow(): number {
  const tenantId = tenantStorage.getStore()?.tenantId
  if (tenantId == null) {
    throw new Error('当前请求缺少租户上下文（tenantId），请确认请求经过 TenantMiddleware')
  }
  return tenantId
}

/** 获取当前登录用户 ID（需在请求上下文中调用） */
export function getCurrentUserId(): number | undefined {
  return tenantStorage.getStore()?.userId
}

/** 获取当前登录用户的角色 ID 列表 */
export function getCurrentUserRoles(): number[] {
  return tenantStorage.getStore()?.userRoles ?? []
}
