import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import { IsArray, IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'

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
}

export class UpdateRoleDto extends PartialType(CreateRoleDto) {}

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
