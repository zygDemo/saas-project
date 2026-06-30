import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import {
  ApplicationStatus,
  ApprovalAction,
  DisbursementStatus,
  LeadStatus,
  Prisma,
  RepaymentStatus,
  SignStatus
} from '@prisma/client'
import { BaseBusinessCrudService, omitNested } from '../base-business-crud.service'
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
  CompleteSupplementDto,
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

const FLOW_STATUS_LABELS: Record<number, string> = {
  0: '未开始',
  10: '处理中',
  20: '已通过',
  30: '已拒绝',
  40: '已退回',
  50: '待补充',
  90: '已完成'
}

interface FlowMappingCache {
  nodeNames: Record<number, string>
  nodePhases: Record<number, number>
  phaseNames: Record<number, string>
}

const EMPTY_FLOW_MAPPINGS: FlowMappingCache = {
  nodeNames: {},
  nodePhases: {},
  phaseNames: {}
}

function hasQueryValue(value: unknown) {
  return value !== undefined && value !== null && value !== ''
}

function firstQueryString(...values: unknown[]) {
  for (const value of values) {
    if (hasQueryValue(value)) return String(value).trim()
  }
  return ''
}

function containsText(value: string) {
  return { contains: value, mode: 'insensitive' as const }
}

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

function flowPatch(status: ApplicationStatus) {
  return flowByApplicationStatus(status)
}

const DETAIL_FILE_TYPE_LABELS: Record<string, string> = {
  ID_CARD_FRONT: '身份证人像面',
  ID_CARD_BACK: '身份证国徽面',
  VEHICLE_LICENSE: '行驶证',
  VEHICLE_IMAGE: '车辆照片',
  BANK_CARD: '银行卡',
  CONTRACT: '合同',
  OTHER: '其他材料'
}

function omitEmptyValues(source: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(source).filter(([, value]) => value !== undefined))
}

@Injectable()
export class ApplicationService extends BaseBusinessCrudService<
  CreateApplicationDto,
  UpdateApplicationDto,
  ApplicationQueryDto
> {
  private flowMappingsCache: FlowMappingCache | null = null
  private flowMappingsOrgId?: number

  constructor(
    private readonly prisma: PrismaService,
    private readonly flowConfigService: FlowConfigService
  ) {
    super({
      model: prisma.application,
      prisma,
      searchableFields: ['applicationNo'],
      exactFields: [
        'orgId',
        'status',
        'customerId',
        'creatorId',
        'businessType',
        'currentNode',
        'currentStatus'
      ],
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
          const phaseNodeCodes = Object.entries(nodePhases)
            .filter(([, code]) => code === phaseCode)
            .map(([node]) => Number(node))
          where.currentNode = phaseNodeCodes.length ? { in: phaseNodeCodes } : phaseCode
        }
        if (hasQueryValue(query.currentStatus)) where.currentStatus = query.currentStatus

        if (hasQueryValue(query.applicationNo)) where.applicationNo = containsText(String(query.applicationNo))

        return where
      },
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
        data.status = dto.status || ApplicationStatus.DRAFT
        data.businessType = dto.businessType || 'CAR_LOAN'
        const flow = flowPatch(data.status as ApplicationStatus)
        data.currentNode = dto.currentNode ?? flow.currentNode
        data.currentStatus = dto.currentStatus ?? flow.currentStatus
        if (dto.files?.length) {
          data.files = { create: dto.files }
        }
        return data
      },
      beforeUpdate: (dto) => omitNested(dto as unknown as Record<string, unknown>, ['files'])
    })
  }

  /**
   * 从数据库预加载流程映射缓存，供 buildWhere 等同步方法使用。
   * 不传 orgId 时查询所有机构聚合映射。
   */
  private async loadFlowMappings(orgId?: number) {
    if (this.flowMappingsCache && this.flowMappingsOrgId === orgId) return
    this.flowMappingsCache = await this.flowConfigService.getFlowMappings(orgId)
    this.flowMappingsOrgId = orgId
  }

  /** 同步获取已缓存的流程映射 */
  private getFlowMappings(): FlowMappingCache {
    return this.flowMappingsCache || EMPTY_FLOW_MAPPINGS
  }

  override async getList(query: ApplicationQueryDto) {
    await this.loadFlowMappings(query.orgId)
    return super.getList(query)
  }

  override async create(dto: CreateApplicationDto) {
    if (dto.applicationNo) return super.create(dto)

    return createApplicationWithUniqueNo((applicationNo) =>
      super.create({
        ...dto,
        applicationNo
      })
    )
  }

  override async getDetail(id: number) {
    const where: Record<string, unknown> = { id }
    const tenantId = getCurrentTenantId()
    if (tenantId) where.tenantId = tenantId

    const application = await this.prisma.application.findFirst({
      where,
      include: {
        org: {
          include: {
            flowConfigs: true
          }
        },
        customer: {
          include: {
            vehicles: {
              orderBy: { id: 'desc' }
            }
          }
        },
        product: true,
        funder: true,
        creator: { select: { id: true, userName: true, nickName: true } },
        files: { orderBy: { createdAt: 'desc' } },
        approvals: {
          orderBy: { createdAt: 'desc' },
          include: {
            approver: { select: { id: true, userName: true, nickName: true } }
          }
        },
        signRecord: true,
        disbursement: true,
        repayments: { orderBy: { period: 'asc' } }
      }
    })

    if (!application) throw new NotFoundException('数据不存在')
    return this.mapApplicationDetail(application)
  }

  async getFlowList(query: ApplicationQueryDto) {
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
    if (query.applicationNo) {
      where.applicationNo = { contains: query.applicationNo, mode: 'insensitive' }
    }

    const [records, total] = await this.prisma.$transaction([
      this.prisma.application.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { id: 'desc' },
        include: {
          org: { include: { flowConfigs: true } },
          customer: true,
          product: true,
          funder: true,
          creator: { select: { id: true, userName: true, nickName: true } }
        }
      }),
      this.prisma.application.count({ where })
    ])

    return toPaginatedResponse(
      records.map((record: Record<string, unknown>) => this.mapFlowApplication(record)),
      total,
      pagination
    )
  }

  async getOrderList(query: OrderListQueryDto) {
    await this.loadFlowMappings(query.orgId)
    const pagination = getPagination({
      current: query.current ?? query.pageNum,
      size: query.size ?? query.pageSize
    })
    const where = this.buildOrderListWhere(query)

    const [records, total] = await this.prisma.$transaction([
      this.prisma.application.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { id: 'desc' },
        include: {
          org: { include: { flowConfigs: true } },
          customer: true,
          product: true,
          funder: true,
          creator: { select: { id: true, userName: true, nickName: true } }
        }
      }),
      this.prisma.application.count({ where })
    ])

    return toPaginatedResponse(
      records.map((record: Record<string, unknown>) => this.mapOrderListItem(record)),
      total,
      pagination
    )
  }

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

  async precheckPass(id: number, dto: PrecheckActionDto) {
    return this.riskPrePass(id, dto)
  }

  async riskPrePass(id: number, dto: PrecheckActionDto) {
    if (dto.reviewerId) await this.ensureRelatedExists(this.prisma.user, dto.reviewerId, '预审人不存在')
    return this.atomicTransition(
      id,
      [ApplicationStatus.SUBMITTED, ApplicationStatus.PENDING_RISK_PRE],
      '当前状态不允许风控预审通过',
      {
        status: ApplicationStatus.PENDING_FUNDER_PRE,
        ...flowPatch(ApplicationStatus.PENDING_FUNDER_PRE)
      }
    )
  }

  async riskPreReject(id: number, dto: PrecheckActionDto) {
    if (dto.reviewerId) await this.ensureRelatedExists(this.prisma.user, dto.reviewerId, '预审人不存在')
    const application = await this.findAndAssertStatus(
      id,
      [ApplicationStatus.SUBMITTED, ApplicationStatus.PENDING_RISK_PRE],
      '当前状态不允许风控预审拒绝'
    )
    return this.prisma.application.update({
      where: { id },
      data: {
        status: ApplicationStatus.RISK_PRE_REJECTED,
        ...flowPatch(ApplicationStatus.RISK_PRE_REJECTED),
        remark: dto.opinion ?? application.remark
      }
    })
  }

  async funderPrePass(id: number, dto: FunderReviewDto) {
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

  async funderPreReject(id: number, dto: FunderReviewDto) {
    await this.ensureRelatedExists(this.prisma.user, dto.approverId, '处理人不存在')
    return this.transitionWithApproval(
      id,
      [ApplicationStatus.PENDING_FUNDER_PRE],
      '当前状态不允许资方预审拒绝',
      { approverId: dto.approverId, stage: 'FUNDER_PRE', action: ApprovalAction.REJECT, opinion: dto.opinion || dto.funderApprovalNo },
      ApplicationStatus.FUNDER_PRE_REJECTED
    )
  }

  async completeSupplement(id: number, dto: CompleteSupplementDto) {
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

  async approve(id: number, dto: ApprovalActionDto) {
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

  async reject(id: number, dto: ApprovalActionDto) {
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
      '当前状态不允许审批驳回',
      { approverId: dto.approverId, stage: dto.stage || this.resolveApprovalStage(application.status), action: ApprovalAction.REJECT, opinion: dto.opinion, amount: dto.amount, term: dto.term, rate: dto.rate },
      nextStatus,
      {},
      application
    )
  }

  async requestSupplement(id: number, dto: SupplementActionDto) {
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

  async funderPass(id: number, dto: FunderReviewDto) {
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

  async funderReject(id: number, dto: FunderReviewDto) {
    await this.ensureRelatedExists(this.prisma.user, dto.approverId, '审批人不存在')
    return this.transitionWithApproval(
      id,
      [ApplicationStatus.PENDING_FUNDER_REVIEW],
      '当前状态不允许资方审批拒绝',
      { approverId: dto.approverId, stage: 'FUNDER_REVIEW', action: ApprovalAction.REJECT, opinion: dto.opinion || dto.funderApprovalNo, amount: dto.amount, term: dto.term, rate: dto.rate },
      ApplicationStatus.FUNDER_REVIEW_REJECTED
    )
  }

  async startSigning(id: number, dto: StartSigningDto) {
    await this.findAndAssertStatus(
      id,
      [ApplicationStatus.FINAL_REVIEW_PASSED, ApplicationStatus.FUNDER_REVIEW_PASSED],
      '当前状态不允许发起签约'
    )
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const tenantId = getCurrentTenantId()!
      await tx.signRecord.upsert({
        where: { applicationId: id },
        update: { status: SignStatus.SENT, contractUrl: dto.contractUrl, expiredAt: dto.expiredAt },
        create: {
          tenantId,
          applicationId: id,
          status: SignStatus.SENT,
          contractUrl: dto.contractUrl,
          expiredAt: dto.expiredAt
        }
      })
      return tx.application.update({
        where: { id },
        data: {
          status: ApplicationStatus.PENDING_SIGN,
          ...flowPatch(ApplicationStatus.PENDING_SIGN)
        }
      })
    })
  }

  async completeSigning(id: number, dto: CompleteSigningDto) {
    await this.findAndAssertStatus(
      id,
      [ApplicationStatus.PENDING_SIGN],
      '当前状态不允许完成签约'
    )
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const tenantId = getCurrentTenantId()!
      await tx.signRecord.upsert({
        where: { applicationId: id },
        update: {
          status: SignStatus.SIGNED,
          contractUrl: dto.contractUrl,
          videoUrl: dto.videoUrl,
          signedAt: dto.signedAt || new Date()
        },
        create: {
          tenantId,
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
        create: { tenantId, applicationId: id, status: DisbursementStatus.PENDING_APPLICATION }
      })
      return tx.application.update({
        where: { id },
        data: {
          status: ApplicationStatus.PENDING_LOAN_REQUEST,
          ...flowPatch(ApplicationStatus.PENDING_LOAN_REQUEST)
        }
      })
    })
  }

  async submitLoanRequest(id: number, dto: RequestDisbursementDto) {
    const application = await this.findAndAssertStatus(
      id,
      [ApplicationStatus.SIGNED, ApplicationStatus.PENDING_LOAN_REQUEST, ApplicationStatus.LOAN_REQUEST_REJECTED],
      '当前状态不允许提交请款资料'
    )
    return this.prisma.application.update({
      where: { id },
      data: {
        status: ApplicationStatus.LOAN_REQUEST_REVIEWING,
        ...flowPatch(ApplicationStatus.LOAN_REQUEST_REVIEWING),
        remark: dto.remark ?? application.remark
      }
    })
  }

  async approveLoanRequest(id: number, dto: ApprovalActionDto) {
    await this.ensureRelatedExists(this.prisma.user, dto.approverId, '审批人不存在')
    return this.transitionWithApproval(
      id,
      [ApplicationStatus.LOAN_REQUEST_REVIEWING],
      '当前状态不允许请款审核通过',
      { approverId: dto.approverId, stage: 'LOAN_REQUEST', action: ApprovalAction.PASS, opinion: dto.opinion, amount: dto.amount, term: dto.term, rate: dto.rate },
      ApplicationStatus.LOAN_REQUEST_APPROVED
    )
  }

  async rejectLoanRequest(id: number, dto: ApprovalActionDto) {
    await this.ensureRelatedExists(this.prisma.user, dto.approverId, '审批人不存在')
    return this.transitionWithApproval(
      id,
      [ApplicationStatus.LOAN_REQUEST_REVIEWING],
      '当前状态不允许请款审核拒绝',
      { approverId: dto.approverId, stage: 'LOAN_REQUEST', action: ApprovalAction.REJECT, opinion: dto.opinion },
      ApplicationStatus.LOAN_REQUEST_REJECTED
    )
  }

  async completeGpsInstall(id: number, dto: GpsInstalledDto) {
    await this.findAndAssertStatus(
      id,
      [ApplicationStatus.PENDING_DISBURSEMENT],
      '当前状态不允许登记GPS安装'
    )
    return this.prisma.disbursement.upsert({
      where: { applicationId: id },
      update: {
        status: DisbursementStatus.GPS_INSTALLED,
        gpsDeviceNo: dto.gpsDeviceNo,
        gpsInstallImg: dto.gpsInstallImg,
        gpsInstallAt: dto.gpsInstallAt || new Date()
      },
      create: {
        tenantId: getCurrentTenantId()!,
        applicationId: id,
        status: DisbursementStatus.GPS_INSTALLED,
        gpsDeviceNo: dto.gpsDeviceNo,
        gpsInstallImg: dto.gpsInstallImg,
        gpsInstallAt: dto.gpsInstallAt || new Date()
      }
    })
  }

  async completeMortgage(id: number, dto: MortgageDoneDto) {
    await this.findAndAssertStatus(
      id,
      [ApplicationStatus.PENDING_DISBURSEMENT],
      '当前状态不允许登记抵押'
    )
    return this.prisma.disbursement.upsert({
      where: { applicationId: id },
      update: {
        status: DisbursementStatus.MORTGAGE_DONE,
        mortgageStatus: dto.mortgageStatus || 'DONE',
        mortgageImg: dto.mortgageImg,
        mortgageAt: dto.mortgageAt || new Date()
      },
      create: {
        tenantId: getCurrentTenantId()!,
        applicationId: id,
        status: DisbursementStatus.MORTGAGE_DONE,
        mortgageStatus: dto.mortgageStatus || 'DONE',
        mortgageImg: dto.mortgageImg,
        mortgageAt: dto.mortgageAt || new Date()
      }
    })
  }

  async requestDisbursement(id: number, dto: RequestDisbursementDto) {
    await this.findAndAssertStatus(
      id,
      [ApplicationStatus.LOAN_REQUEST_APPROVED, ApplicationStatus.PENDING_DISBURSEMENT],
      '当前状态不允许提交资方放款申请'
    )
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const tenantId = getCurrentTenantId()!
      const existedDisbursement = await tx.disbursement.findFirst({ where: { applicationId: id } })
      const nextDisbursementStatus =
        existedDisbursement?.status === DisbursementStatus.GPS_INSTALLED ||
        existedDisbursement?.status === DisbursementStatus.MORTGAGE_DONE
          ? existedDisbursement.status
          : DisbursementStatus.PENDING_APPROVAL
      await tx.disbursement.upsert({
        where: { applicationId: id },
        update: { status: nextDisbursementStatus, remark: dto.remark },
        create: { tenantId, applicationId: id, status: nextDisbursementStatus, remark: dto.remark }
      })
      return tx.application.update({
        where: { id },
        data: {
          status: ApplicationStatus.PENDING_DISBURSEMENT,
          ...flowPatch(ApplicationStatus.PENDING_DISBURSEMENT)
        }
      })
    })
  }

  async confirmDisbursement(id: number, dto: ConfirmDisbursementDto) {
    const application = await this.findAndAssertStatus(
      id,
      [ApplicationStatus.PENDING_DISBURSEMENT],
      '当前状态不允许放款确认'
    )
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const tenantId = getCurrentTenantId()!
      const disbursement = await tx.disbursement.findFirst({ where: { applicationId: id } })
      if (disbursement?.status !== DisbursementStatus.PENDING_APPROVAL) {
        throw new BadRequestException('请先提交出账申请')
      }
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
          tenantId,
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
        await tx.lead.update({
          where: { id: application.sourceLeadId },
          data: { status: LeadStatus.CONVERTED }
        })
      }
      return tx.application.update({
        where: { id },
        data: { status: ApplicationStatus.DISBURSED, ...flowPatch(ApplicationStatus.DISBURSED) }
      })
    })
  }

  async registerRepayment(planId: number, dto: RegisterRepaymentDto) {
    await this.ensureRelatedExists(this.prisma.user, dto.createdBy, '登记人不存在')
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const plan = await tx.repaymentPlan.findFirst({
        where: this.addTenantId({ id: planId })
      })
      if (!plan) throw new BadRequestException('还款计划不存在')

      const principal = dto.principal ?? dto.amount
      const interest = dto.interest ?? 0
      const penalty = dto.penalty ?? 0
      const paidPrincipal = Number(plan.paidPrincipal) + principal
      const paidInterest = Number(plan.paidInterest) + interest
      const paidTotal = Number(plan.paidTotal) + dto.amount
      const totalDue = Number(plan.totalAmount) + Number(plan.penaltyAmount)
      const nextStatus = paidTotal >= totalDue ? RepaymentStatus.PAID : RepaymentStatus.PARTIAL

      await tx.repaymentRecord.create({
        data: {
          tenantId: getCurrentTenantId()!,
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
    const application = await this.findAndAssertStatus(
      id,
      [ApplicationStatus.DISBURSED],
      '当前状态不允许结清'
    )
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const unpaid = await tx.repaymentPlan.count({
        where: {
          applicationId: id,
          status: { notIn: [RepaymentStatus.PAID, RepaymentStatus.SETTLED] }
        }
      })
      if (unpaid > 0) throw new BadRequestException('仍有未结清还款计划')
      await tx.repaymentPlan.updateMany({
        where: { applicationId: id },
        data: { status: RepaymentStatus.SETTLED }
      })
      return tx.application.update({
        where: { id },
        data: {
          status: ApplicationStatus.SETTLED,
          ...flowPatch(ApplicationStatus.SETTLED),
          remark: dto.remark ?? application.remark
        }
      })
    })
  }

  async convertLeadToApplication(id: number) {
    const application = await this.prisma.application.findFirst({
      where: this.addTenantId({ id })
    })
    if (!application?.sourceLeadId) return application
    await this.prisma.lead.update({
      where: { id: application.sourceLeadId },
      data: { status: LeadStatus.CONVERTED }
    })
    return application
  }

  private async prepareCreateRelations(dto: CreateApplicationDto) {
    const customer = await this.getScopedRelated(this.prisma.customer, dto.customerId, '客户不存在')
    const orgId = dto.orgId ?? customer.orgId
    if (!orgId) throw new BadRequestException('无法根据客户自动识别机构')
    if (customer.orgId !== orgId) throw new BadRequestException('客户不属于所选机构')

    await this.ensureOrgExists(orgId)
    await this.assertSameOrg(
      this.prisma.product,
      dto.productId,
      orgId,
      '产品不存在',
      '产品不属于客户所属机构'
    )
    await this.assertSameOrg(
      this.prisma.funder,
      dto.funderId,
      orgId,
      '资方不存在',
      '资方不属于客户所属机构'
    )
    await this.assertSameOrg(
      this.prisma.lead,
      dto.sourceLeadId,
      orgId,
      '来源线索不存在',
      '来源线索不属于客户所属机构'
    )

    dto.orgId = orgId
  }

  private async prepareUpdateRelations(id: number, dto: UpdateApplicationDto) {
    const current = await this.ensureExists(id)
    let orgId = dto.orgId ?? current.orgId

    if (dto.customerId) {
      const customer = await this.getScopedRelated(
        this.prisma.customer,
        dto.customerId,
        '客户不存在'
      )
      orgId = dto.orgId ?? customer.orgId
      if (customer.orgId !== orgId) throw new BadRequestException('客户不属于所选机构')
      dto.orgId = orgId
    }

    await this.ensureOrgExists(orgId)
    await this.assertSameOrg(
      this.prisma.product,
      dto.productId,
      orgId,
      '产品不存在',
      '产品不属于进件所属机构'
    )
    await this.assertSameOrg(
      this.prisma.funder,
      dto.funderId,
      orgId,
      '资方不存在',
      '资方不属于进件所属机构'
    )
    await this.assertSameOrg(
      this.prisma.lead,
      dto.sourceLeadId,
      orgId,
      '来源线索不存在',
      '来源线索不属于进件所属机构'
    )
  }

  private async ensureOrgExists(orgId: number) {
    await this.getScopedRelated(this.prisma.organization, orgId, '机构不存在')
  }

  private async assertSameOrg(
    model: any,
    id: number | undefined,
    orgId: number,
    notFoundMessage: string,
    mismatchMessage: string
  ) {
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
    if (status === ApplicationStatus.SUBMITTED || status === ApplicationStatus.PENDING_RISK_PRE)
      return 'RISK_PRE'
    if (status === ApplicationStatus.PENDING_FUNDER_PRE) return 'FUNDER_PRE'
    if (status === ApplicationStatus.PENDING_FIRST_REVIEW) return 'FIRST_REVIEW'
    if (status === ApplicationStatus.PENDING_FUNDER_REVIEW) return 'FUNDER_REVIEW'
    if (status === ApplicationStatus.LOAN_REQUEST_REVIEWING) return 'LOAN_REQUEST'
    return 'FINAL_REVIEW'
  }

  private resolvePassStatus(status: ApplicationStatus) {
    if (status === ApplicationStatus.PENDING_FIRST_REVIEW)
      return ApplicationStatus.PENDING_FINAL_REVIEW
    if (status === ApplicationStatus.LOAN_REQUEST_REVIEWING)
      return ApplicationStatus.LOAN_REQUEST_APPROVED
    return ApplicationStatus.FINAL_REVIEW_PASSED
  }

  private resolveRejectStatus(status: ApplicationStatus) {
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

  /**
   * 通用审批流转：校验状态 → 创建审批记录 → 更新申请状态（全部在事务内）
   */
  private async transitionWithApproval(
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
      return tx.application.update({
        where: { id },
        data: {
          status: nextStatus,
          ...flowPatch(nextStatus),
          ...extraUpdateData
        }
      })
    })
  }

  /**
   * 原子状态流转：在单次查询中完成「读 + 状态校验 + 写」，避免 TOCTOU 竞态。
   * 用于不需要读取 application 其他字段的简单状态变更。
   */

  private async atomicTransition(
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

  /**
   * 添加租户过滤条件
   */
  private addTenantId(where: Record<string, unknown>): Record<string, unknown> {
    const tenantId = getCurrentTenantId()
    if (!tenantId) return where
    return { ...where, tenantId }
  }

  /**
   * 原子查询 + 状态校验，返回 application 对象。
   * 用于需要读取 application 字段（如 remark）的场景。
   */
  private async findAndAssertStatus(
    id: number,
    allowedStatuses: ApplicationStatus[],
    statusMessage: string
  ) {
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

  private assertStatus(current: ApplicationStatus, allowed: ApplicationStatus[], message: string) {
    if (!allowed.includes(current)) throw new BadRequestException(message)
  }

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
    if (hasQueryValue(nodeCode)) where.currentNode = nodeCode
    else if (hasQueryValue(query.phaseCode)) {
      const phaseCode = Number(query.phaseCode)
      const nodePhases = this.getFlowMappings().nodePhases
      const phaseNodeCodes = Object.entries(nodePhases)
        .filter(([, code]) => code === phaseCode)
        .map(([node]) => Number(node))
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
    if (plateNumber) {
      customerWhere.vehicles = {
        some: {
          plateNumber: containsText(plateNumber)
        }
      }
    }

    if (Object.keys(customerWhere).length > 0) {
      where.customer = customerWhere
    }

    const keyword = firstQueryString(query.keyword)
    if (keyword) {
      where.OR = [
        { applicationNo: containsText(keyword) },
        {
          customer: {
            OR: [
              { name: containsText(keyword) },
              { phone: containsText(keyword) },
              { vehicles: { some: { plateNumber: containsText(keyword) } } }
            ]
          }
        }
      ]
    }

    return where
  }

  private mapOrderListItem(application: any) {
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

  private mapApplicationDetail(application: any) {
    const customer = application.customer
    const vehicles = Array.isArray(customer?.vehicles) ? customer.vehicles : []
    const vehicle = vehicles[0] || vehicles.at?.(0)
    const currentNode = Number(application.currentNode)
    const currentStatus = Number(application.currentStatus)
    const phaseCode = this.resolveFlowPhaseCode(application)
    const currentNodeName = this.resolveFlowNodeName(application)
    const currentStatusName = FLOW_STATUS_LABELS[currentStatus] || String(application.currentStatus)
    const files = this.mapDetailFiles(application.files)
    const repayments = this.mapRepayments(application.repayments)

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
      vehicles: vehicles.map((item: Record<string, unknown>) => this.mapDetailVehicle(item)),
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
      repaymentSummary: this.buildRepaymentSummary(repayments),
      repayments
    })
  }

  private mapDetailOrder(
    application: any,
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

  private mapDetailCustomer(customer: any) {
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

  private mapDetailVehicle(vehicle: any) {
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

  private mapDetailProduct(product: any) {
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

  private mapDetailFunder(funder: any) {
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

  private mapDetailOrg(org: any) {
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

  private mapDetailCreator(creator: any) {
    return omitEmptyValues({
      id: creator.id,
      userName: creator.userName,
      nickName: creator.nickName,
      name: creator.nickName || creator.userName
    })
  }

  private mapDetailFiles(files: any[] = []) {
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

  private mapApprovals(approvals: any[] = []) {
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

  private mapSignRecord(record: any) {
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

  private mapDisbursement(disbursement: any) {
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

  private mapRepayments(repayments: any[] = []) {
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

  private buildRepaymentSummary(repayments: any[] = []) {
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

  private mapFlowApplication(application: any) {
    return {
      ...application,
      creditOrderId: application.applicationNo,
      currentNodeName: this.resolveFlowNodeName(application),
      currentStatusName:
        FLOW_STATUS_LABELS[Number(application.currentStatus)] || String(application.currentStatus),
      customerName: application.customer?.name,
      customerPhone: application.customer?.phone,
      productName: application.product?.name,
      funderName: application.funder?.name,
      orgName: application.org?.name,
      creatorName: application.creator?.nickName || application.creator?.userName
    }
  }

  private resolveFlowNodeName(application: any) {
    const flowConfigs = application.org?.flowConfigs
    const config = Array.isArray(flowConfigs)
      ? flowConfigs.find(
          (item: Record<string, unknown>) =>
            item.businessType === application.businessType &&
            String(item.nodeCode) === String(application.currentNode)
        )
      : null
    return (
      config?.nodeName ||
      this.getFlowMappings().nodeNames[Number(application.currentNode)] ||
      String(application.currentNode)
    )
  }

  private resolveFlowPhaseCode(application: any) {
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

  private resolveFlowPhaseName(application: any, phaseCode: number) {
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

  private async createRepaymentPlansIfNeeded(
    tx: Prisma.TransactionClient,
    application: any,
    dto: ConfirmDisbursementDto
  ) {
    const existed = await tx.repaymentPlan.count({ where: { applicationId: application.id } })
    if (existed > 0) return

    const term = Number(application.approvedTerm ?? application.term)
    const amount = Number(dto.disburseAmount)
    const annualRate = Number(application.approvedRate ?? application.rate)
    const monthlyRate = annualRate / 12
    // 统一舍入：先将月供舍入到分，后续计算全部基于舍入后的值，避免浮点累积误差
    const roundedMonthlyPrincipal = Math.round((amount / term) * 100) / 100
    const baseDueDate = dto.firstDueDate
      ? new Date(dto.firstDueDate)
      : new Date(dto.disburseAt || new Date())
    if (!dto.firstDueDate) baseDueDate.setMonth(baseDueDate.getMonth() + 1)

    const plans = Array.from({ length: term }, (_, index) => {
      const dueDate = new Date(baseDueDate)
      dueDate.setMonth(baseDueDate.getMonth() + index)
      // 最后一期本金 = 总额 - 前N-1期已舍入本金之和（用整数乘法避免浮点误差）
      const principal =
        index === term - 1
          ? Math.round((amount - roundedMonthlyPrincipal * (term - 1)) * 100) / 100
          : roundedMonthlyPrincipal
      // 剩余本金也基于舍入后的月供计算
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

  /**
   * 获取订单生命周期节点列表，用于前端时间轴展示
   * 返回扁平化的每个处理步骤，包含审批/提交/完成记录
   */
  async getLifecycle(id: number) {
    const tenantId = getCurrentTenantId();
    const where = { id, tenantId };

    // 获取订单基本信息 + 所有审批记录
    const application = await this.prisma.application.findFirst({
      where,
      include: {
        approvals: {
          orderBy: { createdAt: 'desc' },
          include: {
            approver: { select: { id: true, userName: true, nickName: true } },
          },
        },
        // TODO: 未来可以补充节点提交记录（用户提交每个节点信息）
        // 目前只有审批记录，足够展示核心生命周期
      },
    });

    if (!application) throw new NotFoundException('订单不存在');

    // 将审批记录转换为要求的格式
    // 按时间倒序排列，最新的在前面
    const lifecycle = application.approvals.map((approval) => ({
      id: approval.id,
      currentNode: approval.stage,
      nextNode: null, // TODO: 根据流程配置获取下一节点
      approveName: approval.approver.nickName || approval.approver.userName,
      approvalTime: this.formatDatetime(approval.createdAt),
      approvalReason: approval.opinion || null,
      reasonExternal: null,
      rejectReason: approval.action === 'REJECT' ? (approval.opinion || null) : null,
      rejectReasonSecond: null,
      approvalStatus: this.mapApprovalActionToStatus(approval.action),
      approvalCost: approval.amount || null,
      aiReporTime: null,
      aiReportStatus: null,
      auditResults: null,
    }));

    // 如果当前还有待处理节点，在开头添加一个待处理条目
    // （因为它还没有审批记录）
    if (application.currentNode && application.currentStatus === 10) {
      lifecycle.unshift({
        id: null,
        currentNode: String(application.currentNode),
        nextNode: null,
        approveName: null,
        approvalTime: null,
        approvalReason: null,
        reasonExternal: null,
        rejectReason: null,
        rejectReasonSecond: null,
        approvalStatus: '待处理',
        approvalCost: null,
        aiReporTime: null,
        aiReportStatus: null,
        auditResults: null,
      });
    }

    return lifecycle;
  }

  private formatDatetime(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  private mapApprovalActionToStatus(action: string): string {
    const map: Record<string, string> = {
      PASS: '通过',
      REJECT: '拒绝',
      SUPPLEMENT: '要求补件',
    };
    return map[action] || action;
  }
}
