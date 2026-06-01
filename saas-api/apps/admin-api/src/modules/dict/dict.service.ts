import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PaginatedResponse } from '../../common/types/pagination'
import { getCurrentTenantId } from '../../common/tenant/tenant-context'
import { getPagination, toPaginatedResponse } from '../../common/utils/pagination'
import { PrismaService } from '../prisma/prisma.service'
import { CreateDictDataDto, CreateDictTypeDto, UpdateDictDataDto, UpdateDictTypeDto } from './dto/dict.dto'

@Injectable()
export class DictService {
  constructor(private readonly prisma: PrismaService) {}

  async getTypeList(query: Record<string, string | undefined>): Promise<PaginatedResponse<unknown>> {
    const tenantId = getRequiredTenantId()
    const pagination = getPagination(query)
    const where: Prisma.DictTypeWhereInput = {
      tenantId,
      name: query.name ? { contains: query.name, mode: 'insensitive' } : undefined,
      code: query.code ? { contains: query.code, mode: 'insensitive' } : undefined,
      status: query.status || undefined
    }

    const [records, total] = await this.prisma.$transaction([
      this.prisma.dictType.findMany({
        where,
        include: { _count: { select: { items: true } } },
        skip: pagination.skip,
        take: pagination.take,
        orderBy: [{ id: 'asc' }]
      }),
      this.prisma.dictType.count({ where })
    ])

    return toPaginatedResponse(records.map(mapDictType), total, pagination)
  }

  async getOptions(codesText: string) {
    const codes = normalizeCodes(codesText)
    if (!codes.length) return {}

    const records = await this.findActiveOptions(codes)
    const grouped: Record<string, DictOption[]> = {}
    for (const item of records) {
      const code = item.type.code
      if (!grouped[code]) grouped[code] = []
      grouped[code].push(mapDictOption(item))
    }
    return grouped
  }

  async getOptionsByCode(code: string) {
    const codes = normalizeCodes(code)
    if (!codes.length) return []
    const records = await this.findActiveOptions([codes[0]])
    return records.map(mapDictOption)
  }

  async createType(dto: CreateDictTypeDto) {
    const tenantId = getRequiredTenantId()
    await this.assertTypeCodeAvailable(tenantId, dto.code)

    const item = await this.prisma.dictType.create({
      data: {
        tenantId,
        name: dto.name,
        code: dto.code,
        status: dto.status ?? 'ACTIVE',
        remark: dto.remark
      },
      include: { _count: { select: { items: true } } }
    })

    return mapDictType(item)
  }

  async updateType(id: number, dto: UpdateDictTypeDto) {
    const tenantId = getRequiredTenantId()
    const item = await this.findTypeOrThrow(tenantId, id)
    if (dto.code && dto.code !== item.code) {
      await this.assertTypeCodeAvailable(tenantId, dto.code, id)
    }

    const updated = await this.prisma.dictType.update({
      where: { id },
      data: {
        name: dto.name,
        code: dto.code,
        status: dto.status,
        remark: dto.remark
      },
      include: { _count: { select: { items: true } } }
    })

    return mapDictType(updated)
  }

  async deleteType(id: number) {
    const tenantId = getRequiredTenantId()
    await this.findTypeOrThrow(tenantId, id)
    await this.prisma.dictType.delete({ where: { id } })
    return { id }
  }

  async getDataList(query: Record<string, string | undefined>): Promise<PaginatedResponse<unknown>> {
    const tenantId = getRequiredTenantId()
    const pagination = getPagination(query)
    const typeId = query.typeId ? Number(query.typeId) : undefined
    const where: Prisma.DictDataWhereInput = {
      tenantId,
      typeId,
      label: query.label ? { contains: query.label, mode: 'insensitive' } : undefined,
      value: query.value ? { contains: query.value, mode: 'insensitive' } : undefined,
      status: query.status || undefined
    }

    const [records, total] = await this.prisma.$transaction([
      this.prisma.dictData.findMany({
        where,
        include: { type: true },
        skip: pagination.skip,
        take: pagination.take,
        orderBy: [{ sort: 'asc' }, { id: 'asc' }]
      }),
      this.prisma.dictData.count({ where })
    ])

    return toPaginatedResponse(records.map(mapDictData), total, pagination)
  }

  async createData(dto: CreateDictDataDto) {
    const tenantId = getRequiredTenantId()
    await this.findTypeOrThrow(tenantId, dto.typeId)
    await this.assertDataValueAvailable(tenantId, dto.typeId, dto.value)

    const item = await this.prisma.dictData.create({
      data: {
        tenantId,
        typeId: dto.typeId,
        label: dto.label,
        value: dto.value,
        sort: dto.sort ?? 0,
        status: dto.status ?? 'ACTIVE',
        remark: dto.remark
      },
      include: { type: true }
    })

    return mapDictData(item)
  }

  async updateData(id: number, dto: UpdateDictDataDto) {
    const tenantId = getRequiredTenantId()
    const item = await this.findDataOrThrow(tenantId, id)
    const nextTypeId = dto.typeId ?? item.typeId
    const nextValue = dto.value ?? item.value
    await this.findTypeOrThrow(tenantId, nextTypeId)

    if (nextTypeId !== item.typeId || nextValue !== item.value) {
      await this.assertDataValueAvailable(tenantId, nextTypeId, nextValue, id)
    }

    const updated = await this.prisma.dictData.update({
      where: { id },
      data: {
        typeId: dto.typeId,
        label: dto.label,
        value: dto.value,
        sort: dto.sort,
        status: dto.status,
        remark: dto.remark
      },
      include: { type: true }
    })

    return mapDictData(updated)
  }

  async deleteData(id: number) {
    const tenantId = getRequiredTenantId()
    await this.findDataOrThrow(tenantId, id)
    await this.prisma.dictData.delete({ where: { id } })
    return { id }
  }

  private async findTypeOrThrow(tenantId: number, id: number) {
    const item = await this.prisma.dictType.findFirst({ where: { id, tenantId } })
    if (!item) throw new NotFoundException('Dict type not found')
    return item
  }

  private async findDataOrThrow(tenantId: number, id: number) {
    const item = await this.prisma.dictData.findFirst({ where: { id, tenantId } })
    if (!item) throw new NotFoundException('Dict data not found')
    return item
  }

  private async assertTypeCodeAvailable(tenantId: number, code: string, excludeId?: number) {
    const item = await this.prisma.dictType.findFirst({ where: { tenantId, code } })
    if (item && item.id !== excludeId) throw new ConflictException('Dict type code already exists')
  }

  private async assertDataValueAvailable(tenantId: number, typeId: number, value: string, excludeId?: number) {
    const item = await this.prisma.dictData.findFirst({ where: { tenantId, typeId, value } })
    if (item && item.id !== excludeId) throw new ConflictException('Dict value already exists')
  }

  private async findActiveOptions(codes: string[]) {
    const tenantId = getRequiredTenantId()
    return this.prisma.dictData.findMany({
      where: {
        tenantId,
        status: 'ACTIVE',
        type: {
          code: { in: codes },
          status: 'ACTIVE'
        }
      },
      include: { type: true },
      orderBy: [{ typeId: 'asc' }, { sort: 'asc' }, { id: 'asc' }]
    })
  }
}

function getRequiredTenantId() {
  const tenantId = getCurrentTenantId()
  if (!tenantId) throw new BadRequestException('X-Tenant-ID header is required')
  return tenantId
}

type DictTypeWithCount = Prisma.DictTypeGetPayload<{ include: { _count: { select: { items: true } } } }>
type DictDataWithType = Prisma.DictDataGetPayload<{ include: { type: true } }>
type DictOption = ReturnType<typeof mapDictOption>

function normalizeCodes(value: string) {
  return [
    ...new Set(
      value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    )
  ]
}

function formatDate(value: Date) {
  return value.toISOString().replace('T', ' ').slice(0, 19)
}

function mapDictType(item: DictTypeWithCount) {
  return {
    id: item.id,
    name: item.name,
    code: item.code,
    status: item.status,
    remark: item.remark,
    itemCount: item._count.items,
    createTime: formatDate(item.createdAt),
    updateTime: formatDate(item.updatedAt)
  }
}

function mapDictData(item: DictDataWithType) {
  return {
    id: item.id,
    typeId: item.typeId,
    typeName: item.type.name,
    typeCode: item.type.code,
    label: item.label,
    value: item.value,
    sort: item.sort,
    status: item.status,
    remark: item.remark,
    createTime: formatDate(item.createdAt),
    updateTime: formatDate(item.updatedAt)
  }
}

function mapDictOption(item: DictDataWithType) {
  return {
    label: item.label,
    value: item.value
  }
}
