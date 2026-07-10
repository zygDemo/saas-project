import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PaginatedResponse } from '../../common/types/pagination'
import { getRequiredTenantId, formatDate } from '../../common/utils/helpers'
import { getPagination, toPaginatedResponse } from '../../common/utils/pagination'
import { PrismaService } from '../prisma/prisma.service'
import { CacheService } from '../redis/cache.service'
import { CreateSystemParamDto, UpdateSystemParamDto } from './dto/system-param.dto'

/** 系统参数缓存键前缀 */
const CACHE_PREFIX = 'sysparam:'
/** 系统参数缓存 TTL（30 分钟，变更频率极低） */
const CACHE_TTL = 1800

@Injectable()
export class SystemParamService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService
  ) {}

  async getList(query: Record<string, string | undefined>): Promise<PaginatedResponse<unknown>> {
    const tenantId = getRequiredTenantId()
    const pagination = getPagination(query)
    const where: Prisma.SystemParamWhereInput = {
      tenantId,
      deletedAt: null,
      group: query.group || undefined,
      name: query.name ? { contains: query.name, mode: 'insensitive' } : undefined,
      key: query.key ? { contains: query.key, mode: 'insensitive' } : undefined,
      status: query.status || undefined
    }

    const [records, total] = await this.prisma.$transaction([
      this.prisma.systemParam.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: [{ group: 'asc' }, { id: 'asc' }]
      }),
      this.prisma.systemParam.count({ where })
    ])

    return toPaginatedResponse(records.map(mapParam), total, pagination)
  }

  async create(dto: CreateSystemParamDto) {
    const tenantId = getRequiredTenantId()
    await this.assertKeyAvailable(tenantId, dto.key)

    const item = await this.prisma.systemParam.create({
      data: {
        tenantId,
        group: dto.group,
        name: dto.name,
        key: dto.key,
        value: dto.value,
        type: dto.type ?? 'STRING',
        status: dto.status ?? 'ACTIVE',
        remark: dto.remark
      }
    })

    await this.invalidateCache(tenantId)
    return mapParam(item)
  }

  async update(id: number, dto: UpdateSystemParamDto) {
    const tenantId = getRequiredTenantId()
    const item = await this.findOrThrow(tenantId, id)

    if (dto.key && dto.key !== item.key) {
      await this.assertKeyAvailable(tenantId, dto.key, id)
    }

    const updated = await this.prisma.systemParam.update({
      where: { id },
      data: {
        group: dto.group,
        name: dto.name,
        key: dto.key,
        value: dto.value,
        type: dto.type,
        status: dto.status,
        remark: dto.remark
      }
    })

    await this.invalidateCache(tenantId)
    return mapParam(updated)
  }

  async delete(id: number) {
    const tenantId = getRequiredTenantId()
    await this.findOrThrow(tenantId, id)
    await this.prisma.systemParam.update({ where: { id }, data: { deletedAt: new Date() } })
    await this.invalidateCache(tenantId)
    return { id }
  }

  async getValueByKey(key: string): Promise<string | null> {
    const tenantId = getRequiredTenantId()
    const cacheKey = `${CACHE_PREFIX}${tenantId}:val:${key}`

    const cached = await this.cache.get<string>(cacheKey)
    if (cached !== null) return cached

    const item = await this.prisma.systemParam.findFirst({
      where: { tenantId, key, status: 'ACTIVE', deletedAt: null }
    })
    const value = item?.value ?? null

    // 缓存结果（包括 null，防止缓存穿透）
    await this.cache.set(cacheKey, value ?? '__NULL__', CACHE_TTL)
    return value
  }

  async getByKeys(keys: string[]) {
    const tenantId = getRequiredTenantId()
    const cacheKey = `${CACHE_PREFIX}${tenantId}:keys:${keys.sort().join(',')}`

    return this.cache.getOrSet(cacheKey, async () => {
      const items = await this.prisma.systemParam.findMany({
        where: { tenantId, key: { in: keys }, status: 'ACTIVE', deletedAt: null }
      })
      return items.map(mapParam)
    }, CACHE_TTL)
  }

  private async findOrThrow(tenantId: number, id: number) {
    const item = await this.prisma.systemParam.findFirst({ where: { id, tenantId, deletedAt: null } })
    if (!item) throw new NotFoundException('系统参数不存在')
    return item
  }

  private async assertKeyAvailable(tenantId: number, key: string, excludeId?: number) {
    const existing = await this.prisma.systemParam.findFirst({ where: { tenantId, key, deletedAt: null } })
    if (existing && existing.id !== excludeId) {
      throw new ConflictException('参数键已存在')
    }
  }

  /** 清除当前租户的所有系统参数缓存 */
  private async invalidateCache(tenantId: number) {
    await this.cache.delByPrefix(CACHE_PREFIX, tenantId)
  }
}

type ParamRecord = Prisma.SystemParamGetPayload<object>

function mapParam(item: ParamRecord) {
  return {
    id: item.id,
    group: item.group,
    name: item.name,
    key: item.key,
    value: item.value,
    type: item.type,
    status: item.status,
    remark: item.remark,
    createTime: formatDate(item.createdAt),
    updateTime: formatDate(item.updatedAt)
  }
}
