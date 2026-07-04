import { Injectable } from '@nestjs/common'
import { BaseBusinessCrudService } from '../base-business-crud.service'
import { PrismaService } from '../prisma/prisma.service'
import { CreateProductTemplateDto, UpdateProductTemplateDto, ProductTemplateQueryDto } from './dto/product-template.dto'

@Injectable()
export class ProductTemplateService extends BaseBusinessCrudService<
  CreateProductTemplateDto,
  UpdateProductTemplateDto,
  ProductTemplateQueryDto
> {
  constructor(private readonly prisma: PrismaService) {
    super({
      model: prisma.productTemplate,
      prisma,
      skipTenantFilter: true,
      buildWhere: (query) => {
        const where: Record<string, unknown> = {}
        const contains = (value: string) => ({ contains: value, mode: 'insensitive' })

        if (query.keyword) {
          where.OR = [
            { name: contains(query.keyword) }
          ]
        }
        if (query.name) where.name = contains(query.name)
        if (query.productType) where.productType = query.productType
        if (query.status) where.status = query.status

        return where
      }
    })
  }
}
