import { Module } from '@nestjs/common'
import { ProductTemplateController } from './product-template.controller'
import { ProductTemplateService } from './product-template.service'

@Module({
  controllers: [ProductTemplateController],
  providers: [ProductTemplateService],
  exports: [ProductTemplateService]
})
export class ProductTemplateModule {}
