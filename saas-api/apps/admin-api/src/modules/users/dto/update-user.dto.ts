import { PartialType } from '@nestjs/mapped-types'
import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsArray, IsOptional, IsString } from 'class-validator'
import { CreateUserDto } from './create-user.dto'

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({ description: '密码，不传则保持不变' })
  @IsOptional()
  @IsString()
  password?: string

  @ApiPropertyOptional({ description: '角色编码列表' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roleCodes?: string[]
}
