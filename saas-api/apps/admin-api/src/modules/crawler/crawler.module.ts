import { Module } from '@nestjs/common'
import { CrawlerController } from './crawler.controller'
import { CrawlerService } from './crawler.service'
import { FanqieCrawlerService } from './fanqie-crawler.service'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [CrawlerController],
  providers: [CrawlerService, FanqieCrawlerService],
  exports: [CrawlerService, FanqieCrawlerService],
})
export class CrawlerModule {}
