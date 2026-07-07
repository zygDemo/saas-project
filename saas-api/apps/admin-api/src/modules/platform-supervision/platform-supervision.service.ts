import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { getPagination, toPaginatedResponse } from '../../common/utils/pagination'

/* eslint-disable @typescript-eslint/no-explicit-any */

@Injectable()
export class PlatformSupervisionService {
  constructor(private readonly prisma: PrismaService) {}

  /** 平台监管列表（各机构业务统计，分页） */
  async getStats(query: Record<string, string>) {
    const pagination = getPagination(query)

    const orgs: any[] = await this.prisma.organization.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, code: true, status: true, packageType: true, expireAt: true },
      skip: pagination.skip,
      take: pagination.take,
      orderBy: { id: 'desc' }
    })

    const total: number = await this.prisma.organization.count({ where: { deletedAt: null } })

    const orgIds = orgs.map((o) => o.id)

    const [appCounts, leadCounts, disbursedAggs] = await Promise.all([
      this.prisma.application.groupBy({
        by: ['orgId'],
        where: { orgId: { in: orgIds }, deletedAt: null },
        _count: { id: true }
      }),
      this.prisma.lead.groupBy({
        by: ['orgId'],
        where: { orgId: { in: orgIds }, deletedAt: null },
        _count: { id: true }
      }),
      this.prisma.disbursement.aggregate({
        where: { application: { orgId: { in: orgIds } }, status: 'DISBURSED' },
        _sum: { disburseAmount: true }
      })
    ])

    const appMap = new Map(appCounts.map((a: any) => [a.orgId, a._count.id]))
    const leadMap = new Map(leadCounts.map((l: any) => [l.orgId, l._count.id]))

    const records = orgs.map((org) => ({
      orgName: org.name,
      orgCode: org.code,
      status: org.status,
      packageType: org.packageType ?? '未设置',
      expireAt: org.expireAt,
      totalApplications: appMap.get(org.id) ?? 0,
      leadCount: leadMap.get(org.id) ?? 0,
      disbursedAmount: disbursedAggs._sum?.disburseAmount ?? 0
    }))

    return toPaginatedResponse(records, total, pagination)
  }

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
}
