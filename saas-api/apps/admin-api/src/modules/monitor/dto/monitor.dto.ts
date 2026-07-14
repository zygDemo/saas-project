import { ApiPropertyOptional } from '@nestjs/swagger'

/** 监控日志查询参数 */
export class MonitorLogQueryDto {
  @ApiPropertyOptional({ description: '模块名称（模糊搜索）' })
  module?: string

  @ApiPropertyOptional({ description: '事件类型：error / performance / action' })
  type?: string

  @ApiPropertyOptional({ description: '事件描述（模糊搜索）' })
  event?: string

  @ApiPropertyOptional({ description: 'HTTP 状态码' })
  statusCode?: string

  @ApiPropertyOptional({ description: '开始时间（ISO 8601）' })
  startTime?: string

  @ApiPropertyOptional({ description: '结束时间（ISO 8601）' })
  endTime?: string

  @ApiPropertyOptional({ description: '当前页码', default: 1 })
  current?: number

  @ApiPropertyOptional({ description: '每页条数', default: 20 })
  size?: number
}

/** 监控统计概览查询参数 */
export class MonitorStatsQueryDto {
  @ApiPropertyOptional({ description: '开始时间（ISO 8601）' })
  startTime?: string

  @ApiPropertyOptional({ description: '模块名称（模糊搜索）' })
  module?: string
}
