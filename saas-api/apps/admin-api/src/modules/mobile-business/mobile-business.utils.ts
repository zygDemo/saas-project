import { BadRequestException } from '@nestjs/common'
import { ApplicationStatus, Gender, Prisma } from '@prisma/client'
import { hasValue } from '../../common/utils/helpers'
import {
  normalizeFileUrl,
  resolveObjectKeyFromFileUrl
} from '../../common/utils/file-url'
// ==================== Constants ====================
export const IMAGE_UPLOAD_LIMIT = 10 * 1024 * 1024
export const SUCCESS_CREDIT_STATUSES = new Set<ApplicationStatus>([
  ApplicationStatus.RISK_PRE_PASSED,
  ApplicationStatus.FUNDER_PRE_PASSED,
  ApplicationStatus.FINAL_REVIEW_PASSED,
  ApplicationStatus.FUNDER_REVIEW_PASSED,
  ApplicationStatus.LOAN_REQUEST_APPROVED,
  ApplicationStatus.PENDING_SIGN,
  ApplicationStatus.SIGNING_PROGRESS,
  ApplicationStatus.SIGNED,
  ApplicationStatus.PENDING_LOAN_REQUEST,
  ApplicationStatus.LOAN_REQUEST_REVIEWING,
  ApplicationStatus.PENDING_DISBURSEMENT,
  ApplicationStatus.DISBURSED
])
export const FAILED_CREDIT_STATUSES = new Set<ApplicationStatus>([
  ApplicationStatus.RISK_PRE_REJECTED,
  ApplicationStatus.FUNDER_PRE_REJECTED,
  ApplicationStatus.FIRST_REVIEW_REJECTED,
  ApplicationStatus.FINAL_REVIEW_REJECTED,
  ApplicationStatus.FUNDER_REVIEW_REJECTED,
  ApplicationStatus.LOAN_REQUEST_REJECTED,
  ApplicationStatus.CANCELLED
])
export const SIGN_STATUSES = new Set<ApplicationStatus>([
  ApplicationStatus.PENDING_SIGN,
  ApplicationStatus.SIGNING_PROGRESS,
  ApplicationStatus.SIGNED
])
export const DISBURSEMENT_STATUSES = new Set<ApplicationStatus>([
  ApplicationStatus.LOAN_REQUEST_APPROVED,
  ApplicationStatus.PENDING_DISBURSEMENT,
  ApplicationStatus.DISBURSED
])
export const PRE_AUDIT_STATUSES = new Set<ApplicationStatus>([
  ApplicationStatus.SUBMITTED,
  ApplicationStatus.PENDING_RISK_PRE,
  ApplicationStatus.RISK_PRE_PASSED,
  ApplicationStatus.PENDING_FUNDER_PRE,
  ApplicationStatus.FUNDER_PRE_PASSED,
  ApplicationStatus.PENDING_FIRST_REVIEW,
  ApplicationStatus.FIRST_REVIEW_PASSED,
  ApplicationStatus.PENDING_FINAL_REVIEW
])
export const MOBILE_ENTRY_STORAGE_FIELDS = [
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
  'vehicleImgUrl',
  'dwellingCondition',
  'liveProvince',
  'liveCity',
  'liveDistrict',
  'liveDetailedAddress',
  'maritalStatus',
  'monthlyIncome',
  'childrenNum',
  'education',
  'degree',
  'occupation',
  'companyName',
  'workingProvince',
  'workingCity',
  'workingDistrict',
  'workingDetailedAddress',
  'workingTelephone'
]
export const MOBILE_ENTRY_STORAGE_ERROR =
  '移动端进件字段尚未初始化，请执行 admin-api Prisma 迁移并重新启动服务'
// ==================== Interfaces ====================
export interface MobileUploadResult {
  url: string
  fileUrl: string
  previewUrl: string
  fileName: string
  objectKey: string
  fileKey: string
  mimeType: string
  fileExt: string
  fileSize: number
  storageType: string
  uploadedBy: number
}
// ==================== Pure Mapping Functions ====================
export function mapGender(gender?: number) {
  if (gender === 1) return Gender.MALE
  if (gender === 2) return Gender.FEMALE
  return Gender.UNKNOWN
}
export function parseBirthDate(idCard?: string) {
  if (!idCard || idCard.length < 14) return undefined
  const text = `${idCard.slice(6, 10)}-${idCard.slice(10, 12)}-${idCard.slice(12, 14)}`
  return parseDate(text)
}
export function parseDate(value?: string) {
  if (!value) return undefined
  const normalized = value.replace(/[./]/g, '-')
  const date = new Date(normalized)
  return Number.isNaN(date.getTime()) ? undefined : date
}
export function formatDateOnly(value?: Date | string | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}
export function formatDateTime(value?: Date | string | null) {
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
export function centToYuan(value?: number) {
  if (!hasValue(value)) return undefined
  return Number(value) / 100
}
export function yuanToCent(value?: Prisma.Decimal | number | null) {
  if (!hasValue(value)) return undefined
  return Math.round(Number(value) * 100)
}
export function mapCreditStatus(status: ApplicationStatus) {
  if (SUCCESS_CREDIT_STATUSES.has(status)) return 1
  if (FAILED_CREDIT_STATUSES.has(status)) return 2
  if (status === ApplicationStatus.PENDING_SUPPLEMENT) return 3
  return 4
}
export function mapBusinessNode(status: ApplicationStatus) {
  if (status === ApplicationStatus.PENDING_SUPPLEMENT) return 'SUPPLEMENT_MATERIALS'
  if (SIGN_STATUSES.has(status)) return 'SIGN_CONTRACT'
  if (DISBURSEMENT_STATUSES.has(status)) return 'LOAN_DISBURSEMENT'
  if (PRE_AUDIT_STATUSES.has(status)) return 'PRE_AUDIT'
  return 'INITIAL_AUDIT'
}
export function statusFromBusinessNode(node: string) {
  const map: Record<string, ApplicationStatus> = {
    INITIAL_AUDIT: ApplicationStatus.SUBMITTED,
    PRE_AUDIT: ApplicationStatus.PENDING_RISK_PRE,
    SUPPLEMENT_MATERIALS: ApplicationStatus.PENDING_SUPPLEMENT,
    SIGN_CONTRACT: ApplicationStatus.PENDING_SIGN,
    LOAN_DISBURSEMENT: ApplicationStatus.PENDING_DISBURSEMENT
  }
  return map[node]
}
// ==================== File Helpers ====================
export function mimeToExtension(mimeType: string) {
  const map: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/bmp': '.bmp'
  }
  return map[mimeType] || '.jpg'
}
export function decodeOriginalName(fileName: string) {
  try {
    return Buffer.from(fileName, 'latin1').toString('utf8')
  } catch {
    return fileName
  }
}
export function fileNameFromReference(reference: string) {
  return reference.split('?')[0].split('/').filter(Boolean).pop() || 'upload'
}
export function extFromFileName(fileName: string) {
  const ext = fileName.split('.').pop()
  return ext && ext !== fileName ? ext : undefined
}
export function resolveCategoryName(fileType: string) {
  const map: Record<string, string> = {
    ID_CARD_FRONT: '身份证人像面',
    ID_CARD_BACK: '身份证国徽面',
    VEHICLE_LICENSE: '行驶证',
    IMAGE: '图片'
  }
  return map[fileType] || fileType
}
export function normalizeFileReference(reference: string, apiPrefix: string) {
  if (!reference) return { url: '', objectKey: undefined }
  const url = normalizeFileUrl(reference, apiPrefix)
  return {
    url,
    objectKey: resolveObjectKeyFromFileUrl(reference, apiPrefix)
  }
}
export function toFileUrl(reference: string | null | undefined, apiPrefix: string) {
  if (!reference) return ''
  return normalizeFileReference(reference, apiPrefix).url
}
export function mapFileAsset(file: Record<string, unknown>, apiPrefix: string) {
  const fileUrl = normalizeFileUrl(file.fileUrl as string | null | undefined, apiPrefix)
  return {
    ...file,
    url: fileUrl,
    fileUrl,
    previewUrl: fileUrl,
    objectKey: file.objectKey,
    fileKey: file.objectKey,
    fileType: file.categoryCode,
    fileCode: file.categoryCode,
    name: file.fileName
  }
}
export function mapCustomer(customer: Record<string, unknown>, apiPrefix: string) {
  const liveAddress = [customer.liveProvince, customer.liveCity, customer.liveDistrict]
    .filter(Boolean)
    .join('/')
  const workingAddress = [customer.workingProvince, customer.workingCity, customer.workingDistrict]
    .filter(Boolean)
    .join('/')
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
    idcardFront: toFileUrl(customer.idCardFront, apiPrefix),
    idcardBack: toFileUrl(customer.idCardBack, apiPrefix),
    updateTime: formatDateTime(customer.updatedAt),
    dwellingCondition: customer.dwellingCondition,
    liveAddress,
    liveDetailedAddress: customer.liveDetailedAddress,
    marriage: customer.maritalStatus,
    personIncome: customer.monthlyIncome ? Number(customer.monthlyIncome) : undefined,
    childrenNum: customer.childrenNum,
    education: customer.education,
    degree: customer.degree,
    personOccupation: customer.occupation,
    workingName: customer.companyName,
    workingAddress,
    workingDetailedAddress: customer.workingDetailedAddress,
    workingTelephone: customer.workingTelephone
  }
}
export function mapVehicle(vehicle: Record<string, unknown>, uuid: string, apiPrefix: string) {
  return {
    id: vehicle.id,
    uuid,
    vehicleImgUrl: toFileUrl(vehicle.vehicleImgUrl, apiPrefix),
    plateNumber: vehicle.plateNumber,
    vehicleBrand: vehicle.brand,
    vehicleModel: vehicle.model,
    vehicleOwner: vehicle.ownerName,
    address: vehicle.address,
    usageNature: vehicle.usageNature,
    sealInfo: vehicle.sealInfo,
    engineNumber: vehicle.engineNumber,
    registerDate: formatDateOnly(vehicle.registerDate),
    vehicleCode: vehicle.vin,
    mileage: vehicle.mileage,
    purchasePrice: yuanToCent(vehicle.purchasePrice),
    valuationPrice: yuanToCent(vehicle.estimateValue),
    vehicleColor: vehicle.color,
    isMortgage: vehicle.isMortgaged ? 1 : 2,
    fuelType: vehicle.fuelType,
    isFault: vehicle.isFault,
    purchaseType: vehicle.purchaseType,
    purchaseDate: formatDateOnly(vehicle.purchaseDate),
    loanAmount: yuanToCent(vehicle.loanAmount),
    loanTerm: vehicle.loanTerm,
    monthlyPayment: yuanToCent(vehicle.monthlyPayment),
    isInsurance: vehicle.isInsurance,
    insuranceExpirationDate: formatDateOnly(vehicle.insuranceExpirationDate)
  }
}
export function mapApplication(application: Record<string, unknown>, apiPrefix: string, includeDetail = false) {
  const customer = application.customer
  const vehicle = customer?.vehicles?.[0] || customer?.vehicles?.at?.(0)
  const approvals = Array.isArray(application.approvals) ? application.approvals : []
  const latestApproval = approvals.find((item: Record<string, unknown>) => item?.opinion)
  return {
    id: application.id,
    uuid: customer ? String(customer.id) : String(application.customerId),
    creditOrderId: application.applicationNo,
    name: customer?.name || '',
    phone: customer?.phone || '',
    status: mapCreditStatus(application.status),
    businessNode: mapBusinessNode(application.status),
    productName: application.product?.name,
    productId: application.productId,
    executeRate: application.rate ? Number(application.rate) : undefined,
    repaymentMethod: application.repaymentMethod,
    periods: application.term,
    pushQuota: Number(application.amount).toFixed(2),
    passQuota: application.approvedAmount
      ? Number(application.approvedAmount).toFixed(2)
      : undefined,
    validAmt: application.approvedAmount
      ? Number(application.approvedAmount).toFixed(2)
      : undefined,
    currentNode: application.currentNode,
    currentStatus: application.currentStatus,
    remark: application.remark,
    supplementReason: application.supplementReason,
    supplementDeadline: application.supplementDeadline,
    isSupplementCustomer: application.isSupplementCustomer || 0,
    isSupplementVehicle: application.isSupplementVehicle || 0,
    isSupplementOrder: application.isSupplementOrder || 0,
    isSupplementFile: application.isSupplementFile || 0,
    approvalRemark: latestApproval?.opinion,
    approvals: includeDetail
      ? approvals.map((item: Record<string, unknown>) => ({
          id: item.id,
          stage: item.stage,
          action: item.action,
          opinion: item.opinion,
          createdAt: formatDateTime(item.createdAt)
        }))
      : undefined,
    createTime: formatDateTime(application.createdAt),
    updateTime: formatDateTime(application.updatedAt),
    ...(includeDetail
      ? {
          vehicle: vehicle ? mapVehicle(vehicle, String(customer.id), apiPrefix) : undefined,
          customer: customer ? mapCustomer(customer, apiPrefix) : undefined
        }
      : {})
  }
}
// ==================== Error Guards ====================
export function guardMobileEntryStorage<T>(action: () => Promise<T>) {
  try {
    return action()
  } catch (error) {
    if (isMissingMobileEntryStorage(error)) {
      throw new BadRequestException(MOBILE_ENTRY_STORAGE_ERROR)
    }
    throw error
  }
}
export async function guardMobileEntryStorageAsync<T>(action: () => Promise<T>) {
  try {
    return await action()
  } catch (error) {
    if (isMissingMobileEntryStorage(error)) {
      const { BadRequestException } = await import('@nestjs/common')
      throw new BadRequestException(MOBILE_ENTRY_STORAGE_ERROR)
    }
    throw error
  }
}
export function isMissingMobileEntryStorage(error: unknown) {
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
export function isMissingFileAssetStorage(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === 'P2021' || error.code === 'P2022'
  }
  const message = error instanceof Error ? error.message : ''
  return message.includes('FileAsset') || message.includes('fileAsset')
}