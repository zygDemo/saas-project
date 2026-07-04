import { Test, TestingModule } from '@nestjs/testing'
import { ApplicationService } from './application.service'
import { PrismaService } from '../prisma/prisma.service'
import { FlowConfigService } from '../flow-config/flow-config.service'
import { NotFoundException } from '@nestjs/common'
import { ApplicationStatus, ApprovalAction } from '@prisma/client'

jest.mock('../../common/utils/application-no')

describe('ApplicationService', () => {
  let service: ApplicationService
  let mockPrisma: jest.Mocked<PrismaService>
  let mockFlowConfig: jest.Mocked<FlowConfigService>

  beforeEach(async () => {
    mockPrisma = {
      application: {
        count: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        groupBy: jest.fn(),
        aggregate: jest.fn(),
      },
      customer: { findFirst: jest.fn(), count: jest.fn() },
      product: { findFirst: jest.fn(), count: jest.fn() },
      funder: { findFirst: jest.fn(), count: jest.fn() },
      organization: { findFirst: jest.fn(), count: jest.fn() },
      user: { findFirst: jest.fn(), count: jest.fn() },
      role: { findFirst: jest.fn() },
      approvalRecord: { findFirst: jest.fn(), count: jest.fn() },
      signRecord: { findFirst: jest.fn() },
      disbursement: { findFirst: jest.fn() },
      repaymentPlan: { count: jest.fn() },
      $transaction: jest.fn((queries: any[]) => Promise.all(queries)),
    } as unknown as jest.Mocked<PrismaService>

    mockFlowConfig = {
      getFlowMappings: jest.fn().mockResolvedValue({
        nodeNames: { 1100: '提交申请', 1200: '预审' },
        nodePhases: { 1100: 1000, 1200: 1000 },
        phaseNames: { 1000: '预审阶段' },
      }),
    } as unknown as jest.Mocked<FlowConfigService>

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: FlowConfigService, useValue: mockFlowConfig },
      ],
    }).compile()

    service = module.get<ApplicationService>(ApplicationService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

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
        status: ApplicationStatus.DRAFT,
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
        creatorId: 1,
      })) as any

      expect(result.applicationNo).toBe('APP-001')
      expect(mockPrisma.application.create).toHaveBeenCalled()
    })
  })

  describe('getDetail', () => {
    it('应该返回申请详情及关联数据', async () => {
      mockPrisma.application.findFirst!.mockResolvedValue({
        id: 1,
        applicationNo: 'APP-001',
        status: ApplicationStatus.DRAFT,
        org: { id: 1, name: '测试机构', flowConfigs: [] },
        customer: { id: 1, name: '张三', vehicles: [] },
        product: { id: 1, name: '车抵贷产品' },
        funder: { id: 1, name: '测试资方' },
        creator: { id: 1, userName: 'admin', nickName: '管理员' },
        files: [],
        approvals: [],
        signRecord: null,
        disbursement: null,
        repayments: [],
      })

      const result = (await service.getDetail(1)) as any

      expect(result.id).toBe(1)
      expect(result.applicationNo).toBe('APP-001')
      expect(result.orgName).toBe('测试机构')
      expect(mockPrisma.application.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          include: expect.any(Object),
        }),
      )
    })

    it('数据不存在时应该抛出 NotFoundException', async () => {
      mockPrisma.application.findFirst!.mockResolvedValue(null)

      await expect(service.getDetail(999)).rejects.toThrow(NotFoundException)
    })
  })

  describe('getFlowList', () => {
    it('应该返回分页流程列表', async () => {
      mockPrisma.application.count!.mockResolvedValue(1)
      mockPrisma.application.findMany!.mockResolvedValue([
        {
          id: 1,
          applicationNo: 'APP-001',
          status: ApplicationStatus.DRAFT,
          org: { flowConfigs: [] },
          customer: { vehicles: [] },
          product: { name: '产品' },
          funder: { name: '资方' },
          creator: { userName: 'admin', nickName: '管理员' },
        },
      ])

      const result = (await service.getFlowList({ orgId: 1, current: 1, size: 10 })) as any

      expect(result.records).toHaveLength(1)
      expect(result.total).toBe(1)
    })
  })

  describe('getOrderList', () => {
    it('应该返回分页订单列表', async () => {
      mockPrisma.application.count!.mockResolvedValue(2)
      mockPrisma.application.findMany!.mockResolvedValue([
        {
          id: 1,
          applicationNo: 'APP-001',
          status: ApplicationStatus.DRAFT,
          org: { flowConfigs: [] },
          customer: { vehicles: [] },
          product: { name: '产品' },
          funder: { name: '资方' },
          creator: { userName: 'admin', nickName: '管理员' },
        },
      ])

      const result = (await service.getOrderList({ orgId: 1, current: 1, size: 10 })) as any

      expect(result.records).toHaveLength(1)
      expect(result.total).toBe(2)
    })
  })

  describe('getLifecycle', () => {
    it('应该返回订单生命周期节点列表', async () => {
      mockPrisma.application.findFirst!.mockResolvedValue({
        id: 1,
        applicationNo: 'APP-001',
        status: ApplicationStatus.DRAFT,
        currentNode: 1200,
        currentStatus: 10,
        org: { id: 1, flowConfigs: [] },
        approvals: [
          {
            id: 1,
            stage: 'RISK_PRE',
            action: ApprovalAction.PASS,
            createdAt: new Date('2026-01-01'),
            approver: { id: 1, userName: 'admin', nickName: '管理员' },
            opinion: '同意',
            amount: null,
          },
        ],
      })

      const result = (await service.getLifecycle(1)) as any

      expect(Array.isArray(result)).toBe(true)
    })

    it('订单不存在时应该抛出 NotFoundException', async () => {
      mockPrisma.application.findFirst!.mockResolvedValue(null)

      await expect(service.getLifecycle(999)).rejects.toThrow(NotFoundException)
    })
  })
})
