import { Module } from '@nestjs/common'
import { MobileSigningController } from './signing.controller'
import { MobileSigningService } from '../../mobile-signing.service'

@Module({
  controllers: [MobileSigningController],
  providers: [MobileSigningService],
  exports: [MobileSigningService]
})
export class MobileSigningModule {}
