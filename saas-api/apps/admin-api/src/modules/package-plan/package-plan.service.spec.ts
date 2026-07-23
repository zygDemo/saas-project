import { Test, TestingModule } from '@nestjs/testing'
import { BadRequestException } from '@nestjs/common'
import { PackagePlanService } from './package-plan.service'
import { PrismaService } from '../prisma/prisma.service'

jest.mock('../../common/tenant/tenant-context', () => ({
  getCurrentTenantId: jest.fn(() => 1),
  getRequiredTenantId: jest.fn(() => 1),
}))

const mockPkgPlan = {
  id: 1, tenantId: 1, name: '基础版', code: 'BASIC', price: 2999,
  status: 'ACTIVE', createdAt: new Date(), updatedAt: new Date(),
}

describe('PackagePlanService', () => {
  let service: PackagePlanService
  let mockPrisma: any

  beforeEach(async () => {
    mockPrisma = {
      packagePlan: {
        findMany: jest.fn().mockResolvedValue([mockPkgPlan]),
        findFirst: jest.fn().mockResolvedValue(mockPkgPlan),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue(mockPkgPlan),
        update: jest.fn().mockResolvedValue(mockPkgPlan),
      },
      $transaction: jest.fn((arr: any) => Promise.all(arr)),
    }
    const module: TestingModule = await Test.createTestingModule({
      providers: [PackagePlanService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile()
    service = module.get<PackagePlanService>(PackagePlanService)
  })

  describe('getList', () => {
    it('应返回分页套餐列表', async () => {
      const result = await service.getList({} as any)
      expect(mockPrisma.packagePlan.findMany).toHaveBeenCalled()
      expect(result.records).toBeDefined()
    })

    it('应支持 keyword 搜索', async () => {
      await service.getList({ keyword: '基础' } as any)
      const call = mockPrisma.packagePlan.findMany.mock.calls[0][0]
      expect(call.where.OR).toBeDefined()
    })

    it('应支持 status 过滤', async () => {
      await service.getList({ status: 'ACTIVE' } as any)
      const call = mockPrisma.packagePlan.findMany.mock.calls[0][0]
      expect(call.where.status).toBe('ACTIVE')
    })
  })

  describe('create', () => {
    it('应创建套餐', async () => {
      const result = await service.create({ name: '新套餐', code: 'NEW', price: 1999 } as any)
      expect(mockPrisma.packagePlan.create).toHaveBeenCalled()
      expect(result).toBeDefined()
    })

    it('编码重复时应抛出 BadRequestException', async () => {
      mockPrisma.packagePlan.findFirst.mockResolvedValue({ id: 2, code: 'BASIC' })
      await expect(service.create({ name: '重复', code: 'BASIC', price: 1999 } as any))
        .rejects.toThrow(BadRequestException)
    })
  })

  describe('update', () => {
    it('应更新套餐', async () => {
      const result = await service.update(1, { name: '更新套餐' } as any)
      expect(mockPrisma.packagePlan.update).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
  })

  describe('remove', () => {
    it('应删除套餐', async () => {
      await service.remove(1)
      expect(mockPrisma.packagePlan.update).toHaveBeenCalled()
    })
  })
})
