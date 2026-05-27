import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import { getCurrentTenantId } from '../../common/tenant/tenant-context'

const TENANT_MODELS = ['user', 'role', 'menu', 'permission']

// 只对列表/批量查询自动注入 tenantId
// findUnique/findUniqueOrThrow/update/delete/upsert 涉及精确 ID，由 Service 层手动校验
const AUTO_TENANT_OPS = [
  'findUnique',
  'findUniqueOrThrow',
  'findFirst',
  'findFirstOrThrow',
  'findMany',
  'count',
  'aggregate',
  'groupBy',
  'update',
  'updateMany',
  'delete',
  'deleteMany'
]

function hasTenantInWhere(where: Record<string, unknown> | undefined): boolean {
  if (!where) return false
  return Object.keys(where).some((k) => k.includes('tenantId'))
}

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
  private readonly _client: any

  constructor() {
    this._client = new PrismaClient().$extends({
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }: any) {
            const tenantId = getCurrentTenantId()

            // 非租户模型 或 无租户上下文 → 直通
            if (!TENANT_MODELS.includes(model) || tenantId == null) {
              return query(args)
            }

            // 列表/批量查询：自动注入 tenantId
            if (AUTO_TENANT_OPS.includes(operation)) {
              if (!hasTenantInWhere(args?.where)) {
                args = args || {}
                args.where = { ...args.where, tenantId }
              }
            }

            // create：给 data 注入 tenantId
            if (operation === 'create' && args?.data && typeof args.data === 'object' && !Array.isArray(args.data)) {
              args.data = { ...args.data, tenantId }
            }

            // createMany：给 data 数组每项注入 tenantId
            if (operation === 'createMany' && Array.isArray(args?.data)) {
              args.data = args.data.map((item: any) => ({ ...item, tenantId }))
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
        if (prop in target) return (target as any)[prop]
        return target._client[prop]
      }
    }) as any
  }

  async onModuleInit() {
    await this._client.$connect()
  }

  async onModuleDestroy() {
    await this._client.$disconnect()
  }
}
