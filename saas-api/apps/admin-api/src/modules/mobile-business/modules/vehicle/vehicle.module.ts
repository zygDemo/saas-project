import { Module } from '@nestjs/common'
import { OcrModule } from '../../../ocr/ocr.module'
import { MobileVehicleController } from './vehicle.controller'
import { MobileVehicleService } from '../../mobile-vehicle.service'
import { MobileFileModule } from '../file/file.module'

@Module({
  imports: [MobileFileModule, OcrModule],
  controllers: [MobileVehicleController],
  providers: [MobileVehicleService],
  exports: [MobileVehicleService]
})
export class MobileVehicleModule {}
