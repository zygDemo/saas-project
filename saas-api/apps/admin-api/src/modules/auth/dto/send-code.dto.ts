import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsOptional, IsString } from 'class-validator'

export class SendEmailCodeDto {
  @ApiProperty({ description: '邮箱地址', example: 'user@example.com' })
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email: string

  @ApiProperty({ description: '验证码类型', enum: ['login', 'register'], default: 'login' })
  @IsOptional()
  @IsString()
  type?: 'login' | 'register'
}
