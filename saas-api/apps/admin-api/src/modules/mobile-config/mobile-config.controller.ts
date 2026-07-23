import { Body, Controller, Get, Param, ParseIntPipe, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequestUser } from '../../common/types/request-user';
import { Roles } from '../../common/decorators/roles.decorator';
import { SaveEntityMobileConfigDto, UpdateMobileConfigDto } from './dto/mobile-config.dto';
import { MobileConfigService } from './mobile-config.service';
import { Public } from '../../common/decorators/public.decorator'

@ApiTags('移动端模块配置')
@Controller('mobile-config')
export class MobileConfigController {
  constructor(private readonly service: MobileConfigService) {}

  @Get('resolved')
  @Public()
  @ApiOperation({ summary: '获取当前用户的移动端模块配置（三级优先级解析）' })
  getResolvedConfig(@CurrentUser() user: RequestUser) {
    return this.service.getResolvedConfig(user.sub, user.tenantId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
  @ApiOperation({ summary: '获取当前租户的移动端模块配置（管理端使用）' })
  getConfig(@CurrentUser() user: RequestUser) {
    return this.service.getConfig(user.tenantId);
  }

  @Put()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
  @ApiOperation({ summary: '更新当前租户的移动端模块配置' })
  updateConfig(@Body() dto: UpdateMobileConfigDto, @CurrentUser() user: RequestUser) {
    return this.service.updateConfig(dto, user.tenantId);
  }

  @Get('role/:roleId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
  @ApiOperation({ summary: '获取指定角色的移动端模块配置' })
  getRoleConfig(@Param('roleId', ParseIntPipe) roleId: number) {
    return this.service.getRoleConfig(roleId);
  }

  @Put('role/:roleId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
  @ApiOperation({ summary: '更新指定角色的移动端模块配置' })
  updateRoleConfig(
    @Param('roleId', ParseIntPipe) roleId: number,
    @Body() dto: SaveEntityMobileConfigDto,
  ) {
    return this.service.updateRoleConfig(roleId, dto);
  }

  @Put('role/:roleId/reset')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
  @ApiOperation({ summary: '重置角色级配置（恢复使用租户级）' })
  resetRoleConfig(@Param('roleId', ParseIntPipe) roleId: number) {
    return this.service.resetRoleConfig(roleId);
  }

  @Get('user/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
  @ApiOperation({ summary: '获取指定用户的移动端模块配置' })
  getUserConfig(@Param('userId', ParseIntPipe) userId: number) {
    return this.service.getUserConfig(userId);
  }

  @Put('user/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
  @ApiOperation({ summary: '更新指定用户的移动端模块配置' })
  updateUserConfig(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: SaveEntityMobileConfigDto,
  ) {
    return this.service.updateUserConfig(userId, dto);
  }

  @Put('user/:userId/reset')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
  @ApiOperation({ summary: '重置用户级配置（恢复使用角色/租户级）' })
  resetUserConfig(@Param('userId', ParseIntPipe) userId: number) {
    return this.service.resetUserConfig(userId);
  }
}
