import { Module } from '@nestjs/common'
import { ThirdPartyServiceController } from './third-party-service.controller'
import { ThirdPartyServiceService } from './third-party-service.service'

@Module({
  controllers: [ThirdPartyServiceController],
  providers: [ThirdPartyServiceService],
  exports: [ThirdPartyServiceService]
})
export class ThirdPartyServiceModule {}
