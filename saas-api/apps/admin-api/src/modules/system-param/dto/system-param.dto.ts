import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator'

const PARAM_TYPE = ['STRING', 'NUMBER', 'BOOLEAN', 'JSON'] as const
const STATUS_VALUES = ['ACTIVE', 'INACTIVE'] as const

export class CreateSystemParamDto {
  @ApiPropertyOptional({ description: '参数分组', example: 'basic' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  group?: string

  @ApiProperty({ description: '参数名称', example: '系统名称' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string

  @ApiProperty({ description: '参数键', example: 'sys.name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  key!: string

  @ApiPropertyOptional({ description: '参数值', example: '车贷SaaS平台' })
  @IsOptional()
  @IsString()
  value?: string

  @ApiPropertyOptional({ description: '值类型', enum: PARAM_TYPE, example: 'STRING' })
  @IsOptional()
  @IsIn(PARAM_TYPE)
  type?: string

  @ApiPropertyOptional({ description: '状态', enum: STATUS_VALUES, example: 'ACTIVE' })
  @IsOptional()
  @IsIn(STATUS_VALUES)
  status?: string

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remark?: string
}

export class UpdateSystemParamDto extends PartialType(CreateSystemParamDto) {}
