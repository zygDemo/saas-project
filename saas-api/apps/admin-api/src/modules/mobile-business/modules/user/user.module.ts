import { Module } from '@nestjs/common'
import { OcrModule } from '../../../ocr/ocr.module'
import { MobileUserController } from './user.controller'
import { MobileCustomerService } from '../../mobile-customer.service'
import { MobileFileModule } from '../file/file.module'

@Module({
  imports: [MobileFileModule, OcrModule],
  controllers: [MobileUserController],
  providers: [MobileCustomerService],
  exports: [MobileCustomerService]
})
export class MobileUserModule {}
