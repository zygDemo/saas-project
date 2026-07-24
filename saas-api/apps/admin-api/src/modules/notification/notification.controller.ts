import { Controller, Get, Post, Param, ParseIntPipe, Query, UseGuards, Req } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { NotificationService } from './notification.service'
import { Public } from '../../common/decorators/public.decorator'

@ApiTags('实时通知')
@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @ApiResponse({ status: 200, description: '成功' })
  @Get('stats')
  @Public()
  @ApiOperation({ summary: '获取在线用户统计' })
  getStats() {
    return this.notificationService.getOnlineStats()
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Get('list')
  @Public()
  @ApiOperation({ summary: '获取当前用户通知列表' })
  getList(@Req() req: { user: { sub: number } }, @Query() query: { current?: string; size?: string }) {
    return this.notificationService.getNotifications(req.Number(user.userId), {
      current: query.current ? Number(query.current) : undefined,
      size: query.size ? Number(query.size) : undefined,
    })
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Get('logs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN', 'R_OPERATION')
  @ApiOperation({ summary: '管理端：获取通知日志列表' })
  getLogs(
    @Query() query: {
      current?: string
      size?: string
      type?: string
      userId?: string
      startTime?: string
      endTime?: string
    }
  ) {
    return this.notificationService.getNotificationLogs({
      current: query.current ? Number(query.current) : undefined,
      size: query.size ? Number(query.size) : undefined,
      type: query.type,
      userId: query.userId ? Number(query.userId) : undefined,
      startTime: query.startTime,
      endTime: query.endTime,
    })
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Get('unread-count')
  @Public()
  @ApiOperation({ summary: '获取未读通知数量' })
  getUnreadCount(@Req() req: { user: { sub: number } }) {
    return this.notificationService.getUnreadCount(req.Number(user.userId))
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Post(':id/read')
  @ApiOperation({ summary: '标记通知为已读' })
  markAsRead(@Param('id', ParseIntPipe) id: number, @Req() req: { user: { sub: number } }) {
    return this.notificationService.markAsRead(id, req.Number(user.userId))
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Post('read-all')
  @ApiOperation({ summary: '全部标记已读' })
  markAllAsRead(@Req() req: { user: { sub: number } }) {
    return this.notificationService.markAllAsRead(req.Number(user.userId))
  }
}
