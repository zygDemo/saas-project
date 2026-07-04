import { Injectable } from '@nestjs/common'
import { ApplicationStatus, DisbursementStatus, Prisma, RepaymentStatus } from '@prisma/client'
import { getCurrentTenantId } from '../../common/tenant/tenant-context'
import { getPagination, toPaginatedResponse } from '../../common/utils/pagination'
import { PrismaService } from '../prisma/prisma.service'
import { CacheService } from '../redis/cache.service'
import { AuditLogQueryDto, AuditLogStatsDto, DateRangeQueryDto } from './dto/data-center.dto'

/** 数据中心缓存键前缀 */
const CACHE_PREFIX = 'dcenter:'
/** 统计数据缓存 TTL（5 分钟） */
const STATS_CACHE_TTL = 300

const PHASES = [
  { code: 1000, name: '预审阶段', nodes: [1100, 1110, 1120, 1130, 1140, 1200, 1250] },
  { code: 1300, name: '补件阶段', nodes: [1300, 1310, 1320, 1330, 1340, 1350] },
  { code: 1400, name: '风控审批', nodes: [1400, 1450] },
  { code: 1500, name: '资方终审', nodes: [1500] },
  { code: 1600, name: '签约阶段', nodes: [1600, 1610, 1620, 1630, 1640, 1650, 1660] },
  { code: 1700, name: '请款放款', nodes: [1700, 1800] },
  { code: 1900, name: '贷后阶段', nodes: [1900] }
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService
  ) {}

  async getStats(query: DateRangeQueryDto) {
    const tenantId = this.currentTenantId()
    const cacheKey = `${CACHE_PREFIX}${tenantId}:stats:${query.startAt || ''}:${query.endAt || ''}`

    return this.cache.getOrSet(cacheKey, () => this.fetchStats(query), STATS_CACHE_TTL)
  }

  async getHeatmapData(query: DateRangeQueryDto) {
    const tenantId = this.currentTenantId()
    const cacheKey = `${CACHE_PREFIX}${tenantId}:heatmap:${query.startAt || ''}:${query.endAt || ''}`

    return this.cache.getOrSet(cacheKey, () => this.fetchHeatmapData(query), STATS_CACHE_TTL)
  }

  /** 实际的统计数据查询（未缓存） */
  private async fetchStats(query: DateRangeQueryDto) {
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
      this.prisma.$queryRaw<Array<{ day: Date; count: number; amount: Prisma.Decimal | null }>>`
        SELECT date_trunc('day', "createdAt") AS day,
               COUNT(*)::int AS count,
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
        where: { id: { in: productRows.map((item: { productId: number | null }) => item.productId).filter(Boolean) as number[] } },
        select: { id: true, name: true }
      }),
      this.prisma.funder.findMany({
        where: { id: { in: funderRows.map((item: { funderId: number | null }) => item.funderId).filter(Boolean) as number[] } },
        select: { id: true, name: true }
      })
    ])

    const productNameMap = new Map(products.map((item: { id: number; name: string }) => [item.id, item.name]))
    const funderNameMap = new Map(funders.map((item: { id: number; name: string }) => [item.id, item.name]))
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
          .filter((item: { currentNode: number }) => phase.nodes.includes(Number(item.currentNode)))
          .reduce((sum: number, item: { _count: { _all: number } }) => sum + item._count._all, 0)
      })),
      statuses: statusRows.map((item: { status: string; _count: { _all: number } }) => ({
        status: item.status,
        count: item._count._all
      })),
      products: productRows
        .map((item: { productId: number | null; _count: { _all: number }; _sum: { amount: number | null } }) => ({
          id: item.productId,
          name: item.productId ? productNameMap.get(item.productId) || `产品 #${item.productId}` : '未选择产品',
          count: item._count._all,
          amount: this.toNumber(item._sum.amount)
        }))
        .sort((a: { count: number }, b: { count: number }) => b.count - a.count)
        .slice(0, 8),
      funders: funderRows
        .map((item: { funderId: number | null; _count: { _all: number }; _sum: { amount: number | null } }) => ({
          id: item.funderId,
          name: item.funderId ? funderNameMap.get(item.funderId) || `资方 #${item.funderId}` : '未选择资方',
          count: item._count._all,
          amount: this.toNumber(item._sum.amount)
        }))
        .sort((a: { count: number }, b: { count: number }) => b.count - a.count)
        .slice(0, 8),
      trends: trendRows.map((item: { day: Date; count: number; amount: number | null }) => ({
        day: this.formatDay(item.day),
        count: Number(item.count),
        amount: this.toNumber(item.amount)
      }))
    }
  }

  /** 实际的热力图查询（未缓存） */
  private async fetchHeatmapData(query: DateRangeQueryDto) {
    const tenantId = this.currentTenantId()
    const dateWhere = this.buildDateWhere(query, 'createdAt')
    const tenantWhere = tenantId ? { tenantId } : {}
    const where = { ...tenantWhere, ...dateWhere }

    // 查询最近7天的订单时间分布
    const heatmapRows = await this.prisma.$queryRaw<Array<{ day_of_week: number; hour: number; count: number }>>`
      SELECT 
        EXTRACT(DOW FROM "createdAt")::int AS day_of_week,
        EXTRACT(HOUR FROM "createdAt")::int AS hour,
        COUNT(*)::int AS count
      FROM "Application"
      WHERE (${tenantId}::int IS NULL OR "tenantId" = ${tenantId}::int)
        AND (${query.startAt || null}::timestamp IS NULL OR "createdAt" >= ${query.startAt || null}::timestamp)
        AND (${query.endAt || null}::timestamp IS NULL OR "createdAt" <= ${query.endAt || null}::timestamp)
      GROUP BY 1, 2
      ORDER BY 1, 2
    `

    // 转换为热力图数据格式 [hour, dayOfWeek, count]
    const heatmapData: Array<[number, number, number]> = []
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const row = heatmapRows.find((r: { day_of_week: number; hour: number }) => r.day_of_week === day && r.hour === hour)
        heatmapData.push([hour, day, row ? row.count : 0])
      }
    }

    return {
      heatmapData,
      maxValue: Math.max(...heatmapData.map(d => d[2]), 0)
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
      records.map((item: { id: number; module: string; action: string; userName: string; statusCode: number; requestData: unknown; responseData: unknown; createdAt: Date }) => ({
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
    if (query.status === 'success') {
      where.statusCode = { gte: 200, lt: 300 }
    } else if (query.status === 'fail') {
      where.statusCode = { gte: 400 }
    }
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

  /**
   * 获取日志审计统计数据
   * 
   * 异常IP检测规则（只统计 statusCode >= 400 的异常请求）：
   * 1. 突发攻击检测：5分钟内异常请求超过50次的IP
   * 2. 登录接口监控：登录接口（auth/login模块）请求超过5次且失败率高的IP
   * 3. 连续失败检测：连续失败超过5次的IP
   * 4. 综合攻击排行：异常请求总次数超过10次的IP
   * 
   * 威胁等级：
   * - 严重(critical)：突发请求≥100 / 登录失败≥10 / 连续失败≥20
   * - 高危(high)：突发请求≥70 / 登录失败≥5 / 连续失败≥10
   * - 中危(medium)：其他异常请求
   */
  async getAuditLogStats(query: AuditLogStatsDto) {
    const dateWhere = this.buildDateWhere(query, 'createdAt')
    const tenantWhere = this.tenantWhere()
    const baseWhere = { ...tenantWhere, ...dateWhere }
    
    const moduleWhere = query.module 
      ? { ...baseWhere, module: { contains: query.module, mode: 'insensitive' as const } }
      : baseWhere

    const [total, successCount, failCount, moduleStats, actionStats, hourlyStats, attackStats, topAttackIps, burstIps, loginAttempts, consecutiveFails] = await Promise.all([
      this.prisma.operationLog.count({ where: baseWhere }),
      this.prisma.operationLog.count({ where: { ...baseWhere, statusCode: { gte: 200, lt: 300 } } }),
      this.prisma.operationLog.count({ where: { ...baseWhere, statusCode: { gte: 400 } } }),
      this.prisma.operationLog.groupBy({
        by: ['module'],
        where: moduleWhere,
        _count: { _all: true },
        orderBy: { _count: { id: 'desc' } }
      }),
      this.prisma.operationLog.groupBy({
        by: ['action'],
        where: moduleWhere,
        _count: { _all: true },
        orderBy: { _count: { id: 'desc' } }
      }),
      this.prisma.$queryRaw<Array<{ hour: number; count: number }>>`
        SELECT 
          EXTRACT(HOUR FROM "createdAt")::int AS hour,
          COUNT(*)::int AS count
        FROM "OperationLog"
        WHERE (${this.currentTenantId()}::int IS NULL OR "tenantId" = ${this.currentTenantId()}::int)
          AND (${query.startAt || null}::timestamp IS NULL OR "createdAt" >= ${query.startAt || null}::timestamp)
          AND (${query.endAt || null}::timestamp IS NULL OR "createdAt" <= ${query.endAt || null}::timestamp)
        GROUP BY 1
        ORDER BY 1
      `,
      // 异常请求统计（失败请求或4xx/5xx状态码）
      this.prisma.$queryRaw<Array<{ hour: number; count: number }>>`
        SELECT 
          EXTRACT(HOUR FROM "createdAt")::int AS hour,
          COUNT(*)::int AS count
        FROM "OperationLog"
        WHERE (${this.currentTenantId()}::int IS NULL OR "tenantId" = ${this.currentTenantId()}::int)
          AND (${query.startAt || null}::timestamp IS NULL OR "createdAt" >= ${query.startAt || null}::timestamp)
          AND (${query.endAt || null}::timestamp IS NULL OR "createdAt" <= ${query.endAt || null}::timestamp)
          AND "statusCode" >= 400
        GROUP BY 1
        ORDER BY 1
      `,
      // 攻击IP排行：只统计异常请求（失败请求或4xx/5xx状态码）
      this.prisma.$queryRaw<Array<{ ip: string; count: number; failCount: number }>>`
        SELECT 
          "ip",
          COUNT(*)::int AS count,
          SUM(CASE WHEN "statusCode" >= 400 THEN 1 ELSE 0 END)::int AS "failCount"
        FROM "OperationLog"
        WHERE (${this.currentTenantId()}::int IS NULL OR "tenantId" = ${this.currentTenantId()}::int)
          AND (${query.startAt || null}::timestamp IS NULL OR "createdAt" >= ${query.startAt || null}::timestamp)
          AND (${query.endAt || null}::timestamp IS NULL OR "createdAt" <= ${query.endAt || null}::timestamp)
          AND "ip" IS NOT NULL
          AND "ip" != ''
          AND "statusCode" >= 400
        GROUP BY "ip"
        HAVING COUNT(*) >= 10
        ORDER BY count DESC
        LIMIT 10
      `,
      // 1. 短时间窗口检测：5分钟内异常请求超过50次的IP
      this.prisma.$queryRaw<Array<{ ip: string; burstCount: number; windowStart: string; windowEnd: string }>>`
        WITH ip_windows AS (
          SELECT 
            "ip",
            "createdAt",
            COUNT(*) OVER (
              PARTITION BY "ip" 
              ORDER BY "createdAt" 
              RANGE BETWEEN INTERVAL '5 minutes' PRECEDING AND CURRENT ROW
            ) AS burst_count
          FROM "OperationLog"
          WHERE (${this.currentTenantId()}::int IS NULL OR "tenantId" = ${this.currentTenantId()}::int)
            AND (${query.startAt || null}::timestamp IS NULL OR "createdAt" >= ${query.startAt || null}::timestamp)
            AND (${query.endAt || null}::timestamp IS NULL OR "createdAt" <= ${query.endAt || null}::timestamp)
            AND "ip" IS NOT NULL
            AND "ip" != ''
            AND "statusCode" >= 400
        )
        SELECT DISTINCT
          "ip",
          MAX(burst_count)::int AS "burstCount",
          MIN("createdAt")::text AS "windowStart",
          MAX("createdAt")::text AS "windowEnd"
        FROM ip_windows
        WHERE burst_count >= 50
        GROUP BY "ip"
        ORDER BY "burstCount" DESC
        LIMIT 10
      `,
      // 2. 特定接口监控：登录接口的异常请求
      this.prisma.$queryRaw<Array<{ ip: string; count: number; failCount: number; lastAttempt: string }>>`
        SELECT 
          "ip",
          COUNT(*)::int AS count,
          SUM(CASE WHEN "statusCode" >= 400 THEN 1 ELSE 0 END)::int AS "failCount",
          MAX("createdAt")::text AS "lastAttempt"
        FROM "OperationLog"
        WHERE (${this.currentTenantId()}::int IS NULL OR "tenantId" = ${this.currentTenantId()}::int)
          AND (${query.startAt || null}::timestamp IS NULL OR "createdAt" >= ${query.startAt || null}::timestamp)
          AND (${query.endAt || null}::timestamp IS NULL OR "createdAt" <= ${query.endAt || null}::timestamp)
          AND "ip" IS NOT NULL
          AND "ip" != ''
          AND (
            "module" ILIKE '%auth%' 
            OR "module" ILIKE '%login%'
            OR "action" ILIKE '%login%'
            OR "action" ILIKE '%signin%'
            OR "description" ILIKE '%登录%'
            OR "description" ILIKE '%login%'
          )
        GROUP BY "ip"
        HAVING COUNT(*) >= 5
        ORDER BY "failCount" DESC, count DESC
        LIMIT 10
      `,
      // 3. 连续失败检测：连续失败超过5次的IP
      this.prisma.$queryRaw<Array<{ ip: string; consecutiveFails: number; lastFailTime: string; failModule: string }>>`
        WITH fail_sequences AS (
          SELECT 
            "ip",
            "createdAt",
            "module",
            "statusCode",
            SUM(CASE WHEN "statusCode" < 400 THEN 1 ELSE 0 END) OVER (
              PARTITION BY "ip" ORDER BY "createdAt"
            ) AS fail_group
          FROM "OperationLog"
          WHERE (${this.currentTenantId()}::int IS NULL OR "tenantId" = ${this.currentTenantId()}::int)
            AND (${query.startAt || null}::timestamp IS NULL OR "createdAt" >= ${query.startAt || null}::timestamp)
            AND (${query.endAt || null}::timestamp IS NULL OR "createdAt" <= ${query.endAt || null}::timestamp)
            AND "ip" IS NOT NULL
            AND "ip" != ''
        ),
        consecutive_counts AS (
          SELECT 
            "ip",
            fail_group,
            COUNT(*)::int AS consecutive_fails,
            MAX("createdAt")::text AS last_fail_time,
            MAX("module") AS fail_module
          FROM fail_sequences
          WHERE "statusCode" >= 400
          GROUP BY "ip", fail_group
          HAVING COUNT(*) >= 5
        )
        SELECT 
          "ip",
          MAX(consecutive_fails) AS "consecutiveFails",
          MAX(last_fail_time) AS "lastFailTime",
          MAX(fail_module) AS "failModule"
        FROM consecutive_counts
        GROUP BY "ip"
        ORDER BY "consecutiveFails" DESC
        LIMIT 10
      `
    ])

    // 填充24小时数据，确保每个小时都有数据
    const hourlyData = Array.from({ length: 24 }, (_, i) => {
      const row = hourlyStats.find((r: { hour: number; count: number }) => r.hour === i)
      const attackRow = attackStats.find((r: { hour: number; count: number }) => r.hour === i)
      return {
        hour: i,
        label: `${i.toString().padStart(2, '0')}:00`,
        count: row ? row.count : 0,
        attackCount: attackRow ? attackRow.count : 0
      }
    })

    return {
      total,
      successCount,
      failCount,
      successRate: total > 0 ? Number(((successCount / total) * 100).toFixed(1)) : 0,
      modules: moduleStats.map((item: { module: string; _count: { _all: number } }) => ({
        module: item.module,
        count: item._count._all
      })),
      actions: actionStats.map((item: { action: string; _count: { _all: number } }) => ({
        action: item.action,
        count: item._count._all
      })),
      hourly: hourlyData,
      attackIps: topAttackIps.map((item: { ip: string; count: number; failCount: number }) => ({
        ip: item.ip,
        count: item.count,
        failCount: item.failCount,
        failRate: item.count > 0 ? Number(((item.failCount / item.count) * 100).toFixed(1)) : 0
      })),
      // 1. 短时间窗口检测结果
      burstIps: burstIps.map((item: { ip: string; burstCount: number; windowStart: string; windowEnd: string }) => ({
        ip: item.ip,
        burstCount: item.burstCount,
        windowStart: item.windowStart,
        windowEnd: item.windowEnd,
        threatLevel: item.burstCount >= 100 ? 'critical' : item.burstCount >= 70 ? 'high' : 'medium'
      })),
      // 2. 登录接口监控结果
      loginAttempts: loginAttempts.map((item: { ip: string; count: number; failCount: number; lastAttempt: string }) => ({
        ip: item.ip,
        count: item.count,
        failCount: item.failCount,
        failRate: item.count > 0 ? Number(((item.failCount / item.count) * 100).toFixed(1)) : 0,
        lastAttempt: item.lastAttempt,
        threatLevel: item.failCount >= 10 ? 'critical' : item.failCount >= 5 ? 'high' : 'medium'
      })),
      // 3. 连续失败检测结果
      consecutiveFails: consecutiveFails.map((item: { ip: string; consecutiveFails: number; lastFailTime: string; failModule: string }) => ({
        ip: item.ip,
        consecutiveFails: item.consecutiveFails,
        lastFailTime: item.lastFailTime,
        failModule: item.failModule,
        threatLevel: item.consecutiveFails >= 20 ? 'critical' : item.consecutiveFails >= 10 ? 'high' : 'medium'
      }))
    }
  }
}