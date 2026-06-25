import { Module } from '@nestjs/common'
import { SystemParamController } from './system-param.controller'
import { SystemParamService } from './system-param.service'

@Module({
  controllers: [SystemParamController],
  providers: [SystemParamService],
  exports: [SystemParamService]
})
export class SystemParamModule {}
