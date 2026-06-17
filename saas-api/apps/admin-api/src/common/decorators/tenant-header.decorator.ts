import { applyDecorators } from '@nestjs/common'
import { ApiBadRequestResponse, ApiHeader } from '@nestjs/swagger'

export function ApiTenantHeader() {
  return applyDecorators(
    ApiHeader({
      name: 'X-Tenant-ID',
      description: '租户 ID，用于区分当前请求所属租户',
      required: true,
      example: 1
    }),
    ApiBadRequestResponse({ description: '租户 ID 必填或格式不正确' })
  )
}
