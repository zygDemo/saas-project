import { Injectable, BadRequestException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { randomUUID } from 'crypto'
import { mkdir, writeFile } from 'fs/promises'
import { extname, join } from 'path'
import { buildUploadUrl } from '../../common/utils/file-url'
import { PrismaService } from '../prisma/prisma.service'
import { UploadedImageFile } from '../file/file.service'
import { RequestUser } from '../../common/types/request-user'
import { MobileUploadResult, IMAGE_UPLOAD_LIMIT, mimeToExtension, decodeOriginalName, fileNameFromReference, extFromFileName, resolveCategoryName, normalizeFileReference, mapFileAsset, isMissingFileAssetStorage } from './mobile-business.utils'
import { getDefaultOrg, findApplication, findCustomerByUuid, getCustomerByUuid, getFileAssetModel, getCustomerApplicationIds, getCustomerVehicleIds } from './mobile-business.db-helpers'
import { getRequiredTenantId } from '../../common/utils/helpers'

@Injectable()
export class MobileFileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService
  ) {}

  async upload(file: UploadedImageFile | undefined, user: RequestUser, headerOrgId?: number) {
    if (!file) throw new BadRequestException('请选择要上传的文件')
    if (!file.mimetype.startsWith('image/')) throw new BadRequestException('仅支持图片文件')
    if (file.size > IMAGE_UPLOAD_LIMIT) throw new BadRequestException('图片大小不能超过 10MB')

    const result = await this.saveImage(file, user)
    const org = await getDefaultOrg(this.prisma, headerOrgId)
    const createdFile = await this.createFileAsset({
      orgId: org.id,
      businessType: 'MOBILE',
      businessId: user.sub,
      categoryCode: 'IMAGE',
      categoryName: '图片',
      upload: result,
      user
    })
    return createdFile || result
  }

  async uploadWithType(
    file: UploadedImageFile | undefined,
    body: Record<string, string>,
    user: RequestUser,
    headerOrgId?: number
  ) {
    if (!file) throw new BadRequestException('请选择要上传的文件')
    const uploadResult = await this.saveImage(file, user)
    const binding = await this.resolveFileBinding(body, user, headerOrgId)
    const createdFile = await this.createFileAsset({
      orgId: binding.orgId,
      businessType: binding.businessType,
      businessId: binding.businessId,
      categoryCode: binding.categoryCode,
      categoryName: binding.categoryName,
      upload: uploadResult,
      user
    })
    return createdFile || uploadResult
  }

  async getFileList(query: Record<string, string>, user: RequestUser) {
    const fileAsset = getFileAssetModel(this.prisma)
    if (!fileAsset) return []
    const where = await this.buildFileWhere(query, user)
    const files = await fileAsset.findMany({
      where,
      orderBy: { id: 'desc' }
    })
    const apiPrefix = this.config.get<string>('API_PREFIX', 'saas/api')
    return (files as Record<string, unknown>[]).map((file) => mapFileAsset(file, apiPrefix))
  }

  async getFileListByType(query: Record<string, string>, user: RequestUser) {
    return this.getFileList({ ...query, fileType: query.fileType || query.categoryCode }, user)
  }

  async deleteFile(id: number) {
    if (!Number.isInteger(id) || id <= 0) throw new BadRequestException('文件ID不正确')
    const fileAsset = getFileAssetModel(this.prisma)
    if (!fileAsset?.update) return { id }
    await fileAsset.update({ where: { id }, data: { status: 'INACTIVE' } })
    return { id }
  }

  getProductFileList() {
    return [
      {
        id: 1,
        fileName: '个人资料相关',
        children: [
          {
            fileCode: 'PFL001',
            fileType: 'ID_CARD_FRONT',
            fileName: '身份证人像面',
            fileSort: 1,
            requireFlag: 1,
            acceptType: 'jpg|jpeg|png|webp'
          },
          {
            fileCode: 'PFL002',
            fileType: 'ID_CARD_BACK',
            fileName: '身份证国徽面',
            fileSort: 2,
            requireFlag: 1,
            acceptType: 'jpg|jpeg|png|webp'
          }
        ]
      },
      {
        id: 2,
        fileName: '车辆证明资料',
        children: [
          {
            fileCode: 'PFL006',
            fileType: 'VEHICLE_LICENSE',
            fileName: '行驶证',
            fileSort: 6,
            requireFlag: 1,
            acceptType: 'jpg|jpeg|png|webp'
          },
          {
            fileCode: 'PFL008',
            fileType: 'VEHICLE_IMAGE',
            fileName: '车辆照片',
            fileSort: 8,
            requireFlag: 2,
            acceptType: 'jpg|jpeg|png|webp'
          }
        ]
      }
    ]
  }

  async saveImage(file: UploadedImageFile, user: RequestUser): Promise<MobileUploadResult> {
    const now = new Date()
    const folder = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
    const originalExt = extname(file.originalname).toLowerCase()
    const extension = originalExt || mimeToExtension(file.mimetype)
    const objectKey = `images/${folder}/${randomUUID()}${extension}`
    const absolutePath = join(process.cwd(), 'uploads', objectKey)

    await mkdir(join(process.cwd(), 'uploads', 'images', folder), { recursive: true })
    await writeFile(absolutePath, file.buffer)

    const apiPrefix = this.config.get<string>('API_PREFIX', 'saas/api')
    const url = buildUploadUrl(objectKey, apiPrefix)
    const fileName = decodeOriginalName(file.originalname)

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

  async createFileAsset(params: {
    orgId: number
    businessType: string
    businessId: number
    categoryCode: string
    categoryName: string
    upload?: MobileUploadResult
    reference?: string
    user: RequestUser
  }): Promise<Record<string, unknown> | null> {
    const fileAsset = getFileAssetModel(this.prisma)
    if (!fileAsset) return null

    const apiPrefix = this.config.get<string>('API_PREFIX', 'saas/api')
    const reference = params.upload?.objectKey || params.reference || ''
    const normalized = normalizeFileReference(reference, apiPrefix)
    const fileName = params.upload?.fileName || fileNameFromReference(reference)

    try {
      const created = await fileAsset.create({
        data: {
          orgId: params.orgId,
          businessType: params.businessType,
          businessId: params.businessId,
          categoryCode: params.categoryCode,
          categoryName: params.categoryName,
          fileName,
          fileUrl: params.upload?.url || normalized.url,
          objectKey: params.upload?.objectKey || normalized.objectKey,
          mimeType: params.upload?.mimeType,
          fileExt: params.upload?.fileExt || extFromFileName(fileName),
          fileSize: params.upload?.fileSize,
          storageType: 'LOCAL',
          status: 'ACTIVE',
          uploadedBy: params.user.sub
        }
      })

      if (params.businessType === 'APPLICATION' && params.businessId) {
        try {
          await this.prisma.applicationFile.create({
            data: {
              applicationId: params.businessId,
              fileType: params.categoryCode,
              fileUrl: params.upload?.url || normalized.url,
              fileName
            }
          })
        } catch {
          // 忽略重复或关联失败，不影响主流程
        }
      }

      return mapFileAsset(created as Record<string, unknown>, apiPrefix)
    } catch (error) {
      if (isMissingFileAssetStorage(error)) return null
      throw error
    }
  }

  private async resolveFileBinding(
    body: Record<string, string>,
    user: RequestUser,
    headerOrgId?: number
  ) {
    const fileType = body.fileType || body.fileCode || body.categoryCode || 'IMAGE'
    if (body.creditOrderId) {
      const application = await findApplication(this.prisma, body.creditOrderId)
      return {
        orgId: application.orgId,
        businessType: 'APPLICATION',
        businessId: application.id,
        categoryCode: fileType,
        categoryName: resolveCategoryName(fileType)
      }
    }
    if (body.uuid) {
      const tenantId = getRequiredTenantId()
      const customer = await getCustomerByUuid(this.prisma, body.uuid, tenantId)
      return {
        orgId: customer.orgId,
        businessType: 'CUSTOMER',
        businessId: customer.id,
        categoryCode: fileType,
        categoryName: resolveCategoryName(fileType)
      }
    }
    const org = await getDefaultOrg(this.prisma, headerOrgId)
    return {
      orgId: org.id,
      businessType: 'MOBILE',
      businessId: user.sub,
      categoryCode: fileType,
      categoryName: resolveCategoryName(fileType)
    }
  }

  private async buildFileWhere(query: Record<string, string>, user: RequestUser) {
    const where: Record<string, unknown> = { status: 'ACTIVE' }
    const categoryCode = query.categoryCode || query.fileType || query.fileCode
    if (categoryCode) where.categoryCode = categoryCode
    if (query.businessType) where.businessType = query.businessType
    if (query.businessId) where.businessId = Number(query.businessId)

    if (query.creditOrderId) {
      const application = await findApplication(this.prisma, query.creditOrderId)
      where.businessType = 'APPLICATION'
      where.businessId = application.id
      return where
    }
    if (query.uuid) {
      const customer = await findCustomerByUuid(this.prisma, query.uuid)
      if (customer) {
        where.OR = [
          { businessType: 'CUSTOMER', businessId: customer.id },
          {
            businessType: 'APPLICATION',
            businessId: { in: await getCustomerApplicationIds(this.prisma, customer.id) }
          },
          {
            businessType: 'VEHICLE',
            businessId: { in: await getCustomerVehicleIds(this.prisma, customer.id) }
          }
        ]
        return where
      }
    }

    where.OR = [{ businessType: 'MOBILE', businessId: user.sub }, { uploadedBy: user.sub }]
    return where
  }

  async linkCustomerImages(customer: Record<string, unknown>, idcardFront: string | undefined, idcardBack: string | undefined, user: RequestUser) {
    if (idcardFront) {
      await this.createFileAsset({
        orgId: customer.orgId as number,
        businessType: 'CUSTOMER',
        businessId: customer.id as number,
        categoryCode: 'ID_CARD_FRONT',
        categoryName: '身份证人像面',
        reference: idcardFront,
        user
      })
    }
    if (idcardBack) {
      await this.createFileAsset({
        orgId: customer.orgId as number,
        businessType: 'CUSTOMER',
        businessId: customer.id as number,
        categoryCode: 'ID_CARD_BACK',
        categoryName: '身份证国徽面',
        reference: idcardBack,
        user
      })
    }
  }

  async linkApplicationFiles(application: Record<string, unknown>, customer: Record<string, unknown>) {
    const vehicles = await this.prisma.vehicle.findMany({
      where: { customerId: customer.id as number },
      select: { id: true }
    })
    const vehicleIds = vehicles.map((vehicle: { id: number }) => vehicle.id)
    const fileAsset = getFileAssetModel(this.prisma)
    const fileAssets = (await fileAsset?.findMany?.({
      where: {
        OR: [
          {
            businessType: 'CUSTOMER',
            businessId: customer.id,
            categoryCode: { in: ['ID_CARD_FRONT', 'ID_CARD_BACK'] }
          },
          {
            businessType: 'VEHICLE',
            businessId: { in: vehicleIds },
            categoryCode: 'VEHICLE_LICENSE'
          }
        ]
      }
    })) as Record<string, unknown>[] | undefined

    if (!fileAssets?.length) return
    await this.prisma.applicationFile.createMany({
      data: fileAssets.map((file) => ({
        applicationId: application.id as number,
        fileType: file.categoryCode as string,
        fileUrl: file.fileUrl as string,
        fileName: file.fileName as string
      }))
    })
  }
}
