import { Test, TestingModule } from '@nestjs/testing'
import { DisbursementService } from './disbursement.service'
import { PrismaService } from '../prisma/prisma.service'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { DisbursementStatus } from '@prisma/client'

jest.mock('../../common/tenant/tenant-context', () => ({
  getCurrentTenantId: jest.fn(() => 1)
}))

import { getCurrentTenantId } from '../../common/tenant/tenant-context'

describe('DisbursementService', () => {
  let service: DisbursementService
  let mockPrisma: any

  const makeDisbursement = (overrides: Record<string, unknown> = {}) => ({
    id: 1,
    tenantId: 1,
    applicationId: 1,
    status: DisbursementStatus.PENDING_APPLICATION,
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
        update: jest.fn(),
        upsert: jest.fn()
      },
      application: {
        findFirst: jest.fn(),
        update: jest.fn().mockResolvedValue({ id: 1 })
      },
      $transaction: jest.fn((arg: unknown) => {
        if (typeof arg === 'function') return arg(mockPrisma)
        return Promise.all(arg as unknown[])
      })
    }

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
  //  CREATE (基类)
  // ═══════════════════════════════════════════════════════════════
  describe('create', () => {
    it('应该成功创建放款记录', async () => {
      mockPrisma.application.findFirst.mockResolvedValue({ id: 1 })
      mockPrisma.disbursement.create.mockResolvedValue(makeDisbursement())

      const result = await service.create({
        applicationId: 1,
        status: DisbursementStatus.PENDING_APPLICATION
      }) as any

      expect(result.id).toBe(1)
      expect(result.status).toBe(DisbursementStatus.PENDING_APPLICATION)
    })

    it('进件不存在时应抛出异常', async () => {
      mockPrisma.application.findFirst.mockResolvedValue(null)

      await expect(
        service.create({ applicationId: 999, status: DisbursementStatus.PENDING_APPLICATION } as any)
      ).rejects.toThrow('进件不存在')
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  GET LIST (基类)
  // ═══════════════════════════════════════════════════════════════
  describe('getList', () => {
    it('应该返回分页放款记录', async () => {
      mockPrisma.disbursement.count.mockResolvedValue(1)
      mockPrisma.disbursement.findMany.mockResolvedValue([makeDisbursement()])

      const result = await service.getList({ current: 1, size: 10 } as any) as any

      expect(result.list).toHaveLength(1)
      expect(result.meta.total).toBe(1)
    })

    it('应该支持按 applicationId 筛选', async () => {
      mockPrisma.disbursement.count.mockResolvedValue(0)
      mockPrisma.disbursement.findMany.mockResolvedValue([])

      await service.getList({ applicationId: 1, current: 1, size: 10 } as any)

      expect(mockPrisma.disbursement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ applicationId: 1 })
        })
      )
    })

    it('应该支持按 status 筛选', async () => {
      mockPrisma.disbursement.count.mockResolvedValue(0)
      mockPrisma.disbursement.findMany.mockResolvedValue([])

      await service.getList({ status: DisbursementStatus.DISBURSED, current: 1, size: 10 } as any)

      expect(mockPrisma.disbursement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: DisbursementStatus.DISBURSED })
        })
      )
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  GET DETAIL (基类)
  // ═══════════════════════════════════════════════════════════════
  describe('getDetail', () => {
    it('应该返回放款详情', async () => {
      mockPrisma.disbursement.findFirst.mockResolvedValue(
        makeDisbursement({
          status: DisbursementStatus.DISBURSED,
          disburseAmount: 100000,
          disburseAccount: '622200000000',
          transactionNo: 'TXN-001'
        })
      )

      const result = await service.getDetail(1) as any

      expect(result.status).toBe(DisbursementStatus.DISBURSED)
      expect(result.disburseAmount).toBe(100000)
      expect(result.transactionNo).toBe('TXN-001')
    })

    it('不存在时应抛出 NotFoundException', async () => {
      mockPrisma.disbursement.findFirst.mockResolvedValue(null)

      await expect(service.getDetail(999)).rejects.toThrow(NotFoundException)
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  UPDATE (基类)
  // ═══════════════════════════════════════════════════════════════
  describe('update', () => {
    it('应该成功更新放款记录', async () => {
      mockPrisma.disbursement.findFirst.mockResolvedValue(makeDisbursement())
      mockPrisma.application.findFirst.mockResolvedValue({ id: 1 })
      mockPrisma.disbursement.update.mockResolvedValue(
        makeDisbursement({ status: DisbursementStatus.DISBURSED, disburseAmount: 100000 })
      )

      await service.update(1, {
        applicationId: 1,
        status: DisbursementStatus.DISBURSED,
        disburseAmount: 100000
      } as any)

      expect(mockPrisma.disbursement.update).toHaveBeenCalled()
    })

    it('不存在时应抛出 NotFoundException', async () => {
      mockPrisma.disbursement.findFirst.mockResolvedValue(null)

      await expect(service.update(999, { applicationId: 1 } as any)).rejects.toThrow(NotFoundException)
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  REMOVE (基类，软删除)
  // ═══════════════════════════════════════════════════════════════
  describe('remove', () => {
    it('应该软删除放款记录', async () => {
      mockPrisma.disbursement.findFirst.mockResolvedValue(makeDisbursement())
      mockPrisma.disbursement.update.mockResolvedValue({ id: 1 })

      const result = await service.remove(1) as any

      expect(result.id).toBe(1)
      expect(mockPrisma.disbursement.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ deletedAt: expect.any(Date) })
        })
      )
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  GPS 安装
  // ═══════════════════════════════════════════════════════════════
  describe('completeGpsInstall', () => {
    it('应该成功登记GPS安装', async () => {
      mockPrisma.disbursement.upsert.mockResolvedValue(
        makeDisbursement({ status: DisbursementStatus.GPS_INSTALLED, gpsDeviceNo: 'GPS-001' })
      )

      const result = await service.completeGpsInstall(1, {
        gpsDeviceNo: 'GPS-001',
        gpsInstallImg: 'http://img.jpg'
      }) as any

      expect(result.status).toBe(DisbursementStatus.GPS_INSTALLED)
      expect(mockPrisma.disbursement.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { applicationId: 1 },
          update: expect.objectContaining({
            status: DisbursementStatus.GPS_INSTALLED,
            gpsDeviceNo: 'GPS-001'
          })
        })
      )
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  抵押登记
  // ═══════════════════════════════════════════════════════════════
  describe('completeMortgage', () => {
    it('应该成功登记抵押', async () => {
      mockPrisma.disbursement.upsert.mockResolvedValue(
        makeDisbursement({ status: DisbursementStatus.MORTGAGE_DONE, mortgageStatus: 'DONE' })
      )

      const result = await service.completeMortgage(1, {
        mortgageStatus: 'DONE',
        mortgageImg: 'http://mortgage.jpg'
      }) as any

      expect(result.status).toBe(DisbursementStatus.MORTGAGE_DONE)
      expect(mockPrisma.disbursement.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            status: DisbursementStatus.MORTGAGE_DONE,
            mortgageStatus: 'DONE'
          })
        })
      )
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  出账申请
  // ═══════════════════════════════════════════════════════════════
  describe('requestDisbursement', () => {
    it('无已有记录时应创建 PENDING_APPROVAL 状态', async () => {
      mockPrisma.disbursement.findFirst.mockResolvedValue(null)
      mockPrisma.disbursement.upsert.mockResolvedValue({ id: 1 })

      await service.requestDisbursement(1, { remark: '申请放款' })

      expect(mockPrisma.disbursement.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({ status: DisbursementStatus.PENDING_APPROVAL }),
          create: expect.objectContaining({ status: DisbursementStatus.PENDING_APPROVAL })
        })
      )
    })

    it('已有 GPS 安装记录时应保留 GPS_INSTALLED 状态', async () => {
      mockPrisma.disbursement.findFirst.mockResolvedValue({
        id: 1,
        status: DisbursementStatus.GPS_INSTALLED
      })

      await service.requestDisbursement(1, {})

      expect(mockPrisma.disbursement.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({ status: DisbursementStatus.GPS_INSTALLED })
        })
      )
    })

    it('已有抵押完成记录时应保留 MORTGAGE_DONE 状态', async () => {
      mockPrisma.disbursement.findFirst.mockResolvedValue({
        id: 1,
        status: DisbursementStatus.MORTGAGE_DONE
      })

      await service.requestDisbursement(1, {})

      expect(mockPrisma.disbursement.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({ status: DisbursementStatus.MORTGAGE_DONE })
        })
      )
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  放款确认（含强校验）
  // ═══════════════════════════════════════════════════════════════
  describe('confirmDisbursement', () => {
    it('满足所有条件时应成功确认放款', async () => {
      mockPrisma.disbursement.findFirst.mockResolvedValue(
        makeDisbursement({
          status: DisbursementStatus.PENDING_APPROVAL,
          gpsInstallAt: new Date('2026-07-01'),
          mortgageAt: new Date('2026-07-02')
        })
      )
      mockPrisma.disbursement.upsert.mockResolvedValue({ id: 1 })

      await service.confirmDisbursement(1, {
        disburseAmount: 100000,
        disburseAccount: '622200000000',
        transactionNo: 'TXN-001'
      })

      expect(mockPrisma.$transaction).toHaveBeenCalled()
      expect(mockPrisma.disbursement.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            status: DisbursementStatus.DISBURSED,
            disburseAmount: 100000
          })
        })
      )
    })

    it('未提交出账申请（记录不存在）时应抛出异常', async () => {
      mockPrisma.disbursement.findFirst.mockResolvedValue(null)

      await expect(
        service.confirmDisbursement(1, { disburseAmount: 100000 })
      ).rejects.toThrow('请先提交出账申请')
    })

    it('状态不在允许范围时应抛出异常', async () => {
      mockPrisma.disbursement.findFirst.mockResolvedValue(
        makeDisbursement({ status: DisbursementStatus.DISBURSED })
      )

      await expect(
        service.confirmDisbursement(1, { disburseAmount: 100000 })
      ).rejects.toThrow('请先提交出账申请')
    })

    it('GPS 未安装时应抛出异常', async () => {
      mockPrisma.disbursement.findFirst.mockResolvedValue(
        makeDisbursement({
          status: DisbursementStatus.PENDING_APPROVAL,
          gpsInstallAt: null,
          mortgageAt: new Date('2026-07-02')
        })
      )

      await expect(
        service.confirmDisbursement(1, { disburseAmount: 100000 })
      ).rejects.toThrow('请先完成GPS安装')
    })

    it('抵押未完成时应抛出异常', async () => {
      mockPrisma.disbursement.findFirst.mockResolvedValue(
        makeDisbursement({
          status: DisbursementStatus.PENDING_APPROVAL,
          gpsInstallAt: new Date('2026-07-01'),
          mortgageAt: null
        })
      )

      await expect(
        service.confirmDisbursement(1, { disburseAmount: 100000 })
      ).rejects.toThrow('请先完成抵押登记')
    })
  })
})
