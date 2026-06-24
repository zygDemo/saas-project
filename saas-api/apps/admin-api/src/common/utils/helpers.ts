import { BadRequestException } from '@nestjs/common'
import { getCurrentTenantId } from '../tenant/tenant-context'

/**
 * 检查值是否有效（非 undefined、非 null、非空字符串）
 */
export function hasValue(value: unknown): boolean {
  return value !== undefined && value !== null && value !== ''
}

/**
 * 获取当前租户ID，若不存在则抛出异常
 */
export function getRequiredTenantId(): number {
  const tenantId = getCurrentTenantId()
  if (!tenantId) throw new BadRequestException('请求头 X-Tenant-ID 不能为空')
  return tenantId
}

/**
 * 格式化日期为 YYYY-MM-DD HH:mm:ss
 */
export function formatDate(value: Date): string {
  return value.toISOString().replace('T', ' ').slice(0, 19)
}
