import { BadRequestException, Injectable } from '@nestjs/common'
import { getCurrentTenantId } from '../../common/tenant/tenant-context'
import { BaseBusinessCrudService } from '../base-business-crud.service'
import { PrismaService } from '../prisma/prisma.service'
import { CacheService } from '../redis/cache.service'
import { CreateOrganizationDto, UpdateOrganizationDto, OrganizationQueryDto } from './dto/org.dto'

@Injectable()
export class OrganizationService extends BaseBusinessCrudService<
  CreateOrganizationDto,
  UpdateOrganizationDto,
  OrganizationQueryDto
> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {
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
      searchableFields: ['name'],
      exactFields: ['status'],
      validateCreate: async (dto) => this.validateOrg(dto),
      validateUpdate: async (_id, dto) => this.validateOrg(dto)
    })
  }

  private get cachePrefix() { return `org:${getCurrentTenantId()}:` }

  async getList(query: OrganizationQueryDto) {
    const key = `${this.cachePrefix}list:${JSON.stringify(query)}`
    return this.cache.getOrSet(key, () => super.getList(query), 300)
  }

  async getDetail(id: number) {
    const key = `${this.cachePrefix}detail:${id}`
    return this.cache.getOrSet(key, () => super.getDetail(id), 600)
  }

  async create(dto: CreateOrganizationDto) {
    const result = await super.create(dto)
    await this.cache.delByPrefix('org:', getCurrentTenantId() as number)
    return result
  }

  async update(id: number, dto: UpdateOrganizationDto) {
    const result = await super.update(id, dto)
    await this.cache.delByPrefix('org:', getCurrentTenantId() as number)
    return result
  }

  async remove(id: number) {
    const result = await super.remove(id)
    await this.cache.delByPrefix('org:', getCurrentTenantId() as number)
    return result
  }

  private async validateOrg(dto: CreateOrganizationDto | UpdateOrganizationDto) {
    if (dto.creditCode) {
      const existing = await this.prisma.organization.findFirst({
        where: { creditCode: dto.creditCode, deletedAt: null }
      })
      if (existing) throw new BadRequestException('统一社会信用代码已存在')
    }
  }
}
