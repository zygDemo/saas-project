import { Test, TestingModule } from '@nestjs/testing'
import { BadRequestException } from '@nestjs/common'
import { FunderService } from './funder.service'
import { PrismaService } from '../prisma/prisma.service'

jest.mock('../../common/tenant/tenant-context', () => ({
  getCurrentTenantId: jest.fn(() => 1),
}))

const mockFunder = {
  id: 1, tenantId: 1, orgId: 1, name: '银行A', code: 'BANK_A',
  funderType: 'BANK', contactName: '张三', contactPhone: '13800000000',
  integrationMode: 'API', creditLimit: 1000000, priority: 1,
  status: 'ACTIVE', createdAt: new Date(), updatedAt: new Date(),
}

describe('FunderService', () => {
  let service: FunderService
  let mockPrisma: Record<string, unknown>

  beforeEach(async () => {
    mockPrisma = {
      funder: {
        findMany: jest.fn().mockResolvedValue([mockFunder]),
        findFirst: jest.fn().mockResolvedValue(mockFunder),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue(mockFunder),
        update: jest.fn().mockResolvedValue(mockFunder),
      },
      organization: { findFirst: jest.fn().mockResolvedValue({ id: 1 }) },
      $transaction: jest.fn((arr) => Promise.all(arr)),
    }
    const module: TestingModule = await Test.createTestingModule({
      providers: [FunderService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile()
    service = module.get<FunderService>(FunderService)
  })

  describe('getList', () => {
    it('应返回分页资方列表', async () => {
      const result = await service.getList({} as any)
      expect(mockPrisma.funder.findMany).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('应支持名称/编码搜索', async () => {
      await service.getList({ keyword: '银行' } as any)
      const call = mockPrisma.funder.findMany.mock.calls[0][0]
      expect(call.where.OR).toBeDefined()
    })
  })

  describe('getDetail', () => {
    it('应返回资方详情', async () => {
      const result = await service.getDetail(1)
      expect(result).toEqual(mockFunder)
    })
    it('资方不存在时应抛出异常', async () => {
      mockPrisma.funder.findFirst.mockResolvedValue(null)
      await expect(service.getDetail(999)).rejects.toThrow('数据不存在')
    })
  })

  describe('create', () => {
    it('应创建资方', async () => {
      await service.create({ orgId: 1, name: '新资方', code: 'NEW', funderType: 'BANK' } as any)
      expect(mockPrisma.funder.create).toHaveBeenCalled()
    })
    it('机构不存在时应抛出异常', async () => {
      mockPrisma.organization.findFirst.mockResolvedValue(null)
      await expect(service.create({ orgId: 999, name: 'X', code: 'X', funderType: 'BANK' } as any)).rejects.toThrow()
    })
    it('同一机构下编码重复时应抛出异常', async () => {
      mockPrisma.funder.findFirst.mockResolvedValue({ id: 2, orgId: 1, code: 'BANK_A' })
      await expect(service.create({ orgId: 1, name: 'X', code: 'BANK_A', funderType: 'BANK' } as any)).rejects.toThrow(BadRequestException)
    })
  })

  describe('update', () => {
    it('应更新资方', async () => {
      await service.update(1, { name: '更新名称' } as any)
      expect(mockPrisma.funder.update).toHaveBeenCalled()
    })
  })

  describe('remove', () => {
    it('应删除资方', async () => {
      await service.remove(1)
      expect(mockPrisma.funder.update).toHaveBeenCalled()
    })
  })
})
