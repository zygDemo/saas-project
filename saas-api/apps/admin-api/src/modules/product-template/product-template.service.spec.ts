import { Test, TestingModule } from '@nestjs/testing'
import { BadRequestException } from '@nestjs/common'
import { ProductTemplateService } from './product-template.service'
import { PrismaService } from '../prisma/prisma.service'

jest.mock('../../common/tenant/tenant-context', () => ({
  getCurrentTenantId: jest.fn(() => 1),
  getRequiredTenantId: jest.fn(() => 1),
}))

const mockTpl = {
  id: 1, tenantId: 1, name: '默认模板', productType: 'CAR',
  minRate: 5, maxRate: 15, minAmount: 10000, maxAmount: 500000, minTerm: 6, maxTerm: 36,
  status: 'ACTIVE', createdAt: new Date(), updatedAt: new Date(),
}

describe('ProductTemplateService', () => {
  let service: ProductTemplateService
  let mockPrisma: any

  beforeEach(async () => {
    mockPrisma = {
      productTemplate: {
        findMany: jest.fn().mockResolvedValue([mockTpl]),
        findFirst: jest.fn().mockResolvedValue(mockTpl),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue(mockTpl),
        update: jest.fn().mockResolvedValue(mockTpl),
      },
      $transaction: jest.fn((arr: any) => Promise.all(arr)),
    }
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductTemplateService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile()
    service = module.get<ProductTemplateService>(ProductTemplateService)
  })

  describe('getList', () => {
    it('应返回分页模板列表', async () => {
      const result = await service.getList({} as any)
      expect(mockPrisma.productTemplate.findMany).toHaveBeenCalled()
      expect(result.records).toBeDefined()
    })

    it('应支持 keyword 搜索', async () => {
      await service.getList({ keyword: '默认' } as any)
      const call = mockPrisma.productTemplate.findMany.mock.calls[0][0]
      expect(call.where.OR).toBeDefined()
    })

    it('应支持 productType 过滤', async () => {
      await service.getList({ productType: 'CAR' } as any)
      const call = mockPrisma.productTemplate.findMany.mock.calls[0][0]
      expect(call.where.productType).toBe('CAR')
    })
  })

  describe('create', () => {
    it('应创建模板', async () => {
      const result = await service.create({ name: '新模板', productType: 'CAR', minRate: 3, maxRate: 10, minAmount: 5000, maxAmount: 200000, minTerm: 3, maxTerm: 24 } as any)
      expect(mockPrisma.productTemplate.create).toHaveBeenCalled()
      expect(result).toBeDefined()
    })

    it('minRate > maxRate 时应抛出异常', async () => {
      await expect(service.create({ name: 'X', productType: 'CAR', minRate: 10, maxRate: 5, minAmount: 1000, maxAmount: 5000, minTerm: 3, maxTerm: 12 } as any))
        .rejects.toThrow(BadRequestException)
    })

    it('minAmount > maxAmount 时应抛出异常', async () => {
      await expect(service.create({ name: 'X', productType: 'CAR', minRate: 3, maxRate: 10, minAmount: 500000, maxAmount: 10000, minTerm: 3, maxTerm: 12 } as any))
        .rejects.toThrow(BadRequestException)
    })

    it('minTerm > maxTerm 时应抛出异常', async () => {
      await expect(service.create({ name: 'X', productType: 'CAR', minRate: 3, maxRate: 10, minAmount: 1000, maxAmount: 5000, minTerm: 24, maxTerm: 3 } as any))
        .rejects.toThrow(BadRequestException)
    })
  })

  describe('update', () => {
    it('应更新模板', async () => {
      const result = await service.update(1, { name: '更新模板' } as any)
      expect(mockPrisma.productTemplate.update).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
  })
})
