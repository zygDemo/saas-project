import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsDateString, IsInt, IsOptional, IsString, Min } from 'class-validator'
import { ToNumber } from '../../common/dto/common.dto'

export class DateRangeQueryDto {
  @ApiPropertyOptional({ description: '开始时间' })
  @IsOptional()
  @IsDateString()
  startAt?: string

  @ApiPropertyOptional({ description: '结束时间' })
  @IsOptional()
  @IsDateString()
  endAt?: string
}

export class AuditLogQueryDto extends DateRangeQueryDto {
  @ApiPropertyOptional({ description: '当前页', default: 1 })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  current?: number

  @ApiPropertyOptional({ description: '每页数量', default: 20 })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  size?: number

  @ApiPropertyOptional({ description: '模块' })
  @IsOptional()
  @IsString()
  module?: string

  @ApiPropertyOptional({ description: '动作/请求方法' })
  @IsOptional()
  @IsString()
  action?: string

  @ApiPropertyOptional({ description: '用户名' })
  @IsOptional()
  @IsString()
  userName?: string

  @ApiPropertyOptional({ description: '关键字，匹配描述、模块、动作、用户名、IP' })
  @IsOptional()
  @IsString()
  keyword?: string

  @ApiPropertyOptional({ description: '状态筛选: success=成功(2xx), fail=失败(4xx/5xx)' })
  @IsOptional()
  @IsString()
  status?: string
}

export class AuditLogStatsDto extends DateRangeQueryDto {
  @ApiPropertyOptional({ description: '模块' })
  @IsOptional()
  @IsString()
  module?: string
}
