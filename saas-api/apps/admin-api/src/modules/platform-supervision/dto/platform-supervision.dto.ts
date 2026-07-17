import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsInt, IsOptional, Min } from 'class-validator'
import { ToNumber } from '../../../common/dto/common.dto'

/** 平台监管机构统计查询参数 */
export class PlatformStatsQueryDto {
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
