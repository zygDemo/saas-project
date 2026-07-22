import { BadRequestException, Injectable } from '@nestjs/common'
import { BaseBusinessCrudService } from '../base-business-crud.service'
import { PrismaService } from '../prisma/prisma.service'
import { CacheService } from '../redis/cache.service'
import { getCurrentTenantId } from '../../common/tenant/tenant-context'
import { CreateFunderDto, UpdateFunderDto, FunderQueryDto } from './dto/funder.dto'

@Injectable()
export class FunderService extends BaseBusinessCrudService<CreateFunderDto, UpdateFunderDto, FunderQueryDto> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {
    super({
      model: prisma.funder,
      prisma,
      searchableFields: ['name', 'code'],
      exactFields: ['orgId', 'funderType', 'status'],
      include: { org: true },
      validateCreate: async (dto) => this.validateFunder(dto),
      validateUpdate: async (id, dto) => this.validateFunder(dto, id)
    })
  }

  private get cachePrefix() { return `funder:${getCurrentTenantId()}:` }

  async getList(query: FunderQueryDto) {
    const key = `${this.cachePrefix}list:${JSON.stringify(query)}`
    return this.cache.getOrSet(key, () => super.getList(query), 300)
  }

  async getDetail(id: number) {
    const key = `${this.cachePrefix}detail:${id}`
    return this.cache.getOrSet(key, () => super.getDetail(id), 600)
  }

  async create(dto: CreateFunderDto) {
    const result = await super.create(dto)
    await this.cache.delByPrefix('funder:', getCurrentTenantId() as number)
    return result
  }

  async update(id: number, dto: UpdateFunderDto) {
    const result = await super.update(id, dto)
    await this.cache.delByPrefix('funder:', getCurrentTenantId() as number)
    return result
  }

  async remove(id: number) {
    const result = await super.remove(id)
    await this.cache.delByPrefix('funder:', getCurrentTenantId() as number)
    return result
  }

  private async validateFunder(dto: CreateFunderDto | UpdateFunderDto, id?: number) {
    await this.ensureRelatedExists(this.prisma.organization, dto.orgId, '机构不存在')
    if (dto.code && dto.orgId) {
      const item = await this.prisma.funder.findFirst({ where: { orgId: dto.orgId, code: dto.code, deletedAt: null } })
      if (item && item.id !== id) throw new BadRequestException('同一机构下资方编码已存在')
    }
  }
}
