import { Injectable } from '@nestjs/common'
import { ApplicationStatus, DisbursementStatus, Prisma, RepaymentStatus } from '@prisma/client'
import { getCurrentTenantId } from '../../common/tenant/tenant-context'
import { getPagination, toPaginatedResponse } from '../../common/utils/pagination'
import { PrismaService } from '../prisma/prisma.service'
import { AuditLogQueryDto, DateRangeQueryDto } from './dto/data-center.dto'

const PHASES = [
  { code: 1000, name: '预审阶段', nodes: [1100, 1200, 1300] },
  { code: 1400, name: '补件阶段', nodes: [1400] },
  { code: 2000, name: '风控审批', nodes: [2100, 2200] },
  { code: 3000, name: '资方终审', nodes: [3100] },
  { code: 4000, name: '客户签约', nodes: [4100] },
  { code: 5000, name: '请款放款', nodes: [5100, 6100] }
]

const TERMINAL_REJECTED = [
  ApplicationStatus.RISK_PRE_REJECTED,
  ApplicationStatus.FUNDER_PRE_REJECTED,
  ApplicationStatus.FIRST_REVIEW_REJECTED,
  ApplicationStatus.FINAL_REVIEW_REJECTED,
  ApplicationStatus.FUNDER_REVIEW_REJECTED,
  ApplicationStatus.LOAN_REQUEST_REJECTED,
  ApplicationStatus.CANCELLED
]

@Injectable()
export class DataCenterService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(query: DateRangeQueryDto) {
    const dateWhere = this.buildDateWhere(query, 'createdAt')
    const tenantWhere = this.tenantWhere()
    const appWhere = { ...tenantWhere, ...dateWhere }

    const [
      applicationTotal,
      customerTotal,
      leadTotal,
      activeProductTotal,
      activeFunderTotal,
      disbursedCount,
      rejectedCount,
      amountAgg,
      approvedAgg,
      disbursedAgg,
      pendingRepaymentAgg,
      phaseRows,
      statusRows,
      productRows,
      funderRows,
      trendRows
    ] = await this.prisma.$transaction([
      this.prisma.application.count({ where: appWhere }),
      this.prisma.customer.count({ where: { ...tenantWhere, ...dateWhere } }),
      this.prisma.lead.count({ where: { ...tenantWhere, ...dateWhere } }),
      this.prisma.product.count({ where: { ...tenantWhere, status: 'ACTIVE' } }),
      this.prisma.funder.count({ where: { ...tenantWhere, status: 'ACTIVE' } }),
      this.prisma.application.count({
        where: { ...appWhere, status: ApplicationStatus.DISBURSED }
      }),
      this.prisma.application.count({
        where: { ...appWhere, status: { in: TERMINAL_REJECTED } }
      }),
      this.prisma.application.aggregate({ where: appWhere, _sum: { amount: true } }),
      this.prisma.application.aggregate({ where: appWhere, _sum: { approvedAmount: true } }),
      this.prisma.disbursement.aggregate({
        where: { ...tenantWhere, status: DisbursementStatus.DISBURSED },
        _sum: { disburseAmount: true }
      }),
      this.prisma.repaymentPlan.aggregate({
        where: {
          ...tenantWhere,
          status: {
            in: [
              RepaymentStatus.NOT_DUE,
              RepaymentStatus.PENDING,
              RepaymentStatus.PARTIAL,
              RepaymentStatus.OVERDUE
            ]
          }
        },
        _sum: { totalAmount: true, paidTotal: true }
      }),
      this.prisma.application.groupBy({
        by: ['currentNode'],
        where: appWhere,
        _count: { _all: true }
      }),
      this.prisma.application.groupBy({
        by: ['status'],
        where: appWhere,
        _count: { _all: true }
      }),
      this.prisma.application.groupBy({
        by: ['productId'],
        where: appWhere,
        _count: { _all: true },
        _sum: { amount: true }
      }),
      this.prisma.application.groupBy({
        by: ['funderId'],
        where: appWhere,
        _count: { _all: true },
        _sum: { amount: true }
      }),
      this.prisma.$queryRaw<Array<{ day: Date; count: bigint; amount: Prisma.Decimal | null }>>`
        SELECT date_trunc('day', "createdAt") AS day,
               COUNT(*)::bigint AS count,
               SUM("amount") AS amount
        FROM "Application"
        WHERE (${this.currentTenantId()}::int IS NULL OR "tenantId" = ${this.currentTenantId()}::int)
          AND (${query.startAt || null}::timestamp IS NULL OR "createdAt" >= ${query.startAt || null}::timestamp)
          AND (${query.endAt || null}::timestamp IS NULL OR "createdAt" <= ${query.endAt || null}::timestamp)
        GROUP BY 1
        ORDER BY 1 ASC
      `
    ])

    const [products, funders] = await Promise.all([
      this.prisma.product.findMany({
        where: { id: { in: productRows.map((item) => item.productId).filter(Boolean) as number[] } },
        select: { id: true, name: true }
      }),
      this.prisma.funder.findMany({
        where: { id: { in: funderRows.map((item) => item.funderId).filter(Boolean) as number[] } },
        select: { id: true, name: true }
      })
    ])

    const productNameMap = new Map(products.map((item) => [item.id, item.name]))
    const funderNameMap = new Map(funders.map((item) => [item.id, item.name]))
    const disbursedAmount = this.toNumber(disbursedAgg._sum.disburseAmount)
    const pendingRepaymentAmount =
      this.toNumber(pendingRepaymentAgg._sum.totalAmount) -
      this.toNumber(pendingRepaymentAgg._sum.paidTotal)

    return {
      overview: {
        applicationTotal,
        customerTotal,
        leadTotal,
        activeProductTotal,
        activeFunderTotal,
        disbursedCount,
        rejectedCount,
        passRate: applicationTotal ? Number(((disbursedCount / applicationTotal) * 100).toFixed(2)) : 0,
        requestedAmount: this.toNumber(amountAgg._sum.amount),
        approvedAmount: this.toNumber(approvedAgg._sum.approvedAmount),
        disbursedAmount,
        pendingRepaymentAmount: Math.max(0, Number(pendingRepaymentAmount.toFixed(2)))
      },
      phases: PHASES.map((phase) => ({
        code: phase.code,
        name: phase.name,
        count: phaseRows
          .filter((item) => phase.nodes.includes(Number(item.currentNode)))
          .reduce((sum, item) => sum + item._count._all, 0)
      })),
      statuses: statusRows.map((item) => ({
        status: item.status,
        count: item._count._all
      })),
      products: productRows
        .map((item) => ({
          id: item.productId,
          name: item.productId ? productNameMap.get(item.productId) || `产品 #${item.productId}` : '未选择产品',
          count: item._count._all,
          amount: this.toNumber(item._sum.amount)
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8),
      funders: funderRows
        .map((item) => ({
          id: item.funderId,
          name: item.funderId ? funderNameMap.get(item.funderId) || `资方 #${item.funderId}` : '未选择资方',
          count: item._count._all,
          amount: this.toNumber(item._sum.amount)
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8),
      trends: trendRows.map((item) => ({
        day: this.formatDay(item.day),
        count: Number(item.count),
        amount: this.toNumber(item.amount)
      }))
    }
  }

  async getAuditLogs(query: AuditLogQueryDto) {
    const pagination = getPagination(query)
    const where = this.buildAuditWhere(query)

    const [records, total] = await this.prisma.$transaction([
      this.prisma.operationLog.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { id: 'desc' }
      }),
      this.prisma.operationLog.count({ where })
    ])

    return toPaginatedResponse(
      records.map((item) => ({
        ...item,
        requestData: this.compactJson(item.requestData),
        responseData: this.compactJson(item.responseData)
      })),
      total,
      pagination
    )
  }

  private buildAuditWhere(query: AuditLogQueryDto) {
    const where: Record<string, unknown> = {
      ...this.buildDateWhere(query, 'createdAt')
    }
    if (query.module) where.module = { contains: query.module, mode: 'insensitive' }
    if (query.action) where.action = query.action
    if (query.userName) where.userName = { contains: query.userName, mode: 'insensitive' }
    if (query.keyword) {
      where.OR = [
        { module: { contains: query.keyword, mode: 'insensitive' } },
        { action: { contains: query.keyword, mode: 'insensitive' } },
        { userName: { contains: query.keyword, mode: 'insensitive' } },
        { description: { contains: query.keyword, mode: 'insensitive' } },
        { ip: { contains: query.keyword, mode: 'insensitive' } }
      ]
    }
    return where
  }

  private buildDateWhere(query: DateRangeQueryDto, field: string) {
    const range: Record<string, Date> = {}
    if (query.startAt) range.gte = new Date(query.startAt)
    if (query.endAt) range.lte = new Date(query.endAt)
    return Object.keys(range).length ? { [field]: range } : {}
  }

  private tenantWhere() {
    const tenantId = this.currentTenantId()
    return tenantId ? { tenantId } : {}
  }

  private currentTenantId() {
    return getCurrentTenantId()
  }

  private toNumber(value: Prisma.Decimal | number | bigint | null | undefined) {
    if (value === null || value === undefined) return 0
    return Number(value)
  }

  private formatDay(value: Date) {
    const date = new Date(value)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${date.getFullYear()}-${month}-${day}`
  }

  private compactJson(value: unknown) {
    if (!value) return value
    const text = JSON.stringify(value)
    return text.length > 1200 ? `${text.slice(0, 1200)}...` : value
  }
}
