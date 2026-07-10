import request from '@/utils/http'
import type { BasePageResponse, PageQuery } from '@/types/api/contract'

export interface MonitorLogItem {
  id: number
  type?: string
  module?: string
  event?: string
  message?: string
  page?: string
  route?: string
  url?: string
  duration?: number
  statusCode?: number
  stack?: string
  userAgent?: string
  ip?: string
  createdAt?: string
}

export interface MonitorStats {
  total?: number
  errorCount?: number
  performanceCount?: number
  actionCount?: number
  hourly?: Array<{ hour: number; label: string; count: number; attackCount: number }>
  sourceBreakdown?: Array<{ source: string; count: number }>
  from?: string
  to?: string
}

export function fetchMonitorLogs(params: PageQuery) {
  return request.get<BasePageResponse<MonitorLogItem>>({
    url: '/monitor/logs',
    params
  })
}

export function fetchMonitorStats(params?: PageQuery) {
  return request.get<MonitorStats>({
    url: '/monitor/stats',
    params
  })
}
