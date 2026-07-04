import { Test, TestingModule } from '@nestjs/testing'
import { DisbursementService } from './disbursement.service'
import { PrismaService } from '../prisma/prisma.service'
import { NotFoundException } from '@nestjs/common'

jest.mock('../../common/tenant/tenant-context', () => ({
  getCurrentTenantId: jest.fn(() => 1)
}))

import { getCurrentTenantId } from '../../common/tenant/tenant-context'

describe('DisbursementService', () => {
  let service: DisbursementService
  let mockPrisma: jest.Mocked<PrismaService>

  const makeDisbursement = (overrides = {}) => ({
    id: 1,
    tenantId: 1,
    applicationId: 1,
    status: 'PENDING_APPLICATION',
    gpsDeviceNo: null,
    gpsInstallImg: null,
    gpsInstallAt: null,
    mortgageStatus: null,
    mortgageImg: null,
    mortgageAt: null,
    disburseAmount: null,
    disburseAccount: null,
    disburseAt: null,
    transactionNo: null,
    voucherUrl: null,
    remark: null,
    deletedAt: null,
    application: { id: 1, applicationNo: 'APP-001' },
    ...overrides
  })

  beforeEach(async () => {
    ;(getCurrentTenantId as jest.Mock).mockReturnValue(1)

    mockPrisma = {
      disbursement: {
        count: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn()
      },
      application: { findFirst: jest.fn() },
      $transaction: jest.fn((queries: any[]) => Promise.all(queries))
    } as unknown as jest.Mocked<PrismaService>

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DisbursementService,
        { provide: PrismaService, useValue: mockPrisma }
      ]
    }).compile()

    service = module.get<DisbursementService>(DisbursementService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  // ═══════════════════════════════════════════════════════════════
  //  CREATE
  // ═══════════════════════════════════════════════════════════════
  describe('create', () => {
    it('应该成功创建放款记录', async () => {
      mockPrisma.application.findFirst!.mockResolvedValue({ id: 1 } as any)
      mockPrisma.disbursement.create!.mockResolvedValue(makeDisbursement())

      const result = await service.create({
        applicationId: 1,
        status: 'PENDING_APPLICATION'
      })

      expect(result.id).toBe(1)
      expect(result.status).toBe('PENDING_APPLICATION')
    })

    it('进件不存在时应抛出异常', async () => {
      mockPrisma.application.findFirst!.mockResolvedValue(null)

      await expect(
        service.create({ applicationId: 999, status: 'PENDING_APPLICATION' })
      ).rejects.toThrow('进件不存在')
    })
  })

  describe('getList', () => {
    it('应该返回分页放款记录', async () => {
      mockPrisma.disbursement.count!.mockResolvedValue(1)
      mockPrisma.disbursement.findMany!.mockResolvedValue([makeDisbursement()])

      const result = await service.getList({ current: 1, size: 10 }) as any

      expect(result.records).toHaveLength(1)
      expect(result.total).toBe(1)
    })

    it('应该支持按 applicationId 筛选', async () => {
      mockPrisma.disbursement.count!.mockResolvedValue(0)
      mockPrisma.disbursement.findMany!.mockResolvedValue([])

      await service.getList({ applicationId: 1, current: 1, size: 10 })

      expect(mockPrisma.disbursement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ applicationId: 1 })
        })
      )
    })

    it('应该支持按 status 筛选', async () => {
      mockPrisma.disbursement.count!.mockResolvedValue(0)
      mockPrisma.disbursement.findMany!.mockResolvedValue([])

      await service.getList({ status: 'DISBURSED', current: 1, size: 10 })

      expect(mockPrisma.disbursement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'DISBURSED' })
        })
      )
    })
  })

  describe('getDetail', () => {
    it('应该返回放款详情', async () => {
      mockPrisma.disbursement.findFirst!.mockResolvedValue(
        makeDisbursement({
          status: 'DISBURSED',
          disburseAmount: 100000,
          disburseAccount: '622200000000',
          transactionNo: 'TXN-001'
        })
      )

      const result = (await service.getDetail(1)) as any

      expect(result.status).toBe('DISBURSED')
      expect(result.disburseAmount).toBe(100000)
      expect(result.transactionNo).toBe('TXN-001')
    })

    it('不存在时应抛出 NotFoundException', async () => {
      mockPrisma.disbursement.findFirst!.mockResolvedValue(null)

      await expect(service.getDetail(999)).rejects.toThrow(NotFoundException)
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  UPDATE
  // ═══════════════════════════════════════════════════════════════
  describe('update', () => {
    it('应该成功更新放款记录', async () => {
      mockPrisma.disbursement.findFirst!.mockResolvedValue(makeDisbursement())
      mockPrisma.application.findFirst!.mockResolvedValue({ id: 1 } as any)
      mockPrisma.disbursement.update!.mockResolvedValue(
        makeDisbursement({ status: 'DISBURSED', disburseAmount: 100000 })
      )

      const result = await service.update(1, {
        applicationId: 1,
        status: 'DISBURSED',
        disburseAmount: 100000
      })

      expect(mockPrisma.disbursement.update).toHaveBeenCalled()
    })

    it('不存在时应抛出 NotFoundException', async () => {
      mockPrisma.disbursement.findFirst!.mockResolvedValue(null)

      await expect(service.update(999, { applicationId: 1 })).rejects.toThrow(NotFoundException)
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  REMOVE
  // ═══════════════════════════════════════════════════════════════
  describe('remove', () => {
    it('应该软删除放款记录', async () => {
      mockPrisma.disbursement.findFirst!.mockResolvedValue(makeDisbursement())
      mockPrisma.disbursement.update!.mockResolvedValue({ id: 1 })

      const result = await service.remove(1)

      expect(result.id).toBe(1)
    })
  })
})
