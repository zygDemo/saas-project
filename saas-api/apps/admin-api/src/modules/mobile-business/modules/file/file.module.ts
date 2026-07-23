import { Module } from '@nestjs/common'
import { MobileFileController } from './file.controller'
import { MobileFileService } from '../../mobile-file.service'

@Module({
  controllers: [MobileFileController],
  providers: [MobileFileService],
  exports: [MobileFileService]
})
export class MobileFileModule {}
