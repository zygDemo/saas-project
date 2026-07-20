import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEmail, IsOptional, IsString, Length, MaxLength, MinLength } from 'class-validator'

export class RegisterDto {
  @ApiProperty({ description: '用户名', minLength: 3, maxLength: 20 })
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  userName: string

  @ApiProperty({ description: '密码', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string

  @ApiProperty({ description: '昵称' })
  @IsString()
  nickName: string

  @ApiPropertyOptional({ description: '邮箱' })
  @IsOptional()
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email?: string

  @ApiPropertyOptional({ description: '邮箱验证码' })
  @IsOptional()
  @IsString()
  @Length(6, 6, { message: '验证码为6位' })
  emailCode?: string
}
