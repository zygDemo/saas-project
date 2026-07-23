import { Module } from '@nestjs/common'
import { MobileContactController } from './contact.controller'
import { MobileContactService } from '../../mobile-contact.service'

@Module({
  controllers: [MobileContactController],
  providers: [MobileContactService],
  exports: [MobileContactService]
})
export class MobileContactModule {}
