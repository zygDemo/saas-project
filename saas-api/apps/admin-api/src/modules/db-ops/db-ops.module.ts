import { Module } from '@nestjs/common'
import { DbOpsController } from './db-ops.controller'
import { DbOpsService } from './db-ops.service'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [DbOpsController],
  providers: [DbOpsService],
  exports: [DbOpsService]
})
export class DbOpsModule {}