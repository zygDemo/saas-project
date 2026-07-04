import { Module } from '@nestjs/common'
import { PackagePlanController } from './package-plan.controller'
import { PackagePlanService } from './package-plan.service'

@Module({
  controllers: [PackagePlanController],
  providers: [PackagePlanService],
  exports: [PackagePlanService]
})
export class PackagePlanModule {}
