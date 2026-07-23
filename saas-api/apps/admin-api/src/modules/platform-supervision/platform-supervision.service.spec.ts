import { Test, TestingModule } from '@nestjs/testing'
import { PlatformSupervisionService } from './platform-supervision.service'
import { PrismaService } from '../prisma/prisma.service'

jest.mock('../../common/tenant/tenant-context', () => ({
  getCurrentTenantId: jest.fn(() => 1),
  getRequiredTenantId: jest.fn(() => 1),
}))

const mockOrg = {
  id: 1, name: '测试机构', code: 'TEST001', status: 'ACTIVE',
  packageType: 'ENTERPRISE', expireAt: new Date('2026-12-31'),
}

describe('PlatformSupervisionService', () => {
  let service: PlatformSupervisionService
  let mockPrisma: Record<string, unknown>

  beforeEach(async () => {
    mockPrisma = {
      organization: {
        findMany: jest.fn().mockResolvedValue([mockOrg]),
        count: jest.fn().mockResolvedValue(1),
      },
      application: {
        groupBy: jest.fn().mockResolvedValue([{ orgId: 1, _count: { id: 10 } }]),
      },
      lead: {
        groupBy: jest.fn().mockResolvedValue([{ orgId: 1, _count: { id: 5 } }]),
      },
      disbursement: {
        aggregate: jest.fn().mockResolvedValue({ _sum: { disburseAmount: 100000 } }),
      },
      user: { count: jest.fn().mockResolvedValue(20) },
      product: { count: jest.fn().mockResolvedValue(5) },
      productTemplate: { count: jest.fn().mockResolvedValue(3) },
      thirdPartyService: { count: jest.fn().mockResolvedValue(2) },
      workOrder: { count: jest.fn().mockResolvedValue(1) },
    }
    const module: TestingModule = await Test.createTestingModule({
      providers: [PlatformSupervisionService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile()
    service = module.get<PlatformSupervisionService>(PlatformSupervisionService)
  })

  describe('getStats', () => {
    it('应返回平台监管统计列表', async () => {
      const result = await service.getStats({} as any)
      expect(mockPrisma.organization.findMany).toHaveBeenCalled()
      expect(result.records).toBeDefined()
      expect(result.records[0].orgName).toBe('测试机构')
    })

    it('应包含申请数/线索数/放款金额', async () => {
      const result = await service.getStats({} as any)
      expect(result.records[0].totalApplications).toBe(10)
      expect(result.records[0].leadCount).toBe(5)
      expect(result.records[0].disbursedAmount).toBe(100000)
    })

    it('应支持分页', async () => {
      await service.getStats({ page: 1, pageSize: 10 } as any)
      const call = mockPrisma.organization.findMany.mock.calls[0][0]
      expect(call.skip).toBe(0)
      expect(call.take).toBe(10)
    })
  })

  describe('getOverview', () => {
    it('应返回平台概览统计', async () => {
      const result = await service.getOverview()
      expect(result.totalOrgs).toBe(1)
      expect(result.totalUsers).toBe(20)
      expect(result.totalApplications).toBeDefined()
    })
  })
})
