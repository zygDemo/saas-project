import { BadRequestException, Injectable } from '@nestjs/common'
import { ApplicationStatus, ApprovalAction, DisbursementStatus, LeadStatus, RepaymentStatus, SignStatus } from '@prisma/client'
import { BaseBusinessCrudService, omitNested } from '../base-business-crud.service'
import { PrismaService } from '../prisma/prisma.service'
import { CreateApplicationDto, UpdateApplicationDto, ApplicationQueryDto } from './dto/application.dto'
import {
  ApprovalActionDto,
  CompleteSigningDto,
  ConfirmDisbursementDto,
  GpsInstalledDto,
  MortgageDoneDto,
  RegisterRepaymentDto,
  StartSigningDto,
  SupplementActionDto
} from './dto/business-action.dto'

function generateApplicationNo() {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const hh = String(now.getHours()).padStart(2, '0')
  const mi = String(now.getMinutes()).padStart(2, '0')
  const ss = String(now.getSeconds()).padStart(2, '0')
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `APP${yyyy}${mm}${dd}${hh}${mi}${ss}${rand}`
}

@Injectable()
export class ApplicationService extends BaseBusinessCrudService<CreateApplicationDto, UpdateApplicationDto, ApplicationQueryDto> {
  constructor(private readonly prisma: PrismaService) {
    super({
      model: prisma.application,
      prisma,
      searchableFields: ['applicationNo'],
      exactFields: ['orgId', 'status', 'customerId', 'creatorId'],
      include: { org: true, customer: true, product: true, funder: true, creator: true },
      detailInclude: {
        org: true,
        customer: true,
        product: true,
        funder: true,
        creator: true,
        files: true,
        approvals: true,
        signRecord: true,
        disbursement: true,
        repayments: true
      },
      validateCreate: async (dto) => {
        await this.ensureRelatedExists(this.prisma.organization, dto.orgId, '机构不存在')
        await this.ensureRelatedExists(this.prisma.customer, dto.customerId, '客户不存在')
        await this.ensureRelatedExists(this.prisma.product, dto.productId, '产品不存在')
        await this.ensureRelatedExists(this.prisma.funder, dto.funderId, '资方不存在')
        await this.ensureRelatedExists(this.prisma.user, dto.creatorId, '创建人不存在')
        await this.ensureRelatedExists(this.prisma.lead, dto.sourceLeadId, '来源线索不存在')
      },
      validateUpdate: async (_id, dto) => {
        await this.ensureRelatedExists(this.prisma.organization, dto.orgId, '机构不存在')
        await this.ensureRelatedExists(this.prisma.customer, dto.customerId, '客户不存在')
        await this.ensureRelatedExists(this.prisma.product, dto.productId, '产品不存在')
        await this.ensureRelatedExists(this.prisma.funder, dto.funderId, '资方不存在')
        await this.ensureRelatedExists(this.prisma.user, dto.creatorId, '创建人不存在')
        await this.ensureRelatedExists(this.prisma.lead, dto.sourceLeadId, '来源线索不存在')
      },
      beforeCreate: (dto) => {
        const data = omitNested(dto as unknown as Record<string, unknown>, ['files'])
        data.applicationNo = dto.applicationNo || generateApplicationNo()
        data.status = dto.status || ApplicationStatus.DRAFT
        if (dto.files?.length) {
          data.files = { create: dto.files }
        }
        return data
      },
      beforeUpdate: (dto) => omitNested(dto as unknown as Record<string, unknown>, ['files'])
    })
  }

  async submit(id: number) {
    const application = await this.ensureExists(id)
    if (![ApplicationStatus.DRAFT, ApplicationStatus.PENDING_SUPPLEMENT].includes(application.status)) {
      throw new BadRequestException('当前状态不允许提交')
    }
    const nextStatus = application.status === ApplicationStatus.PENDING_SUPPLEMENT
      ? ApplicationStatus.PENDING_FINAL_REVIEW
      : ApplicationStatus.PENDING_FIRST_REVIEW
    return this.prisma.application.update({ where: { id }, data: { status: nextStatus } })
  }

  async approve(id: number, dto: ApprovalActionDto) {
    await this.ensureRelatedExists(this.prisma.user, dto.approverId, '审批人不存在')
    const application = await this.ensureExists(id)
    const nextStatus = this.resolvePassStatus(application.status)
    return this.prisma.$transaction(async (tx: any) => {
      await tx.approvalRecord.create({
        data: {
          applicationId: id,
          approverId: dto.approverId,
          stage: dto.stage || this.resolveApprovalStage(application.status),
          action: ApprovalAction.PASS,
          opinion: dto.opinion,
          amount: dto.amount,
          term: dto.term,
          rate: dto.rate
        }
      })
      return tx.application.update({
        where: { id },
        data: {
          status: nextStatus,
          approvedAmount: dto.amount ?? application.approvedAmount,
          approvedTerm: dto.term ?? application.approvedTerm,
          approvedRate: dto.rate ?? application.approvedRate
        }
      })
    })
  }

  async reject(id: number, dto: ApprovalActionDto) {
    await this.ensureRelatedExists(this.prisma.user, dto.approverId, '审批人不存在')
    const application = await this.ensureExists(id)
    const nextStatus = this.resolveRejectStatus(application.status)
    return this.prisma.$transaction(async (tx: any) => {
      await tx.approvalRecord.create({
        data: {
          applicationId: id,
          approverId: dto.approverId,
          stage: dto.stage || this.resolveApprovalStage(application.status),
          action: ApprovalAction.REJECT,
          opinion: dto.opinion,
          amount: dto.amount,
          term: dto.term,
          rate: dto.rate
        }
      })
      return tx.application.update({ where: { id }, data: { status: nextStatus } })
    })
  }

  async requestSupplement(id: number, dto: SupplementActionDto) {
    await this.ensureRelatedExists(this.prisma.user, dto.approverId, '审批人不存在')
    await this.ensureExists(id)
    return this.prisma.$transaction(async (tx: any) => {
      await tx.approvalRecord.create({
        data: {
          applicationId: id,
          approverId: dto.approverId,
          stage: dto.stage || 'SUPPLEMENT',
          action: ApprovalAction.SUPPLEMENT,
          opinion: dto.reason
        }
      })
      return tx.application.update({
        where: { id },
        data: {
          status: ApplicationStatus.PENDING_SUPPLEMENT,
          supplementReason: dto.reason,
          supplementDeadline: dto.deadline ? new Date(dto.deadline) : undefined
        }
      })
    })
  }

  async startSigning(id: number, dto: StartSigningDto) {
    await this.ensureExists(id)
    return this.prisma.$transaction(async (tx: any) => {
      await tx.signRecord.upsert({
        where: { applicationId: id },
        update: { status: SignStatus.SENT, contractUrl: dto.contractUrl, expiredAt: dto.expiredAt },
        create: { applicationId: id, status: SignStatus.SENT, contractUrl: dto.contractUrl, expiredAt: dto.expiredAt }
      })
      return tx.application.update({ where: { id }, data: { status: ApplicationStatus.PENDING_SIGN } })
    })
  }

  async completeSigning(id: number, dto: CompleteSigningDto) {
    await this.ensureExists(id)
    return this.prisma.$transaction(async (tx: any) => {
      await tx.signRecord.upsert({
        where: { applicationId: id },
        update: {
          status: SignStatus.SIGNED,
          contractUrl: dto.contractUrl,
          videoUrl: dto.videoUrl,
          signedAt: dto.signedAt || new Date()
        },
        create: {
          applicationId: id,
          status: SignStatus.SIGNED,
          contractUrl: dto.contractUrl,
          videoUrl: dto.videoUrl,
          signedAt: dto.signedAt || new Date()
        }
      })
      await tx.disbursement.upsert({
        where: { applicationId: id },
        update: {},
        create: { applicationId: id, status: DisbursementStatus.PENDING_APPLICATION }
      })
      return tx.application.update({ where: { id }, data: { status: ApplicationStatus.PENDING_DISBURSEMENT } })
    })
  }

  async completeGpsInstall(id: number, dto: GpsInstalledDto) {
    await this.ensureExists(id)
    return this.prisma.disbursement.upsert({
      where: { applicationId: id },
      update: {
        status: DisbursementStatus.GPS_INSTALLED,
        gpsDeviceNo: dto.gpsDeviceNo,
        gpsInstallImg: dto.gpsInstallImg,
        gpsInstallAt: dto.gpsInstallAt || new Date()
      },
      create: {
        applicationId: id,
        status: DisbursementStatus.GPS_INSTALLED,
        gpsDeviceNo: dto.gpsDeviceNo,
        gpsInstallImg: dto.gpsInstallImg,
        gpsInstallAt: dto.gpsInstallAt || new Date()
      }
    })
  }

  async completeMortgage(id: number, dto: MortgageDoneDto) {
    await this.ensureExists(id)
    return this.prisma.disbursement.upsert({
      where: { applicationId: id },
      update: {
        status: DisbursementStatus.MORTGAGE_DONE,
        mortgageStatus: dto.mortgageStatus || 'DONE',
        mortgageImg: dto.mortgageImg,
        mortgageAt: dto.mortgageAt || new Date()
      },
      create: {
        applicationId: id,
        status: DisbursementStatus.MORTGAGE_DONE,
        mortgageStatus: dto.mortgageStatus || 'DONE',
        mortgageImg: dto.mortgageImg,
        mortgageAt: dto.mortgageAt || new Date()
      }
    })
  }

  async confirmDisbursement(id: number, dto: ConfirmDisbursementDto) {
    await this.ensureExists(id)
    return this.prisma.$transaction(async (tx: any) => {
      await tx.disbursement.upsert({
        where: { applicationId: id },
        update: {
          status: DisbursementStatus.DISBURSED,
          disburseAmount: dto.disburseAmount,
          disburseAccount: dto.disburseAccount,
          disburseAt: dto.disburseAt || new Date(),
          transactionNo: dto.transactionNo,
          voucherUrl: dto.voucherUrl,
          remark: dto.remark
        },
        create: {
          applicationId: id,
          status: DisbursementStatus.DISBURSED,
          disburseAmount: dto.disburseAmount,
          disburseAccount: dto.disburseAccount,
          disburseAt: dto.disburseAt || new Date(),
          transactionNo: dto.transactionNo,
          voucherUrl: dto.voucherUrl,
          remark: dto.remark
        }
      })
      return tx.application.update({ where: { id }, data: { status: ApplicationStatus.DISBURSED } })
    })
  }

  async registerRepayment(planId: number, dto: RegisterRepaymentDto) {
    await this.ensureRelatedExists(this.prisma.user, dto.createdBy, '登记人不存在')
    const plan = await this.prisma.repaymentPlan.findUnique({ where: { id: planId } })
    if (!plan) throw new BadRequestException('还款计划不存在')

    const principal = dto.principal ?? dto.amount
    const interest = dto.interest ?? 0
    const penalty = dto.penalty ?? 0
    const paidPrincipal = Number(plan.paidPrincipal) + principal
    const paidInterest = Number(plan.paidInterest) + interest
    const paidTotal = Number(plan.paidTotal) + dto.amount
    const totalDue = Number(plan.totalAmount) + Number(plan.penaltyAmount)
    const nextStatus = paidTotal >= totalDue ? RepaymentStatus.PAID : RepaymentStatus.PARTIAL

    return this.prisma.$transaction(async (tx: any) => {
      await tx.repaymentRecord.create({
        data: {
          planId,
          amount: dto.amount,
          principal,
          interest,
          penalty,
          paymentMethod: dto.paymentMethod,
          transactionNo: dto.transactionNo,
          voucherUrl: dto.voucherUrl,
          remark: dto.remark,
          createdBy: dto.createdBy
        }
      })
      return tx.repaymentPlan.update({
        where: { id: planId },
        data: {
          paidPrincipal,
          paidInterest,
          paidTotal,
          status: nextStatus,
          paidAt: nextStatus === RepaymentStatus.PAID ? new Date() : plan.paidAt
        },
        include: { records: true, application: true }
      })
    })
  }

  async convertLeadToApplication(id: number) {
    const application = await this.prisma.application.findUnique({ where: { id } })
    if (!application?.sourceLeadId) return application
    await this.prisma.lead.update({ where: { id: application.sourceLeadId }, data: { status: LeadStatus.CONVERTED } })
    return application
  }

  private resolveApprovalStage(status: ApplicationStatus) {
    if (status === ApplicationStatus.SUBMITTED || status === ApplicationStatus.PENDING_FIRST_REVIEW) return 'FIRST_REVIEW'
    if (status === ApplicationStatus.PENDING_FUNDER_REVIEW) return 'FUNDER_REVIEW'
    return 'FINAL_REVIEW'
  }

  private resolvePassStatus(status: ApplicationStatus) {
    if (status === ApplicationStatus.SUBMITTED || status === ApplicationStatus.PENDING_FIRST_REVIEW) return ApplicationStatus.PENDING_FINAL_REVIEW
    if (status === ApplicationStatus.PENDING_FUNDER_REVIEW) return ApplicationStatus.PENDING_SIGN
    return ApplicationStatus.FINAL_REVIEW_PASSED
  }

  private resolveRejectStatus(status: ApplicationStatus) {
    if (status === ApplicationStatus.SUBMITTED || status === ApplicationStatus.PENDING_FIRST_REVIEW) return ApplicationStatus.FIRST_REVIEW_REJECTED
    if (status === ApplicationStatus.PENDING_FUNDER_REVIEW) return ApplicationStatus.FUNDER_REVIEW_REJECTED
    return ApplicationStatus.FINAL_REVIEW_REJECTED
  }
}
