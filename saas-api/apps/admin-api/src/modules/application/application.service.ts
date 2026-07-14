import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import {
  ApplicationStatus,
  ApprovalAction,
  DisbursementStatus,
  LeadStatus,
  Prisma,
  SignStatus,
} from '@prisma/client'
import { BaseBusinessCrudService, omitNested } from '../base-business-crud.service'
import { DataScopeService } from '../../common/auth/data-scope.service'
import { getCurrentTenantId } from '../../common/tenant/tenant-context'
import { createApplicationWithUniqueNo } from '../../common/utils/application-no'
import { getPagination, toPaginatedResponse } from '../../common/utils/pagination'
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
import { ApplicationMapper, ApplicationWithFlow, ApplicationWithIncludes } from './application.mapper'
import type { PrismaModelDelegate } from '../base-business-crud.service'

function hasQueryValue(value: unknown) { return value !== undefined && value !== null && value !== '' }

function firstQueryString(...values: unknown[]) {
  for (const value of values) { if (hasQueryValue(value)) return String(value).trim() }
  return ''
}

function containsText(value: string) { return { contains: value, mode: 'insensitive' as const } }

@Injectable()
export class ApplicationService extends BaseBusinessCrudService<
  CreateApplicationDto, UpdateApplicationDto, ApplicationQueryDto
> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dataScopeService: DataScopeService,
    private readonly approvalWorkflow: ApprovalWorkflowService,
    private readonly notificationService: NotificationService,
    private readonly repaymentService: RepaymentService,
    private readonly disbursementService: DisbursementService,
    private readonly mapper: ApplicationMapper,
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
          const nodePhases = this.mapper.getFlowMappings().nodePhases
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
      detailInclude: { org: { include: { flowConfigs: true } }, customer: { include: { vehicles: { orderBy: { id: 'desc' } } } }, product: true, funder: true, creator: { select: { id: true, userName: true, nickName: true } }, files: { orderBy: { createdAt: 'desc' } }, approvals: { orderBy: { createdAt: 'desc' }, include: { approver: { select: { id: true, userName: true, nickName: true } } } }, signRecord: true, disbursement: true, repayments: { orderBy: { period: 'asc' } } },
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

  // ==================== CRUD 覆写 ====================

  override async getList(query: ApplicationQueryDto) {
    await this.mapper.loadFlowMappings(query.orgId)
    return super.getList(query)
  }

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
    return this.mapper.mapApplicationDetail(application as unknown as ApplicationWithIncludes)
  }

  // ==================== 流程/订单列表 ====================

  async getFlowList(query: ApplicationQueryDto) {
    await this.mapper.loadFlowMappings(query.orgId)
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
    return toPaginatedResponse(records.map((r: unknown) => this.mapper.mapFlowApplication(r as unknown as ApplicationWithFlow)), total, pagination)
  }

  async getOrderList(query: OrderListQueryDto) {
    await this.mapper.loadFlowMappings(query.orgId)
    const pagination = getPagination({ current: query.current ?? query.pageNum, size: query.size ?? query.pageSize })
    const where = this.buildOrderListWhere(query)
    const [records, total] = await this.prisma.$transaction([
      this.prisma.application.findMany({ where, skip: pagination.skip, take: pagination.take, orderBy: { id: 'desc' }, include: { org: { include: { flowConfigs: true } }, customer: true, product: true, funder: true, creator: { select: { id: true, userName: true, nickName: true } } } }),
      this.prisma.application.count({ where })
    ])
    return toPaginatedResponse(records.map((r: unknown) => this.mapper.mapOrderListItem(r as unknown as ApplicationWithFlow)), total, pagination)
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

  // ==================== 签约流程 ====================

  async startSigning(id: number, dto: StartSigningDto) {
    await this.approvalWorkflow.findAndAssertStatus(
      id, [ApplicationStatus.FINAL_REVIEW_PASSED, ApplicationStatus.FUNDER_REVIEW_PASSED], '当前状态不允许发起签约'
    )
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const tenantId = getCurrentTenantId()!
      await tx.signRecord.upsert({
        where: { applicationId: id },
        update: { status: SignStatus.SENT, contractUrl: dto.contractUrl, expiredAt: dto.expiredAt },
        create: { tenantId, applicationId: id, status: SignStatus.SENT, contractUrl: dto.contractUrl, expiredAt: dto.expiredAt }
      })
      const result = await tx.application.update({
        where: { id }, data: { status: ApplicationStatus.PENDING_SIGN, ...flowPatch(ApplicationStatus.PENDING_SIGN) }
      })
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
        where: { id }, data: { status: ApplicationStatus.PENDING_LOAN_REQUEST, ...flowPatch(ApplicationStatus.PENDING_LOAN_REQUEST) }
      })
    })
  }

  // ==================== 请款审核 ====================

  async submitLoanRequest(id: number, dto: RequestDisbursementDto) {
    const application = await this.approvalWorkflow.findAndAssertStatus(
      id, [ApplicationStatus.SIGNED, ApplicationStatus.PENDING_LOAN_REQUEST, ApplicationStatus.LOAN_REQUEST_REJECTED], '当前状态不允许提交请款资料'
    )
    return this.prisma.application.update({
      where: { id }, data: { status: ApplicationStatus.LOAN_REQUEST_REVIEWING, ...flowPatch(ApplicationStatus.LOAN_REQUEST_REVIEWING), remark: dto.remark ?? application.remark }
    })
  }

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

  async requestDisbursement(id: number, dto: RequestDisbursementDto) {
    await this.approvalWorkflow.findAndAssertStatus(id, [ApplicationStatus.LOAN_REQUEST_APPROVED, ApplicationStatus.PENDING_DISBURSEMENT], '当前状态不允许提交资方放款申请')
    return this.disbursementService.requestDisbursement(id, dto)
  }

  // ==================== 放款确认 ====================

  async confirmDisbursement(id: number, dto: ConfirmDisbursementDto) {
    const application = await this.approvalWorkflow.findAndAssertStatus(id, [ApplicationStatus.PENDING_DISBURSEMENT], '当前状态不允许放款确认')
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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

      await this.repaymentService.createRepaymentPlansIfNeeded(tx, application, dto)

      if (application.sourceLeadId) {
        await tx.lead.update({ where: { id: application.sourceLeadId }, data: { status: LeadStatus.CONVERTED } })
      }

      const result = await tx.application.update({
        where: { id }, data: { status: ApplicationStatus.DISBURSED, ...flowPatch(ApplicationStatus.DISBURSED) }
      })
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
      await this.repaymentService.settleApplication(tx, id)
      const result = await tx.application.update({
        where: { id }, data: { status: ApplicationStatus.SETTLED, ...flowPatch(ApplicationStatus.SETTLED), remark: dto.remark ?? application.remark }
      })
      await this.notificationService.sendOnLoanSettled(id, result).catch(() => {})
      return result
    })
  }

  // ==================== 生命周期 → 委托 ApplicationMapper ====================

  async getLifecycle(id: number) {
    return this.mapper.getLifecycle(id)
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

  private async assertSameOrg(model: PrismaModelDelegate, id: number | undefined, orgId: number, notFoundMessage: string, mismatchMessage: string) {
    if (id === undefined || id === null) return
    const item = await this.getScopedRelated(model, id, notFoundMessage)
    if (item.orgId !== orgId) throw new BadRequestException(mismatchMessage)
  }

  private async getScopedRelated(model: PrismaModelDelegate, id: number | undefined, message: string) {
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

  // ==================== 订单列表查询条件 ====================

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
      const nodePhases = this.mapper.getFlowMappings().nodePhases
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
}
