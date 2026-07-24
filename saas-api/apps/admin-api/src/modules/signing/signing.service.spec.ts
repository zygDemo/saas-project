import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException, BadRequestException } from '@nestjs/common'
import { SigningService } from './signing.service'
import { PrismaService } from '../prisma/prisma.service'

jest.mock('../../common/tenant/tenant-context', () => ({
  getCurrentTenantId: jest.fn(() => 1),
}))

const mockApplication = { id: 1, applicationNo: 'APP001', tenantId: 1 }
const mockSigning = {
  id: 1,
  signingCode: 'SIG001',
  applicationId: 1,
  customerName: 'Test',
  tenantId: 1,
  status: 'DRAFT',
  createdAt: new Date(),
  updatedAt: new Date(),
}
const mockSigningLog = { id: 1, signingId: 1, action: 'CREATE', createdAt: new Date() }

describe('SigningService', () => {
  let service: SigningService
  let mockPrisma: any

  beforeEach(async () => {
    jest.clearAllMocks()
    mockPrisma = {
      signing: {
        findMany: jest.fn().mockResolvedValue([mockSigning]),
        findFirst: jest.fn().mockResolvedValue(mockSigning),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue(mockSigning),
        update: jest.fn().mockResolvedValue(mockSigning),
      },
      signingLog: {
        create: jest.fn().mockResolvedValue(mockSigningLog),
      },
      application: {
        findFirst: jest.fn().mockResolvedValue(mockApplication),
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
      const result = await service.getList({ signingCode: 'SIG', page: 1, pageSize: 10 } as any)
      expect(mockPrisma.signing.findMany).toHaveBeenCalled()
      expect(result.list).toEqual([mockSigning])
      expect(result.meta.total).toBe(1)
    })
  })

  describe('getDetail', () => {
    it('应返回签约详情', async () => {
      const result = await service.getDetail(1)
      expect(result).toEqual(mockSigning)
    })
    it('不存在应抛异常', async () => {
      mockPrisma.signing.findFirst = jest.fn().mockResolvedValue(null)
      await expect(service.getDetail(999)).rejects.toThrow(NotFoundException)
    })
  })

  describe('create', () => {
    it('应创建签约', async () => {
      await service.create({ applicationId: 1, customerName: 'Test' } as any)
      expect(mockPrisma.signing.create).toHaveBeenCalled()
    })
    it('进件不存在应抛异常', async () => {
      mockPrisma.application.findFirst = jest.fn().mockResolvedValue(null)
      await expect(service.create({ applicationId: 999 } as any)).rejects.toThrow(BadRequestException)
    })
  })

  describe('update', () => {
    it('应更新签约', async () => {
      await service.update(1, { customerName: 'Updated' } as any)
      expect(mockPrisma.signing.update).toHaveBeenCalled()
    })
    it('不存在应抛异常', async () => {
      mockPrisma.signing.findFirst = jest.fn().mockResolvedValue(null)
      await expect(service.update(999, {} as any)).rejects.toThrow(NotFoundException)
    })
  })

  describe('remove', () => {
    it('应删除签约', async () => {
      const result = await service.remove(1)
      expect(result).toEqual({ id: 1 })
      expect(mockPrisma.signing.delete).toHaveBeenCalled()
    })
  })

  describe('authorizeSign', () => {
    it('应授权签约', async () => {
      mockPrisma.$transaction = jest.fn((callback: any) =>
        callback({ ...mockPrisma, $transaction: undefined }),
      )
      await service.authorizeSign(1, { authorizedBy: 1, remark: 'ok' } as any)
      expect(mockPrisma.signing.update).toHaveBeenCalled()
      expect(mockPrisma.signingLog.create).toHaveBeenCalled()
    })
  })
})
