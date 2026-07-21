import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { ApplicationStatus, ApprovalAction, Prisma } from '@prisma/client'
import type { Application } from '@prisma/client'
import { getCurrentTenantId } from '../../common/tenant/tenant-context'
import { FlowNode, FlowStatus } from '../../common/constants/flow.constants'
import { FlowConfigService } from '../flow-config/flow-config.service'
import { PrismaService } from '../prisma/prisma.service'
import { ApplicationNotificationService } from './notification.service'
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

@Injectable()
export class ApprovalWorkflowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: ApplicationNotificationService,
    private readonly flowConfigService: FlowConfigService
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

  /** 添加租户过滤条件 + 排除软删除 */
  addTenantId(where: Record<string, unknown>): Record<string, unknown> {
    const tenantId = getCurrentTenantId()
    if (!tenantId) return { ...where, deletedAt: null }
    return { ...where, tenantId, deletedAt: null }
  }

  /** 确保关联数据存在（含租户校验） */
  async ensureRelatedExists(model: PrismaModelDelegate, id: number | undefined, message: string) {
    if (id === undefined || id === null) return
    const tenantId = getCurrentTenantId()
    const where: Record<string, unknown> = { id }
    if (tenantId) where.tenantId = tenantId
    const item = await model.findFirst({ where })
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
    // 使用 updateMany + 条件过滤，原子性地完成状态校验和更新，消除 TOCTOU 竞态
    const where: Record<string, unknown> = { id, status: { in: allowedStatuses } }
    if (tenantId) where.tenantId = tenantId

    const result = await this.prisma.application.updateMany({ where, data: updateData })
    if (result.count === 0) {
      // 区分「不存在」和「状态不允许」
      const existsWhere: Record<string, unknown> = { id }
      if (tenantId) existsWhere.tenantId = tenantId
      const exists = await this.prisma.application.findFirst({ where: existsWhere })
      if (!exists) throw new NotFoundException('数据不存在')
      throw new BadRequestException(statusMessage)
    }
    // 返回更新后的完整记录
    const updated = await this.prisma.application.findFirst({
      where: tenantId ? { id, tenantId } : { id }
    })
    return updated!
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
    preLoadedApplication?: Application | null
  ) {
    // preLoadedApplication 仅用于外部已校验的场景（如 riskPreReject 传入了 application）
    // 但事务内仍需原子性条件更新，防止并发穿透
    const tenantId = getCurrentTenantId()
    const statusWhere: Record<string, unknown> = { id, status: { in: allowedStatuses } }
    if (tenantId) statusWhere.tenantId = tenantId

    // 在事务外解析流程补丁（避免事务内引入额外 IO 并复用缓存）
    const orgId = preLoadedApplication?.orgId
    const flow = await this.flowConfigService.getStatusFlowPatch(orgId ?? undefined, nextStatus)

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 先原子更新状态，用 updateMany + 条件过滤消除 TOCTOU 竞态
      const updateResult = await tx.application.updateMany({
        where: statusWhere,
        data: {
          status: nextStatus,
          ...flow,
          ...extraUpdateData
        }
      })

      if (updateResult.count === 0) {
        const existsWhere: Record<string, unknown> = { id }
        if (tenantId) existsWhere.tenantId = tenantId
        const exists = await tx.application.findFirst({ where: existsWhere })
        if (!exists) throw new NotFoundException('数据不存在')
        throw new BadRequestException(statusMessage)
      }

      // 状态更新成功后，创建审批记录
      await tx.approvalRecord.create({
        data: {
          tenantId: tenantId!,
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

      return tx.application.findFirst({
        where: tenantId ? { id, tenantId } : { id }
      })
    })
  }

  // ==================== 流程补丁解析 ====================

  private async resolveFlowPatchById(
    id: number,
    status: ApplicationStatus
  ): Promise<{ currentNode: number; currentStatus: number }> {
    const application = await this.prisma.application.findUnique({
      where: { id },
      select: { orgId: true }
    })
    return this.flowConfigService.getStatusFlowPatch(application?.orgId ?? undefined, status)
  }

  // ==================== 业务流程方法 ====================

  async submit(id: number) {
    const flow = await this.resolveFlowPatchById(id, ApplicationStatus.PENDING_RISK_PRE)
    return this.atomicTransition(
      id,
      [ApplicationStatus.DRAFT, ApplicationStatus.PENDING_SUPPLEMENT],
      '当前状态不允许提交',
      {
        status: ApplicationStatus.PENDING_RISK_PRE,
        ...flow
      }
    )
  }

  async precheckPass(id: number, dto: { reviewerId?: number; approverId?: number; opinion?: string }) {
    return this.riskPrePass(id, dto)
  }

  async riskPrePass(id: number, dto: { reviewerId?: number; approverId?: number; opinion?: string }) {
    const reviewerId = dto.reviewerId || dto.approverId
    if (reviewerId) await this.ensureRelatedExists(this.prisma.user, reviewerId, '预审人不存在')
    // 有审批人时始终走 transitionWithApproval 创建审批记录，保证审计链完整
    if (reviewerId) {
      return this.transitionWithApproval(
        id,
        [ApplicationStatus.SUBMITTED, ApplicationStatus.PENDING_RISK_PRE],
        '当前状态不允许风控预审通过',
        { approverId: reviewerId, stage: 'RISK_PRE', action: ApprovalAction.PASS, opinion: dto.opinion },
        ApplicationStatus.PENDING_FUNDER_PRE,
        { remark: dto.opinion }
      )
    }
    const flow = await this.resolveFlowPatchById(id, ApplicationStatus.PENDING_FUNDER_PRE)
    return this.atomicTransition(
      id,
      [ApplicationStatus.SUBMITTED, ApplicationStatus.PENDING_RISK_PRE],
      '当前状态不允许风控预审通过',
      {
        status: ApplicationStatus.PENDING_FUNDER_PRE,
        ...flow,
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
    const flow = await this.flowConfigService.getStatusFlowPatch(application.orgId ?? undefined, ApplicationStatus.RISK_PRE_REJECTED)
    return this.prisma.application.update({
      where: { id },
      data: {
        status: ApplicationStatus.RISK_PRE_REJECTED,
        ...flow,
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
      { currentNode: FlowNode.SUBMISSION_RETURNED, currentStatus: FlowStatus.RETURNED, remark: dto.opinion }
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
    const flow = await this.flowConfigService.getStatusFlowPatch(application.orgId ?? undefined, ApplicationStatus.PENDING_FIRST_REVIEW)
    return this.prisma.application.update({
      where: { id },
      data: {
        status: ApplicationStatus.PENDING_FIRST_REVIEW,
        ...flow,
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
    const flow = await this.flowConfigService.getStatusFlowPatch(application.orgId ?? undefined, ApplicationStatus.PENDING_FUNDER_REVIEW)
    return this.prisma.application.update({
      where: { id },
      data: {
        status: ApplicationStatus.PENDING_FUNDER_REVIEW,
        ...flow
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