import { computed, h, reactive, ref, shallowRef, watch } from 'vue'
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
import type { PageConfig, FieldConfig, FilterConfig, FormModel, FormValue, BusinessRouteMeta, ActionConfig, SearchFormItem, ColumnCheck, OptionConfig } from './types'
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
  const searchFormModel = ref<Record<string, FormValue>>({})
  const columnChecks = ref<ColumnCheck[]>([])
  const records = ref<Record<string, unknown>[]>([])
  const currentRow = ref<Record<string, unknown> | null>(null)
  const detailVisible = ref(false)
  const formVisible = ref(false)
  const actionVisible = ref(false)
  const formMode = ref<'create' | 'edit'>('create')
  const formModel = reactive<FormModel>({})
  const actionModel = reactive<FormModel>({})
  const activeAction = ref<ActionConfig | null>(null)
  const actionRow = ref<Record<string, unknown> | null>(null)
  const pagination = ref({ current: 1, size: 20, total: 0 })
  const activeNodeTab = ref('all')
  const activeMainTab = ref('1000')
  const routeMeta = computed(() => route.meta as BusinessRouteMeta)
  const extraFilterModel = reactive<FormModel>({})
  const phaseDetailRuntime = shallowRef<null | typeof import('./phase-detail-runtime')>(null)

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

  const phaseTabs = computed(() => {
    if (!phaseDetailRuntime.value) return []
    return phaseDetailRuntime.value.buildPhaseTabs(currentRow.value)
  })

  const defaultPhaseCode = computed(() => {
    const pathModule = getRoutePathModule()
    return Number(
      routeMeta.value.defaultQuery?.phaseCode ||
      applicationPhaseByPath[pathModule] ||
      moduleDefaultPhase[moduleName.value] ||
      1000
    )
  })

  async function ensurePhaseDetailRuntime() {
    if (phaseDetailRuntime.value) return phaseDetailRuntime.value
    const runtime = await import('./phase-detail-runtime')
    phaseDetailRuntime.value = runtime
    return runtime
  }

  // 从综合查询进入时，用订单自身状态决定默认 Tab
  function resolveRowPhaseCode(row: Record<string, unknown>): number {
    if (!phaseDetailRuntime.value) return defaultPhaseCode.value
    return phaseDetailRuntime.value.resolveRowPhaseCode(row, defaultPhaseCode.value)
  }

  // ==================== 搜索相关 ====================
  const statusFilterOptions = computed(() => {
    const optionsMap: Record<string, OptionConfig[]> = {
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
    const items: SearchFormItem[] = []
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
      const result: Record<string, unknown> = { phaseCode }
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
  function handleArtSearch(params: Record<string, FormValue>) {
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
    const runtime = await ensurePhaseDetailRuntime()
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
    const phaseCode = runtime.resolveRowPhaseCode(currentRow.value || row, defaultPhaseCode.value)
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

  function openAction(row: Record<string, unknown>, action: ActionConfig) {
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
