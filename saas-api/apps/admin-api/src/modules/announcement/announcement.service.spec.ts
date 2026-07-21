import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException } from '@nestjs/common'
import { AnnouncementService } from './announcement.service'
import { PrismaService } from '../prisma/prisma.service'
import { NotificationService } from '../notification/notification.service'

jest.mock('../../common/utils/helpers', () => ({
  ...jest.requireActual('../../common/utils/helpers'),
  getRequiredTenantId: jest.fn(() => 1),
  formatDate: jest.fn((d) => d?.toISOString?.() || d),
}))

const mockAnnouncement = {
  id: 1, tenantId: 1, title: '公告标题', content: '公告内容', type: 'NOTICE',
  level: 'NORMAL', status: 'DRAFT', topFlag: false, viewCount: 0,
  publishAt: null, expireAt: null, deletedAt: null,
  createdAt: new Date(), updatedAt: new Date(),
}

describe('AnnouncementService', () => {
  let service: AnnouncementService
  let mockPrisma: any
  let mockNotification: any

  beforeEach(async () => {
    mockPrisma = {
      announcement: {
        findMany: jest.fn().mockResolvedValue([mockAnnouncement]),
        findFirst: jest.fn().mockResolvedValue(mockAnnouncement),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue(mockAnnouncement),
        update: jest.fn().mockResolvedValue({ ...mockAnnouncement, status: 'PUBLISHED', publishAt: new Date() }),
      },
      $transaction: jest.fn((arr) => Promise.all(arr)),
    }
    mockNotification = {
      pushAnnouncement: jest.fn(),
    }
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnnouncementService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationService, useValue: mockNotification },
      ],
    }).compile()
    service = module.get<AnnouncementService>(AnnouncementService)
  })

  describe('getList', () => {
    it('应返回分页公告列表', async () => {
      const result = await service.getList({} as any)
      expect(mockPrisma.announcement.findMany).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('应支持标题搜索', async () => {
      await service.getList({ title: '公告' } as any)
      const call = mockPrisma.announcement.findMany.mock.calls[0][0]
      expect(call.where.title).toBeDefined()
    })
    it('应支持状态过滤', async () => {
      await service.getList({ status: 'PUBLISHED' } as any)
      const call = mockPrisma.announcement.findMany.mock.calls[0][0]
      expect(call.where.status).toBe('PUBLISHED')
    })
  })

  describe('getById', () => {
    it('应返回公告详情并增加浏览量', async () => {
      const result = await service.getById(1)
      expect(result).toBeDefined()
      expect(mockPrisma.announcement.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { viewCount: { increment: 1 } } })
      )
    })
    it('公告不存在应抛异常', async () => {
      mockPrisma.announcement.findFirst.mockResolvedValue(null)
      await expect(service.getById(999)).rejects.toThrow(NotFoundException)
    })
  })

  describe('create', () => {
    it('应创建公告', async () => {
      await service.create({ title: '新公告', content: '内容' } as any)
      expect(mockPrisma.announcement.create).toHaveBeenCalled()
    })
  })

  describe('update', () => {
    it('应更新公告', async () => {
      await service.update(1, { title: '更新标题' } as any)
      expect(mockPrisma.announcement.update).toHaveBeenCalled()
    })
    it('公告不存在应抛异常', async () => {
      mockPrisma.announcement.findFirst.mockResolvedValue(null)
      await expect(service.update(999, {} as any)).rejects.toThrow()
    })
  })

  describe('publish', () => {
    it('应发布公告并推送通知', async () => {
      await service.publish(1)
      expect(mockPrisma.announcement.update).toHaveBeenCalled()
      expect(mockNotification.pushAnnouncement).toHaveBeenCalled()
    })
  })

  describe('unpublish', () => {
    it('应撤回公告', async () => {
      await service.unpublish(1)
      expect(mockPrisma.announcement.update).toHaveBeenCalled()
    })
  })

  describe('expire', () => {
    it('应设为过期', async () => {
      await service.expire(1)
      expect(mockPrisma.announcement.update).toHaveBeenCalled()
    })
  })

  describe('delete', () => {
    it('应软删除公告', async () => {
      await service.delete(1)
      expect(mockPrisma.announcement.update).toHaveBeenCalled()
    })
  })

  describe('getActive', () => {
    it('应返回当前有效公告', async () => {
      mockPrisma.announcement.findMany.mockResolvedValue([mockAnnouncement])
      const result = await service.getActive()
      expect(result).toBeDefined()
    })
  })
})
