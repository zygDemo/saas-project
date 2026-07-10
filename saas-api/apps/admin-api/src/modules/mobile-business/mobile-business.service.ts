import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../prisma/prisma.service'
import { OcrService } from '../ocr/ocr.service'
import { RequestUser } from '../../common/types/request-user'
import { OcrObjectKeyDto } from '../ocr/dto/ocr.dto'
import { UploadedImageFile } from '../file/file.service'
import {
  MobileCreditApplyDto,
  MobileCreditListQueryDto,
  MobileCreditUpdateDto,
  MobileCustomerExtraDto,
  MobileIdCardInfoDto,
  MobileUserListQueryDto,
  MobileVehicleInfoDto,
  MobileContactDto,
  MobileSalesLeadDto,
  MobileFollowUpDto,
  MobileSigningStartDto
} from './dto/mobile-business.dto'
import {  } from './mobile-business.utils'
import { MobileFileService } from './mobile-file.service'
import { MobileCustomerService } from './mobile-customer.service'
import { MobileVehicleService } from './mobile-vehicle.service'
import { MobileCreditService } from './mobile-credit.service'
import { MobileContactService } from './mobile-contact.service'
import { MobileLeadService } from './mobile-lead.service'
import { MobileSigningService } from './mobile-signing.service'
import { MobileBankCardService } from './mobile-bank-card.service'
import { MobilePostLoanService } from './mobile-post-loan.service'

/**
 * Thin facade delegating to focused sub-services.
 * Kept for backward compatibility — any external code importing
 * MobileBusinessService continues to work unchanged.
 */
@Injectable()
export class MobileBusinessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly ocrService: OcrService,
    private readonly fileService: MobileFileService,
    private readonly customerService: MobileCustomerService,
    private readonly vehicleService: MobileVehicleService,
    private readonly creditService: MobileCreditService,
    private readonly contactService: MobileContactService,
    private readonly leadService: MobileLeadService,
    private readonly signingService: MobileSigningService,
    private readonly bankCardService: MobileBankCardService,
    private readonly postLoanService: MobilePostLoanService
  ) {}

  // ==================== File ====================
  upload(file: UploadedImageFile | undefined, user: RequestUser, headerOrgId?: number) {
    return this.fileService.upload(file, user, headerOrgId)
  }
  uploadWithType(file: UploadedImageFile | undefined, body: Record<string, string>, user: RequestUser, headerOrgId?: number) {
    return this.fileService.uploadWithType(file, body, user, headerOrgId)
  }
  getFileList(query: Record<string, string>, user: RequestUser) {
    return this.fileService.getFileList(query, user)
  }
  getFileListByType(query: Record<string, string>, user: RequestUser) {
    return this.fileService.getFileListByType(query, user)
  }
  deleteFile(id: number) {
    return this.fileService.deleteFile(id)
  }
  getProductFileList() {
    return this.fileService.getProductFileList()
  }

  // ==================== OCR ====================
  async getIdCardOcr(body: OcrObjectKeyDto = {}, file?: UploadedImageFile) {
    if (file) return this.ocrService.recognizeIdCard(file, body.side)
    return this.ocrService.recognizeIdCardByObjectKey(body)
  }
  async getVehicleOcr(body: OcrObjectKeyDto = {}, file?: UploadedImageFile) {
    if (file) return this.ocrService.recognizeVehicle(file)
    return this.ocrService.recognizeVehicleByObjectKey(body)
  }

  // ==================== Customer ====================
  addOrUpdateUserBasic(dto: MobileIdCardInfoDto & Partial<MobileCustomerExtraDto>, user: RequestUser, headerOrgId?: number) {
    return this.customerService.addOrUpdateUserBasic(dto, user, headerOrgId)
  }
  getUserBasic(uuid: string) {
    return this.customerService.getUserBasic(uuid)
  }
  getUserList(query: MobileUserListQueryDto) {
    return this.customerService.getUserList(query)
  }

  // ==================== Vehicle ====================
  addOrUpdateVehicle(dto: MobileVehicleInfoDto, user: RequestUser) {
    return this.vehicleService.addOrUpdateVehicle(dto, user)
  }
  getVehicleInfo(uuid: string) {
    return this.vehicleService.getVehicleInfo(uuid)
  }

  // ==================== Credit ====================
  creditApply(dto: MobileCreditApplyDto, user: RequestUser) {
    return this.creditService.creditApply(dto, user)
  }
  updateCredit(dto: MobileCreditUpdateDto) {
    return this.creditService.updateCredit(dto)
  }
  getCreditList(query: MobileCreditListQueryDto) {
    return this.creditService.getCreditList(query)
  }
  getCreditDetail(id: string | number) {
    return this.creditService.getCreditDetail(id)
  }
  getCreditDetailByOrderId(creditOrderId: string) {
    return this.creditService.getCreditDetailByOrderId(creditOrderId)
  }
  getLoanBusinessNodes() {
    return this.creditService.getLoanBusinessNodes()
  }
  getFlowConfigByNodeCode(nodeCode: string, businessType?: string) {
    return this.creditService.getFlowConfigByNodeCode(nodeCode, businessType)
  }
  getFlowSteps(nodeCode: string, businessType?: string) {
    return this.creditService.getFlowSteps(nodeCode, businessType)
  }
  getStatisticsOverview() {
    return this.creditService.getStatisticsOverview()
  }

  // ==================== Contact ====================
  addOrUpdateContact(dto: MobileContactDto) {
    return this.contactService.addOrUpdateContact(dto)
  }
  getContacts(userUuid: string) {
    return this.contactService.getContacts(userUuid)
  }
  deleteContact(id: number) {
    return this.contactService.deleteContact(id)
  }

  // ==================== Lead ====================
  addSalesLead(dto: MobileSalesLeadDto, user: RequestUser, headerOrgId?: number) {
    return this.leadService.addSalesLead(dto, user, headerOrgId)
  }
  addFollowUp(dto: MobileFollowUpDto, user: RequestUser) {
    return this.leadService.addFollowUp(dto, user)
  }
  getFollowUpList(uuid: string) {
    return this.leadService.getFollowUpList(uuid)
  }

  // ==================== Signing ====================
  startFaceSign(dto: MobileSigningStartDto) {
    return this.signingService.startFaceSign(dto)
  }
  startAuthContractSign(dto: MobileSigningStartDto) {
    return this.signingService.startAuthContractSign(dto)
  }
  startContractSign(dto: MobileSigningStartDto) {
    return this.signingService.startContractSign(dto)
  }
  getFaceSignDetail(creditOrderId: string) {
    return this.signingService.getFaceSignDetail(creditOrderId)
  }
  getAuthContractDetail(creditOrderId: string) {
    return this.signingService.getAuthContractDetail(creditOrderId)
  }
  getContractDetail(creditOrderId: string) {
    return this.signingService.getContractDetail(creditOrderId)
  }

  // ==================== Bank Card ====================
  getBankCards(customerId: number) {
    return this.bankCardService.getBankCards(customerId)
  }
  addBankCard(customerId: number, dto: { bankName: string; cardNo: string; cardType?: string; isDefault?: boolean }) {
    return this.bankCardService.addBankCard(customerId, dto)
  }
  deleteBankCard(id: number) {
    return this.bankCardService.deleteBankCard(id)
  }

  // ==================== Post Loan ====================
  confirmAmount(applicationId: number, dto: { approvedAmount: number; term?: number; rate?: number }) {
    return this.postLoanService.confirmAmount(applicationId, dto)
  }
  getRepaymentPlansMobile(applicationId: number) {
    return this.postLoanService.getRepaymentPlansMobile(applicationId)
  }
  applyEarlyRepaymentMobile(applicationId: number, dto: { repayType?: string; amount: number; principal: number; interest: number; penalty?: number; reason?: string }) {
    return this.postLoanService.applyEarlyRepaymentMobile(applicationId, dto)
  }
  getApplicationDetailMobile(id: number) {
    return this.postLoanService.getApplicationDetailMobile(id)
  }
}
