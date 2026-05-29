import { Module } from '@nestjs/common'
import { OrganizationController } from './org.controller'
import { OrganizationService } from './org.service'

@Module({
  controllers: [OrganizationController],
  providers: [OrganizationService],
  exports: [OrganizationService]
})
export class OrganizationModule {}
