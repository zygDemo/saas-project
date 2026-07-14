import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import { IsInt, IsNumber, IsObject, IsOptional, IsString, Min } from 'class-validator'
import { PageQueryDto, ToNumber } from '../../common/dto/common.dto'

export class CreatePackagePlanDto {
  @ApiProperty({ description: '套餐名称' })
  @IsString()
  name: string

  @ApiProperty({ description: '套餐编码' })
  @IsString()
  code: string

  @ApiPropertyOptional({ description: '套餐描述' })
  @IsOptional()
  @IsString()
  description?: string

  @ApiProperty({ description: '月费' })
  @ToNumber()
  @IsNumber()
  @Min(0)
  price: number

  @ApiPropertyOptional({ description: '最大用户数，0=不限', default: 0 })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(0)
  maxUsers?: number

  @ApiPropertyOptional({ description: '最大机构数，0=不限', default: 0 })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(0)
  maxOrgs?: number

  @ApiPropertyOptional({ description: '功能特性列表' })
  @IsOptional()
  @IsObject()
  features?: Record<string, unknown>

  @ApiPropertyOptional({ description: '状态', default: 'ACTIVE' })
  @IsOptional()
  @IsString()
  status?: string

  @ApiPropertyOptional({ description: '排序', default: 0 })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(0)
  sortOrder?: number
}


export class UpdatePackagePlanDto extends PartialType(CreatePackagePlanDto) {}


export class PackagePlanQueryDto extends PageQueryDto {
  @ApiPropertyOptional({ description: '关键词，匹配套餐名称或编码' })
  @IsOptional()
  @IsString()
  keyword?: string

  @ApiPropertyOptional({ description: '套餐名称，模糊查询' })
  @IsOptional()
  @IsString()
  name?: string

  @ApiPropertyOptional({ description: '套餐编码，模糊查询' })
  @IsOptional()
  @IsString()
  code?: string

  @ApiPropertyOptional({ description: '状态' })
  @IsOptional()
  @IsString()
  status?: string
}

