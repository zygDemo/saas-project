import { Test, TestingModule } from '@nestjs/testing'
import { ApplicationService } from './application.service'
import { PrismaService } from '../prisma/prisma.service'
import { FlowConfigService } from '../flow-config/flow-config.service'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import {
  ApplicationStatus,
  ApprovalAction,
  DisbursementStatus,
  RepaymentStatus,
  SignStatus
} from '@prisma/client'

jest.mock('../../common/utils/application-no')
jest.mock('../../common/tenant/tenant-context', () => ({
  getCurrentTenantId: jest.fn(() => 1)
}))

import { getCurrentTenantId } from '../../common/tenant/tenant-context'

describe('ApplicationService', () => {
  let service: ApplicationService
  let mockPrisma: jest.Mocked<PrismaService>
  let mockFlowConfig: jest.Mocked<FlowConfigService>

  // ─── Reusable mock factories ─────────────────────────────────
  const mockTx = () => ({
    application: {
      update: jest.fn().mockResolvedValue({ id: 1 }),
      findFirst: jest.fn()
    },
    approvalRecord: { create: jest.fn().mockResolvedValue({ id: 1 }) },
    signRecord: {
      upsert: jest.fn().mockResolvedValue({ id: 1 }),
      update: jest.fn().mockResolvedValue({ id: 1 })
    },
    disbursement: {
      upsert: jest.fn().mockResolvedValue({ id: 1 }),
      findFirst: jest.fn()
    },
    repaymentPlan: {
      count: jest.fn().mockResolvedValue(0),
      createMany: jest.fn().mockResolvedValue({ count: 0 }),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn()
    },
    repaymentRecord: { create: jest.fn() },
    lead: { update: jest.fn() }
  })

  const makeApplication = (overrides: Record<string, unknown> = {}) => ({
    id: 1,
    applicationNo: 'APP-001',
    status: ApplicationStatus.DRAFT,
    currentNode: 1100,
    currentStatus: 10,
    tenantId: 1,
    orgId: 1,
    customerId: 1,
    productId: 1,
    funderId: 1,
    creatorId: 1,
    sourceLeadId: null,
    amount: 100000,
    term: 12,
    rate: 8.5,
    approvedAmount: null,
    approvedTerm: null,
    approvedRate: null,
    remark: null,
    supplementReason: null,
    supplementDeadline: null,
    businessType: 'CAR_LOAN',
    repaymentMethod: '等额本息',
    org: { id: 1, name: '测试机构', flowConfigs: [] },
    customer: { id: 1, name: '张三', phone: '13800138000', vehicles: [] },
    product: { id: 1, name: '车抵贷产品' },
    funder: { id: 1, name: '测试资方' },
    creator: { id: 1, userName: 'admin', nickName: '管理员' },
    files: [],
    approvals: [],
    signRecord: null,
    disbursement: null,
    repayments: [],
    ...overrides
  })

  beforeEach(async () => {
    ;(getCurrentTenantId as jest.Mock).mockReturnValue(1)

    mockPrisma = {
      application: {
        count: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        groupBy: jest.fn(),
        aggregate: jest.fn()
      },
      customer: { findFirst: jest.fn(), count: jest.fn() },
      product: { findFirst: jest.fn(), count: jest.fn() },
      funder: { findFirst: jest.fn(), count: jest.fn() },
      organization: { findFirst: jest.fn(), count: jest.fn() },
      user: { findFirst: jest.fn(), count: jest.fn() },
      role: { findFirst: jest.fn() },
      approvalRecord: { findFirst: jest.fn(), count: jest.fn(), create: jest.fn() },
      signRecord: { findFirst: jest.fn(), upsert: jest.fn(), update: jest.fn() },
      disbursement: { findFirst: jest.fn(), upsert: jest.fn() },
      repaymentPlan: { count: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(), update: jest.fn(), updateMany: jest.fn(), createMany: jest.fn() },
      repaymentRecord: { create: jest.fn() },
      collectionRecord: { create: jest.fn(), findMany: jest.fn() },
      earlyRepayment: { create: jest.fn(), update: jest.fn(), findMany: jest.fn() },
      lead: { update: jest.fn() },
      $transaction: jest.fn((queries: any[]) => Promise.all(queries)),
      $queryRaw: jest.fn()
    } as unknown as jest.Mocked<PrismaService>

    mockFlowConfig = {
      getFlowMappings: jest.fn().mockResolvedValue({
        nodeNames: {
          1100: '提交申请', 1200: '预审', 1250: '资方预审',
          1300: '资料补充', 1400: '风控初审', 1450: '风控终审',
          1500: '资方终审', 1600: '签约办理', 1660: '待请款',
          1700: '请款资料', 1800: '资方放款', 1900: '贷后还款'
        },
        nodePhases: {
          1100: 1000, 1200: 1000, 1250: 1000,
          1300: 1300, 1400: 1400, 1450: 1400,
          1500: 1500, 1600: 1600, 1660: 1600,
          1700: 1700, 1800: 1700, 1900: 1900
        },
        phaseNames: {
          1000: '预审阶段', 1300: '补件阶段', 1400: '风控审批',
          1500: '资方终审', 1600: '签约阶段', 1700: '请款放款', 1900: '贷后阶段'
        }
      })
    } as unknown as jest.Mocked<FlowConfigService>

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: FlowConfigService, useValue: mockFlowConfig }
      ]
    }).compile()

    service = module.get<ApplicationService>(ApplicationService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  // ═══════════════════════════════════════════════════════════════
  //  CREATE
  // ═══════════════════════════════════════════════════════════════
  describe('create', () => {
    it('应该使用传入的申请编号创建', async () => {
      mockPrisma.customer.findFirst!.mockResolvedValue({ id: 1, orgId: 1 } as any)
      mockPrisma.product.findFirst!.mockResolvedValue({ id: 1, orgId: 1 } as any)
      mockPrisma.funder.findFirst!.mockResolvedValue({ id: 1, orgId: 1 } as any)
      mockPrisma.organization.findFirst!.mockResolvedValue({ id: 1 } as any)
      mockPrisma.user.findFirst!.mockResolvedValue({ id: 1 } as any)
      mockPrisma.role.findFirst!.mockResolvedValue({ id: 1, code: 'admin' } as any)
      mockPrisma.application.create!.mockResolvedValue({
        id: 1,
        applicationNo: 'APP-001',
        status: ApplicationStatus.DRAFT
      })

      const result = (await service.create({
        applicationNo: 'APP-001',
        customerId: 1,
        orgId: 1,
        productId: 1,
        amount: 100000,
        term: 12,
        rate: 8.5,
        repaymentMethod: '等额本息',
        creatorId: 1
      })) as any

      expect(result.applicationNo).toBe('APP-001')
      expect(mockPrisma.application.create).toHaveBeenCalled()
    })

    it('客户不存在时应抛出 BadRequestException', async () => {
      mockPrisma.customer.findFirst!.mockResolvedValue(null)
      await expect(
        service.create({ customerId: 999, productId: 1, orgId: 1, amount: 100000, term: 12, rate: 8.5, repaymentMethod: '等额本息', creatorId: 1 })
      ).rejects.toThrow(BadRequestException)
    })

    it('产品不属于客户所属机构时应抛出异常', async () => {
      mockPrisma.customer.findFirst!.mockResolvedValue({ id: 1, orgId: 1 } as any)
      mockPrisma.organization.findFirst!.mockResolvedValue({ id: 1 } as any)
      mockPrisma.product.findFirst!.mockResolvedValue({ id: 1, orgId: 2 } as any)

      await expect(
        service.create({ customerId: 1, productId: 1, orgId: 1, amount: 100000, term: 12, rate: 8.5, repaymentMethod: '等额本息', creatorId: 1 })
      ).rejects.toThrow('产品不属于客户所属机构')
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  GET DETAIL
  // ═══════════════════════════════════════════════════════════════
  describe('getDetail', () => {
    it('应该返回申请详情及关联数据', async () => {
      mockPrisma.application.findFirst!.mockResolvedValue(makeApplication())

      const result = (await service.getDetail(1)) as any

      expect(result.id).toBe(1)
      expect(result.applicationNo).toBe('APP-001')
      expect(result.orgName).toBe('测试机构')
      expect(result.customerName).toBe('张三')
      expect(result.productName).toBe('车抵贷产品')
      expect(result.funderName).toBe('测试资方')
    })

    it('数据不存在时应该抛出 NotFoundException', async () => {
      mockPrisma.application.findFirst!.mockResolvedValue(null)
      await expect(service.getDetail(999)).rejects.toThrow(NotFoundException)
    })

    it('应该包含车辆、文件、审批、签约、放款、还款数据', async () => {
      mockPrisma.application.findFirst!.mockResolvedValue(
        makeApplication({
          customer: {
            id: 1, name: '张三', phone: '13800138000',
            vehicles: [{ id: 1, plateNumber: '京A12345', brand: '宝马', model: 'X5' }]
          },
          files: [{ id: 1, fileType: 'ID_CARD_FRONT', fileUrl: 'http://img.com/1.jpg' }],
          approvals: [{
            id: 1, stage: 'RISK_PRE', action: 'PASS',
            createdAt: new Date(), approver: { id: 1, userName: 'admin', nickName: '管理员' },
            opinion: '同意', amount: null
          }],
          signRecord: { id: 1, status: 'SIGNED', contractUrl: 'http://contract.pdf' },
          disbursement: { id: 1, status: 'DISBURSED', disburseAmount: 100000 },
          repayments: [{ id: 1, period: 1, totalAmount: 8900, status: 'NOT_DUE' }]
        })
      )

      const result = (await service.getDetail(1)) as any

      expect(result.vehicle.plateNumber).toBe('京A12345')
      expect(result.files).toHaveLength(1)
      expect(result.approvals).toHaveLength(1)
      expect(result.sign.status).toBe('SIGNED')
      expect(result.disbursement.status).toBe('DISBURSED')
      expect(result.repayments).toHaveLength(1)
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  FLOW LIST / ORDER LIST
  // ═══════════════════════════════════════════════════════════════
  describe('getFlowList', () => {
    it('应该返回分页流程列表', async () => {
      mockPrisma.application.count!.mockResolvedValue(1)
      mockPrisma.application.findMany!.mockResolvedValue([makeApplication()])

      const result = (await service.getFlowList({ orgId: 1, current: 1, size: 10 })) as any

      expect(result.records).toHaveLength(1)
      expect(result.total).toBe(1)
      expect(result.records[0].orgName).toBe('测试机构')
    })
  })

  describe('getOrderList', () => {
    it('应该返回分页订单列表', async () => {
      mockPrisma.application.count!.mockResolvedValue(2)
      mockPrisma.application.findMany!.mockResolvedValue([makeApplication()])

      const result = (await service.getOrderList({ orgId: 1, current: 1, size: 10 })) as any

      expect(result.records).toHaveLength(1)
      expect(result.total).toBe(2)
    })

    it('应该支持客户姓名模糊查询', async () => {
      mockPrisma.application.count!.mockResolvedValue(0)
      mockPrisma.application.findMany!.mockResolvedValue([])

      await service.getOrderList({ personName: '张三', current: 1, size: 10 })

      expect(mockPrisma.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            customer: expect.objectContaining({
              name: { contains: '张三', mode: 'insensitive' }
            })
          })
        })
      )
    })

    it('应该支持车牌号模糊查询', async () => {
      mockPrisma.application.count!.mockResolvedValue(0)
      mockPrisma.application.findMany!.mockResolvedValue([])

      await service.getOrderList({ plateNumber: '京A', current: 1, size: 10 })

      expect(mockPrisma.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            customer: expect.objectContaining({
              vehicles: { some: { plateNumber: { contains: '京A', mode: 'insensitive' } } }
            })
          })
        })
      )
    })

    it('应该支持关键字跨字段搜索', async () => {
      mockPrisma.application.count!.mockResolvedValue(0)
      mockPrisma.application.findMany!.mockResolvedValue([])

      await service.getOrderList({ keyword: '张三', current: 1, size: 10 })

      expect(mockPrisma.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { applicationNo: { contains: '张三', mode: 'insensitive' } }
            ])
          })
        })
      )
    })

    it('应该支持 businessNode 字符串映射', async () => {
      mockPrisma.application.count!.mockResolvedValue(0)
      mockPrisma.application.findMany!.mockResolvedValue([])

      await service.getOrderList({ businessNode: 'PRE_AUDIT', current: 1, size: 10 })

      expect(mockPrisma.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ currentNode: 1200 })
        })
      )
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  SUBMIT
  // ═══════════════════════════════════════════════════════════════
  describe('submit', () => {
    it('草稿状态应该成功提交', async () => {
      mockPrisma.application.findFirst!.mockResolvedValue(
        makeApplication({ status: ApplicationStatus.DRAFT })
      )
      mockPrisma.application.update!.mockResolvedValue({
        ...makeApplication(),
        status: ApplicationStatus.PENDING_RISK_PRE
      })

      const result = await service.submit(1)

      expect(mockPrisma.application.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({
            status: ApplicationStatus.PENDING_RISK_PRE,
            currentNode: 1200,
            currentStatus: 10
          })
        })
      )
    })

    it('待补充状态应该可以重新提交', async () => {
      mockPrisma.application.findFirst!.mockResolvedValue(
        makeApplication({ status: ApplicationStatus.PENDING_SUPPLEMENT })
      )
      mockPrisma.application.update!.mockResolvedValue({ id: 1 })

      await service.submit(1)

      expect(mockPrisma.application.update).toHaveBeenCalled()
    })

    it('非草稿/待补充状态应该抛出 BadRequestException', async () => {
      mockPrisma.application.findFirst!.mockResolvedValue(null)
      mockPrisma.application.findFirst!.mockResolvedValueOnce(null) // 不存在匹配状态的记录
        .mockResolvedValueOnce(makeApplication({ status: ApplicationStatus.PENDING_RISK_PRE })) // 存在记录但状态不对

      await expect(service.submit(1)).rejects.toThrow(BadRequestException)
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  RISK PRE (预审)
  // ═══════════════════════════════════════════════════════════════
  describe('riskPrePass', () => {
    it('风控预审通过应流转到资方预审', async () => {
      mockPrisma.application.findFirst!.mockResolvedValue(
        makeApplication({ status: ApplicationStatus.PENDING_RISK_PRE })
      )
      mockPrisma.application.update!.mockResolvedValue({
        ...makeApplication(),
        status: ApplicationStatus.PENDING_FUNDER_PRE
      })

      await service.riskPrePass(1, { reviewerId: 1, opinion: '通过' })

      expect(mockPrisma.application.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: ApplicationStatus.PENDING_FUNDER_PRE,
            currentNode: 1250,
            currentStatus: 10
          })
        })
      )
    })

    it('预审人不存在时应抛出异常', async () => {
      mockPrisma.user.findFirst!.mockResolvedValue(null)

      await expect(
        service.riskPrePass(1, { reviewerId: 999 })
      ).rejects.toThrow('预审人不存在')
    })
  })

  describe('riskPreReject', () => {
    it('风控预审拒绝应更新状态和备注', async () => {
      mockPrisma.application.findFirst!.mockResolvedValue(
        makeApplication({ status: ApplicationStatus.PENDING_RISK_PRE, remark: null })
      )
      mockPrisma.application.update!.mockResolvedValue({
        ...makeApplication(),
        status: ApplicationStatus.RISK_PRE_REJECTED
      })

      await service.riskPreReject(1, { opinion: '资料不全' })

      expect(mockPrisma.application.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: ApplicationStatus.RISK_PRE_REJECTED,
            currentNode: 1200,
            currentStatus: 30,
            remark: '资料不全'
          })
        })
      )
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  FUNDER PRE (资方预审)
  // ═══════════════════════════════════════════════════════════════
  describe('funderPrePass', () => {
    it('资方预审通过应创建审批记录并流转到待补充', async () => {
      mockPrisma.user.findFirst!.mockResolvedValue({ id: 1 } as any)
      mockPrisma.application.findFirst!.mockResolvedValue(
        makeApplication({ status: ApplicationStatus.PENDING_FUNDER_PRE })
      )
      mockPrisma.$transaction = jest.fn(async (fn: any) => {
        const tx = mockTx()
        tx.application.findFirst = jest.fn().mockResolvedValue(
          makeApplication({ status: ApplicationStatus.PENDING_FUNDER_PRE })
        )
        return fn(tx)
      })

      await service.funderPrePass(1, {
        approverId: 1,
        opinion: '通过',
        amount: 80000,
        term: 12,
        rate: 7.5,
        funderApprovalNo: 'FA-001'
      })

      expect(mockPrisma.$transaction).toHaveBeenCalled()
    })

    it('状态不是待资方预审时应抛出异常', async () => {
      mockPrisma.user.findFirst!.mockResolvedValue({ id: 1 } as any)
      mockPrisma.application.findFirst!.mockResolvedValue(null)
      // 第二次查询确认记录存在但状态不对
      mockPrisma.application.findFirst!.mockResolvedValueOnce(null)
        .mockResolvedValueOnce(makeApplication({ status: ApplicationStatus.DRAFT }))

      await expect(
        service.funderPrePass(1, { approverId: 1 })
      ).rejects.toThrow(BadRequestException)
    })
  })

  describe('funderPreReject', () => {
    it('资方预审拒绝应创建审批记录', async () => {
      mockPrisma.user.findFirst!.mockResolvedValue({ id: 1 } as any)
      mockPrisma.application.findFirst!.mockResolvedValue(
        makeApplication({ status: ApplicationStatus.PENDING_FUNDER_PRE })
      )
      mockPrisma.$transaction = jest.fn(async (fn: any) => {
        const tx = mockTx()
        return fn(tx)
      })

      await service.funderPreReject(1, { approverId: 1, opinion: '资质不符' })

      expect(mockPrisma.$transaction).toHaveBeenCalled()
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  COMPLETE SUPPLEMENT
  // ═══════════════════════════════════════════════════════════════
  describe('completeSupplement', () => {
    it('待补充状态完成补充应流转到风控初审', async () => {
      mockPrisma.application.findFirst!.mockResolvedValue(
        makeApplication({ status: ApplicationStatus.PENDING_SUPPLEMENT })
      )
      mockPrisma.application.update!.mockResolvedValue({ id: 1 })

      await service.completeSupplement(1, { reason: '已补齐资料', deadline: '2026-06-01' })

      expect(mockPrisma.application.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: ApplicationStatus.PENDING_FIRST_REVIEW,
            currentNode: 1400,
            currentStatus: 10
          })
        })
      )
    })

    it('资方预审通过状态也可以完成补充', async () => {
      mockPrisma.application.findFirst!.mockResolvedValue(
        makeApplication({ status: ApplicationStatus.FUNDER_PRE_PASSED })
      )
      mockPrisma.application.update!.mockResolvedValue({ id: 1 })

      await service.completeSupplement(1, {})

      expect(mockPrisma.application.update).toHaveBeenCalled()
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  APPROVE / REJECT (风控审批)
  // ═══════════════════════════════════════════════════════════════
  describe('approve', () => {
    it('初审通过应流转到终审', async () => {
      mockPrisma.user.findFirst!.mockResolvedValue({ id: 1 } as any)
      mockPrisma.application.findFirst!.mockResolvedValue(
        makeApplication({ status: ApplicationStatus.PENDING_FIRST_REVIEW })
      )
      mockPrisma.$transaction = jest.fn(async (fn: any) => {
        const tx = mockTx()
        return fn(tx)
      })

      await service.approve(1, { approverId: 1, opinion: '同意', amount: 80000, term: 12, rate: 7.5 })

      expect(mockPrisma.$transaction).toHaveBeenCalled()
    })

    it('终审通过应流转到资方终审/待签约', async () => {
      mockPrisma.user.findFirst!.mockResolvedValue({ id: 1 } as any)
      mockPrisma.application.findFirst!.mockResolvedValue(
        makeApplication({ status: ApplicationStatus.PENDING_FINAL_REVIEW })
      )
      mockPrisma.$transaction = jest.fn(async (fn: any) => {
        const tx = mockTx()
        return fn(tx)
      })

      await service.approve(1, { approverId: 1, opinion: '终审通过' })

      expect(mockPrisma.$transaction).toHaveBeenCalled()
    })

    it('审批人不存在时应抛出异常', async () => {
      mockPrisma.user.findFirst!.mockResolvedValue(null)

      await expect(
        service.approve(1, { approverId: 999 })
      ).rejects.toThrow('审批人不存在')
    })
  })

  describe('reject', () => {
    it('初审拒绝应流转到初审拒绝状态', async () => {
      mockPrisma.user.findFirst!.mockResolvedValue({ id: 1 } as any)
      mockPrisma.application.findFirst!.mockResolvedValue(
        makeApplication({ status: ApplicationStatus.PENDING_FIRST_REVIEW })
      )
      mockPrisma.$transaction = jest.fn(async (fn: any) => {
        const tx = mockTx()
        return fn(tx)
      })

      await service.reject(1, { approverId: 1, opinion: '征信不良' })

      expect(mockPrisma.$transaction).toHaveBeenCalled()
    })

    it('资方终审拒绝应流转到资方终审拒绝状态', async () => {
      mockPrisma.user.findFirst!.mockResolvedValue({ id: 1 } as any)
      mockPrisma.application.findFirst!.mockResolvedValue(
        makeApplication({ status: ApplicationStatus.PENDING_FUNDER_REVIEW })
      )
      mockPrisma.$transaction = jest.fn(async (fn: any) => {
        const tx = mockTx()
        return fn(tx)
      })

      await service.reject(1, { approverId: 1, opinion: '资方拒绝' })

      expect(mockPrisma.$transaction).toHaveBeenCalled()
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  REQUEST SUPPLEMENT (要求补件)
  // ═══════════════════════════════════════════════════════════════
  describe('requestSupplement', () => {
    it('应创建补件审批记录并流转到待补充', async () => {
      mockPrisma.user.findFirst!.mockResolvedValue({ id: 1 } as any)
      mockPrisma.application.findFirst!.mockResolvedValue(
        makeApplication({ status: ApplicationStatus.PENDING_FIRST_REVIEW })
      )
      mockPrisma.$transaction = jest.fn(async (fn: any) => {
        const tx = mockTx()
        return fn(tx)
      })

      await service.requestSupplement(1, {
        approverId: 1,
        reason: '缺少收入证明',
        deadline: '2026-07-01'
      })

      expect(mockPrisma.$transaction).toHaveBeenCalled()
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  SUBMIT FUNDER REVIEW
  // ═══════════════════════════════════════════════════════════════
  describe('submitFunderReview', () => {
    it('终审通过且有资方时应成功提交', async () => {
      mockPrisma.application.findFirst!.mockResolvedValue(
        makeApplication({
          status: ApplicationStatus.FINAL_REVIEW_PASSED,
          funderId: 1
        })
      )
      mockPrisma.application.update!.mockResolvedValue({ id: 1 })

      await service.submitFunderReview(1)

      expect(mockPrisma.application.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: ApplicationStatus.PENDING_FUNDER_REVIEW,
            currentNode: 1500,
            currentStatus: 10
          })
        })
      )
    })

    it('未选择资方时应抛出异常', async () => {
      mockPrisma.application.findFirst!.mockResolvedValue(
        makeApplication({
          status: ApplicationStatus.FINAL_REVIEW_PASSED,
          funderId: null
        })
      )

      await expect(service.submitFunderReview(1)).rejects.toThrow('未选择资方，不能提交资方审批')
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  FUNDER REVIEW (资方终审)
  // ═══════════════════════════════════════════════════════════════
  describe('funderPass', () => {
    it('资方审批通过应流转到待签约', async () => {
      mockPrisma.user.findFirst!.mockResolvedValue({ id: 1 } as any)
      mockPrisma.application.findFirst!.mockResolvedValue(
        makeApplication({ status: ApplicationStatus.PENDING_FUNDER_REVIEW })
      )
      mockPrisma.$transaction = jest.fn(async (fn: any) => {
        const tx = mockTx()
        return fn(tx)
      })

      await service.funderPass(1, { approverId: 1, opinion: '资方通过', amount: 80000, term: 12, rate: 7.5 })

      expect(mockPrisma.$transaction).toHaveBeenCalled()
    })
  })

  describe('funderReject', () => {
    it('资方审批拒绝应流转到资方拒绝状态', async () => {
      mockPrisma.user.findFirst!.mockResolvedValue({ id: 1 } as any)
      mockPrisma.application.findFirst!.mockResolvedValue(
        makeApplication({ status: ApplicationStatus.PENDING_FUNDER_REVIEW })
      )
      mockPrisma.$transaction = jest.fn(async (fn: any) => {
        const tx = mockTx()
        return fn(tx)
      })

      await service.funderReject(1, { approverId: 1, opinion: '资方拒绝' })

      expect(mockPrisma.$transaction).toHaveBeenCalled()
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  SIGNING (签约)
  // ═══════════════════════════════════════════════════════════════
  describe('startSigning', () => {
    it('终审通过后应成功发起签约', async () => {
      mockPrisma.application.findFirst!.mockResolvedValue(
        makeApplication({ status: ApplicationStatus.FINAL_REVIEW_PASSED })
      )
      mockPrisma.$transaction = jest.fn(async (fn: any) => {
        const tx = mockTx()
        return fn(tx)
      })

      await service.startSigning(1, { contractUrl: 'http://contract.pdf', expiredAt: new Date('2026-12-31') })

      expect(mockPrisma.$transaction).toHaveBeenCalled()
    })

    it('资方终审通过后也可以发起签约', async () => {
      mockPrisma.application.findFirst!.mockResolvedValue(
        makeApplication({ status: ApplicationStatus.FUNDER_REVIEW_PASSED })
      )
      mockPrisma.$transaction = jest.fn(async (fn: any) => {
        const tx = mockTx()
        return fn(tx)
      })

      await service.startSigning(1, {})

      expect(mockPrisma.$transaction).toHaveBeenCalled()
    })

    it('状态不对时应抛出异常', async () => {
      mockPrisma.application.findFirst!.mockResolvedValue(null)
      mockPrisma.application.findFirst!.mockResolvedValueOnce(null)
        .mockResolvedValueOnce(makeApplication({ status: ApplicationStatus.DRAFT }))

      await expect(service.startSigning(1, {})).rejects.toThrow(BadRequestException)
    })
  })

  describe('completeSigning', () => {
    it('签约完成应创建放款记录并流转到请款阶段', async () => {
      mockPrisma.application.findFirst!.mockResolvedValue(
        makeApplication({ status: ApplicationStatus.PENDING_SIGN })
      )
      mockPrisma.$transaction = jest.fn(async (fn: any) => {
        const tx = mockTx()
        return fn(tx)
      })

      await service.completeSigning(1, { contractUrl: 'http://contract.pdf', videoUrl: 'http://video.mp4' })

      expect(mockPrisma.$transaction).toHaveBeenCalled()
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  LOAN REQUEST (请款)
  // ═══════════════════════════════════════════════════════════════
  describe('submitLoanRequest', () => {
    it('已签约状态应成功提交请款资料', async () => {
      mockPrisma.application.findFirst!.mockResolvedValue(
        makeApplication({ status: ApplicationStatus.SIGNED })
      )
      mockPrisma.application.update!.mockResolvedValue({ id: 1 })

      await service.submitLoanRequest(1, { remark: '请款申请' })

      expect(mockPrisma.application.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: ApplicationStatus.LOAN_REQUEST_REVIEWING,
            currentNode: 1700,
            currentStatus: 10
          })
        })
      )
    })

    it('请款被拒绝后可以重新提交', async () => {
      mockPrisma.application.findFirst!.mockResolvedValue(
        makeApplication({ status: ApplicationStatus.LOAN_REQUEST_REJECTED })
      )
      mockPrisma.application.update!.mockResolvedValue({ id: 1 })

      await service.submitLoanRequest(1, {})

      expect(mockPrisma.application.update).toHaveBeenCalled()
    })
  })

  describe('approveLoanRequest', () => {
    it('请款审核通过应流转到请款已批准', async () => {
      mockPrisma.user.findFirst!.mockResolvedValue({ id: 1 } as any)
      mockPrisma.application.findFirst!.mockResolvedValue(
        makeApplication({ status: ApplicationStatus.LOAN_REQUEST_REVIEWING })
      )
      mockPrisma.$transaction = jest.fn(async (fn: any) => {
        const tx = mockTx()
        return fn(tx)
      })

      await service.approveLoanRequest(1, { approverId: 1, opinion: '同意请款' })

      expect(mockPrisma.$transaction).toHaveBeenCalled()
    })
  })

  describe('rejectLoanRequest', () => {
    it('请款审核拒绝应流转到请款被拒', async () => {
      mockPrisma.user.findFirst!.mockResolvedValue({ id: 1 } as any)
      mockPrisma.application.findFirst!.mockResolvedValue(
        makeApplication({ status: ApplicationStatus.LOAN_REQUEST_REVIEWING })
      )
      mockPrisma.$transaction = jest.fn(async (fn: any) => {
        const tx = mockTx()
        return fn(tx)
      })

      await service.rejectLoanRequest(1, { approverId: 1, opinion: '资料不足' })

      expect(mockPrisma.$transaction).toHaveBeenCalled()
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  GPS / MORTGAGE (抵押 & GPS)
  // ═══════════════════════════════════════════════════════════════
  describe('completeGpsInstall', () => {
    it('待放款状态应成功登记GPS安装', async () => {
      mockPrisma.application.findFirst!.mockResolvedValue(
        makeApplication({ status: ApplicationStatus.PENDING_DISBURSEMENT })
      )
      mockPrisma.disbursement.upsert!.mockResolvedValue({ id: 1 } as any)

      await service.completeGpsInstall(1, { gpsDeviceNo: 'GPS-001', gpsInstallImg: 'http://img.jpg' })

      expect(mockPrisma.disbursement.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            status: DisbursementStatus.GPS_INSTALLED,
            gpsDeviceNo: 'GPS-001'
          })
        })
      )
    })
  })

  describe('completeMortgage', () => {
    it('待放款状态应成功登记抵押', async () => {
      mockPrisma.application.findFirst!.mockResolvedValue(
        makeApplication({ status: ApplicationStatus.PENDING_DISBURSEMENT })
      )
      mockPrisma.disbursement.upsert!.mockResolvedValue({ id: 1 } as any)

      await service.completeMortgage(1, { mortgageStatus: 'DONE', mortgageImg: 'http://mortgage.jpg' })

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
  //  DISBURSEMENT (放款)
  // ═══════════════════════════════════════════════════════════════
  describe('requestDisbursement', () => {
    it('请款已批准应成功提交放款申请', async () => {
      mockPrisma.application.findFirst!.mockResolvedValue(
        makeApplication({ status: ApplicationStatus.LOAN_REQUEST_APPROVED })
      )
      mockPrisma.$transaction = jest.fn(async (fn: any) => {
        const tx = mockTx()
        tx.disbursement.findFirst = jest.fn().mockResolvedValue(null)
        return fn(tx)
      })

      await service.requestDisbursement(1, { remark: '申请放款' })

      expect(mockPrisma.$transaction).toHaveBeenCalled()
    })

    it('已有GPS安装记录时应保留GPS状态', async () => {
      mockPrisma.application.findFirst!.mockResolvedValue(
        makeApplication({ status: ApplicationStatus.PENDING_DISBURSEMENT })
      )
      mockPrisma.$transaction = jest.fn(async (fn: any) => {
        const tx = mockTx()
        tx.disbursement.findFirst = jest.fn().mockResolvedValue({
          id: 1,
          status: DisbursementStatus.GPS_INSTALLED
        })
        return fn(tx)
      })

      await service.requestDisbursement(1, {})

      expect(mockPrisma.$transaction).toHaveBeenCalled()
    })
  })

  describe('confirmDisbursement', () => {
    it('待放款状态应成功确认放款并生成还款计划', async () => {
      const application = makeApplication({
        status: ApplicationStatus.PENDING_DISBURSEMENT,
        approvedTerm: 12,
        approvedRate: 8.5,
        sourceLeadId: 10
      })
      mockPrisma.application.findFirst!.mockResolvedValue(application)
      mockPrisma.$transaction = jest.fn(async (fn: any) => {
        const tx = mockTx()
        tx.disbursement.findFirst = jest.fn().mockResolvedValue({
          id: 1,
          status: DisbursementStatus.PENDING_APPROVAL
        })
        tx.repaymentPlan.count = jest.fn().mockResolvedValue(0)
        return fn(tx)
      })

      await service.confirmDisbursement(1, {
        disburseAmount: 100000,
        disburseAccount: '622200000000',
        transactionNo: 'TXN-001'
      })

      expect(mockPrisma.$transaction).toHaveBeenCalled()
    })

    it('未提交出账申请时应抛出异常', async () => {
      mockPrisma.application.findFirst!.mockResolvedValue(
        makeApplication({ status: ApplicationStatus.PENDING_DISBURSEMENT })
      )
      mockPrisma.$transaction = jest.fn(async (fn: any) => {
        const tx = mockTx()
        tx.disbursement.findFirst = jest.fn().mockResolvedValue(null)
        return fn(tx)
      })

      await expect(
        service.confirmDisbursement(1, { disburseAmount: 100000 })
      ).rejects.toThrow('请先提交出账申请')
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  REPAYMENT (还款)
  // ═══════════════════════════════════════════════════════════════
  describe('registerRepayment', () => {
    it('应该成功登记还款并更新还款计划', async () => {
      const plan = {
        id: 1,
        applicationId: 1,
        period: 1,
        totalAmount: 8900,
        paidPrincipal: 0,
        paidInterest: 0,
        paidTotal: 0,
        penaltyAmount: 0,
        status: RepaymentStatus.NOT_DUE,
        paidAt: null
      }
      mockPrisma.user.findFirst!.mockResolvedValue({ id: 1 } as any)
      mockPrisma.$transaction = jest.fn(async (fn: any) => {
        const tx = mockTx()
        tx.repaymentPlan.findFirst = jest.fn().mockResolvedValue(plan)
        tx.repaymentPlan.update = jest.fn().mockResolvedValue({
          ...plan,
          paidPrincipal: 8000,
          paidInterest: 900,
          paidTotal: 8900,
          status: RepaymentStatus.PAID,
          records: [],
          application: {}
        })
        return fn(tx)
      })

      const result = await service.registerRepayment(1, {
        amount: 8900,
        principal: 8000,
        interest: 900,
        paymentMethod: 'BANK_TRANSFER',
        createdBy: 1
      })

      expect(mockPrisma.$transaction).toHaveBeenCalled()
    })

    it('还款计划不存在时应抛出异常', async () => {
      mockPrisma.user.findFirst!.mockResolvedValue({ id: 1 } as any)
      mockPrisma.$transaction = jest.fn(async (fn: any) => {
        const tx = mockTx()
        tx.repaymentPlan.findFirst = jest.fn().mockResolvedValue(null)
        return fn(tx)
      })

      await expect(
        service.registerRepayment(999, { amount: 1000, paymentMethod: 'CASH', createdBy: 1 })
      ).rejects.toThrow('还款计划不存在')
    })

    it('部分还款应标记为 PARTIAL 状态', async () => {
      const plan = {
        id: 1,
        totalAmount: 8900,
        paidPrincipal: 0,
        paidInterest: 0,
        paidTotal: 0,
        penaltyAmount: 0,
        status: RepaymentStatus.NOT_DUE,
        paidAt: null
      }
      mockPrisma.user.findFirst!.mockResolvedValue({ id: 1 } as any)
      mockPrisma.$transaction = jest.fn(async (fn: any) => {
        const tx = mockTx()
        tx.repaymentPlan.findFirst = jest.fn().mockResolvedValue(plan)
        tx.repaymentPlan.update = jest.fn().mockResolvedValue({
          ...plan, paidTotal: 4000, status: RepaymentStatus.PARTIAL,
          records: [], application: {}
        })
        return fn(tx)
      })

      await service.registerRepayment(1, {
        amount: 4000,
        principal: 3500,
        interest: 500,
        paymentMethod: 'CASH',
        createdBy: 1
      })

      expect(mockPrisma.$transaction).toHaveBeenCalled()
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  SETTLE (结清)
  // ═══════════════════════════════════════════════════════════════
  describe('settle', () => {
    it('已放款且全部还清时应成功结清', async () => {
      mockPrisma.application.findFirst!.mockResolvedValue(
        makeApplication({ status: ApplicationStatus.DISBURSED })
      )
      mockPrisma.$transaction = jest.fn(async (fn: any) => {
        const tx = mockTx()
        tx.repaymentPlan.count = jest.fn().mockResolvedValue(0) // 无未结清
        return fn(tx)
      })

      await service.settle(1, { remark: '全部结清' })

      expect(mockPrisma.$transaction).toHaveBeenCalled()
    })

    it('仍有未结清还款计划时应抛出异常', async () => {
      mockPrisma.application.findFirst!.mockResolvedValue(
        makeApplication({ status: ApplicationStatus.DISBURSED })
      )
      mockPrisma.$transaction = jest.fn(async (fn: any) => {
        const tx = mockTx()
        tx.repaymentPlan.count = jest.fn().mockResolvedValue(3) // 3期未结清
        return fn(tx)
      })

      await expect(service.settle(1, {})).rejects.toThrow('仍有未结清还款计划')
    })

    it('非已放款状态应抛出异常', async () => {
      mockPrisma.application.findFirst!.mockResolvedValue(null)
      mockPrisma.application.findFirst!.mockResolvedValueOnce(null)
        .mockResolvedValueOnce(makeApplication({ status: ApplicationStatus.PENDING_SIGN }))

      await expect(service.settle(1, {})).rejects.toThrow(BadRequestException)
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  REPAYMENT PLANS / OVERDUE / COLLECTION
  // ═══════════════════════════════════════════════════════════════
  describe('getRepaymentPlans', () => {
    it('应该返回还款计划列表', async () => {
      mockPrisma.repaymentPlan.findMany!.mockResolvedValue([
        { id: 1, period: 1, status: RepaymentStatus.NOT_DUE, records: [] },
        { id: 2, period: 2, status: RepaymentStatus.NOT_DUE, records: [] }
      ] as any)

      const result = await service.getRepaymentPlans(1)

      expect(result).toHaveLength(2)
      expect(mockPrisma.repaymentPlan.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ applicationId: 1 }),
          orderBy: { period: 'asc' }
        })
      )
    })
  })

  describe('getOverduePlans', () => {
    it('应该返回逾期还款计划', async () => {
      mockPrisma.repaymentPlan.findMany!.mockResolvedValue([
        { id: 1, status: RepaymentStatus.OVERDUE, dueDate: new Date() }
      ] as any)
      mockPrisma.repaymentPlan.count!.mockResolvedValue(1)

      const result = await service.getOverduePlans({ page: 1, pageSize: 20 })

      expect(result.items).toHaveLength(1)
      expect(result.total).toBe(1)
    })
  })

  describe('addCollectionRecord', () => {
    it('应该创建催收记录', async () => {
      mockPrisma.collectionRecord.create!.mockResolvedValue({ id: 1 } as any)

      await service.addCollectionRecord(1, {
        collectorId: 1,
        collectType: 'PHONE',
        content: '电话催收',
        result: '已接通'
      })

      expect(mockPrisma.collectionRecord.create).toHaveBeenCalled()
    })
  })

  describe('getCollectionRecords', () => {
    it('应该返回催收记录列表', async () => {
      mockPrisma.collectionRecord.findMany!.mockResolvedValue([
        { id: 1, content: '电话催收' }
      ] as any)

      const result = await service.getCollectionRecords(1)

      expect(result).toHaveLength(1)
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  EARLY REPAYMENT (提前还款)
  // ═══════════════════════════════════════════════════════════════
  describe('applyEarlyRepayment', () => {
    it('应该创建提前还款申请', async () => {
      mockPrisma.earlyRepayment.create!.mockResolvedValue({ id: 1 } as any)

      await service.applyEarlyRepayment(1, {
        repayType: 'FULL',
        amount: 100000,
        principal: 95000,
        interest: 5000,
        reason: '提前结清'
      })

      expect(mockPrisma.earlyRepayment.create).toHaveBeenCalled()
    })
  })

  describe('approveEarlyRepayment', () => {
    it('应该审批提前还款', async () => {
      mockPrisma.earlyRepayment.update!.mockResolvedValue({ id: 1, repayStatus: 'APPROVED' } as any)

      await service.approveEarlyRepayment(1, { approvedBy: 1, remark: '同意' })

      expect(mockPrisma.earlyRepayment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ repayStatus: 'APPROVED' })
        })
      )
    })
  })

  describe('completeEarlyRepayment', () => {
    it('应该完成提前还款', async () => {
      mockPrisma.earlyRepayment.update!.mockResolvedValue({ id: 1, repayStatus: 'COMPLETED' } as any)

      await service.completeEarlyRepayment(1)

      expect(mockPrisma.earlyRepayment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ repayStatus: 'COMPLETED' })
        })
      )
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  LIFECYCLE
  // ═══════════════════════════════════════════════════════════════
  describe('getLifecycle', () => {
    it('应该返回订单生命周期节点列表', async () => {
      mockPrisma.application.findFirst!.mockResolvedValue(
        makeApplication({
          status: ApplicationStatus.PENDING_RISK_PRE,
          currentNode: 1200,
          currentStatus: 10,
          approvals: [
            {
              id: 1,
              stage: 'RISK_PRE',
              action: ApprovalAction.PASS,
              createdAt: new Date('2026-01-01'),
              approver: { id: 1, userName: 'admin', nickName: '管理员' },
              opinion: '同意',
              amount: null
            }
          ]
        })
      )

      const result = (await service.getLifecycle(1)) as any

      expect(Array.isArray(result)).toBe(true)
      // 应包含待处理节点 + 审批记录
      expect(result.length).toBeGreaterThanOrEqual(2)
      // 第一个应该是待处理节点（因为 currentStatus === 10）
      expect(result[0].approvalStatus).toBe('待处理')
    })

    it('订单不存在时应该抛出 NotFoundException', async () => {
      mockPrisma.application.findFirst!.mockResolvedValue(null)
      await expect(service.getLifecycle(999)).rejects.toThrow(NotFoundException)
    })

    it('审批通过应该映射为"通过"状态', async () => {
      mockPrisma.application.findFirst!.mockResolvedValue(
        makeApplication({
          currentNode: 1400,
          currentStatus: 10,
          approvals: [
            {
              id: 1,
              stage: 'FIRST_REVIEW',
              action: ApprovalAction.PASS,
              createdAt: new Date('2026-01-01'),
              approver: { id: 1, userName: 'admin', nickName: '管理员' },
              opinion: '同意',
              amount: 80000
            }
          ]
        })
      )

      const result = (await service.getLifecycle(1)) as any
      const passItem = result.find((r: any) => r.approvalStatus === '通过')

      expect(passItem).toBeDefined()
      expect(passItem.approvalCost).toBe(80000)
    })

    it('审批拒绝应该映射为"拒绝"状态并包含拒绝原因', async () => {
      mockPrisma.application.findFirst!.mockResolvedValue(
        makeApplication({
          currentNode: 1200,
          currentStatus: 30,
          approvals: [
            {
              id: 1,
              stage: 'RISK_PRE',
              action: ApprovalAction.REJECT,
              createdAt: new Date('2026-01-01'),
              approver: { id: 1, userName: 'admin', nickName: '管理员' },
              opinion: '征信不良',
              amount: null
            }
          ]
        })
      )

      const result = (await service.getLifecycle(1)) as any
      const rejectItem = result.find((r: any) => r.approvalStatus === '拒绝')

      expect(rejectItem).toBeDefined()
      expect(rejectItem.rejectReason).toBe('征信不良')
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  E2E: FULL CAR LOAN LIFECYCLE
  // ═══════════════════════════════════════════════════════════════
  describe('E2E: 完整车贷生命周期', () => {
    it('应支持从草稿到结清的完整流程', async () => {
      // Helper: 模拟 findFirst 返回指定状态的申请
      const mockStatus = (status: ApplicationStatus) => {
        mockPrisma.application.findFirst!.mockResolvedValue(makeApplication({ status }))
      }

      // Helper: 模拟事务
      const mockTransaction = () => {
        mockPrisma.$transaction = jest.fn(async (fn: any) => {
          const tx = mockTx()
          tx.application.findFirst = jest.fn().mockImplementation(() => {
            return Promise.resolve(mockPrisma.application.findFirst?.mock.results[0]?.value)
          })
          return fn(tx)
        })
      }

      // 1. 创建申请（已在 create describe 中测试）

      // 2. 提交
      mockStatus(ApplicationStatus.DRAFT)
      mockPrisma.application.update!.mockResolvedValue({ id: 1, status: ApplicationStatus.PENDING_RISK_PRE })
      const submitResult = await service.submit(1)
      expect(mockPrisma.application.update).toHaveBeenCalled()

      // 3. 风控预审通过
      jest.clearAllMocks()
      mockStatus(ApplicationStatus.PENDING_RISK_PRE)
      mockPrisma.application.update!.mockResolvedValue({ id: 1, status: ApplicationStatus.PENDING_FUNDER_PRE })
      await service.riskPrePass(1, {})

      // 4. 资方预审通过
      jest.clearAllMocks()
      mockPrisma.user.findFirst!.mockResolvedValue({ id: 1 } as any)
      mockStatus(ApplicationStatus.PENDING_FUNDER_PRE)
      mockTransaction()
      await service.funderPrePass(1, { approverId: 1, amount: 80000, term: 12, rate: 7.5 })

      // 5. 完成资料补充
      jest.clearAllMocks()
      mockStatus(ApplicationStatus.PENDING_SUPPLEMENT)
      mockPrisma.application.update!.mockResolvedValue({ id: 1, status: ApplicationStatus.PENDING_FIRST_REVIEW })
      await service.completeSupplement(1, {})

      // 6. 风控初审通过
      jest.clearAllMocks()
      mockPrisma.user.findFirst!.mockResolvedValue({ id: 1 } as any)
      mockStatus(ApplicationStatus.PENDING_FIRST_REVIEW)
      mockTransaction()
      await service.approve(1, { approverId: 1, opinion: '初审通过' })

      // 7. 风控终审通过
      jest.clearAllMocks()
      mockPrisma.user.findFirst!.mockResolvedValue({ id: 1 } as any)
      mockStatus(ApplicationStatus.PENDING_FINAL_REVIEW)
      mockTransaction()
      await service.approve(1, { approverId: 1, opinion: '终审通过' })

      // 8. 提交资方审批
      jest.clearAllMocks()
      mockStatus(ApplicationStatus.FINAL_REVIEW_PASSED)
      mockPrisma.application.update!.mockResolvedValue({ id: 1, status: ApplicationStatus.PENDING_FUNDER_REVIEW })
      await service.submitFunderReview(1)

      // 9. 资方终审通过
      jest.clearAllMocks()
      mockPrisma.user.findFirst!.mockResolvedValue({ id: 1 } as any)
      mockStatus(ApplicationStatus.PENDING_FUNDER_REVIEW)
      mockTransaction()
      await service.funderPass(1, { approverId: 1 })

      // 10. 发起签约
      jest.clearAllMocks()
      mockStatus(ApplicationStatus.FUNDER_REVIEW_PASSED)
      mockTransaction()
      await service.startSigning(1, { contractUrl: 'http://contract.pdf' })

      // 11. 完成签约
      jest.clearAllMocks()
      mockStatus(ApplicationStatus.PENDING_SIGN)
      mockTransaction()
      await service.completeSigning(1, { contractUrl: 'http://contract.pdf' })

      // 12. 提交请款资料
      jest.clearAllMocks()
      mockStatus(ApplicationStatus.PENDING_LOAN_REQUEST)
      mockPrisma.application.update!.mockResolvedValue({ id: 1, status: ApplicationStatus.LOAN_REQUEST_REVIEWING })
      await service.submitLoanRequest(1, {})

      // 13. 请款审核通过
      jest.clearAllMocks()
      mockPrisma.user.findFirst!.mockResolvedValue({ id: 1 } as any)
      mockStatus(ApplicationStatus.LOAN_REQUEST_REVIEWING)
      mockTransaction()
      await service.approveLoanRequest(1, { approverId: 1 })

      // 14. 确认放款
      jest.clearAllMocks()
      mockStatus(ApplicationStatus.PENDING_DISBURSEMENT)
      mockPrisma.$transaction = jest.fn(async (fn: any) => {
        const tx = mockTx()
        tx.disbursement.findFirst = jest.fn().mockResolvedValue({
          id: 1, status: DisbursementStatus.PENDING_APPROVAL
        })
        tx.repaymentPlan.count = jest.fn().mockResolvedValue(0)
        return fn(tx)
      })
      await service.confirmDisbursement(1, { disburseAmount: 100000 })

      // 15. 结清
      jest.clearAllMocks()
      mockStatus(ApplicationStatus.DISBURSED)
      mockPrisma.$transaction = jest.fn(async (fn: any) => {
        const tx = mockTx()
        tx.repaymentPlan.count = jest.fn().mockResolvedValue(0)
        return fn(tx)
      })
      await service.settle(1, { remark: '全部结清' })

      // 验证所有关键步骤都被调用
      expect(true).toBe(true) // 如果执行到这里说明完整流程没有异常
    })
  })
})
