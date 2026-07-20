import { HttpException, Injectable } from '@nestjs/common'
import { PaginatedResponse } from '../../common/types/pagination'
import { getPagination, toPaginatedResponse } from '../../common/utils/pagination'
import { PrismaService } from '../../modules/prisma/prisma.service'
import { MonitorLogQueryDto, MonitorStatsQueryDto } from './dto/monitor.dto'

@Injectable()
export class MonitorService {
  constructor(private readonly prisma: PrismaService) {}

  async getLogs(query: MonitorLogQueryDto): Promise<PaginatedResponse<unknown>> {
    const pagination = getPagination(query)
    const where: Record<string, unknown> = {}

    if (query.module) {
      where.module = { contains: query.module, mode: 'insensitive' }
    }
    if (query.type) {
      where.module = { ...(where.module as object), equals: `frontend-monitor:${query.type}` }
    }
    if (query.event) {
      where.description = { contains: query.event, mode: 'insensitive' }
    }
    if (query.statusCode) {
      where.statusCode = Number(query.statusCode)
    }
    if (query.startTime || query.endTime) {
      const createdAt: Record<string, Date> = {}
      if (query.startTime) createdAt.gte = new Date(query.startTime)
      if (query.endTime) createdAt.lte = new Date(query.endTime)
      where.createdAt = createdAt
    }

    const [records, total] = await this.prisma.$transaction([
      this.prisma.operationLog.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.operationLog.count({ where }),
    ])

    return toPaginatedResponse(
      records.map((item: Record<string, unknown>) => ({
        id: item.id,
        type: this.inferType(item.module, item.statusCode),
        module: item.module,
        event: item.description || 'unknown',
        message: (item.responseData as { msg?: string } | null)?.msg || item.description,
        page: this.extractPage(item.requestData),
        route: (item.requestData as { url?: string } | null)?.url,
        statusCode: item.statusCode,
        duration: (item.responseData as { duration?: number } | null)?.duration,
        stack: (item.responseData as { stack?: string } | null)?.stack,
        userAgent: item.userAgent,
        ip: item.ip,
        createdAt: item.createdAt,
      })),
      total,
      pagination
    )
  }

  async getDetail(id: string) {
    const item = await this.prisma.operationLog.findFirst({ where: { id: Number(id) } })
    if (!item) {
      throw new HttpException('监控记录不存在', 404)
    }
    return {
      id: item.id,
      module: item.module,
      action: item.action,
      description: item.description,
      statusCode: item.statusCode,
      ip: item.ip,
      userAgent: item.userAgent,
      requestData: item.requestData,
      responseData: item.responseData,
      createdAt: item.createdAt,
    }
  }

  async create(body: Record<string, unknown>) {
    const payload = body as Record<string, unknown>

    const module = `frontend-monitor:${(payload.type as string) || 'unknown'}`
    const description = (payload.event as string) || (payload.message as string) || 'frontend-event'

    const log = await this.prisma.operationLog.create({
      data: {
        module,
        action: (payload.source as string) || 'FRONTEND',
        description,
        statusCode: Number((payload.statusCode as number) || 200),
        requestData: {
          url: (payload.url as string) || undefined,
          route: (payload.route as string) || undefined,
          page: (payload.page as string) || undefined,
          params: (payload.params as Record<string, unknown>) || undefined,
          userAgent: (payload.userAgent as string) || undefined,
        },
        responseData: {
          message: (payload.message as string) || undefined,
          stack: (payload.stack as string) || undefined,
          duration: Number((payload.duration as number) || 0),
          raw: payload.raw as object,
        },
        ip: (payload.ip as string) || '-',
        userAgent: (payload.userAgent as string) || undefined,
      },
    })

    return { id: log.id }
  }

  async getStats(query: MonitorStatsQueryDto) {
    const now = new Date()
    const defaultFrom = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
    const from = query.startTime || defaultFrom

    const baseWhere: Record<string, unknown> = {
      createdAt: { gte: new Date(from) },
    }
    if (query.module) {
      baseWhere.module = { contains: query.module, mode: 'insensitive' }
    }

    const [total, errorTotal, sourceBreakdown] = await this.prisma.$transaction([
      this.prisma.operationLog.count({ where: baseWhere }),
      this.prisma.operationLog.count({
        where: { ...baseWhere, statusCode: { gte: 400 } },
      }),
      this.prisma.operationLog.groupBy({
        by: ['action'],
        where: baseWhere,
        _count: { action: true },
      }),
    ])

    return {
      total,
      errorTotal,
      sourceBreakdown: sourceBreakdown.map((item: Record<string, unknown>) => ({
        source: item.action,
        count: item._count.action,
      })),
      from,
      to: now.toISOString(),
    }
  }

  private inferType(module?: string, statusCode?: number): string {
    if (!module) return 'unknown'
    if (module.includes('frontend-monitor:error')) return 'error'
    if (module.includes('frontend-monitor:performance')) return 'performance'
    if (module.includes('frontend-monitor:action')) return 'action'
    if (module.includes('api')) return 'request'
    if ((statusCode || 0) >= 400) return 'request-error'
    return 'request'
  }

  private extractPage(requestData?: Record<string, unknown>): string | undefined {
    if (!requestData) return undefined
    const page = requestData.page as string | undefined
    if (page) return page
    const route = requestData.route as string | undefined
    if (route) return route
    return undefined
  }
}
