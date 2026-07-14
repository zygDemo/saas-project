import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { getPagination, toPaginatedResponse } from '../../common/utils/pagination'
import { getCurrentTenantId } from '../../common/tenant/tenant-context'
import {
  CreateArticleDto,
  UpdateArticleDto,
  ArticleQueryDto,
  CreateArticleTypeDto,
  ArticleTypeQueryDto
} from './dto/article.dto'

@Injectable()
export class ArticleService {
  constructor(private readonly prisma: PrismaService) {}

  // ==================== 文章管理 ====================

  async getList(query: ArticleQueryDto) {
    const tenantId = getCurrentTenantId()
    const pagination = getPagination(query)
    const where: Record<string, unknown> = { tenantId, deletedAt: null }

    if (query.keyword) {
      where.OR = [
        { title: { contains: query.keyword, mode: 'insensitive' } },
        { summary: { contains: query.keyword, mode: 'insensitive' } }
      ]
    }
    if (query.typeId) where.typeId = query.typeId
    if (query.status) where.status = query.status
    if (query.year) {
      const year = parseInt(query.year)
      where.createdAt = {
        gte: new Date(year, 0, 1),
        lt: new Date(year + 1, 0, 1)
      }
    }

    const [records, total] = await this.prisma.$transaction([
      this.prisma.article.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: [
          { isTop: 'desc' },
          { createdAt: 'desc' }
        ]
      }),
      this.prisma.article.count({ where })
    ])

    return toPaginatedResponse(records, total, pagination)
  }

  async getById(id: number) {
    const tenantId = getCurrentTenantId()
    const article = await this.prisma.article.findFirst({
      where: { id, tenantId, deletedAt: null }
    })
    if (!article) throw new NotFoundException('文章不存在')

    // 增加浏览量
    await this.prisma.article.update({
      where: { id },
      data: { viewCount: { increment: 1 } }
    })

    return article
  }

  async create(dto: CreateArticleDto) {
    const tenantId = getCurrentTenantId()
    return this.prisma.article.create({
      data: {
        ...dto,
        tenantId,
        publishAt: dto.status === 'PUBLISHED' ? new Date() : null
      }
    })
  }

  async update(id: number, dto: UpdateArticleDto) {
    const tenantId = getCurrentTenantId()
    const article = await this.prisma.article.findFirst({
      where: { id, tenantId, deletedAt: null }
    })
    if (!article) throw new NotFoundException('文章不存在')

    const data: Record<string, unknown> = { ...dto }
    if (dto.status === 'PUBLISHED' && article.status !== 'PUBLISHED') {
      data.publishAt = new Date()
    }

    return this.prisma.article.update({
      where: { id },
      data
    })
  }

  async remove(id: number) {
    const tenantId = getCurrentTenantId()
    const article = await this.prisma.article.findFirst({
      where: { id, tenantId, deletedAt: null }
    })
    if (!article) throw new NotFoundException('文章不存在')

    return this.prisma.article.update({
      where: { id },
      data: { deletedAt: new Date() }
    })
  }

  async like(id: number, userId: number) {
    const tenantId = getCurrentTenantId()
    const article = await this.prisma.article.findFirst({
      where: { id, tenantId, deletedAt: null }
    })
    if (!article) throw new NotFoundException('文章不存在')

    // 检查是否已点赞
    const existing = await this.prisma.articleLike.findUnique({
      where: { articleId_userId: { articleId: id, userId } }
    })

    if (existing) {
      // 取消点赞
      await this.prisma.$transaction([
        this.prisma.articleLike.delete({ where: { id: existing.id } }),
        this.prisma.article.update({
          where: { id },
          data: { likeCount: { decrement: 1 } }
        })
      ])
      return { liked: false }
    } else {
      // 点赞
      await this.prisma.$transaction([
        this.prisma.articleLike.create({
          data: { articleId: id, userId }
        }),
        this.prisma.article.update({
          where: { id },
          data: { likeCount: { increment: 1 } }
        })
      ])
      return { liked: true }
    }
  }

  // ==================== 文章分类 ====================

  async getTypeList(query: ArticleTypeQueryDto) {
    const tenantId = getCurrentTenantId()
    const pagination = getPagination(query)
    const where: Record<string, unknown> = { tenantId, deletedAt: null }

    if (query.keyword) {
      where.name = { contains: query.keyword, mode: 'insensitive' }
    }

    const [records, total] = await this.prisma.$transaction([
      this.prisma.articleType.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { sort: 'asc' }
      }),
      this.prisma.articleType.count({ where })
    ])

    return toPaginatedResponse(records, total, pagination)
  }

  async getAllTypes() {
    const tenantId = getCurrentTenantId()
    return this.prisma.articleType.findMany({
      where: { tenantId, status: 'ACTIVE', deletedAt: null },
      orderBy: { sort: 'asc' }
    })
  }

  async createType(dto: CreateArticleTypeDto) {
    const tenantId = getCurrentTenantId()

    // 检查名称是否重复
    const existing = await this.prisma.articleType.findFirst({
      where: { tenantId, name: dto.name, deletedAt: null }
    })
    if (existing) throw new BadRequestException('分类名称已存在')

    return this.prisma.articleType.create({
      data: { ...dto, tenantId }
    })
  }

  async updateType(id: number, dto: Partial<CreateArticleTypeDto>) {
    const tenantId = getCurrentTenantId()
    const type = await this.prisma.articleType.findFirst({
      where: { id, tenantId, deletedAt: null }
    })
    if (!type) throw new NotFoundException('分类不存在')

    // 检查名称是否重复
    if (dto.name && dto.name !== type.name) {
      const existing = await this.prisma.articleType.findFirst({
        where: { tenantId, name: dto.name, deletedAt: null, id: { not: id } }
      })
      if (existing) throw new BadRequestException('分类名称已存在')
    }

    return this.prisma.articleType.update({
      where: { id },
      data: dto
    })
  }

  async removeType(id: number) {
    const tenantId = getCurrentTenantId()
    const type = await this.prisma.articleType.findFirst({
      where: { id, tenantId, deletedAt: null }
    })
    if (!type) throw new NotFoundException('分类不存在')

    // 检查是否有文章使用此分类
    const articleCount = await this.prisma.article.count({
      where: { typeId: id, deletedAt: null }
    })
    if (articleCount > 0) {
      throw new BadRequestException('该分类下还有文章，无法删除')
    }

    return this.prisma.articleType.update({
      where: { id },
      data: { deletedAt: new Date() }
    })
  }
}
