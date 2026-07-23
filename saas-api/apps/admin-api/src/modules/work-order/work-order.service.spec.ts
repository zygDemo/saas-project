import { Test, TestingModule } from '@nestjs/testing'
import { WorkOrderService } from './work-order.service'
import { PrismaService } from '../prisma/prisma.service'
import { DataScopeService } from '../../common/auth/data-scope.service'

jest.mock('../../common/tenant/tenant-context', () => ({
  getCurrentTenantId: jest.fn(() => 1),
  getCurrentUserRoles: jest.fn(() => [1]),
}))

const mockWorkOrder = {
  id: 1,
  tenantId: 1,
  title: '测试工单',
  content: '工单内容',
  orderType: 'FEEDBACK',
  priority: 'NORMAL',
  status: 'OPEN',
  creatorId: 1,
  assigneeId: null,
  resolvedAt: null,
  closedAt: null,
  remark: null,
  deletedAt: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
}

describe('WorkOrderService', () => {
  let service: WorkOrderService
  let mockPrisma: Record<string, unknown>

  beforeEach(async () => {
    mockPrisma = {
      workOrder: {
        findMany: jest.fn().mockResolvedValue([mockWorkOrder]),
        findFirst: jest.fn().mockResolvedValue(mockWorkOrder),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue(mockWorkOrder),
        update: jest.fn().mockResolvedValue(mockWorkOrder),
        delete: jest.fn().mockResolvedValue(mockWorkOrder),
      },
      user: {
        findFirst: jest.fn().mockResolvedValue({ id: 1, userName: 'admin' }),
        findMany: jest.fn().mockResolvedValue([{ id: 1 }]),
      },
      role: {
        findMany: jest.fn().mockResolvedValue([{ dataScope: 'ALL' }]),
      },
      $transaction: jest.fn((arr) => Promise.all(arr)),
    }

    const mockDataScopeService = {
      getVisibleUserIds: jest.fn().mockResolvedValue([1, 2, 3]),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkOrderService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: DataScopeService, useValue: mockDataScopeService },
      ],
    }).compile()

    service = module.get<WorkOrderService>(WorkOrderService)
  })

  describe('getList', () => {
    it('应返回分页工单列表', async () => {
      const result = await service.getList({ page: 1, size: 10 } as any)
      expect(mockPrisma.workOrder.findMany).toHaveBeenCalled()
      expect(mockPrisma.workOrder.count).toHaveBeenCalled()
      expect(result).toBeDefined()
    })

    it('应支持关键词搜索', async () => {
      await service.getList({ keyword: '测试' } as any)
      const call = mockPrisma.workOrder.findMany.mock.calls[0][0]
      expect(call.where.OR).toBeDefined()
    })

    it('应支持状态过滤', async () => {
      await service.getList({ status: 'OPEN' } as any)
      const call = mockPrisma.workOrder.findMany.mock.calls[0][0]
      expect(call.where.status).toBe('OPEN')
    })

    it('应支持类型过滤', async () => {
      await service.getList({ orderType: 'BUG' } as any)
      const call = mockPrisma.workOrder.findMany.mock.calls[0][0]
      expect(call.where.orderType).toBe('BUG')
    })

    it('应支持优先级过滤', async () => {
      await service.getList({ priority: 'HIGH' } as any)
      const call = mockPrisma.workOrder.findMany.mock.calls[0][0]
      expect(call.where.priority).toBe('HIGH')
    })
  })

  describe('getDetail', () => {
    it('应返回工单详情', async () => {
      const result = await service.getDetail(1)
      expect(result).toEqual(mockWorkOrder)
    })

    it('工单不存在时应抛出异常', async () => {
      mockPrisma.workOrder.findFirst.mockResolvedValue(null)
      await expect(service.getDetail(999)).rejects.toThrow('数据不存在')
    })
  })

  describe('create', () => {
    it('应创建工单', async () => {
      const dto = {
        title: '新工单',
        content: '描述',
        orderType: 'FEEDBACK',
        priority: 'NORMAL',
      }
      await service.create(dto as any)
      expect(mockPrisma.workOrder.create).toHaveBeenCalled()
    })

    it('创建人不存在时应抛出异常', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null)
      const dto = { title: '新工单', creatorId: 999 }
      await expect(service.create(dto as any)).rejects.toThrow()
    })

    it('处理人不存在时应抛出异常', async () => {
      mockPrisma.user.findFirst.mockResolvedValueOnce(null)
      const dto = { title: '新工单', assigneeId: 999 }
      await expect(service.create(dto as any)).rejects.toThrow()
    })
  })

  describe('update', () => {
    it('应更新工单', async () => {
      const dto = { title: '更新标题' }
      await service.update(1, dto as any)
      expect(mockPrisma.workOrder.update).toHaveBeenCalled()
    })

    it('工单不存在时应抛出异常', async () => {
      mockPrisma.workOrder.findFirst.mockResolvedValue(null)
      await expect(service.update(999, {} as any)).rejects.toThrow()
    })
  })

  describe('remove', () => {
    it('应删除工单', async () => {
      await service.remove(1)
      expect(mockPrisma.workOrder.update).toHaveBeenCalled()
    })

    it('工单不存在时应抛出异常', async () => {
      mockPrisma.workOrder.findFirst.mockResolvedValue(null)
      await expect(service.remove(999)).rejects.toThrow()
    })
  })
})
