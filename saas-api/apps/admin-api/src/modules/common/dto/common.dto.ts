import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsInt, IsOptional, Max, Min } from 'class-validator'

export function ToNumber() {
  return Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return undefined
    const num = Number(value)
    return Number.isNaN(num) ? undefined : num
  })
}

export function ToDate() {
  return Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return undefined
    return new Date(value)
  })
}

export function ToBoolean() {
  return Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return undefined
    if (typeof value === 'boolean') return value
    return value === 'true' || value === '1' || value === 1
  })
}

export function ToEmptyAsUndefined() {
  return Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return undefined
    return value
  })
}

export class IdParamDto {
  @ApiProperty({ description: '主键ID' })
  @ToNumber()
  @IsInt()
  @Min(1)
  id: number
}

export class PageQueryDto {
  @ApiPropertyOptional({ description: '当前页', default: 1 })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  current?: number

  @ApiPropertyOptional({ description: '每页数量', default: 20, maximum: 1000 })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  @Max(1000)
  size?: number
}

export class OrgScopedQueryDto extends PageQueryDto {
  @ApiPropertyOptional({ description: '机构ID' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  orgId?: number
}
