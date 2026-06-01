import { BadRequestException, Injectable } from '@nestjs/common'
import { ApplicationStatus, ApprovalAction, DisbursementStatus, LeadStatus, RepaymentStatus, SignStatus } from '@prisma/client'
import { BaseBusinessCrudService, omitNested } from '../base-business-crud.service'
import { getCurrentTenantId } from '../../common/tenant/tenant-context'
import { PrismaService } from '../prisma/prisma.service'
import { CreateApplicationDto, UpdateApplicationDto, ApplicationQueryDto } from './dto/application.dto'
import {
  ApprovalActionDto,
  CompleteSigningDto,
  ConfirmDisbursementDto,
  FunderReviewDto,
  GpsInstalledDto,
  MortgageDoneDto,
  PrecheckActionDto,
  RegisterRepaymentDto,
  RequestDisbursementDto,
  SettleApplicationDto,
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
      include: {
        org: true,
        customer: true,
        product: true,
        funder: true,
        creator: { select: { id: true, userName: true, nickName: true } }
      },
      detailInclude: {
        org: true,
        customer: true,
        product: true,
        funder: true,
        creator: { select: { id: true, userName: true, nickName: true } },
        files: true,
        approvals: true,
        signRecord: true,
        disbursement: true,
        repayments: true
      },
      validateCreate: async (dto) => {
        await this.prepareCreateRelations(dto)
        await this.ensureRelatedExists(this.prisma.user, dto.creatorId, '创建人不存在')
      },
      validateUpdate: async (id, dto) => {
        await this.prepareUpdateRelations(id, dto)
        await this.ensureRelatedExists(this.prisma.user, dto.creatorId, '创建人不存在')
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
    return this.prisma.application.update({ where: { id }, data: { status: ApplicationStatus.SUBMITTED } })
  }

  async precheckPass(id: number, dto: PrecheckActionDto) {
    const application = await this.ensureExists(id)
    this.assertStatus(application.status, [ApplicationStatus.SUBMITTED], '当前状态不允许预审通过')
    await this.ensureRelatedExists(this.prisma.user, dto.reviewerId, '预审人不存在')
    return this.prisma.application.update({ where: { id }, data: { status: ApplicationStatus.PENDING_FIRST_REVIEW } })
  }

  async approve(id: number, dto: ApprovalActionDto) {
    await this.ensureRelatedExists(this.prisma.user, dto.approverId, '审批人不存在')
    const application = await this.ensureExists(id)
    this.assertStatus(
      application.status,
      [ApplicationStatus.PENDING_FIRST_REVIEW, ApplicationStatus.PENDING_FINAL_REVIEW],
      '当前状态不允许审批通过'
    )
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
    this.assertStatus(
      application.status,
      [ApplicationStatus.SUBMITTED, ApplicationStatus.PENDING_FIRST_REVIEW, ApplicationStatus.PENDING_FINAL_REVIEW, ApplicationStatus.PENDING_FUNDER_REVIEW],
      '当前状态不允许审批驳回'
    )
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
    const application = await this.ensureExists(id)
    this.assertStatus(
      application.status,
      [ApplicationStatus.SUBMITTED, ApplicationStatus.PENDING_FIRST_REVIEW, ApplicationStatus.PENDING_FINAL_REVIEW, ApplicationStatus.PENDING_FUNDER_REVIEW],
      '当前状态不允许要求补件'
    )
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

  async submitFunderReview(id: number) {
    const application = await this.ensureExists(id)
    this.assertStatus(application.status, [ApplicationStatus.FINAL_REVIEW_PASSED], '当前状态不允许提交资方审批')
    if (!application.funderId) throw new BadRequestException('未选择资方，不能提交资方审批')
    return this.prisma.application.update({ where: { id }, data: { status: ApplicationStatus.PENDING_FUNDER_REVIEW } })
  }

  async funderPass(id: number, dto: FunderReviewDto) {
    await this.ensureRelatedExists(this.prisma.user, dto.approverId, '审批人不存在')
    const application = await this.ensureExists(id)
    this.assertStatus(application.status, [ApplicationStatus.PENDING_FUNDER_REVIEW], '当前状态不允许资方审批通过')
    return this.prisma.$transaction(async (tx: any) => {
      await tx.approvalRecord.create({
        data: {
          applicationId: id,
          approverId: dto.approverId,
          stage: 'FUNDER_REVIEW',
          action: ApprovalAction.PASS,
          opinion: dto.opinion || dto.funderApprovalNo,
          amount: dto.amount,
          term: dto.term,
          rate: dto.rate
        }
      })
      return tx.application.update({
        where: { id },
        data: {
          status: ApplicationStatus.FUNDER_REVIEW_PASSED,
          approvedAmount: dto.amount ?? application.approvedAmount,
          approvedTerm: dto.term ?? application.approvedTerm,
          approvedRate: dto.rate ?? application.approvedRate
        }
      })
    })
  }

  async funderReject(id: number, dto: FunderReviewDto) {
    await this.ensureRelatedExists(this.prisma.user, dto.approverId, '审批人不存在')
    const application = await this.ensureExists(id)
    this.assertStatus(application.status, [ApplicationStatus.PENDING_FUNDER_REVIEW], '当前状态不允许资方审批拒绝')
    return this.prisma.$transaction(async (tx: any) => {
      await tx.approvalRecord.create({
        data: {
          applicationId: id,
          approverId: dto.approverId,
          stage: 'FUNDER_REVIEW',
          action: ApprovalAction.REJECT,
          opinion: dto.opinion || dto.funderApprovalNo,
          amount: dto.amount,
          term: dto.term,
          rate: dto.rate
        }
      })
      return tx.application.update({ where: { id }, data: { status: ApplicationStatus.FUNDER_REVIEW_REJECTED } })
    })
  }

  async startSigning(id: number, dto: StartSigningDto) {
    const application = await this.ensureExists(id)
    this.assertStatus(
      application.status,
      [ApplicationStatus.FINAL_REVIEW_PASSED, ApplicationStatus.FUNDER_REVIEW_PASSED],
      '当前状态不允许发起签约'
    )
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
    const application = await this.ensureExists(id)
    this.assertStatus(application.status, [ApplicationStatus.PENDING_SIGN], '当前状态不允许完成签约')
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
    const application = await this.ensureExists(id)
    this.assertStatus(application.status, [ApplicationStatus.PENDING_DISBURSEMENT], '当前状态不允许登记GPS安装')
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
    const application = await this.ensureExists(id)
    this.assertStatus(application.status, [ApplicationStatus.PENDING_DISBURSEMENT], '当前状态不允许登记抵押')
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

  async requestDisbursement(id: number, dto: RequestDisbursementDto) {
    const application = await this.ensureExists(id)
    this.assertStatus(application.status, [ApplicationStatus.PENDING_DISBURSEMENT], '当前状态不允许出账申请')
    const disbursement = await this.prisma.disbursement.findUnique({ where: { applicationId: id } })
    if (disbursement?.status !== DisbursementStatus.MORTGAGE_DONE) {
      throw new BadRequestException('请先完成GPS安装和抵押办理')
    }
    return this.prisma.disbursement.update({
      where: { applicationId: id },
      data: { status: DisbursementStatus.PENDING_APPROVAL, remark: dto.remark }
    })
  }

  async confirmDisbursement(id: number, dto: ConfirmDisbursementDto) {
    const application = await this.ensureExists(id)
    this.assertStatus(application.status, [ApplicationStatus.PENDING_DISBURSEMENT], '当前状态不允许放款确认')
    const disbursement = await this.prisma.disbursement.findUnique({ where: { applicationId: id } })
    if (disbursement?.status !== DisbursementStatus.PENDING_APPROVAL) {
      throw new BadRequestException('请先提交出账申请')
    }
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
      await this.createRepaymentPlansIfNeeded(tx, application, dto)
      if (application.sourceLeadId) {
        await tx.lead.update({ where: { id: application.sourceLeadId }, data: { status: LeadStatus.CONVERTED } })
      }
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

  async settle(id: number, dto: SettleApplicationDto) {
    const application = await this.ensureExists(id)
    this.assertStatus(application.status, [ApplicationStatus.DISBURSED], '当前状态不允许结清')
    const unpaid = await this.prisma.repaymentPlan.count({
      where: {
        applicationId: id,
        status: { notIn: [RepaymentStatus.PAID, RepaymentStatus.SETTLED] }
      }
    })
    if (unpaid > 0) throw new BadRequestException('仍有未结清还款计划')
    await this.prisma.repaymentPlan.updateMany({
      where: { applicationId: id },
      data: { status: RepaymentStatus.SETTLED }
    })
    return this.prisma.application.update({ where: { id }, data: { status: ApplicationStatus.CANCELLED, remark: dto.remark ?? application.remark } })
  }

  async convertLeadToApplication(id: number) {
    const application = await this.prisma.application.findUnique({ where: { id } })
    if (!application?.sourceLeadId) return application
    await this.prisma.lead.update({ where: { id: application.sourceLeadId }, data: { status: LeadStatus.CONVERTED } })
    return application
  }

  private async prepareCreateRelations(dto: CreateApplicationDto) {
    const customer = await this.getScopedRelated(this.prisma.customer, dto.customerId, '客户不存在')
    const orgId = dto.orgId ?? customer.orgId
    if (!orgId) throw new BadRequestException('无法根据客户自动识别机构')
    if (customer.orgId !== orgId) throw new BadRequestException('客户不属于所选机构')

    await this.ensureOrgExists(orgId)
    await this.assertSameOrg(this.prisma.product, dto.productId, orgId, '产品不存在', '产品不属于客户所属机构')
    await this.assertSameOrg(this.prisma.funder, dto.funderId, orgId, '资方不存在', '资方不属于客户所属机构')
    await this.assertSameOrg(this.prisma.lead, dto.sourceLeadId, orgId, '来源线索不存在', '来源线索不属于客户所属机构')

    dto.orgId = orgId
  }

  private async prepareUpdateRelations(id: number, dto: UpdateApplicationDto) {
    const current = await this.ensureExists(id)
    let orgId = dto.orgId ?? current.orgId

    if (dto.customerId) {
      const customer = await this.getScopedRelated(this.prisma.customer, dto.customerId, '客户不存在')
      orgId = dto.orgId ?? customer.orgId
      if (customer.orgId !== orgId) throw new BadRequestException('客户不属于所选机构')
      dto.orgId = orgId
    }

    await this.ensureOrgExists(orgId)
    await this.assertSameOrg(this.prisma.product, dto.productId, orgId, '产品不存在', '产品不属于进件所属机构')
    await this.assertSameOrg(this.prisma.funder, dto.funderId, orgId, '资方不存在', '资方不属于进件所属机构')
    await this.assertSameOrg(this.prisma.lead, dto.sourceLeadId, orgId, '来源线索不存在', '来源线索不属于进件所属机构')
  }

  private async ensureOrgExists(orgId: number) {
    await this.getScopedRelated(this.prisma.organization, orgId, '机构不存在')
  }

  private async assertSameOrg(model: any, id: number | undefined, orgId: number, notFoundMessage: string, mismatchMessage: string) {
    if (id === undefined || id === null) return
    const item = await this.getScopedRelated(model, id, notFoundMessage)
    if (item.orgId !== orgId) throw new BadRequestException(mismatchMessage)
  }

  private async getScopedRelated(model: any, id: number | undefined, message: string) {
    if (id === undefined || id === null) throw new BadRequestException(message)
    const tenantId = getCurrentTenantId()
    const where = tenantId ? { id, tenantId } : { id }
    const item = await model.findFirst({ where })
    if (!item) throw new BadRequestException(message)
    return item
  }

  private resolveApprovalStage(status: ApplicationStatus) {
    if (status === ApplicationStatus.SUBMITTED || status === ApplicationStatus.PENDING_FIRST_REVIEW) return 'FIRST_REVIEW'
    if (status === ApplicationStatus.PENDING_FUNDER_REVIEW) return 'FUNDER_REVIEW'
    return 'FINAL_REVIEW'
  }

  private resolvePassStatus(status: ApplicationStatus) {
    if (status === ApplicationStatus.SUBMITTED || status === ApplicationStatus.PENDING_FIRST_REVIEW) return ApplicationStatus.PENDING_FINAL_REVIEW
    return ApplicationStatus.FINAL_REVIEW_PASSED
  }

  private resolveRejectStatus(status: ApplicationStatus) {
    if (status === ApplicationStatus.SUBMITTED || status === ApplicationStatus.PENDING_FIRST_REVIEW) return ApplicationStatus.FIRST_REVIEW_REJECTED
    if (status === ApplicationStatus.PENDING_FUNDER_REVIEW) return ApplicationStatus.FUNDER_REVIEW_REJECTED
    return ApplicationStatus.FINAL_REVIEW_REJECTED
  }

  private assertStatus(current: ApplicationStatus, allowed: ApplicationStatus[], message: string) {
    if (!allowed.includes(current)) throw new BadRequestException(message)
  }

  private async createRepaymentPlansIfNeeded(tx: any, application: any, dto: ConfirmDisbursementDto) {
    const existed = await tx.repaymentPlan.count({ where: { applicationId: application.id } })
    if (existed > 0) return

    const term = Number(application.approvedTerm ?? application.term)
    const amount = Number(dto.disburseAmount)
    const annualRate = Number(application.approvedRate ?? application.rate)
    const monthlyRate = annualRate / 12
    const monthlyPrincipal = amount / term
    const baseDueDate = dto.firstDueDate ? new Date(dto.firstDueDate) : new Date(dto.disburseAt || new Date())
    if (!dto.firstDueDate) baseDueDate.setMonth(baseDueDate.getMonth() + 1)

    const plans = Array.from({ length: term }, (_, index) => {
      const dueDate = new Date(baseDueDate)
      dueDate.setMonth(baseDueDate.getMonth() + index)
      const principal = index === term - 1
        ? amount - Number(monthlyPrincipal.toFixed(2)) * (term - 1)
        : Number(monthlyPrincipal.toFixed(2))
      const interest = Number((amount * monthlyRate).toFixed(2))
      return {
        applicationId: application.id,
        period: index + 1,
        dueDate,
        principal,
        interest,
        totalAmount: Number((principal + interest).toFixed(2)),
        status: RepaymentStatus.NOT_DUE
      }
    })

    await tx.repaymentPlan.createMany({ data: plans })
  }
}
