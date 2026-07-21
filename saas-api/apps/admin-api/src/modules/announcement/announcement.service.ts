import { NotificationService } from '../notification/notification.service'
import { Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PaginatedResponse } from '../../common/types/pagination'
import { getRequiredTenantId, formatDate } from '../../common/utils/helpers'
import { getPagination, toPaginatedResponse } from '../../common/utils/pagination'
import { PrismaService } from '../prisma/prisma.service'
import { CreateAnnouncementDto, UpdateAnnouncementDto, AnnouncementQueryDto } from './dto/announcement.dto'

@Injectable()
export class AnnouncementService {
  constructor(private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService) {}

  async getList(query: AnnouncementQueryDto): Promise<PaginatedResponse<unknown>> {
    const tenantId = getRequiredTenantId()
    const pagination = getPagination(query)
    const where: Prisma.AnnouncementWhereInput = {
      tenantId,
      deletedAt: null,
      title: query.title ? { contains: query.title, mode: 'insensitive' } : undefined,
      type: query.type || undefined,
      level: query.level || undefined,
      status: query.status || undefined
    }

    const [records, total] = await this.prisma.$transaction([
      this.prisma.announcement.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: [{ topFlag: 'desc' }, { publishAt: 'desc' }, { id: 'desc' }]
      }),
      this.prisma.announcement.count({ where })
    ])

    return toPaginatedResponse(records.map(mapAnnouncement), total, pagination)
  }

  async getById(id: number) {
    const tenantId = getRequiredTenantId()
    const item = await this.findOrThrow(tenantId, id)
    await this.prisma.announcement.update({ where: { id }, data: { viewCount: { increment: 1 } } })
    return mapAnnouncement(item)
  }

  async create(dto: CreateAnnouncementDto) {
    const tenantId = getRequiredTenantId()
    const item = await this.prisma.announcement.create({
      data: {
        tenantId,
        title: dto.title,
        content: dto.content,
        type: dto.type ?? 'NOTICE',
        level: dto.level ?? 'NORMAL',
        status: dto.status ?? 'DRAFT',
        publishAt: dto.publishAt ? new Date(dto.publishAt) : undefined,
        expireAt: dto.expireAt ? new Date(dto.expireAt) : undefined,
        target: dto.target,
        topFlag: dto.topFlag ?? false,
        remark: dto.remark
      }
    })
    return mapAnnouncement(item)
  }

  async update(id: number, dto: UpdateAnnouncementDto) {
    const tenantId = getRequiredTenantId()
    await this.findOrThrow(tenantId, id)
    const updated = await this.prisma.announcement.update({
      where: { id },
      data: {
        title: dto.title,
        content: dto.content,
        type: dto.type,
        level: dto.level,
        status: dto.status,
        publishAt: dto.publishAt ? new Date(dto.publishAt) : undefined,
        expireAt: dto.expireAt ? new Date(dto.expireAt) : undefined,
        target: dto.target,
        topFlag: dto.topFlag,
        remark: dto.remark
      }
    })
    return mapAnnouncement(updated)
  }

  async publish(id: number) {
    const tenantId = getRequiredTenantId()
    await this.findOrThrow(tenantId, id)
    const updated = await this.prisma.announcement.update({
      where: { id },
      data: { status: 'PUBLISHED', publishAt: new Date() }
    })
    return mapAnnouncement(updated)
  }

  async unpublish(id: number) {
    const tenantId = getRequiredTenantId()
    await this.findOrThrow(tenantId, id)
    const updated = await this.prisma.announcement.update({
      where: { id },
      data: { status: 'DRAFT' }
    })
    return mapAnnouncement(updated)
  }

  async expire(id: number) {
    const tenantId = getRequiredTenantId()
    await this.findOrThrow(tenantId, id)
    const updated = await this.prisma.announcement.update({
      where: { id },
      data: { status: 'EXPIRED', expireAt: new Date() }
    })
    return mapAnnouncement(updated)
  }

  async delete(id: number) {
    const tenantId = getRequiredTenantId()
    await this.findOrThrow(tenantId, id)
    await this.prisma.announcement.update({ where: { id }, data: { deletedAt: new Date() } })
    return { id }
  }

  async getActive() {
    const tenantId = getRequiredTenantId()
    const now = new Date()
    const items = await this.prisma.announcement.findMany({
      where: {
        tenantId,
        status: 'PUBLISHED',
        deletedAt: null,
        OR: [{ publishAt: null }, { publishAt: { lte: now } }],
        AND: [{ OR: [{ expireAt: null }, { expireAt: { gte: now } }] }]
      },
      orderBy: [{ topFlag: 'desc' }, { publishAt: 'desc' }],
      take: 20
    })
    return items.map(mapAnnouncement)
  }

  private async findOrThrow(tenantId: number, id: number) {
    const item = await this.prisma.announcement.findFirst({ where: { id, tenantId, deletedAt: null } })
    if (!item) throw new NotFoundException('公告不存在')
    return item
  }
}

type AnnouncementRecord = Prisma.AnnouncementGetPayload<object>

function mapAnnouncement(item: AnnouncementRecord) {
  return {
    id: item.id,
    title: item.title,
    content: item.content,
    type: item.type,
    level: item.level,
    status: item.status,
    publishAt: item.publishAt ? formatDate(item.publishAt) : null,
    expireAt: item.expireAt ? formatDate(item.expireAt) : null,
    target: item.target,
    topFlag: item.topFlag,
    viewCount: item.viewCount,
    remark: item.remark,
    createTime: formatDate(item.createdAt),
    updateTime: formatDate(item.updatedAt)
  }
}
