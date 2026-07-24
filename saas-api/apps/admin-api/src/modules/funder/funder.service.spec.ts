import { Test, TestingModule } from '@nestjs/testing'
import { BadRequestException } from '@nestjs/common'
import { FunderService } from './funder.service'
import { PrismaService } from '../prisma/prisma.service'
import { CacheService } from '../redis/cache.service'

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
  let mockCache: Record<string, unknown>

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
    mockCache = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn(),
      del: jest.fn(),
      delByPrefix: jest.fn(),
      getOrSet: jest.fn((_key, factory) => factory()),
    }
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FunderService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CacheService, useValue: mockCache },
      ],
    }).compile()
    service = module.get<FunderService>(FunderService)
  })

  describe('getList', () => {
    it('应返回分页资方列表', async () => {
      const result = await service.getList({} as any)
      expect(mockPrisma.funder.findMany).toHaveBeenCalled()
      expect(result.list).toHaveLength(1)
      expect(result.meta.total).toBe(1)
    })
    it('应支持名称/编码模糊搜索', async () => {
      await service.getList({ name: '银行' } as any)
      const nameCall = mockPrisma.funder.findMany.mock.calls[0][0]
      expect(nameCall.where.name).toEqual({ contains: '银行', mode: 'insensitive' })

      await service.getList({ code: 'BANK' } as any)
      const codeCall = mockPrisma.funder.findMany.mock.calls[1][0]
      expect(codeCall.where.code).toEqual({ contains: 'BANK', mode: 'insensitive' })
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
      mockPrisma.funder.findFirst = jest.fn().mockResolvedValue(null)
      await service.create({ orgId: 1, name: '新资方', code: 'NEW', funderType: 'BANK' } as any)
      expect(mockPrisma.funder.create).toHaveBeenCalled()
    })
    it('机构不存在时应抛出异常', async () => {
      mockPrisma.funder.findFirst = jest.fn().mockResolvedValue(null)
      mockPrisma.organization.findFirst = jest.fn().mockResolvedValue(null)
      await expect(service.create({ orgId: 999, name: 'X', code: 'X', funderType: 'BANK' } as any)).rejects.toThrow()
    })
    it('同一机构下编码重复时应抛出异常', async () => {
      mockPrisma.funder.findFirst = jest.fn().mockResolvedValue({ id: 2, orgId: 1, code: 'BANK_A' })
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
