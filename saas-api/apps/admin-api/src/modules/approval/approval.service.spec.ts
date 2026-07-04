import { Test, TestingModule } from '@nestjs/testing'
import { ApprovalService } from './approval.service'
import { PrismaService } from '../prisma/prisma.service'
import { BadRequestException, NotFoundException } from '@nestjs/common'

jest.mock('../../common/tenant/tenant-context', () => ({
  getCurrentTenantId: jest.fn(() => 1)
}))

import { getCurrentTenantId } from '../../common/tenant/tenant-context'

describe('ApprovalService', () => {
  let service: ApprovalService
  let mockPrisma: jest.Mocked<PrismaService>

  const makeApprovalRecord = (overrides = {}) => ({
    id: 1,
    tenantId: 1,
    applicationId: 1,
    approverId: 1,
    stage: 'FIRST_REVIEW',
    action: 'PASS',
    opinion: '同意',
    amount: 80000,
    term: 12,
    rate: 7.5,
    deletedAt: null,
    application: { id: 1, applicationNo: 'APP-001' },
    approver: { id: 1, userName: 'admin', nickName: '管理员' },
    createdAt: new Date('2026-01-01'),
    ...overrides
  })

  beforeEach(async () => {
    ;(getCurrentTenantId as jest.Mock).mockReturnValue(1)

    mockPrisma = {
      approvalRecord: {
        count: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn()
      },
      application: { findFirst: jest.fn() },
      user: { findFirst: jest.fn() },
      $transaction: jest.fn((queries: any[]) => Promise.all(queries))
    } as unknown as jest.Mocked<PrismaService>

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApprovalService,
        { provide: PrismaService, useValue: mockPrisma }
      ]
    }).compile()

    service = module.get<ApprovalService>(ApprovalService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  // ═══════════════════════════════════════════════════════════════
  //  CREATE
  // ═══════════════════════════════════════════════════════════════
  describe('create', () => {
    it('应该成功创建审批记录', async () => {
      mockPrisma.application.findFirst!.mockResolvedValue({ id: 1 } as any)
      mockPrisma.user.findFirst!.mockResolvedValue({ id: 1 } as any)
      mockPrisma.approvalRecord.create!.mockResolvedValue(makeApprovalRecord())

      const result = await service.create({
        applicationId: 1,
        approverId: 1,
        stage: 'FIRST_REVIEW',
        action: 'PASS',
        opinion: '同意'
      })

      expect(result.id).toBe(1)
      expect(result.stage).toBe('FIRST_REVIEW')
      expect(result.action).toBe('PASS')
    })

    it('进件不存在时应抛出异常', async () => {
      mockPrisma.application.findFirst!.mockResolvedValue(null)

      await expect(
        service.create({ applicationId: 999, approverId: 1, stage: 'FIRST_REVIEW', action: 'PASS' })
      ).rejects.toThrow('进件不存在')
    })

    it('审批人不存在时应抛出异常', async () => {
      mockPrisma.application.findFirst!.mockResolvedValue({ id: 1 } as any)
      mockPrisma.user.findFirst!.mockResolvedValue(null)

      await expect(
        service.create({ applicationId: 1, approverId: 999, stage: 'FIRST_REVIEW', action: 'PASS' })
      ).rejects.toThrow('审批人不存在')
    })
  })

  describe('getList', () => {
    it('应该返回分页审批记录', async () => {
      mockPrisma.approvalRecord.count!.mockResolvedValue(2)
      mockPrisma.approvalRecord.findMany!.mockResolvedValue([
        makeApprovalRecord(),
        makeApprovalRecord({ id: 2, stage: 'FINAL_REVIEW', action: 'PASS' })
      ])

      const result = await service.getList({ current: 1, size: 10 }) as any

      expect(result.records).toHaveLength(2)
      expect(result.total).toBe(2)
    })

    it('应该支持按 applicationId 筛选', async () => {
      mockPrisma.approvalRecord.count!.mockResolvedValue(0)
      mockPrisma.approvalRecord.findMany!.mockResolvedValue([])

      await service.getList({ applicationId: 1, current: 1, size: 10 })

      expect(mockPrisma.approvalRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ applicationId: 1 })
        })
      )
    })

    it('应该支持按 stage 筛选', async () => {
      mockPrisma.approvalRecord.count!.mockResolvedValue(0)
      mockPrisma.approvalRecord.findMany!.mockResolvedValue([])

      await service.getList({ stage: 'RISK_PRE', current: 1, size: 10 })

      expect(mockPrisma.approvalRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ stage: 'RISK_PRE' })
        })
      )
    })

    it('应该支持按 action 筛选', async () => {
      mockPrisma.approvalRecord.count!.mockResolvedValue(0)
      mockPrisma.approvalRecord.findMany!.mockResolvedValue([])

      await service.getList({ action: 'REJECT', current: 1, size: 10 })

      expect(mockPrisma.approvalRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ action: 'REJECT' })
        })
      )
    })
  })

  describe('getDetail', () => {
    it('应该返回审批记录详情', async () => {
      mockPrisma.approvalRecord.findFirst!.mockResolvedValue(makeApprovalRecord())

      const result = (await service.getDetail(1)) as any

      expect(result.stage).toBe('FIRST_REVIEW')
      expect(result.action).toBe('PASS')
      expect(result.opinion).toBe('同意')
      expect(result.amount).toBe(80000)
    })

    it('不存在时应抛出 NotFoundException', async () => {
      mockPrisma.approvalRecord.findFirst!.mockResolvedValue(null)

      await expect(service.getDetail(999)).rejects.toThrow(NotFoundException)
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  UPDATE
  // ═══════════════════════════════════════════════════════════════
  describe('update', () => {
    it('应该成功更新审批记录', async () => {
      mockPrisma.approvalRecord.findFirst!.mockResolvedValue(makeApprovalRecord())
      mockPrisma.application.findFirst!.mockResolvedValue({ id: 1 } as any)
      mockPrisma.user.findFirst!.mockResolvedValue({ id: 1 } as any)
      mockPrisma.approvalRecord.update!.mockResolvedValue(makeApprovalRecord({ opinion: '修改意见' }))

      await service.update(1, { applicationId: 1, approverId: 1, opinion: '修改意见' })

      expect(mockPrisma.approvalRecord.update).toHaveBeenCalled()
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  REMOVE
  // ═══════════════════════════════════════════════════════════════
  describe('remove', () => {
    it('应该软删除审批记录', async () => {
      mockPrisma.approvalRecord.findFirst!.mockResolvedValue(makeApprovalRecord())
      mockPrisma.approvalRecord.update!.mockResolvedValue({ id: 1 })

      const result = await service.remove(1)

      expect(result.id).toBe(1)
      expect(mockPrisma.approvalRecord.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ deletedAt: expect.any(Date) })
        })
      )
    })
  })
})
