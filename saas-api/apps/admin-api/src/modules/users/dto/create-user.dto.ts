import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength
} from 'class-validator'
import { Transform } from 'class-transformer'

function ToNumber() {
  return Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return undefined
    return Number(value)
  })
}

export class CreateUserDto {
  @ApiProperty({ description: '用户名', example: 'demo_user' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(20)
  userName!: string

  @ApiPropertyOptional({ description: '昵称', example: 'Demo User' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  nickName?: string

  @ApiProperty({ description: '密码', example: '123456' })
  @IsString()
  @MinLength(6)
  @MaxLength(32)
  password!: string

  @ApiProperty({ description: '邮箱', example: 'demo@example.com' })
  @IsEmail()
  email!: string

  @ApiPropertyOptional({ description: '手机号', example: '13800138000' })
  @IsOptional()
  @IsString()
  @Matches(/^1[3-9]\d{9}$/)
  phone?: string

  @ApiPropertyOptional({ description: '性别', example: '男' })
  @IsOptional()
  @IsString()
  gender?: string

  @ApiPropertyOptional({ description: '状态：1 在线，2 离线，3 异常，4 注销', example: '1' })
  @IsOptional()
  @IsIn(['1', '2', '3', '4'])
  status?: string

  @ApiPropertyOptional({ description: '所属部门ID' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  deptId?: number

  @ApiProperty({ description: '角色编码列表', example: ['R_USER'] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  roleCodes!: string[]
}
