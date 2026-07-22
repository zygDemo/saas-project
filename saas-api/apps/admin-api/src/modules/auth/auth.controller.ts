import { Body, Controller, HttpCode, Post } from '@nestjs/common'
import { ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger'
import { Public } from '../../common/decorators/public.decorator'
import { ApiTenantHeader } from '../../common/decorators/tenant-header.decorator'
import { AuthService } from './auth.service'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'
import { SendEmailCodeDto } from './dto/send-code.dto'
import { EmailLoginDto } from './dto/email-login.dto'

@ApiTags('认证管理')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @ApiResponse({ status: 200, description: '成功' })
  @Post('login')
  @HttpCode(200)
  @ApiTenantHeader()
  @ApiOperation({ summary: '用户名密码登录' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto)
  }

  @Public()
  @ApiResponse({ status: 200, description: '成功' })
  @Post('register')
  @ApiTenantHeader()
  @ApiOperation({ summary: '用户注册' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto)
  }

  @Public()
  @ApiResponse({ status: 200, description: '成功' })
  @Post('email/send-code')
  @HttpCode(200)
  @ApiTenantHeader()
  @ApiOperation({ summary: '发送邮箱验证码' })
  sendEmailCode(@Body() dto: SendEmailCodeDto) {
    return this.authService.sendEmailCode(dto.email, dto.type)
  }

  @Public()
  @ApiResponse({ status: 200, description: '成功' })
  @Post('email/login')
  @HttpCode(200)
  @ApiTenantHeader()
  @ApiOperation({ summary: '邮箱验证码登录', description: '未注册用户自动创建' })
  emailLogin(@Body() dto: EmailLoginDto) {
    return this.authService.emailLogin(dto.email, dto.code)
  }
}
