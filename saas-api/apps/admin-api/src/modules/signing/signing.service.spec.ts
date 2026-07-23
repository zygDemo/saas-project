import { Test, TestingModule } from '@nestjs/testing'
import { SigningService } from './signing.service'
import { PrismaService } from '../prisma/prisma.service'
import { NotFoundException } from '@nestjs/common'

jest.mock('../../common/tenant/tenant-context', () => ({
  getCurrentTenantId: jest.fn(() => 1)
}))

import { getCurrentTenantId } from '../../common/tenant/tenant-context'

describe('SigningService', () => {
  let service: SigningService
  let mockPrisma: jest.Mocked<PrismaService>

  const makeSignRecord = (overrides = {}) => ({
    id: 1,
    tenantId: 1,
    applicationId: 1,
    status: 'SENT',
    contractUrl: 'http://contract.pdf',
    videoUrl: null,
    signedAt: null,
    expiredAt: new Date('2026-12-31'),
    cancelledReason: null,
    deletedAt: null,
    application: { id: 1, applicationNo: 'APP-001', status: 'PENDING_SIGN' },
    ...overrides
  })

  beforeEach(async () => {
    ;(getCurrentTenantId as jest.Mock).mockReturnValue(1)

    mockPrisma = {
      signRecord: {
        count: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn()
      },
      application: {
        findFirst: jest.fn(),
        update: jest.fn()
      },
      $transaction: jest.fn((queries: unknown[]) => Promise.all(queries))
    } as unknown as jest.Mocked<PrismaService>

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SigningService,
        { provide: PrismaService, useValue: mockPrisma }
      ]
    }).compile()

    service = module.get<SigningService>(SigningService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  // ═══════════════════════════════════════════════════════════════
  //  CRUD
  // ═══════════════════════════════════════════════════════════════
  describe('create', () => {
    it('应该成功创建签署记录', async () => {
      mockPrisma.application.findFirst!.mockResolvedValue({ id: 1 } as any)
      mockPrisma.signRecord.create!.mockResolvedValue(makeSignRecord())

      const result = await service.create({
        applicationId: 1,
        status: 'PENDING',
        contractUrl: 'http://contract.pdf'
      })

      expect(result.id).toBe(1)
    })

    it('进件不存在时应抛出异常', async () => {
      mockPrisma.application.findFirst!.mockResolvedValue(null)

      await expect(
        service.create({ applicationId: 999, status: 'PENDING' })
      ).rejects.toThrow('进件不存在')
    })
  })

  describe('getList', () => {
    it('应该返回分页签署记录', async () => {
      mockPrisma.signRecord.count!.mockResolvedValue(1)
      mockPrisma.signRecord.findMany!.mockResolvedValue([makeSignRecord()])

      const result = await service.getList({ current: 1, size: 10 }) as any

      expect(result.records).toHaveLength(1)
      expect(result.total).toBe(1)
    })

    it('应该支持按 applicationId 筛选', async () => {
      mockPrisma.signRecord.count!.mockResolvedValue(0)
      mockPrisma.signRecord.findMany!.mockResolvedValue([])

      await service.getList({ applicationId: 1, current: 1, size: 10 })

      expect(mockPrisma.signRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ applicationId: 1 })
        })
      )
    })

    it('应该支持按 status 筛选', async () => {
      mockPrisma.signRecord.count!.mockResolvedValue(0)
      mockPrisma.signRecord.findMany!.mockResolvedValue([])

      await service.getList({ status: 'SIGNED', current: 1, size: 10 })

      expect(mockPrisma.signRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'SIGNED' })
        })
      )
    })
  })

  describe('getDetail', () => {
    it('应该返回签署详情', async () => {
      mockPrisma.signRecord.findFirst!.mockResolvedValue(makeSignRecord())

      const result = (await service.getDetail(1)) as any

      expect(result.status).toBe('SENT')
      expect(result.contractUrl).toBe('http://contract.pdf')
    })

    it('不存在时应抛出 NotFoundException', async () => {
      mockPrisma.signRecord.findFirst!.mockResolvedValue(null)

      await expect(service.getDetail(999)).rejects.toThrow(NotFoundException)
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  AUTHORIZE SIGN
  // ═══════════════════════════════════════════════════════════════
  describe('authorizeSign', () => {
    it('PENDING 状态应成功授权签署', async () => {
      mockPrisma.signRecord.findFirst!.mockResolvedValue(makeSignRecord({ status: 'PENDING' }))
      mockPrisma.$transaction = jest.fn(async (fn: unknown) => {
        const tx = {
          signRecord: {
            update: jest.fn().mockResolvedValue({ id: 1, status: 'SIGNED', signedAt: new Date() })
          },
          application: {
            update: jest.fn().mockResolvedValue({ id: 1, status: 'SIGNED' })
          }
        }
        return fn(tx)
      })

      const result = await service.authorizeSign(1)

      expect(result.code).toBe(200)
      expect(result.message).toBe('授权签署成功')
    })

    it('SENT 状态应成功授权签署', async () => {
      mockPrisma.signRecord.findFirst!.mockResolvedValue(makeSignRecord({ status: 'SENT' }))
      mockPrisma.$transaction = jest.fn(async (fn: unknown) => {
        const tx = {
          signRecord: {
            update: jest.fn().mockResolvedValue({ id: 1, status: 'SIGNED', signedAt: new Date() })
          },
          application: {
            update: jest.fn().mockResolvedValue({ id: 1, status: 'SIGNED' })
          }
        }
        return fn(tx)
      })

      const result = await service.authorizeSign(1)

      expect(result.code).toBe(200)
    })

    it('签署记录不存在时应抛出 NotFoundException', async () => {
      mockPrisma.signRecord.findFirst!.mockResolvedValue(null)

      await expect(service.authorizeSign(999)).rejects.toThrow('签署记录不存在')
    })

    it('已签署状态不允许重复签署', async () => {
      mockPrisma.signRecord.findFirst!.mockResolvedValue(makeSignRecord({ status: 'SIGNED' }))

      await expect(service.authorizeSign(1)).rejects.toThrow('当前状态 SIGNED 不允许签署')
    })

    it('已取消状态不允许签署', async () => {
      mockPrisma.signRecord.findFirst!.mockResolvedValue(makeSignRecord({ status: 'CANCELLED' }))

      await expect(service.authorizeSign(1)).rejects.toThrow('当前状态 CANCELLED 不允许签署')
    })

    it('签署事务应同时更新签署记录和申请状态', async () => {
      let signUpdateArgs: Record<string, unknown>
      let appUpdateArgs: Record<string, unknown>

      mockPrisma.signRecord.findFirst!.mockResolvedValue(makeSignRecord({ status: 'SENT' }))
      mockPrisma.$transaction = jest.fn(async (fn: unknown) => {
        const tx = {
          signRecord: {
            update: jest.fn().mockImplementation((args: Record<string, unknown>) => {
              signUpdateArgs = args
              return Promise.resolve({ id: 1, status: 'SIGNED' })
            })
          },
          application: {
            update: jest.fn().mockImplementation((args: Record<string, unknown>) => {
              appUpdateArgs = args
              return Promise.resolve({ id: 1, status: 'SIGNED' })
            })
          }
        }
        return fn(tx)
      })

      await service.authorizeSign(1)

      expect(signUpdateArgs.data.status).toBe('SIGNED')
      expect(signUpdateArgs.data.signedAt).toBeInstanceOf(Date)
      expect(appUpdateArgs.data.status).toBe('SIGNED')
      expect(appUpdateArgs.where.id).toBe(1) // applicationId
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  UPDATE / REMOVE
  // ═══════════════════════════════════════════════════════════════
  describe('update', () => {
    it('应该成功更新签署记录', async () => {
      mockPrisma.signRecord.findFirst!.mockResolvedValue(makeSignRecord())
      mockPrisma.application.findFirst!.mockResolvedValue({ id: 1 } as any)
      mockPrisma.signRecord.update!.mockResolvedValue(makeSignRecord({ contractUrl: 'http://new.pdf' }))

      await service.update(1, { applicationId: 1, contractUrl: 'http://new.pdf' })

      expect(mockPrisma.signRecord.update).toHaveBeenCalled()
    })
  })
})
