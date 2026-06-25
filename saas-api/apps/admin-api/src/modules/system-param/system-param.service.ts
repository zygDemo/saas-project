import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PaginatedResponse } from '../../common/types/pagination'
import { getRequiredTenantId, formatDate } from '../../common/utils/helpers'
import { getPagination, toPaginatedResponse } from '../../common/utils/pagination'
import { PrismaService } from '../prisma/prisma.service'
import { CreateSystemParamDto, UpdateSystemParamDto } from './dto/system-param.dto'

@Injectable()
export class SystemParamService {
  constructor(private readonly prisma: PrismaService) {}

  async getList(query: Record<string, string | undefined>): Promise<PaginatedResponse<unknown>> {
    const tenantId = getRequiredTenantId()
    const pagination = getPagination(query)
    const where: Prisma.SystemParamWhereInput = {
      tenantId,
      deletedAt: null,
      group: query.group || undefined,
      name: query.name ? { contains: query.name, mode: 'insensitive' } : undefined,
      key: query.key ? { contains: query.key, mode: 'insensitive' } : undefined,
      status: query.status || undefined
    }

    const [records, total] = await this.prisma.$transaction([
      this.prisma.systemParam.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: [{ group: 'asc' }, { id: 'asc' }]
      }),
      this.prisma.systemParam.count({ where })
    ])

    return toPaginatedResponse(records.map(mapParam), total, pagination)
  }

  async create(dto: CreateSystemParamDto) {
    const tenantId = getRequiredTenantId()
    await this.assertKeyAvailable(tenantId, dto.key)

    const item = await this.prisma.systemParam.create({
      data: {
        tenantId,
        group: dto.group,
        name: dto.name,
        key: dto.key,
        value: dto.value,
        type: dto.type ?? 'STRING',
        status: dto.status ?? 'ACTIVE',
        remark: dto.remark
      }
    })

    return mapParam(item)
  }

  async update(id: number, dto: UpdateSystemParamDto) {
    const tenantId = getRequiredTenantId()
    const item = await this.findOrThrow(tenantId, id)

    if (dto.key && dto.key !== item.key) {
      await this.assertKeyAvailable(tenantId, dto.key, id)
    }

    const updated = await this.prisma.systemParam.update({
      where: { id },
      data: {
        group: dto.group,
        name: dto.name,
        key: dto.key,
        value: dto.value,
        type: dto.type,
        status: dto.status,
        remark: dto.remark
      }
    })

    return mapParam(updated)
  }

  async delete(id: number) {
    const tenantId = getRequiredTenantId()
    await this.findOrThrow(tenantId, id)
    await this.prisma.systemParam.update({ where: { id }, data: { deletedAt: new Date() } })
    return { id }
  }

  async getValueByKey(key: string): Promise<string | null> {
    const tenantId = getRequiredTenantId()
    const item = await this.prisma.systemParam.findFirst({
      where: { tenantId, key, status: 'ACTIVE', deletedAt: null }
    })
    return item?.value ?? null
  }

  async getByKeys(keys: string[]) {
    const tenantId = getRequiredTenantId()
    const items = await this.prisma.systemParam.findMany({
      where: { tenantId, key: { in: keys }, status: 'ACTIVE', deletedAt: null }
    })
    return items.map(mapParam)
  }

  private async findOrThrow(tenantId: number, id: number) {
    const item = await this.prisma.systemParam.findFirst({ where: { id, tenantId, deletedAt: null } })
    if (!item) throw new NotFoundException('系统参数不存在')
    return item
  }

  private async assertKeyAvailable(tenantId: number, key: string, excludeId?: number) {
    const existing = await this.prisma.systemParam.findFirst({ where: { tenantId, key, deletedAt: null } })
    if (existing && existing.id !== excludeId) {
      throw new ConflictException('参数键已存在')
    }
  }
}

type ParamRecord = Prisma.SystemParamGetPayload<{}>

function mapParam(item: ParamRecord) {
  return {
    id: item.id,
    group: item.group,
    name: item.name,
    key: item.key,
    value: item.value,
    type: item.type,
    status: item.status,
    remark: item.remark,
    createTime: formatDate(item.createdAt),
    updateTime: formatDate(item.updatedAt)
  }
}
