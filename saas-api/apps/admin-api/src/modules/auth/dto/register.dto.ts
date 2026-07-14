import { ApiProperty } from '@nestjs/swagger'
import { IsString, MinLength, MaxLength } from 'class-validator'

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
}
