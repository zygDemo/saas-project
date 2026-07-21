import { Controller, Get, UseGuards } from '@nestjs/common'
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
}
