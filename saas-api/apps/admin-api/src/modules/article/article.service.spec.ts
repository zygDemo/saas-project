import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException, BadRequestException } from '@nestjs/common'
import { ArticleService } from './article.service'
import { PrismaService } from '../prisma/prisma.service'

jest.mock('../../common/tenant/tenant-context', () => ({
  getCurrentTenantId: jest.fn(() => 1),
}))

const mockArticle = {
  id: 1,
  tenantId: 1,
  title: '测试文章',
  content: '<p>内容</p>',
  summary: '摘要',
  coverImg: 'https://example.com/img.jpg',
  typeId: 1,
  typeName: '技术',
  status: 'DRAFT',
  viewCount: 0,
  likeCount: 0,
  isTop: false,
  publishAt: null,
  deletedAt: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
}

const mockArticleType = {
  id: 1,
  tenantId: 1,
  name: '技术',
  sort: 1,
  status: 'ACTIVE',
  deletedAt: null,
}

describe('ArticleService', () => {
  let service: ArticleService
  let mockPrisma: any

  beforeEach(async () => {
    mockPrisma = {
      article: {
        findMany: jest.fn().mockResolvedValue([mockArticle]),
        findFirst: jest.fn().mockResolvedValue(mockArticle),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue(mockArticle),
        update: jest.fn().mockResolvedValue(mockArticle),
      },
      articleType: {
        findMany: jest.fn().mockResolvedValue([mockArticleType]),
        findFirst: jest.fn().mockResolvedValue(mockArticleType),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue(mockArticleType),
        update: jest.fn().mockResolvedValue(mockArticleType),
      },
      articleLike: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 1, articleId: 1, userId: 1 }),
        delete: jest.fn().mockResolvedValue({}),
      },
      $transaction: jest.fn((arr) => Promise.all(arr)),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticleService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile()

    service = module.get<ArticleService>(ArticleService)
  })

  describe('getList', () => {
    it('应返回分页文章列表', async () => {
      const result = await service.getList({ page: 1, size: 10 } as any)
      expect(mockPrisma.article.findMany).toHaveBeenCalled()
      expect(mockPrisma.article.count).toHaveBeenCalled()
      expect(result).toBeDefined()
    })

    it('应支持关键词搜索', async () => {
      await service.getList({ keyword: '测试' } as any)
      const call = mockPrisma.article.findMany.mock.calls[0][0]
      expect(call.where.OR).toBeDefined()
    })

    it('应支持类型过滤', async () => {
      await service.getList({ typeId: 1 } as any)
      const call = mockPrisma.article.findMany.mock.calls[0][0]
      expect(call.where.typeId).toBe(1)
    })

    it('应支持年份过滤', async () => {
      await service.getList({ year: '2026' } as any)
      const call = mockPrisma.article.findMany.mock.calls[0][0]
      expect(call.where.createdAt).toBeDefined()
    })
  })

  describe('getById', () => {
    it('应返回文章详情并增加浏览量', async () => {
      const result = await service.getById(1)
      expect(result).toEqual(mockArticle)
      expect(mockPrisma.article.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { viewCount: { increment: 1 } },
      })
    })

    it('文章不存在时应抛出 NotFoundException', async () => {
      mockPrisma.article.findFirst.mockResolvedValue(null)
      await expect(service.getById(999)).rejects.toThrow(NotFoundException)
    })
  })

  describe('create', () => {
    it('应创建文章', async () => {
      const dto = { title: '新文章', content: '<p>内容</p>', status: 'DRAFT' }
      await service.create(dto as any)
      expect(mockPrisma.article.create).toHaveBeenCalled()
    })

    it('PUBLISHED 状态应设置 publishAt', async () => {
      const dto = { title: '新文章', status: 'PUBLISHED' }
      await service.create(dto as any)
      const call = mockPrisma.article.create.mock.calls[0][0]
      expect(call.data.publishAt).toBeInstanceOf(Date)
    })
  })

  describe('update', () => {
    it('应更新文章', async () => {
      const dto = { title: '更新标题' }
      await service.update(1, dto as any)
      expect(mockPrisma.article.update).toHaveBeenCalled()
    })

    it('文章不存在时应抛出 NotFoundException', async () => {
      mockPrisma.article.findFirst.mockResolvedValue(null)
      await expect(service.update(999, {} as any)).rejects.toThrow(NotFoundException)
    })

    it('从非发布改为发布应设置 publishAt', async () => {
      mockPrisma.article.findFirst.mockResolvedValue({ ...mockArticle, status: 'DRAFT' })
      await service.update(1, { status: 'PUBLISHED' } as any)
      const call = mockPrisma.article.update.mock.calls[0][0]
      expect(call.data.publishAt).toBeInstanceOf(Date)
    })
  })

  describe('remove', () => {
    it('应软删除文章', async () => {
      await service.remove(1)
      expect(mockPrisma.article.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { deletedAt: expect.any(Date) },
      })
    })

    it('文章不存在时应抛出 NotFoundException', async () => {
      mockPrisma.article.findFirst.mockResolvedValue(null)
      await expect(service.remove(999)).rejects.toThrow(NotFoundException)
    })
  })

  describe('like', () => {
    it('未点赞时应点赞', async () => {
      mockPrisma.articleLike.findUnique.mockResolvedValue(null)
      const result = await service.like(1, 1)
      expect(result).toEqual({ liked: true })
      expect(mockPrisma.articleLike.create).toHaveBeenCalled()
    })

    it('已点赞时应取消点赞', async () => {
      mockPrisma.articleLike.findUnique.mockResolvedValue({ id: 1 })
      const result = await service.like(1, 1)
      expect(result).toEqual({ liked: false })
      expect(mockPrisma.articleLike.delete).toHaveBeenCalled()
    })
  })

  describe('文章分类', () => {
    it('getAllTypes 应返回所有活跃分类', async () => {
      const result = await service.getAllTypes()
      expect(mockPrisma.articleType.findMany).toHaveBeenCalled()
      expect(result).toEqual([mockArticleType])
    })

    it('createType 应检查名称重复', async () => {
      mockPrisma.articleType.findFirst.mockResolvedValue(mockArticleType)
      await expect(service.createType({ name: '技术' } as any)).rejects.toThrow(BadRequestException)
    })

    it('removeType 应检查是否有关联文章', async () => {
      mockPrisma.articleType.findFirst.mockResolvedValue(mockArticleType)
      mockPrisma.article.count.mockResolvedValue(5)
      await expect(service.removeType(1)).rejects.toThrow(BadRequestException)
    })
  })
})
