import { BadRequestException, NotFoundException } from '@nestjs/common'
import { getPagination, toPaginatedResponse } from '../common/utils/pagination'
import { getCurrentTenantId } from '../common/tenant/tenant-context'
import { hasValue } from '../common/utils/helpers'
import type { PrismaService } from '../prisma/prisma.service'
import type { Prisma } from '@prisma/client'

/** Prisma 模型委托接口 — 涵盖 BaseBusinessCrudService 需要的所有方法 */
interface PrismaModelDelegate {
  findMany(args: unknown): Promise<unknown[]>
  count(args: unknown): Promise<number>
  findFirst(args: unknown): Promise<unknown | null>
  create(args: unknown): Promise<unknown>
  update(args: unknown): Promise<unknown>
}

/** Prisma 事务上下文 — 支持普通服务和事务内调用 */
type PrismaTransaction = Pick<PrismaService | Prisma.TransactionClient, '$transaction'>

interface CrudOptions<TCreate, TUpdate, TQuery> {
  model: PrismaModelDelegate
  prisma: PrismaTransaction
  searchableFields?: string[]
  exactFields?: string[]
  include?: unknown
  detailInclude?: unknown
  beforeCreate?: (dto: TCreate) => Promise<unknown> | unknown
  beforeUpdate?: (dto: TUpdate) => Promise<unknown> | unknown
  validateCreate?: (dto: TCreate) => Promise<void> | void
  validateUpdate?: (id: number, dto: TUpdate) => Promise<void> | void
  buildWhere?: (query: TQuery) => Record<string, unknown>
  /** 异步钩子：在 buildWhere 之后调用，用于注入数据权限等动态条件 */
  getExtraWhere?: (query: TQuery) => Promise<Record<string, unknown>> | Record<string, unknown>
  skipTenantFilter?: boolean
}


export abstract class BaseBusinessCrudService<TCreate extends object, TUpdate extends object, TQuery extends object> {
  protected constructor(private readonly options: CrudOptions<TCreate, TUpdate, TQuery>) {}

  async getList(query: TQuery) {
    const pagination = getPagination(query)
    let where = this.buildWhere(query)
    if (this.options.getExtraWhere) {
      const extra = await this.options.getExtraWhere(query)
      where = { ...where, ...extra }
    }
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

  protected async ensureRelatedExists(model: PrismaModelDelegate, id: number | undefined, message: string) {
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
