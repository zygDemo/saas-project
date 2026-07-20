import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsInt, IsOptional, IsString, Min } from 'class-validator'
import { ToNumber } from '../../common/dto/common.dto'

/** 监控日志查询参数 */
export class MonitorLogQueryDto {
  @ApiPropertyOptional({ description: '模块名称（模糊搜索）' })
  @IsOptional()
  @IsString()
  module?: string

  @ApiPropertyOptional({ description: '事件类型：error / performance / action' })
  @IsOptional()
  @IsString()
  type?: string

  @ApiPropertyOptional({ description: '事件描述（模糊搜索）' })
  @IsOptional()
  @IsString()
  event?: string

  @ApiPropertyOptional({ description: 'HTTP 状态码' })
  @IsOptional()
  @IsString()
  statusCode?: string

  @ApiPropertyOptional({ description: '开始时间（ISO 8601）' })
  @IsOptional()
  @IsString()
  startTime?: string

  @ApiPropertyOptional({ description: '结束时间（ISO 8601）' })
  @IsOptional()
  @IsString()
  endTime?: string

  @ApiPropertyOptional({ description: '当前页码', default: 1 })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  current?: number

  @ApiPropertyOptional({ description: '每页条数', default: 20 })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  size?: number
}

/** 监控统计概览查询参数 */
export class MonitorStatsQueryDto {
  @ApiPropertyOptional({ description: '开始时间（ISO 8601）' })
  @IsOptional()
  @IsString()
  startTime?: string

  @ApiPropertyOptional({ description: '模块名称（模糊搜索）' })
  @IsOptional()
  @IsString()
  module?: string
}
