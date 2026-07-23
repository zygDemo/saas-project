import { Test, TestingModule } from '@nestjs/testing'
import { RepaymentService } from './repayment.service'
import { PrismaService } from '../prisma/prisma.service'
import { DataScopeService } from '../../common/auth/data-scope.service'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { RepaymentStatus } from '@prisma/client'

jest.mock('../../common/tenant/tenant-context', () => ({
  getCurrentTenantId: jest.fn(() => 1)
}))

import { getCurrentTenantId } from '../../common/tenant/tenant-context'

describe('RepaymentService', () => {
  let service: RepaymentService
  let mockPrisma: any
  let mockDataScope: any

  const makeRepaymentPlan = (overrides: Record<string, unknown> = {}) => ({
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
    status: RepaymentStatus.NOT_DUE,
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
        update: jest.fn(),
        updateMany: jest.fn(),
        createMany: jest.fn()
      },
      application: { findFirst: jest.fn() },
      repaymentRecord: { create: jest.fn() },
      collectionRecord: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn()
      },
      earlyRepayment: {
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn()
      },
      user: { findFirst: jest.fn() },
      $transaction: jest.fn((arg: unknown) => {
        if (typeof arg === 'function') return arg(mockPrisma)
        return Promise.all(arg as unknown[])
      })
    }

    mockDataScope = {
      buildDataScopeFilter: jest.fn().mockResolvedValue({})
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RepaymentService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: DataScopeService, useValue: mockDataScope }
      ]
    }).compile()

    service = module.get<RepaymentService>(RepaymentService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  // ═══════════════════════════════════════════════════════════════
  //  CREATE (基类)
  // ═══════════════════════════════════════════════════════════════
  describe('create', () => {
    it('应该成功创建还款计划', async () => {
      mockPrisma.application.findFirst.mockResolvedValue({ id: 1 })
      mockPrisma.repaymentPlan.create.mockResolvedValue(makeRepaymentPlan())

      const result = await service.create({
        applicationId: 1,
        period: 1,
        dueDate: new Date('2026-08-01'),
        principal: 8333.33,
        interest: 566.67,
        totalAmount: 8900
      } as any) as any

      expect(result.id).toBe(1)
      expect(result.period).toBe(1)
    })

    it('进件不存在时应抛出异常', async () => {
      mockPrisma.application.findFirst.mockResolvedValue(null)

      await expect(
        service.create({ applicationId: 999, period: 1, dueDate: new Date(), principal: 1000, interest: 100, totalAmount: 1100 } as any)
      ).rejects.toThrow('进件不存在')
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  GET LIST (基类)
  // ═══════════════════════════════════════════════════════════════
  describe('getList', () => {
    it('应该返回分页还款计划', async () => {
      mockPrisma.repaymentPlan.count.mockResolvedValue(3)
      mockPrisma.repaymentPlan.findMany.mockResolvedValue([
        makeRepaymentPlan({ period: 1 }),
        makeRepaymentPlan({ id: 2, period: 2 }),
        makeRepaymentPlan({ id: 3, period: 3 })
      ])

      const result = await service.getList({ current: 1, size: 10 } as any) as any

      expect(result.list).toHaveLength(3)
      expect(result.meta.total).toBe(3)
    })

    it('应该支持按 applicationId 筛选', async () => {
      mockPrisma.repaymentPlan.count.mockResolvedValue(0)
      mockPrisma.repaymentPlan.findMany.mockResolvedValue([])

      await service.getList({ applicationId: 1, current: 1, size: 10 } as any)

      expect(mockPrisma.repaymentPlan.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ applicationId: 1 })
        })
      )
    })

    it('应该支持按 status 筛选', async () => {
      mockPrisma.repaymentPlan.count.mockResolvedValue(0)
      mockPrisma.repaymentPlan.findMany.mockResolvedValue([])

      await service.getList({ status: RepaymentStatus.OVERDUE, current: 1, size: 10 } as any)

      expect(mockPrisma.repaymentPlan.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: RepaymentStatus.OVERDUE })
        })
      )
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  GET DETAIL (基类)
  // ═══════════════════════════════════════════════════════════════
  describe('getDetail', () => {
    it('应该返回还款计划详情', async () => {
      mockPrisma.repaymentPlan.findFirst.mockResolvedValue(
        makeRepaymentPlan({
          records: [
            { id: 1, amount: 5000, principal: 4500, interest: 500, createdAt: new Date() }
          ]
        })
      )

      const result = await service.getDetail(1) as any

      expect(result.period).toBe(1)
      expect(result.records).toHaveLength(1)
    })

    it('不存在时应抛出 NotFoundException', async () => {
      mockPrisma.repaymentPlan.findFirst.mockResolvedValue(null)

      await expect(service.getDetail(999)).rejects.toThrow(NotFoundException)
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  UPDATE / REMOVE (基类)
  // ═══════════════════════════════════════════════════════════════
  describe('update', () => {
    it('应该成功更新还款计划', async () => {
      mockPrisma.repaymentPlan.findFirst.mockResolvedValue(makeRepaymentPlan())
      mockPrisma.application.findFirst.mockResolvedValue({ id: 1 })
      mockPrisma.repaymentPlan.update.mockResolvedValue(
        makeRepaymentPlan({ status: RepaymentStatus.PAID, paidTotal: 8900 })
      )

      await service.update(1, { applicationId: 1, status: RepaymentStatus.PAID } as any)

      expect(mockPrisma.repaymentPlan.update).toHaveBeenCalled()
    })
  })

  describe('remove', () => {
    it('应该软删除还款计划', async () => {
      mockPrisma.repaymentPlan.findFirst.mockResolvedValue(makeRepaymentPlan())
      mockPrisma.repaymentPlan.update.mockResolvedValue({ id: 1 })

      const result = await service.remove(1) as any

      expect(result.id).toBe(1)
      expect(mockPrisma.repaymentPlan.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ deletedAt: expect.any(Date) })
        })
      )
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  GET REPAYMENT PLANS (按进件查询)
  // ═══════════════════════════════════════════════════════════════
  describe('getRepaymentPlans', () => {
    it('应该返回进件的还款计划列表', async () => {
      mockPrisma.repaymentPlan.findMany.mockResolvedValue([
        makeRepaymentPlan({ period: 1 }),
        makeRepaymentPlan({ id: 2, period: 2 })
      ])
      mockPrisma.repaymentPlan.count.mockResolvedValue(2)

      const result = await service.getRepaymentPlans(1) as any

      expect(result.list).toHaveLength(2)
      expect(mockPrisma.repaymentPlan.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ applicationId: 1 }),
          orderBy: { period: 'asc' }
        })
      )
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  REGISTER REPAYMENT (还款登记)
  // ═══════════════════════════════════════════════════════════════
  describe('registerRepayment', () => {
    it('应该成功登记还款并更新计划为 PAID', async () => {
      const plan = makeRepaymentPlan({
        totalAmount: 8900,
        paidPrincipal: 0,
        paidInterest: 0,
        paidTotal: 0,
        penaltyAmount: 0,
        status: RepaymentStatus.NOT_DUE
      })
      mockPrisma.user.findFirst.mockResolvedValue({ id: 1 })
      mockPrisma.repaymentPlan.findFirst.mockResolvedValue(plan)
      mockPrisma.repaymentPlan.updateMany.mockResolvedValue({ count: 1 })
      mockPrisma.repaymentRecord.create.mockResolvedValue({ id: 1 })

      const result = await service.registerRepayment(1, {
        amount: 8900,
        principal: 8333.33,
        interest: 566.67,
        paymentMethod: 'BANK_TRANSFER',
        createdBy: 1
      }) as any

      expect(mockPrisma.$transaction).toHaveBeenCalled()
      expect(mockPrisma.repaymentPlan.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: 1, paidTotal: 0 }),
          data: expect.objectContaining({ status: RepaymentStatus.PAID })
        })
      )
      expect(mockPrisma.repaymentRecord.create).toHaveBeenCalled()
    })

    it('部分还款应标记为 PARTIAL 状态', async () => {
      const plan = makeRepaymentPlan({
        totalAmount: 8900,
        paidTotal: 0,
        penaltyAmount: 0,
        status: RepaymentStatus.NOT_DUE
      })
      mockPrisma.user.findFirst.mockResolvedValue({ id: 1 })
      mockPrisma.repaymentPlan.findFirst.mockResolvedValue(plan)
      mockPrisma.repaymentPlan.updateMany.mockResolvedValue({ count: 1 })

      await service.registerRepayment(1, {
        amount: 4000,
        principal: 3500,
        interest: 500,
        paymentMethod: 'CASH',
        createdBy: 1
      })

      expect(mockPrisma.repaymentPlan.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: RepaymentStatus.PARTIAL })
        })
      )
    })

    it('还款计划不存在时应抛出异常', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ id: 1 })
      mockPrisma.repaymentPlan.findFirst.mockResolvedValue(null)

      await expect(
        service.registerRepayment(999, { amount: 1000, paymentMethod: 'CASH', createdBy: 1 })
      ).rejects.toThrow('还款计划不存在')
    })

    it('已结清的还款计划不能重复还款', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ id: 1 })
      mockPrisma.repaymentPlan.findFirst.mockResolvedValue(
        makeRepaymentPlan({ status: RepaymentStatus.PAID })
      )

      await expect(
        service.registerRepayment(1, { amount: 1000, paymentMethod: 'CASH', createdBy: 1 })
      ).rejects.toThrow('该期已结清，无法重复还款')
    })

    it('乐观锁冲突时应抛出异常', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ id: 1 })
      mockPrisma.repaymentPlan.findFirst.mockResolvedValue(makeRepaymentPlan())
      mockPrisma.repaymentPlan.updateMany.mockResolvedValue({ count: 0 })

      await expect(
        service.registerRepayment(1, { amount: 1000, paymentMethod: 'CASH', createdBy: 1 })
      ).rejects.toThrow('还款状态已变更，请刷新后重试')
    })

    it('登记人不存在时应抛出异常', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null)

      await expect(
        service.registerRepayment(1, { amount: 1000, paymentMethod: 'CASH', createdBy: 999 })
      ).rejects.toThrow('登记人不存在')
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  REGISTER REPAYMENT BY APPLICATION
  // ═══════════════════════════════════════════════════════════════
  describe('registerRepaymentByApplication', () => {
    it('应该找到第一个未还清计划进行还款', async () => {
      mockPrisma.repaymentPlan.findFirst.mockResolvedValue(makeRepaymentPlan({ id: 5 }))
      mockPrisma.user.findFirst.mockResolvedValue({ id: 1 })
      mockPrisma.repaymentPlan.updateMany.mockResolvedValue({ count: 1 })
      mockPrisma.repaymentRecord.create.mockResolvedValue({ id: 1 })

      await service.registerRepaymentByApplication(1, {
        amount: 8900,
        paymentMethod: 'BANK_TRANSFER'
      })

      // 第一次 findFirst 是查找未还清计划
      expect(mockPrisma.repaymentPlan.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            applicationId: 1,
            status: { in: [RepaymentStatus.NOT_DUE, RepaymentStatus.OVERDUE, RepaymentStatus.PARTIAL] }
          }),
          orderBy: { period: 'asc' }
        })
      )
    })

    it('没有待还款计划时应抛出异常', async () => {
      mockPrisma.repaymentPlan.findFirst.mockResolvedValue(null)

      await expect(
        service.registerRepaymentByApplication(1, { amount: 1000, paymentMethod: 'CASH' })
      ).rejects.toThrow('没有待还款的计划')
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  OVERDUE PLANS (逾期查询)
  // ═══════════════════════════════════════════════════════════════
  describe('getOverduePlans', () => {
    it('应该返回逾期还款计划', async () => {
      mockPrisma.repaymentPlan.findMany.mockResolvedValue([
        makeRepaymentPlan({ status: RepaymentStatus.OVERDUE, overdueDays: 15 })
      ])
      mockPrisma.repaymentPlan.count.mockResolvedValue(1)

      const result = await service.getOverduePlans({ page: 1, pageSize: 20 }) as any

      expect(result.items).toHaveLength(1)
      expect(result.total).toBe(1)
      expect(mockPrisma.repaymentPlan.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: RepaymentStatus.OVERDUE })
        })
      )
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  COLLECTION RECORDS (催收记录)
  // ═══════════════════════════════════════════════════════════════
  describe('addCollectionRecord', () => {
    it('应该创建催收记录', async () => {
      mockPrisma.collectionRecord.create.mockResolvedValue({ id: 1 })

      const result = await service.addCollectionRecord(1, {
        collectorId: 1,
        collectType: 'PHONE',
        content: '电话催收',
        result: '已接通'
      }) as any

      expect(result.id).toBe(1)
      expect(mockPrisma.collectionRecord.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            applicationId: 1,
            collectType: 'PHONE',
            content: '电话催收'
          })
        })
      )
    })
  })

  describe('getCollectionRecords', () => {
    it('应该返回催收记录列表', async () => {
      mockPrisma.collectionRecord.findMany.mockResolvedValue([
        { id: 1, content: '电话催收' }
      ])
      mockPrisma.collectionRecord.count.mockResolvedValue(1)

      const result = await service.getCollectionRecords(1) as any

      expect(result.list).toHaveLength(1)
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  EARLY REPAYMENT (提前还款)
  // ═══════════════════════════════════════════════════════════════
  describe('applyEarlyRepayment', () => {
    it('全额提前还款应该创建申请并标记所有计划为 PAID', async () => {
      mockPrisma.repaymentPlan.findMany.mockResolvedValue([
        makeRepaymentPlan({ id: 1, period: 1, principal: 5000, interest: 500 }),
        makeRepaymentPlan({ id: 2, period: 2, principal: 5000, interest: 400 })
      ])
      mockPrisma.earlyRepayment.create.mockResolvedValue({ id: 1, repayType: 'FULL' })
      mockPrisma.repaymentPlan.update.mockResolvedValue({ id: 1 })

      await service.applyEarlyRepayment(1, {
        repayType: 'FULL',
        amount: 10900,
        principal: 10000,
        interest: 900,
        reason: '提前结清'
      })

      expect(mockPrisma.$transaction).toHaveBeenCalled()
      expect(mockPrisma.earlyRepayment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            applicationId: 1,
            repayType: 'FULL',
            amount: 10900
          })
        })
      )
    })

    it('未传金额时应自动计算', async () => {
      mockPrisma.repaymentPlan.findMany.mockResolvedValue([
        makeRepaymentPlan({ principal: 5000, interest: 500 })
      ])
      mockPrisma.earlyRepayment.create.mockResolvedValue({ id: 1 })

      await service.applyEarlyRepayment(1, { repayType: 'FULL' })

      expect(mockPrisma.earlyRepayment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            amount: 5500,
            principal: 5000,
            interest: 500
          })
        })
      )
    })
  })

  describe('approveEarlyRepayment', () => {
    it('应该审批提前还款', async () => {
      mockPrisma.earlyRepayment.update.mockResolvedValue({ id: 1, repayStatus: 'APPROVED' })

      await service.approveEarlyRepayment(1, { approvedBy: 1, remark: '同意' })

      expect(mockPrisma.earlyRepayment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            repayStatus: 'APPROVED',
            approvedBy: 1
          })
        })
      )
    })
  })

  describe('completeEarlyRepayment', () => {
    it('应该完成提前还款', async () => {
      mockPrisma.earlyRepayment.update.mockResolvedValue({ id: 1, repayStatus: 'COMPLETED' })

      await service.completeEarlyRepayment(1)

      expect(mockPrisma.earlyRepayment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ repayStatus: 'COMPLETED' })
        })
      )
    })
  })

  describe('getEarlyRepayments', () => {
    it('应该返回提前还款列表', async () => {
      mockPrisma.earlyRepayment.findMany.mockResolvedValue([
        { id: 1, repayType: 'FULL', amount: 100000 }
      ])

      const result = await service.getEarlyRepayments(1) as any

      expect(result).toHaveLength(1)
      expect(mockPrisma.earlyRepayment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ applicationId: 1 })
        })
      )
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  SETTLE APPLICATION (结清)
  // ═══════════════════════════════════════════════════════════════
  describe('settleApplication', () => {
    it('所有计划已结清时应成功结清进件', async () => {
      mockPrisma.repaymentPlan.count.mockResolvedValue(0)
      mockPrisma.repaymentPlan.updateMany.mockResolvedValue({ count: 3 })

      await service.settleApplication(mockPrisma, 1)

      expect(mockPrisma.repaymentPlan.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: RepaymentStatus.SETTLED }
        })
      )
    })

    it('仍有未结清计划时应抛出异常', async () => {
      mockPrisma.repaymentPlan.count.mockResolvedValue(2)

      await expect(service.settleApplication(mockPrisma, 1)).rejects.toThrow('仍有未结清还款计划')
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  还款计划状态
  // ═══════════════════════════════════════════════════════════════
  describe('还款计划状态', () => {
    it('NOT_DUE 状态的还款计划', async () => {
      mockPrisma.repaymentPlan.findFirst.mockResolvedValue(
        makeRepaymentPlan({ status: RepaymentStatus.NOT_DUE, overdueDays: 0 })
      )

      const result = await service.getDetail(1) as any

      expect(result.status).toBe(RepaymentStatus.NOT_DUE)
      expect(result.overdueDays).toBe(0)
    })

    it('OVERDUE 状态的还款计划应有逾期天数', async () => {
      mockPrisma.repaymentPlan.findFirst.mockResolvedValue(
        makeRepaymentPlan({ status: RepaymentStatus.OVERDUE, overdueDays: 15 })
      )

      const result = await service.getDetail(1) as any

      expect(result.status).toBe(RepaymentStatus.OVERDUE)
      expect(result.overdueDays).toBe(15)
    })

    it('PAID 状态的还款计划应有还款时间', async () => {
      mockPrisma.repaymentPlan.findFirst.mockResolvedValue(
        makeRepaymentPlan({
          status: RepaymentStatus.PAID,
          paidPrincipal: 8333.33,
          paidInterest: 566.67,
          paidTotal: 8900,
          paidAt: new Date('2026-08-01')
        })
      )

      const result = await service.getDetail(1) as any

      expect(result.status).toBe(RepaymentStatus.PAID)
      expect(result.paidTotal).toBe(8900)
      expect(result.paidAt).toBeDefined()
    })

    it('PARTIAL 状态的还款计划应部分还款', async () => {
      mockPrisma.repaymentPlan.findFirst.mockResolvedValue(
        makeRepaymentPlan({
          status: RepaymentStatus.PARTIAL,
          paidPrincipal: 4000,
          paidInterest: 500,
          paidTotal: 4500
        })
      )

      const result = await service.getDetail(1) as any

      expect(result.status).toBe(RepaymentStatus.PARTIAL)
      expect(result.paidTotal).toBe(4500)
    })
  })
})
