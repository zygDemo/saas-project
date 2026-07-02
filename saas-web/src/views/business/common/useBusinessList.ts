import { computed, h, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox, ElTag, ElButton, ElSpace } from 'element-plus'
import {
  fetchBusinessAction,
  fetchBusinessCreate,
  fetchBusinessDelete,
  fetchBusinessDetail,
  fetchBusinessList,
  fetchBusinessUpdate
} from '@/api/business'
import { useUserStore } from '@/store/modules/user'
import type { PageConfig, FieldConfig, FilterConfig, FormModel, FormValue, BusinessRouteMeta } from './types'
import {
  applicationNodeByPath, applicationPhaseByPath, phaseNodeTabsMap, phaseTitleMap,
  commonStatusMap,
  orgStatusOptions, activeStatusOptions, leadStatusOptions,
  applicationStatusOptions, signingStatusOptions,
  disbursementStatusOptions, repaymentStatusOptions,
  orgPackageOptions, apiEnabledOptions, orgExpireStateOptions,
  flowNodeOptions, flowPhaseOptions, flowNodeStatusOptions, flowBusinessTypeOptions, funderTypeOptions,
  approvalActionOptions, toOption
} from './constants'
import { configs } from './configs'
import {
  flattenRelations, formatCell, statusTagType, resetModel, cleanPayload,
  validateRequired, shouldShowFieldGroup, fieldOptions, getRemoteOptionParams,
  orgCount, orgExpiryMeta, getOrgExpireState, packageLabel
} from './helpers'
import { useRemoteOptions } from './useRemoteOptions'

export function useBusinessList() {
  const route = useRoute()
  const userStore = useUserStore()
  const currentUserId = computed(() => Number(userStore.info?.userId) || undefined)

  // ==================== 状态 ====================
  const loading = ref(false)
  const submitting = ref(false)
  const keyword = ref('')
  const status = ref('')
  const showActions = ref(true)
  const searchFormModel = ref<Record<string, any>>({})
  const columnChecks = ref<any[]>([])
  const records = ref<Record<string, unknown>[]>([])
  const currentRow = ref<Record<string, unknown> | null>(null)
  const detailVisible = ref(false)
  const formVisible = ref(false)
  const actionVisible = ref(false)
  const formMode = ref<'create' | 'edit'>('create')
  const formModel = reactive<FormModel>({})
  const actionModel = reactive<FormModel>({})
  const activeAction = ref<any>(null)
  const actionRow = ref<Record<string, unknown> | null>(null)
  const pagination = ref({ current: 1, size: 20, total: 0 })
  const activeNodeTab = ref('all')
  const activeMainTab = ref('1000')
  const routeMeta = computed(() => route.meta as BusinessRouteMeta)
  const extraFilterModel = reactive<FormModel>({})

  // Remote options
  const { selectOptions, selectLoading, loadRemoteOptions, loadRemoteFilterOptions } =
    useRemoteOptions(formModel)

  // ==================== 路由/配置解析 ====================
  function getRoutePathModule(): string {
    return String(route.path || '').split('/').filter(Boolean).pop() || ''
  }

  function resolveBusinessModule(): string {
    const metaModule = routeMeta.value.businessModule
    if (metaModule && configs[String(metaModule)]) return String(metaModule)
    const pathModule = getRoutePathModule()
    if (applicationPhaseByPath[pathModule]) return 'application'
    if (pathModule && configs[pathModule]) return pathModule
    const name = String(route.name || '').replace(/^Business/i, '')
    const routeNameModule = name ? name.charAt(0).toLowerCase() + name.slice(1) : ''
    if (routeNameModule && configs[routeNameModule]) return routeNameModule
    return 'application'
  }

  const moduleName = computed(() => resolveBusinessModule())
  const config = computed(() => configs[moduleName.value] || configs.application)
  const displayTitle = computed(() => {
    // 非 application 模块（如 order-query）用自身 config 标题
    if (moduleName.value !== 'application') return config.value.title
    const phaseCode = Number(
      routeMeta.value.defaultQuery?.phaseCode || applicationPhaseByPath[getRoutePathModule()]
    )
    return phaseTitleMap[phaseCode] || config.value.title
  })
  const isOrgModule = computed(() => moduleName.value === 'org')
  const showActionOverview = computed(() => config.value.actions.length > 0 && !isOrgModule.value)
  const formFields = computed(() => config.value.formFields)
  const actionFields = computed(() => activeAction.value?.fields || [])
  const detailColumns = computed(() => [
    { prop: 'id', label: 'ID' },
    ...(config.value.detailColumns || config.value.columns),
    { prop: 'createdAt', label: '创建时间' },
    { prop: 'updatedAt', label: '更新时间' }
  ])

  // 模块默认阶段映射（不走 applicationPhaseByPath，避免影响 resolveBusinessModule）
  const moduleDefaultPhase: Record<string, number> = { 'order-query': 1000 }

  const phaseNodeTabs = computed(() => {
    const phaseCode = Number(
      routeMeta.value.defaultQuery?.phaseCode ||
      applicationPhaseByPath[getRoutePathModule()] ||
      moduleDefaultPhase[moduleName.value]
    )
    return phaseNodeTabsMap[phaseCode] || []
  })

  // ==================== 阶段Tab配置：按节点展示订单字段 ====================
  // 节点 → 数据源 + 字段列表
  const nodeFieldDefs: Record<number, { source?: string; label: string; fields: string[] }> = {
    1100: { source: 'customer', label: '身份证信息', fields: ['name', 'phone', 'idCard', 'gender', 'birthDate', 'nation', 'householdAddress', 'issuingAuthority', 'idCardValidFrom', 'idCardValidTo', 'idCardFront', 'idCardBack', 'maritalStatus', 'education', 'occupation', 'companyName', 'monthlyIncome', 'address', 'emergencyName', 'emergencyPhone', 'status'] },
    1110: { source: 'vehicle', label: '车辆信息', fields: ['plateNumber', 'vin', 'vehicleCode', 'brand', 'model', 'ownerName', 'address', 'usageNature', 'sealInfo', 'engineNumber', 'registerDate', 'vehicleImgUrl', 'mileage', 'color', 'year', 'purchasePrice', 'estimateValue', 'isMortgaged', 'mortgageInfo'] },
    1120: { source: '', label: '申请信息', fields: ['applicationNo', 'amount', 'term', 'rate', 'repaymentMethod', 'purpose', 'productName', 'funderName', 'orgName', 'creatorName', 'createdAt'] },
    1130: { source: '', label: '签署授权书', fields: ['files'] },
    1140: { source: '', label: '待预审', fields: ['status', 'currentNodeName', 'currentStatusName', 'phaseName', 'remark'] },
    1200: { source: '', label: '风控预审', fields: ['approvals'] },
    1250: { source: 'funder', label: '资方预审', fields: ['name', 'funderType', 'code', 'contactName', 'contactPhone', 'integrationMode', 'creditLimit', 'priority', 'status'] },
    1300: { source: '', label: '资料补充', fields: ['supplementReason', 'supplementDeadline'] },
    1310: { source: 'customer', label: '客户资料', fields: ['name', 'phone', 'idCard', 'gender', 'birthDate', 'address'] },
    1320: { source: 'vehicle', label: '车辆资料', fields: ['plateNumber', 'vin', 'brand', 'model'] },
    1330: { source: '', label: '订单资料', fields: ['applicationNo', 'amount', 'term', 'rate'] },
    1340: { source: '', label: '文件资料', fields: ['files'] },
    1350: { source: '', label: '待提交', fields: ['status', 'currentNodeName'] },
    1400: { source: '', label: '风控初审', fields: ['approvals'] },
    1450: { source: '', label: '风控终审', fields: ['approvals'] },
    1500: { source: 'funder', label: '资方终审', fields: ['name', 'funderType', 'contactName', 'contactPhone'] },
    1600: { source: '', label: '签约办理', fields: ['sign'] },
    1610: { source: '', label: '额度确认', fields: ['approvedAmount', 'approvedTerm', 'approvedRate'] },
    1620: { source: '', label: '绑银行卡', fields: [] },
    1630: { source: '', label: '合同签署', fields: ['sign'] },
    1640: { source: '', label: 'GPS安装', fields: ['disbursement'] },
    1650: { source: '', label: '抵押办理', fields: ['disbursement'] },
    1660: { source: '', label: '待请款', fields: ['status', 'currentNodeName'] },
    1700: { source: '', label: '请款资料', fields: ['disbursement'] },
    1800: { source: '', label: '资方放款', fields: ['disbursement'] },
    1900: { source: '', label: '贷后还款', fields: ['repaymentSummary', 'repayments'] }
  }

  const phaseConfig = [
    { 
      code: 1000, 
      name: '预审阶段', 
      nodes: [1100, 1110, 1120, 1130, 1140, 1200, 1250],
      actions: [
        { name: 'submit', label: '提交进件', type: 'primary', visible: (row: any) => ['DRAFT', 'PENDING_SUPPLEMENT'].includes(String(row.status)) },
        { name: 'risk-pre-pass', label: '风控预审通过', type: 'success', visible: (row: any) => ['SUBMITTED', 'PENDING_RISK_PRE'].includes(String(row.status)) },
        { name: 'risk-pre-reject', label: '风控预审拒绝', type: 'danger', visible: (row: any) => ['SUBMITTED', 'PENDING_RISK_PRE'].includes(String(row.status)) },
        { name: 'funder-pre-pass', label: '资方预审通过', type: 'success', visible: (row: any) => String(row.status) === 'PENDING_FUNDER_PRE' },
        { name: 'funder-pre-reject', label: '资方预审拒绝', type: 'danger', visible: (row: any) => String(row.status) === 'PENDING_FUNDER_PRE' }
      ]
    },
    { 
      code: 1300, 
      name: '补件阶段', 
      nodes: [1300, 1310, 1320, 1330, 1340, 1350],
      actions: [
        { name: 'complete-supplement', label: '资料补充完成', type: 'primary', visible: (row: any) => ['PENDING_SUPPLEMENT', 'FUNDER_PRE_PASSED'].includes(String(row.status)) }
      ]
    },
    { 
      code: 1400, 
      name: '风控审批', 
      nodes: [1400, 1450],
      actions: [
        { name: 'approve', label: '初审/终审通过', type: 'success', visible: (row: any) => ['PENDING_FIRST_REVIEW', 'PENDING_FINAL_REVIEW'].includes(String(row.status)) },
        { name: 'reject', label: '审批驳回', type: 'danger', visible: (row: any) => ['PENDING_FIRST_REVIEW', 'PENDING_FINAL_REVIEW', 'PENDING_FUNDER_REVIEW'].includes(String(row.status)) },
        { name: 'supplement', label: '要求补件', type: 'warning', visible: (row: any) => ['PENDING_FIRST_REVIEW', 'PENDING_FINAL_REVIEW', 'PENDING_FUNDER_REVIEW'].includes(String(row.status)) },
        { name: 'submit-funder-review', label: '提交资方审批', type: 'primary', visible: (row: any) => String(row.status) === 'FINAL_REVIEW_PASSED' }
      ]
    },
    { 
      code: 1500, 
      name: '资方终审', 
      nodes: [1500],
      actions: [
        { name: 'funder-pass', label: '资方通过', type: 'success', visible: (row: any) => String(row.status) === 'PENDING_FUNDER_REVIEW' },
        { name: 'funder-reject', label: '资方拒绝', type: 'danger', visible: (row: any) => String(row.status) === 'PENDING_FUNDER_REVIEW' },
        { name: 'start-signing', label: '发起签约', type: 'primary', visible: (row: any) => ['FINAL_REVIEW_PASSED', 'FUNDER_REVIEW_PASSED'].includes(String(row.status)) }
      ]
    },
    { 
      code: 1600, 
      name: '签约阶段', 
      nodes: [1600, 1610, 1620, 1630, 1640, 1650, 1660],
      actions: [
        { name: 'complete-signing', label: '签约完成', type: 'success', visible: (row: any) => ['PENDING_SIGN', 'SIGNING_PROGRESS'].includes(String(row.status)) }
      ]
    },
    { 
      code: 1700, 
      name: '请款放款', 
      nodes: [1700, 1800],
      actions: [
        { name: 'submit-loan-request', label: '提交请款资料', type: 'primary', visible: (row: any) => ['SIGNED', 'PENDING_LOAN_REQUEST', 'LOAN_REQUEST_REJECTED'].includes(String(row.status)) },
        { name: 'approve-loan-request', label: '请款审核通过', type: 'success', visible: (row: any) => String(row.status) === 'LOAN_REQUEST_REVIEWING' },
        { name: 'reject-loan-request', label: '请款审核拒绝', type: 'danger', visible: (row: any) => String(row.status) === 'LOAN_REQUEST_REVIEWING' },
        { name: 'gps-installed', label: 'GPS安装完成', type: 'success', visible: (row: any) => String(row.status) === 'PENDING_DISBURSEMENT' },
        { name: 'mortgage-done', label: '抵押完成', type: 'success', visible: (row: any) => String(row.status) === 'PENDING_DISBURSEMENT' },
        { name: 'request-disbursement', label: '提交资方放款', type: 'primary', visible: (row: any) => ['LOAN_REQUEST_APPROVED', 'PENDING_DISBURSEMENT'].includes(String(row.status)) },
        { name: 'confirm-disbursement', label: '放款确认', type: 'success', visible: (row: any) => String(row.status) === 'PENDING_DISBURSEMENT' }
      ]
    },
    { 
      code: 1900, 
      name: '贷后阶段', 
      nodes: [1900],
      actions: [
        { name: 'settle', label: '结清归档', type: 'success', visible: (row: any) => String(row.status) === 'DISBURSED' }
      ]
    }
  ]

  // 中文标签映射
  const fieldLabelMap: Record<string, string> = {
    name: '姓名', phone: '手机号', idCard: '身份证号', gender: '性别', birthDate: '出生日期',
    nation: '民族', householdAddress: '户籍地址', issuingAuthority: '签发机关',
    idCardValidFrom: '身份证有效期起', idCardValidTo: '身份证有效期止',
    maritalStatus: '婚姻状况', education: '学历', occupation: '职业',
    companyName: '单位名称', monthlyIncome: '月收入', address: '地址',
    emergencyName: '紧急联系人', emergencyPhone: '紧急联系人电话',
    plateNumber: '车牌号', vin: '车架号', brand: '品牌', model: '车型',
    ownerName: '车主', usageNature: '使用性质', sealInfo: '印章信息',
    engineNumber: '发动机号', registerDate: '注册日期', mileage: '里程',
    color: '颜色', year: '年份', purchasePrice: '购买价格', estimateValue: '评估价值',
    isMortgaged: '是否抵押', mortgageInfo: '抵押信息',
    applicationNo: '申请编号', amount: '申请金额', term: '期限(月)', rate: '年利率',
    repaymentMethod: '还款方式', purpose: '贷款用途', productName: '产品',
    funderName: '资方', orgName: '所属机构', creatorName: '创建人', createdAt: '创建时间',
    status: '状态', currentNodeName: '当前节点', currentStatusName: '节点状态',
    phaseName: '当前阶段', remark: '备注',
    funderType: '资方类型', code: '编码', contactName: '联系人', contactPhone: '联系电话',
    integrationMode: '对接方式', creditLimit: '授信额度', priority: '优先级',
    supplementReason: '补件原因', supplementDeadline: '补件截止',
    idCardFront: '身份证正面', idCardBack: '身份证反面', vehicleCode: '车辆编码', vehicleImgUrl: '车辆照片',
    approvedAmount: '审批金额', approvedTerm: '审批期限', approvedRate: '审批利率'
  }

  function getFileType(fileName: string): 'image' | 'pdf' | 'video' | 'audio' | 'other' {
    const ext = (fileName || '').split('.').pop()?.toLowerCase() || ''
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) return 'image'
    if (ext === 'pdf') return 'pdf'
    if (['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv'].includes(ext)) return 'video'
    if (['mp3', 'wav', 'ogg', 'aac', 'flac'].includes(ext)) return 'audio'
    return 'other'
  }

  function extractNodeFields(row: Record<string, unknown>, nodeCode: number) {
    const def = nodeFieldDefs[nodeCode]
    if (!def) return []
    const sourceData = def.source ? (row[def.source] as Record<string, unknown> || {}) : row

    // 文件节点特殊处理：提取 files 数组并附加类型信息
    if (nodeCode === 1340 || nodeCode === 1130) {
      const files = (row.files || []) as any[]
      if (!files.length) return []
      return [{
        prop: '_files',
        label: '文件资料',
        value: files.map((f: any) => ({
          ...f,
          displayType: getFileType(f.fileName || f.fileUrl || '')
        }))
      }]
    }

    return def.fields
      .filter(f => sourceData[f] !== undefined && sourceData[f] !== null && sourceData[f] !== '')
      .map(f => ({ prop: f, label: fieldLabelMap[f] || f, value: sourceData[f] }))
  }

  const phaseTabs = computed(() =>
    phaseConfig.map(phase => ({
      code: phase.code,
      name: phase.name,
      actions: phase.actions || [],
      groups: phase.nodes.map(nodeCode => {
        const fields = currentRow.value ? extractNodeFields(currentRow.value, nodeCode) : []
        return {
          nodeCode,
          nodeName: nodeFieldDefs[nodeCode]?.label || `节点${nodeCode}`,
          fields
        }
      }).filter(g => g.fields.length > 0)
    }))
  )

  const defaultPhaseCode = computed(() => {
    const pathModule = getRoutePathModule()
    return Number(
      routeMeta.value.defaultQuery?.phaseCode ||
      applicationPhaseByPath[pathModule] ||
      moduleDefaultPhase[moduleName.value] ||
      1000
    )
  })

  // 从综合查询进入时，用订单自身的 phaseCode 决定默认 Tab
  function resolveRowPhaseCode(row: Record<string, unknown>): number {
    const rowPhase = Number(row.phaseCode || row.nodeCode || 0)
    if (rowPhase && phaseConfig.some(p => p.code === rowPhase || p.nodes.some(n => n === rowPhase))) {
      return rowPhase
    }
    // 根据 currentNode 反推 phaseCode
    const nodeMap: Record<number, number> = {
      1100: 1000, 1110: 1000, 1120: 1000, 1130: 1000, 1140: 1000, 1200: 1000, 1250: 1000,
      1300: 1300, 1310: 1300, 1320: 1300, 1330: 1300, 1340: 1300, 1350: 1300,
      1400: 1400, 1450: 1400,
      1500: 1500,
      1600: 1600, 1610: 1600, 1620: 1600, 1630: 1600, 1640: 1600, 1650: 1600, 1660: 1600,
      1700: 1700, 1800: 1700,
      1900: 1900
    }
    const mapped = nodeMap[Number(row.currentNode || 0)]
    return mapped || defaultPhaseCode.value
  }

  // ==================== 搜索相关 ====================
  const statusFilterOptions = computed(() => {
    const optionsMap: Record<string, any[]> = {
      org: orgStatusOptions,
      product: activeStatusOptions,
      funder: activeStatusOptions,
      'flow-config': activeStatusOptions,
      lead: leadStatusOptions,
      customer: activeStatusOptions,
      application: applicationStatusOptions,
      'order-query': applicationStatusOptions,
      signing: signingStatusOptions,
      disbursement: disbursementStatusOptions,
      repayment: repaymentStatusOptions
    }
    return optionsMap[moduleName.value] || []
  })

  const extraFilters = computed<FilterConfig[]>(() => {
    const m = moduleName.value
    const filters: FilterConfig[] = []
    if (['dept', 'product', 'funder', 'flow-config', 'lead', 'customer', 'application', 'order-query'].includes(m)) {
      filters.push({ prop: 'orgId', label: '所属机构', type: 'select', remoteOptions: { module: 'org', params: { status: 'ACTIVE' } } })
    }
    if (m === 'org') {
      filters.push({ prop: 'packageType', label: '套餐类型', type: 'select', options: orgPackageOptions })
      filters.push({ prop: 'apiEnabled', label: 'API接入', type: 'select', options: apiEnabledOptions })
      filters.push({ prop: 'expireState', label: '到期状态', type: 'select', options: orgExpireStateOptions })
    }
    if (m === 'application') {
      filters.push({ prop: 'customerId', label: '客户ID', type: 'number' })
      filters.push({ prop: 'creatorId', label: '创建人ID', type: 'number' })
    }
    if (m === 'order-query') {
      filters.push({ prop: 'phaseCode', label: '流程阶段', type: 'select', options: flowPhaseOptions })
      filters.push({ prop: 'nodeCode', label: '当前节点', type: 'select', options: flowNodeOptions })
      filters.push({ prop: 'nodeStatus', label: '节点状态', type: 'select', options: flowNodeStatusOptions })
      filters.push({ prop: 'orderNo', label: '订单号', type: 'text' })
      filters.push({ prop: 'customerName', label: '客户姓名', type: 'text' })
      filters.push({ prop: 'phone', label: '手机号', type: 'text' })
      filters.push({ prop: 'plateNumber', label: '车牌号', type: 'text' })
    }
    if (['approval', 'signing', 'disbursement', 'repayment'].includes(m)) {
      filters.push({ prop: 'applicationId', label: '进件ID', type: 'number' })
    }
    if (m === 'approval') {
      filters.push({ prop: 'stage', label: '审批阶段', type: 'select', options: ['FIRST_REVIEW', 'FINAL_REVIEW', 'FUNDER_REVIEW', 'SUPPLEMENT'].map(toOption) })
      filters.push({ prop: 'action', label: '审批动作', type: 'select', options: approvalActionOptions })
    }
    if (m === 'lead') {
      filters.push({ prop: 'assigneeId', label: '负责人ID', type: 'number' })
    }
    if (m === 'dept') {
      filters.push({ prop: 'parentId', label: '上级部门ID', type: 'number' })
    }
    if (m === 'product') {
      filters.push({ prop: 'productType', label: '产品类型', type: 'select', options: [{ label: '车贷', value: 'CAR_LOAN' }] })
    }
    if (m === 'funder') {
      filters.push({ prop: 'funderType', label: '资方类型', type: 'select', options: funderTypeOptions })
    }
    if (m === 'flow-config') {
      filters.push({ prop: 'businessType', label: '业务类型', type: 'select', options: flowBusinessTypeOptions })
      filters.push({ prop: 'nodeCode', label: '流程节点', type: 'select', options: flowNodeOptions })
    }
    return filters
  })

  const searchFormItems = computed(() => {
    const items: any[] = []
    const cfg = config.value
    if (cfg.keywordField) {
      items.push({ key: cfg.keywordField, label: '关键词', type: 'input', placeholder: cfg.keywordPlaceholder || '请输入关键词', clearable: true })
    }
    if (phaseNodeTabs.value.length && moduleName.value !== 'order-query') {
      items.push({ key: 'currentNode', label: '流程节点', type: 'select', props: { placeholder: '全部节点', clearable: true, filterable: true, options: phaseNodeTabs.value.map((tab) => ({ label: tab.label, value: tab.value })) } })
    }
    if (statusFilterOptions.value.length) {
      items.push({ key: 'status', label: '状态', type: 'select', props: { placeholder: '请选择状态', clearable: true, filterable: true, options: statusFilterOptions.value } })
    }
    for (const filter of extraFilters.value) {
      const options = filter.remoteOptions ? selectOptions[`filter:${filter.prop}`] || [] : filter.options || []
      items.push({ key: filter.prop, label: filter.label, type: filter.type === 'number' ? 'number' : filter.type === 'text' ? 'input' : 'select', props: { placeholder: filter.label, clearable: true, filterable: filter.type !== 'text', options: filter.type === 'select' ? options : undefined } })
    }
    return items
  })

  const orgSummaryItems = computed(() => [
    { label: '机构总数', value: pagination.value.total, icon: 'ri:building-2-line', tone: 'is-primary' },
    { label: '当前页启用', value: records.value.filter((row) => row.status === 'ACTIVE').length, icon: 'ri:checkbox-circle-line', tone: 'is-success' },
    { label: '当前页API已开启', value: records.value.filter((row) => row.apiEnabled !== false).length, icon: 'ri:cloud-line', tone: 'is-info' },
    { label: '当前页30天内到期', value: records.value.filter((row) => getOrgExpireState(row.expireAt) === 'EXPIRING').length, icon: 'ri:calendar-event-line', tone: 'is-warning' }
  ])

  // ==================== 数据操作 ====================
  function resolveDefaultQuery(): Record<string, unknown> {
    // 综合查询使用 defaultQuery 只为启用/默认详情阶段 Tab，不限制列表默认查询范围
    if (moduleName.value === 'order-query') return {}
    if (routeMeta.value.defaultQuery) return routeMeta.value.defaultQuery
    const pathModule = getRoutePathModule()
    const phaseCode = applicationPhaseByPath[pathModule]
    if (phaseCode) {
      const result: Record<string, any> = { phaseCode }
      if (activeNodeTab.value !== 'all') result.currentNode = Number(activeNodeTab.value)
      return result
    }
    const currentNode = applicationNodeByPath[pathModule]
    return currentNode ? { currentNode } : {}
  }

  async function loadData() {
    loadRemoteFilterOptions(extraFilters.value)
    loading.value = true
    try {
      const params: Record<string, unknown> = {
        current: pagination.value.current,
        size: pagination.value.size
      }
      if (keyword.value && config.value.keywordField)
        params[config.value.keywordParam || config.value.keywordField] = keyword.value
      if (status.value && statusFilterOptions.value.length) params.status = status.value
      for (const filter of extraFilters.value) {
        const v = extraFilterModel[filter.prop]
        if (v !== undefined && v !== null && v !== '') params[filter.prop] = v
      }
      Object.assign(params, resolveDefaultQuery())
      const result = await fetchBusinessList(config.value.api, params, config.value.listApi)
      const rawRecords = (result.records || []) as Record<string, unknown>[]
      records.value = rawRecords.map((r) => flattenRelations(r))
      pagination.value.total = result.total || 0
    } finally {
      loading.value = false
    }
  }

  function handleSizeChange(size: number) {
    pagination.value.size = size
    pagination.value.current = 1
    loadData()
  }

  function handleCurrentChange(current: number) {
    pagination.value.current = current
    loadData()
  }

  // ==================== 搜索 ====================
  function handleArtSearch(params: Record<string, any>) {
    const cfg = config.value
    keyword.value = cfg.keywordField && params[cfg.keywordField] ? String(params[cfg.keywordField]) : ''
    status.value = params.status ? String(params.status) : ''
    activeNodeTab.value = params.currentNode !== undefined ? (params.currentNode ? String(params.currentNode) : 'all') : 'all'
    for (const filter of extraFilters.value) {
      if (params[filter.prop] !== undefined) extraFilterModel[filter.prop] = params[filter.prop]
      else delete extraFilterModel[filter.prop]
    }
    pagination.value.current = 1
    loadData()
  }

  function handleArtReset() {
    keyword.value = ''
    status.value = ''
    activeNodeTab.value = 'all'
    searchFormModel.value = {}
    for (const key of Object.keys(extraFilterModel)) delete extraFilterModel[key]
    pagination.value.current = 1
    loadData()
  }

  // ==================== CRUD ====================
  function openCreate() {
    formMode.value = 'create'
    resetModel(formModel, formFields.value)
    formVisible.value = true
    loadRemoteOptions(formFields.value)
  }

  function openEdit(row: Record<string, unknown>) {
    formMode.value = 'edit'
    resetModel(formModel, formFields.value, row)
    currentRow.value = row
    formVisible.value = true
    loadRemoteOptions(formFields.value)
  }

    async function openDetail(row: Record<string, unknown>) {
    currentRow.value = row
    detailVisible.value = true
    try {
      const detail = await fetchBusinessDetail(config.value.api, Number(row.id))
      const flat = flattenRelations(detail)
      // 显式保留 customer 等嵌套对象，避免被展开后丢失
      if (detail.customer) flat.customer = detail.customer
      if (detail.vehicle) flat.vehicle = detail.vehicle
      if (Array.isArray(detail.vehicles) && detail.vehicles.length) flat.vehicles = detail.vehicles
      currentRow.value = { ...row, ...flat }
    } catch {
      currentRow.value = row
    }
    // 根据订单自身状态决定默认 Tab（综合查询场景）
    const phaseCode = resolveRowPhaseCode(currentRow.value || row)
    activeMainTab.value = String(phaseCode)
  }

  async function submitForm() {
    const error = validateRequired(formFields.value, formModel)
    if (error) { ElMessage.warning(error); return }
    submitting.value = true
    try {
      const payload = cleanPayload(formModel, formFields.value)
      if (formMode.value === 'create') await fetchBusinessCreate(config.value.api, payload)
      else if (currentRow.value?.id) await fetchBusinessUpdate(config.value.api, Number(currentRow.value.id), payload)
      ElMessage.success('保存成功')
      formVisible.value = false
      await loadData()
    } catch (error) {
      ElMessage.error(error instanceof Error ? error.message : '保存失败')
    } finally {
      submitting.value = false
    }
  }

  async function handleDelete(row: Record<string, unknown>) {
    try {
      const message = isOrgModule.value
        ? '删除机构会同步移除其关联业务数据，请确认该机构已停止使用。是否继续删除？'
        : `确认删除该${config.value.title}记录？`
      await ElMessageBox.confirm(message, '删除确认', { type: 'warning' })
      await fetchBusinessDelete(config.value.api, Number(row.id))
      ElMessage.success('删除成功')
      await loadData()
    } catch { /* cancel */ }
  }

  // ==================== 业务动作 ====================
  function rowActions(row: Record<string, unknown>) {
    return config.value.actions.filter((action) => !action.visible || action.visible(row))
  }

  function openAction(row: Record<string, unknown>, action: any) {
    activeAction.value = action
    actionRow.value = row
    const defaults = action.defaults?.(row) || {}
    const operatorProps = ['approverId', 'createdBy']
    for (const prop of operatorProps) {
      if (action.fields?.some((field: FieldConfig) => field.prop === prop) && defaults[prop] === undefined && currentUserId.value) {
        defaults[prop] = currentUserId.value
      }
    }
    resetModel(actionModel, action.fields || [], defaults)
    if (!action.fields?.length) {
      ElMessageBox.confirm(`确认执行"${action.label}"？`, '业务动作确认', { type: 'warning' })
        .then(() => submitAction())
        .catch(() => undefined)
      return
    }
    actionVisible.value = true
  }

  async function submitAction() {
    if (!activeAction.value || !actionRow.value) return
    const error = validateRequired(actionFields.value, actionModel)
    if (error) { ElMessage.warning(error); return }
    submitting.value = true
    try {
      await fetchBusinessAction(
        activeAction.value.path(actionRow.value),
        cleanPayload(actionModel, actionFields.value)
      )
      ElMessage.success('操作成功')
      actionVisible.value = false
      await loadData()
    } catch (error) {
      ElMessage.error(error instanceof Error ? error.message : '操作失败')
    } finally {
      submitting.value = false
    }
  }

  function resetRuntimeState() {
    keyword.value = ''
    status.value = ''
    activeNodeTab.value = 'all'
    records.value = []
    currentRow.value = null
    detailVisible.value = false
    formVisible.value = false
    actionVisible.value = false
    activeAction.value = null
    actionRow.value = null
    pagination.value.current = 1
    pagination.value.total = 0
    for (const key of Object.keys(extraFilterModel)) delete extraFilterModel[key]
  }

  function handleFieldChange(field: FieldConfig, value: FormValue) {
    if (moduleName.value === 'dept' && field.prop === 'orgId') {
      formModel.parentId = undefined
      formModel.managerId = undefined
      if (value) loadRemoteOptions(formFields.value, ['parentId', 'managerId'])
      else { selectOptions.parentId = []; selectOptions.managerId = [] }
      return
    }
    if (moduleName.value === 'lead' && field.prop === 'orgId') {
      formModel.assigneeId = undefined
      if (value) loadRemoteOptions(formFields.value, ['assigneeId'])
      else selectOptions.assigneeId = []
    }
  }

  // ==================== 返回 ====================
  return {
    // 状态
    loading, submitting, keyword, status, showActions,
    searchFormModel, columnChecks, records, currentRow,
    detailVisible, formVisible, actionVisible, formMode,
    formModel, actionModel, activeAction, actionRow,
    pagination, activeNodeTab, selectOptions, selectLoading,
    extraFilterModel,
    // 计算属性
    config, displayTitle, isOrgModule, showActionOverview,
    formFields, actionFields, detailColumns, phaseNodeTabs, phaseTabs, defaultPhaseCode, activeMainTab,
    statusFilterOptions, extraFilters, searchFormItems, orgSummaryItems,
    moduleName,
    // 方法
    loadData, handleSizeChange, handleCurrentChange,
    handleArtSearch, handleArtReset,
    openCreate, openEdit, openDetail, submitForm, handleDelete,
    rowActions, openAction, submitAction, resetRuntimeState,
    handleFieldChange,
    // 从 helpers 传出的格式化函数
    formatCell: (row: Record<string, unknown>, prop: string) => formatCell(row, prop, config.value),
    statusTagType, shouldShowFieldGroup: (field: FieldConfig, index: number) =>
      shouldShowFieldGroup(formFields.value, field, index),
    fieldOptions: (field: FieldConfig) => fieldOptions(field, selectOptions),
    orgCount, orgExpiryMeta, getOrgExpireState, packageLabel
  }
}
