import { Test, TestingModule } from '@nestjs/testing'
import { DataCenterService } from './data-center.service'
import { PrismaService } from '../prisma/prisma.service'
import { CacheService } from '../redis/cache.service'

jest.mock('../../common/tenant/tenant-context', () => ({
  getCurrentTenantId: jest.fn(() => 1),
}))

const createMockModel = () => ({
  findMany: jest.fn().mockResolvedValue([]),
  findFirst: jest.fn().mockResolvedValue(null),
  count: jest.fn().mockResolvedValue(0),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  aggregate: jest.fn().mockResolvedValue({ _sum: {} }),
  groupBy: jest.fn().mockResolvedValue([]),
  updateMany: jest.fn().mockResolvedValue({ count: 0 }),
})

describe('DataCenterService', () => {
  let service: DataCenterService
  let mockPrisma: any
  let mockCache: CacheService

  beforeEach(async () => {
    jest.clearAllMocks()
    mockPrisma = {
      application: createMockModel(),
      customer: createMockModel(),
      lead: createMockModel(),
      product: { ...createMockModel(), findMany: jest.fn().mockResolvedValue([]) },
      funder: { ...createMockModel(), findMany: jest.fn().mockResolvedValue([]) },
      disbursement: createMockModel(),
      repaymentPlan: createMockModel(),
      operationLog: createMockModel(),
      $transaction: jest.fn((arr: any) => Promise.all(arr)),
      $queryRaw: jest.fn().mockResolvedValue([]),
    }
    mockCache = {
      getOrSet: jest.fn((key: any, factory: any, ttl?: any) => factory()),
    } as unknown as CacheService

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DataCenterService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CacheService, useValue: mockCache },
      ],
    }).compile()
    service = module.get<DataCenterService>(DataCenterService)
  })

  describe('getStats', () => {
    it('应返回统计数据', async () => {
      const result = await service.getStats({} as any)
      expect(result.overview).toBeDefined()
      expect(result.phases).toBeDefined()
      expect(result.products).toBeDefined()
    })
  })

  describe('getHeatmapData', () => {
    it('应返回热力图数据', async () => {
      const result = await service.getHeatmapData({} as any)
      expect(result.heatmapData).toHaveLength(7 * 24)
      expect(result.maxValue).toBeDefined()
    })
  })

  describe('getAuditLogs', () => {
    it('应返回分页审计日志', async () => {
      mockPrisma.operationLog.findMany = jest.fn().mockResolvedValue([
        {
          id: 1,
          module: 'auth',
          action: 'login',
          userName: 'admin',
          statusCode: 200,
          requestData: null,
          responseData: null,
          createdAt: new Date(),
        },
      ])
      mockPrisma.operationLog.count = jest.fn().mockResolvedValue(1)
      const result = await service.getAuditLogs({ page: 1, pageSize: 10 } as any)
      expect(result.list).toHaveLength(1)
      expect(result.meta.total).toBe(1)
    })
    it('应支持关键字搜索', async () => {
      await service.getAuditLogs({ keyword: 'test', page: 1, pageSize: 10 } as any)
      const call = mockPrisma.operationLog.findMany.mock.calls[0][0]
      expect(call.where.OR).toBeDefined()
    })
  })

  describe('getAuditLogStats', () => {
    it('应返回审计统计', async () => {
      mockPrisma.operationLog.count = jest.fn().mockResolvedValue(10)
      mockPrisma.operationLog.groupBy = jest.fn().mockResolvedValue([])
      const result = await service.getAuditLogStats({} as any)
      expect(result.total).toBe(10)
      expect(result.hourly).toHaveLength(24)
    })
  })
})
