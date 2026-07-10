import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PaginatedResponse } from '../../common/types/pagination'
import { getRequiredTenantId, formatDate } from '../../common/utils/helpers'
import { getPagination, toPaginatedResponse } from '../../common/utils/pagination'
import { PrismaService } from '../prisma/prisma.service'
import { CreateMsgTemplateDto, MsgTemplateQueryDto, UpdateMsgTemplateDto } from './dto/msg-template.dto'

@Injectable()
export class MsgTemplateService {
  constructor(private readonly prisma: PrismaService) {}

  async getList(query: MsgTemplateQueryDto): Promise<PaginatedResponse<unknown>> {
    const tenantId = getRequiredTenantId()
    const pagination = getPagination(query)
    const contains = (value: string) => ({ contains: value, mode: 'insensitive' as const })
    const where: Prisma.MessageTemplateWhereInput = {
      tenantId,
      deletedAt: null,
      name: query.name ? contains(query.name) : undefined,
      code: query.code ? contains(query.code) : undefined,
      channel: query.channel || undefined,
      scene: query.scene || undefined,
      status: query.status || undefined,
      OR: query.keyword
        ? [
            { name: contains(query.keyword) },
            { code: contains(query.keyword) },
            { title: contains(query.keyword) },
            { content: contains(query.keyword) }
          ]
        : undefined
    }

    const [records, total] = await this.prisma.$transaction([
      this.prisma.messageTemplate.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }]
      }),
      this.prisma.messageTemplate.count({ where })
    ])

    return toPaginatedResponse(records.map(mapMsgTemplate), total, pagination)
  }

  async getDetail(id: number) {
    const tenantId = getRequiredTenantId()
    return mapMsgTemplate(await this.findOrThrow(tenantId, id))
  }

  async create(dto: CreateMsgTemplateDto) {
    const tenantId = getRequiredTenantId()
    await this.assertCodeAvailable(tenantId, dto.code)
    const item = await this.prisma.messageTemplate.create({
      data: {
        tenantId,
        name: dto.name,
        code: dto.code,
        channel: dto.channel ?? 'SMS',
        scene: dto.scene ?? 'GENERAL',
        title: dto.title,
        content: dto.content,
        variables: normalizeVariables(dto.variables),
        status: dto.status ?? 'ACTIVE',
        remark: dto.remark
      }
    })
    return mapMsgTemplate(item)
  }

  async update(id: number, dto: UpdateMsgTemplateDto) {
    const tenantId = getRequiredTenantId()
    const current = await this.findOrThrow(tenantId, id)
    if (dto.code && dto.code !== current.code) await this.assertCodeAvailable(tenantId, dto.code, id)
    const updated = await this.prisma.messageTemplate.update({
      where: { id },
      data: {
        name: dto.name,
        code: dto.code,
        channel: dto.channel,
        scene: dto.scene,
        title: dto.title,
        content: dto.content,
        variables: normalizeVariables(dto.variables),
        status: dto.status,
        remark: dto.remark
      }
    })
    return mapMsgTemplate(updated)
  }

  async enable(id: number) {
    return this.updateStatus(id, 'ACTIVE')
  }

  async disable(id: number) {
    return this.updateStatus(id, 'INACTIVE')
  }

  async remove(id: number) {
    const tenantId = getRequiredTenantId()
    await this.findOrThrow(tenantId, id)
    await this.prisma.messageTemplate.update({ where: { id }, data: { deletedAt: new Date() } })
    return { id }
  }

  private async updateStatus(id: number, status: string) {
    const tenantId = getRequiredTenantId()
    await this.findOrThrow(tenantId, id)
    const updated = await this.prisma.messageTemplate.update({ where: { id }, data: { status } })
    return mapMsgTemplate(updated)
  }

  private async findOrThrow(tenantId: number, id: number) {
    const item = await this.prisma.messageTemplate.findFirst({ where: { id, tenantId, deletedAt: null } })
    if (!item) throw new NotFoundException('消息模板不存在')
    return item
  }

  private async assertCodeAvailable(tenantId: number, code: string, excludeId?: number) {
    const exists = await this.prisma.messageTemplate.findFirst({
      where: { tenantId, code, deletedAt: null, id: excludeId ? { not: excludeId } : undefined }
    })
    if (exists) throw new ConflictException('模板编码已存在')
  }
}

type MsgTemplateRecord = Prisma.MessageTemplateGetPayload<object>

function normalizeVariables(value: Record<string, unknown> | undefined) {
  return value === undefined ? undefined : (value as Prisma.InputJsonValue)
}

function mapMsgTemplate(item: MsgTemplateRecord) {
  return {
    id: item.id,
    name: item.name,
    code: item.code,
    channel: item.channel,
    scene: item.scene,
    title: item.title,
    content: item.content,
    variables: item.variables,
    status: item.status,
    remark: item.remark,
    createTime: formatDate(item.createdAt),
    updateTime: formatDate(item.updatedAt)
  }
}
