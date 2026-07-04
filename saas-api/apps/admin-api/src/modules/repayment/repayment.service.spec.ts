import { Test, TestingModule } from '@nestjs/testing'
import { RepaymentService } from './repayment.service'
import { PrismaService } from '../prisma/prisma.service'
import { NotFoundException } from '@nestjs/common'

jest.mock('../../common/tenant/tenant-context', () => ({
  getCurrentTenantId: jest.fn(() => 1)
}))

import { getCurrentTenantId } from '../../common/tenant/tenant-context'

describe('RepaymentService', () => {
  let service: RepaymentService
  let mockPrisma: jest.Mocked<PrismaService>

  const makeRepaymentPlan = (overrides = {}) => ({
    id: 1,
    tenantId: 1,
    applicationId: 1,
    period: 1,
    dueDate: new Date('2026-08-01'),
    principal: 8333.33,
    interest: 566.67,
    totalAmount: 8900,
    paidPrincipal: 0,
    paidInterest: 0,
    paidTotal: 0,
    status: 'NOT_DUE',
    overdueDays: 0,
    penaltyAmount: 0,
    paidAt: null,
    deletedAt: null,
    application: { id: 1, applicationNo: 'APP-001' },
    records: [],
    ...overrides
  })

  beforeEach(async () => {
    ;(getCurrentTenantId as jest.Mock).mockReturnValue(1)

    mockPrisma = {
      repaymentPlan: {
        count: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn()
      },
      application: { findFirst: jest.fn() },
      repaymentRecord: { create: jest.fn() },
      $transaction: jest.fn((queries: any[]) => Promise.all(queries))
    } as unknown as jest.Mocked<PrismaService>

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RepaymentService,
        { provide: PrismaService, useValue: mockPrisma }
      ]
    }).compile()

    service = module.get<RepaymentService>(RepaymentService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  // ═══════════════════════════════════════════════════════════════
  //  CREATE
  // ═══════════════════════════════════════════════════════════════
  describe('create', () => {
    it('应该成功创建还款计划', async () => {
      mockPrisma.application.findFirst!.mockResolvedValue({ id: 1 } as any)
      mockPrisma.repaymentPlan.create!.mockResolvedValue(makeRepaymentPlan())

      const result = await service.create({
        applicationId: 1,
        period: 1,
        dueDate: new Date('2026-08-01'),
        principal: 8333.33,
        interest: 566.67,
        totalAmount: 8900
      })

      expect(result.id).toBe(1)
      expect(result.period).toBe(1)
    })

    it('进件不存在时应抛出异常', async () => {
      mockPrisma.application.findFirst!.mockResolvedValue(null)

      await expect(
        service.create({ applicationId: 999, period: 1, dueDate: new Date(), principal: 1000, interest: 100, totalAmount: 1100 })
      ).rejects.toThrow('进件不存在')
    })
  })

  describe('getList', () => {
    it('应该返回分页还款计划', async () => {
      mockPrisma.repaymentPlan.count!.mockResolvedValue(3)
      mockPrisma.repaymentPlan.findMany!.mockResolvedValue([
        makeRepaymentPlan({ period: 1 }),
        makeRepaymentPlan({ id: 2, period: 2 }),
        makeRepaymentPlan({ id: 3, period: 3 })
      ])

      const result = await service.getList({ current: 1, size: 10 }) as any

      expect(result.records).toHaveLength(3)
      expect(result.total).toBe(3)
    })

    it('应该支持按 applicationId 筛选', async () => {
      mockPrisma.repaymentPlan.count!.mockResolvedValue(0)
      mockPrisma.repaymentPlan.findMany!.mockResolvedValue([])

      await service.getList({ applicationId: 1, current: 1, size: 10 })

      expect(mockPrisma.repaymentPlan.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ applicationId: 1 })
        })
      )
    })

    it('应该支持按 status 筛选', async () => {
      mockPrisma.repaymentPlan.count!.mockResolvedValue(0)
      mockPrisma.repaymentPlan.findMany!.mockResolvedValue([])

      await service.getList({ status: 'OVERDUE', current: 1, size: 10 })

      expect(mockPrisma.repaymentPlan.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'OVERDUE' })
        })
      )
    })
  })

  describe('getDetail', () => {
    it('应该返回还款计划详情', async () => {
      mockPrisma.repaymentPlan.findFirst!.mockResolvedValue(
        makeRepaymentPlan({
          records: [
            { id: 1, amount: 5000, principal: 4500, interest: 500, createdAt: new Date() }
          ]
        })
      )

      const result = (await service.getDetail(1)) as any

      expect(result.period).toBe(1)
      expect(result.records).toHaveLength(1)
    })

    it('不存在时应抛出 NotFoundException', async () => {
      mockPrisma.repaymentPlan.findFirst!.mockResolvedValue(null)

      await expect(service.getDetail(999)).rejects.toThrow(NotFoundException)
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  UPDATE
  // ═══════════════════════════════════════════════════════════════
  describe('update', () => {
    it('应该成功更新还款计划', async () => {
      mockPrisma.repaymentPlan.findFirst!.mockResolvedValue(makeRepaymentPlan())
      mockPrisma.application.findFirst!.mockResolvedValue({ id: 1 } as any)
      mockPrisma.repaymentPlan.update!.mockResolvedValue(
        makeRepaymentPlan({ status: 'PAID', paidTotal: 8900 })
      )

      await service.update(1, { applicationId: 1, status: 'PAID' })

      expect(mockPrisma.repaymentPlan.update).toHaveBeenCalled()
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  REMOVE
  // ═══════════════════════════════════════════════════════════════
  describe('remove', () => {
    it('应该软删除还款计划', async () => {
      mockPrisma.repaymentPlan.findFirst!.mockResolvedValue(makeRepaymentPlan())
      mockPrisma.repaymentPlan.update!.mockResolvedValue({ id: 1 })

      const result = await service.remove(1)

      expect(result.id).toBe(1)
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  还款计划各种状态
  // ═══════════════════════════════════════════════════════════════
  describe('还款计划状态', () => {
    it('NOT_DUE 状态的还款计划', async () => {
      mockPrisma.repaymentPlan.findFirst!.mockResolvedValue(
        makeRepaymentPlan({ status: 'NOT_DUE', overdueDays: 0 })
      )

      const result = (await service.getDetail(1)) as any

      expect(result.status).toBe('NOT_DUE')
      expect(result.overdueDays).toBe(0)
    })

    it('OVERDUE 状态的还款计划应有逾期天数', async () => {
      mockPrisma.repaymentPlan.findFirst!.mockResolvedValue(
        makeRepaymentPlan({ status: 'OVERDUE', overdueDays: 15 })
      )

      const result = (await service.getDetail(1)) as any

      expect(result.status).toBe('OVERDUE')
      expect(result.overdueDays).toBe(15)
    })

    it('PAID 状态的还款计划应有还款时间', async () => {
      mockPrisma.repaymentPlan.findFirst!.mockResolvedValue(
        makeRepaymentPlan({
          status: 'PAID',
          paidPrincipal: 8333.33,
          paidInterest: 566.67,
          paidTotal: 8900,
          paidAt: new Date('2026-08-01')
        })
      )

      const result = (await service.getDetail(1)) as any

      expect(result.status).toBe('PAID')
      expect(result.paidTotal).toBe(8900)
      expect(result.paidAt).toBeDefined()
    })

    it('PARTIAL 状态的还款计划应部分还款', async () => {
      mockPrisma.repaymentPlan.findFirst!.mockResolvedValue(
        makeRepaymentPlan({
          status: 'PARTIAL',
          paidPrincipal: 4000,
          paidInterest: 500,
          paidTotal: 4500
        })
      )

      const result = (await service.getDetail(1)) as any

      expect(result.status).toBe('PARTIAL')
      expect(result.paidTotal).toBe(4500)
    })
  })
})
