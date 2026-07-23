import { Module } from '@nestjs/common'
import { MobilePostLoanController } from './post-loan.controller'
import { MobilePostLoanService } from '../../mobile-post-loan.service'

@Module({
  controllers: [MobilePostLoanController],
  providers: [MobilePostLoanService],
  exports: [MobilePostLoanService]
})
export class MobilePostLoanModule {}
