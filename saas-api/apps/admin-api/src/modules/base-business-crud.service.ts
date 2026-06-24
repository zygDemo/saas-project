import { BadRequestException, NotFoundException } from '@nestjs/common'
import { getPagination, toPaginatedResponse } from '../common/utils/pagination'
import { getCurrentTenantId } from '../common/tenant/tenant-context'
import { hasValue } from '../common/utils/helpers'

type ModelDelegate = any  // TODO: proper generic delegate interface

type PrismaWithTransaction = any  // TODO: PrismaClient type

interface CrudOptions<TCreate, TUpdate, TQuery> {
  model: ModelDelegate
  prisma: PrismaWithTransaction
  searchableFields?: string[]
  exactFields?: string[]
  include?: unknown
  detailInclude?: unknown
  beforeCreate?: (dto: TCreate) => Promise<unknown> | unknown
  beforeUpdate?: (dto: TUpdate) => Promise<unknown> | unknown
  validateCreate?: (dto: TCreate) => Promise<void> | void
  validateUpdate?: (id: number, dto: TUpdate) => Promise<void> | void
  buildWhere?: (query: TQuery) => Record<string, unknown>
  skipTenantFilter?: boolean
}


export abstract class BaseBusinessCrudService<TCreate extends object, TUpdate extends object, TQuery extends object> {
  protected constructor(private readonly options: CrudOptions<TCreate, TUpdate, TQuery>) {}

  async getList(query: TQuery) {
    const pagination = getPagination(query)
    const where = this.buildWhere(query)
    const findArgs: Record<string, unknown> = {
      where,
      skip: pagination.skip,
      take: pagination.take,
      orderBy: { id: 'desc' }
    }
    if (this.options.include) findArgs.include = this.options.include

    const [records, total] = await this.options.prisma.$transaction([
      this.options.model.findMany(findArgs),
      this.options.model.count({ where })
    ])

    return toPaginatedResponse(records, total, pagination)
  }

  async getDetail(id: number) {
    const where = this.addTenantFilter({ id })
    const args: Record<string, unknown> = { where }
    if (this.options.detailInclude ?? this.options.include) args.include = this.options.detailInclude ?? this.options.include
    const item = await this.options.model.findFirst(args)
    if (!item) throw new NotFoundException('数据不存在')
    return item
  }

  async create(dto: TCreate) {
    await this.options.validateCreate?.(dto)
    let data = (await this.options.beforeCreate?.(dto)) ?? dto
    // 自动添加当前租户ID
    const tenantId = getCurrentTenantId()
    if (tenantId && !this.options.skipTenantFilter) {
      data = { ...(data as object), tenantId } as TCreate
    }
    return this.options.model.create({ data })
  }

  async update(id: number, dto: TUpdate) {
    await this.ensureExists(id)
    await this.options.validateUpdate?.(id, dto)
    const data = (await this.options.beforeUpdate?.(dto)) ?? dto
    const where = this.addTenantFilter({ id })
    return this.options.model.update({ where, data })
  }

  async remove(id: number) {
    await this.ensureExists(id)
    await this.options.model.update({ where: { id }, data: { deletedAt: new Date() } })
    return { id }
  }

  protected async ensureExists(id: number) {
    const where = this.addTenantFilter({ id, deletedAt: null })
    const item = await this.options.model.findFirst({ where })
    if (!item) throw new NotFoundException('数据不存在')
    return item
  }

  protected async ensureRelatedExists(model: ModelDelegate, id: number | undefined, message: string) {
    if (!hasValue(id)) return
    const item = await model.findFirst({ where: { id } })
    if (!item) throw new BadRequestException(message)
    return item
  }

  private addTenantFilter(where: Record<string, unknown>): Record<string, unknown> {
    if (this.options.skipTenantFilter) return where
    const tenantId = getCurrentTenantId()
    if (!tenantId) return where
    return { ...where, tenantId }
  }

  private buildWhere(query: TQuery) {
    let where: Record<string, unknown> = {}
    if (this.options.buildWhere) {
      where = this.options.buildWhere(query)
    } else {
      const source = query as Record<string, unknown>
      for (const field of this.options.searchableFields ?? []) {
        if (hasValue(source[field])) {
          where[field] = { contains: source[field], mode: 'insensitive' }
        }
      }

      for (const field of this.options.exactFields ?? []) {
        if (hasValue(source[field])) {
          where[field] = source[field]
        }
      }
    }
    // 自动添加租户过滤 + 排除已删除
    return this.addTenantFilter({ ...where, deletedAt: null })
  }
}

export function omitNested<T extends Record<string, unknown>>(dto: T, keys: string[]) {
  const data: Record<string, unknown> = { ...dto }
  for (const key of keys) delete data[key]
  return data
}
