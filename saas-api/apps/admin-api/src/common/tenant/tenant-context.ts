import { AsyncLocalStorage } from 'async_hooks'

export interface TenantContextData {
  tenantId: number | null
}

export const tenantStorage = new AsyncLocalStorage<TenantContextData>()

export function getCurrentTenantId(): number | null {
  return tenantStorage.getStore()?.tenantId ?? null
}
