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

interface DefaultFlowNodeMeta {
  code: number
  name: string
  phaseCode: number
  phaseName: string
  sort: number
  parentNode?: number
  parallel?: boolean
  required?: boolean
  requireMaterials?: boolean
  requireApproval?: boolean
  autoPass?: boolean
  approveLevel?: number
  transitions?: FlowTransitionMeta[]
}

const DEFAULT_FLOW_NODES: DefaultFlowNodeMeta[] = [
  {
    code: 1100,
    name: '身份证信息',
    phaseCode: 1000,
    phaseName: '预审进件',
    sort: 1100,
    requireMaterials: true,
    requireApproval: false,
    transitions: [{ action: 10, toNode: 1200 }]
  },
  {
    code: 1200,
    name: '车辆信息',
    phaseCode: 1000,
    phaseName: '预审进件',
    sort: 1200,
    requireMaterials: true,
    requireApproval: false,
    transitions: [{ action: 10, toNode: 1300 }]
  },
  {
    code: 1300,
    name: '申请信息',
    phaseCode: 1000,
    phaseName: '预审进件',
    sort: 1300,
    requireMaterials: true,
    requireApproval: false,
    transitions: [{ action: 10, toNode: 1400 }]
  },
  {
    code: 1400,
    name: '签署授权书',
    phaseCode: 1000,
    phaseName: '预审进件',
    sort: 1400,
    requireMaterials: true,
    requireApproval: false,
    transitions: [{ action: 10, toNode: 2000 }]
  },
  {
    code: 2000,
    name: '风控模型预审',
    phaseCode: 2000,
    phaseName: '风控模型预审',
    sort: 2000,
    requireApproval: false,
    autoPass: true,
    transitions: [{ action: 20, toNode: 3000 }]
  },
  {
    code: 3000,
    name: '资方预审',
    phaseCode: 3000,
    phaseName: '资方预审',
    sort: 3000,
    requireApproval: true,
    transitions: [{ action: 20, toNode: 4000 }]
  },
  {
    code: 4000,
    name: '资料补充',
    phaseCode: 4000,
    phaseName: '资料补充',
    sort: 4000,
    requireMaterials: true,
    requireApproval: false,
    transitions: [{ action: 10, toNode: 5000, condition: 'REQUIRED_TASKS_COMPLETED' }]
  },
  {
    code: 4100,
    name: '客户资料',
    phaseCode: 4000,
    phaseName: '资料补充',
    sort: 4100,
    parentNode: 4000,
    parallel: true,
    required: true,
    requireMaterials: true,
    requireApproval: false
  },
  {
    code: 4200,
    name: '车辆资料',
    phaseCode: 4000,
    phaseName: '资料补充',
    sort: 4200,
    parentNode: 4000,
    parallel: true,
    required: true,
    requireMaterials: true,
    requireApproval: false
  },
  {
    code: 4300,
    name: '订单信息',
    phaseCode: 4000,
    phaseName: '资料补充',
    sort: 4300,
    parentNode: 4000,
    parallel: true,
    required: true,
    requireMaterials: true,
    requireApproval: false
  },
  {
    code: 4400,
    name: '文件信息',
    phaseCode: 4000,
    phaseName: '资料补充',
    sort: 4400,
    parentNode: 4000,
    parallel: true,
    required: true,
    requireMaterials: true,
    requireApproval: false
  },
  {
    code: 5000,
    name: '风控初审',
    phaseCode: 5000,
    phaseName: '风控初审',
    sort: 5000,
    requireApproval: true,
    transitions: [{ action: 20, toNode: 6000 }]
  },
  {
    code: 6000,
    name: '风控终审',
    phaseCode: 6000,
    phaseName: '风控终审',
    sort: 6000,
    requireApproval: true,
    approveLevel: 2,
    transitions: [{ action: 20, toNode: 7000 }]
  },
  {
    code: 7000,
    name: '请款资料',
    phaseCode: 7000,
    phaseName: '请款资料',
    sort: 7000,
    requireMaterials: true,
    requireApproval: false,
    transitions: [{ action: 10, toNode: 8000 }]
  },
  {
    code: 8000,
    name: '资方终审',
    phaseCode: 8000,
    phaseName: '资方终审',
    sort: 8000,
    requireApproval: true,
    transitions: [{ action: 20, toNode: 9000 }]
  },
  {
    code: 9000,
    name: '资方放款',
    phaseCode: 9000,
    phaseName: '资方放款',
    sort: 9000,
    requireApproval: false
  }
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
        parentNode: node.parentNode,
        parallel: Boolean(node.parallel),
        required: Boolean(node.required),
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
    return config
  }
}
