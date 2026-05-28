import { applyDecorators } from '@nestjs/common'
import { ApiBadRequestResponse, ApiHeader } from '@nestjs/swagger'

export function ApiTenantHeader() {
  return applyDecorators(
    ApiHeader({
      name: 'X-Tenant-ID',
      description: 'Tenant ID used to scope the request',
      required: true,
      example: 1
    }),
    ApiBadRequestResponse({ description: 'Tenant ID is required or invalid' })
  )
}
