import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException, BadRequestException } from '@nestjs/common'
import { SigningService } from './signing.service'
import { PrismaService } from '../prisma/prisma.service'

jest.mock('../../common/tenant/tenant-context', () => ({
  getCurrentTenantId: jest.fn(() => 1),
}))

const mockApplication = { id: 1, applicationNo: 'APP001', tenantId: 1 }
const mockSignRecord = {
  id: 1,
  signingCode: 'SIG001',
  applicationId: 1,
  customerName: 'Test',
  tenantId: 1,
  status: 'PENDING',
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('SigningService', () => {
  let service: SigningService
  let mockPrisma: any

  beforeEach(async () => {
    jest.clearAllMocks()
    mockPrisma = {
      signRecord: {
        findMany: jest.fn().mockResolvedValue([mockSignRecord]),
        findFirst: jest.fn().mockResolvedValue(mockSignRecord),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue(mockSignRecord),
        update: jest.fn().mockResolvedValue(mockSignRecord),
        delete: jest.fn().mockResolvedValue(mockSignRecord),
      },
      application: {
        findFirst: jest.fn().mockResolvedValue(mockApplication),
        update: jest.fn().mockResolvedValue(mockApplication),
      },
      $transaction: jest.fn((arr: any) => Promise.all(arr)),
    }
    const module: TestingModule = await Test.createTestingModule({
      providers: [SigningService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile()
    service = module.get<SigningService>(SigningService)
  })

  describe('getList', () => {
    it('应返回分页签约列表', async () => {
      const result = await service.getList({ status: 'PENDING', page: 1, pageSize: 10 } as any)
      expect(mockPrisma.signRecord.findMany).toHaveBeenCalled()
      expect(result.list).toEqual([mockSignRecord])
      expect(result.meta.total).toBe(1)
    })
  })

  describe('getDetail', () => {
    it('应返回签约详情', async () => {
      const result = await service.getDetail(1)
      expect(result).toEqual(mockSignRecord)
    })
    it('不存在应抛异常', async () => {
      mockPrisma.signRecord.findFirst = jest.fn().mockResolvedValue(null)
      await expect(service.getDetail(999)).rejects.toThrow(NotFoundException)
    })
  })

  describe('create', () => {
    it('应创建签约', async () => {
      await service.create({ applicationId: 1, customerName: 'Test' } as any)
      expect(mockPrisma.signRecord.create).toHaveBeenCalled()
    })
    it('进件不存在应抛异常', async () => {
      mockPrisma.application.findFirst = jest.fn().mockResolvedValue(null)
      await expect(service.create({ applicationId: 999 } as any)).rejects.toThrow(BadRequestException)
    })
  })

  describe('update', () => {
    it('应更新签约', async () => {
      await service.update(1, { customerName: 'Updated' } as any)
      expect(mockPrisma.signRecord.update).toHaveBeenCalled()
    })
    it('不存在应抛异常', async () => {
      mockPrisma.signRecord.findFirst = jest.fn().mockResolvedValue(null)
      await expect(service.update(999, {} as any)).rejects.toThrow(NotFoundException)
    })
  })

  describe('remove', () => {
    it('应软删除签约', async () => {
      const result = await service.remove(1)
      expect(result).toEqual({ id: 1 })
      expect(mockPrisma.signRecord.update).toHaveBeenCalled()
    })
  })

  describe('authorizeSign', () => {
    it('应授权签署', async () => {
      mockPrisma.$transaction = jest.fn((callback: any) =>
        callback({ ...mockPrisma, $transaction: undefined }),
      )
      const result = await service.authorizeSign(1)
      expect(mockPrisma.signRecord.update).toHaveBeenCalled()
      expect(mockPrisma.application.update).toHaveBeenCalled()
      expect(result.code).toBe(200)
    })
  })
})
