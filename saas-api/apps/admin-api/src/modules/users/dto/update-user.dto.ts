import { PartialType } from '@nestjs/mapped-types'
import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsArray, IsOptional, IsString } from 'class-validator'
import { CreateUserDto } from './create-user.dto'

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({ description: 'Password, keep unchanged when omitted' })
  @IsOptional()
  @IsString()
  password?: string

  @ApiPropertyOptional({ description: 'Role code list' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roleCodes?: string[]
}
