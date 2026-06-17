import { Module } from '@nestjs/common'
import { FunderController } from './funder.controller'
import { FunderService } from './funder.service'

@Module({
  controllers: [FunderController],
  providers: [FunderService],
  exports: [FunderService]
})
export class FunderModule {}
