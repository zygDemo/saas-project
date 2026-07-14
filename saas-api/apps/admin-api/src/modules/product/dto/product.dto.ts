import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import { IsArray, IsInt, IsNumber, IsObject, IsOptional, IsString, Min } from 'class-validator'
import { OrgScopedQueryDto, ToNumber } from '../../common/dto/common.dto'

export class CreateProductDto {
  @ApiProperty({ description: '机构ID' })
  @ToNumber()
  @IsInt()
  @Min(1)
  orgId: number

  @ApiProperty({ description: '产品名称' })
  @IsString()
  name: string

  @ApiProperty({ description: '产品类型' })
  @IsString()
  productType: string

  @ApiProperty({ description: '最低年利率' })
  @ToNumber()
  @IsNumber()
  @Min(0)
  minRate: number

  @ApiProperty({ description: '最高年利率' })
  @ToNumber()
  @IsNumber()
  @Min(0)
  maxRate: number

  @ApiProperty({ description: '最低金额' })
  @ToNumber()
  @IsNumber()
  @Min(0)
  minAmount: number

  @ApiProperty({ description: '最高金额' })
  @ToNumber()
  @IsNumber()
  @Min(0)
  maxAmount: number

  @ApiProperty({ description: '最短期限（月）' })
  @ToNumber()
  @IsInt()
  @Min(1)
  minTerm: number

  @ApiProperty({ description: '最长期限（月）' })
  @ToNumber()
  @IsInt()
  @Min(1)
  maxTerm: number

  @ApiProperty({ description: '还款方式' })
  @IsString()
  repaymentMethod: string

  @ApiPropertyOptional({ description: '最低年龄' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(0)
  minAge?: number

  @ApiPropertyOptional({ description: '最高年龄' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(0)
  maxAge?: number

  @ApiPropertyOptional({ description: '最大车龄' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(0)
  maxCarAge?: number

  @ApiPropertyOptional({ description: '最大里程' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(0)
  maxMileage?: number

  @ApiPropertyOptional({ description: '最高贷款价值比' })
  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(0)
  ltvLimit?: number

  @ApiPropertyOptional({ description: '最低首付比例' })
  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(0)
  minDownPayment?: number

  @ApiPropertyOptional({ description: '适用区域' })
  @IsOptional()
  @IsString()
  regions?: string

  @ApiPropertyOptional({ description: '适用资方配置，JSON对象' })
  @IsOptional()
  @IsObject()
  applicableFunders?: Record<string, unknown>

  @ApiPropertyOptional({ description: '准入条件配置，JSON对象' })
  @IsOptional()
  @IsObject()
  accessConditions?: Record<string, unknown>

  @ApiPropertyOptional({ description: '估值折扣率' })
  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(0)
  valuationDiscountRate?: number

  @ApiPropertyOptional({ description: '状态' })
  @IsOptional()
  @IsString()
  status?: string

  @ApiPropertyOptional({
    description: '附件清单配置，数组每项含 code(文件编码)/name(文件名称)/fileTypes(允许扩展名)/maxCount(最大张数)/required(是否必传)/remark(备注)',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        code: { type: 'string', example: 'ID_CARD_FRONT' },
        name: { type: 'string', example: '身份证人像面' },
        fileTypes: { type: 'array', items: { type: 'string' }, example: ['jpg', 'png', 'pdf'] },
        maxCount: { type: 'integer', example: 1, minimum: 1, maximum: 20 },
        required: { type: 'boolean', example: true },
        remark: { type: 'string', example: '需清晰可见' }
      }
    }
  })
  @IsOptional()
  @IsArray()
  fileChecklist?: Array<{
    code: string
    name: string
    fileTypes: string[]
    maxCount: number
    required: boolean
    remark?: string
  }>
}


export class UpdateProductDto extends PartialType(CreateProductDto) {}


export class ProductQueryDto extends OrgScopedQueryDto {
  @ApiPropertyOptional({ description: '产品名称，模糊查询' })
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

