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

/** 获取当前登录用户 ID（需在请求上下文中调用） */
export function getCurrentUserId(): number | undefined {
  return tenantStorage.getStore()?.userId
}

/** 获取当前登录用户的角色 ID 列表 */
export function getCurrentUserRoles(): number[] {
  return tenantStorage.getStore()?.userRoles ?? []
}
