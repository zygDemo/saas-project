import { Controller, Get, Post, Param, ParseIntPipe, Query, UseGuards, Req } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { NotificationService } from './notification.service'

@ApiTags('实时通知')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('stats')
  @ApiOperation({ summary: '获取在线用户统计' })
  getStats() {
    return this.notificationService.getOnlineStats()
  }

  @Get('list')
  @ApiOperation({ summary: '获取当前用户通知列表' })
  getList(@Req() req: { user: { sub: number } }, @Query() query: { current?: string; size?: string }) {
    return this.notificationService.getNotifications(req.user.sub, {
      current: query.current ? Number(query.current) : undefined,
      size: query.size ? Number(query.size) : undefined,
    })
  }

  @Get('unread-count')
  @ApiOperation({ summary: '获取未读通知数量' })
  getUnreadCount(@Req() req: { user: { sub: number } }) {
    return this.notificationService.getUnreadCount(req.user.sub)
  }

  @Post(':id/read')
  @ApiOperation({ summary: '标记通知为已读' })
  markAsRead(@Param('id', ParseIntPipe) id: number, @Req() req: { user: { sub: number } }) {
    return this.notificationService.markAsRead(id, req.user.sub)
  }

  @Post('read-all')
  @ApiOperation({ summary: '全部标记已读' })
  markAllAsRead(@Req() req: { user: { sub: number } }) {
    return this.notificationService.markAllAsRead(req.user.sub)
  }
}
