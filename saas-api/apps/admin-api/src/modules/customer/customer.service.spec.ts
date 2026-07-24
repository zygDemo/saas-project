import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException, BadRequestException } from '@nestjs/common'
import { CustomerService } from './customer.service'
import { PrismaService } from '../prisma/prisma.service'

jest.mock('../../common/tenant/tenant-context', () => ({
  getCurrentTenantId: jest.fn(() => 1),
}))

const mockOrganization = { id: 1, name: 'Org' }
const mockCustomer = {
  id: 1,
  orgId: 1,
  name: 'Test',
  phone: '13800138000',
  tenantId: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
}

describe('CustomerService', () => {
  let service: CustomerService
  let mockPrisma: any

  beforeEach(async () => {
    jest.clearAllMocks()
    mockPrisma = {
      customer: {
        findMany: jest.fn().mockResolvedValue([mockCustomer]),
        findFirst: jest.fn().mockResolvedValue(mockCustomer),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue(mockCustomer),
        update: jest.fn().mockResolvedValue(mockCustomer),
      },
      organization: {
        findFirst: jest.fn().mockResolvedValue(mockOrganization),
      },
      $transaction: jest.fn((arr: any) => Promise.all(arr)),
    }
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile()
    service = module.get<CustomerService>(CustomerService)
  })

  describe('getList', () => {
    it('应返回分页客户列表', async () => {
      const result = await service.getList({ name: 'Test', page: 1, pageSize: 10 } as any)
      expect(mockPrisma.customer.findMany).toHaveBeenCalled()
      expect(result.list).toEqual([mockCustomer])
      expect(result.meta.total).toBe(1)
    })
  })

  describe('getDetail', () => {
    it('应返回客户详情', async () => {
      const result = await service.getDetail(1)
      expect(result).toEqual(mockCustomer)
    })
    it('客户不存在应抛异常', async () => {
      mockPrisma.customer.findFirst = jest.fn().mockResolvedValue(null)
      await expect(service.getDetail(999)).rejects.toThrow(NotFoundException)
    })
  })

  describe('create', () => {
    it('应创建客户', async () => {
      const dto = { orgId: 1, name: 'Test', phone: '13800138000' }
      await service.create(dto as any)
      expect(mockPrisma.customer.create).toHaveBeenCalled()
    })
    it('机构不存在应抛异常', async () => {
      mockPrisma.organization.findFirst = jest.fn().mockResolvedValue(null)
      await expect(service.create({ orgId: 999, name: 'Test', phone: '13800138000' } as any)).rejects.toThrow(
        BadRequestException,
      )
    })
  })

  describe('update', () => {
    it('应更新客户', async () => {
      await service.update(1, { name: 'Updated' } as any)
      expect(mockPrisma.customer.update).toHaveBeenCalled()
    })
    it('客户不存在应抛异常', async () => {
      mockPrisma.customer.findFirst = jest.fn().mockResolvedValue(null)
      await expect(service.update(999, {} as any)).rejects.toThrow(NotFoundException)
    })
  })

  describe('remove', () => {
    it('应软删除客户', async () => {
      const result = await service.remove(1)
      expect(result).toEqual({ id: 1 })
      expect(mockPrisma.customer.update).toHaveBeenCalled()
    })
    it('客户不存在应抛异常', async () => {
      mockPrisma.customer.findFirst = jest.fn().mockResolvedValue(null)
      await expect(service.remove(999)).rejects.toThrow(NotFoundException)
    })
  })
})
