import { Module } from '@nestjs/common'
import { PlatformSupervisionController } from './platform-supervision.controller'
import { PlatformSupervisionService } from './platform-supervision.service'

@Module({
  controllers: [PlatformSupervisionController],
  providers: [PlatformSupervisionService],
  exports: [PlatformSupervisionService]
})
export class PlatformSupervisionModule {}
