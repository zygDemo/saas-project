<template>
  <div class="flow-config-page art-full-height">
    <ElCard class="flow-toolbar" shadow="never">
      <div class="flow-toolbar__main">
        <div>
          <h3>流程节点管理</h3>
          <p>按订单流程维护分段数字节点、动作跳转和资料补充并行子任务。</p>
        </div>
        <ElSpace wrap>
          <ElSelect
            v-model="query.orgId"
            filterable
            placeholder="所属机构"
            :loading="orgLoading"
            style="width: 220px"
            @change="handleScopeChange"
          >
            <ElOption
              v-for="org in orgOptions"
              :key="org.value"
              :label="org.label"
              :value="org.value"
            />
          </ElSelect>
          <ElSelect
            v-model="query.businessType"
            placeholder="业务类型"
            style="width: 160px"
            @change="handleScopeChange"
          >
            <ElOption
              v-for="item in meta.businessTypes"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
          <ElInput
            v-model="keyword"
            clearable
            placeholder="节点名称/编号"
            style="width: 180px"
            @keyup.enter="loadData"
          />
          <ElButton type="primary" @click="loadData">
            <ArtSvgIcon icon="ri:search-line" class="mr-1" />
            查询
          </ElButton>
          <ElButton @click="resetSearch">
            <ArtSvgIcon icon="ri:restart-line" class="mr-1" />
            重置
          </ElButton>
        </ElSpace>
      </div>
      <div class="flow-toolbar__actions">
        <ElButton
          type="primary"
          plain
          :disabled="!query.orgId"
          :loading="initLoading"
          @click="initDefaultFlow"
        >
          <ArtSvgIcon icon="ri:git-branch-line" class="mr-1" />
          初始化默认流程
        </ElButton>
        <ElButton type="primary" @click="openCreate">
          <ArtSvgIcon icon="ri:add-line" class="mr-1" />
          新增节点
        </ElButton>
        <ElButton :loading="loading" @click="loadData">
          <ArtSvgIcon icon="ri:refresh-line" class="mr-1" />
          刷新
        </ElButton>
      </div>
    </ElCard>

    <div class="flow-layout">
      <ElCard class="flow-map" shadow="never">
        <template #header>
          <div class="flow-card-title">
            <span>业务流程</span>
            <ElTag type="info" effect="plain">{{ filteredRecords.length }} 个节点</ElTag>
          </div>
        </template>
        <ElTimeline>
          <ElTimelineItem
            v-for="phase in phaseGroups"
            :key="phase.code"
            :timestamp="`${phase.code}`"
            placement="top"
          >
            <div class="phase-block">
              <div class="phase-block__head">
                <strong>{{ phase.name }}</strong>
                <span>{{ phase.nodes.length }} 项</span>
              </div>
              <div class="phase-block__nodes">
                <button
                  v-for="node in phase.nodes"
                  :key="node.nodeCode"
                  :class="[
                    'node-pill',
                    nodeRule(node).parallel && 'is-parallel',
                    node.status !== 'ACTIVE' && 'is-inactive'
                  ]"
                  @click="focusNode(node)"
                >
                  <span>{{ node.nodeCode }}</span>{{ node.nodeName }}
                </button>
              </div>
            </div>
          </ElTimelineItem>
        </ElTimeline>
      </ElCard>

      <ElCard class="flow-table-card" shadow="never">
        <template #header>
          <div class="flow-card-title">
            <span>节点配置</span>
            <ElTag type="primary" effect="light">{{ businessTypeLabel(query.businessType) }}</ElTag>
          </div>
        </template>
        <ArtTable
          ref="tableRef"
          :loading="loading"
          :data="filteredRecords"
          :columns="tableColumns"
          :show-table-header="false"
          empty-text="暂无流程节点"
        />
      </ElCard>
    </div>

    <ElDrawer
      v-model="formVisible"
      :title="formMode === 'create' ? '新增流程节点' : '编辑流程节点'"
      size="560px"
    >
      <ElForm label-width="110px" class="flow-form">
        <ElFormItem label="所属机构" required>
          <ElSelect
            v-model="formModel.orgId"
            filterable
            placeholder="请选择所属机构"
            style="width: 100%"
          >
            <ElOption
              v-for="org in orgOptions"
              :key="org.value"
              :label="org.label"
              :value="org.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="业务类型" required>
          <ElSelect
            v-model="formModel.businessType"
            placeholder="请选择业务类型"
            style="width: 100%"
          >
            <ElOption
              v-for="item in meta.businessTypes"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="节点编号" required>
          <ElInputNumber
            v-model="formModel.nodeCode"
            :min="1"
            controls-position="right"
            style="width: 100%"
            @change="syncNodeMeta"
          />
        </ElFormItem>
        <ElFormItem label="节点名称" required>
          <ElInput v-model="formModel.nodeName" clearable />
        </ElFormItem>
        <ElFormItem label="规则名称" required>
          <ElInput v-model="formModel.name" clearable />
        </ElFormItem>
        <ElDivider>节点关系</ElDivider>
        <ElFormItem label="阶段编号">
          <ElInputNumber
            v-model="formModel.phaseCode"
            :min="0"
            controls-position="right"
            style="width: 100%"
          />
        </ElFormItem>
        <ElFormItem label="阶段名称">
          <ElInput v-model="formModel.phaseName" clearable />
        </ElFormItem>
        <ElFormItem label="父节点">
          <ElInputNumber
            v-model="formModel.parentNode"
            :min="0"
            controls-position="right"
            style="width: 100%"
          />
        </ElFormItem>
        <ElFormItem label="排序">
          <ElInputNumber
            v-model="formModel.sort"
            :min="0"
            controls-position="right"
            style="width: 100%"
          />
        </ElFormItem>
        <ElFormItem label="并行子节点">
          <ElSwitch v-model="formModel.parallel" />
        </ElFormItem>
        <ElFormItem label="必填资料项">
          <ElSwitch v-model="formModel.required" />
        </ElFormItem>
        <ElDivider>规则</ElDivider>
        <ElFormItem label="需要资料">
          <ElSwitch v-model="formModel.requireMaterials" />
        </ElFormItem>
        <ElFormItem label="需要审批">
          <ElSwitch v-model="formModel.requireApproval" />
        </ElFormItem>
        <ElFormItem label="自动通过">
          <ElSwitch v-model="formModel.autoPass" />
        </ElFormItem>
        <ElFormItem label="审批层级">
          <ElInputNumber
            v-model="formModel.approveLevel"
            :min="1"
            controls-position="right"
            style="width: 100%"
          />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSelect v-model="formModel.status" style="width: 100%">
            <ElOption label="启用" value="ACTIVE" />
            <ElOption label="停用" value="INACTIVE" />
          </ElSelect>
        </ElFormItem>
        <ElDivider>流转动作</ElDivider>
        <div class="transition-editor">
          <div
            v-for="(transition, index) in formModel.transitions"
            :key="index"
            class="transition-editor__row"
          >
            <ElSelect v-model="transition.action" placeholder="动作" style="width: 130px">
              <ElOption
                v-for="action in meta.actions"
                :key="action.value"
                :label="action.label"
                :value="action.value"
              />
            </ElSelect>
            <ElInputNumber
              v-model="transition.toNode"
              :min="1"
              controls-position="right"
              placeholder="目标节点"
              style="width: 150px"
            />
            <ElInput v-model="transition.condition" clearable placeholder="条件" />
            <ElButton link type="danger" @click="removeTransition(index)">删除</ElButton>
          </div>
          <ElButton plain type="primary" @click="addTransition">
            <ArtSvgIcon icon="ri:add-line" class="mr-1" />
            添加流转
          </ElButton>
        </div>
        <ElFormItem label="子步骤" class="mt-4">
          <div class="transition-editor">
            <div
              v-for="(step, index) in formModel.steps"
              :key="index"
              class="transition-editor__row"
            >
              <ElInput v-model="step.code" placeholder="步骤编码" style="width: 120px" />
              <ElInput v-model="step.name" placeholder="步骤名称" style="width: 160px" />
              <ElInput v-model="step.operationSide" placeholder="操作方" style="width: 100px" />
              <ElSwitch v-model="step.required" style="flex-shrink: 0" />
              <ElButton link type="danger" @click="removeStep(index)">删除</ElButton>
            </div>
            <ElButton plain type="primary" @click="addStep">
              <ArtSvgIcon icon="ri:add-line" class="mr-1" />
              添加步骤
            </ElButton>
          </div>
        </ElFormItem>
        <ElFormItem label="备注" class="mt-4">
          <ElInput
            v-model="formModel.remark"
            type="textarea"
            :autosize="{ minRows: 3, maxRows: 6 }"
          />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="formVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="submitting" @click="submitForm">保存</ElButton>
      </template>
    </ElDrawer>
  </div>
</template>

<script setup lang="ts">
  import { computed, h, onMounted, reactive, ref } from 'vue'
  import { ElMessage, ElMessageBox, ElTag, ElButton, ElSpace } from 'element-plus'
  import {
    fetchBusinessCreate,
    fetchBusinessDelete,
    fetchBusinessList,
    fetchBusinessUpdate,
    fetchFlowConfigMeta,
    fetchInitDefaultFlowConfig,
    FlowNodeMeta,
    FlowConfigMeta
  } from '@/api/business'

  interface FlowRecord {
    id: number
    orgId: number
    org?: { name?: string }
    name: string
    businessType: string
    nodeCode: string
    nodeName: string
    approveLevel?: number
    requireMaterials?: boolean
    requireApproval?: boolean
    autoPass?: boolean
    ruleConfig?: Record<string, unknown>
    status?: string
    remark?: string
  }

  interface TransitionForm {
    action: number
    toNode: number
    condition?: string
  }

  type FlowStepMeta = NonNullable<FlowNodeMeta['steps']>[number]

  interface FlowFormModel {
    id?: number
    orgId?: number
    businessType: string
    nodeCode?: number
    nodeName: string
    name: string
    phaseCode?: number
    phaseName: string
    parentNode?: number
    sort?: number
    parallel: boolean
    required: boolean
    steps: FlowStepMeta[]
    requireMaterials: boolean
    requireApproval: boolean
    autoPass: boolean
    approveLevel: number
    status: string
    transitions: TransitionForm[]
    remark?: string
  }

  const emptyMeta: FlowConfigMeta = {
    businessTypes: [{ label: '车贷', value: 'CAR_LOAN' }],
    actions: [],
    statuses: [],
    nodes: [],
    phases: []
  }

  const tableRef = ref()
  const loading = ref(false)
  const orgLoading = ref(false)
  const initLoading = ref(false)
  const submitting = ref(false)
  const formVisible = ref(false)
  const formMode = ref<'create' | 'edit'>('create')
  const keyword = ref('')
  const records = ref<FlowRecord[]>([])
  const orgOptions = ref<Array<{ label: string; value: number }>>([])
  const meta = reactive<FlowConfigMeta>({ ...emptyMeta })
  const query = reactive({
    orgId: undefined as number | undefined,
    businessType: 'CAR_LOAN'
  })
  const formModel = reactive<FlowFormModel>({
    businessType: 'CAR_LOAN',
    nodeName: '',
    name: '',
    phaseName: '',
    parallel: false,
    required: false,
    steps: [],
    requireMaterials: false,
    requireApproval: true,
    autoPass: false,
    approveLevel: 1,
    status: 'ACTIVE',
    transitions: []
  })

  // ArtTable columns 配置
  const tableColumns = computed(() => [
    { prop: 'nodeCode', label: '节点编号', width: 110 },
    {
      prop: 'nodeName',
      label: '节点名称',
      minWidth: 150,
      formatter: (row: FlowRecord) =>
        h('div', { class: 'node-name-cell' }, [
          h('strong', {}, row.nodeName),
          h('span', {}, row.name)
        ])
    },
    {
      label: '阶段',
      minWidth: 140,
      formatter: (row: FlowRecord) => nodeRule(row).phaseName || '-'
    },
    {
      label: '父节点',
      width: 110,
      formatter: (row: FlowRecord) => nodeRule(row).parentNode || '-'
    },
    {
      label: '模式',
      width: 120,
      formatter: (row: FlowRecord) =>
        nodeRule(row).parallel
          ? h(ElTag, { type: 'success', effect: 'light' }, () => '并行子节点')
          : h(ElTag, { type: 'info', effect: 'plain' }, () => '主流程')
    },
    {
      label: '要求',
      minWidth: 160,
      formatter: (row: FlowRecord) =>
        h(ElSpace, { wrap: true }, () => [
          row.requireMaterials && h(ElTag, { type: 'warning', effect: 'light' }, () => '资料'),
          row.requireApproval && h(ElTag, { type: 'primary', effect: 'light' }, () => '审批'),
          row.autoPass && h(ElTag, { type: 'success', effect: 'light' }, () => '自动通过'),
          nodeRule(row).required && h(ElTag, { type: 'danger', effect: 'plain' }, () => '必填')
        ].filter(Boolean))
    },
    {
      label: '流转',
      minWidth: 180,
      formatter: (row: FlowRecord) => {
        const transitions = nodeRule(row).transitions || []
        if (!transitions.length) return h('span', {}, '-')
        return h('div', { class: 'transition-cell' }, [
          transitions.map((item: any) =>
            h('span', { key: `${item.action}-${item.toNode}` }, `${actionLabel(item.action)} -> ${item.toNode}`)
          )
        ])
      }
    },
    {
      label: '子步骤',
      minWidth: 170,
      formatter: (row: FlowRecord) => {
        const steps = nodeSteps(row)
        if (!steps.length) return h('span', {}, '-')
        return h(ElSpace, { wrap: true }, () =>
          steps.map((step) =>
            h(ElTag, { key: step.code, type: step.required ? 'danger' : 'info', effect: 'plain' }, () => step.name)
          )
        )
      }
    },
    {
      prop: 'status',
      label: '状态',
      width: 90,
      formatter: (row: FlowRecord) =>
        h(ElTag, { type: row.status === 'ACTIVE' ? 'success' : 'info', effect: 'light' }, () =>
          row.status === 'ACTIVE' ? '启用' : '停用'
        )
    },
    {
      label: '操作',
      width: 150,
      fixed: 'right',
      formatter: (row: FlowRecord) =>
        h('div', [
          h(ElButton, { link: true, type: 'primary', onClick: () => openEdit(row) }, () => '编辑'),
          h(ElButton, { link: true, type: 'danger', onClick: () => handleDelete(row) }, () => '删除')
        ])
    }
  ])

  const filteredRecords = computed(() => {
    const text = keyword.value.trim().toLowerCase()
    const source = [...records.value].sort((a, b) => getSort(a) - getSort(b))
    if (!text) return source
    return source.filter((item) =>
      [item.nodeCode, item.nodeName, item.name].some((value) =>
        String(value || '')
          .toLowerCase()
          .includes(text)
      )
    )
  })

  const phaseGroups = computed(() => {
    const map = new Map<number, { code: number; name: string; nodes: FlowRecord[] }>()
    for (const record of filteredRecords.value) {
      const rule = nodeRule(record)
      const phaseCode = Number(rule.phaseCode || numericNodeCode(record))
      const phaseName = String(rule.phaseName || record.nodeName)
      if (!map.has(phaseCode)) map.set(phaseCode, { code: phaseCode, name: phaseName, nodes: [] })
      map.get(phaseCode)?.nodes.push(record)
    }
    return Array.from(map.values()).sort((a, b) => a.code - b.code)
  })

  onMounted(async () => {
    await Promise.all([loadMeta(), loadOrgs()])
    if (orgOptions.value[0]) query.orgId = orgOptions.value[0].value
    await loadData()
  })

  async function loadMeta() {
    const result = await fetchFlowConfigMeta()
    Object.assign(meta, result)
  }

  async function loadOrgs() {
    orgLoading.value = true
    try {
      const result = await fetchBusinessList<{ id: number; name: string; code?: string }>('org', {
        current: 1,
        size: 200,
        status: 'ACTIVE'
      })
      orgOptions.value = (result.records || []).map((item) => ({
        label: item.code ? `${item.name}（${item.code}）` : item.name,
        value: item.id
      }))
    } finally {
      orgLoading.value = false
    }
  }

  async function loadData() {
    loading.value = true
    try {
      const result = await fetchBusinessList<FlowRecord>('flow-config', {
        current: 1,
        size: 200,
        orgId: query.orgId,
        businessType: query.businessType,
        status: ''
      })
      records.value = result.records || []
    } finally {
      loading.value = false
    }
  }

  function handleScopeChange() {
    loadData()
  }

  function resetSearch() {
    keyword.value = ''
    query.businessType = 'CAR_LOAN'
    query.orgId = orgOptions.value[0]?.value
    loadData()
  }

  async function initDefaultFlow() {
    if (!query.orgId) {
      ElMessage.warning('请先选择机构')
      return
    }
    await ElMessageBox.confirm(
      '将按默认分段流程初始化节点，已存在节点会被更新。是否继续？',
      '初始化默认流程',
      {
        type: 'warning'
      }
    )
    initLoading.value = true
    try {
      const result = await fetchInitDefaultFlowConfig({
        orgId: query.orgId,
        businessType: query.businessType
      })
      ElMessage.success(`已初始化 ${result.count} 个流程节点`)
      await loadData()
    } finally {
      initLoading.value = false
    }
  }

  function openCreate() {
    resetForm()
    formMode.value = 'create'
    formModel.orgId = query.orgId
    formModel.businessType = query.businessType
    formVisible.value = true
  }

  function openEdit(row: FlowRecord) {
    resetForm()
    formMode.value = 'edit'
    const rule = nodeRule(row)
    formModel.id = row.id
    formModel.orgId = row.orgId
    formModel.businessType = row.businessType
    formModel.nodeCode = Number(row.nodeCode)
    formModel.nodeName = row.nodeName
    formModel.name = row.name
    formModel.phaseCode = numberOrUndefined(rule.phaseCode)
    formModel.phaseName = String(rule.phaseName || '')
    formModel.parentNode = numberOrUndefined(rule.parentNode)
    formModel.sort = numberOrUndefined(rule.sort)
    formModel.parallel = Boolean(rule.parallel)
    formModel.required = Boolean(rule.required)
    formModel.steps = normalizeSteps(rule.steps)
    formModel.requireMaterials = Boolean(row.requireMaterials)
    formModel.requireApproval = row.requireApproval !== false
    formModel.autoPass = Boolean(row.autoPass)
    formModel.approveLevel = Number(row.approveLevel || 1)
    formModel.status = row.status || 'ACTIVE'
    formModel.transitions = normalizeTransitions(rule.transitions)
    formModel.remark = row.remark
    formVisible.value = true
  }

  function focusNode(row: FlowRecord) {
    tableRef.value?.elTableRef?.setCurrentRow(row)
    openEdit(row)
  }

  function resetForm() {
    formModel.id = undefined
    formModel.orgId = undefined
    formModel.businessType = 'CAR_LOAN'
    formModel.nodeCode = undefined
    formModel.nodeName = ''
    formModel.name = ''
    formModel.phaseCode = undefined
    formModel.phaseName = ''
    formModel.parentNode = undefined
    formModel.sort = undefined
    formModel.parallel = false
    formModel.required = false
    formModel.steps = []
    formModel.requireMaterials = false
    formModel.requireApproval = true
    formModel.autoPass = false
    formModel.approveLevel = 1
    formModel.status = 'ACTIVE'
    formModel.transitions = []
    formModel.remark = undefined
  }

  function syncNodeMeta() {
    const node = meta.nodes.find((item) => item.code === formModel.nodeCode)
    if (!node) return
    formModel.nodeName = node.name
    formModel.name = `${node.phaseName}-${node.name}`
    formModel.phaseCode = node.phaseCode
    formModel.phaseName = node.phaseName
    formModel.parentNode = node.parentNode
    formModel.sort = node.sort
    formModel.parallel = Boolean(node.parallel)
    formModel.required = Boolean(node.required)
    formModel.steps = normalizeSteps(node.steps)
    formModel.transitions = normalizeTransitions(node.transitions)
  }

  function addTransition() {
    formModel.transitions.push({ action: 10, toNode: 0 })
  }

  function removeTransition(index: number) {
    formModel.transitions.splice(index, 1)
  }

  function addStep() {
    formModel.steps.push({ code: '', name: '', sort: formModel.steps.length + 1, required: false })
  }

  function removeStep(index: number) {
    formModel.steps.splice(index, 1)
  }

  async function submitForm() {
    const error = validateForm()
    if (error) {
      ElMessage.warning(error)
      return
    }
    submitting.value = true
    try {
      const payload = buildPayload()
      if (formMode.value === 'create') {
        await fetchBusinessCreate('flow-config', payload)
      } else if (formModel.id) {
        await fetchBusinessUpdate('flow-config', formModel.id, payload)
      }
      ElMessage.success('保存成功')
      formVisible.value = false
      await loadData()
    } finally {
      submitting.value = false
    }
  }

  async function handleDelete(row: FlowRecord) {
    await ElMessageBox.confirm(`确认删除节点"${row.nodeName}"？`, '删除确认', { type: 'warning' })
    await fetchBusinessDelete('flow-config', row.id)
    ElMessage.success('删除成功')
    await loadData()
  }

  function validateForm() {
    if (!formModel.orgId) return '请选择所属机构'
    if (!formModel.businessType) return '请选择业务类型'
    if (!formModel.nodeCode) return '请填写节点编号'
    if (!formModel.nodeName) return '请填写节点名称'
    if (!formModel.name) return '请填写规则名称'
    if (formModel.autoPass && formModel.requireApproval) return '自动通过时不能同时要求审批'
    const invalidTransition = formModel.transitions.find((item) => !item.action || !item.toNode)
    if (invalidTransition) return '请补全流转动作和目标节点'
    return ''
  }

  function buildPayload() {
    const ruleConfig: Record<string, unknown> = {
      nodeCode: formModel.nodeCode,
      phaseCode: formModel.phaseCode || formModel.nodeCode,
      phaseName: formModel.phaseName || formModel.nodeName,
      sort: formModel.sort || formModel.nodeCode,
      parallel: formModel.parallel,
      required: formModel.required,
      steps: formModel.steps,
      initialStatus: formModel.parentNode ? 0 : 10,
      transitions: formModel.transitions.map((item) => ({
        action: item.action,
        toNode: item.toNode,
        ...(item.condition ? { condition: item.condition } : {})
      }))
    }
    if (formModel.parentNode) ruleConfig.parentNode = formModel.parentNode
    return {
      orgId: formModel.orgId,
      businessType: formModel.businessType,
      nodeCode: String(formModel.nodeCode),
      nodeName: formModel.nodeName,
      name: formModel.name,
      approveLevel: formModel.approveLevel,
      requireMaterials: formModel.requireMaterials,
      requireApproval: formModel.requireApproval,
      autoPass: formModel.autoPass,
      status: formModel.status,
      remark: formModel.remark,
      ruleConfig
    }
  }

  function nodeRule(row: FlowRecord): Record<string, any> {
    const config = row.ruleConfig && typeof row.ruleConfig === 'object' ? row.ruleConfig : {}
    const fallback = meta.nodes.find((item) => String(item.code) === String(row.nodeCode))
    return {
      phaseCode: fallback?.phaseCode,
      phaseName: fallback?.phaseName,
      sort: fallback?.sort || Number(row.nodeCode),
      parentNode: fallback?.parentNode,
      parallel: fallback?.parallel,
      required: fallback?.required,
      steps: fallback?.steps || [],
      transitions: fallback?.transitions || [],
      ...config
    }
  }

  function nodeSteps(row: FlowRecord) {
    return normalizeSteps(nodeRule(row).steps)
  }

  function getSort(row: FlowRecord) {
    return Number(nodeRule(row).sort || row.nodeCode || row.id)
  }

  function numericNodeCode(row: FlowRecord) {
    return Number(row.nodeCode || 0)
  }

  function normalizeTransitions(value: unknown): TransitionForm[] {
    if (!Array.isArray(value)) return []
    const transitions: TransitionForm[] = []
    for (const item of value) {
      if (!item || typeof item !== 'object') continue
      const source = item as Record<string, unknown>
      const transition: TransitionForm = {
        action: Number(source.action || 10),
        toNode: Number(source.toNode || 0)
      }
      if (source.condition) transition.condition = String(source.condition)
      transitions.push(transition)
    }
    return transitions
  }

  function normalizeSteps(value: unknown): FlowStepMeta[] {
    if (!Array.isArray(value)) return []
    return value
      .filter((item) => item && typeof item === 'object')
      .map((item) => {
        const source = item as Record<string, unknown>
        return {
          code: String(source.code || ''),
          name: String(source.name || ''),
          operationSide: source.operationSide ? String(source.operationSide) : undefined,
          executor: source.executor ? String(source.executor) : undefined,
          sort: Number(source.sort || 0),
          required: Boolean(source.required)
        }
      })
      .filter((item) => item.code && item.name)
      .sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0))
  }

  function numberOrUndefined(value: unknown) {
    if (value === undefined || value === null || value === '') return undefined
    const numberValue = Number(value)
    return Number.isFinite(numberValue) ? numberValue : undefined
  }

  function actionLabel(value: unknown) {
    return meta.actions.find((item) => item.value === Number(value))?.label || String(value)
  }

  function businessTypeLabel(value: unknown) {
    return meta.businessTypes.find((item) => item.value === value)?.label || String(value || '-')
  }
</script>

<style scoped>
  .flow-config-page {
    display: flex;
    flex-direction: column;
    gap: 16px;
    overflow: hidden;
  }

  .flow-toolbar {
    flex: none;
  }

  .flow-toolbar__main,
  .flow-toolbar__actions,
  .flow-card-title,
  .phase-block__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .flow-toolbar__main {
    align-items: flex-start;
  }

  .flow-toolbar__main h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 650;
  }

  .flow-toolbar__main p {
    margin: 6px 0 0;
    color: var(--el-text-color-secondary);
    font-size: 13px;
  }

  .flow-toolbar__actions {
    justify-content: flex-end;
    margin-top: 14px;
  }

  .flow-layout {
    display: grid;
    grid-template-columns: 360px minmax(0, 1fr);
    gap: 16px;
    min-height: 0;
    flex: 1;
  }

  .flow-map,
  .flow-table-card {
    min-height: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .flow-map :deep(.el-card__body),
  .flow-table-card :deep(.el-card__body) {
    flex: 1;
    overflow: auto;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .flow-card-title {
    font-weight: 650;
  }

  .phase-block {
    padding: 12px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    background: var(--el-fill-color-blank);
  }

  .phase-block__head span {
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }

  .phase-block__nodes {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 10px;
  }

  .node-pill {
    height: 30px;
    padding: 0 10px;
    border: 1px solid var(--el-border-color);
    border-radius: 6px;
    background: var(--el-bg-color);
    color: var(--el-text-color-regular);
    cursor: pointer;
    font-size: 12px;
  }

  .node-pill span {
    margin-right: 5px;
    color: var(--el-color-primary);
    font-weight: 650;
  }

  .node-pill.is-parallel {
    border-color: var(--el-color-success-light-5);
    background: var(--el-color-success-light-9);
  }

  .node-pill.is-inactive {
    opacity: 0.56;
  }

  .node-name-cell {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .node-name-cell span,
  .transition-cell {
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }

  .transition-cell {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .transition-editor {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
  }

  .transition-editor__row {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .flow-form {
    max-height: 70vh;
    padding-right: 10px;
    overflow: auto;
  }
</style>
