import { Module } from '@nestjs/common'
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
