import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

/* eslint-disable @typescript-eslint/no-explicit-any */

@Injectable()
export class PlatformSupervisionService {
  constructor(private readonly prisma: PrismaService) {}

  /** 平台概览统计 */
  async getOverview() {
    const [totalOrgs, totalUsers, totalApplications, activeProducts, activeTemplates, activeServices, openWorkOrders] =
      await Promise.all([
        this.prisma.organization.count({ where: { deletedAt: null } }),
        this.prisma.user.count({ where: { deletedAt: null } }),
        this.prisma.application.count({ where: { deletedAt: null } }),
        this.prisma.product.count({ where: { deletedAt: null, status: 'ACTIVE' } }),
        this.prisma.productTemplate.count({ where: { deletedAt: null, status: 'ACTIVE' } }),
        this.prisma.thirdPartyService.count({ where: { deletedAt: null, status: 'ACTIVE' } }),
        this.prisma.workOrder.count({ where: { deletedAt: null, status: { in: ['OPEN', 'PROCESSING'] } } })
      ])

    return {
      totalOrgs,
      totalUsers,
      totalApplications,
      activeProducts,
      activeTemplates,
      activeServices,
      openWorkOrders
    }
  }

  /** 各租户申请数量统计 */
  async getTenantApplicationStats() {
    const results: any[] = await this.prisma.application.groupBy({
      by: ['tenantId'],
      where: { deletedAt: null },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } }
    })

    const tenantIds: number[] = results.map((r) => r.tenantId)
    const tenants: any[] = await this.prisma.tenant.findMany({
      where: { id: { in: tenantIds } },
      select: { id: true, name: true }
    })
    const tenantMap = new Map(tenants.map((t) => [t.id, t.name]))

    return results.map((r) => ({
      tenantId: r.tenantId,
      tenantName: tenantMap.get(r.tenantId) ?? '未知',
      applicationCount: r._count.id
    }))
  }

  /** 工单状态分布 */
  async getWorkOrderStatusDistribution() {
    const results: any[] = await this.prisma.workOrder.groupBy({
      by: ['status'],
      where: { deletedAt: null },
      _count: { id: true }
    })

    return results.map((r) => ({
      status: r.status,
      count: r._count.id
    }))
  }

  /** 套餐使用分布 */
  async getPackageUsageDistribution() {
    const orgs: any[] = await this.prisma.organization.groupBy({
      by: ['packageType'],
      where: { deletedAt: null },
      _count: { id: true }
    })

    return orgs.map((r) => ({
      packageType: r.packageType ?? '未设置',
      count: r._count.id
    }))
  }
}
