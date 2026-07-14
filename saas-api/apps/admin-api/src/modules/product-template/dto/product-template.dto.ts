import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import { IsInt, IsNumber, IsObject, IsOptional, IsString, Min } from 'class-validator'
import { PageQueryDto, ToNumber } from '../../common/dto/common.dto'

export class CreateProductTemplateDto {
  @ApiProperty({ description: '模板名称' })
  @IsString()
  name: string

  @ApiProperty({ description: '产品类型：抵押贷、信用贷、融资租赁' })
  @IsString()
  productType: string

  @ApiPropertyOptional({ description: '描述' })
  @IsOptional()
  @IsString()
  description?: string

  @ApiPropertyOptional({ description: '最低年利率' })
  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(0)
  minRate?: number

  @ApiPropertyOptional({ description: '最高年利率' })
  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(0)
  maxRate?: number

  @ApiPropertyOptional({ description: '最低金额' })
  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(0)
  minAmount?: number

  @ApiPropertyOptional({ description: '最高金额' })
  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(0)
  maxAmount?: number

  @ApiPropertyOptional({ description: '最短期限（月）' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  minTerm?: number

  @ApiPropertyOptional({ description: '最长期限（月）' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  maxTerm?: number

  @ApiPropertyOptional({ description: '还款方式' })
  @IsOptional()
  @IsString()
  repaymentMethod?: string

  @ApiPropertyOptional({ description: '准入条件模板' })
  @IsOptional()
  @IsObject()
  accessConditions?: Record<string, unknown>

  @ApiPropertyOptional({ description: '所需文件清单模板' })
  @IsOptional()
  @IsObject()
  fileChecklist?: Record<string, unknown>

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


export class UpdateProductTemplateDto extends PartialType(CreateProductTemplateDto) {}


export class ProductTemplateQueryDto extends PageQueryDto {
  @ApiPropertyOptional({ description: '关键词，匹配模板名称' })
  @IsOptional()
  @IsString()
  keyword?: string

  @ApiPropertyOptional({ description: '模板名称，模糊查询' })
  @IsOptional()
  @IsString()
  name?: string

  @ApiPropertyOptional({ description: '产品类型' })
  @IsOptional()
  @IsString()
  productType?: string

  @ApiPropertyOptional({ description: '状态' })
  @IsOptional()
  @IsString()
  status?: string
}

