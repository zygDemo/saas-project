import { Body, Controller, HttpCode, Post } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { ApiTenantHeader } from '../../common/decorators/tenant-header.decorator'
import { AuthService } from './auth.service'
import { LoginDto } from './dto/login.dto'

@ApiTags('认证管理')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  @ApiTenantHeader()
  @ApiOperation({
    summary: '用户登录',
    description: '使用用户名、密码和租户 ID 登录系统'
  })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto)
  }
}
