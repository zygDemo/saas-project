import { Module } from '@nestjs/common'
import { FlowConfigModule } from '../flow-config/flow-config.module'
import { ApplicationController } from './application.controller'
import { ApplicationService } from './application.service'

@Module({
  imports: [FlowConfigModule],
  controllers: [ApplicationController],
  providers: [ApplicationService],
  exports: [ApplicationService]
})
export class ApplicationModule {}
