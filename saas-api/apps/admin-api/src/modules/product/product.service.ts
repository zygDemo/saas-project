import { Injectable } from '@nestjs/common'
import { BaseBusinessCrudService } from '../base-business-crud.service'
import { PrismaService } from '../prisma/prisma.service'
import { CreateProductDto, UpdateProductDto, ProductQueryDto } from './dto/product.dto'

@Injectable()
export class ProductService extends BaseBusinessCrudService<CreateProductDto, UpdateProductDto, ProductQueryDto> {
  constructor(private readonly prisma: PrismaService) {
    super({
      model: prisma.product,
      prisma,
      searchableFields: ['name'], exactFields: ['orgId', 'productType', 'status'],
      include: { org: true },
      validateCreate: async (dto) => {
        await this.ensureRelatedExists(this.prisma.organization, dto.orgId, '机构不存在')
      },
      validateUpdate: async (_id, dto) => {
        await this.ensureRelatedExists(this.prisma.organization, dto.orgId, '机构不存在')
      },
    })
  }
}
