import { Injectable, NotFoundException } from '@nestjs/common'
import {
  Application as ApplicationModel,
  ApplicationFile,
  ApprovalRecord,
  Customer,
  Disbursement,
  Funder,
  Organization,
  Product,
  RepaymentPlan,
  RepaymentStatus,
  SignRecord,
  User,
  Vehicle
} from '@prisma/client'
import { getCurrentTenantId } from '../../common/tenant/tenant-context'
import { FlowConfigService } from '../flow-config/flow-config.service'
import { PrismaService } from '../prisma/prisma.service'

// ==================== 类型定义 ====================

export interface ApplicationWithIncludes extends ApplicationWithFlow {
  files?: ApplicationFile[]
  approvals?: (ApprovalRecord & { approver?: Pick<User, 'id' | 'userName' | 'nickName'> | null })[]
  signRecord?: SignRecord | null
  disbursement?: Disbursement | null
  repayments?: RepaymentPlan[]
}

export interface ApplicationWithFlow extends ApplicationModel {
  org?: (Organization & { flowConfigs?: Array<Record<string, unknown>> }) | null
  customer?: (Customer & { vehicles?: Vehicle[] }) | null
  product?: Product | null
  funder?: Funder | null
  creator?: Pick<User, 'id' | 'userName' | 'nickName'> | null
}

interface FlowMappingCache {
  nodeNames: Record<number, string>
  nodePhases: Record<number, number>
  phaseNames: Record<number, string>
}

// ==================== 常量 ====================

const FLOW_STATUS_LABELS: Record<number, string> = {
  0: '未开始', 10: '处理中', 20: '已通过', 30: '已拒绝', 40: '已退回', 50: '待补充', 90: '已完成'
}

const DETAIL_FILE_TYPE_LABELS: Record<string, string> = {
  ID_CARD_FRONT: '身份证人像面', ID_CARD_BACK: '身份证国徽面',
  VEHICLE_LICENSE: '行驶证', VEHICLE_IMAGE: '车辆照片',
  BANK_CARD: '银行卡', CONTRACT: '合同', OTHER: '其他材料'
}

const EMPTY_FLOW_MAPPINGS: FlowMappingCache = { nodeNames: {}, nodePhases: {}, phaseNames: {} }

function omitEmptyValues(source: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(source).filter(([, value]) => value !== undefined))
}

// ==================== Mapper 服务 ====================

@Injectable()
export class ApplicationMapper {
  private flowMappingsCache: FlowMappingCache | null = null
  private flowMappingsOrgId?: number

  constructor(
    private readonly prisma: PrismaService,
    private readonly flowConfigService: FlowConfigService
  ) {}

  // ==================== 流程映射缓存 ====================

  async loadFlowMappings(orgId?: number) {
    if (this.flowMappingsCache && this.flowMappingsOrgId === orgId) return
    this.flowMappingsCache = await this.flowConfigService.getFlowMappings(orgId)
    this.flowMappingsOrgId = orgId
  }

  getFlowMappings(): FlowMappingCache {
    return this.flowMappingsCache || EMPTY_FLOW_MAPPINGS
  }

  // ==================== 列表/详情映射 ====================

  mapOrderListItem(application: ApplicationWithFlow): Record<string, unknown> {
    const customer = application.customer
    const vehicle = customer?.vehicles?.[0] || (customer?.vehicles as Vehicle[] | undefined)?.at?.(0)
    const currentNode = Number(application.currentNode)
    const currentStatus = Number(application.currentStatus)
    const phaseCode = this.resolveFlowPhaseCode(application)
    const nodeName = this.resolveFlowNodeName(application)
    const nodeStatusName = FLOW_STATUS_LABELS[currentStatus] || String(application.currentStatus)

    return {
      ...application,
      customer, vehicle,
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

  mapApplicationDetail(application: ApplicationWithIncludes): Record<string, unknown> {
    const customer = application.customer
    const vehicles = Array.isArray(customer?.vehicles) ? customer.vehicles : []
    const vehicle = vehicles[0] || vehicles.at?.(0) as Vehicle | undefined
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
      currentNode, nodeCode: currentNode, currentNodeName,
      currentStatus, nodeStatus: currentStatus, currentStatusName,
      phaseCode, phaseName: this.resolveFlowPhaseName(application, phaseCode),
      supplementReason: application.supplementReason,
      supplementDeadline: application.supplementDeadline,
      remark: application.remark,
      creatorName: application.creator?.nickName || application.creator?.userName,
      createdAt: application.createdAt,
      updatedAt: application.updatedAt,
      order: this.mapDetailOrder(application, currentNode, currentStatus, currentNodeName, currentStatusName, phaseCode),
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
      disbursement: application.disbursement ? this.mapDisbursement(application.disbursement) : null,
      repaymentSummary: this.buildRepaymentSummary(application.repayments ?? []),
      repayments: mappedRepayments
    })
  }

  mapFlowApplication(application: ApplicationWithFlow): Record<string, unknown> {
    const customer = application.customer
    const vehicles = Array.isArray(customer?.vehicles) ? customer.vehicles : []
    const vehicle = vehicles[0] || vehicles.at?.(0) as Vehicle | undefined
    const currentNode = Number(application.currentNode)
    const currentStatus = Number(application.currentStatus)
    const phaseCode = this.resolveFlowPhaseCode(application)
    const nodeName = this.resolveFlowNodeName(application)
    const nodeStatusName = FLOW_STATUS_LABELS[currentStatus] || String(application.currentStatus)
    return {
      ...application,
      customer, vehicle, vehicles,
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
      currentNode, nodeCode: currentNode, currentNodeName: nodeName, nodeName,
      currentStatus, nodeStatus: currentStatus, currentStatusName: nodeStatusName, nodeStatusName,
      phaseCode, phaseName: this.resolveFlowPhaseName(application, phaseCode),
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

  private mapDetailOrder(
    application: ApplicationWithIncludes,
    currentNode: number, currentStatus: number,
    currentNodeName: string, currentStatusName: string, phaseCode: number
  ): Record<string, unknown> {
    return omitEmptyValues({
      id: application.id,
      applicationNo: application.applicationNo,
      orderNo: application.applicationNo,
      creditOrderId: application.applicationNo,
      amount: application.amount, term: application.term, rate: application.rate,
      repaymentMethod: application.repaymentMethod,
      purpose: application.purpose,
      status: application.status,
      businessType: application.businessType,
      currentNode, currentNodeName, currentStatus, currentStatusName,
      phaseCode, phaseName: this.resolveFlowPhaseName(application, phaseCode),
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

  private mapDetailCustomer(customer: Customer): Record<string, unknown> {
    return omitEmptyValues({
      id: customer.id, name: customer.name, phone: customer.phone, idCard: customer.idCard,
      gender: customer.gender, birthDate: customer.birthDate, nation: customer.nation,
      householdAddress: customer.householdAddress,
      issuingAuthority: customer.issuingAuthority,
      idCardValidFrom: customer.idCardValidFrom, idCardValidTo: customer.idCardValidTo,
      idCardFront: customer.idCardFront, idCardBack: customer.idCardBack,
      maritalStatus: customer.maritalStatus, education: customer.education,
      occupation: customer.occupation, companyName: customer.companyName,
      monthlyIncome: customer.monthlyIncome, address: customer.address,
      emergencyName: customer.emergencyName, emergencyPhone: customer.emergencyPhone,
      status: customer.status
    })
  }

  private mapDetailVehicle(vehicle: Vehicle): Record<string, unknown> {
    return omitEmptyValues({
      id: vehicle.id, plateNumber: vehicle.plateNumber, vin: vehicle.vin, vehicleCode: vehicle.vin,
      brand: vehicle.brand, model: vehicle.model, ownerName: vehicle.ownerName,
      address: vehicle.address, usageNature: vehicle.usageNature, sealInfo: vehicle.sealInfo,
      engineNumber: vehicle.engineNumber, registerDate: vehicle.registerDate,
      vehicleImgUrl: vehicle.vehicleImgUrl, color: vehicle.color, year: vehicle.year,
      mileage: vehicle.mileage, purchasePrice: vehicle.purchasePrice,
      estimateValue: vehicle.estimateValue, isMortgaged: vehicle.isMortgaged,
      mortgageInfo: vehicle.mortgageInfo
    })
  }

  private mapDetailProduct(product: Product): Record<string, unknown> {
    return omitEmptyValues({
      id: product.id, name: product.name, productType: product.productType,
      minRate: product.minRate, maxRate: product.maxRate,
      minAmount: product.minAmount, maxAmount: product.maxAmount,
      minTerm: product.minTerm, maxTerm: product.maxTerm,
      repaymentMethod: product.repaymentMethod,
      minAge: product.minAge, maxAge: product.maxAge,
      maxCarAge: product.maxCarAge, maxMileage: product.maxMileage,
      ltvLimit: product.ltvLimit, minDownPayment: product.minDownPayment,
      regions: product.regions, valuationDiscountRate: product.valuationDiscountRate,
      status: product.status, fileChecklist: product.fileChecklist
    })
  }

  private mapDetailFunder(funder: Funder): Record<string, unknown> {
    return omitEmptyValues({
      id: funder.id, name: funder.name, code: funder.code, funderType: funder.funderType,
      contactName: funder.contactName, contactPhone: funder.contactPhone,
      integrationMode: funder.integrationMode, creditLimit: funder.creditLimit,
      priority: funder.priority, status: funder.status
    })
  }

  private mapDetailOrg(org: Organization): Record<string, unknown> {
    return omitEmptyValues({
      id: org.id, name: org.name, code: org.code, creditCode: org.creditCode,
      contactName: org.contactName, contactPhone: org.contactPhone,
      address: org.address, status: org.status,
      packageType: org.packageType, expireAt: org.expireAt, apiEnabled: org.apiEnabled
    })
  }

  private mapDetailCreator(creator: Pick<User, 'id' | 'userName' | 'nickName'>): Record<string, unknown> {
    return omitEmptyValues({
      id: creator.id, userName: creator.userName,
      nickName: creator.nickName, name: creator.nickName || creator.userName
    })
  }

  private mapDetailFiles(files: ApplicationFile[] = []): Record<string, unknown>[] {
    const result: Record<string, unknown>[] = []
    const seen = new Set<string>()
    for (const file of files) {
      if (!file?.fileUrl) continue
      const key = `${file.fileType || ''}:${file.fileUrl}`
      if (seen.has(key)) continue
      seen.add(key)
      result.push(omitEmptyValues({
        id: file.id, fileType: file.fileType,
        fileTypeName: DETAIL_FILE_TYPE_LABELS[file.fileType] || file.fileType,
        fileUrl: file.fileUrl, fileName: file.fileName,
        isValid: file.isValid, createdAt: file.createdAt
      }))
    }
    return result
  }

  private mapApprovals(
    approvals: Array<ApprovalRecord & { approver?: Pick<User, 'id' | 'userName' | 'nickName'> | null }> = []
  ): Record<string, unknown>[] {
    return approvals.map((approval) =>
      omitEmptyValues({
        id: approval.id, stage: approval.stage, action: approval.action,
        opinion: approval.opinion, amount: approval.amount, term: approval.term,
        rate: approval.rate, approverId: approval.approverId,
        approverName: approval.approver?.nickName || approval.approver?.userName,
        createdAt: approval.createdAt
      })
    )
  }

  private mapSignRecord(record: SignRecord): Record<string, unknown> {
    return omitEmptyValues({
      id: record.id, status: record.status, contractUrl: record.contractUrl,
      signedAt: record.signedAt, videoUrl: record.videoUrl,
      expiredAt: record.expiredAt, cancelledReason: record.cancelledReason
    })
  }

  private mapDisbursement(disbursement: Disbursement): Record<string, unknown> {
    return omitEmptyValues({
      id: disbursement.id, status: disbursement.status,
      gpsDeviceNo: disbursement.gpsDeviceNo, gpsInstallImg: disbursement.gpsInstallImg,
      gpsInstallAt: disbursement.gpsInstallAt, mortgageStatus: disbursement.mortgageStatus,
      mortgageImg: disbursement.mortgageImg, mortgageAt: disbursement.mortgageAt,
      disburseAmount: disbursement.disburseAmount, disburseAccount: disbursement.disburseAccount,
      disburseAt: disbursement.disburseAt, transactionNo: disbursement.transactionNo,
      voucherUrl: disbursement.voucherUrl, remark: disbursement.remark
    })
  }

  private mapRepayments(repayments: RepaymentPlan[] = []): Record<string, unknown>[] {
    return repayments.map((repayment) =>
      omitEmptyValues({
        id: repayment.id, period: repayment.period, dueDate: repayment.dueDate,
        principal: repayment.principal, interest: repayment.interest,
        totalAmount: repayment.totalAmount, paidPrincipal: repayment.paidPrincipal,
        paidInterest: repayment.paidInterest, paidTotal: repayment.paidTotal,
        status: repayment.status, overdueDays: repayment.overdueDays,
        penaltyAmount: repayment.penaltyAmount, paidAt: repayment.paidAt
      })
    )
  }

  private buildRepaymentSummary(repayments: RepaymentPlan[] = []): Record<string, unknown> {
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

  // ==================== 流程节点解析 ====================

  resolveFlowNodeName(application: ApplicationWithFlow): string {
    const flowConfigs = (application.org as { flowConfigs?: Array<Record<string, unknown>> } | null | undefined)?.flowConfigs
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

  resolveFlowPhaseCode(application: ApplicationWithFlow): number {
    const currentNode = Number(application.currentNode)
    const flowConfigs = (application.org as { flowConfigs?: Array<Record<string, unknown>> } | null | undefined)?.flowConfigs
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

  resolveFlowPhaseName(application: ApplicationWithFlow, phaseCode: number): string {
    const flowConfigs = (application.org as { flowConfigs?: Array<Record<string, unknown>> } | null | undefined)?.flowConfigs
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

  async getLifecycle(id: number): Promise<Record<string, unknown>[]> {
    const tenantId = getCurrentTenantId()
    const where: Record<string, unknown> = { id, tenantId: tenantId ?? undefined }

    const application = await this.prisma.application.findFirst({
      where,
      include: {
        approvals: {
          orderBy: { createdAt: 'asc' },
          include: { approver: { select: { id: true, userName: true, nickName: true } } }
        },
        disbursement: true
      }
    })

    if (!application) throw new NotFoundException('订单不存在')

    const flowNodes = await this.prisma.flowConfig.findMany({
      where: { businessType: 'CAR_LOAN', status: 'ACTIVE' },
      orderBy: { nodeCode: 'asc' },
      select: { nodeCode: true, nodeName: true, ruleConfig: true }
    })

    const nodeNameMap: Record<string, string> = {}
    const nodeSortMap: Record<string, number> = {}
    for (const node of flowNodes) {
      nodeNameMap[node.nodeCode] = node.nodeName
      const rc = (node.ruleConfig as Record<string, unknown>) || {}
      nodeSortMap[node.nodeCode] = (rc.sort as number) || Number(node.nodeCode)
    }

    const approvalByStage = new Map<string, typeof application.approvals[number]>()
    for (const approval of application.approvals) {
      const prev = approvalByStage.get(approval.stage)
      if (!prev || new Date(approval.createdAt).getTime() >= new Date(prev.createdAt).getTime()) {
        approvalByStage.set(approval.stage, approval)
      }
    }

    const STAGE_TO_NODE: Record<string, string> = {
      RISK_PRE: '1200', FUNDER_PRE: '1250', SUPPLEMENT: '1300',
      FIRST_REVIEW: '1400', FINAL_REVIEW: '1450', FUNDER_REVIEW: '1500', LOAN_REQUEST: '1700'
    }

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
    const lifecycle: Record<string, unknown>[] = []

    for (const node of flowNodes) {
      const nodeNum = Number(node.nodeCode)
      const rc = (node.ruleConfig as Record<string, unknown>) || {}
      if (rc.parentNode) continue
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
          approvalCost: approval.amount || null
        })
      } else if (isPending) {
        lifecycle.push({
          id: null, currentNode: stage,
          currentNodeName: nodeNameMap[stage] || stage, nextNode: null,
          approveName: null, approvalTime: null, approvalReason: null,
          rejectReason: null, approvalStatus: '待处理', approvalCost: null
        })
      } else {
        lifecycle.push({
          id: null, currentNode: stage,
          currentNodeName: nodeNameMap[stage] || stage, nextNode: null,
          approveName: null,
          approvalTime: application.createdAt ? this.formatDatetime(application.createdAt) : null,
          approvalReason: null, rejectReason: null, approvalStatus: '已完成', approvalCost: null
        })
      }
    }

    for (const item of lifecycle) {
      const nc = String(item.currentNode)
      if (nc === '1300' && !item.approvalReason && (application as { supplementReason?: string }).supplementReason) {
        item.approvalReason = (application as { supplementReason?: string }).supplementReason
      }
      if (nc === '1800' && !item.approvalReason && application.disbursement?.remark) {
        item.approvalReason = application.disbursement.remark
      }
    }

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
    const map: Record<string, string> = { PASS: '通过', REJECT: '拒绝', SUPPLEMENT: '要求补件' }
    return map[action] || action
  }
}