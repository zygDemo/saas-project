import request from '@/utils/http'
import type { BasePageResponse, PageQuery } from '@/types/api/contract'

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
  statusCode?: number
  description?: string
  requestData?: unknown
  responseData?: unknown
  ip?: string
  userAgent?: string
  createdAt: string
}

export interface AuditLogStats {
  total: number
  successCount: number
  failCount: number
  successRate: number
  modules: Array<{ module: string; count: number }>
  actions: Array<{ action: string; count: number }>
  hourly: Array<{ hour: number; label: string; count: number; attackCount: number }>
  attackIps: Array<{ ip: string; count: number; failCount: number; failRate: number }>
  burstIps: Array<{ ip: string; burstCount: number; windowStart: string; windowEnd: string; threatLevel: string }>
  loginAttempts: Array<{ ip: string; count: number; failCount: number; failRate: number; lastAttempt: string; threatLevel: string }>
  consecutiveFails: Array<{ ip: string; consecutiveFails: number; lastFailTime: string; failModule: string; threatLevel: string }>
}

export interface HeatmapData {
  heatmapData: Array<[number, number, number]>
  maxValue: number
}

export function fetchDataCenterStats(params: PageQuery) {
  return request.get<DataCenterStats>({
    url: '/data-center/stats',
    params
  })
}

export function fetchHeatmapData(params?: PageQuery) {
  return request.get<HeatmapData>({
    url: '/data-center/heatmap',
    params
  })
}

export function fetchAuditLogs(params: BusinessQuery) {
  return request.get<BasePageResponse<AuditLogItem>>({
    url: '/data-center/audit-logs',
    params
  })
}

export function fetchAuditLogStats(params?: PageQuery) {
  return request.get<AuditLogStats>({
    url: '/data-center/audit-log/stats',
    params
  })
}
