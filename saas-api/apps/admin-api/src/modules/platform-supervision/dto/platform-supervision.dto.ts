import { ApiPropertyOptional } from '@nestjs/swagger'

/** 平台监管机构统计查询参数 */
export class PlatformStatsQueryDto {
  @ApiPropertyOptional({ description: '当前页码', default: 1 })
  current?: number

  @ApiPropertyOptional({ description: '每页条数', default: 20 })
  size?: number
}
