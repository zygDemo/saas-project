import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import { IsArray, IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator'

export class CreateMenuDto {
  @ApiPropertyOptional({ description: 'Parent menu id' })
  @IsOptional()
  @IsInt()
  parentId?: number | null

  @ApiProperty({ description: 'Route path', example: '/system' })
  @IsString()
  @IsNotEmpty()
  path!: string

  @ApiProperty({ description: 'Unique route name', example: 'System' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name!: string

  @ApiPropertyOptional({ description: 'Component path', example: '/index/index' })
  @IsOptional()
  @IsString()
  component?: string

  @ApiProperty({ description: 'Route title or i18n key', example: 'menus.system.title' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title!: string

  @ApiPropertyOptional({ description: 'Icon name', example: 'ri:user-line' })
  @IsOptional()
  @IsString()
  icon?: string

  @ApiPropertyOptional({ description: 'Sort value', example: 10 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sort?: number

  @ApiPropertyOptional({ description: 'Keep page alive' })
  @IsOptional()
  @IsBoolean()
  keepAlive?: boolean

  @ApiPropertyOptional({ description: 'Hide menu' })
  @IsOptional()
  @IsBoolean()
  hidden?: boolean

  @ApiPropertyOptional({ description: 'Hide tab' })
  @IsOptional()
  @IsBoolean()
  hiddenTab?: boolean

  @ApiPropertyOptional({ description: 'External link' })
  @IsOptional()
  @IsString()
  link?: string

  @ApiPropertyOptional({ description: 'Whether link opens in iframe' })
  @IsOptional()
  @IsBoolean()
  iframe?: boolean

  @ApiPropertyOptional({ description: 'Role codes assigned to this menu' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roleCodes?: string[]
}

export class UpdateMenuDto extends PartialType(CreateMenuDto) {}

export class CreatePermissionDto {
  @ApiProperty({ description: 'Permission title', example: 'Add' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  title!: string

  @ApiProperty({ description: 'Permission mark', example: 'add' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  authMark!: string

  @ApiPropertyOptional({ description: 'Role codes assigned to this permission' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roleCodes?: string[]
}

export class UpdatePermissionDto extends PartialType(CreatePermissionDto) {}
