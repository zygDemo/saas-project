import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RequestUser } from '../../common/types/request-user';
import { UpdateMobileConfigDto } from './dto/mobile-config.dto';
import { MobileConfigService } from './mobile-config.service';

@ApiTags('移动端模块配置')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('mobile-config')
export class MobileConfigController {
  constructor(private readonly service: MobileConfigService) {}

  @Get()
  @ApiOperation({ summary: '获取当前租户的移动端模块配置' })
  getConfig(@CurrentUser() user: RequestUser) {
    return this.service.getConfig(user.tenantId);
  }

  @Put()
  @ApiOperation({ summary: '更新当前租户的移动端模块配置' })
  updateConfig(@Body() dto: UpdateMobileConfigDto, @CurrentUser() user: RequestUser) {
    return this.service.updateConfig(dto, user.tenantId);
  }
}
