import { Test, TestingModule } from '@nestjs/testing'
import { BadRequestException } from '@nestjs/common'
import { OrganizationService } from './org.service'
import { PrismaService } from '../prisma/prisma.service'
import { CacheService } from '../redis/cache.service'

jest.mock('../../common/tenant/tenant-context', () => ({
  getCurrentTenantId: jest.fn(() => 1),
}))

const mockOrg = {
  id: 1, tenantId: 1, name: '总公司', code: 'HQ', creditCode: '91310000MA1FL8XH4B',
  contactName: '张三', contactPhone: '13800000000', status: 'ACTIVE',
  createdAt: new Date(), updatedAt: new Date(),
  _count: { departments: 3, products: 5, funders: 2, customers: 100, applications: 50 },
}

describe('OrganizationService', () => {
  let service: OrganizationService
  let mockPrisma: Record<string, unknown>
  let mockCache: Record<string, unknown>

  beforeEach(async () => {
    mockPrisma = {
      organization: {
        findMany: jest.fn().mockResolvedValue([mockOrg]),
        findFirst: jest.fn().mockResolvedValue(mockOrg),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue(mockOrg),
        update: jest.fn().mockResolvedValue(mockOrg),
      },
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
        OrganizationService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CacheService, useValue: mockCache },
      ],
    }).compile()
    service = module.get<OrganizationService>(OrganizationService)
  })

  describe('getList', () => {
    it('应返回分页机构列表', async () => {
      const result = await service.getList({} as any)
      expect(mockPrisma.organization.findMany).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('应支持关键词搜索（名称/编码/信用代码/联系人/电话）', async () => {
      await service.getList({ keyword: '总公司' } as any)
      const call = mockPrisma.organization.findMany.mock.calls[0][0]
      expect(call.where.OR).toBeDefined()
      expect(call.where.OR.length).toBe(5)
    })
    it('应支持名称精确搜索', async () => {
      await service.getList({ name: '总公司' } as any)
      const call = mockPrisma.organization.findMany.mock.calls[0][0]
      expect(call.where.name).toBeDefined()
    })
  })

  describe('getDetail', () => {
    it('应返回机构详情（含部门/产品/资方）', async () => {
      const result = await service.getDetail(1)
      expect(result).toEqual(mockOrg)
    })
    it('机构不存在应抛异常', async () => {
      mockPrisma.organization.findFirst.mockResolvedValue(null)
      await expect(service.getDetail(999)).rejects.toThrow('数据不存在')
    })
  })

  describe('create', () => {
    it('应创建机构', async () => {
      mockPrisma.organization.findFirst.mockResolvedValue(null) // 编码不存在
      await service.create({ name: '新机构', code: 'NEW', creditCode: '91310000NEW' } as any)
      expect(mockPrisma.organization.create).toHaveBeenCalled()
    })
    it('编码重复应抛异常', async () => {
      // ensureUniqueCode 会检查
      mockPrisma.organization.findFirst.mockResolvedValueOnce(mockOrg)
      await expect(service.create({ name: 'X', code: 'HQ' } as any)).rejects.toThrow(BadRequestException)
    })
  })

  describe('update', () => {
    it('应更新机构', async () => {
      await service.update(1, { name: '更新名称' } as any)
      expect(mockPrisma.organization.update).toHaveBeenCalled()
    })
  })

  describe('remove', () => {
    it('应删除机构', async () => {
      await service.remove(1)
      expect(mockPrisma.organization.update).toHaveBeenCalled()
    })
  })

  describe('enable', () => {
    it('应启用机构', async () => {
      await service.enable(1)
      expect(mockPrisma.organization.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'ACTIVE' } })
      )
    })
    it('机构不存在应抛异常', async () => {
      mockPrisma.organization.findFirst.mockResolvedValue(null)
      await expect(service.enable(999)).rejects.toThrow()
    })
  })

  describe('disable', () => {
    it('应禁用机构', async () => {
      await service.disable(1)
      expect(mockPrisma.organization.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'INACTIVE' } })
      )
    })
    it('机构不存在应抛异常', async () => {
      mockPrisma.organization.findFirst.mockResolvedValue(null)
      await expect(service.disable(999)).rejects.toThrow()
    })
  })

  describe('校验', () => {
    it('信用代码重复应抛异常', async () => {
      mockPrisma.organization.findFirst.mockResolvedValue(mockOrg)
      await expect(service.create({ name: 'X', code: 'NEW', creditCode: '91310000MA1FL8XH4B' } as any)).rejects.toThrow(BadRequestException)
    })
  })
})
