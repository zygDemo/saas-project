import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import {
  ApplicationStatus,
  ApprovalAction,
  Application as ApplicationModel,
  ApplicationFile,
  ApprovalRecord,
  Customer,
  Disbursement,
  DisbursementStatus,
  Funder,
  LeadStatus,
  Organization,
  Prisma,
  Product,
  RepaymentPlan,
  RepaymentStatus,
  SignRecord,
  SignStatus,
  User,
  Vehicle
} from '@prisma/client'
import { BaseBusinessCrudService, omitNested } from '../base-business-crud.service'
import { DataScopeService } from '../../common/auth/data-scope.service'
import { getCurrentTenantId } from '../../common/tenant/tenant-context'
import { createApplicationWithUniqueNo } from '../../common/utils/application-no'
import { getPagination, toPaginatedResponse } from '../../common/utils/pagination'
import { FlowConfigService } from '../flow-config/flow-config.service'
import { PrismaService } from '../prisma/prisma.service'
import {
  CreateApplicationDto,
  UpdateApplicationDto,
  ApplicationQueryDto,
  OrderListQueryDto
} from './dto/application.dto'
import {
  ApprovalActionDto,
  CompleteSigningDto,
  ConfirmDisbursementDto,
  GpsInstalledDto,
  MortgageDoneDto,
  PrecheckActionDto,
  FunderReviewDto,
  SupplementActionDto,
  CompleteSupplementDto,
  StartSigningDto,
  RegisterRepaymentDto,
  RequestDisbursementDto,
  SettleApplicationDto,
} from './dto/business-action.dto'
import { ApprovalWorkflowService, flowPatch } from './approval-workflow.service'
import { NotificationService } from './notification.service'
import { RepaymentService } from '../repayment/repayment.service'
import { DisbursementService } from '../disbursement/disbursement.service'

type PrismaDelegate = { findFirst: (...args: any[]) => Promise<any> }

interface ApplicationWithIncludes extends ApplicationWithFlow {
  files?: ApplicationFile[]
  approvals?: (ApprovalRecord & { approver?: Pick<User, 'id' | 'userName' | 'nickName'> | null })[]
  signRecord?: SignRecord | null
  disbursement?: Disbursement | null
  repayments?: RepaymentPlan[]
}

interface ApplicationWithFlow extends ApplicationModel {
  org?: (Organization & { flowConfigs?: Array<Record<string, unknown>> }) | null
  customer?: (Customer & { vehicles?: Vehicle[] }) | null
  product?: Product | null
  funder?: Funder | null
  creator?: Pick<User, 'id' | 'userName' | 'nickName'> | null
}

const FLOW_STATUS_LABELS: Record<number, string> = {
  0: '未开始', 10: '处理中', 20: '已通过', 30: '已拒绝', 40: '已退回', 50: '待补充', 90: '已完成'
}

interface FlowMappingCache {
  nodeNames: Record<number, string>
  nodePhases: Record<number, number>
  phaseNames: Record<number, string>
}

const EMPTY_FLOW_MAPPINGS: FlowMappingCache = { nodeNames: {}, nodePhases: {}, phaseNames: {} }

function hasQueryValue(value: unknown) { return value !== undefined && value !== null && value !== '' }

function firstQueryString(...values: unknown[]) {
  for (const value of values) { if (hasQueryValue(value)) return String(value).trim() }
  return ''
}

function containsText(value: string) { return { contains: value, mode: 'insensitive' as const } }

const DETAIL_FILE_TYPE_LABELS: Record<string, string> = {
  ID_CARD_FRONT: '身份证人像面', ID_CARD_BACK: '身份证国徽面',
  VEHICLE_LICENSE: '行驶证', VEHICLE_IMAGE: '车辆照片',
  BANK_CARD: '银行卡', CONTRACT: '合同', OTHER: '其他材料'
}

function omitEmptyValues(source: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(source).filter(([, value]) => value !== undefined))
}

@Injectable()
export class ApplicationService extends BaseBusinessCrudService<
  CreateApplicationDto, UpdateApplicationDto, ApplicationQueryDto
> {
  private flowMappingsCache: FlowMappingCache | null = null
  private flowMappingsOrgId?: number

  constructor(
    private readonly prisma: PrismaService,
    private readonly flowConfigService: FlowConfigService,
    private readonly dataScopeService: DataScopeService,
    // 🆕 子服务注入
    private readonly approvalWorkflow: ApprovalWorkflowService,
    private readonly notificationService: NotificationService,
    private readonly repaymentService: RepaymentService,
    private readonly disbursementService: DisbursementService
  ) {
    super({
      model: prisma.application,
      prisma,
      searchableFields: ['applicationNo'],
      exactFields: ['orgId', 'status', 'customerId', 'creatorId', 'businessType', 'currentNode', 'currentStatus'],
      buildWhere: (query: ApplicationQueryDto) => {
        const where: Record<string, unknown> = {}
        if (hasQueryValue(query.orgId)) where.orgId = query.orgId
        if (hasQueryValue(query.status)) where.status = query.status
        if (hasQueryValue(query.customerId)) where.customerId = query.customerId
        if (hasQueryValue(query.creatorId)) where.creatorId = query.creatorId
        if (hasQueryValue(query.businessType)) where.businessType = query.businessType
        if (hasQueryValue(query.currentNode)) {
          where.currentNode = query.currentNode
        } else if (hasQueryValue(query.phaseCode)) {
          const phaseCode = Number(query.phaseCode)
          const nodePhases = this.getFlowMappings().nodePhases
          const phaseNodeCodes = Object.entries(nodePhases).filter(([, code]) => code === phaseCode).map(([node]) => Number(node))
          where.currentNode = phaseNodeCodes.length ? { in: phaseNodeCodes } : phaseCode
        }
        if (hasQueryValue(query.currentStatus)) where.currentStatus = query.currentStatus
        if (hasQueryValue(query.applicationNo)) where.applicationNo = containsText(String(query.applicationNo))
        return where
      },
      getExtraWhere: async () => {
        const roleIds = (await import('../../common/tenant/tenant-context')).getCurrentUserRoles()
        if (!roleIds.length) return {}
        const roles = await this.prisma.role.findMany({ where: { id: { in: roleIds } }, select: { dataScope: true } })
        const scopePriority: Record<string, number> = { SELF: 1, DEPT: 2, CUSTOM: 3, ALL: 4 }
        const minScope = roles.map((r: { dataScope: string }) => r.dataScope).sort((a: string, b: string) => (scopePriority[a] ?? 99) - (scopePriority[b] ?? 99))[0]
        if (!minScope || minScope === 'ALL') return {}
        const visibleIds = await this.dataScopeService.getVisibleUserIds(minScope)
        return this.dataScopeService.injectDataScope({}, visibleIds)
      },
      include: { org: true, customer: true, product: true, funder: true, creator: { select: { id: true, userName: true, nickName: true } } },
      detailInclude: { org: true, customer: true, product: true, funder: true, creator: { select: { id: true, userName: true, nickName: true } }, files: true, approvals: true, signRecord: true, disbursement: true, repayments: true },
      validateCreate: async (dto) => { await this.prepareCreateRelations(dto); await this.ensureRelatedExists(this.prisma.user, dto.creatorId, '创建人不存在') },
      validateUpdate: async (id, dto) => { await this.prepareUpdateRelations(id, dto); await this.ensureRelatedExists(this.prisma.user, dto.creatorId, '创建人不存在') },
      beforeCreate: (dto) => {
        const data = omitNested(dto as unknown as Record<string, unknown>, ['files'])
        data.status = dto.status || ApplicationStatus.DRAFT
        data.businessType = dto.businessType || 'CAR_LOAN'
        const flow = flowPatch(data.status as ApplicationStatus)
        data.currentNode = dto.currentNode ?? flow.currentNode
        data.currentStatus = dto.currentStatus ?? flow.currentStatus
        if (dto.files?.length) { data.files = { create: dto.files } }
        return data
      },
      beforeUpdate: (dto) => omitNested(dto as unknown as Record<string, unknown>, ['files'])
    })
  }

  // ==================== 流程映射缓存 ====================

  private async loadFlowMappings(orgId?: number) {
    if (this.flowMappingsCache && this.flowMappingsOrgId === orgId) return
    this.flowMappingsCache = await this.flowConfigService.getFlowMappings(orgId)
    this.flowMappingsOrgId = orgId
  }

  private getFlowMappings(): FlowMappingCache { return this.flowMappingsCache || EMPTY_FLOW_MAPPINGS }

  // ==================== CRUD 覆写 ====================

  override async getList(query: ApplicationQueryDto) { await this.loadFlowMappings(query.orgId); return super.getList(query) }

  override async create(dto: CreateApplicationDto) {
    if (dto.applicationNo) return super.create(dto)
    return createApplicationWithUniqueNo((applicationNo) => super.create({ ...dto, applicationNo }))
  }

  override async getDetail(id: number) {
    const where: Record<string, unknown> = { id }
    const tenantId = getCurrentTenantId()
    if (tenantId) where.tenantId = tenantId
    const application = await this.prisma.application.findFirst({
      where,
      include: {
        org: { include: { flowConfigs: true } },
        customer: { include: { vehicles: { orderBy: { id: 'desc' } } } },
        product: true, funder: true,
        creator: { select: { id: true, userName: true, nickName: true } },
        files: { orderBy: { createdAt: 'desc' } },
        approvals: { orderBy: { createdAt: 'desc' }, include: { approver: { select: { id: true, userName: true, nickName: true } } } },
        signRecord: true, disbursement: true, repayments: { orderBy: { period: 'asc' } }
      }
    })
    if (!application) throw new NotFoundException('数据不存在')
    return this.mapApplicationDetail(application)
  }

  // ==================== 流程/订单列表 ====================

  async getFlowList(query: ApplicationQueryDto) { /* ... keep as-is, same implementation ... */
    await this.loadFlowMappings(query.orgId)
    const pagination = getPagination(query)
    const where: Record<string, unknown> = {}
    const tenantId = getCurrentTenantId()
    if (tenantId) where.tenantId = tenantId
    if (query.orgId) where.orgId = query.orgId
    if (query.status) where.status = query.status
    if (query.customerId) where.customerId = query.customerId
    if (query.creatorId) where.creatorId = query.creatorId
    if (query.businessType) where.businessType = query.businessType
    if (query.currentNode !== undefined) where.currentNode = query.currentNode
    if (query.currentStatus !== undefined) where.currentStatus = query.currentStatus
    if (query.applicationNo) { where.applicationNo = { contains: query.applicationNo, mode: 'insensitive' } }
    const [records, total] = await this.prisma.$transaction([
      this.prisma.application.findMany({
        where, skip: pagination.skip, take: pagination.take, orderBy: { id: 'desc' },
        include: { org: { include: { flowConfigs: true } }, customer: true, product: true, funder: true, creator: { select: { id: true, userName: true, nickName: true } } }
      }),
      this.prisma.application.count({ where })
    ])
    return toPaginatedResponse(records.map((r: unknown) => this.mapFlowApplication(r as unknown as ApplicationWithFlow)), total, pagination)
  }

  async getOrderList(query: OrderListQueryDto) { /* ... keep as-is ... */
    await this.loadFlowMappings(query.orgId)
    const pagination = getPagination({ current: query.current ?? query.pageNum, size: query.size ?? query.pageSize })
    const where = this.buildOrderListWhere(query)
    const [records, total] = await this.prisma.$transaction([
      this.prisma.application.findMany({ where, skip: pagination.skip, take: pagination.take, orderBy: { id: 'desc' }, include: { org: { include: { flowConfigs: true } }, customer: true, product: true, funder: true, creator: { select: { id: true, userName: true, nickName: true } } } }),
      this.prisma.application.count({ where })
    ])
    return toPaginatedResponse(records.map((r: unknown) => this.mapOrderListItem(r as unknown as ApplicationWithFlow)), total, pagination)
  }

  // ==================== 审批流转 → 委托 ApprovalWorkflowService ====================

  async submit(id: number) { return this.approvalWorkflow.submit(id) }
  async precheckPass(id: number, dto: PrecheckActionDto) { return this.approvalWorkflow.precheckPass(id, dto) }
  async riskPrePass(id: number, dto: PrecheckActionDto) { return this.approvalWorkflow.riskPrePass(id, dto) }
  async riskPreReject(id: number, dto: PrecheckActionDto) { return this.approvalWorkflow.riskPreReject(id, dto) }
  async riskPreReturn(id: number, dto: PrecheckActionDto) { return this.approvalWorkflow.riskPreReturn(id, dto) }
  async funderPrePass(id: number, dto: FunderReviewDto) { return this.approvalWorkflow.funderPrePass(id, dto) }
  async funderPreReject(id: number, dto: FunderReviewDto) { return this.approvalWorkflow.funderPreReject(id, dto) }
  async completeSupplement(id: number, dto: CompleteSupplementDto) { return this.approvalWorkflow.completeSupplement(id, dto) }
  async approve(id: number, dto: ApprovalActionDto) { return this.approvalWorkflow.approve(id, dto) }
  async reject(id: number, dto: ApprovalActionDto) { return this.approvalWorkflow.reject(id, dto) }
  async requestSupplement(id: number, dto: SupplementActionDto) { return this.approvalWorkflow.requestSupplement(id, dto) }
  async submitFunderReview(id: number) { return this.approvalWorkflow.submitFunderReview(id) }
  async funderPass(id: number, dto: FunderReviewDto) { return this.approvalWorkflow.funderPass(id, dto) }
  async funderReject(id: number, dto: FunderReviewDto) { return this.approvalWorkflow.funderReject(id, dto) }

  // ==================== 签约流程（含跨模型事务，保留在 ApplicationService） ====================

  async startSigning(id: number, dto: StartSigningDto) {
    await this.approvalWorkflow.findAndAssertStatus(
      id,
      [ApplicationStatus.FINAL_REVIEW_PASSED, ApplicationStatus.FUNDER_REVIEW_PASSED],
      '当前状态不允许发起签约'
    )
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const tenantId = getCurrentTenantId()!
      await tx.signRecord.upsert({
        where: { applicationId: id },
        update: { status: SignStatus.SENT, contractUrl: dto.contractUrl, expiredAt: dto.expiredAt },
        create: { tenantId, applicationId: id, status: SignStatus.SENT, contractUrl: dto.contractUrl, expiredAt: dto.expiredAt }
      })
      const result = await tx.application.update({
        where: { id },
        data: { status: ApplicationStatus.PENDING_SIGN, ...flowPatch(ApplicationStatus.PENDING_SIGN) }
      })
      // 🆕 通知：发起签约
      await this.notificationService.sendOnSigningStarted(id, result).catch(() => {})
      return result
    })
  }

  async completeSigning(id: number, dto: CompleteSigningDto) {
    await this.approvalWorkflow.findAndAssertStatus(id, [ApplicationStatus.PENDING_SIGN], '当前状态不允许完成签约')
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const tenantId = getCurrentTenantId()!
      await tx.signRecord.upsert({
        where: { applicationId: id },
        update: { status: SignStatus.SIGNED, contractUrl: dto.contractUrl, videoUrl: dto.videoUrl, signedAt: dto.signedAt || new Date() },
        create: { tenantId, applicationId: id, status: SignStatus.SIGNED, contractUrl: dto.contractUrl, videoUrl: dto.videoUrl, signedAt: dto.signedAt || new Date() }
      })
      await tx.disbursement.upsert({
        where: { applicationId: id },
        update: {},
        create: { tenantId, applicationId: id, status: DisbursementStatus.PENDING_APPLICATION }
      })
      return tx.application.update({
        where: { id },
        data: { status: ApplicationStatus.PENDING_LOAN_REQUEST, ...flowPatch(ApplicationStatus.PENDING_LOAN_REQUEST) }
      })
    })
  }

  // ==================== 请款审核 → 委托 ApprovalWorkflowService ====================

  async submitLoanRequest(id: number, dto: RequestDisbursementDto) {
    const application = await this.approvalWorkflow.findAndAssertStatus(
      id,
      [ApplicationStatus.SIGNED, ApplicationStatus.PENDING_LOAN_REQUEST, ApplicationStatus.LOAN_REQUEST_REJECTED],
      '当前状态不允许提交请款资料'
    )
    return this.prisma.application.update({
      where: { id },
      data: { status: ApplicationStatus.LOAN_REQUEST_REVIEWING, ...flowPatch(ApplicationStatus.LOAN_REQUEST_REVIEWING), remark: dto.remark ?? (application as any).remark }
    })
  }

  // approveLoanRequest and rejectLoanRequest are just approval transitions → delegate to ApprovalWorkflowService
  async approveLoanRequest(id: number, dto: ApprovalActionDto) {
    await this.approvalWorkflow.ensureRelatedExists(this.prisma.user, dto.approverId, '审批人不存在')
    return this.approvalWorkflow.transitionWithApproval(
      id, [ApplicationStatus.LOAN_REQUEST_REVIEWING], '当前状态不允许请款审核通过',
      { approverId: dto.approverId, stage: 'LOAN_REQUEST', action: ApprovalAction.PASS, opinion: dto.opinion, amount: dto.amount, term: dto.term, rate: dto.rate },
      ApplicationStatus.LOAN_REQUEST_APPROVED
    )
  }

  async rejectLoanRequest(id: number, dto: ApprovalActionDto) {
    await this.approvalWorkflow.ensureRelatedExists(this.prisma.user, dto.approverId, '审批人不存在')
    return this.approvalWorkflow.transitionWithApproval(
      id, [ApplicationStatus.LOAN_REQUEST_REVIEWING], '当前状态不允许请款审核拒绝',
      { approverId: dto.approverId, stage: 'LOAN_REQUEST', action: ApprovalAction.REJECT, opinion: dto.opinion },
      ApplicationStatus.LOAN_REQUEST_REJECTED
    )
  }

  // ==================== GPS/抵押 → 委托 DisbursementService ====================

  async completeGpsInstall(id: number, dto: GpsInstalledDto) {
    await this.approvalWorkflow.findAndAssertStatus(id, [ApplicationStatus.PENDING_DISBURSEMENT], '当前状态不允许登记GPS安装')
    return this.disbursementService.completeGpsInstall(id, dto)
  }

  async completeMortgage(id: number, dto: MortgageDoneDto) {
    await this.approvalWorkflow.findAndAssertStatus(id, [ApplicationStatus.PENDING_DISBURSEMENT], '当前状态不允许登记抵押')
    return this.disbursementService.completeMortgage(id, dto)
  }

  // ==================== 出账申请 → 委托 DisbursementService ====================

  async requestDisbursement(id: number, dto: RequestDisbursementDto) {
    await this.approvalWorkflow.findAndAssertStatus(id, [ApplicationStatus.LOAN_REQUEST_APPROVED, ApplicationStatus.PENDING_DISBURSEMENT], '当前状态不允许提交资方放款申请')
    return this.disbursementService.requestDisbursement(id, dto)
  }

  // ==================== 放款确认（含还款计划生成 + 线索转化） ====================

  async confirmDisbursement(id: number, dto: ConfirmDisbursementDto) {
    const application = await this.approvalWorkflow.findAndAssertStatus(id, [ApplicationStatus.PENDING_DISBURSEMENT], '当前状态不允许放款确认')

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. 放款确认（含GPS/抵押强校验）→ DisbursementService 内部处理
      const tenantId = getCurrentTenantId()!
      const disbursement = await tx.disbursement.findFirst({ where: { applicationId: id } })
      if (!disbursement || !['PENDING_APPROVAL', 'GPS_INSTALLED', 'MORTGAGE_DONE'].includes(disbursement.status)) {
        throw new BadRequestException('请先提交出账申请')
      }
      if (!disbursement.gpsInstallAt) throw new BadRequestException('请先完成GPS安装后再确认放款')
      if (!disbursement.mortgageAt) throw new BadRequestException('请先完成抵押登记后再确认放款')

      await tx.disbursement.upsert({
        where: { applicationId: id },
        update: { status: DisbursementStatus.DISBURSED, disburseAmount: dto.disburseAmount, disburseAccount: dto.disburseAccount, disburseAt: dto.disburseAt || new Date(), transactionNo: dto.transactionNo, voucherUrl: dto.voucherUrl, remark: dto.remark },
        create: { tenantId, applicationId: id, status: DisbursementStatus.DISBURSED, disburseAmount: dto.disburseAmount, disburseAccount: dto.disburseAccount, disburseAt: dto.disburseAt || new Date(), transactionNo: dto.transactionNo, voucherUrl: dto.voucherUrl, remark: dto.remark }
      })

      // 2. 自动生成还款计划 → RepaymentService
      await this.repaymentService.createRepaymentPlansIfNeeded(tx, application, dto)

      // 3. 线索转化
      if ((application as any).sourceLeadId) {
        await tx.lead.update({ where: { id: (application as any).sourceLeadId }, data: { status: LeadStatus.CONVERTED } })
      }

      const result = await tx.application.update({
        where: { id },
        data: { status: ApplicationStatus.DISBURSED, ...flowPatch(ApplicationStatus.DISBURSED) }
      })

      // 🆕 通知：放款成功
      await this.notificationService.sendOnLoanDisbursed(id, result, Number(dto.disburseAmount)).catch(() => {})
      return result
    })
  }

  // ==================== 还款管理 → 委托 RepaymentService ====================

  async registerRepaymentByApplication(applicationId: number, dto: RegisterRepaymentDto) { return this.repaymentService.registerRepaymentByApplication(applicationId, dto) }
  async registerRepayment(planId: number, dto: RegisterRepaymentDto) { return this.repaymentService.registerRepayment(planId, dto) }
  async getRepaymentPlans(applicationId: number) { return this.repaymentService.getRepaymentPlans(applicationId) }
  async getOverduePlans(query: { page?: number; pageSize?: number }) { return this.repaymentService.getOverduePlans(query) }
  async addCollectionRecord(applicationId: number, dto: { collectorId?: number; collectType?: string; content: string; result?: string; nextAction?: string; nextDate?: string }) { return this.repaymentService.addCollectionRecord(applicationId, dto) }
  async getCollectionRecords(applicationId: number) { return this.repaymentService.getCollectionRecords(applicationId) }
  async applyEarlyRepayment(applicationId: number, dto: { repayType?: string; amount?: number; principal?: number; interest?: number; penalty?: number; reason?: string }) { return this.repaymentService.applyEarlyRepayment(applicationId, dto) }
  async approveEarlyRepayment(id: number, dto: { approvedBy: number; remark?: string }) { return this.repaymentService.approveEarlyRepayment(id, dto) }
  async completeEarlyRepayment(id: number) { return this.repaymentService.completeEarlyRepayment(id) }
  async getEarlyRepayments(applicationId: number) { return this.repaymentService.getEarlyRepayments(applicationId) }

  // ==================== 结清 ====================

  async settle(id: number, dto: SettleApplicationDto) {
    const application = await this.approvalWorkflow.findAndAssertStatus(id, [ApplicationStatus.DISBURSED], '当前状态不允许结清')
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 还款计划结清 → RepaymentService
      await this.repaymentService.settleApplication(tx, id)
      const result = await tx.application.update({
        where: { id },
        data: { status: ApplicationStatus.SETTLED, ...flowPatch(ApplicationStatus.SETTLED), remark: dto.remark ?? (application as any).remark }
      })
      // 🆕 通知：贷款结清
      await this.notificationService.sendOnLoanSettled(id, result).catch(() => {})
      return result
    })
  }

  // ==================== 线索转化 ====================

  async convertLeadToApplication(id: number) {
    const application = await this.prisma.application.findFirst({ where: this.addTenantId({ id }) })
    if (!application?.sourceLeadId) return application
    await this.prisma.lead.update({ where: { id: application.sourceLeadId }, data: { status: LeadStatus.CONVERTED } })
    return application
  }

  // ==================== 关联校验 ====================

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

  private async ensureOrgExists(orgId: number) { await this.getScopedRelated(this.prisma.organization, orgId, '机构不存在') }

  private async assertSameOrg(model: PrismaDelegate, id: number | undefined, orgId: number, notFoundMessage: string, mismatchMessage: string) {
    if (id === undefined || id === null) return
    const item = await this.getScopedRelated(model, id, notFoundMessage)
    if (item.orgId !== orgId) throw new BadRequestException(mismatchMessage)
  }

  private async getScopedRelated(model: PrismaDelegate, id: number | undefined, message: string) {
    if (id === undefined || id === null) throw new BadRequestException(message)
    const tenantId = getCurrentTenantId()
    const where = tenantId ? { id, tenantId } : { id }
    const item = await model.findFirst({ where })
    if (!item) throw new BadRequestException(message)
    return item
  }

  private addTenantId(where: Record<string, unknown>): Record<string, unknown> {
    const tenantId = getCurrentTenantId()
    if (!tenantId) return where
    return { ...where, tenantId }
  }

  // ==================== 订单列表查询条件构建 ====================

  private buildOrderListWhere(query: OrderListQueryDto) {
    const where: Record<string, unknown> = {}
    const tenantId = getCurrentTenantId()
    if (tenantId) where.tenantId = tenantId
    if (hasQueryValue(query.orgId)) where.orgId = query.orgId
    if (hasQueryValue(query.status)) where.status = query.status
    if (hasQueryValue(query.customerId)) where.customerId = query.customerId
    if (hasQueryValue(query.creatorId)) where.creatorId = query.creatorId
    if (hasQueryValue(query.businessType)) where.businessType = query.businessType
    const nodeCode = query.currentNode ?? query.nodeCode
    const nodeStatus = query.currentStatus ?? query.nodeStatus
    if (hasQueryValue(nodeCode)) {
      where.currentNode = nodeCode
    } else if (query.businessNode) {
      const nodeMap: Record<string, number> = { INITIAL_AUDIT: 1100, PRE_AUDIT: 1200, SUPPLEMENT_MATERIALS: 1300, FIRST_REVIEW: 1400, FINAL_REVIEW: 1450, FUNDER_REVIEW: 1500, SIGN_CONTRACT: 1600, FACE_RECOGNITION: 1610, FACE_SIGN: 1620, LOAN_REQUEST: 1700, LOAN_DISBURSEMENT: 1800, POST_LOAN: 1900 }
      const mapped = nodeMap[query.businessNode]
      if (mapped) where.currentNode = mapped
    } else if (hasQueryValue(query.phaseCode)) {
      const phaseCode = Number(query.phaseCode)
      const nodePhases = this.getFlowMappings().nodePhases
      const phaseNodeCodes = Object.entries(nodePhases).filter(([, code]) => code === phaseCode).map(([node]) => Number(node))
      where.currentNode = phaseNodeCodes.length ? { in: phaseNodeCodes } : phaseCode
    }
    if (hasQueryValue(nodeStatus)) where.currentStatus = nodeStatus
    const orderNo = firstQueryString(query.applicationNo, query.orderNo, query.creditOrderId)
    if (orderNo) where.applicationNo = containsText(orderNo)
    const customerWhere: Record<string, unknown> = {}
    const personName = firstQueryString(query.personName, query.customerName, query.name)
    if (personName) customerWhere.name = containsText(personName)
    const phone = firstQueryString(query.phone, query.telephone)
    if (phone) customerWhere.phone = containsText(phone)
    const plateNumber = firstQueryString(query.plateNumber)
    if (plateNumber) { customerWhere.vehicles = { some: { plateNumber: containsText(plateNumber) } } }
    if (Object.keys(customerWhere).length > 0) { where.customer = customerWhere }
    const keyword = firstQueryString(query.keyword)
    if (keyword) {
      where.OR = [
        { applicationNo: containsText(keyword) },
        { customer: { OR: [{ name: containsText(keyword) }, { phone: containsText(keyword) }, { vehicles: { some: { plateNumber: containsText(keyword) } } }] } }
      ]
    }
    return where
  }

  // ==================== 数据映射方法 ====================

  private mapOrderListItem(application: ApplicationWithFlow) {
    const customer = application.customer
    const vehicle = customer?.vehicles?.[0] || customer?.vehicles?.at?.(0)
    const currentNode = Number(application.currentNode)
    const currentStatus = Number(application.currentStatus)
    const phaseCode = this.resolveFlowPhaseCode(application)
    const nodeName = this.resolveFlowNodeName(application)
    const nodeStatusName = FLOW_STATUS_LABELS[currentStatus] || String(application.currentStatus)

    return {
      ...application,
      customer,
      vehicle,
      orgName: application.org?.name,
      customerName: customer?.name || '',
      name: customer?.name || '',
      phone: customer?.phone || '',
      plateNumber: vehicle?.plateNumber || '',
      vehicleBrand: vehicle?.brand || '',
      vehicleModel: vehicle?.model || '',
      applicationNo: application.applicationNo,
      orderNo: application.applicationNo,
      creditOrderId: application.applicationNo,
      amount: application.amount,
      term: application.term,
      rate: application.rate,
      approvedAmount: application.approvedAmount,
      approvedTerm: application.approvedTerm,
      approvedRate: application.approvedRate,
      status: application.status,
      currentNode,
      nodeCode: currentNode,
      currentNodeName: nodeName,
      nodeName,
      currentStatus,
      nodeStatus: currentStatus,
      currentStatusName: nodeStatusName,
      nodeStatusName,
      phaseCode,
      phaseName: this.resolveFlowPhaseName(application, phaseCode),
      productName: application.product?.name,
      funderName: application.funder?.name,
      creatorName: application.creator?.nickName || application.creator?.userName,
      createdAt: application.createdAt,
      updatedAt: application.updatedAt
    }
  }

  private mapApplicationDetail(application: ApplicationWithIncludes) {
    const customer = application.customer
    const vehicles = Array.isArray(customer?.vehicles) ? customer.vehicles : []
    const vehicle = vehicles[0] || vehicles.at?.(0)
    const currentNode = Number(application.currentNode)
    const currentStatus = Number(application.currentStatus)
    const phaseCode = this.resolveFlowPhaseCode(application)
    const currentNodeName = this.resolveFlowNodeName(application)
    const currentStatusName = FLOW_STATUS_LABELS[currentStatus] || String(application.currentStatus)
    const files = this.mapDetailFiles(application.files)
    const mappedRepayments = this.mapRepayments(application.repayments)

    return omitEmptyValues({
      id: application.id,
      applicationNo: application.applicationNo,
      orderNo: application.applicationNo,
      creditOrderId: application.applicationNo,
      customerName: customer?.name || '',
      phone: customer?.phone || '',
      idCard: customer?.idCard || '',
      vehicleId: vehicle?.id,
      plateNumber: vehicle?.plateNumber || '',
      vehicleBrand: vehicle?.brand || '',
      vehicleModel: vehicle?.model || '',
      vehicleOwner: vehicle?.ownerName || '',
      productName: application.product?.name || '',
      funderName: application.funder?.name || '',
      orgName: application.org?.name || '',
      amount: application.amount,
      term: application.term,
      rate: application.rate,
      approvedAmount: application.approvedAmount,
      approvedTerm: application.approvedTerm,
      approvedRate: application.approvedRate,
      repaymentMethod: application.repaymentMethod,
      purpose: application.purpose,
      status: application.status,
      businessType: application.businessType,
      currentNode,
      nodeCode: currentNode,
      currentNodeName,
      currentStatus,
      nodeStatus: currentStatus,
      currentStatusName,
      phaseCode,
      phaseName: this.resolveFlowPhaseName(application, phaseCode),
      supplementReason: application.supplementReason,
      supplementDeadline: application.supplementDeadline,
      remark: application.remark,
      creatorName: application.creator?.nickName || application.creator?.userName,
      createdAt: application.createdAt,
      updatedAt: application.updatedAt,
      order: this.mapDetailOrder(
        application,
        currentNode,
        currentStatus,
        currentNodeName,
        currentStatusName,
        phaseCode
      ),
      customer: customer ? this.mapDetailCustomer(customer) : undefined,
      vehicle: vehicle ? this.mapDetailVehicle(vehicle) : undefined,
      vehicles: vehicles.map((item) => this.mapDetailVehicle(item)),
      product: application.product ? this.mapDetailProduct(application.product) : undefined,
      funder: application.funder ? this.mapDetailFunder(application.funder) : undefined,
      org: application.org ? this.mapDetailOrg(application.org) : undefined,
      creator: application.creator ? this.mapDetailCreator(application.creator) : undefined,
      files,
      approvals: this.mapApprovals(application.approvals),
      sign: application.signRecord ? this.mapSignRecord(application.signRecord) : null,
      disbursement: application.disbursement
        ? this.mapDisbursement(application.disbursement)
        : null,
      repaymentSummary: this.buildRepaymentSummary(application.repayments ?? []),
      repayments: mappedRepayments
    })
  }

  private mapDetailOrder(
    application: ApplicationWithIncludes,
    currentNode: number,
    currentStatus: number,
    currentNodeName: string,
    currentStatusName: string,
    phaseCode: number
  ) {
    return omitEmptyValues({
      id: application.id,
      applicationNo: application.applicationNo,
      orderNo: application.applicationNo,
      creditOrderId: application.applicationNo,
      amount: application.amount,
      term: application.term,
      rate: application.rate,
      repaymentMethod: application.repaymentMethod,
      purpose: application.purpose,
      status: application.status,
      businessType: application.businessType,
      currentNode,
      currentNodeName,
      currentStatus,
      currentStatusName,
      phaseCode,
      phaseName: this.resolveFlowPhaseName(application, phaseCode),
      approvedAmount: application.approvedAmount,
      approvedTerm: application.approvedTerm,
      approvedRate: application.approvedRate,
      supplementReason: application.supplementReason,
      supplementDeadline: application.supplementDeadline,
      remark: application.remark,
      createdAt: application.createdAt,
      updatedAt: application.updatedAt
    })
  }

  private mapDetailCustomer(customer: Customer) {
    return omitEmptyValues({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      idCard: customer.idCard,
      gender: customer.gender,
      birthDate: customer.birthDate,
      nation: customer.nation,
      householdAddress: customer.householdAddress,
      issuingAuthority: customer.issuingAuthority,
      idCardValidFrom: customer.idCardValidFrom,
      idCardValidTo: customer.idCardValidTo,
      idCardFront: customer.idCardFront,
      idCardBack: customer.idCardBack,
      maritalStatus: customer.maritalStatus,
      education: customer.education,
      occupation: customer.occupation,
      companyName: customer.companyName,
      monthlyIncome: customer.monthlyIncome,
      address: customer.address,
      emergencyName: customer.emergencyName,
      emergencyPhone: customer.emergencyPhone,
      status: customer.status
    })
  }

  private mapDetailVehicle(vehicle: Vehicle) {
    return omitEmptyValues({
      id: vehicle.id,
      plateNumber: vehicle.plateNumber,
      vin: vehicle.vin,
      vehicleCode: vehicle.vin,
      brand: vehicle.brand,
      model: vehicle.model,
      ownerName: vehicle.ownerName,
      address: vehicle.address,
      usageNature: vehicle.usageNature,
      sealInfo: vehicle.sealInfo,
      engineNumber: vehicle.engineNumber,
      registerDate: vehicle.registerDate,
      vehicleImgUrl: vehicle.vehicleImgUrl,
      color: vehicle.color,
      year: vehicle.year,
      mileage: vehicle.mileage,
      purchasePrice: vehicle.purchasePrice,
      estimateValue: vehicle.estimateValue,
      isMortgaged: vehicle.isMortgaged,
      mortgageInfo: vehicle.mortgageInfo
    })
  }

  private mapDetailProduct(product: Product) {
    return omitEmptyValues({
      id: product.id,
      name: product.name,
      productType: product.productType,
      minRate: product.minRate,
      maxRate: product.maxRate,
      minAmount: product.minAmount,
      maxAmount: product.maxAmount,
      minTerm: product.minTerm,
      maxTerm: product.maxTerm,
      repaymentMethod: product.repaymentMethod,
      minAge: product.minAge,
      maxAge: product.maxAge,
      maxCarAge: product.maxCarAge,
      maxMileage: product.maxMileage,
      ltvLimit: product.ltvLimit,
      minDownPayment: product.minDownPayment,
      regions: product.regions,
      valuationDiscountRate: product.valuationDiscountRate,
      status: product.status,
      fileChecklist: product.fileChecklist
    })
  }

  private mapDetailFunder(funder: Funder) {
    return omitEmptyValues({
      id: funder.id,
      name: funder.name,
      code: funder.code,
      funderType: funder.funderType,
      contactName: funder.contactName,
      contactPhone: funder.contactPhone,
      integrationMode: funder.integrationMode,
      creditLimit: funder.creditLimit,
      priority: funder.priority,
      status: funder.status
    })
  }

  private mapDetailOrg(org: Organization) {
    return omitEmptyValues({
      id: org.id,
      name: org.name,
      code: org.code,
      creditCode: org.creditCode,
      contactName: org.contactName,
      contactPhone: org.contactPhone,
      address: org.address,
      status: org.status,
      packageType: org.packageType,
      expireAt: org.expireAt,
      apiEnabled: org.apiEnabled
    })
  }

  private mapDetailCreator(creator: Pick<User, 'id' | 'userName' | 'nickName'>) {
    return omitEmptyValues({
      id: creator.id,
      userName: creator.userName,
      nickName: creator.nickName,
      name: creator.nickName || creator.userName
    })
  }

  private mapDetailFiles(files: ApplicationFile[] = []) {
    const result: Record<string, unknown>[] = []
    const seen = new Set<string>()

    for (const file of files) {
      if (!file?.fileUrl) continue
      const key = `${file.fileType || ''}:${file.fileUrl}`
      if (seen.has(key)) continue
      seen.add(key)
      result.push(
        omitEmptyValues({
          id: file.id,
          fileType: file.fileType,
          fileTypeName: DETAIL_FILE_TYPE_LABELS[file.fileType] || file.fileType,
          fileUrl: file.fileUrl,
          fileName: file.fileName,
          isValid: file.isValid,
          createdAt: file.createdAt
        })
      )
    }

    return result
  }

  private mapApprovals(approvals: Array<ApprovalRecord & { approver?: Pick<User, 'id' | 'userName' | 'nickName'> | null }> = []) {
    return approvals.map((approval) =>
      omitEmptyValues({
        id: approval.id,
        stage: approval.stage,
        action: approval.action,
        opinion: approval.opinion,
        amount: approval.amount,
        term: approval.term,
        rate: approval.rate,
        approverId: approval.approverId,
        approverName: approval.approver?.nickName || approval.approver?.userName,
        createdAt: approval.createdAt
      })
    )
  }

  private mapSignRecord(record: SignRecord) {
    return omitEmptyValues({
      id: record.id,
      status: record.status,
      contractUrl: record.contractUrl,
      signedAt: record.signedAt,
      videoUrl: record.videoUrl,
      expiredAt: record.expiredAt,
      cancelledReason: record.cancelledReason
    })
  }

  private mapDisbursement(disbursement: Disbursement) {
    return omitEmptyValues({
      id: disbursement.id,
      status: disbursement.status,
      gpsDeviceNo: disbursement.gpsDeviceNo,
      gpsInstallImg: disbursement.gpsInstallImg,
      gpsInstallAt: disbursement.gpsInstallAt,
      mortgageStatus: disbursement.mortgageStatus,
      mortgageImg: disbursement.mortgageImg,
      mortgageAt: disbursement.mortgageAt,
      disburseAmount: disbursement.disburseAmount,
      disburseAccount: disbursement.disburseAccount,
      disburseAt: disbursement.disburseAt,
      transactionNo: disbursement.transactionNo,
      voucherUrl: disbursement.voucherUrl,
      remark: disbursement.remark
    })
  }

  private mapRepayments(repayments: RepaymentPlan[] = []) {
    return repayments.map((repayment) =>
      omitEmptyValues({
        id: repayment.id,
        period: repayment.period,
        dueDate: repayment.dueDate,
        principal: repayment.principal,
        interest: repayment.interest,
        totalAmount: repayment.totalAmount,
        paidPrincipal: repayment.paidPrincipal,
        paidInterest: repayment.paidInterest,
        paidTotal: repayment.paidTotal,
        status: repayment.status,
        overdueDays: repayment.overdueDays,
        penaltyAmount: repayment.penaltyAmount,
        paidAt: repayment.paidAt
      })
    )
  }

  private buildRepaymentSummary(repayments: RepaymentPlan[] = []) {
    return {
      totalPeriods: repayments.length,
      paidPeriods: repayments.filter((item) => item.status === RepaymentStatus.PAID).length,
      overduePeriods: repayments.filter((item) => item.status === RepaymentStatus.OVERDUE).length,
      unpaidAmount: repayments.reduce((sum, item) => {
        if (item.status === RepaymentStatus.PAID) return sum
        return sum + Number(item.totalAmount || 0) - Number(item.paidTotal || 0)
      }, 0)
    }
  }

  private mapFlowApplication(application: ApplicationWithFlow) {
    const customer = application.customer
    const vehicles = Array.isArray(customer?.vehicles) ? customer.vehicles : []
    const vehicle = vehicles[0] || vehicles.at?.(0)
    const currentNode = Number(application.currentNode)
    const currentStatus = Number(application.currentStatus)
    const phaseCode = this.resolveFlowPhaseCode(application)
    const nodeName = this.resolveFlowNodeName(application)
    const nodeStatusName = FLOW_STATUS_LABELS[currentStatus] || String(application.currentStatus)
    return {
      ...application,
      customer,
      vehicle,
      vehicles,
      applicationNo: application.applicationNo,
      creditOrderId: application.applicationNo,
      orderNo: application.applicationNo,
      amount: application.amount,
      term: application.term,
      rate: application.rate,
      approvedAmount: application.approvedAmount,
      approvedTerm: application.approvedTerm,
      approvedRate: application.approvedRate,
      status: application.status,
      currentNode,
      nodeCode: currentNode,
      currentNodeName: nodeName,
      nodeName,
      currentStatus,
      nodeStatus: currentStatus,
      currentStatusName: nodeStatusName,
      nodeStatusName,
      phaseCode,
      phaseName: this.resolveFlowPhaseName(application, phaseCode),
      customerName: customer?.name || '',
      name: customer?.name || '',
      phone: customer?.phone || '',
      customerPhone: customer?.phone || '',
      plateNumber: vehicle?.plateNumber || '',
      vehicleBrand: vehicle?.brand || '',
      vehicleModel: vehicle?.model || '',
      productName: application.product?.name,
      funderName: application.funder?.name,
      orgName: application.org?.name,
      creatorName: application.creator?.nickName || application.creator?.userName,
      createdAt: application.createdAt,
      updatedAt: application.updatedAt
    }
  }

  private resolveFlowNodeName(application: ApplicationWithFlow): string {
    const flowConfigs = application.org?.flowConfigs
    const config = Array.isArray(flowConfigs)
      ? flowConfigs.find(
          (item: Record<string, unknown>) =>
            item.businessType === application.businessType &&
            String(item.nodeCode) === String(application.currentNode)
        )
      : null
    return (
      String(config?.nodeName || '') ||
      this.getFlowMappings().nodeNames[Number(application.currentNode)] ||
      String(application.currentNode)
    )
  }

  private resolveFlowPhaseCode(application: ApplicationWithFlow) {
    const currentNode = Number(application.currentNode)
    const flowConfigs = application.org?.flowConfigs
    const config = Array.isArray(flowConfigs)
      ? flowConfigs.find(
          (item: Record<string, unknown>) =>
            item.businessType === application.businessType &&
            String(item.nodeCode) === String(application.currentNode)
        )
      : null

    const ruleConfig = config?.ruleConfig as Record<string, unknown> | undefined
    const phaseCode = Number(ruleConfig?.phaseCode || this.getFlowMappings().nodePhases[currentNode])
    return Number.isFinite(phaseCode) ? phaseCode : currentNode
  }

  private resolveFlowPhaseName(application: ApplicationWithFlow, phaseCode: number) {
    const flowConfigs = application.org?.flowConfigs
    const config = Array.isArray(flowConfigs)
      ? flowConfigs.find(
          (item: Record<string, unknown>) =>
            item.businessType === application.businessType &&
            String(item.nodeCode) === String(application.currentNode)
        )
      : null

    const ruleConfig = config?.ruleConfig as Record<string, unknown> | undefined
    return (
      (typeof ruleConfig?.phaseName === 'string' ? ruleConfig.phaseName : '') ||
      this.getFlowMappings().phaseNames[phaseCode] ||
      this.resolveFlowNodeName(application)
    )
  }

  // ==================== 生命周期时间轴 ====================

  /**
   * 获取订单生命周期节点列表，用于前端时间轴展示
   * 返回扁平化的每个处理步骤，包含审批/提交/完成记录
   */
  async getLifecycle(id: number) {
    const tenantId = getCurrentTenantId()
    const where = { id, tenantId }

    const application = await this.prisma.application.findFirst({
      where,
      include: {
        approvals: {
          orderBy: { createdAt: 'asc' },
          include: {
            approver: { select: { id: true, userName: true, nickName: true } },
          },
        },
        disbursement: true,
      },
    })

    if (!application) throw new NotFoundException('订单不存在')

    // 获取全部流程节点配置（按 sort 排序）
    const flowNodes = await this.prisma.flowConfig.findMany({
      where: { businessType: 'CAR_LOAN', status: 'ACTIVE' },
      orderBy: { nodeCode: 'asc' },
      select: { nodeCode: true, nodeName: true, ruleConfig: true },
    })

    // 构建 nodeCode → nodeName 映射
    const nodeNameMap: Record<string, string> = {}
    const nodeSortMap: Record<string, number> = {}
    for (const node of flowNodes) {
      nodeNameMap[node.nodeCode] = node.nodeName
      const rc = (node.ruleConfig as Record<string, unknown>) || {}
      nodeSortMap[node.nodeCode] = (rc.sort as number) || Number(node.nodeCode)
    }

    // 构建审批记录索引：stage → 最新审批（同一 stage 只保留最新）
    const approvalByStage = new Map<string, typeof application.approvals[number]>()
    for (const approval of application.approvals) {
      const prev = approvalByStage.get(approval.stage)
      if (!prev || new Date(approval.createdAt).getTime() >= new Date(prev.createdAt).getTime()) {
        approvalByStage.set(approval.stage, approval)
      }
    }

    // stage 字符串 → nodeCode 数字映射（与 Prisma 枚举一致）
    const STAGE_TO_NODE: Record<string, string> = {
      RISK_PRE: '1200',
      FUNDER_PRE: '1250',
      SUPPLEMENT: '1300',
      FIRST_REVIEW: '1400',
      FINAL_REVIEW: '1450',
      FUNDER_REVIEW: '1500',
      LOAN_REQUEST: '1700',
    }

    // 反向索引：nodeCode → 最新 approval，用于按 nodeCode 查找
    const approvalByNode = new Map<string, typeof application.approvals[number]>()
    for (const [stage, approval] of approvalByStage) {
      const nodeCode = STAGE_TO_NODE[stage]
      if (nodeCode) {
        const prev = approvalByNode.get(nodeCode)
        if (!prev || new Date(approval.createdAt).getTime() >= new Date(prev.createdAt).getTime()) {
          approvalByNode.set(nodeCode, approval)
        }
      }
    }

    const currentNodeNum = Number(application.currentNode)
    const currentNodeStr = String(application.currentNode || '')

    // 遍历全部节点，只展示已到达的节点（nodeCode <= currentNode）
    const lifecycle: Record<string, unknown>[] = []

    for (const node of flowNodes) {
      const nodeNum = Number(node.nodeCode)
      // 跳过并行子节点（有 parentNode 的）
      const rc = (node.ruleConfig as Record<string, unknown>) || {}
      if (rc.parentNode) continue

      // 只展示当前节点及之前的节点
      if (nodeNum > currentNodeNum) continue

      const stage = node.nodeCode
      const approval = approvalByNode.get(stage)
      const isCurrentNode = stage === currentNodeStr
      const isPending = isCurrentNode && application.currentStatus === 10

      if (approval) {
        lifecycle.push({
          id: approval.id,
          currentNode: stage,
          currentNodeName: nodeNameMap[stage] || stage,
          nextNode: null,
          approveName: approval.approver?.nickName || approval.approver?.userName || null,
          approvalTime: this.formatDatetime(approval.createdAt),
          approvalReason: approval.opinion || null,
          rejectReason: approval.action === 'REJECT' ? (approval.opinion || null) : null,
          approvalStatus: this.mapApprovalActionToStatus(approval.action),
          approvalCost: approval.amount || null,
        })
      } else if (isPending) {
        lifecycle.push({
          id: null,
          currentNode: stage,
          currentNodeName: nodeNameMap[stage] || stage,
          nextNode: null,
          approveName: null,
          approvalTime: null,
          approvalReason: null,
          rejectReason: null,
          approvalStatus: '待处理',
          approvalCost: null,
        })
      } else {
        // 已经过的节点，没有审批记录（如客户提交、系统自动流转）
        lifecycle.push({
          id: null,
          currentNode: stage,
          currentNodeName: nodeNameMap[stage] || stage,
          nextNode: null,
          approveName: null,
          approvalTime: application.createdAt ? this.formatDatetime(application.createdAt) : null,
          approvalReason: null,
          rejectReason: null,
          approvalStatus: '已完成',
          approvalCost: null,
        })
      }
    }

    // 补充特殊备注来源（补件原因 / 放款备注）
    for (const item of lifecycle) {
      const nc = String(item.currentNode)
      if (nc === '1300' && !item.approvalReason && application.supplementReason) {
        item.approvalReason = application.supplementReason
      }
      if (nc === '1800' && !item.approvalReason && application.disbursement?.remark) {
        item.approvalReason = application.disbursement.remark
      }
    }

    // 按 sort 降序（最新在前）
    lifecycle.sort((a, b) => {
      const sa = nodeSortMap[String(a.currentNode)] || 0
      const sb = nodeSortMap[String(b.currentNode)] || 0
      return sb - sa
    })

    return lifecycle
  }

  private formatDatetime(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
  }

  private mapApprovalActionToStatus(action: string): string {
    const map: Record<string, string> = {
      PASS: '通过',
      REJECT: '拒绝',
      SUPPLEMENT: '要求补件',
    }
    return map[action] || action
  }

  // ==================== 还款计划生成（内部使用） ====================

  /**
   * 放款确认时自动生成等额本金还款计划
   * @deprecated 此方法已迁移至 RepaymentService.createRepaymentPlansIfNeeded
   * 保留在 ApplicationService 作为内部辅助，实际调用已走 RepaymentService
   */
  private async createRepaymentPlansIfNeeded(
    tx: Prisma.TransactionClient,
    application: ApplicationWithIncludes,
    dto: { disburseAmount: number; disburseAt?: Date | string | null; firstDueDate?: Date | string | null }
  ) {
    const existed = await tx.repaymentPlan.count({ where: { applicationId: application.id } })
    if (existed > 0) return

    const term = Number(application.approvedTerm ?? application.term)
    const amount = Number(dto.disburseAmount)
    const annualRate = Number(application.approvedRate ?? application.rate)
    const monthlyRate = annualRate / 100 / 12
    const roundedMonthlyPrincipal = Math.round((amount / term) * 100) / 100

    const baseDueDate = dto.firstDueDate
      ? new Date(dto.firstDueDate)
      : new Date(dto.disburseAt || new Date())
    if (!dto.firstDueDate) baseDueDate.setMonth(baseDueDate.getMonth() + 1)

    const plans = Array.from({ length: term }, (_, index) => {
      const dueDate = new Date(baseDueDate)
      dueDate.setMonth(baseDueDate.getMonth() + index)
      const principal =
        index === term - 1
          ? Math.round((amount - roundedMonthlyPrincipal * (term - 1)) * 100) / 100
          : roundedMonthlyPrincipal
      const remainingPrincipal = Math.round((amount - roundedMonthlyPrincipal * index) * 100) / 100
      const interest = Math.round(remainingPrincipal * monthlyRate * 100) / 100
      return {
        tenantId: getCurrentTenantId()!,
        applicationId: application.id,
        period: index + 1,
        dueDate,
        principal,
        interest,
        totalAmount: Math.round((principal + interest) * 100) / 100,
        status: RepaymentStatus.NOT_DUE
      }
    })

    await tx.repaymentPlan.createMany({ data: plans })
  }
}
