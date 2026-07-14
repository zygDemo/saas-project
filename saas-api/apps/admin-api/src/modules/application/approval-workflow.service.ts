import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { ApplicationStatus, ApprovalAction, Prisma } from '@prisma/client'
import type { Application } from '@prisma/client'
import { getCurrentTenantId } from '../../common/tenant/tenant-context'
import { PrismaService } from '../prisma/prisma.service'
import { NotificationService } from './notification.service'
import type { PrismaModelDelegate } from '../base-business-crud.service'

/**
 * 集中式状态转换表：定义每个操作允许的源状态与目标状态
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const TRANSITIONS = {
  SUBMIT: {
    from: [ApplicationStatus.DRAFT, ApplicationStatus.PENDING_SUPPLEMENT],
    to: ApplicationStatus.PENDING_RISK_PRE
  },
  RISK_PRE_PASS: {
    from: [ApplicationStatus.SUBMITTED, ApplicationStatus.PENDING_RISK_PRE],
    to: ApplicationStatus.PENDING_FUNDER_PRE
  },
  RISK_PRE_REJECT: {
    from: [ApplicationStatus.SUBMITTED, ApplicationStatus.PENDING_RISK_PRE],
    to: ApplicationStatus.RISK_PRE_REJECTED
  },
  RISK_PRE_RETURN: {
    from: [ApplicationStatus.SUBMITTED, ApplicationStatus.PENDING_RISK_PRE],
    to: ApplicationStatus.SUBMITTED
  },
  FUNDER_PRE_PASS: {
    from: [ApplicationStatus.PENDING_FUNDER_PRE],
    to: ApplicationStatus.PENDING_SUPPLEMENT
  },
  FUNDER_PRE_REJECT: {
    from: [ApplicationStatus.PENDING_FUNDER_PRE],
    to: ApplicationStatus.FUNDER_PRE_REJECTED
  },
  COMPLETE_SUPPLEMENT: {
    from: [ApplicationStatus.PENDING_SUPPLEMENT, ApplicationStatus.FUNDER_PRE_PASSED],
    to: ApplicationStatus.PENDING_FIRST_REVIEW
  },
  APPROVE_FIRST_REVIEW: {
    from: [ApplicationStatus.PENDING_FIRST_REVIEW],
    to: ApplicationStatus.PENDING_FINAL_REVIEW
  },
  APPROVE_FINAL_REVIEW: {
    from: [ApplicationStatus.PENDING_FINAL_REVIEW],
    to: ApplicationStatus.FINAL_REVIEW_PASSED
  },
  APPROVE_LOAN_REQUEST: {
    from: [ApplicationStatus.LOAN_REQUEST_REVIEWING],
    to: ApplicationStatus.LOAN_REQUEST_APPROVED
  },
  SUBMIT_FUNDER_REVIEW: {
    from: [ApplicationStatus.FINAL_REVIEW_PASSED],
    to: ApplicationStatus.PENDING_FUNDER_REVIEW
  },
  FUNDER_REVIEW_PASS: {
    from: [ApplicationStatus.PENDING_FUNDER_REVIEW],
    to: ApplicationStatus.FUNDER_REVIEW_PASSED
  },
  FUNDER_REVIEW_REJECT: {
    from: [ApplicationStatus.PENDING_FUNDER_REVIEW],
    to: ApplicationStatus.FUNDER_REVIEW_REJECTED
  },
  REJECT_LOAN_REQUEST: {
    from: [ApplicationStatus.LOAN_REQUEST_REVIEWING],
    to: ApplicationStatus.LOAN_REQUEST_REJECTED
  }
} as const

// ============ 流程状态映射工具函数 ============

function flowByApplicationStatus(status: ApplicationStatus) {
  const map: Record<ApplicationStatus, { currentNode: number; currentStatus: number }> = {
    [ApplicationStatus.DRAFT]: { currentNode: 1100, currentStatus: 10 },
    [ApplicationStatus.SUBMITTED]: { currentNode: 1100, currentStatus: 10 },
    [ApplicationStatus.PENDING_RISK_PRE]: { currentNode: 1200, currentStatus: 10 },
    [ApplicationStatus.RISK_PRE_PASSED]: { currentNode: 1250, currentStatus: 20 },
    [ApplicationStatus.RISK_PRE_REJECTED]: { currentNode: 1200, currentStatus: 30 },
    [ApplicationStatus.PENDING_FUNDER_PRE]: { currentNode: 1250, currentStatus: 10 },
    [ApplicationStatus.FUNDER_PRE_PASSED]: { currentNode: 1300, currentStatus: 20 },
    [ApplicationStatus.FUNDER_PRE_REJECTED]: { currentNode: 1250, currentStatus: 30 },
    [ApplicationStatus.PENDING_SUPPLEMENT]: { currentNode: 1300, currentStatus: 50 },
    [ApplicationStatus.PENDING_FIRST_REVIEW]: { currentNode: 1400, currentStatus: 10 },
    [ApplicationStatus.FIRST_REVIEW_PASSED]: { currentNode: 1450, currentStatus: 20 },
    [ApplicationStatus.FIRST_REVIEW_REJECTED]: { currentNode: 1400, currentStatus: 30 },
    [ApplicationStatus.PENDING_FINAL_REVIEW]: { currentNode: 1450, currentStatus: 10 },
    [ApplicationStatus.FINAL_REVIEW_PASSED]: { currentNode: 1500, currentStatus: 20 },
    [ApplicationStatus.FINAL_REVIEW_REJECTED]: { currentNode: 1450, currentStatus: 30 },
    [ApplicationStatus.PENDING_FUNDER_REVIEW]: { currentNode: 1500, currentStatus: 10 },
    [ApplicationStatus.FUNDER_REVIEW_PASSED]: { currentNode: 1600, currentStatus: 20 },
    [ApplicationStatus.FUNDER_REVIEW_REJECTED]: { currentNode: 1500, currentStatus: 30 },
    [ApplicationStatus.PENDING_SIGN]: { currentNode: 1600, currentStatus: 10 },
    [ApplicationStatus.SIGNING_PROGRESS]: { currentNode: 1600, currentStatus: 10 },
    [ApplicationStatus.SIGNED]: { currentNode: 1660, currentStatus: 20 },
    [ApplicationStatus.PENDING_LOAN_REQUEST]: { currentNode: 1700, currentStatus: 10 },
    [ApplicationStatus.LOAN_REQUEST_REVIEWING]: { currentNode: 1700, currentStatus: 10 },
    [ApplicationStatus.LOAN_REQUEST_APPROVED]: { currentNode: 1800, currentStatus: 20 },
    [ApplicationStatus.LOAN_REQUEST_REJECTED]: { currentNode: 1700, currentStatus: 30 },
    [ApplicationStatus.PENDING_DISBURSEMENT]: { currentNode: 1800, currentStatus: 10 },
    [ApplicationStatus.DISBURSED]: { currentNode: 1900, currentStatus: 90 },
    [ApplicationStatus.CANCELLED]: { currentNode: 0, currentStatus: 30 },
    [ApplicationStatus.SETTLED]: { currentNode: 1900, currentStatus: 90 }
  }
  return map[status]
}

export function flowPatch(status: ApplicationStatus) {
  return flowByApplicationStatus(status)
}

@Injectable()
export class ApprovalWorkflowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService
  ) {}

  // ==================== 状态校验工具方法 ====================

  /** 原子查询 + 状态校验，返回 application 对象 */
  async findAndAssertStatus(
    id: number,
    allowedStatuses: ApplicationStatus[],
    statusMessage: string
  ): Promise<Application> {
    const application = await this.prisma.application.findFirst({
      where: this.addTenantId({ id, status: { in: allowedStatuses } })
    })
    if (!application) {
      const exists = await this.prisma.application.findFirst({ where: this.addTenantId({ id }) })
      if (!exists) throw new NotFoundException('数据不存在')
      throw new BadRequestException(statusMessage)
    }
    return application
  }

  /** 添加租户过滤条件 */
  addTenantId(where: Record<string, unknown>): Record<string, unknown> {
    const tenantId = getCurrentTenantId()
    if (!tenantId) return where
    return { ...where, tenantId }
  }

  /** 确保关联数据存在 */
  async ensureRelatedExists(model: PrismaModelDelegate, id: number | undefined, message: string) {
    if (id === undefined || id === null) return
    const item = await model.findFirst({ where: { id } })
    if (!item) throw new BadRequestException(message)
    return item
  }

  // ==================== 审批阶段解析 ====================

  resolveApprovalStage(status: ApplicationStatus): string {
    if (status === ApplicationStatus.SUBMITTED || status === ApplicationStatus.PENDING_RISK_PRE) return 'RISK_PRE'
    if (status === ApplicationStatus.PENDING_FUNDER_PRE) return 'FUNDER_PRE'
    if (status === ApplicationStatus.PENDING_FIRST_REVIEW) return 'FIRST_REVIEW'
    if (status === ApplicationStatus.PENDING_FUNDER_REVIEW) return 'FUNDER_REVIEW'
    if (status === ApplicationStatus.LOAN_REQUEST_REVIEWING) return 'LOAN_REQUEST'
    return 'FINAL_REVIEW'
  }

  resolvePassStatus(status: ApplicationStatus): ApplicationStatus {
    if (status === ApplicationStatus.PENDING_FIRST_REVIEW) return ApplicationStatus.PENDING_FINAL_REVIEW
    if (status === ApplicationStatus.LOAN_REQUEST_REVIEWING) return ApplicationStatus.LOAN_REQUEST_APPROVED
    return ApplicationStatus.FINAL_REVIEW_PASSED
  }

  resolveRejectStatus(status: ApplicationStatus): ApplicationStatus {
    if (status === ApplicationStatus.SUBMITTED || status === ApplicationStatus.PENDING_RISK_PRE)
      return ApplicationStatus.RISK_PRE_REJECTED
    if (status === ApplicationStatus.PENDING_FUNDER_PRE)
      return ApplicationStatus.FUNDER_PRE_REJECTED
    if (status === ApplicationStatus.PENDING_FIRST_REVIEW)
      return ApplicationStatus.FIRST_REVIEW_REJECTED
    if (status === ApplicationStatus.PENDING_FUNDER_REVIEW)
      return ApplicationStatus.FUNDER_REVIEW_REJECTED
    if (status === ApplicationStatus.LOAN_REQUEST_REVIEWING)
      return ApplicationStatus.LOAN_REQUEST_REJECTED
    return ApplicationStatus.FINAL_REVIEW_REJECTED
  }

  // ==================== 原子状态流转（不含审批记录） ====================

  async atomicTransition(
    id: number,
    allowedStatuses: ApplicationStatus[],
    statusMessage: string,
    updateData: Record<string, unknown>
  ) {
    const tenantId = getCurrentTenantId()
    const where: Record<string, unknown> = { id, status: { in: allowedStatuses } }
    if (tenantId) where.tenantId = tenantId
    const application = await this.prisma.application.findFirst({ where })
    if (!application) {
      const exists = await this.prisma.application.findFirst({
        where: tenantId ? { id, tenantId } : { id }
      })
      if (!exists) throw new NotFoundException('数据不存在')
      throw new BadRequestException(statusMessage)
    }
    return this.prisma.application.update({ where: { id }, data: updateData })
  }

  // ==================== 通用审批流转事务 ====================

  async transitionWithApproval(
    id: number,
    allowedStatuses: ApplicationStatus[],
    statusMessage: string,
    approvalData: {
      approverId: number
      stage: string
      action: ApprovalAction
      opinion?: string
      amount?: number
      term?: number
      rate?: number
    },
    nextStatus: ApplicationStatus,
    extraUpdateData: Record<string, unknown> = {},
    preLoadedApplication?: unknown
  ) {
    if (!preLoadedApplication) await this.findAndAssertStatus(id, allowedStatuses, statusMessage)
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.approvalRecord.create({
        data: {
          tenantId: getCurrentTenantId()!,
          applicationId: id,
          approverId: approvalData.approverId,
          stage: approvalData.stage,
          action: approvalData.action,
          opinion: approvalData.opinion,
          amount: approvalData.amount,
          term: approvalData.term,
          rate: approvalData.rate
        }
      })
      const result = await tx.application.update({
        where: { id },
        data: {
          status: nextStatus,
          ...flowPatch(nextStatus),
          ...extraUpdateData
        }
      })
      return result
    })
  }

  // ==================== 业务流程方法 ====================

  async submit(id: number) {
    return this.atomicTransition(
      id,
      [ApplicationStatus.DRAFT, ApplicationStatus.PENDING_SUPPLEMENT],
      '当前状态不允许提交',
      {
        status: ApplicationStatus.PENDING_RISK_PRE,
        ...flowPatch(ApplicationStatus.PENDING_RISK_PRE)
      }
    )
  }

  async precheckPass(id: number, dto: { reviewerId?: number; approverId?: number; opinion?: string }) {
    return this.riskPrePass(id, dto)
  }

  async riskPrePass(id: number, dto: { reviewerId?: number; approverId?: number; opinion?: string }) {
    const reviewerId = dto.reviewerId || dto.approverId
    if (reviewerId) await this.ensureRelatedExists(this.prisma.user, reviewerId, '预审人不存在')
    if (reviewerId && dto.opinion?.trim()) {
      return this.transitionWithApproval(
        id,
        [ApplicationStatus.SUBMITTED, ApplicationStatus.PENDING_RISK_PRE],
        '当前状态不允许风控预审通过',
        { approverId: reviewerId, stage: 'RISK_PRE', action: ApprovalAction.PASS, opinion: dto.opinion },
        ApplicationStatus.PENDING_FUNDER_PRE,
        { remark: dto.opinion }
      )
    }
    return this.atomicTransition(
      id,
      [ApplicationStatus.SUBMITTED, ApplicationStatus.PENDING_RISK_PRE],
      '当前状态不允许风控预审通过',
      {
        status: ApplicationStatus.PENDING_FUNDER_PRE,
        ...flowPatch(ApplicationStatus.PENDING_FUNDER_PRE),
        remark: dto.opinion
      }
    )
  }

  async riskPreReject(id: number, dto: { reviewerId?: number; approverId?: number; opinion?: string }) {
    const reviewerId = dto.reviewerId || dto.approverId
    if (reviewerId) await this.ensureRelatedExists(this.prisma.user, reviewerId, '预审人不存在')
    if (!dto.opinion?.trim()) throw new BadRequestException('拒绝原因不能为空')
    const application = await this.findAndAssertStatus(
      id,
      [ApplicationStatus.SUBMITTED, ApplicationStatus.PENDING_RISK_PRE],
      '当前状态不允许风控预审拒绝'
    )
    if (reviewerId) {
      const result = await this.transitionWithApproval(
        id,
        [ApplicationStatus.SUBMITTED, ApplicationStatus.PENDING_RISK_PRE],
        '当前状态不允许风控预审拒绝',
        { approverId: reviewerId, stage: 'RISK_PRE', action: ApprovalAction.REJECT, opinion: dto.opinion },
        ApplicationStatus.RISK_PRE_REJECTED,
        { remark: dto.opinion },
        application
      )
      // 🆕 通知：审批拒绝
      await this.notificationService.sendOnApprovalRejected(id, application, '风控预审', dto.opinion!).catch(() => {})
      return result
    }
    return this.prisma.application.update({
      where: { id },
      data: {
        status: ApplicationStatus.RISK_PRE_REJECTED,
        ...flowPatch(ApplicationStatus.RISK_PRE_REJECTED),
        remark: dto.opinion ?? application.remark
      }
    })
  }

  async riskPreReturn(id: number, dto: { reviewerId?: number; approverId?: number; opinion?: string }) {
    const reviewerId = dto.reviewerId || dto.approverId
    if (!reviewerId) throw new BadRequestException('审批人不能为空')
    if (!dto.opinion?.trim()) throw new BadRequestException('驳回备注不能为空')
    await this.ensureRelatedExists(this.prisma.user, reviewerId, '预审人不存在')
    await this.findAndAssertStatus(
      id,
      [ApplicationStatus.SUBMITTED, ApplicationStatus.PENDING_RISK_PRE],
      '当前状态不允许风控预审驳回'
    )
    return this.transitionWithApproval(
      id,
      [ApplicationStatus.SUBMITTED, ApplicationStatus.PENDING_RISK_PRE],
      '当前状态不允许风控预审驳回',
      { approverId: reviewerId, stage: 'RISK_PRE', action: ApprovalAction.RETURN, opinion: dto.opinion },
      ApplicationStatus.SUBMITTED,
      { currentNode: 1140, currentStatus: 40, remark: dto.opinion }
    )
  }

  async funderPrePass(id: number, dto: { approverId: number; opinion?: string; funderApprovalNo?: string; amount?: number; term?: number; rate?: number }) {
    await this.ensureRelatedExists(this.prisma.user, dto.approverId, '处理人不存在')
    const application = await this.findAndAssertStatus(
      id,
      [ApplicationStatus.PENDING_FUNDER_PRE],
      '当前状态不允许资方预审通过'
    )
    return this.transitionWithApproval(
      id,
      [ApplicationStatus.PENDING_FUNDER_PRE],
      '当前状态不允许资方预审通过',
      { approverId: dto.approverId, stage: 'FUNDER_PRE', action: ApprovalAction.PASS, opinion: dto.opinion || dto.funderApprovalNo, amount: dto.amount, term: dto.term, rate: dto.rate },
      ApplicationStatus.PENDING_SUPPLEMENT,
      { approvedAmount: dto.amount ?? application.approvedAmount, approvedTerm: dto.term ?? application.approvedTerm, approvedRate: dto.rate ?? application.approvedRate },
      application
    )
  }

  async funderPreReject(id: number, dto: { approverId: number; opinion?: string; funderApprovalNo?: string }) {
    await this.ensureRelatedExists(this.prisma.user, dto.approverId, '处理人不存在')
    return this.transitionWithApproval(
      id,
      [ApplicationStatus.PENDING_FUNDER_PRE],
      '当前状态不允许资方预审拒绝',
      { approverId: dto.approverId, stage: 'FUNDER_PRE', action: ApprovalAction.REJECT, opinion: dto.opinion || dto.funderApprovalNo },
      ApplicationStatus.FUNDER_PRE_REJECTED
    )
  }

  async completeSupplement(id: number, dto: { reason?: string; deadline?: string | Date }) {
    const application = await this.findAndAssertStatus(
      id,
      [ApplicationStatus.PENDING_SUPPLEMENT, ApplicationStatus.FUNDER_PRE_PASSED],
      '当前状态不允许完成资料补充'
    )
    return this.prisma.application.update({
      where: { id },
      data: {
        status: ApplicationStatus.PENDING_FIRST_REVIEW,
        ...flowPatch(ApplicationStatus.PENDING_FIRST_REVIEW),
        supplementReason: dto.reason ?? application.supplementReason,
        supplementDeadline: dto.deadline ? new Date(dto.deadline) : application.supplementDeadline
      }
    })
  }

  async approve(id: number, dto: { approverId: number; stage?: string; opinion?: string; amount?: number; term?: number; rate?: number }) {
    await this.ensureRelatedExists(this.prisma.user, dto.approverId, '审批人不存在')
    const application = await this.findAndAssertStatus(
      id,
      [ApplicationStatus.PENDING_FIRST_REVIEW, ApplicationStatus.PENDING_FINAL_REVIEW],
      '当前状态不允许审批通过'
    )
    const nextStatus = this.resolvePassStatus(application.status)
    return this.transitionWithApproval(
      id,
      [ApplicationStatus.PENDING_FIRST_REVIEW, ApplicationStatus.PENDING_FINAL_REVIEW],
      '当前状态不允许审批通过',
      { approverId: dto.approverId, stage: dto.stage || this.resolveApprovalStage(application.status), action: ApprovalAction.PASS, opinion: dto.opinion, amount: dto.amount, term: dto.term, rate: dto.rate },
      nextStatus,
      { approvedAmount: dto.amount ?? application.approvedAmount, approvedTerm: dto.term ?? application.approvedTerm, approvedRate: dto.rate ?? application.approvedRate },
      application
    )
  }

  async reject(id: number, dto: { approverId: number; stage?: string; opinion?: string; amount?: number; term?: number; rate?: number }) {
    await this.ensureRelatedExists(this.prisma.user, dto.approverId, '审批人不存在')
    const application = await this.findAndAssertStatus(
      id,
      [
        ApplicationStatus.SUBMITTED,
        ApplicationStatus.PENDING_RISK_PRE,
        ApplicationStatus.PENDING_FUNDER_PRE,
        ApplicationStatus.PENDING_FIRST_REVIEW,
        ApplicationStatus.PENDING_FINAL_REVIEW,
        ApplicationStatus.PENDING_FUNDER_REVIEW,
        ApplicationStatus.LOAN_REQUEST_REVIEWING
      ],
      '当前状态不允许审批驳回'
    )
    const nextStatus = this.resolveRejectStatus(application.status)
    const result = await this.transitionWithApproval(
      id,
      [
        ApplicationStatus.SUBMITTED,
        ApplicationStatus.PENDING_RISK_PRE,
        ApplicationStatus.PENDING_FUNDER_PRE,
        ApplicationStatus.PENDING_FIRST_REVIEW,
        ApplicationStatus.PENDING_FINAL_REVIEW,
        ApplicationStatus.PENDING_FUNDER_REVIEW,
        ApplicationStatus.LOAN_REQUEST_REVIEWING
      ],
      '当前状态不允许审批驳回',
      { approverId: dto.approverId, stage: dto.stage || this.resolveApprovalStage(application.status), action: ApprovalAction.REJECT, opinion: dto.opinion, amount: dto.amount, term: dto.term, rate: dto.rate },
      nextStatus,
      {},
      application
    )
    // 🆕 通知：审批驳回
    await this.notificationService.sendOnApprovalRejected(id, application, dto.stage || '审批', dto.opinion || '').catch(() => {})
    return result
  }

  async requestSupplement(id: number, dto: { approverId: number; stage?: string; reason: string; deadline?: string | Date }) {
    await this.ensureRelatedExists(this.prisma.user, dto.approverId, '审批人不存在')
    return this.transitionWithApproval(
      id,
      [
        ApplicationStatus.SUBMITTED,
        ApplicationStatus.PENDING_RISK_PRE,
        ApplicationStatus.PENDING_FUNDER_PRE,
        ApplicationStatus.PENDING_FIRST_REVIEW,
        ApplicationStatus.PENDING_FINAL_REVIEW,
        ApplicationStatus.PENDING_FUNDER_REVIEW,
        ApplicationStatus.LOAN_REQUEST_REVIEWING
      ],
      '当前状态不允许要求补件',
      { approverId: dto.approverId, stage: dto.stage || 'SUPPLEMENT', action: ApprovalAction.SUPPLEMENT, opinion: dto.reason },
      ApplicationStatus.PENDING_SUPPLEMENT,
      { supplementReason: dto.reason, supplementDeadline: dto.deadline ? new Date(dto.deadline) : undefined }
    )
  }

  async submitFunderReview(id: number) {
    const application = await this.findAndAssertStatus(
      id,
      [ApplicationStatus.FINAL_REVIEW_PASSED],
      '当前状态不允许提交资方审批'
    )
    if (!application.funderId) throw new BadRequestException('未选择资方，不能提交资方审批')
    return this.prisma.application.update({
      where: { id },
      data: {
        status: ApplicationStatus.PENDING_FUNDER_REVIEW,
        ...flowPatch(ApplicationStatus.PENDING_FUNDER_REVIEW)
      }
    })
  }

  async funderPass(id: number, dto: { approverId: number; opinion?: string; funderApprovalNo?: string; amount?: number; term?: number; rate?: number }) {
    await this.ensureRelatedExists(this.prisma.user, dto.approverId, '审批人不存在')
    const application = await this.findAndAssertStatus(
      id,
      [ApplicationStatus.PENDING_FUNDER_REVIEW],
      '当前状态不允许资方审批通过'
    )
    return this.transitionWithApproval(
      id,
      [ApplicationStatus.PENDING_FUNDER_REVIEW],
      '当前状态不允许资方审批通过',
      { approverId: dto.approverId, stage: 'FUNDER_REVIEW', action: ApprovalAction.PASS, opinion: dto.opinion || dto.funderApprovalNo, amount: dto.amount, term: dto.term, rate: dto.rate },
      ApplicationStatus.FUNDER_REVIEW_PASSED,
      { approvedAmount: dto.amount ?? application.approvedAmount, approvedTerm: dto.term ?? application.approvedTerm, approvedRate: dto.rate ?? application.approvedRate },
      application
    )
  }

  async funderReject(id: number, dto: { approverId: number; opinion?: string; funderApprovalNo?: string; amount?: number; term?: number; rate?: number }) {
    await this.ensureRelatedExists(this.prisma.user, dto.approverId, '审批人不存在')
    return this.transitionWithApproval(
      id,
      [ApplicationStatus.PENDING_FUNDER_REVIEW],
      '当前状态不允许资方审批拒绝',
      { approverId: dto.approverId, stage: 'FUNDER_REVIEW', action: ApprovalAction.REJECT, opinion: dto.opinion || dto.funderApprovalNo, amount: dto.amount, term: dto.term, rate: dto.rate },
      ApplicationStatus.FUNDER_REVIEW_REJECTED
    )
  }
}