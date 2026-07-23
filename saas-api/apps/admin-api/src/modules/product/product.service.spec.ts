import { Test, TestingModule } from '@nestjs/testing'
import { BadRequestException } from '@nestjs/common'
import { ProductService } from './product.service'
import { PrismaService } from '../prisma/prisma.service'

jest.mock('../../common/tenant/tenant-context', () => ({
  getCurrentTenantId: jest.fn(() => 1),
}))

const mockProduct = {
  id: 1, tenantId: 1, orgId: 1, name: '车抵贷A', productType: 'MORTGAGE',
  minRate: 0.036, maxRate: 0.072, minAmount: 50000, maxAmount: 500000,
  minTerm: 6, maxTerm: 36, repaymentMethod: 'EQUAL_INSTALLMENT',
  status: 'ACTIVE', createdAt: new Date(), updatedAt: new Date(),
}

describe('ProductService', () => {
  let service: ProductService
  let mockPrisma: Record<string, unknown>

  beforeEach(async () => {
    mockPrisma = {
      product: {
        findMany: jest.fn().mockResolvedValue([mockProduct]),
        findFirst: jest.fn().mockResolvedValue(mockProduct),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue(mockProduct),
        update: jest.fn().mockResolvedValue(mockProduct),
      },
      organization: { findFirst: jest.fn().mockResolvedValue({ id: 1, name: '机构A' }) },
      $transaction: jest.fn((arr) => Promise.all(arr)),
    }
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile()
    service = module.get<ProductService>(ProductService)
  })

  describe('getList', () => {
    it('应返回分页产品列表', async () => {
      const result = await service.getList({} as any)
      expect(mockPrisma.product.findMany).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('应支持名称搜索', async () => {
      await service.getList({ keyword: '车抵贷' } as any)
      const call = mockPrisma.product.findMany.mock.calls[0][0]
      expect(call.where.OR).toBeDefined()
    })
    it('应支持精确字段过滤', async () => {
      await service.getList({ orgId: 1, productType: 'MORTGAGE' } as any)
      const call = mockPrisma.product.findMany.mock.calls[0][0]
      expect(call.where.orgId).toBe(1)
    })
  })

  describe('getDetail', () => {
    it('应返回产品详情', async () => {
      const result = await service.getDetail(1)
      expect(result).toEqual(mockProduct)
    })
    it('产品不存在时应抛出异常', async () => {
      mockPrisma.product.findFirst.mockResolvedValue(null)
      await expect(service.getDetail(999)).rejects.toThrow('数据不存在')
    })
  })

  describe('create', () => {
    it('应创建产品', async () => {
      await service.create({ orgId: 1, name: '新产品', productType: 'MORTGAGE', minRate: 0.03, maxRate: 0.06, minAmount: 10000, maxAmount: 100000, minTerm: 6, maxTerm: 24, repaymentMethod: 'EQUAL_INSTALLMENT' } as any)
      expect(mockPrisma.product.create).toHaveBeenCalled()
    })
    it('机构不存在时应抛出异常', async () => {
      mockPrisma.organization.findFirst.mockResolvedValue(null)
      await expect(service.create({ orgId: 999 } as any)).rejects.toThrow()
    })
    it('最高金额小于最低金额时应抛出异常', async () => {
      await expect(service.create({ orgId: 1, minAmount: 100000, maxAmount: 50000 } as any)).rejects.toThrow(BadRequestException)
    })
    it('最长期限小于最短期限时应抛出异常', async () => {
      await expect(service.create({ orgId: 1, minTerm: 36, maxTerm: 6 } as any)).rejects.toThrow(BadRequestException)
    })
    it('最高利率小于最低利率时应抛出异常', async () => {
      await expect(service.create({ orgId: 1, minRate: 0.1, maxRate: 0.01 } as any)).rejects.toThrow(BadRequestException)
    })
  })

  describe('update', () => {
    it('应更新产品', async () => {
      await service.update(1, { name: '更新名称' } as any)
      expect(mockPrisma.product.update).toHaveBeenCalled()
    })
  })

  describe('remove', () => {
    it('应删除产品', async () => {
      await service.remove(1)
      expect(mockPrisma.product.update).toHaveBeenCalled()
    })
  })
})
