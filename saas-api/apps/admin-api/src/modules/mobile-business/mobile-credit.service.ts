import { Injectable, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ApplicationStatus } from '@prisma/client'
import { hasValue } from '../../common/utils/helpers'
import { createApplicationWithUniqueNo } from '../../common/utils/application-no'
import { getPagination } from '../../common/utils/pagination'
import { PrismaService } from '../prisma/prisma.service'
import { RequestUser } from '../../common/types/request-user'
import {
  MobileCreditApplyDto,
  MobileCreditListQueryDto,
  MobileCreditUpdateDto
} from './dto/mobile-business.dto'
import { mapCreditStatus, mapBusinessNode, statusFromBusinessNode, mapApplication } from './mobile-business.utils'
import { getCustomerByUuid, getDefaultProduct, getDefaultFunder, findApplication, findLatestDraftApplication, findDraftApplicationByNo } from './mobile-business.db-helpers'
import { MobileFileService } from './mobile-file.service'

@Injectable()
export class MobileCreditService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly fileService: MobileFileService
  ) {}

  async creditApply(dto: MobileCreditApplyDto, user: RequestUser) {
    const customer = await getCustomerByUuid(this.prisma, dto.uuid)
    const product = await getDefaultProduct(this.prisma, customer.orgId)
    const funder = await getDefaultFunder(this.prisma, customer.orgId)
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

    // 有订单编号 → 按 applicationNo 查找已有订单（任意状态，跨客户）；无订单编号 → 查找当前客户最新草稿
    let existingApplication = dto.creditOrderId
      ? await this.prisma.application.findFirst({
          where: { applicationNo: dto.creditOrderId }
        })
      : await findLatestDraftApplication(this.prisma, customer.id)

    const isUpdate = Boolean(existingApplication)

    const resolvedAmount = hasValue(dto.amount)
      ? dto.amount
      : existingApplication
        ? Number(existingApplication.amount)
        : 0
    const resolvedTerm = hasValue(dto.periods)
      ? dto.periods
      : existingApplication
        ? existingApplication.term
        : product?.minTerm || 12

    // 已提交的订单只更新金额/期数等资料字段，不覆盖状态和节点
    const baseData = {
      amount: resolvedAmount,
      term: resolvedTerm,
      rate,
      remark: remarkParts.join('；') || undefined
    }

    const applicationData = isUpdate
      ? baseData
      : {
          ...baseData,
          orgId: customer.orgId,
          customerId: customer.id,
          productId: product?.id,
          funderId: funder?.id,
          repaymentMethod: product?.repaymentMethod || '等额本息',
          status: ApplicationStatus.PENDING_RISK_PRE,
          businessType: dto.businessType === 'pawn' ? 'PAWN' : 'CAR_LOAN',
          currentNode: 1200,
          currentStatus: 10,
          creatorId: user.sub,
        }

    const application = isUpdate
      ? await this.prisma.application.update({
          where: { id: existingApplication.id },
          data: applicationData
        })
      : await createApplicationWithUniqueNo((applicationNo) =>
          this.prisma.application.create({
            data: {
              ...applicationData,
              applicationNo
            }
          })
        )

    await this.fileService.linkApplicationFiles(application, customer)

    return {
      uuid: String(customer.id),
      creditOrderId: application.applicationNo,
      id: application.id,
      status: mapCreditStatus(application.status),
      businessNode: mapBusinessNode(application.status)
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
    const apiPrefix = this.config.get<string>('API_PREFIX', 'saas/api')
    return mapApplication(updated, apiPrefix)
  }

  async getCreditList(query: MobileCreditListQueryDto) {
    const pagination = getPagination(query)
    const where: Record<string, unknown> = {}
    if (query.salesmanId) where.creatorId = query.salesmanId
    if (query.businessNode) {
      const status = statusFromBusinessNode(query.businessNode)
      if (status) where.status = status
    }

    if (query.status !== undefined && query.status !== null) {
      const statusMap: Record<number, string> = {
        1: 'DRAFT',
        2: 'PENDING_RISK_PRE',
        3: 'PENDING_SUPPLEMENT',
        4: 'PENDING_SIGN',
        5: 'DISBURSED'
      }
      const numStatus = Number(query.status)
      if (!Number.isNaN(numStatus) && statusMap[numStatus]) {
        where.status = statusMap[numStatus]
      } else if (typeof query.status === 'string') {
        where.status = query.status
      }
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

    const apiPrefix = this.config.get<string>('API_PREFIX', 'saas/api')
    const rows = records.map((item: any) => mapApplication(item, apiPrefix))

    return {
      code: 200,
      msg: 'success',
      data: rows,
      rows,
      total
    }
  }

  async getCreditDetail(id: string | number) {
    const application = await findApplication(this.prisma, id)
    const apiPrefix = this.config.get<string>('API_PREFIX', 'saas/api')
    return mapApplication(application, apiPrefix, true)
  }

  async getCreditDetailByOrderId(creditOrderId: string) {
    const application = await findApplication(this.prisma, creditOrderId)
    const apiPrefix = this.config.get<string>('API_PREFIX', 'saas/api')
    return mapApplication(application, apiPrefix, true)
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

  async getFlowConfigByNodeCode(nodeCode: string, businessType = 'CAR_LOAN') {
    const config = await this.prisma.flowConfig.findFirst({
      where: {
        nodeCode,
        businessType,
        status: 'ACTIVE'
      }
    })
    if (!config) return null

    const ruleConfig = (config.ruleConfig as Record<string, unknown>) || {}
    return {
      id: config.id,
      nodeCode: config.nodeCode,
      nodeName: config.nodeName,
      name: config.name,
      requireMaterials: config.requireMaterials,
      requireApproval: config.requireApproval,
      autoPass: config.autoPass,
      ruleConfig
    }
  }

  async getFlowSteps(nodeCode: string, businessType = 'CAR_LOAN') {
    const config = await this.getFlowConfigByNodeCode(nodeCode, businessType)
    if (!config) return []

    const ruleConfig = config.ruleConfig as Record<string, unknown>
    return (ruleConfig?.steps as Array<Record<string, unknown>>) || []
  }

  async getFlowNodes(businessType = 'CAR_LOAN') {
    const configs = await this.prisma.flowConfig.findMany({
      where: { businessType, status: 'ACTIVE' },
      orderBy: { nodeCode: 'asc' },
      select: {
        id: true,
        nodeCode: true,
        nodeName: true,
        name: true,
        requireMaterials: true,
        requireApproval: true,
        autoPass: true,
        ruleConfig: true,
      }
    })
    return configs.map((c: any) => {
      const ruleConfig = (c.ruleConfig as Record<string, unknown>) || {}
      return {
        id: c.id,
        nodeCode: c.nodeCode,
        nodeName: c.nodeName,
        name: c.name,
        sort: ruleConfig.sort ?? Number(c.nodeCode),
        phaseCode: ruleConfig.phaseCode,
        phaseName: ruleConfig.phaseName,
        parentNode: ruleConfig.parentNode ?? null,
        parallel: ruleConfig.parallel ?? false,
        required: ruleConfig.required ?? false,
        requireMaterials: c.requireMaterials,
        requireApproval: c.requireApproval,
        autoPass: c.autoPass,
        transitions: ruleConfig.transitions ?? [],
      }
    })
  }

  getStatisticsOverview() {
    return {
      todayLeads: 0,
      pendingApproval: 0,
      monthlyDeals: 0,
      totalAmount: 0
    }
  }
}
