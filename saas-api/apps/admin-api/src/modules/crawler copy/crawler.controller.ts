import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CrawlerService } from './crawler.service';
import { DownloadNovelDto } from './dto/download-novel.dto';

@ApiTags('爬虫模块')
@Controller('crawler')
export class CrawlerController {
  constructor(private readonly crawlerService: CrawlerService) {}

  @ApiOperation({ summary: '下载book' })
  @Post('download')
  async downloadNovel(@Body() downloadNovelDto: DownloadNovelDto) {
    return this.crawlerService.downloadNovel(
      downloadNovelDto.url,
      downloadNovelDto.name,
      downloadNovelDto.startChapter,
      downloadNovelDto.endChapter,
    );
  }
}
