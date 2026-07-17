import { BadRequestException, Injectable } from '@nestjs/common'
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
        validateCreate: async (dto) => {
          if (dto.minRate != null && dto.maxRate != null && dto.minRate > dto.maxRate) {
            throw new BadRequestException('最低利率不能大于最高利率')
          }
          if (dto.minAmount != null && dto.maxAmount != null && dto.minAmount > dto.maxAmount) {
            throw new BadRequestException('最低金额不能大于最高金额')
          }
          if (dto.minTerm != null && dto.maxTerm != null && dto.minTerm > dto.maxTerm) {
            throw new BadRequestException('最短期限不能大于最长期限')
          }
        },
        validateUpdate: async (_id, dto) => {
          if (dto.minRate != null && dto.maxRate != null && dto.minRate > dto.maxRate) {
            throw new BadRequestException('最低利率不能大于最高利率')
          }
          if (dto.minAmount != null && dto.maxAmount != null && dto.minAmount > dto.maxAmount) {
            throw new BadRequestException('最低金额不能大于最高金额')
          }
          if (dto.minTerm != null && dto.maxTerm != null && dto.minTerm > dto.maxTerm) {
            throw new BadRequestException('最短期限不能大于最长期限')
          }
        },
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