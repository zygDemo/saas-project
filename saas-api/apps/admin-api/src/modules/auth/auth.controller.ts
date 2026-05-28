import { Body, Controller, Post } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { ApiTenantHeader } from '../../common/decorators/tenant-header.decorator'
import { AuthService } from './auth.service'
import { LoginDto } from './dto/login.dto'

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiTenantHeader()
  @ApiOperation({
    summary: 'Login',
    description: 'Login with userName, password, and X-Tenant-ID header.'
  })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto)
  }
}
