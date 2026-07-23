import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException } from '@nestjs/common'
import { DeptService } from './dept.service'
import { PrismaService } from '../prisma/prisma.service'

jest.mock('../../common/tenant/tenant-context', () => ({
  getCurrentTenantId: jest.fn(() => 1),
  getRequiredTenantId: jest.fn(() => 1),
}))

const mockDept = {
  id: 1, tenantId: 1, orgId: 1, parentId: null, name: '技术部',
  managerId: 1, sort: 1, status: 'ACTIVE', createdAt: new Date(), updatedAt: new Date(),
  parent: null, org: { id: 1, name: '总部' },
}

const mockManager = {
  id: 1, nickName: '张三', userName: 'zhangsan', phone: '13800000000',
}

describe('DeptService', () => {
  let service: DeptService
  let mockPrisma: Record<string, unknown>

  beforeEach(async () => {
    mockPrisma = {
      department: {
        findMany: jest.fn().mockResolvedValue([mockDept]),
        findFirst: jest.fn().mockResolvedValue(mockDept),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue(mockDept),
        update: jest.fn().mockResolvedValue(mockDept),
      },
      user: {
        findMany: jest.fn().mockResolvedValue([mockManager]),
      },
      $transaction: jest.fn((arr: unknown[]) => Promise.all(arr)),
    }
    const module: TestingModule = await Test.createTestingModule({
      providers: [DeptService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile()
    service = module.get<DeptService>(DeptService)
  })

  describe('getList', () => {
    it('应返回分页部门列表', async () => {
      const result = await service.getList({} as any)
      expect(mockPrisma.department.findMany).toHaveBeenCalled()
      expect(result).toBeDefined()
      expect(result.records).toBeDefined()
    })

    it('应填充负责人信息', async () => {
      const result = await service.getList({} as any)
      expect(mockPrisma.user.findMany).toHaveBeenCalled()
      expect(result.records[0].managerName).toBe('张三')
    })

    it('应支持 orgId 过滤', async () => {
      await service.getList({ orgId: '1' } as any)
      const call = mockPrisma.department.findMany.mock.calls[0][0]
      expect(call.where.orgId).toBe(1)
    })
  })

  describe('getTree', () => {
    it('应返回部门树', async () => {
      const result = await service.getTree()
      expect(mockPrisma.department.findMany).toHaveBeenCalled()
      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('create', () => {
    it('应创建部门', async () => {
      const result = await service.create({ name: '新部门', orgId: 1 } as any)
      expect(mockPrisma.department.create).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
  })

  describe('update', () => {
    it('应更新部门', async () => {
      const result = await service.update(1, { name: '更新部门' } as any)
      expect(mockPrisma.department.update).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
  })

  describe('remove', () => {
    it('应删除部门', async () => {
      await service.remove(1)
      expect(mockPrisma.department.update).toHaveBeenCalled()
    })
  })
})
