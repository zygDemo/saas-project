import { Module } from '@nestjs/common'
import { OcrModule } from '../ocr/ocr.module'
import { ProductModule } from '../product/product.module'
import { DictModule } from '../dict/dict.module'
import {
  MobileCreditController,
  MobileEnumController,
  MobileFileController,
  MobileStatisticsController,
  MobileUserController,
  MobileVehicleController
} from './mobile-business.controller'
import { MobileBusinessService } from './mobile-business.service'

@Module({
  imports: [OcrModule, ProductModule, DictModule],
  controllers: [
    MobileFileController,
    MobileUserController,
    MobileVehicleController,
    MobileCreditController,
    MobileEnumController,
    MobileStatisticsController
  ],
  providers: [MobileBusinessService]
})
export class MobileBusinessModule {}
