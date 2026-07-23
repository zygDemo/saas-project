import { Module } from '@nestjs/common'
import { MobileFollowUpController, MobileSalesLeadController } from './lead.controller'
import { MobileLeadService } from '../../mobile-lead.service'

@Module({
  controllers: [MobileSalesLeadController, MobileFollowUpController],
  providers: [MobileLeadService],
  exports: [MobileLeadService]
})
export class MobileLeadModule {}
