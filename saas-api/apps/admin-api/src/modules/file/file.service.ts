import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { getCurrentTenantId } from '../../common/tenant/tenant-context'
import { getPagination, toPaginatedResponse } from '../../common/utils/pagination'
import { PrismaService } from '../prisma/prisma.service'
import { CreateFileAssetDto, FileQueryDto, UpdateFileAssetDto } from './dto/file.dto'

function hasValue(value: unknown) {
  return value !== undefined && value !== null && value !== ''
}

@Injectable()
export class FileService {
  constructor(private readonly prisma: PrismaService) {}

  async getList(query: FileQueryDto) {
    const pagination = getPagination(query)
    const where = this.buildWhere(query)
    const [records, total] = await this.prisma.$transaction([
      this.prisma.fileAsset.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { id: 'desc' }
      }),
      this.prisma.fileAsset.count({ where })
    ])
    return toPaginatedResponse(records, total, pagination)
  }

  async getDetail(id: number) {
    const item = await this.prisma.fileAsset.findFirst({ where: this.withTenant({ id }) })
    if (!item) throw new NotFoundException('文件不存在')
    return item
  }

  async create(dto: CreateFileAssetDto) {
    this.validateBusinessBinding(dto)
    await this.validateOrg(dto.orgId)
    return this.prisma.fileAsset.create({ data: dto })
  }

  async update(id: number, dto: UpdateFileAssetDto) {
    await this.getDetail(id)
    this.validateBusinessBinding(dto)
    await this.validateOrg(dto.orgId)
    return this.prisma.fileAsset.update({ where: { id }, data: dto })
  }

  async remove(id: number) {
    await this.getDetail(id)
    await this.prisma.fileAsset.delete({ where: { id } })
    return { id }
  }

  async getBusinessFiles(query: FileQueryDto) {
    if (!query.businessType || !query.businessId) {
      throw new BadRequestException('businessType 和 businessId 不能为空')
    }
    return this.getList(query)
  }

  async getBusinessCategories(query: FileQueryDto) {
    if (!query.businessType || !query.businessId) {
      throw new BadRequestException('businessType 和 businessId 不能为空')
    }
    const files = await this.prisma.fileAsset.findMany({
      where: this.buildWhere(query),
      orderBy: [{ categoryCode: 'asc' }, { id: 'desc' }]
    })
    const groupMap = new Map<string, { code: string; name: string; count: number; files: unknown[] }>()
    for (const file of files) {
      const current: { code: string; name: string; count: number; files: unknown[] } =
        groupMap.get(file.categoryCode) || {
        code: file.categoryCode,
        name: file.categoryName,
        count: 0,
        files: []
      }
      current.count += 1
      current.files.push(file)
      groupMap.set(file.categoryCode, current)
    }
    return Array.from(groupMap.values())
  }

  private buildWhere(query: FileQueryDto) {
    const where: Record<string, unknown> = {}
    if (hasValue(query.orgId)) where.orgId = query.orgId
    if (hasValue(query.businessType)) where.businessType = query.businessType
    if (hasValue(query.businessId)) where.businessId = query.businessId
    if (hasValue(query.categoryCode)) where.categoryCode = query.categoryCode
    if (hasValue(query.status)) where.status = query.status
    if (hasValue(query.fileName)) where.fileName = { contains: query.fileName, mode: 'insensitive' }
    return this.withTenant(where)
  }

  private withTenant(where: Record<string, unknown>) {
    const tenantId = getCurrentTenantId()
    return tenantId ? { ...where, tenantId } : where
  }

  private validateBusinessBinding(dto: Partial<CreateFileAssetDto>) {
    const hasType = hasValue(dto.businessType)
    const hasId = hasValue(dto.businessId)
    if (hasType !== hasId) throw new BadRequestException('业务类型和业务ID必须同时填写')
  }

  private async validateOrg(orgId?: number) {
    if (!orgId) return
    const org = await this.prisma.organization.findFirst({ where: { id: orgId } })
    if (!org) throw new BadRequestException('机构不存在')
  }
}
