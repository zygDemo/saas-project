import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'
import { DataCenterController } from './data-center.controller'
import { DataCenterService } from './data-center.service'

@Module({
  imports: [PrismaModule],
  controllers: [DataCenterController],
  providers: [DataCenterService],
  exports: [DataCenterService]
})
export class DataCenterModule {}
