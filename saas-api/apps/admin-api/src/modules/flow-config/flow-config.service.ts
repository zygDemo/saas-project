import { BadRequestException, Injectable } from '@nestjs/common'
import { getCurrentTenantId } from '../../common/tenant/tenant-context'
import { BaseBusinessCrudService } from '../base-business-crud.service'
import { PrismaService } from '../prisma/prisma.service'
import {
  CreateFlowConfigDto,
  FlowConfigQueryDto,
  InitDefaultFlowConfigDto,
  UpdateFlowConfigDto
} from './dto/flow-config.dto'

const FLOW_BUSINESS_TYPES = [
  { label: '车贷', value: 'CAR_LOAN' },
  { label: '融资租赁', value: 'LEASE' },
  { label: '典当', value: 'PAWN' }
]

const FLOW_ACTIONS = [
  { label: '提交', value: 10, code: 'SUBMIT' },
  { label: '通过', value: 20, code: 'PASS' },
  { label: '拒绝', value: 30, code: 'REJECT' },
  { label: '退回', value: 40, code: 'RETURN' },
  { label: '要求补充', value: 50, code: 'SUPPLEMENT' },
  { label: '取消', value: 60, code: 'CANCEL' }
]

const FLOW_STATUSES = [
  { label: '未开始', value: 0, code: 'WAITING' },
  { label: '处理中', value: 10, code: 'PROCESSING' },
  { label: '已通过', value: 20, code: 'PASSED' },
  { label: '已拒绝', value: 30, code: 'REJECTED' },
  { label: '已退回', value: 40, code: 'RETURNED' },
  { label: '待补充', value: 50, code: 'SUPPLEMENTING' },
  { label: '已完成', value: 90, code: 'COMPLETED' }
]

export interface FlowTransitionMeta {
  action: number
  toNode: number
  condition?: string
}

export interface DefaultFlowStepMeta {
  code: string
  name: string
  operationSide: string
  executor: string
  sort: number
  required?: boolean
}

export interface DefaultFlowNodeMeta {
  code: number
  name: string
  phaseCode: number
  phaseName: string
  sort: number
  operationSide: string
  executor: string
  parentNode?: number
  parallel?: boolean
  required?: boolean
  requireMaterials?: boolean
  requireApproval?: boolean
  autoPass?: boolean
  approveLevel?: number
  steps?: DefaultFlowStepMeta[]
  transitions?: FlowTransitionMeta[]
  amountLimit?: number
}

const DEFAULT_FLOW_NODES: DefaultFlowNodeMeta[] = [
  {
    code: 1100,
    name: '身份证信息（订单创建）',
    phaseCode: 1000,
    phaseName: '预审阶段',
    sort: 1100,
    operationSide: '移动端',
    executor: '客户/业务员',
    requireMaterials: true,
    requireApproval: false,
    transitions: [{ action: 10, toNode: 1110 }]
  },
  {
    code: 1110,
    name: '车辆信息',
    phaseCode: 1000,
    phaseName: '预审阶段',
    sort: 1110,
    operationSide: '移动端',
    executor: '客户/业务员',
    requireMaterials: true,
    requireApproval: false,
    transitions: [{ action: 10, toNode: 1120 }]
  },
  {
    code: 1120,
    name: '申请信息',
    phaseCode: 1000,
    phaseName: '预审阶段',
    sort: 1120,
    operationSide: '移动端',
    executor: '客户/业务员',
    requireMaterials: true,
    requireApproval: false,
    transitions: [{ action: 10, toNode: 1130 }]
  },
  {
    code: 1130,
    name: '签署授权书',
    phaseCode: 1000,
    phaseName: '预审阶段',
    sort: 1130,
    operationSide: '移动端',
    executor: '客户/业务员',
    requireMaterials: true,
    requireApproval: false,
    transitions: [{ action: 10, toNode: 1140 }]
  },
  {
    code: 1140,
    name: '待预审',
    phaseCode: 1000,
    phaseName: '预审阶段',
    sort: 1140,
    operationSide: '系统',
    executor: '系统',
    requireMaterials: false,
    requireApproval: false,
    transitions: [{ action: 10, toNode: 1200 }]
  },
  {
    code: 1200,
    name: '风控预审',
    phaseCode: 1000,
    phaseName: '预审阶段',
    sort: 1200,
    operationSide: '系统',
    executor: '系统自动化',
    requireMaterials: false,
    requireApproval: false,
    autoPass: true,
    transitions: [{ action: 20, toNode: 1250 }]
  },
  {
    code: 1250,
    name: '资方预审',
    phaseCode: 1000,
    phaseName: '预审阶段',
    sort: 1250,
    operationSide: '三方接口',
    executor: '资方接口',
    requireMaterials: false,
    requireApproval: true,
    transitions: [
      { action: 20, toNode: 1300 },
      { action: 50, toNode: 1300 }
    ]
  },
  {
    code: 1300,
    name: '资料补充',
    phaseCode: 1300,
    phaseName: '补件阶段',
    sort: 1300,
    operationSide: '移动端',
    executor: '客户/业务员',
    requireMaterials: false,
    requireApproval: false,
    transitions: [{ action: 10, toNode: 1350, condition: 'ALL_PARALLEL_REQUIRED_COMPLETED' }]
  },
  {
    code: 1310,
    name: '客户资料',
    phaseCode: 1300,
    phaseName: '补件阶段',
    sort: 1310,
    parentNode: 1300,
    parallel: true,
    required: true,
    operationSide: '移动端',
    executor: '客户',
    requireMaterials: true,
    requireApproval: false
  },
  {
    code: 1320,
    name: '车辆资料',
    phaseCode: 1300,
    phaseName: '补件阶段',
    sort: 1320,
    parentNode: 1300,
    parallel: true,
    required: true,
    operationSide: '移动端',
    executor: '客户',
    requireMaterials: true,
    requireApproval: false
  },
  {
    code: 1330,
    name: '订单资料',
    phaseCode: 1300,
    phaseName: '补件阶段',
    sort: 1330,
    parentNode: 1300,
    parallel: true,
    required: true,
    operationSide: '移动端',
    executor: '客户',
    requireMaterials: true,
    requireApproval: false
  },
  {
    code: 1340,
    name: '文件资料',
    phaseCode: 1300,
    phaseName: '补件阶段',
    sort: 1340,
    parentNode: 1300,
    parallel: true,
    required: true,
    operationSide: '移动端',
    executor: '客户',
    requireMaterials: true,
    requireApproval: false
  },
  {
    code: 1350,
    name: '待提交',
    phaseCode: 1300,
    phaseName: '补件阶段',
    sort: 1350,
    operationSide: '移动端',
    executor: '客户/业务员',
    requireMaterials: false,
    requireApproval: false,
    transitions: [{ action: 10, toNode: 1400 }]
  },
  {
    code: 1400,
    name: '风控初审',
    phaseCode: 1400,
    phaseName: '风控审批',
    sort: 1400,
    operationSide: 'Web',
    executor: '风控专员',
    requireMaterials: false,
    requireApproval: true,
    amountLimit: 200000,
    transitions: [
      { action: 20, toNode: 1450, condition: 'LOAN_AMOUNT_GT_LIMIT' },
      { action: 20, toNode: 1500, condition: 'LOAN_AMOUNT_LTE_LIMIT' },
      { action: 50, toNode: 1300 }
    ]
  },
  {
    code: 1450,
    name: '风控终审',
    phaseCode: 1400,
    phaseName: '风控审批',
    sort: 1450,
    operationSide: 'Web',
    executor: '风控主管',
    requireMaterials: false,
    requireApproval: true,
    approveLevel: 2,
    transitions: [
      { action: 20, toNode: 1500 },
      { action: 50, toNode: 1300 }
    ]
  },
  {
    code: 1500,
    name: '资方终审',
    phaseCode: 1500,
    phaseName: '资方终审',
    sort: 1500,
    operationSide: '三方接口',
    executor: '资方接口',
    requireMaterials: false,
    requireApproval: true,
    transitions: [
      { action: 20, toNode: 1600 },
      { action: 50, toNode: 1300 }
    ]
  },
  {
    code: 1600,
    name: '签约办理',
    phaseCode: 1600,
    phaseName: '签约阶段',
    sort: 1600,
    operationSide: '移动端',
    executor: '客户/业务员',
    requireMaterials: false,
    requireApproval: false,
    transitions: [{ action: 10, toNode: 1660, condition: 'ALL_PARALLEL_REQUIRED_COMPLETED' }]
  },
  {
    code: 1610,
    name: '额度确认',
    phaseCode: 1600,
    phaseName: '签约阶段',
    sort: 1610,
    parentNode: 1600,
    parallel: true,
    required: true,
    operationSide: '移动端',
    executor: '客户',
    requireMaterials: false,
    requireApproval: false
  },
  {
    code: 1620,
    name: '绑银行卡',
    phaseCode: 1600,
    phaseName: '签约阶段',
    sort: 1620,
    parentNode: 1600,
    parallel: true,
    required: true,
    operationSide: '移动端',
    executor: '客户',
    requireMaterials: true,
    requireApproval: false
  },
  {
    code: 1630,
    name: '合同签署',
    phaseCode: 1600,
    phaseName: '签约阶段',
    sort: 1630,
    parentNode: 1600,
    parallel: true,
    required: true,
    operationSide: '移动端',
    executor: '客户',
    requireMaterials: true,
    requireApproval: false
  },
  {
    code: 1640,
    name: 'GPS安装',
    phaseCode: 1600,
    phaseName: '签约阶段',
    sort: 1640,
    parentNode: 1600,
    parallel: true,
    required: true,
    operationSide: '移动端',
    executor: '客户/业务员',
    requireMaterials: true,
    requireApproval: false
  },
  {
    code: 1650,
    name: '抵押办理',
    phaseCode: 1600,
    phaseName: '签约阶段',
    sort: 1650,
    parentNode: 1600,
    parallel: true,
    required: true,
    operationSide: '移动端',
    executor: '客户/业务员',
    requireMaterials: true,
    requireApproval: false
  },
  {
    code: 1660,
    name: '待请款',
    phaseCode: 1600,
    phaseName: '签约阶段',
    sort: 1660,
    operationSide: '系统',
    executor: '系统',
    requireMaterials: false,
    requireApproval: false,
    transitions: [{ action: 10, toNode: 1700 }]
  },
  {
    code: 1700,
    name: '请款资料',
    phaseCode: 1700,
    phaseName: '请款放款',
    sort: 1700,
    operationSide: 'Web',
    executor: '业务专员',
    requireMaterials: true,
    requireApproval: false,
    transitions: [{ action: 20, toNode: 1800 }]
  },
  {
    code: 1800,
    name: '资方放款',
    phaseCode: 1700,
    phaseName: '请款放款',
    sort: 1800,
    operationSide: '三方接口',
    executor: '资方接口',
    requireMaterials: false,
    requireApproval: false,
    transitions: [{ action: 20, toNode: 1900 }]
  },
  {
    code: 1900,
    name: '贷后还款',
    phaseCode: 1900,
    phaseName: '贷后阶段',
    sort: 1900,
    operationSide: 'Web',
    executor: '贷后专员',
    requireMaterials: false,
    requireApproval: false
  }
]

const OBSOLETE_DEFAULT_FLOW_NODE_CODES = [
  '2000',
  '2100',
  '2200',
  '3000',
  '3100',
  '4000',
  '4100',
  '4200',
  '4300',
  '4400',
  '5000',
  '5100',
  '6000',
  '6100',
  '7000',
  '8000',
  '9000'
]

@Injectable()
export class FlowConfigService extends BaseBusinessCrudService<
  CreateFlowConfigDto,
  UpdateFlowConfigDto,
  FlowConfigQueryDto
> {
  constructor(private readonly prisma: PrismaService) {
    super({
      model: prisma.flowConfig,
      prisma,
      searchableFields: ['name', 'nodeName'],
      exactFields: ['orgId', 'businessType', 'nodeCode', 'status'],
      include: { org: true },
      validateCreate: async (dto) => this.validateFlowConfig(dto),
      validateUpdate: async (_id, dto) => this.validateFlowConfig(dto)
    })
  }

  getMeta() {
    return {
      businessTypes: FLOW_BUSINESS_TYPES,
      actions: FLOW_ACTIONS,
      statuses: FLOW_STATUSES,
      nodes: DEFAULT_FLOW_NODES.map((node) => ({
        code: node.code,
        name: node.name,
        phaseCode: node.phaseCode,
        phaseName: node.phaseName,
        sort: node.sort,
        operationSide: node.operationSide,
        executor: node.executor,
        parentNode: node.parentNode,
        parallel: Boolean(node.parallel),
        required: Boolean(node.required),
        steps: node.steps || [],
        transitions: node.transitions || []
      })),
      phases: this.getDefaultPhases()
    }
  }

  /**
   * 从数据库查询指定机构的流程映射（nodeName / phaseCode / phaseName），
   * 用于 application 等模块替代硬编码常量。
   * 不传 orgId 时返回所有已配置机构的聚合映射。
   */
  async getFlowMappings(orgId?: number, businessType?: string) {
    const where: Record<string, unknown> = { status: 'ACTIVE' }
    if (orgId) where.orgId = orgId
    if (businessType) where.businessType = businessType

    const configs = await this.prisma.flowConfig.findMany({
      where,
      select: { nodeCode: true, nodeName: true, ruleConfig: true }
    })

    const nodeNames: Record<number, string> = {}
    const nodePhases: Record<number, number> = {}
    const phaseNames: Record<number, string> = {}

    for (const config of configs) {
      const code = Number(config.nodeCode)
      if (!Number.isFinite(code)) continue
      nodeNames[code] = config.nodeName
      const ruleConfig = config.ruleConfig as Record<string, unknown> | null
      const phaseCode = Number(ruleConfig?.phaseCode)
      if (Number.isFinite(phaseCode)) {
        nodePhases[code] = phaseCode
        if (ruleConfig?.phaseName) phaseNames[phaseCode] = String(ruleConfig.phaseName)
      }
    }

    return { nodeNames, nodePhases, phaseNames }
  }

  async initDefault(dto: InitDefaultFlowConfigDto) {
    const org = await this.ensureRelatedExists(this.prisma.organization, dto.orgId, '机构不存在')
    const tenantId = getCurrentTenantId() || org?.tenantId
    if (!tenantId) throw new BadRequestException('租户信息不存在')

    const businessType = dto.businessType || 'CAR_LOAN'
    await this.prisma.flowConfig.deleteMany({
      where: {
        orgId: dto.orgId,
        businessType,
        nodeCode: { in: OBSOLETE_DEFAULT_FLOW_NODE_CODES }
      }
    })

    const results = await this.prisma.$transaction(async (tx: PrismaService) => {
      const items: any[] = []
      for (const node of DEFAULT_FLOW_NODES) {
        const item = await tx.flowConfig.upsert({
          where: {
            orgId_businessType_nodeCode: {
              orgId: dto.orgId,
              businessType,
              nodeCode: String(node.code)
            }
          },
          update: {
            tenantId,
            name: node.phaseName + '-' + node.name,
            nodeName: node.name,
            approveLevel: node.approveLevel || 1,
            amountLimit: node.amountLimit,
            requireMaterials: Boolean(node.requireMaterials),
            requireApproval: node.requireApproval ?? true,
            autoPass: Boolean(node.autoPass),
            ruleConfig: this.buildRuleConfig(node),
            status: 'ACTIVE'
          },
          create: {
            tenantId,
            orgId: dto.orgId,
            name: node.phaseName + '-' + node.name,
            businessType,
            nodeCode: String(node.code),
            nodeName: node.name,
            approveLevel: node.approveLevel || 1,
            amountLimit: node.amountLimit,
            requireMaterials: Boolean(node.requireMaterials),
            requireApproval: node.requireApproval ?? true,
            autoPass: Boolean(node.autoPass),
            ruleConfig: this.buildRuleConfig(node),
            status: 'ACTIVE'
          }
        })
        items.push(item)
      }
      return items
    })
    return {
      count: results.length,
      records: results
    }
  }

  private async validateFlowConfig(dto: CreateFlowConfigDto | UpdateFlowConfigDto) {
    await this.ensureRelatedExists(this.prisma.organization, dto.orgId, '机构不存在')
    if (dto.autoPass && dto.requireApproval) {
      throw new BadRequestException('自动通过时不能同时要求审批')
    }
    if (dto.amountLimit !== undefined && dto.amountLimit < 0) {
      throw new BadRequestException('金额阈值不能小于0')
    }
    if (dto.timeoutHours !== undefined && dto.timeoutHours < 0) {
      throw new BadRequestException('超时时长不能小于0')
    }
  }

  private getDefaultPhases() {
    const phaseMap = new Map<number, { code: number; name: string; nodes: DefaultFlowNodeMeta[] }>()
    for (const node of DEFAULT_FLOW_NODES) {
      if (!phaseMap.has(node.phaseCode)) {
        phaseMap.set(node.phaseCode, { code: node.phaseCode, name: node.phaseName, nodes: [] })
      }
      phaseMap.get(node.phaseCode)?.nodes.push(node)
    }
    return Array.from(phaseMap.values()).map((phase) => ({
      code: phase.code,
      name: phase.name,
      nodes: phase.nodes.map((node) => node.code)
    }))
  }

  private buildRuleConfig(node: DefaultFlowNodeMeta): Record<string, unknown> {
    const config: Record<string, unknown> = {
      nodeCode: node.code,
      phaseCode: node.phaseCode,
      phaseName: node.phaseName,
      sort: node.sort,
      parallel: Boolean(node.parallel),
      required: Boolean(node.required),
      initialStatus: node.parentNode ? 0 : 10,
      transitions: node.transitions || []
    }
    if (node.parentNode !== undefined) config.parentNode = node.parentNode
    if (node.operationSide) config.operationSide = node.operationSide
    if (node.executor) config.executor = node.executor
    if (node.steps?.length) config.steps = node.steps
    if (node.amountLimit !== undefined) config.amountLimit = node.amountLimit
    return config
  }
}
