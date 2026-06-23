import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import { IsArray, IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator'

export class CreateMenuDto {
  @ApiPropertyOptional({ description: '父级菜单 ID' })
  @IsOptional()
  @IsInt()
  parentId?: number | null

  @ApiProperty({ description: '路由地址', example: '/system' })
  @IsString()
  @IsNotEmpty()
  path!: string

  @ApiProperty({ description: '唯一路由名称', example: 'System' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name!: string

  @ApiPropertyOptional({ description: '组件路径', example: '/index/index' })
  @IsOptional()
  @IsString()
  component?: string

  @ApiProperty({ description: '菜单标题或国际化标识', example: 'menus.system.title' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title!: string

  @ApiPropertyOptional({ description: '图标名称', example: 'ri:user-line' })
  @IsOptional()
  @IsString()
  icon?: string

  @ApiPropertyOptional({ description: '排序值', example: 10 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sort?: number

  @ApiPropertyOptional({ description: '是否缓存页面' })
  @IsOptional()
  @IsBoolean()
  keepAlive?: boolean

  @ApiPropertyOptional({ description: '是否隐藏菜单' })
  @IsOptional()
  @IsBoolean()
  hidden?: boolean

  @ApiPropertyOptional({ description: '是否隐藏标签页' })
  @IsOptional()
  @IsBoolean()
  hiddenTab?: boolean

  @ApiPropertyOptional({ description: '外部链接' })
  @IsOptional()
  @IsString()
  link?: string

  @ApiPropertyOptional({ description: '是否以内嵌 iframe 打开' })
  @IsOptional()
  @IsBoolean()
  iframe?: boolean

  @ApiPropertyOptional({ description: '绑定到该菜单的角色编码' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roleCodes?: string[]
}

export class UpdateMenuDto extends PartialType(CreateMenuDto) {}

export class CreatePermissionDto {
  @ApiProperty({ description: '权限名称', example: '新增' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  title!: string

  @ApiProperty({ description: '权限标识', example: 'add' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  authMark!: string

  @ApiPropertyOptional({ description: '绑定到该权限的角色编码' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roleCodes?: string[]
}

export class UpdatePermissionDto extends PartialType(CreatePermissionDto) {}
