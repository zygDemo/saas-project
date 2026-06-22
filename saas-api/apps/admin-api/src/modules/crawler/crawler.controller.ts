import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common'
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CrawlerService } from './crawler.service'
import { DownloadNovelDto } from './dto/download-novel.dto'

@ApiTags('爬虫模块')
@Controller('crawler')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CrawlerController {
  constructor(private readonly crawlerService: CrawlerService) {}

  @Post('download')
  @ApiOperation({ summary: '下载小说并入库（同步）' })
  async downloadNovel(@Request() req: any, @Body() dto: DownloadNovelDto) {
    return this.crawlerService.downloadNovel(
      req.user.tenantId,
      dto.url,
      dto.name,
      dto.startChapter,
      dto.endChapter,
      dto.categoryId
    )
  }

  @Post('download-async')
  @ApiOperation({ summary: '异步下载小说并入库（返回taskId）' })
  async downloadNovelAsync(@Request() req: any, @Body() dto: DownloadNovelDto) {
    const taskId = `crawl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    // 异步执行，不 await
    this.crawlerService
      .downloadNovel(
        req.user.tenantId,
        dto.url,
        dto.name,
        dto.startChapter,
        dto.endChapter,
        dto.categoryId,
        taskId
      )
      .catch(() => {})
    return { taskId }
  }

  @Get('progress/:taskId')
  @ApiOperation({ summary: '获取爬取进度' })
  getProgress(@Param('taskId') taskId: string) {
    return this.crawlerService.getProgress(taskId)
  }

  @Post('pause/:taskId')
  @ApiOperation({ summary: '暂停爬取任务' })
  pauseTask(@Param('taskId') taskId: string) {
    const success = this.crawlerService.pauseTask(taskId)
    return { success, message: success ? '任务已暂停' : '任务不存在或不在运行中' }
  }

  @Post('resume/:taskId')
  @ApiOperation({ summary: '恢复爬取任务' })
  resumeTask(@Param('taskId') taskId: string) {
    const success = this.crawlerService.resumeTask(taskId)
    return { success, message: success ? '任务已恢复' : '任务不存在或未暂停' }
  }

  @Post('cancel/:taskId')
  @ApiOperation({ summary: '取消爬取任务' })
  cancelTask(@Param('taskId') taskId: string) {
    const success = this.crawlerService.cancelTask(taskId)
    return { success, message: success ? '任务已取消' : '任务不存在或已完成' }
  }
}
