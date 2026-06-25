import { RequestUser } from '../../common/types/request-user'
import { Body, Controller, Get, HttpException, HttpStatus, Logger, Param, Post, Request, UseGuards } from '@nestjs/common'
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CrawlerService } from './crawler.service'
import { FanqieCrawlerService } from './fanqie-crawler.service'
import { DownloadNovelDto } from './dto/download-novel.dto'
import { DownloadFanqieDto } from './dto/download-fanqie.dto'

@ApiTags('爬虫模块')
@Controller('crawler')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CrawlerController {
  private readonly logger = new Logger(CrawlerController.name)
  constructor(
    private readonly crawlerService: CrawlerService,
    private readonly fanqieCrawlerService: FanqieCrawlerService,
  ) {}

  @Post('download')
  @ApiOperation({ summary: '下载小说并入库（同步）' })
  async downloadNovel(@Request() req: RequestUser, @Body() dto: DownloadNovelDto) {
    return this.crawlerService.downloadNovel(
      req.tenantId,
      dto.url,
      dto.name,
      dto.startChapter,
      dto.endChapter,
      dto.categoryId,
      undefined,
      { cookie: dto.cookie, userAgent: dto.userAgent }
    )
  }

  @Post('download-async')
  @ApiOperation({ summary: '异步下载小说并入库（返回taskId）' })
  async downloadNovelAsync(@Request() req: RequestUser, @Body() dto: DownloadNovelDto) {
    const taskId = `crawl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    // 异步执行，不 await
    this.crawlerService
      .downloadNovel(
        req.tenantId,
        dto.url,
        dto.name,
        dto.startChapter,
        dto.endChapter,
        dto.categoryId,
        taskId,
        { cookie: dto.cookie, userAgent: dto.userAgent }
      )
      .catch((err) => this.logger.error(`爬虫任务 ${taskId} 异常`, err?.stack || err))
    return { taskId }
  }

  @Get('progress/:taskId')
  @ApiOperation({ summary: '获取爬取进度' })
  getProgress(@Param('taskId') taskId: string) {
    const progress = this.crawlerService.getProgress(taskId)
    if (!progress) {
      throw new HttpException('任务不存在', HttpStatus.NOT_FOUND)
    }
    if (progress.status === 'error') {
      throw new HttpException(progress.message || '爬取任务失败', HttpStatus.BAD_REQUEST)
    }
    return progress
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

  @Post('clear/:taskId')
  @ApiOperation({ summary: '清除任务记录（清理失败/已完成/已取消的任务）' })
  clearTask(@Param('taskId') taskId: string) {
    const success = this.crawlerService.clearTask(taskId)
    return { success, message: success ? '任务已清除' : '任务不存在' }
  }

  // ===== 番茄小说 =====

  @Post('fanqie')
  @ApiOperation({ summary: '番茄小说同步下载' })
  async downloadFanqie(@Request() req: RequestUser, @Body() dto: DownloadFanqieDto) {
    return this.fanqieCrawlerService.downloadNovel(
      req.tenantId, dto.url, dto.name, dto.startChapter, dto.endChapter, dto.categoryId,
    )
  }

  @Post('fanqie-async')
  @ApiOperation({ summary: '番茄小说异步下载' })
  async downloadFanqieAsync(@Request() req: RequestUser, @Body() dto: DownloadFanqieDto) {
    const taskId = `fanqie_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    this.fanqieCrawlerService
      .downloadNovel(req.tenantId, dto.url, dto.name, dto.startChapter, dto.endChapter, dto.categoryId, taskId)
      .catch((err) => this.logger.error(`番茄任务${taskId}异常`, err?.stack || err))
    return { taskId }
  }

  @Get('fanqie-progress/:taskId')
  @ApiOperation({ summary: '番茄小说下载进度' })
  getFanqieProgress(@Param('taskId') taskId: string) {
    const progress = this.fanqieCrawlerService.getProgress(taskId)
    if (!progress) {
      throw new HttpException('任务不存在', HttpStatus.NOT_FOUND)
    }
    if (progress.status === 'error') {
      throw new HttpException(progress.message || '爬取任务失败', HttpStatus.BAD_REQUEST)
    }
    return progress
  }

  @Post('fanqie-pause/:taskId')
  @ApiOperation({ summary: '暂停番茄任务' })
  pauseFanqie(@Param('taskId') taskId: string) {
    const ok = this.fanqieCrawlerService.pauseTask(taskId)
    return { success: ok, message: ok ? '已暂停' : '任务不存在' }
  }

  @Post('fanqie-resume/:taskId')
  @ApiOperation({ summary: '恢复番茄任务' })
  resumeFanqie(@Param('taskId') taskId: string) {
    const ok = this.fanqieCrawlerService.resumeTask(taskId)
    return { success: ok, message: ok ? '已恢复' : '任务不存在' }
  }

  @Post('fanqie-cancel/:taskId')
  @ApiOperation({ summary: '取消番茄任务' })
  cancelFanqie(@Param('taskId') taskId: string) {
    const ok = this.fanqieCrawlerService.cancelTask(taskId)
    return { success: ok, message: ok ? '已取消' : '任务不存在' }
  }

  @Post('fanqie-clear/:taskId')
  @ApiOperation({ summary: '清除番茄任务记录' })
  clearFanqie(@Param('taskId') taskId: string) {
    const ok = this.fanqieCrawlerService.clearTask(taskId)
    return { success: ok, message: ok ? '已清除' : '任务不存在' }
  }
}