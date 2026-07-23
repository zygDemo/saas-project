import { Module } from '@nestjs/common'
import {
  MobileCreditController,
  MobileEnumController,
  MobileStatisticsController
} from './credit.controller'
import { MobileCreditService } from '../../mobile-credit.service'
import { MobileFileModule } from '../file/file.module'

@Module({
  imports: [MobileFileModule],
  controllers: [MobileCreditController, MobileEnumController, MobileStatisticsController],
  providers: [MobileCreditService],
  exports: [MobileCreditService]
})
export class MobileCreditModule {}
