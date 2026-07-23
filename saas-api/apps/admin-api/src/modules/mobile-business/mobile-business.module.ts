import { Module } from '@nestjs/common'
import { OcrModule } from '../ocr/ocr.module'
import { MobileBankCardModule } from './modules/bank-card/bank-card.module'
import { MobileContactModule } from './modules/contact/contact.module'
import { MobileCreditModule } from './modules/credit/credit.module'
import { MobileFileModule } from './modules/file/file.module'
import { MobileLeadModule } from './modules/lead/lead.module'
import { MobilePostLoanModule } from './modules/post-loan/post-loan.module'
import { MobileSigningModule } from './modules/signing/signing.module'
import { MobileUserModule } from './modules/user/user.module'
import { MobileVehicleModule } from './modules/vehicle/vehicle.module'
import { MobileBusinessService } from './mobile-business.service'

@Module({
  imports: [
    OcrModule,
    MobileFileModule,
    MobileUserModule,
    MobileVehicleModule,
    MobileCreditModule,
    MobileContactModule,
    MobileLeadModule,
    MobileSigningModule,
    MobileBankCardModule,
    MobilePostLoanModule
  ],
  providers: [MobileBusinessService],
  exports: [MobileBusinessService]
})
export class MobileBusinessModule {}
