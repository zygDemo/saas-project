import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'
import { FlowConfigController } from './flow-config.controller'
import { FlowConfigService } from './flow-config.service'

@Module({
  imports: [PrismaModule],
  controllers: [FlowConfigController],
  providers: [FlowConfigService],
  exports: [FlowConfigService]
})
export class FlowConfigModule {}
