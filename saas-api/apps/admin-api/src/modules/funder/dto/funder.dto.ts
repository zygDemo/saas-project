import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import { IsInt, IsNumber, IsObject, IsOptional, IsString, Min } from 'class-validator'
import { OrgScopedQueryDto, ToNumber } from '../../common/dto/common.dto'

export class CreateFunderDto {
  @ApiProperty({ description: '机构ID' })
  @ToNumber()
  @IsInt()
  @Min(1)
  orgId: number

  @ApiProperty({ description: '资方名称' })
  @IsString()
  name: string

  @ApiProperty({ description: '资方编码' })
  @IsString()
  code: string

  @ApiProperty({ description: '资方类型' })
  @IsString()
  funderType: string

  @ApiPropertyOptional({ description: '联系人' })
  @IsOptional()
  @IsString()
  contactName?: string

  @ApiPropertyOptional({ description: '联系电话' })
  @IsOptional()
  @IsString()
  contactPhone?: string

  @ApiPropertyOptional({ description: '对接方式：API、文件导入导出、人工录入' })
  @IsOptional()
  @IsString()
  integrationMode?: string

  @ApiPropertyOptional({ description: '额度配置' })
  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(0)
  creditLimit?: number

  @ApiPropertyOptional({ description: 'API配置' })
  @IsOptional()
  @IsObject()
  apiConfig?: Record<string, unknown>

  @ApiPropertyOptional({ description: '审批规则配置' })
  @IsOptional()
  @IsObject()
  approvalRules?: Record<string, unknown>

  @ApiPropertyOptional({ description: '优先级' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(0)
  priority?: number

  @ApiPropertyOptional({ description: '状态' })
  @IsOptional()
  @IsString()
  status?: string
}


export class UpdateFunderDto extends PartialType(CreateFunderDto) {}


export class FunderQueryDto extends OrgScopedQueryDto {
  @ApiPropertyOptional({ description: '资方名称，模糊查询' })
  @IsOptional()
  @IsString()
  name?: string

  @ApiPropertyOptional({ description: '资方编码，模糊查询' })
  @IsOptional()
  @IsString()
  code?: string

  @ApiPropertyOptional({ description: '资方类型' })
  @IsOptional()
  @IsString()
  funderType?: string

  @ApiPropertyOptional({ description: '状态' })
  @IsOptional()
  @IsString()
  status?: string
}

