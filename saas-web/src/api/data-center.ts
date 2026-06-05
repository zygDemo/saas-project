import request from '@/utils/http'
import type { BusinessPage, BusinessQuery } from './business'

export interface DataCenterStats {
  overview: Record<string, number>
  phases: Array<{ code: number; name: string; count: number }>
  statuses: Array<{ status: string; count: number }>
  products: Array<{ id?: number; name: string; count: number; amount: number }>
  funders: Array<{ id?: number; name: string; count: number; amount: number }>
  trends: Array<{ day: string; count: number; amount: number }>
}

export interface AuditLogItem {
  id: number
  tenantId?: number
  orgId?: number
  userId?: number
  userName?: string
  module: string
  action: string
  description?: string
  requestData?: unknown
  responseData?: unknown
  ip?: string
  userAgent?: string
  createdAt: string
}

export function fetchDataCenterStats(params: Record<string, unknown>) {
  return request.get<DataCenterStats>({
    url: '/data-center/stats',
    params
  })
}

export function fetchAuditLogs(params: BusinessQuery) {
  return request.get<BusinessPage<AuditLogItem>>({
    url: '/data-center/audit-logs',
    params
  })
}
