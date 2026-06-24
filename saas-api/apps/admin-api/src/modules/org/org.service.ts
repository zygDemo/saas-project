import { BadRequestException, Injectable } from '@nestjs/common'
import { BaseBusinessCrudService } from '../base-business-crud.service'
import { PrismaService } from '../prisma/prisma.service'
import { CreateOrganizationDto, UpdateOrganizationDto, OrganizationQueryDto } from './dto/org.dto'

@Injectable()
export class OrganizationService extends BaseBusinessCrudService<
  CreateOrganizationDto,
  UpdateOrganizationDto,
  OrganizationQueryDto
> {
  constructor(private readonly prisma: PrismaService) {
    super({
      model: prisma.organization,
      prisma,
      include: {
        _count: {
          select: {
            departments: true,
            products: true,
            funders: true,
            customers: true,
            applications: true
          }
        }
      },
      detailInclude: {
        departments: true,
        products: true,
        funders: true,
        _count: {
          select: {
            departments: true,
            products: true,
            funders: true,
            customers: true,
            applications: true
          }
        }
      },
      buildWhere: (query) => {
        const where: Record<string, unknown> = {}
        const contains = (value: string) => ({ contains: value, mode: 'insensitive' })

        if (query.keyword) {
          where.OR = [
            { name: contains(query.keyword) },
            { code: contains(query.keyword) },
            { creditCode: contains(query.keyword) },
            { contactName: contains(query.keyword) },
            { contactPhone: contains(query.keyword) }
          ]
        }
        if (query.name) where.name = contains(query.name)
        if (query.code) where.code = contains(query.code)
        if (query.creditCode) where.creditCode = contains(query.creditCode)
        if (query.contactPhone) where.contactPhone = contains(query.contactPhone)
        if (query.status) where.status = query.status
        if (query.packageType) where.packageType = query.packageType
        if (query.apiEnabled !== undefined) where.apiEnabled = query.apiEnabled

        const now = new Date()
        const expiringAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
        if (query.expireState === 'EXPIRED') where.expireAt = { lt: now }
        if (query.expireState === 'EXPIRING') where.expireAt = { gte: now, lte: expiringAt }
        if (query.expireState === 'VALID') where.expireAt = { gt: expiringAt }
        if (query.expireState === 'UNSET') where.expireAt = null

        return where
      },
      validateCreate: async (dto) => {
        await this.ensureUniqueCode(dto.code)
        await this.ensureUniqueCreditCode(dto.creditCode)
      },
      validateUpdate: async (id, dto) => {
        await this.ensureUniqueCode(dto.code, id)
        await this.ensureUniqueCreditCode(dto.creditCode, id)
      }
    })
  }

  async enable(id: number) {
    await this.ensureExists(id)
    return this.prisma.organization.update({ where: { id }, data: { status: 'ACTIVE' } })
  }

  async disable(id: number) {
    await this.ensureExists(id)
    return this.prisma.organization.update({ where: { id }, data: { status: 'INACTIVE' } })
  }

  private async ensureUniqueCode(code?: string, excludeId?: number) {
    if (!code) return
    const tenantId = getCurrentTenantId()
    const where: Record<string, unknown> = { code }
    if (tenantId) where.tenantId = tenantId
    const item = await this.prisma.organization.findFirst({ where })
    if (item && item.id !== excludeId) throw new BadRequestException('机构编码已存在')
  }

  private async ensureUniqueCreditCode(creditCode?: string, excludeId?: number) {
    if (!creditCode) return
    const tenantId = getCurrentTenantId()
    const where: Record<string, unknown> = { creditCode }
    if (tenantId) where.tenantId = tenantId
    const item = await this.prisma.organization.findFirst({ where })
    if (item && item.id !== excludeId) throw new BadRequestException('统一社会信用代码已存在')
  }
}
