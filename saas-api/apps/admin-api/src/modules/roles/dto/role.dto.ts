import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'

export class CreateRoleDto {
  @ApiProperty({ description: 'Role name', example: 'Operator' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(30)
  roleName!: string

  @ApiProperty({ description: 'Role code', example: 'R_OPERATOR' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  roleCode!: string

  @ApiPropertyOptional({ description: 'Role description' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string

  @ApiPropertyOptional({ description: 'Whether role is enabled', example: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean
}

export class UpdateRoleDto extends PartialType(CreateRoleDto) {}

export class SaveRolePermissionDto {
  @ApiPropertyOptional({ description: 'Menu ids assigned to role', example: [1, 2, 3] })
  @IsOptional()
  @IsArray()
  menuIds?: number[]

  @ApiPropertyOptional({ description: 'Permission ids assigned to role', example: [1, 2, 3] })
  @IsOptional()
  @IsArray()
  permissionIds?: number[]
}
