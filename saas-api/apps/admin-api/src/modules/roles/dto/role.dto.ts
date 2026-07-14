import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import { IsArray, IsBoolean, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'

const DATA_SCOPE_OPTIONS = ['ALL', 'DEPT', 'SELF', 'CUSTOM'] as const

export class CreateRoleDto {
  @ApiProperty({ description: '角色名称', example: '运营人员' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(30)
  roleName!: string

  @ApiProperty({ description: '角色编码', example: 'R_OPERATOR' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  roleCode!: string

  @ApiPropertyOptional({ description: '角色描述' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string

  @ApiPropertyOptional({ description: '是否启用角色', example: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean

  @ApiPropertyOptional({ description: '数据范围：ALL=全部, DEPT=本部门及下级, SELF=仅自己, CUSTOM=自定义部门', enum: DATA_SCOPE_OPTIONS, default: 'ALL' })
  @IsOptional()
  @IsString()
  @IsIn(DATA_SCOPE_OPTIONS)
  dataScope?: string

  @ApiPropertyOptional({ description: '自定义数据范围的部门 ID 列表（仅 dataScope=CUSTOM 时生效）', example: [1, 2, 3] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  departmentIds?: number[]
}

export class UpdateRoleDto extends PartialType(CreateRoleDto) {}

export class RoleQueryDto {
  @ApiPropertyOptional({ description: '角色 ID' })
  @IsOptional()
  @IsString()
  roleId?: string

  @ApiPropertyOptional({ description: '角色名称（模糊搜索）' })
  @IsOptional()
  @IsString()
  roleName?: string

  @ApiPropertyOptional({ description: '角色编码（模糊搜索）' })
  @IsOptional()
  @IsString()
  roleCode?: string

  @ApiPropertyOptional({ description: '描述（模糊搜索）' })
  @IsOptional()
  @IsString()
  description?: string

  @ApiPropertyOptional({ description: '是否启用' })
  @IsOptional()
  @IsString()
  enabled?: string

  @ApiPropertyOptional({ description: '创建开始时间' })
  @IsOptional()
  @IsString()
  startTime?: string

  @ApiPropertyOptional({ description: '创建结束时间' })
  @IsOptional()
  @IsString()
  endTime?: string

  @ApiPropertyOptional({ description: '当前页码' })
  current?: string | number

  @ApiPropertyOptional({ description: '每页条数' })
  size?: string | number
}

export class SaveRolePermissionDto {
  @ApiPropertyOptional({ description: '分配给角色的菜单 ID 列表', example: [1, 2, 3] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  menuIds?: number[]

  @ApiPropertyOptional({ description: '分配给角色的权限 ID 列表', example: [1, 2, 3] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  permissionIds?: number[]
}
