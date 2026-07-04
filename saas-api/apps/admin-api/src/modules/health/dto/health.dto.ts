import { ApiProperty } from '@nestjs/swagger'

export class HealthCheckResponseDto {
  @ApiProperty({ description: '服务状态', example: 'ok' })
  status!: string

  @ApiProperty({ description: '检查时间戳', example: '2026-07-04T10:00:00.000Z' })
  timestamp!: string
}
