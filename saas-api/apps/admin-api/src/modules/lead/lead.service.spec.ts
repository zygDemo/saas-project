import { Test, TestingModule } from '@nestjs/testing'
import { LeadService } from './lead.service'
import { PrismaService } from '../prisma/prisma.service'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { LeadStatus } from '@prisma/client'

jest.mock('../../common/tenant/tenant-context', () => ({
  getCurrentTenantId: jest.fn(() => 1)
}))

import { getCurrentTenantId } from '../../common/tenant/tenant-context'

describe('LeadService', () => {
  let service: LeadService
  let mockPrisma: jest.Mocked<PrismaService>

  const makeLead = (overrides = {}) => ({
    id: 1,
    tenantId: 1,
    orgId: 1,
    name: '王五',
    phone: '13700137000',
    status: LeadStatus.NEW,
    assigneeId: null,
    nextFollowAt: null,
    remark: null,
    deletedAt: null,
    org: { id: 1, name: '测试机构' },
    assignee: null,
    followUps: [],
    ...overrides
  })

  beforeEach(async () => {
    ;(getCurrentTenantId as jest.Mock).mockReturnValue(1)

    mockPrisma = {
      lead: {
        count: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn()
      },
      organization: { findFirst: jest.fn() },
      user: { findFirst: jest.fn() },
      leadFollowUp: { create: jest.fn() },
      $transaction: jest.fn((queries: any[]) => Promise.all(queries))
    } as unknown as jest.Mocked<PrismaService>

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeadService,
        { provide: PrismaService, useValue: mockPrisma }
      ]
    }).compile()

    service = module.get<LeadService>(LeadService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  // ═══════════════════════════════════════════════════════════════
  //  CREATE
  // ═══════════════════════════════════════════════════════════════
  describe('create', () => {
    it('应该成功创建线索', async () => {
      mockPrisma.organization.findFirst!.mockResolvedValue({ id: 1 } as any)
      mockPrisma.user.findFirst!.mockResolvedValue({ id: 1 } as any)
      mockPrisma.lead.create!.mockResolvedValue(makeLead())

      const result = await service.create({
        orgId: 1,
        name: '王五',
        phone: '13700137000',
        assigneeId: 1
      })

      expect(result.name).toBe('王五')
      expect(mockPrisma.lead.create).toHaveBeenCalled()
    })

    it('机构不存在时应抛出异常', async () => {
      mockPrisma.organization.findFirst!.mockResolvedValue(null)

      await expect(
        service.create({ orgId: 999, name: '王五', phone: '13700137000' })
      ).rejects.toThrow('机构不存在')
    })

    it('业务员不存在时应抛出异常', async () => {
      mockPrisma.organization.findFirst!.mockResolvedValue({ id: 1 } as any)
      mockPrisma.user.findFirst!.mockResolvedValue(null)

      await expect(
        service.create({ orgId: 1, name: '王五', phone: '13700137000', assigneeId: 999 })
      ).rejects.toThrow('业务员不存在')
    })
  })

  describe('getList', () => {
    it('应该返回分页线索列表', async () => {
      mockPrisma.lead.count!.mockResolvedValue(1)
      mockPrisma.lead.findMany!.mockResolvedValue([makeLead()])

      const result = await service.getList({ current: 1, size: 10 }) as any

      expect(result.records).toHaveLength(1)
      expect(result.total).toBe(1)
    })

    it('应该支持按姓名模糊搜索', async () => {
      mockPrisma.lead.count!.mockResolvedValue(0)
      mockPrisma.lead.findMany!.mockResolvedValue([])

      await service.getList({ name: '王五', current: 1, size: 10 })

      expect(mockPrisma.lead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: { contains: '王五', mode: 'insensitive' }
          })
        })
      )
    })

    it('应该支持按状态精确筛选', async () => {
      mockPrisma.lead.count!.mockResolvedValue(0)
      mockPrisma.lead.findMany!.mockResolvedValue([])

      await service.getList({ status: LeadStatus.NEW, current: 1, size: 10 })

      expect(mockPrisma.lead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: LeadStatus.NEW })
        })
      )
    })

    it('应该支持按 assigneeId 筛选', async () => {
      mockPrisma.lead.count!.mockResolvedValue(0)
      mockPrisma.lead.findMany!.mockResolvedValue([])

      await service.getList({ assigneeId: 1, current: 1, size: 10 })

      expect(mockPrisma.lead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ assigneeId: 1 })
        })
      )
    })
  })

  describe('getDetail', () => {
    it('应该返回线索详情及跟进记录', async () => {
      mockPrisma.lead.findFirst!.mockResolvedValue(
        makeLead({
          followUps: [
            { id: 1, followType: 'PHONE', content: '电话沟通', createdAt: new Date() }
          ]
        })
      )

      const result = (await service.getDetail(1)) as any

      expect(result.followUps).toHaveLength(1)
    })

    it('不存在时应抛出 NotFoundException', async () => {
      mockPrisma.lead.findFirst!.mockResolvedValue(null)

      await expect(service.getDetail(999)).rejects.toThrow(NotFoundException)
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  ASSIGN
  // ═══════════════════════════════════════════════════════════════
  describe('assign', () => {
    it('应该成功分配线索给业务员', async () => {
      mockPrisma.lead.findFirst!.mockResolvedValue(makeLead())
      mockPrisma.user.findFirst!.mockResolvedValue({ id: 2 } as any)
      mockPrisma.lead.update!.mockResolvedValue(
        makeLead({ assigneeId: 2, status: LeadStatus.PENDING_FOLLOW })
      )

      const result = await service.assign(1, { assigneeId: 2, remark: '分配给新业务员' })

      expect(result.assigneeId).toBe(2)
      expect(result.status).toBe(LeadStatus.PENDING_FOLLOW)
      expect(mockPrisma.lead.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            assigneeId: 2,
            status: LeadStatus.PENDING_FOLLOW
          })
        })
      )
    })

    it('线索不存在时应抛出异常', async () => {
      mockPrisma.lead.findFirst!.mockResolvedValue(null)

      await expect(service.assign(999, { assigneeId: 1 })).rejects.toThrow(NotFoundException)
    })

    it('业务员不存在时应抛出异常', async () => {
      mockPrisma.lead.findFirst!.mockResolvedValue(makeLead())
      mockPrisma.user.findFirst!.mockResolvedValue(null)

      await expect(service.assign(1, { assigneeId: 999 })).rejects.toThrow('业务员不存在')
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  ADD FOLLOW UP
  // ═══════════════════════════════════════════════════════════════
  describe('addFollowUp', () => {
    it('应该成功添加跟进记录并更新线索状态', async () => {
      mockPrisma.lead.findFirst!.mockResolvedValue(makeLead())
      mockPrisma.user.findFirst!.mockResolvedValue({ id: 1 } as any)
      mockPrisma.$transaction = jest.fn(async (fn: any) => {
        const tx = {
          leadFollowUp: { create: jest.fn().mockResolvedValue({ id: 1 }) },
          lead: {
            update: jest.fn().mockResolvedValue(
              makeLead({ status: LeadStatus.FOLLOWING, remark: '电话沟通结果' })
            )
          }
        }
        return fn(tx)
      })

      await service.addFollowUp(1, {
        followType: 'PHONE',
        content: '电话沟通结果',
        nextFollowAt: new Date('2026-07-10'),
        createdBy: 1
      })

      expect(mockPrisma.$transaction).toHaveBeenCalled()
    })

    it('线索不存在时应抛出异常', async () => {
      mockPrisma.lead.findFirst!.mockResolvedValue(null)

      await expect(
        service.addFollowUp(999, { followType: 'PHONE', content: '测试', createdBy: 1 })
      ).rejects.toThrow(NotFoundException)
    })

    it('跟进人不存在时应抛出异常', async () => {
      mockPrisma.lead.findFirst!.mockResolvedValue(makeLead())
      mockPrisma.user.findFirst!.mockResolvedValue(null)

      await expect(
        service.addFollowUp(1, { followType: 'PHONE', content: '测试', createdBy: 999 })
      ).rejects.toThrow('跟进人不存在')
    })

    it('跟进后应更新线索状态为 FOLLOWING', async () => {
      mockPrisma.lead.findFirst!.mockResolvedValue(makeLead())
      mockPrisma.user.findFirst!.mockResolvedValue({ id: 1 } as any)

      let updatedLead: any
      mockPrisma.$transaction = jest.fn(async (fn: any) => {
        const tx = {
          leadFollowUp: { create: jest.fn().mockResolvedValue({ id: 1 }) },
          lead: {
            update: jest.fn().mockImplementation((args: any) => {
              updatedLead = { ...makeLead(), ...args.data }
              return Promise.resolve(updatedLead)
            })
          }
        }
        return fn(tx)
      })

      await service.addFollowUp(1, {
        followType: 'VISIT',
        content: '上门拜访',
        nextFollowAt: new Date('2026-07-15'),
        createdBy: 1
      })

      expect(updatedLead.status).toBe(LeadStatus.FOLLOWING)
      expect(updatedLead.nextFollowAt).toEqual(new Date('2026-07-15'))
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  UPDATE / REMOVE
  // ═══════════════════════════════════════════════════════════════
  describe('update', () => {
    it('应该成功更新线索', async () => {
      mockPrisma.lead.findFirst!.mockResolvedValue(makeLead())
      mockPrisma.organization.findFirst!.mockResolvedValue({ id: 1 } as any)
      mockPrisma.user.findFirst!.mockResolvedValue({ id: 1 } as any)
      mockPrisma.lead.update!.mockResolvedValue(makeLead({ name: '赵六' }))

      await service.update(1, { orgId: 1, name: '赵六', phone: '13600136000' })

      expect(mockPrisma.lead.update).toHaveBeenCalled()
    })
  })

  describe('remove', () => {
    it('应该软删除线索', async () => {
      mockPrisma.lead.findFirst!.mockResolvedValue(makeLead())
      mockPrisma.lead.update!.mockResolvedValue({ id: 1 })

      const result = await service.remove(1)

      expect(result.id).toBe(1)
    })
  })
})
