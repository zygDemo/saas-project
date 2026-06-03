import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ApplicationStatus, Gender, Prisma } from '@prisma/client'
import { RequestUser } from '../../common/types/request-user'
import { getPagination } from '../../common/utils/pagination'
import { PrismaService } from '../prisma/prisma.service'
import { UploadedImageFile } from '../file/file.service'
import { OcrObjectKeyDto } from '../ocr/dto/ocr.dto'
import { OcrService } from '../ocr/ocr.service'
import {
  MobileCreditApplyDto,
  MobileCreditListQueryDto,
  MobileCreditUpdateDto,
  MobileIdCardInfoDto,
  MobileUserListQueryDto,
  MobileVehicleInfoDto
} from './dto/mobile-business.dto'

const IMAGE_UPLOAD_LIMIT = 10 * 1024 * 1024
const SUCCESS_CREDIT_STATUSES = new Set<ApplicationStatus>([
  ApplicationStatus.FINAL_REVIEW_PASSED,
  ApplicationStatus.FUNDER_REVIEW_PASSED,
  ApplicationStatus.PENDING_SIGN,
  ApplicationStatus.SIGNED,
  ApplicationStatus.PENDING_DISBURSEMENT,
  ApplicationStatus.DISBURSED
])
const FAILED_CREDIT_STATUSES = new Set<ApplicationStatus>([
  ApplicationStatus.FIRST_REVIEW_REJECTED,
  ApplicationStatus.FINAL_REVIEW_REJECTED,
  ApplicationStatus.FUNDER_REVIEW_REJECTED,
  ApplicationStatus.CANCELLED
])
const SIGN_STATUSES = new Set<ApplicationStatus>([
  ApplicationStatus.PENDING_SIGN,
  ApplicationStatus.SIGNED
])
const DISBURSEMENT_STATUSES = new Set<ApplicationStatus>([
  ApplicationStatus.PENDING_DISBURSEMENT,
  ApplicationStatus.DISBURSED
])
const PRE_AUDIT_STATUSES = new Set<ApplicationStatus>([
  ApplicationStatus.PENDING_FIRST_REVIEW,
  ApplicationStatus.FIRST_REVIEW_PASSED,
  ApplicationStatus.PENDING_FINAL_REVIEW
])
const MOBILE_ENTRY_STORAGE_FIELDS = [
  'nation',
  'householdAddress',
  'issuingAuthority',
  'idCardValidFrom',
  'idCardValidTo',
  'idCardFront',
  'idCardBack',
  'ownerName',
  'usageNature',
  'sealInfo',
  'engineNumber',
  'registerDate',
  'vehicleImgUrl'
]
const MOBILE_ENTRY_STORAGE_ERROR =
  '移动端进件字段尚未初始化，请执行 admin-api Prisma 迁移并重新启动服务'

export interface MobileUploadResult {
  url: string
  fileName: string
  objectKey: string
  mimeType: string
  fileExt: string
  fileSize: number
  storageType: string
  uploadedBy: number
}

function hasValue(value: unknown) {
  return value !== undefined && value !== null && value !== ''
}

function generateApplicationNo() {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const hh = String(now.getHours()).padStart(2, '0')
  const mi = String(now.getMinutes()).padStart(2, '0')
  const ss = String(now.getSeconds()).padStart(2, '0')
  const rand = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0')
  return `APP${yyyy}${mm}${dd}${hh}${mi}${ss}${rand}`
}

@Injectable()
export class MobileBusinessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly ocrService: OcrService
  ) {}

  async upload(file: UploadedImageFile | undefined, user: RequestUser, headerOrgId?: number) {
    if (!file) throw new BadRequestException('请选择要上传的文件')
    if (!file.mimetype.startsWith('image/')) throw new BadRequestException('仅支持图片文件')
    if (file.size > IMAGE_UPLOAD_LIMIT) throw new BadRequestException('图片大小不能超过 10MB')

    const result = await this.saveImage(file, user)
    const org = await this.getDefaultOrg(headerOrgId)
    const createdFile = await this.createFileAsset({
      orgId: org.id,
      businessType: 'MOBILE',
      businessId: user.sub,
      categoryCode: 'IMAGE',
      categoryName: '图片',
      upload: result,
      user
    })
    const responseData = createdFile || result
    return responseData
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
    const responseData = createdFile || uploadResult
    return responseData
  }

  async getFileList(query: Record<string, string>, user: RequestUser) {
    const fileAsset = this.getFileAssetModel()
    if (!fileAsset) return []
    const where = await this.buildFileWhere(query, user)
    const files = await fileAsset.findMany({
      where,
      orderBy: { id: 'desc' }
    })
    return (files as any[]).map((file) => this.mapFileAsset(file))
  }

  async getFileListByType(query: Record<string, string>, user: RequestUser) {
    return this.getFileList({ ...query, fileType: query.fileType || query.categoryCode }, user)
  }

  async deleteFile(id: number) {
    if (!Number.isInteger(id) || id <= 0) throw new BadRequestException('文件ID不正确')
    const fileAsset = this.getFileAssetModel()
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

  async getIdCardOcr(body: OcrObjectKeyDto = {}, file?: UploadedImageFile) {
    if (file) return this.ocrService.recognizeIdCard(file, body.side)
    return this.ocrService.recognizeIdCardByObjectKey(body)
  }

  async getVehicleOcr(body: OcrObjectKeyDto = {}, file?: UploadedImageFile) {
    if (file) return this.ocrService.recognizeVehicle(file)
    return this.ocrService.recognizeVehicleByObjectKey(body)
  }

  async addOrUpdateUserBasic(dto: MobileIdCardInfoDto, user: RequestUser, headerOrgId?: number) {
    return this.guardMobileEntryStorage(async () => {
      const org = await this.getDefaultOrg(headerOrgId)
      const customerByUuid = dto.uuid ? await this.findCustomerByUuid(dto.uuid) : null
      const customerByPhone = customerByUuid
        ? null
        : await this.prisma.customer.findFirst({ where: { orgId: org.id, phone: dto.telephone } })
      const data = {
        orgId: customerByUuid?.orgId ?? customerByPhone?.orgId ?? org.id,
        name: dto.personName,
        phone: dto.telephone,
        idCard: dto.personIdcard,
        gender: this.mapGender(dto.gender),
        birthDate: this.parseBirthDate(dto.personIdcard),
        nation: dto.race,
        householdAddress: dto.personAddress,
        issuingAuthority: dto.personIssuingAuthority,
        idCardValidFrom: dto.personValidDateStart,
        idCardValidTo: dto.personValidDateEnd,
        idCardFront: dto.idcardFront,
        idCardBack: dto.idcardBack,
        address: dto.personAddress,
        status: 'ACTIVE'
      }

      const customer =
        customerByUuid || customerByPhone
          ? await this.prisma.customer.update({
              where: { id: (customerByUuid || customerByPhone).id },
              data
            })
          : await this.prisma.customer.create({ data })

      await this.linkCustomerImages(customer, dto, user)

      return this.mapCustomer(customer)
    })
  }

  async getUserBasic(uuid: string) {
    return this.guardMobileEntryStorage(async () => {
      const customer = await this.getCustomerByUuid(uuid)
      return this.mapCustomer(customer)
    })
  }

  async getUserList(query: MobileUserListQueryDto) {
    return this.guardMobileEntryStorage(async () => {
      const where: Record<string, unknown> = {}
      if (query.personName) where.name = { contains: query.personName, mode: 'insensitive' }

      const customers = await this.prisma.customer.findMany({
        where,
        orderBy: { id: 'desc' },
        take: 100
      })

      const rows = customers.map((customer) => ({
        ...this.mapCustomer(customer),
        dataSource: query.dataSource ?? 2,
        approval: 4,
        updateTime: this.formatDateTime(customer.updatedAt)
      }))

      return {
        code: 200,
        msg: 'success',
        data: rows,
        rows,
        total: customers.length
      }
    })
  }

  async addOrUpdateVehicle(dto: MobileVehicleInfoDto, user: RequestUser) {
    return this.guardMobileEntryStorage(async () => {
      const customer = await this.getCustomerByUuid(dto.uuid)
      const current = await this.prisma.vehicle.findFirst({
        where: {
          customerId: customer.id,
          OR: [{ vin: dto.vehicleCode }, { plateNumber: dto.plateNumber }]
        }
      })
      const data = {
        customerId: customer.id,
        vin: dto.vehicleCode,
        plateNumber: dto.plateNumber,
        brand: dto.vehicleBrand,
        model: dto.vehicleModel,
        ownerName: dto.vehicleOwner,
        address: dto.address,
        usageNature: dto.usageNature,
        sealInfo: dto.sealInfo,
        engineNumber: dto.engineNumber,
        registerDate: this.parseDate(dto.registerDate),
        vehicleImgUrl: dto.vehicleImgUrl,
        color: dto.vehicleColor,
        mileage: Number(dto.mileage),
        purchasePrice: this.centToYuan(dto.purchasePrice),
        isMortgaged: dto.isMortgage === 1,
        mortgageInfo: dto.isMortgage === 1 ? '已抵押' : undefined
      }

      const vehicle = current
        ? await this.prisma.vehicle.update({ where: { id: current.id }, data })
        : await this.prisma.vehicle.create({ data })

      if (dto.vehicleImgUrl) {
        await this.createFileAsset({
          orgId: customer.orgId,
          businessType: 'VEHICLE',
          businessId: vehicle.id,
          categoryCode: 'VEHICLE_LICENSE',
          categoryName: '行驶证',
          reference: dto.vehicleImgUrl,
          user
        })
      }

      return this.mapVehicle(vehicle, dto.uuid)
    })
  }

  async getVehicleInfo(uuid: string) {
    return this.guardMobileEntryStorage(async () => {
      const customer = await this.getCustomerByUuid(uuid)
      const vehicle = await this.prisma.vehicle.findFirst({
        where: { customerId: customer.id },
        orderBy: { id: 'desc' }
      })
      if (!vehicle) return null
      return this.mapVehicle(vehicle, uuid)
    })
  }

  async creditApply(dto: MobileCreditApplyDto, user: RequestUser) {
    const customer = await this.getCustomerByUuid(dto.uuid)
    const product = await this.getDefaultProduct(customer.orgId)
    const funder = await this.getDefaultFunder(customer.orgId)
    const rate = product ? Number(product.minRate) : 0.006
    const remarkParts = [
      dto.businessType ? `businessType=${dto.businessType}` : undefined,
      dto.orderType ? `orderType=${dto.orderType}` : undefined,
      hasValue(dto.parkingFee) ? `parkingFee=${dto.parkingFee}` : undefined,
      dto.vehicleStatus ? `vehicleStatus=${dto.vehicleStatus}` : undefined,
      dto.garage ? `garage=${dto.garage}` : undefined,
      dto.storeName ? `storeName=${dto.storeName}` : undefined,
      dto.ownerName ? `ownerName=${dto.ownerName}` : undefined,
      hasValue(dto.deposit) ? `deposit=${dto.deposit}` : undefined,
      dto.remark
    ].filter(Boolean)

    const application = await this.prisma.application.create({
      data: {
        orgId: customer.orgId,
        customerId: customer.id,
        productId: product?.id,
        funderId: funder?.id,
        applicationNo: generateApplicationNo(),
        amount: dto.amount,
        term: dto.periods,
        rate,
        repaymentMethod: product?.repaymentMethod || '等额本息',
        status: ApplicationStatus.SUBMITTED,
        businessType: 'CAR_LOAN',
        currentNode: 2000,
        currentStatus: 10,
        creatorId: user.sub,
        remark: remarkParts.join('；') || undefined
      }
    })

    await this.linkApplicationFiles(application, customer)

    return {
      uuid: String(customer.id),
      creditOrderId: application.applicationNo,
      id: application.id,
      status: this.mapCreditStatus(application.status),
      businessNode: this.mapBusinessNode(application.status)
    }
  }

  async updateCredit(dto: MobileCreditUpdateDto) {
    const application = await this.prisma.application.findFirst({
      where: { applicationNo: dto.creditOrderId }
    })
    if (!application) throw new NotFoundException('授信申请不存在')
    const updated = await this.prisma.application.update({
      where: { id: application.id },
      data: {
        amount: hasValue(dto.amount) ? dto.amount : undefined,
        term: hasValue(dto.periods) ? dto.periods : undefined,
        remark: dto.remark ?? application.remark
      }
    })
    return this.mapApplication(updated)
  }

  async getCreditList(query: MobileCreditListQueryDto) {
    const pagination = getPagination(query)
    const where: Record<string, unknown> = {}
    if (query.salesmanId) where.creatorId = query.salesmanId
    if (query.businessNode) {
      const status = this.statusFromBusinessNode(query.businessNode)
      if (status) where.status = status
    }

    if (query.personName) {
      where.customer = { name: { contains: query.personName, mode: 'insensitive' } }
    }

    const [records, total] = await this.prisma.$transaction([
      this.prisma.application.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { id: 'desc' },
        include: {
          customer: true,
          product: true
        }
      }),
      this.prisma.application.count({ where })
    ])

    const rows = records.map((item) => this.mapApplication(item))

    return {
      code: 200,
      msg: 'success',
      data: rows,
      rows,
      total
    }
  }

  async getCreditDetail(id: string | number) {
    const application = await this.findApplication(id)
    return this.mapApplication(application, true)
  }

  async getCreditDetailByOrderId(creditOrderId: string) {
    const application = await this.findApplication(creditOrderId)
    return this.mapApplication(application, true)
  }

  getLoanBusinessNodes() {
    return [
      { code: 'INITIAL_AUDIT', name: '初审', description: '待业务初审' },
      { code: 'PRE_AUDIT', name: '预审', description: '资料预审' },
      { code: 'SUPPLEMENT_MATERIALS', name: '补充资料', description: '等待补充资料' },
      { code: 'SIGN_CONTRACT', name: '签约', description: '等待签约' },
      { code: 'LOAN_DISBURSEMENT', name: '放款', description: '等待放款' }
    ]
  }

  getStatisticsOverview() {
    return {
      todayLeads: 0,
      pendingApproval: 0,
      monthlyDeals: 0,
      totalAmount: 0
    }
  }

  private async saveImage(file: UploadedImageFile, user: RequestUser): Promise<MobileUploadResult> {
    const { randomUUID } = await import('crypto')
    const { mkdir, writeFile } = await import('fs/promises')
    const { extname, join } = await import('path')
    const now = new Date()
    const folder = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
    const originalExt = extname(file.originalname).toLowerCase()
    const extension = originalExt || this.mimeToExtension(file.mimetype)
    const objectKey = `images/${folder}/${randomUUID()}${extension}`
    const absolutePath = join(process.cwd(), 'uploads', objectKey)

    await mkdir(join(process.cwd(), 'uploads', 'images', folder), { recursive: true })
    await writeFile(absolutePath, file.buffer)

    const apiPrefix = this.config.get<string>('API_PREFIX', 'saas/api').replace(/^\/+|\/+$/g, '')
    const fileName = this.decodeOriginalName(file.originalname)

    return {
      url: `/${apiPrefix}/uploads/${objectKey.replace(/\\/g, '/')}`,
      fileName,
      objectKey,
      mimeType: file.mimetype,
      fileExt: extension.slice(1),
      fileSize: file.size,
      storageType: 'LOCAL',
      uploadedBy: user.sub
    }
  }

  private async getDefaultOrg(orgId?: number) {
    if (orgId && Number.isInteger(orgId) && orgId > 0) {
      const headerOrg = await this.prisma.organization.findFirst({ where: { id: orgId } })
      if (headerOrg) return headerOrg
    }
    const org = await this.prisma.organization.findFirst({ orderBy: { id: 'asc' } })
    if (!org) throw new BadRequestException('请先配置机构')
    return org
  }

  private async getDefaultProduct(orgId: number) {
    const active = await this.prisma.product.findFirst({
      where: { orgId, status: 'ACTIVE' },
      orderBy: { id: 'asc' }
    })
    if (active) return active
    return this.prisma.product.findFirst({
      where: { orgId },
      orderBy: { id: 'asc' }
    })
  }

  private async getDefaultFunder(orgId: number) {
    return this.prisma.funder.findFirst({
      where: { orgId, status: 'ACTIVE' },
      orderBy: [{ priority: 'desc' }, { id: 'asc' }]
    })
  }

  private async findCustomerByUuid(uuid: string) {
    const id = Number(uuid)
    if (!Number.isInteger(id) || id <= 0) return null
    return this.prisma.customer.findFirst({ where: { id } })
  }

  private async getCustomerByUuid(uuid: string) {
    const customer = await this.findCustomerByUuid(uuid)
    if (!customer) throw new NotFoundException('客户信息不存在')
    return customer
  }

  private async findApplication(idOrNo: string | number) {
    const numericId = Number(idOrNo)
    const application =
      Number.isInteger(numericId) && numericId > 0
        ? await this.prisma.application.findFirst({
            where: { id: numericId },
            include: { customer: { include: { vehicles: true } }, product: true, funder: true }
          })
        : await this.prisma.application.findFirst({
            where: { applicationNo: String(idOrNo) },
            include: { customer: { include: { vehicles: true } }, product: true, funder: true }
          })
    if (!application) throw new NotFoundException('授信申请不存在')
    return application
  }

  private mapCustomer(customer: any) {
    return {
      id: customer.id,
      uuid: String(customer.id),
      personName: customer.name,
      telephone: customer.phone,
      personIdcard: customer.idCard,
      gender:
        customer.gender === Gender.MALE ? 1 : customer.gender === Gender.FEMALE ? 2 : undefined,
      nation: customer.nation,
      race: customer.nation,
      personAddress: customer.householdAddress || customer.address,
      personIssuingAuthority: customer.issuingAuthority,
      personValidDateStart: customer.idCardValidFrom,
      personValidDateEnd: customer.idCardValidTo,
      idcardFront: this.toFileUrl(customer.idCardFront),
      idcardBack: this.toFileUrl(customer.idCardBack),
      updateTime: this.formatDateTime(customer.updatedAt)
    }
  }

  private mapVehicle(vehicle: any, uuid: string) {
    return {
      id: vehicle.id,
      uuid,
      vehicleImgUrl: this.toFileUrl(vehicle.vehicleImgUrl),
      plateNumber: vehicle.plateNumber,
      vehicleBrand: vehicle.brand,
      vehicleModel: vehicle.model,
      vehicleOwner: vehicle.ownerName,
      address: vehicle.address,
      usageNature: vehicle.usageNature,
      sealInfo: vehicle.sealInfo,
      engineNumber: vehicle.engineNumber,
      registerDate: this.formatDateOnly(vehicle.registerDate),
      vehicleCode: vehicle.vin,
      mileage: vehicle.mileage,
      purchasePrice: this.yuanToCent(vehicle.purchasePrice),
      vehicleColor: vehicle.color,
      isMortgage: vehicle.isMortgaged ? 1 : 2
    }
  }

  private mapApplication(application: any, includeDetail = false) {
    const customer = application.customer
    const vehicle = customer?.vehicles?.[0] || customer?.vehicles?.at?.(0)
    return {
      id: application.id,
      uuid: customer ? String(customer.id) : String(application.customerId),
      creditOrderId: application.applicationNo,
      name: customer?.name || '',
      phone: customer?.phone || '',
      status: this.mapCreditStatus(application.status),
      businessNode: this.mapBusinessNode(application.status),
      productName: application.product?.name,
      periods: application.term,
      pushQuota: Number(application.amount).toFixed(2),
      passQuota: application.approvedAmount
        ? Number(application.approvedAmount).toFixed(2)
        : undefined,
      validAmt: application.approvedAmount
        ? Number(application.approvedAmount).toFixed(2)
        : undefined,
      remark: application.remark,
      createTime: this.formatDateTime(application.createdAt),
      updateTime: this.formatDateTime(application.updatedAt),
      ...(includeDetail
        ? {
            vehicle: vehicle ? this.mapVehicle(vehicle, String(customer.id)) : undefined,
            customer: customer ? this.mapCustomer(customer) : undefined
          }
        : {})
    }
  }

  private async linkCustomerImages(customer: any, dto: MobileIdCardInfoDto, user: RequestUser) {
    if (dto.idcardFront) {
      await this.createFileAsset({
        orgId: customer.orgId,
        businessType: 'CUSTOMER',
        businessId: customer.id,
        categoryCode: 'ID_CARD_FRONT',
        categoryName: '身份证人像面',
        reference: dto.idcardFront,
        user
      })
    }
    if (dto.idcardBack) {
      await this.createFileAsset({
        orgId: customer.orgId,
        businessType: 'CUSTOMER',
        businessId: customer.id,
        categoryCode: 'ID_CARD_BACK',
        categoryName: '身份证国徽面',
        reference: dto.idcardBack,
        user
      })
    }
  }

  private async linkApplicationFiles(application: any, customer: any) {
    const vehicles = await this.prisma.vehicle.findMany({
      where: { customerId: customer.id },
      select: { id: true }
    })
    const vehicleIds = vehicles.map((vehicle) => vehicle.id)
    const fileAssets = (await this.getFileAssetModel()?.findMany?.({
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
    })) as any[] | undefined

    if (!fileAssets?.length) return
    await this.prisma.applicationFile.createMany({
      data: fileAssets.map((file) => ({
        applicationId: application.id,
        fileType: file.categoryCode,
        fileUrl: file.fileUrl,
        fileName: file.fileName
      }))
    })
  }

  private async createFileAsset(params: {
    orgId: number
    businessType: string
    businessId: number
    categoryCode: string
    categoryName: string
    upload?: MobileUploadResult
    reference?: string
    user: RequestUser
  }): Promise<Record<string, unknown> | null> {
    const fileAsset = this.getFileAssetModel()
    if (!fileAsset) return null

    const reference = params.upload?.objectKey || params.reference || ''
    const normalized = this.normalizeFileReference(reference)
    const fileName = params.upload?.fileName || this.fileNameFromReference(reference)

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
          fileExt: params.upload?.fileExt || this.extFromFileName(fileName),
          fileSize: params.upload?.fileSize,
          storageType: 'LOCAL',
          status: 'ACTIVE',
          uploadedBy: params.user.sub
        }
      })
      return this.mapFileAsset(created)
    } catch (error) {
      if (this.isMissingFileAssetStorage(error)) return null
      throw error
    }
  }

  private getFileAssetModel() {
    return (
      this.prisma as unknown as {
        fileAsset?: {
          findMany(args: unknown): Promise<unknown[]>
          create(args: unknown): Promise<unknown>
          update(args: unknown): Promise<unknown>
        }
      }
    ).fileAsset
  }

  private async resolveFileBinding(
    body: Record<string, string>,
    user: RequestUser,
    headerOrgId?: number
  ) {
    const fileType = body.fileType || body.fileCode || body.categoryCode || 'IMAGE'
    if (body.creditOrderId) {
      const application = await this.findApplication(body.creditOrderId)
      return {
        orgId: application.orgId,
        businessType: 'APPLICATION',
        businessId: application.id,
        categoryCode: fileType,
        categoryName: this.resolveCategoryName(fileType)
      }
    }
    if (body.uuid) {
      const customer = await this.getCustomerByUuid(body.uuid)
      return {
        orgId: customer.orgId,
        businessType: 'CUSTOMER',
        businessId: customer.id,
        categoryCode: fileType,
        categoryName: this.resolveCategoryName(fileType)
      }
    }
    const org = await this.getDefaultOrg(headerOrgId)
    return {
      orgId: org.id,
      businessType: 'MOBILE',
      businessId: user.sub,
      categoryCode: fileType,
      categoryName: this.resolveCategoryName(fileType)
    }
  }

  private async buildFileWhere(query: Record<string, string>, user: RequestUser) {
    const where: Record<string, unknown> = { status: 'ACTIVE' }
    const categoryCode = query.categoryCode || query.fileType || query.fileCode
    if (categoryCode) where.categoryCode = categoryCode
    if (query.businessType) where.businessType = query.businessType
    if (query.businessId) where.businessId = Number(query.businessId)

    if (query.creditOrderId) {
      const application = await this.findApplication(query.creditOrderId)
      where.businessType = 'APPLICATION'
      where.businessId = application.id
      return where
    }
    if (query.uuid) {
      const customer = await this.findCustomerByUuid(query.uuid)
      if (customer) {
        where.OR = [
          { businessType: 'CUSTOMER', businessId: customer.id },
          {
            businessType: 'APPLICATION',
            businessId: { in: await this.getCustomerApplicationIds(customer.id) }
          },
          {
            businessType: 'VEHICLE',
            businessId: { in: await this.getCustomerVehicleIds(customer.id) }
          }
        ]
        return where
      }
    }

    where.OR = [{ businessType: 'MOBILE', businessId: user.sub }, { uploadedBy: user.sub }]
    return where
  }

  private async getCustomerApplicationIds(customerId: number) {
    const applications = await this.prisma.application.findMany({
      where: { customerId },
      select: { id: true }
    })
    return applications.map((item) => item.id)
  }

  private async getCustomerVehicleIds(customerId: number) {
    const vehicles = await this.prisma.vehicle.findMany({
      where: { customerId },
      select: { id: true }
    })
    return vehicles.map((item) => item.id)
  }

  private mapFileAsset(file: any) {
    return {
      ...file,
      url: file.fileUrl,
      fileUrl: file.fileUrl,
      objectKey: file.objectKey,
      fileKey: file.objectKey,
      fileType: file.categoryCode,
      fileCode: file.categoryCode,
      name: file.fileName
    }
  }

  private normalizeFileReference(reference: string) {
    const apiPrefix = this.config.get<string>('API_PREFIX', 'saas/api').replace(/^\/+|\/+$/g, '')
    if (!reference) return { url: '', objectKey: undefined }
    if (reference.startsWith('/')) {
      const marker = `/${apiPrefix}/uploads/`
      return {
        url: reference,
        objectKey: reference.startsWith(marker) ? reference.slice(marker.length) : undefined
      }
    }
    return {
      url: `/${apiPrefix}/uploads/${reference.replace(/^\/+/, '')}`,
      objectKey: reference
    }
  }

  private toFileUrl(reference?: string | null) {
    if (!reference) return ''
    return this.normalizeFileReference(reference).url
  }

  private resolveCategoryName(fileType: string) {
    const map: Record<string, string> = {
      ID_CARD_FRONT: '身份证人像面',
      ID_CARD_BACK: '身份证国徽面',
      VEHICLE_LICENSE: '行驶证',
      IMAGE: '图片'
    }
    return map[fileType] || fileType
  }

  private mapGender(gender?: number) {
    if (gender === 1) return Gender.MALE
    if (gender === 2) return Gender.FEMALE
    return Gender.UNKNOWN
  }

  private parseBirthDate(idCard?: string) {
    if (!idCard || idCard.length < 14) return undefined
    const text = `${idCard.slice(6, 10)}-${idCard.slice(10, 12)}-${idCard.slice(12, 14)}`
    return this.parseDate(text)
  }

  private parseDate(value?: string) {
    if (!value) return undefined
    const normalized = value.replace(/[./]/g, '-')
    const date = new Date(normalized)
    return Number.isNaN(date.getTime()) ? undefined : date
  }

  private formatDateOnly(value?: Date | string | null) {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }

  private formatDateTime(value?: Date | string | null) {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    const hh = String(date.getHours()).padStart(2, '0')
    const mi = String(date.getMinutes()).padStart(2, '0')
    const ss = String(date.getSeconds()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`
  }

  private centToYuan(value?: number) {
    if (!hasValue(value)) return undefined
    return Number(value) / 100
  }

  private yuanToCent(value?: Prisma.Decimal | number | null) {
    if (!hasValue(value)) return undefined
    return Math.round(Number(value) * 100)
  }

  private mapCreditStatus(status: ApplicationStatus) {
    if (SUCCESS_CREDIT_STATUSES.has(status)) return 1
    if (FAILED_CREDIT_STATUSES.has(status)) return 2
    if (status === ApplicationStatus.PENDING_SUPPLEMENT) return 3
    return 4
  }

  private mapBusinessNode(status: ApplicationStatus) {
    if (status === ApplicationStatus.PENDING_SUPPLEMENT) return 'SUPPLEMENT_MATERIALS'
    if (SIGN_STATUSES.has(status)) return 'SIGN_CONTRACT'
    if (DISBURSEMENT_STATUSES.has(status)) return 'LOAN_DISBURSEMENT'
    if (PRE_AUDIT_STATUSES.has(status)) return 'PRE_AUDIT'
    return 'INITIAL_AUDIT'
  }

  private statusFromBusinessNode(node: string) {
    const map: Record<string, ApplicationStatus> = {
      INITIAL_AUDIT: ApplicationStatus.SUBMITTED,
      PRE_AUDIT: ApplicationStatus.PENDING_FIRST_REVIEW,
      SUPPLEMENT_MATERIALS: ApplicationStatus.PENDING_SUPPLEMENT,
      SIGN_CONTRACT: ApplicationStatus.PENDING_SIGN,
      LOAN_DISBURSEMENT: ApplicationStatus.PENDING_DISBURSEMENT
    }
    return map[node]
  }

  private mimeToExtension(mimeType: string) {
    const map: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'image/bmp': '.bmp'
    }
    return map[mimeType] || '.jpg'
  }

  private decodeOriginalName(fileName: string) {
    try {
      return Buffer.from(fileName, 'latin1').toString('utf8')
    } catch {
      return fileName
    }
  }

  private fileNameFromReference(reference: string) {
    return reference.split('?')[0].split('/').filter(Boolean).pop() || 'upload'
  }

  private extFromFileName(fileName: string) {
    const ext = fileName.split('.').pop()
    return ext && ext !== fileName ? ext : undefined
  }

  private async guardMobileEntryStorage<T>(action: () => Promise<T>) {
    try {
      return await action()
    } catch (error) {
      if (this.isMissingMobileEntryStorage(error)) {
        throw new BadRequestException(MOBILE_ENTRY_STORAGE_ERROR)
      }
      throw error
    }
  }

  private isMissingMobileEntryStorage(error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return error.code === 'P2022'
    }
    const message = error instanceof Error ? error.message : ''
    const isKnownField = MOBILE_ENTRY_STORAGE_FIELDS.some((field) => message.includes(field))
    return (
      isKnownField &&
      (message.includes('Unknown argument') ||
        message.includes('does not exist') ||
        message.includes('not found') ||
        message.includes('column'))
    )
  }

  private isMissingFileAssetStorage(error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return error.code === 'P2021' || error.code === 'P2022'
    }
    const message = error instanceof Error ? error.message : ''
    return message.includes('FileAsset') || message.includes('fileAsset')
  }
}
