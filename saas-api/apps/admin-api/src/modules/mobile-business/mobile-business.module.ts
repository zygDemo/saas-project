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
  MobileVehicleController,
  MobileContactController,
  MobileSalesLeadController,
  MobileFollowUpController,
  MobileSigningController,
  MobileBankCardController,
  MobilePostLoanController
} from './mobile-business.controller'
import { MobileBusinessService } from './mobile-business.service'
import { MobileFileService } from './mobile-file.service'
import { MobileCustomerService } from './mobile-customer.service'
import { MobileVehicleService } from './mobile-vehicle.service'
import { MobileCreditService } from './mobile-credit.service'
import { MobileContactService } from './mobile-contact.service'
import { MobileLeadService } from './mobile-lead.service'
import { MobileSigningService } from './mobile-signing.service'
import { MobileBankCardService } from './mobile-bank-card.service'
import { MobilePostLoanService } from './mobile-post-loan.service'

@Module({
  imports: [OcrModule, ProductModule, DictModule],
  controllers: [
    MobileFileController,
    MobileUserController,
    MobileVehicleController,
    MobileCreditController,
    MobileEnumController,
    MobileStatisticsController,
    MobileContactController,
    MobileSalesLeadController,
    MobileFollowUpController,
    MobileSigningController,
    MobileBankCardController,
    MobilePostLoanController
  ],
  providers: [
    MobileFileService,
    MobileCustomerService,
    MobileVehicleService,
    MobileCreditService,
    MobileContactService,
    MobileLeadService,
    MobileSigningService,
    MobileBankCardService,
    MobilePostLoanService,
    MobileBusinessService
  ],
  exports: [MobileBusinessService]
})
export class MobileBusinessModule {}
