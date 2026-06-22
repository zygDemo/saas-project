import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common'
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
  @ApiOperation({ summary: '下载小说并入库' })
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
}
