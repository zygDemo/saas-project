import { Test, TestingModule } from '@nestjs/testing'
import { DataCenterService } from './data-center.service'
import { PrismaService } from '../prisma/prisma.service'
import { CacheService } from '../redis/cache.service'

describe('DataCenterService', () => {
  let service: DataCenterService
  let mockPrisma: jest.Mocked<PrismaService>
  let mockCache: jest.Mocked<CacheService>

  beforeEach(async () => {
    mockPrisma = {
      application: {
        count: jest.fn(),
        aggregate: jest.fn(),
        groupBy: jest.fn(),
      },
      customer: { count: jest.fn() },
      lead: { count: jest.fn() },
      product: { count: jest.fn(), findMany: jest.fn() },
      funder: { count: jest.fn(), findMany: jest.fn() },
      disbursement: { aggregate: jest.fn() },
      repaymentPlan: { aggregate: jest.fn() },
      operationLog: {
        count: jest.fn(),
        groupBy: jest.fn(),
        findMany: jest.fn(),
      },
      $transaction: jest.fn((queries: unknown[]) => Promise.all(queries)),
      $queryRaw: jest.fn(),
    } as unknown as jest.Mocked<PrismaService>

    mockCache = {
      getOrSet: jest.fn(async (_key: string, factory: () => Promise<any>) => factory()),
    } as unknown as jest.Mocked<CacheService>

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DataCenterService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CacheService, useValue: mockCache },
      ],
    }).compile()

    service = module.get<DataCenterService>(DataCenterService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getStats', () => {
    it('应该返回统计概览数据', async () => {
      mockPrisma.application.count!.mockResolvedValue(100)
      mockPrisma.customer.count!.mockResolvedValue(50)
      mockPrisma.lead.count!.mockResolvedValue(30)
      mockPrisma.product.count!.mockResolvedValue(10)
      mockPrisma.funder.count!.mockResolvedValue(5)
      mockPrisma.application.aggregate!.mockResolvedValue({ _sum: { amount: 100000 } })
      mockPrisma.disbursement.aggregate!.mockResolvedValue({ _sum: { disburseAmount: 80000 } })
      mockPrisma.repaymentPlan.aggregate!.mockResolvedValue({ _sum: { totalAmount: 50000, paidTotal: 30000 } })
      mockPrisma.application.groupBy!.mockResolvedValue([])
      mockPrisma.product.findMany!.mockResolvedValue([])
      mockPrisma.funder.findMany!.mockResolvedValue([])
      mockPrisma.$queryRaw!.mockResolvedValue([])

      const result = await service.getStats({ startAt: '2026-01-01', endAt: '2026-12-31' })

      expect(result.overview.applicationTotal).toBe(100)
      expect(result.overview.customerTotal).toBe(50)
      expect(result.overview.leadTotal).toBe(30)
    })

    it('聚合值为 null 时应该返回 0', async () => {
      mockPrisma.application.count!.mockResolvedValue(0)
      mockPrisma.customer.count!.mockResolvedValue(0)
      mockPrisma.lead.count!.mockResolvedValue(0)
      mockPrisma.product.count!.mockResolvedValue(0)
      mockPrisma.funder.count!.mockResolvedValue(0)
      mockPrisma.application.aggregate!.mockResolvedValue({ _sum: { amount: null } })
      mockPrisma.disbursement.aggregate!.mockResolvedValue({ _sum: { disburseAmount: null } })
      mockPrisma.repaymentPlan.aggregate!.mockResolvedValue({ _sum: { totalAmount: null, paidTotal: null } })
      mockPrisma.application.groupBy!.mockResolvedValue([])
      mockPrisma.product.findMany!.mockResolvedValue([])
      mockPrisma.funder.findMany!.mockResolvedValue([])
      mockPrisma.$queryRaw!.mockResolvedValue([])

      const result = await service.getStats({})

      expect(result.overview.requestedAmount).toBe(0)
      expect(result.overview.disbursedAmount).toBe(0)
      expect(result.overview.pendingRepaymentAmount).toBe(0)
    })
  })

  describe('getHeatmapData', () => {
    it('应该返回热力图数据', async () => {
      mockPrisma.$queryRaw!.mockResolvedValue([
        { day_of_week: 1, hour: 10, count: 5 },
        { day_of_week: 2, hour: 14, count: 3 },
      ])

      const result = await service.getHeatmapData({ startAt: '2026-01-01', endAt: '2026-12-31' })

      expect(result.heatmapData).toHaveLength(168)
      expect(result.maxValue).toBe(5)
    })

    it('没有数据时 maxValue 应为 0', async () => {
      mockPrisma.$queryRaw!.mockResolvedValue([])

      const result = await service.getHeatmapData({})

      expect(result.heatmapData).toHaveLength(168)
      expect(result.maxValue).toBe(0)
    })
  })

  describe('getAuditLogs', () => {
    it('应该返回分页日志', async () => {
      mockPrisma.operationLog.findMany!.mockResolvedValue([
        { id: 1, module: 'auth', action: 'login', userName: 'admin', statusCode: 200 },
      ])
      mockPrisma.operationLog.count!.mockResolvedValue(1)

      const result = await service.getAuditLogs({ current: 1, size: 10 })

      expect(result.records).toHaveLength(1)
      expect(result.total).toBe(1)
    })

    it('status=fail 时应该过滤 statusCode >= 400', async () => {
      mockPrisma.operationLog.findMany!.mockResolvedValue([])
      mockPrisma.operationLog.count!.mockResolvedValue(0)

      await service.getAuditLogs({ status: 'fail', current: 1, size: 10 })

      expect(mockPrisma.operationLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            statusCode: { gte: 400 },
          }),
        }),
      )
    })
  })
})
