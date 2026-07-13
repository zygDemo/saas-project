import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsArray, IsBoolean, IsOptional, IsString, ArrayNotEmpty } from 'class-validator'

export class UpdateMobileConfigDto {
  @ApiPropertyOptional({ description: '已启用的移动端模块列表', example: ['carloan', 'food'] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  mobileModules!: string[]

  @ApiPropertyOptional({ description: '默认模块 key（单模块模式）', example: 'carloan' })
  @IsOptional()
  @IsString()
  defaultMobileModule?: string
}

/** 角色/用户级移动端模块配置 */
export class SaveEntityMobileConfigDto {
  @ApiPropertyOptional({ description: '已启用的移动端模块列表', example: ['carloan', 'food'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mobileModules?: string[]

  @ApiPropertyOptional({ description: '是否支持多业务模块', example: true })
  @IsOptional()
  @IsBoolean()
  mobileMultiModule?: boolean

  @ApiPropertyOptional({ description: '默认模块 key（单模块/不支持多模块时生效）', example: 'carloan' })
  @IsOptional()
  @IsString()
  defaultMobileModule?: string
}
