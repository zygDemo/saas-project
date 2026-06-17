import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Prisma } from '@prisma/client'
import { randomUUID } from 'crypto'
import { mkdir, writeFile } from 'fs/promises'
import { extname, join } from 'path'
import { RequestUser } from '../../common/types/request-user'
import { buildUploadUrl, normalizeFileUrl } from '../../common/utils/file-url'
import { getCurrentTenantId } from '../../common/tenant/tenant-context'
import { getPagination, toPaginatedResponse } from '../../common/utils/pagination'
import { PrismaService } from '../prisma/prisma.service'
import { CreateFileAssetDto, FileQueryDto, UpdateFileAssetDto } from './dto/file.dto'

interface FileAssetModel {
  findMany(args: Record<string, unknown>): Promise<unknown[]>
  count(args: Record<string, unknown>): Promise<number>
  findFirst(args: Record<string, unknown>): Promise<unknown | null>
  create(args: Record<string, unknown>): Promise<unknown>
  update(args: Record<string, unknown>): Promise<unknown>
  delete(args: Record<string, unknown>): Promise<unknown>
  deleteMany(args: Record<string, unknown>): Promise<{ count: number }>
}

interface LegacyApplicationFile {
  id: number
  applicationId: number
  fileType: string
  fileUrl: string
  fileName: string | null
  isValid: boolean
  createdAt: Date
  application?: {
    tenantId: number
    orgId: number
    applicationNo: string
  }
}

export interface UploadedImageFile {
  originalname: string
  mimetype: string
  size: number
  buffer: Buffer
}

function hasValue(value: unknown) {
  return value !== undefined && value !== null && value !== ''
}

@Injectable()
export class FileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService
  ) {}

  async uploadImage(file: UploadedImageFile | undefined, user: RequestUser) {
    if (!file) throw new BadRequestException('请选择要上传的图片')
    if (!file.mimetype.startsWith('image/')) throw new BadRequestException('仅支持图片文件')

    const dateFolder = this.getUploadDateFolder()
    const extension = this.resolveUploadExtension(file)
    const objectKey = `images/${dateFolder}/${randomUUID()}${extension}`
    const absolutePath = join(process.cwd(), 'uploads', objectKey)

    await mkdir(join(process.cwd(), 'uploads', 'images', dateFolder), { recursive: true })
    await writeFile(absolutePath, file.buffer)

    const apiPrefix = this.config.get<string>('API_PREFIX', 'saas/api')
    const url = buildUploadUrl(objectKey, apiPrefix)
    const fileName = this.decodeOriginalName(file.originalname)

    return {
      url,
      fileUrl: url,
      previewUrl: url,
      fileName,
      objectKey,
      fileKey: objectKey,
      mimeType: file.mimetype,
      fileExt: extension.slice(1),
      fileSize: file.size,
      storageType: 'LOCAL',
      uploadedBy: user.sub
    }
  }

  async getList(query: FileQueryDto) {
    const fileAsset = this.getFileAssetModel()
    if (!fileAsset) return this.getLegacyApplicationFileList(query)

    const pagination = getPagination(query)
    const where = this.buildWhere(query)

    try {
      const [records, total] = await this.prisma.$transaction([
        fileAsset.findMany({
          where,
          skip: pagination.skip,
          take: pagination.take,
          orderBy: { id: 'desc' }
        }),
        fileAsset.count({ where })
      ])
      return toPaginatedResponse(
        records.map((file) => this.mapFileAsset(file)),
        total,
        pagination
      )
    } catch (error) {
      if (this.isMissingFileAssetStorage(error)) return this.getLegacyApplicationFileList(query)
      throw error
    }
  }

  async getDetail(id: number) {
    const fileAsset = this.getFileAssetModel()
    if (!fileAsset) return this.getLegacyApplicationFileDetail(id)

    let item: unknown | null
    try {
      item = await fileAsset.findFirst({ where: this.withTenant({ id }) })
    } catch (error) {
      if (this.isMissingFileAssetStorage(error)) return this.getLegacyApplicationFileDetail(id)
      throw error
    }
    if (!item) throw new NotFoundException('文件不存在')
    return this.mapFileAsset(item)
  }

  async create(dto: CreateFileAssetDto, user: RequestUser) {
    const fileAsset = this.requireFileAssetModel()
    this.validateBusinessBinding(dto)
    await this.validateOrg(dto.orgId)
    try {
      return await fileAsset.create({ data: { ...dto, uploadedBy: dto.uploadedBy ?? user.sub } })
    } catch (error) {
      this.throwIfMissingFileAssetStorage(error)
      throw error
    }
  }

  async update(id: number, dto: UpdateFileAssetDto) {
    const fileAsset = this.requireFileAssetModel()
    await this.getDetail(id)
    this.validateBusinessBinding(dto)
    await this.validateOrg(dto.orgId)
    try {
      return await fileAsset.update({ where: { id }, data: dto })
    } catch (error) {
      this.throwIfMissingFileAssetStorage(error)
      throw error
    }
  }

  async remove(id: number) {
    const fileAsset = this.requireFileAssetModel()
    await this.getDetail(id)
    try {
      await fileAsset.delete({ where: { id } })
    } catch (error) {
      this.throwIfMissingFileAssetStorage(error)
      throw error
    }
    return { id }
  }

  async batchRemove(ids: number[]) {
    const uniqueIds = Array.from(new Set(ids.filter((id) => Number.isInteger(id) && id > 0)))
    if (!uniqueIds.length) throw new BadRequestException('请选择要删除的文件')

    const fileAsset = this.requireFileAssetModel()
    try {
      const result = await fileAsset.deleteMany({
        where: this.withTenant({ id: { in: uniqueIds } })
      })
      return { ids: uniqueIds, count: result.count }
    } catch (error) {
      this.throwIfMissingFileAssetStorage(error)
      throw error
    }
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

    const fileAsset = this.getFileAssetModel()
    if (!fileAsset) return this.getLegacyApplicationFileCategories(query)

    let files: unknown[]
    try {
      files = await fileAsset.findMany({
        where: this.buildWhere(query),
        orderBy: [{ categoryCode: 'asc' }, { id: 'desc' }]
      })
    } catch (error) {
      if (this.isMissingFileAssetStorage(error)) return this.getLegacyApplicationFileCategories(query)
      throw error
    }

    const groupMap = new Map<string, { code: string; name: string; count: number; files: unknown[] }>()
    for (const file of files as Array<{ categoryCode: string; categoryName: string }>) {
      const current: { code: string; name: string; count: number; files: unknown[] } =
        groupMap.get(file.categoryCode) || {
        code: file.categoryCode,
        name: file.categoryName,
        count: 0,
        files: []
      }
      current.count += 1
      current.files.push(this.mapFileAsset(file))
      groupMap.set(file.categoryCode, current)
    }
    return Array.from(groupMap.values())
  }

  private async getLegacyApplicationFileList(query: FileQueryDto) {
    const pagination = getPagination(query)
    const where = this.buildLegacyApplicationFileWhere(query)
    const [records, total] = await this.prisma.$transaction([
      this.prisma.applicationFile.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { id: 'desc' },
        include: {
          application: {
            select: {
              tenantId: true,
              orgId: true,
              applicationNo: true
            }
          }
        }
      }),
      this.prisma.applicationFile.count({ where })
    ])

    return toPaginatedResponse(
      (records as LegacyApplicationFile[]).map((file) => this.mapLegacyApplicationFile(file)),
      total,
      pagination
    )
  }

  private async getLegacyApplicationFileDetail(id: number) {
    const file = await this.prisma.applicationFile.findFirst({
      where: this.withLegacyTenant({ id }),
      include: {
        application: {
          select: {
            tenantId: true,
            orgId: true,
            applicationNo: true
          }
        }
      }
    })

    if (!file) throw new NotFoundException('文件不存在')
    return this.mapLegacyApplicationFile(file as LegacyApplicationFile)
  }

  private async getLegacyApplicationFileCategories(query: FileQueryDto) {
    const files = await this.prisma.applicationFile.findMany({
      where: this.buildLegacyApplicationFileWhere(query),
      orderBy: [{ fileType: 'asc' }, { id: 'desc' }],
      include: {
        application: {
          select: {
            tenantId: true,
            orgId: true,
            applicationNo: true
          }
        }
      }
    })
    const groupMap = new Map<string, { code: string; name: string; count: number; files: unknown[] }>()

    for (const file of (files as LegacyApplicationFile[]).map((item) => this.mapLegacyApplicationFile(item))) {
      const current = groupMap.get(file.categoryCode) || {
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

  private buildLegacyApplicationFileWhere(query: FileQueryDto) {
    const where: Record<string, unknown> = {}
    const applicationWhere: Record<string, unknown> = this.legacyTenantWhere()

    if (hasValue(query.businessType) && query.businessType !== 'APPLICATION') {
      where.id = -1
    }
    if (hasValue(query.orgId)) applicationWhere.orgId = query.orgId
    if (hasValue(query.businessId)) where.applicationId = query.businessId
    if (hasValue(query.categoryCode)) where.fileType = query.categoryCode
    if (hasValue(query.status)) where.isValid = query.status === 'ACTIVE'
    if (hasValue(query.fileName)) where.fileName = { contains: query.fileName, mode: 'insensitive' }
    if (Object.keys(applicationWhere).length) where.application = applicationWhere

    return where
  }

  private withLegacyTenant(where: Record<string, unknown>) {
    const applicationWhere = this.legacyTenantWhere()
    if (!Object.keys(applicationWhere).length) return where
    return {
      ...where,
      application: applicationWhere
    }
  }

  private withTenant(where: Record<string, unknown>) {
    const tenantId = getCurrentTenantId()
    return tenantId ? { ...where, tenantId } : where
  }

  private legacyTenantWhere() {
    const tenantId = getCurrentTenantId()
    return tenantId ? { tenantId } : {}
  }

  private mapLegacyApplicationFile(file: LegacyApplicationFile) {
    const fileName = file.fileName || this.getFileNameFromUrl(file.fileUrl)
    const fileUrl = normalizeFileUrl(file.fileUrl, this.config.get<string>('API_PREFIX', 'saas/api'))

    return {
      id: file.id,
      orgId: file.application?.orgId,
      businessType: 'APPLICATION',
      businessId: file.applicationId,
      categoryCode: file.fileType,
      categoryName: this.resolveCategoryName(file.fileType),
      fileName,
      url: fileUrl,
      fileUrl,
      previewUrl: fileUrl,
      objectKey: undefined,
      fileKey: undefined,
      mimeType: undefined,
      fileExt: this.resolveFileExt(fileName),
      fileSize: undefined,
      storageType: 'LOCAL',
      status: file.isValid ? 'ACTIVE' : 'INACTIVE',
      uploadedBy: undefined,
      remark: file.application?.applicationNo ? `进件编号：${file.application.applicationNo}` : undefined,
      createdAt: file.createdAt,
      updatedAt: file.createdAt
    }
  }

  private mapFileAsset(file: unknown) {
    const item = file as Record<string, unknown>
    const fileUrl = normalizeFileUrl(String(item.fileUrl || item.url || ''), this.config.get<string>('API_PREFIX', 'saas/api'))
    const objectKey = item.objectKey ? String(item.objectKey) : undefined

    return {
      ...item,
      url: fileUrl,
      fileUrl,
      previewUrl: fileUrl,
      objectKey,
      fileKey: objectKey
    }
  }

  private getFileAssetModel() {
    return (this.prisma as unknown as { fileAsset?: FileAssetModel }).fileAsset
  }

  private requireFileAssetModel() {
    const fileAsset = this.getFileAssetModel()
    if (!fileAsset) {
      throw new BadRequestException('文件资产表尚未初始化，请先执行 Prisma 迁移')
    }
    return fileAsset
  }

  private isMissingFileAssetStorage(error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return error.code === 'P2021' || error.code === 'P2022'
    }

    const message = error instanceof Error ? error.message : ''
    return message.includes('fileAsset') || message.includes('"FileAsset"') || message.includes('FileAsset')
  }

  private throwIfMissingFileAssetStorage(error: unknown) {
    if (this.isMissingFileAssetStorage(error)) {
      throw new BadRequestException('文件资产表尚未初始化，请先执行 Prisma 迁移')
    }
  }

  private resolveCategoryName(value: string) {
    const categoryMap: Record<string, string> = {
      IMAGE: '图片',
      ID_CARD: '身份证',
      VEHICLE_LICENSE: '行驶证',
      VEHICLE_REGISTER: '登记证',
      BANK_CARD: '银行卡',
      INCOME_PROOF: '收入证明',
      CONTRACT: '合同文件',
      DISBURSEMENT_VOUCHER: '放款凭证',
      MORTGAGE_RECEIPT: '抵押回执',
      OTHER: '其他'
    }

    return categoryMap[value] || value
  }

  private getFileNameFromUrl(fileUrl: string) {
    const normalized = fileUrl.split('?')[0]
    const fileName = normalized.split('/').filter(Boolean).pop()
    return fileName || fileUrl
  }

  private resolveFileExt(fileName: string) {
    const ext = fileName.split('.').pop()
    return ext && ext !== fileName ? ext : undefined
  }

  private getUploadDateFolder() {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    return `${year}${month}`
  }

  private resolveUploadExtension(file: UploadedImageFile) {
    const originalExtension = extname(file.originalname).toLowerCase()
    if (originalExtension) return originalExtension

    const mimeExtensionMap: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'image/bmp': '.bmp'
    }

    return mimeExtensionMap[file.mimetype] || '.jpg'
  }

  private decodeOriginalName(fileName: string) {
    try {
      return Buffer.from(fileName, 'latin1').toString('utf8')
    } catch {
      return fileName
    }
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
