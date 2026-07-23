import request from '@/utils/http'

/** 管理端：获取通知日志列表 */
export function getNotificationLogs(params?: {
  current?: number
  size?: number
  type?: string
  userId?: number
  startTime?: string
  endTime?: string
}) {
  return request.get({ url: '/notification/logs', params })
}
