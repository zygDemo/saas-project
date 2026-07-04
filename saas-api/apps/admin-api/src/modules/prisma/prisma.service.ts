import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import { getCurrentTenantId } from '../../common/tenant/tenant-context'

const TENANT_MODELS = [
  'user',
  'role',
  'menu',
  'permission',
  'organization',
  'department',
  'product',
  'funder',
  'lead',
  'customer',
  'application',
  'approvalrecord',
  'signrecord',
  'disbursement',
  'repaymentplan',
  'repaymentrecord',
  'flowconfig',
  'fileasset',
  'operationlog',
  // 读书模块
  'bookcategory',
  'book',
  'bookchapter',
  'userbookshelf',
  'readingprogress',
  'bookreview',
]

function isTenantModel(model: string | undefined): boolean {
  return !!model && TENANT_MODELS.includes(model.toLowerCase())
}

// 支持软删除的模型列表
const SOFT_DELETE_MODELS = new Set([
  'user', 'role', 'menu', 'organization', 'department',
  'product', 'funder', 'lead', 'customer', 'application',
  'flowconfig', 'fileasset', 'dicttype', 'dictdata',
  'bookcategory', 'book', 'bookchapter', 'userbookshelf',
  'customercontact', 'permission', 'repaymentplan', 'signrecord', 'disbursement'
])

function isSoftDeleteModel(model: string | undefined): boolean {
  return !!model && SOFT_DELETE_MODELS.has(model.toLowerCase())
}

function injectSoftDeleteFilter(args: Record<string, unknown>): Record<string, unknown> {
  const where = args.where as Record<string, unknown> | undefined
  if (where && 'deletedAt' in where) return args // 已有 deletedAt 条件，不覆盖
  return { ...args, where: { ...where, deletedAt: null } }
}

// 只对可携带普通 where 条件的查询/批量操作自动注入 tenantId。
// findUnique/update/delete/upsert 涉及唯一条件，由 Service 层先校验再按唯一 ID 操作。
const AUTO_TENANT_OPS = [
  'findFirst',
  'findFirstOrThrow',
  'findMany',
  'count',
  'aggregate',
  'groupBy',
  'updateMany',
  'deleteMany'
]

function hasTenantInWhere(where: Record<string, unknown> | undefined): boolean {
  if (!where) return false
  return Object.keys(where).some((k) => k.includes('tenantId'))
}

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  [key: string]: any
  private readonly _client: any  // PrismaClient. return type

  constructor() {
    this._client = new PrismaClient().$extends({
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }: {
            model: string | undefined
            operation: string
            args: Record<string, unknown>
            query: (args: Record<string, unknown>) => Promise<unknown>
          }) {
            const tenantId = getCurrentTenantId()

            // 非租户模型 或 无租户上下文 → 直通
            if (!isTenantModel(model) || tenantId == null) {
              return query(args)
            }

            // 列表/批量查询：自动注入 tenantId
            if (AUTO_TENANT_OPS.includes(operation)) {
              if (!hasTenantInWhere(args?.where as Record<string, unknown> | undefined)) {
                args = args || {}
                args.where = { ...(args.where as Record<string, unknown> | undefined), tenantId }
              }
            }

            // 软删除：查询类 + updateMany 操作自动过滤 deletedAt
            if (isSoftDeleteModel(model) && ['findFirst', 'findFirstOrThrow', 'findMany', 'count', 'aggregate', 'groupBy', 'updateMany'].includes(operation)) {
              args = injectSoftDeleteFilter(args)
            }

            // 软删除：delete 转为 update 设置 deletedAt
            if (isSoftDeleteModel(model) && operation === 'delete') {
              return (this as any)[model!.toLowerCase()].update({
                where: args.where,
                data: { deletedAt: new Date() }
              })
            }
            if (isSoftDeleteModel(model) && operation === 'deleteMany') {
              return (this as any)[model!.toLowerCase()].updateMany({
                where: args.where,
                data: { deletedAt: new Date() }
              })
            }

            // create：给 data 注入 tenantId
            if (operation === 'create' && args?.data && typeof args.data === 'object' && !Array.isArray(args.data)) {
              args.data = { ...args.data, tenantId }
            }

            // createMany：给 data 数组每项注入 tenantId
            if (operation === 'createMany' && Array.isArray(args?.data)) {
              args.data = args.data.map((item: Record<string, unknown>) => ({ ...item, tenantId }))
            }

            // upsert：给 create 注入 tenantId（where 已由 WHERE_OPS 处理）
            if (operation === 'upsert' && args?.create && typeof args.create === 'object') {
              args.create = { ...args.create, tenantId }
            }

            return query(args)
          }
        }
      }
    })

    // Proxy 让 PrismaService 表现得像 PrismaClient
    return new Proxy(this, {
      get(target, prop) {
        if (prop in target) return (target as Record<string, unknown>)[prop as string]
        return target._client[prop]
      }
    }) as unknown as this  // Proxy returns different type
  }

  async onModuleInit() {
    await this._client.$connect()
  }

  async onModuleDestroy() {
    await this._client.$disconnect()
  }
}
