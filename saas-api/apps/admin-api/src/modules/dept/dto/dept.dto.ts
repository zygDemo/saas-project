import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import { IsInt, IsOptional, IsString, Min } from 'class-validator'
import { OrgScopedQueryDto, ToNumber } from '../../common/dto/common.dto'

export class CreateDeptDto {
  @ApiProperty({ description: '机构ID' })
  @ToNumber()
  @IsInt()
  @Min(1)
  orgId: number

  @ApiPropertyOptional({ description: '父部门ID' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  parentId?: number

  @ApiProperty({ description: '部门名称' })
  @IsString()
  name: string

  @ApiPropertyOptional({ description: '部门负责人用户ID' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  managerId?: number

  @ApiPropertyOptional({ description: '排序' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(0)
  sort?: number
}


export class UpdateDeptDto extends PartialType(CreateDeptDto) {}


export class DeptQueryDto extends OrgScopedQueryDto {
  @ApiPropertyOptional({ description: '部门名称，模糊查询' })
  @IsOptional()
  @IsString()
  name?: string

  @ApiPropertyOptional({ description: '父部门ID' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  parentId?: number
}

