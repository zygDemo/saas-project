import { Module } from '@nestjs/common'
import { MobileBankCardController } from './bank-card.controller'
import { MobileBankCardService } from '../../mobile-bank-card.service'

@Module({
  controllers: [MobileBankCardController],
  providers: [MobileBankCardService],
  exports: [MobileBankCardService]
})
export class MobileBankCardModule {}
