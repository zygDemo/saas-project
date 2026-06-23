import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator'
import { Type } from 'class-transformer'

const STATUS_VALUES = ['ACTIVE', 'INACTIVE'] as const

export class CreateDictTypeDto {
  @ApiProperty({ description: '字典名称', example: '客户来源' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name!: string

  @ApiProperty({ description: '字典编码', example: 'lead_source' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  code!: string

  @ApiPropertyOptional({ description: '状态', enum: STATUS_VALUES, example: 'ACTIVE' })
  @IsOptional()
  @IsIn(STATUS_VALUES)
  status?: string

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  remark?: string
}

export class UpdateDictTypeDto extends PartialType(CreateDictTypeDto) {}

export class CreateDictDataDto {
  @ApiProperty({ description: '字典类型 ID' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  typeId!: number

  @ApiProperty({ description: '字典标签', example: '自拓' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  label!: string

  @ApiProperty({ description: '字典值', example: 'SELF' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  value!: string

  @ApiPropertyOptional({ description: '排序' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sort?: number

  @ApiPropertyOptional({ description: '状态', enum: STATUS_VALUES, example: 'ACTIVE' })
  @IsOptional()
  @IsIn(STATUS_VALUES)
  status?: string

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  remark?: string
}

export class UpdateDictDataDto extends PartialType(CreateDictDataDto) {}
