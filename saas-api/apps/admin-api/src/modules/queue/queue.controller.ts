import { Controller, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { QueueService } from './queue.service'

@ApiTags('队列管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Post('health-check')
  @ApiOperation({ summary: '触发健康检查任务', description: '向消息队列中添加一个健康检查任务，用于异步检测系统各组件运行状态' })
  enqueueHealthCheck() {
    return this.queueService.enqueueHealthCheck()
  }
}
