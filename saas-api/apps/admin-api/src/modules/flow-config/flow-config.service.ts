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
}

const DEFAULT_FLOW_NODES: DefaultFlowNodeMeta[] = [
  {
    code: 1100,
    name: '预审进件',
    phaseCode: 1000,
    phaseName: '预审阶段',
    sort: 1100,
    operationSide: '移动端',
    executor: '客户/业务员',
    requireMaterials: true,
    requireApproval: false,
    steps: [
      {
        code: 'ID_CARD',
        name: '身份证信息',
        operationSide: '移动端',
        executor: '客户/业务员',
        sort: 1110,
        required: true
      },
      {
        code: 'VEHICLE',
        name: '车辆信息',
        operationSide: '移动端',
        executor: '客户/业务员',
        sort: 1120,
        required: true
      },
      {
        code: 'APPLICATION',
        name: '申请信息',
        operationSide: '移动端',
        executor: '客户/业务员',
        sort: 1130,
        required: true
      },
      {
        code: 'AUTH_SIGN',
        name: '签署授权书',
        operationSide: '移动端',
        executor: '客户/业务员',
        sort: 1140,
        required: true
      },
      {
        code: 'PENDING_PRECHECK',
        name: '待预审',
        operationSide: '系统',
        executor: '系统',
        sort: 1150,
        required: false
      }
    ],
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
    transitions: [{ action: 20, toNode: 1300 }]
  },
  {
    code: 1300,
    name: '资方预审',
    phaseCode: 1000,
    phaseName: '预审阶段',
    sort: 1300,
    operationSide: '三方接口',
    executor: '资方接口',
    requireApproval: true,
    transitions: [
      { action: 20, toNode: 1400 },
      { action: 50, toNode: 1400 }
    ]
  },
  {
    code: 1400,
    name: '资料补充',
    phaseCode: 1400,
    phaseName: '补件阶段',
    sort: 1400,
    operationSide: '移动端',
    executor: '客户',
    requireMaterials: true,
    requireApproval: false,
    steps: [
      {
        code: 'CUSTOMER_INFO',
        name: '客户资料',
        operationSide: '移动端',
        executor: '客户',
        sort: 1410,
        required: true
      },
      {
        code: 'VEHICLE_INFO',
        name: '车辆资料',
        operationSide: '移动端',
        executor: '客户',
        sort: 1420,
        required: true
      },
      {
        code: 'ORDER_INFO',
        name: '订单信息',
        operationSide: '移动端',
        executor: '客户',
        sort: 1430,
        required: true
      },
      {
        code: 'FILE_INFO',
        name: '文件信息',
        operationSide: '移动端',
        executor: '客户',
        sort: 1440,
        required: true
      }
    ],
    transitions: [{ action: 10, toNode: 2100, condition: 'REQUIRED_TASKS_COMPLETED' }]
  },
  {
    code: 2100,
    name: '风控初审',
    phaseCode: 2000,
    phaseName: '风控审批',
    sort: 2100,
    operationSide: 'Web',
    executor: '风控专员',
    requireApproval: true,
    transitions: [
      { action: 20, toNode: 2200 },
      { action: 50, toNode: 1400 }
    ]
  },
  {
    code: 2200,
    name: '风控终审',
    phaseCode: 2000,
    phaseName: '风控审批',
    sort: 2200,
    operationSide: 'Web',
    executor: '风控主管',
    requireApproval: true,
    approveLevel: 2,
    transitions: [
      { action: 20, toNode: 3100 },
      { action: 50, toNode: 1400 }
    ]
  },
  {
    code: 3100,
    name: '资方终审',
    phaseCode: 3000,
    phaseName: '资方终审',
    sort: 3100,
    operationSide: '三方接口',
    executor: '资方接口',
    requireApproval: true,
    transitions: [
      { action: 20, toNode: 4100 },
      { action: 50, toNode: 1400 }
    ]
  },
  {
    code: 4100,
    name: '客户签约',
    phaseCode: 4000,
    phaseName: '客户签约',
    sort: 4100,
    operationSide: '移动端',
    executor: '客户',
    requireMaterials: true,
    requireApproval: false,
    steps: [
      { code: 'CONFIRM_AMOUNT', name: '确认额度', operationSide: '移动端', executor: '客户', sort: 4110 },
      { code: 'BIND_CARD', name: '绑卡', operationSide: '移动端', executor: '客户', sort: 4120 },
      { code: 'SIGN_CONTRACT', name: '合同签约', operationSide: '移动端', executor: '客户', sort: 4130 },
      { code: 'GPS_APPOINTMENT', name: 'GPS安装预约', operationSide: '移动端', executor: '客户', sort: 4140 },
      { code: 'MORTGAGE', name: '抵押办理', operationSide: '移动端', executor: '客户', sort: 4150 }
    ],
    transitions: [{ action: 10, toNode: 5100 }]
  },
  {
    code: 5100,
    name: '请款资料',
    phaseCode: 5000,
    phaseName: '请款放款',
    sort: 5100,
    operationSide: 'Web',
    executor: '业务专员',
    requireMaterials: true,
    requireApproval: false,
    transitions: [{ action: 20, toNode: 6100 }]
  },
  {
    code: 6100,
    name: '资方放款',
    phaseCode: 5000,
    phaseName: '请款放款',
    sort: 6100,
    operationSide: '三方接口',
    executor: '资方接口',
    requireApproval: false
  }
]

const OBSOLETE_DEFAULT_FLOW_NODE_CODES = [
  '2000',
  '3000',
  '4000',
  '4200',
  '4300',
  '4400',
  '5000',
  '6000',
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

    const rows: unknown[] = []
    for (const node of DEFAULT_FLOW_NODES) {
      const created = await this.prisma.flowConfig.upsert({
        where: {
          orgId_businessType_nodeCode: {
            orgId: dto.orgId,
            businessType,
            nodeCode: String(node.code)
          }
        },
        update: {
          name: `${node.phaseName}-${node.name}`,
          nodeName: node.name,
          approveLevel: node.approveLevel || 1,
          requireMaterials: Boolean(node.requireMaterials),
          requireApproval: node.requireApproval ?? true,
          autoPass: Boolean(node.autoPass),
          ruleConfig: this.buildRuleConfig(node),
          status: 'ACTIVE'
        },
        create: {
          tenantId,
          orgId: dto.orgId,
          name: `${node.phaseName}-${node.name}`,
          businessType,
          nodeCode: String(node.code),
          nodeName: node.name,
          approveLevel: node.approveLevel || 1,
          requireMaterials: Boolean(node.requireMaterials),
          requireApproval: node.requireApproval ?? true,
          autoPass: Boolean(node.autoPass),
          ruleConfig: this.buildRuleConfig(node),
          status: 'ACTIVE'
        }
      })
      rows.push(created)
    }
    return {
      count: rows.length,
      records: rows
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
    return config
  }
}
