import { Test, TestingModule } from '@nestjs/testing'
import { HttpException } from '@nestjs/common'
import { MonitorService } from './monitor.service'
import { PrismaService } from '../prisma/prisma.service'

jest.mock('../../common/tenant/tenant-context', () => ({
  getCurrentTenantId: jest.fn(() => 1),
  getRequiredTenantId: jest.fn(() => 1),
}))

const mockLog = {
  id: 1, module: 'frontend-monitor:error', action: 'click',
  description: '页面加载失败', statusCode: 500, requestData: { url: '/api/test' },
  responseData: { msg: 'error', duration: 120 }, userAgent: 'Mozilla/5.0',
  ip: '127.0.0.1', createdAt: new Date(),
}

describe('MonitorService', () => {
  let service: MonitorService
  let mockPrisma: any

  beforeEach(async () => {
    mockPrisma = {
      operationLog: {
        findMany: jest.fn().mockResolvedValue([mockLog]),
        findFirst: jest.fn().mockResolvedValue(mockLog),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue(mockLog),
      },
    }
    const module: TestingModule = await Test.createTestingModule({
      providers: [MonitorService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile()
    service = module.get<MonitorService>(MonitorService)
  })

  describe('getLogs', () => {
    it('应返回分页监控日志', async () => {
      const result = await service.getLogs({} as any)
      expect(mockPrisma.operationLog.findMany).toHaveBeenCalled()
      expect(result.records).toBeDefined()
    })

    it('应支持 module 过滤', async () => {
      await service.getLogs({ module: 'frontend' } as any)
      const call = mockPrisma.operationLog.findMany.mock.calls[0][0]
      expect(call.where.module.contains).toBeDefined()
    })

    it('应支持 statusCode 过滤', async () => {
      await service.getLogs({ statusCode: '500' } as any)
      const call = mockPrisma.operationLog.findMany.mock.calls[0][0]
      expect(call.where.statusCode).toBe(500)
    })

    it('应映射日志字段', async () => {
      const result = await service.getLogs({} as any)
      expect(result.records[0].type).toBeDefined()
      expect(result.records[0].route).toBe('/api/test')
    })
  })

  describe('getDetail', () => {
    it('应返回日志详情', async () => {
      const result = await service.getDetail('1')
      expect(result.id).toBe(1)
    })

    it('不存在时应抛出 404', async () => {
      mockPrisma.operationLog.findFirst.mockResolvedValue(null)
      await expect(service.getDetail('999')).rejects.toThrow(HttpException)
    })
  })

  describe('create', () => {
    it('应创建监控记录', async () => {
      const result = await service.create({ description: 'test error' })
      expect(mockPrisma.operationLog.create).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
  })

  describe('getStats', () => {
    it('应返回监控统计', async () => {
      const result = await service.getStats({} as any)
      expect(mockPrisma.operationLog.findMany).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
  })
})
