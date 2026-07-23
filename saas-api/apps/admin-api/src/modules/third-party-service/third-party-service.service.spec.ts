import { Test, TestingModule } from '@nestjs/testing'
import { BadRequestException } from '@nestjs/common'
import { ThirdPartyServiceService } from './third-party-service.service'
import { PrismaService } from '../prisma/prisma.service'

jest.mock('../../common/tenant/tenant-context', () => ({
  getCurrentTenantId: jest.fn(() => 1),
  getRequiredTenantId: jest.fn(() => 1),
}))

const mockTps = {
  id: 1, tenantId: 1, name: '短信服务', code: 'SMS', serviceType: 'COMMUNICATION',
  status: 'ACTIVE', createdAt: new Date(), updatedAt: new Date(),
}

describe('ThirdPartyServiceService', () => {
  let service: ThirdPartyServiceService
  let mockPrisma: any

  beforeEach(async () => {
    mockPrisma = {
      thirdPartyService: {
        findMany: jest.fn().mockResolvedValue([mockTps]),
        findFirst: jest.fn().mockResolvedValue(mockTps),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue(mockTps),
        update: jest.fn().mockResolvedValue(mockTps),
      },
      $transaction: jest.fn((arr: any) => Promise.all(arr)),
    }
    const module: TestingModule = await Test.createTestingModule({
      providers: [ThirdPartyServiceService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile()
    service = module.get<ThirdPartyServiceService>(ThirdPartyServiceService)
  })

  describe('getList', () => {
    it('应返回分页第三方服务列表', async () => {
      const result = await service.getList({} as any)
      expect(mockPrisma.thirdPartyService.findMany).toHaveBeenCalled()
      expect(result.records).toBeDefined()
    })

    it('应支持 keyword 搜索', async () => {
      await service.getList({ keyword: '短信' } as any)
      const call = mockPrisma.thirdPartyService.findMany.mock.calls[0][0]
      expect(call.where.OR).toBeDefined()
    })

    it('应支持 serviceType 过滤', async () => {
      await service.getList({ serviceType: 'COMMUNICATION' } as any)
      const call = mockPrisma.thirdPartyService.findMany.mock.calls[0][0]
      expect(call.where.serviceType).toBe('COMMUNICATION')
    })
  })

  describe('create', () => {
    it('应创建第三方服务', async () => {
      const result = await service.create({ name: '新服务', code: 'NEW_SVC', serviceType: 'PAYMENT' } as any)
      expect(mockPrisma.thirdPartyService.create).toHaveBeenCalled()
      expect(result).toBeDefined()
    })

    it('code 重复时应抛出 BadRequestException', async () => {
      mockPrisma.thirdPartyService.findFirst.mockResolvedValue({ id: 2, code: 'SMS' })
      await expect(service.create({ name: '重复', code: 'SMS', serviceType: 'PAYMENT' } as any))
        .rejects.toThrow(BadRequestException)
    })
  })

  describe('update', () => {
    it('应更新第三方服务', async () => {
      const result = await service.update(1, { name: '更新服务' } as any)
      expect(mockPrisma.thirdPartyService.update).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
  })
})
