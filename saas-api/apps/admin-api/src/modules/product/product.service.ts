import { BadRequestException, Injectable } from '@nestjs/common'
import { BaseBusinessCrudService } from '../base-business-crud.service'
import { PrismaService } from '../prisma/prisma.service'
import { CreateProductDto, UpdateProductDto, ProductQueryDto } from './dto/product.dto'

@Injectable()
export class ProductService extends BaseBusinessCrudService<CreateProductDto, UpdateProductDto, ProductQueryDto> {
  constructor(private readonly prisma: PrismaService) {
    super({
      model: prisma.product,
      prisma,
      searchableFields: ['name'],
      exactFields: ['orgId', 'productType', 'status'],
      include: { org: true },
      validateCreate: async (dto) => this.validateProduct(dto),
      validateUpdate: async (_id, dto) => this.validateProduct(dto)
    })
  }

  private async validateProduct(dto: CreateProductDto | UpdateProductDto) {
    await this.ensureRelatedExists(this.prisma.organization, dto.orgId, '机构不存在')
    if (dto.minAmount !== undefined && dto.maxAmount !== undefined && dto.maxAmount < dto.minAmount) {
      throw new BadRequestException('最高金额不能小于最低金额')
    }
    if (dto.minTerm !== undefined && dto.maxTerm !== undefined && dto.maxTerm < dto.minTerm) {
      throw new BadRequestException('最长期限不能小于最短期限')
    }
    if (dto.minRate !== undefined && dto.maxRate !== undefined && dto.maxRate < dto.minRate) {
      throw new BadRequestException('最高利率不能小于最低利率')
    }
  }
}
