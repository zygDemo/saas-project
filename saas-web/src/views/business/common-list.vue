<template>
  <div class="business-list-page art-full-height">
    <ElCard class="art-card-xs mb-4">
      <template #header>
        <div class="flex-cb">
          <div>
            <h3 class="m-0">{{ config.title }}</h3>
            <p class="m-0 mt-1 text-sm text-g-600">{{ config.description }}</p>
          </div>
          <ElTag type="primary" effect="light">/{{ config.api }}</ElTag>
        </div>
      </template>
      <ElSpace wrap>
        <ElInput
          v-if="config.keywordField"
          v-model="keyword"
          clearable
          :placeholder="config.keywordPlaceholder || '关键词/编号'"
          style="width: 220px"
          @keyup.enter="handleSearch"
        />
        <ElSelect
          v-if="statusFilterOptions.length"
          v-model="status"
          clearable
          filterable
          placeholder="状态"
          style="width: 190px"
        >
          <ElOption
            v-for="option in statusFilterOptions"
            :key="String(option.value)"
            :label="option.label"
            :value="option.value"
          />
        </ElSelect>
        <template v-for="filter in extraFilters" :key="filter.prop">
          <ElInputNumber
            v-if="filter.type === 'number'"
            v-model="extraFilterModel[filter.prop] as number | undefined"
            :placeholder="filter.label"
            :min="1"
            controls-position="right"
            style="width: 160px"
            @keyup.enter="handleSearch"
          />
          <ElSelect
            v-else
            v-model="extraFilterModel[filter.prop]"
            clearable
            filterable
            :placeholder="filter.label"
            :loading="Boolean(selectLoading[`filter:${filter.prop}`])"
            style="width: 160px"
          >
            <ElOption
              v-for="opt in filterOptions(filter)"
              :key="String(opt.value)"
              :label="opt.label"
              :value="opt.value"
            />
          </ElSelect>
        </template>
        <ElButton type="primary" @click="handleSearch">
          <ArtSvgIcon icon="ri:search-line" class="mr-1" />
          查询
        </ElButton>
        <ElButton @click="resetSearch">
          <ArtSvgIcon icon="ri:restart-line" class="mr-1" />
          重置
        </ElButton>
      </ElSpace>
    </ElCard>

    <ElCard class="art-table-card" style="margin-top: 0">
      <template #header>
        <div class="flex-cb">
          <h4 class="m-0">{{ config.title }}列表</h4>
          <ElSpace>
            <ElButton type="primary" @click="openCreate">
              <ArtSvgIcon icon="ri:add-line" class="mr-1" />
              新增
            </ElButton>
            <ElButton :loading="loading" @click="loadData">
              <ArtSvgIcon icon="ri:refresh-line" class="mr-1" />
              刷新
            </ElButton>
            <ElButton
              v-if="showActionOverview"
              type="success"
              plain
              @click="showActions = !showActions"
            >
              {{ showActions ? '隐藏动作接口' : '查看动作接口' }}
            </ElButton>
          </ElSpace>
        </div>
      </template>

      <ElAlert
        v-if="showActions && showActionOverview"
        class="mb-4"
        type="success"
        :closable="false"
      >
        <template #title>已接入业务动作接口</template>
        <div class="flex flex-wrap gap-2 mt-2">
          <ElTag v-for="action in config.actions" :key="action.label" type="success">{{
            action.label
          }}</ElTag>
        </div>
      </ElAlert>

      <div v-if="isOrgModule" class="org-summary">
        <div v-for="item in orgSummaryItems" :key="item.label" class="org-summary__item">
          <div class="org-summary__icon" :class="item.tone">
            <ArtSvgIcon :icon="item.icon" />
          </div>
          <div>
            <div class="org-summary__value">{{ item.value }}</div>
            <div class="org-summary__label">{{ item.label }}</div>
          </div>
        </div>
      </div>

      <ElTable
        v-loading="loading"
        :data="records"
        row-key="id"
        border
        stripe
        :empty-text="isOrgModule ? '暂无机构数据' : '暂无数据'"
      >
        <ElTableColumn prop="id" label="ID" width="80" />
        <ElTableColumn
          v-for="column in config.columns"
          :key="column.prop"
          :prop="column.prop"
          :label="column.label"
          :min-width="column.width || 140"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <div v-if="isOrgModule && column.prop === 'name'" class="org-name-cell">
              <div class="org-name-cell__icon">
                <ArtSvgIcon icon="ri:building-2-line" />
              </div>
              <div class="org-name-cell__content">
                <strong>{{ formatCell(row, 'name') }}</strong>
                <span>{{ formatCell(row, 'code') }}</span>
              </div>
            </div>
            <div v-else-if="isOrgModule && column.prop === 'contactName'" class="org-contact-cell">
              <span>{{ formatCell(row, 'contactName') }}</span>
              <a v-if="row.contactPhone" :href="`tel:${row.contactPhone}`">{{
                row.contactPhone
              }}</a>
              <span v-else class="text-g-500">未填写联系电话</span>
            </div>
            <div v-else-if="isOrgModule && column.prop === 'packageType'" class="org-service-cell">
              <span class="org-service-cell__package">{{ packageLabel(row.packageType) }}</span>
              <ElTag :type="orgExpiryMeta(row.expireAt).type" effect="plain" size="small">
                {{ orgExpiryMeta(row.expireAt).label }}
              </ElTag>
            </div>
            <ElTag
              v-else-if="isOrgModule && column.prop === 'apiEnabled'"
              :type="row.apiEnabled === false ? 'info' : 'success'"
              effect="light"
            >
              {{ row.apiEnabled === false ? '已关闭' : '已开启' }}
            </ElTag>
            <div v-else-if="isOrgModule && column.prop === 'businessScale'" class="org-scale-cell">
              <span
                >部门 <strong>{{ orgCount(row, 'departmentCount') }}</strong></span
              >
              <span
                >产品 <strong>{{ orgCount(row, 'productCount') }}</strong></span
              >
              <span
                >资方 <strong>{{ orgCount(row, 'funderCount') }}</strong></span
              >
            </div>
            <ElTag
              v-else-if="column.prop === 'status'"
              :type="statusTagType(row[column.prop])"
              effect="light"
            >
              {{ formatCell(row, column.prop) }}
            </ElTag>
            <span v-else>{{ formatCell(row, column.prop) }}</span>
          </template>
        </ElTableColumn>
        <ElTableColumn label="操作" :width="isOrgModule ? 270 : 360" fixed="right">
          <template #default="{ row }">
            <ElSpace wrap>
              <ElButton link type="primary" @click="openDetail(row)">详情</ElButton>
              <ElButton link type="primary" @click="openEdit(row)">编辑</ElButton>
              <ElButton link type="danger" @click="handleDelete(row)">删除</ElButton>
              <ElButton
                v-for="action in rowActions(row)"
                :key="action.name"
                link
                :type="action.type || 'success'"
                @click="openAction(row, action)"
              >
                {{ action.label }}
              </ElButton>
            </ElSpace>
          </template>
        </ElTableColumn>
      </ElTable>

      <div class="flex justify-end mt-4">
        <ElPagination
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.size"
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </ElCard>

    <ElDialog
      v-model="formVisible"
      :title="formMode === 'create' ? `新增${config.title}` : `编辑${config.title}`"
      width="680px"
    >
      <ElForm label-width="130px" class="business-form">
        <template v-for="(field, index) in formFields" :key="field.prop">
          <div v-if="shouldShowFieldGroup(field, index)" class="business-form__section">{{
            field.group
          }}</div>
          <ElFormItem :label="field.label" :required="field.required">
            <ElInputNumber
              v-if="field.type === 'number'"
              v-model="formModel[field.prop] as number"
              :min="0"
              :precision="field.precision"
              controls-position="right"
              style="width: 100%"
            >
              <template v-if="field.unit" #suffix>{{ field.unit }}</template>
            </ElInputNumber>
            <ElSelect
              v-else-if="field.type === 'select'"
              v-model="formModel[field.prop]"
              clearable
              filterable
              :placeholder="field.placeholder || `请选择${field.label}`"
              :loading="Boolean(selectLoading[field.prop])"
              style="width: 100%"
              @change="(value) => handleFieldChange(field, value)"
            >
              <ElOption
                v-for="option in fieldOptions(field)"
                :key="String(option.value)"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
            <ElSwitch
              v-else-if="field.type === 'switch'"
              v-model="formModel[field.prop] as boolean"
            />
            <ElDatePicker
              v-else-if="field.type === 'date'"
              v-model="formModel[field.prop] as string | number | Date | string[] | undefined"
              type="datetime"
              value-format="YYYY-MM-DDTHH:mm:ss.SSSZ"
              :placeholder="field.placeholder || `请选择${field.label}`"
              style="width: 100%"
            />
            <ElInput
              v-else
              v-model="formModel[field.prop] as string"
              clearable
              :autosize="
                field.type === 'json' || field.type === 'textarea'
                  ? { minRows: 3, maxRows: 8 }
                  : undefined
              "
              :placeholder="field.placeholder || `请输入${field.label}`"
              :type="field.type === 'textarea' || field.type === 'json' ? 'textarea' : 'text'"
            />
          </ElFormItem>
        </template>
      </ElForm>
      <template #footer>
        <ElButton @click="formVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="submitting" @click="submitForm">保存</ElButton>
      </template>
    </ElDialog>

    <ElDialog v-model="actionVisible" :title="activeAction?.label || '业务动作'" width="560px">
      <ElForm label-width="120px" class="business-form">
        <ElFormItem
          v-for="field in actionFields"
          :key="field.prop"
          :label="field.label"
          :required="field.required"
        >
          <ElInputNumber
            v-if="field.type === 'number'"
            v-model="actionModel[field.prop] as number"
            :min="0"
            :precision="field.precision"
            controls-position="right"
            style="width: 100%"
          />
          <ElDatePicker
            v-else-if="field.type === 'date'"
            v-model="actionModel[field.prop] as string | number | Date | string[] | undefined"
            type="datetime"
            value-format="YYYY-MM-DDTHH:mm:ss.SSSZ"
            style="width: 100%"
          />
          <ElInput
            v-else
            v-model="actionModel[field.prop] as string"
            clearable
            :type="field.type === 'textarea' ? 'textarea' : 'text'"
          />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="actionVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="submitting" @click="submitAction">确认执行</ElButton>
      </template>
    </ElDialog>

    <ElDrawer v-model="detailVisible" :title="`${config.title}详情`" size="640px">
      <ElDescriptions v-if="currentRow" :column="1" border>
        <ElDescriptionsItem
          v-for="column in detailColumns"
          :key="column.prop"
          :label="column.label"
        >
          {{ formatCell(currentRow, column.prop) }}
        </ElDescriptionsItem>
      </ElDescriptions>
      <ElDivider>原始数据</ElDivider>
      <pre class="detail-json">{{ JSON.stringify(currentRow, null, 2) }}</pre>
    </ElDrawer>
  </div>
</template>

<script setup lang="ts">
  import { computed, onActivated, onMounted, reactive, ref, watch } from 'vue'
  import { useRoute } from 'vue-router'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import {
    fetchBusinessAction,
    fetchBusinessCreate,
    fetchBusinessDelete,
    fetchBusinessDetail,
    fetchBusinessList,
    fetchBusinessUpdate
  } from '@/api/business'

  type FieldType = 'text' | 'number' | 'textarea' | 'json' | 'select' | 'switch' | 'date'
  type OptionConfig = { label: string; value: string | number | boolean }
  type FilterConfig = {
    prop: string
    label: string
    type: 'select' | 'number'
    options?: OptionConfig[]
    remoteOptions?: RemoteOptionsConfig
  }
  type RemoteOptionsConfig = {
    module: string
    labelField?: string
    valueField?: string
    params?: Record<string, unknown> | ((model: FormModel) => Record<string, unknown>)
  }
  type ColumnConfig = { prop: string; label: string; width?: number }
  type FieldConfig = {
    prop: string
    label: string
    type?: FieldType
    required?: boolean
    precision?: number
    defaultValue?: unknown
    options?: OptionConfig[]
    remoteOptions?: RemoteOptionsConfig
    placeholder?: string
    group?: string
    unit?: string
    transform?: 'percent'
  }
  type ActionConfig = {
    name: string
    label: string
    path: (row: Record<string, unknown>) => string
    visible?: (row: Record<string, unknown>) => boolean
    fields?: FieldConfig[]
    defaults?: (row: Record<string, unknown>) => Record<string, unknown>
    type?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  }
  type PageConfig = {
    title: string
    description: string
    api: string
    keywordField?: string
    keywordParam?: string
    keywordPlaceholder?: string
    columns: ColumnConfig[]
    detailColumns?: ColumnConfig[]
    formFields: FieldConfig[]
    statusMap?: Record<string, string>
    actions: ActionConfig[]
  }
  type BusinessRouteMeta = {
    businessModule?: string
    defaultQuery?: Record<string, unknown>
  }

  const route = useRoute()
  const loading = ref(false)
  const submitting = ref(false)
  const keyword = ref('')
  const status = ref('')
  const showActions = ref(true)
  const records = ref<Record<string, unknown>[]>([])
  const currentRow = ref<Record<string, unknown> | null>(null)
  const detailVisible = ref(false)
  const formVisible = ref(false)
  const actionVisible = ref(false)
  const formMode = ref<'create' | 'edit'>('create')
  type FormValue = string | number | boolean | Date | string[] | number[] | null | undefined
  type FormModel = Record<string, FormValue>
  const formModel = reactive<FormModel>({})
  const actionModel = reactive<FormModel>({})
  const selectOptions = reactive<Record<string, OptionConfig[]>>({})
  const selectLoading = reactive<Record<string, boolean>>({})
  const activeAction = ref<ActionConfig | null>(null)
  const actionRow = ref<Record<string, unknown> | null>(null)
  const pagination = ref({ current: 1, size: 20, total: 0 })
  const routeMeta = computed(() => route.meta as BusinessRouteMeta)
  const applicationNodeByPath: Record<string, number> = {
    'pre-entry': 1100,
    'risk-pre': 2000,
    'funder-pre': 3000,
    supplement: 4000,
    'first-review': 5000,
    'final-review': 6000,
    'loan-request': 7000,
    'funder-final': 8000,
    'disbursement-node': 9000
  }

  const commonStatusMap: Record<string, string> = {
    ACTIVE: '启用',
    INACTIVE: '停用',
    SUSPENDED: '暂停',
    DRAFT: '草稿',
    PENDING_ASSIGN: '待分配',
    PENDING_FOLLOW: '待跟进',
    FOLLOWING: '跟进中',
    CONVERTED: '已转化',
    INVALID: '无效',
    DORMANT: '休眠',
    PUBLIC_POOL: '公海池',
    SUBMITTED: '已提交',
    PENDING_RISK_PRE: '风控预审中',
    RISK_PRE_PASSED: '风控预审通过',
    RISK_PRE_REJECTED: '风控预审拒绝',
    PENDING_FUNDER_PRE: '资方预审中',
    FUNDER_PRE_PASSED: '资方预审通过',
    FUNDER_PRE_REJECTED: '资方预审拒绝',
    PENDING_FIRST_REVIEW: '待初审',
    FIRST_REVIEW_PASSED: '初审通过',
    FIRST_REVIEW_REJECTED: '初审拒绝',
    PENDING_SUPPLEMENT: '待补件',
    PENDING_FINAL_REVIEW: '待终审',
    FINAL_REVIEW_PASSED: '终审通过',
    FINAL_REVIEW_REJECTED: '终审拒绝',
    PENDING_FUNDER_REVIEW: '待资方审核',
    FUNDER_REVIEW_PASSED: '资方通过',
    FUNDER_REVIEW_REJECTED: '资方拒绝',
    PENDING_SIGN: '待签约',
    SIGNING_PROGRESS: '签约中',
    SIGNED: '已签约',
    PENDING_LOAN_REQUEST: '待请款',
    LOAN_REQUEST_REVIEWING: '请款审核中',
    LOAN_REQUEST_APPROVED: '请款通过',
    LOAN_REQUEST_REJECTED: '请款拒绝',
    PENDING_DISBURSEMENT: '待放款',
    DISBURSED: '已放款',
    CANCELLED: '已取消',
    PENDING_APPLICATION: '待放款申请',
    PENDING_APPROVAL: '待放款审批',
    GPS_INSTALLED: 'GPS已安装',
    MORTGAGE_DONE: '抵押完成',
    FAILED: '失败',
    NOT_DUE: '未到期',
    PENDING: '待处理',
    PARTIAL: '部分还款',
    PAID: '已还款',
    OVERDUE: '逾期',
    SETTLED: '已结清',
    SENT: '已发送',
    EXPIRED: '已过期',
    MALE: '男',
    FEMALE: '女',
    UNKNOWN: '未知'
  }

  const yesNoOptions = [
    { label: '是', value: true },
    { label: '否', value: false }
  ]
  const orgStatusOptions = ['ACTIVE', 'INACTIVE', 'SUSPENDED'].map(toOption)
  const activeStatusOptions = ['ACTIVE', 'INACTIVE'].map(toOption)
  const orgPackageOptions = [
    { label: '标准版', value: 'STANDARD' },
    { label: '专业版', value: 'PRO' },
    { label: '企业版', value: 'ENTERPRISE' },
    { label: '试用版', value: 'TRIAL' }
  ]
  const apiEnabledOptions = yesNoOptions.map((option) => ({
    label: option.value ? '已开启' : '已关闭',
    value: option.value
  }))
  const orgExpireStateOptions = [
    { label: '已过期', value: 'EXPIRED' },
    { label: '30天内到期', value: 'EXPIRING' },
    { label: '有效期充足', value: 'VALID' },
    { label: '未设置到期', value: 'UNSET' }
  ]
  const leadStatusOptions = [
    'PENDING_ASSIGN',
    'PENDING_FOLLOW',
    'FOLLOWING',
    'CONVERTED',
    'INVALID',
    'DORMANT',
    'PUBLIC_POOL'
  ].map(toOption)
  const leadSourceOptions = [
    { label: '自拓', value: 'SELF' },
    { label: '渠道', value: 'CHANNEL' },
    { label: '门店', value: 'STORE' },
    { label: '转介绍', value: 'REFERRAL' }
  ]
  const genderOptions = ['MALE', 'FEMALE', 'UNKNOWN'].map(toOption)
  const signingStatusOptions = ['PENDING', 'SENT', 'SIGNED', 'CANCELLED', 'EXPIRED'].map(toOption)
  const disbursementStatusOptions = [
    'PENDING_APPLICATION',
    'PENDING_APPROVAL',
    'GPS_INSTALLED',
    'MORTGAGE_DONE',
    'DISBURSED',
    'FAILED'
  ].map(toOption)
  const repaymentStatusOptions = [
    'NOT_DUE',
    'PENDING',
    'PARTIAL',
    'PAID',
    'OVERDUE',
    'SETTLED'
  ].map(toOption)
  const approvalActionOptions = ['PASS', 'REJECT', 'SUPPLEMENT', 'RETURN'].map(toOption)
  const productTypeOptions = [
    { label: '车贷', value: 'CAR_LOAN' },
    { label: '抵押贷', value: 'MORTGAGE_LOAN' },
    { label: '信用贷', value: 'CREDIT_LOAN' }
  ]
  const repaymentMethodOptions = ['等额本息', '等额本金', '先息后本', '一次性还本付息'].map(
    (value) => ({ label: value, value })
  )
  const funderTypeOptions = [
    { label: '银行', value: 'BANK' },
    { label: '消金', value: 'CONSUMER_FINANCE' },
    { label: '融资租赁', value: 'LEASING' },
    { label: '小贷', value: 'MICRO_LOAN' }
  ]
  const integrationModeOptions = [
    { label: 'API对接', value: 'API' },
    { label: '文件导入导出', value: 'FILE' },
    { label: '人工录入', value: 'MANUAL' }
  ]
  const flowBusinessTypeOptions = [
    { label: '车贷', value: 'CAR_LOAN' },
    { label: '融资租赁', value: 'LEASE' },
    { label: '典当', value: 'PAWN' }
  ]
  const flowNodeOptions = [
    { label: '线索', value: 'LEAD' },
    { label: '进件', value: 'APPLICATION' },
    { label: '审批', value: 'APPROVAL' },
    { label: '签约', value: 'SIGNING' },
    { label: '放款', value: 'DISBURSEMENT' },
    { label: '还款', value: 'REPAYMENT' }
  ]
  const applicationStatusOptions = [
    'DRAFT',
    'SUBMITTED',
    'PENDING_RISK_PRE',
    'RISK_PRE_PASSED',
    'RISK_PRE_REJECTED',
    'PENDING_FUNDER_PRE',
    'FUNDER_PRE_PASSED',
    'FUNDER_PRE_REJECTED',
    'PENDING_SUPPLEMENT',
    'PENDING_FIRST_REVIEW',
    'FIRST_REVIEW_PASSED',
    'FIRST_REVIEW_REJECTED',
    'PENDING_FINAL_REVIEW',
    'FINAL_REVIEW_PASSED',
    'FINAL_REVIEW_REJECTED',
    'PENDING_FUNDER_REVIEW',
    'FUNDER_REVIEW_PASSED',
    'FUNDER_REVIEW_REJECTED',
    'PENDING_SIGN',
    'SIGNING_PROGRESS',
    'SIGNED',
    'PENDING_LOAN_REQUEST',
    'LOAN_REQUEST_REVIEWING',
    'LOAN_REQUEST_APPROVED',
    'LOAN_REQUEST_REJECTED',
    'PENDING_DISBURSEMENT',
    'DISBURSED',
    'CANCELLED'
  ].map(toOption)

  const approvalFields: FieldConfig[] = [
    { prop: 'approverId', label: '审批人ID', type: 'number', required: true },
    { prop: 'opinion', label: '审批意见', type: 'textarea' },
    { prop: 'amount', label: '核定金额', type: 'number', precision: 2 },
    { prop: 'term', label: '核定期限(月)', type: 'number' },
    { prop: 'rate', label: '核定利率', type: 'number', precision: 4 }
  ]

  const leadActions: ActionConfig[] = [
    {
      name: 'assign',
      label: '分配线索',
      path: (row) => `/lead/${row.id}/assign`,
      fields: [
        { prop: 'assigneeId', label: '业务员ID', type: 'number', required: true },
        { prop: 'remark', label: '分配备注', type: 'textarea' }
      ],
      visible: (row) => ['PENDING_ASSIGN', 'PUBLIC_POOL', 'DORMANT'].includes(String(row.status))
    },
    {
      name: 'follow-up',
      label: '记录跟进',
      path: (row) => `/lead/${row.id}/follow-up`,
      fields: [
        { prop: 'followType', label: '跟进方式', defaultValue: 'PHONE', required: true },
        { prop: 'content', label: '跟进内容', type: 'textarea', required: true },
        { prop: 'nextFollowAt', label: '下次跟进时间', type: 'date' },
        { prop: 'createdBy', label: '跟进人ID', type: 'number' }
      ],
      visible: (row) => ['PENDING_FOLLOW', 'FOLLOWING'].includes(String(row.status))
    }
  ]

  const applicationActions: ActionConfig[] = [
    {
      name: 'submit',
      label: '提交进件',
      path: (row) => `/application/${row.id}/submit`,
      visible: (row) => ['DRAFT', 'PENDING_SUPPLEMENT'].includes(String(row.status))
    },
    {
      name: 'risk-pre-pass',
      label: '风控预审通过',
      path: (row) => `/application/${row.id}/risk-pre-pass`,
      fields: [
        { prop: 'reviewerId', label: '处理人ID', type: 'number' },
        { prop: 'opinion', label: '风控预审意见', type: 'textarea' }
      ],
      visible: (row) => ['SUBMITTED', 'PENDING_RISK_PRE'].includes(String(row.status))
    },
    {
      name: 'risk-pre-reject',
      label: '风控预审拒绝',
      type: 'danger',
      path: (row) => `/application/${row.id}/risk-pre-reject`,
      fields: [
        { prop: 'reviewerId', label: '处理人ID', type: 'number' },
        { prop: 'opinion', label: '拒绝原因', type: 'textarea' }
      ],
      visible: (row) => ['SUBMITTED', 'PENDING_RISK_PRE'].includes(String(row.status))
    },
    {
      name: 'funder-pre-pass',
      label: '资方预审通过',
      path: (row) => `/application/${row.id}/funder-pre-pass`,
      fields: [...approvalFields, { prop: 'funderApprovalNo', label: '资方预审编号' }],
      defaults: (row) => ({ amount: row.amount, term: row.term, rate: row.rate }),
      visible: (row) => String(row.status) === 'PENDING_FUNDER_PRE'
    },
    {
      name: 'funder-pre-reject',
      label: '资方预审拒绝',
      type: 'danger',
      path: (row) => `/application/${row.id}/funder-pre-reject`,
      fields: [
        { prop: 'approverId', label: '处理人ID', type: 'number', required: true },
        { prop: 'opinion', label: '拒绝原因', type: 'textarea' },
        { prop: 'funderApprovalNo', label: '资方预审编号' }
      ],
      visible: (row) => String(row.status) === 'PENDING_FUNDER_PRE'
    },
    {
      name: 'complete-supplement',
      label: '资料补充完成',
      path: (row) => `/application/${row.id}/complete-supplement`,
      fields: [{ prop: 'reason', label: '补件备注', type: 'textarea' }],
      visible: (row) => ['PENDING_SUPPLEMENT', 'FUNDER_PRE_PASSED'].includes(String(row.status))
    },
    {
      name: 'approve',
      label: '初审/终审通过',
      path: (row) => `/application/${row.id}/approve`,
      fields: approvalFields,
      defaults: (row) => ({ amount: row.amount, term: row.term, rate: row.rate }),
      visible: (row) =>
        ['PENDING_FIRST_REVIEW', 'PENDING_FINAL_REVIEW'].includes(String(row.status))
    },
    {
      name: 'reject',
      label: '审批驳回',
      type: 'danger',
      path: (row) => `/application/${row.id}/reject`,
      fields: approvalFields.slice(0, 2),
      visible: (row) =>
        [
          'SUBMITTED',
          'PENDING_RISK_PRE',
          'PENDING_FUNDER_PRE',
          'PENDING_FIRST_REVIEW',
          'PENDING_FINAL_REVIEW',
          'PENDING_FUNDER_REVIEW'
        ].includes(String(row.status))
    },
    {
      name: 'supplement',
      label: '要求补件',
      type: 'warning',
      path: (row) => `/application/${row.id}/supplement`,
      fields: [
        { prop: 'approverId', label: '处理人ID', type: 'number', required: true },
        { prop: 'reason', label: '补件原因', type: 'textarea', required: true },
        { prop: 'deadline', label: '补件截止时间', type: 'date' }
      ],
      visible: (row) =>
        [
          'SUBMITTED',
          'PENDING_RISK_PRE',
          'PENDING_FUNDER_PRE',
          'PENDING_FIRST_REVIEW',
          'PENDING_FINAL_REVIEW',
          'PENDING_FUNDER_REVIEW'
        ].includes(String(row.status))
    },
    {
      name: 'submit-funder-review',
      label: '提交资方审批',
      path: (row) => `/application/${row.id}/submit-funder-review`,
      visible: (row) => String(row.status) === 'FINAL_REVIEW_PASSED'
    },
    {
      name: 'funder-pass',
      label: '资方通过',
      path: (row) => `/application/${row.id}/funder-pass`,
      fields: [...approvalFields, { prop: 'funderApprovalNo', label: '资方审批编号' }],
      defaults: (row) => ({
        amount: row.approvedAmount || row.amount,
        term: row.approvedTerm || row.term,
        rate: row.approvedRate || row.rate
      }),
      visible: (row) => String(row.status) === 'PENDING_FUNDER_REVIEW'
    },
    {
      name: 'funder-reject',
      label: '资方拒绝',
      type: 'danger',
      path: (row) => `/application/${row.id}/funder-reject`,
      fields: [
        { prop: 'approverId', label: '审批人ID', type: 'number', required: true },
        { prop: 'opinion', label: '审批意见', type: 'textarea' },
        { prop: 'funderApprovalNo', label: '资方审批编号' }
      ],
      visible: (row) => String(row.status) === 'PENDING_FUNDER_REVIEW'
    },
    {
      name: 'start-signing',
      label: '发起签约',
      path: (row) => `/application/${row.id}/start-signing`,
      fields: [
        { prop: 'contractUrl', label: '合同URL' },
        { prop: 'expiredAt', label: '过期时间', type: 'date' }
      ],
      visible: (row) => ['FINAL_REVIEW_PASSED', 'FUNDER_REVIEW_PASSED'].includes(String(row.status))
    },
    {
      name: 'complete-signing',
      label: '签约完成',
      path: (row) => `/application/${row.id}/complete-signing`,
      fields: [
        { prop: 'contractUrl', label: '合同URL' },
        { prop: 'videoUrl', label: '面签视频URL' },
        { prop: 'signedAt', label: '签约时间', type: 'date' }
      ],
      visible: (row) => ['PENDING_SIGN', 'SIGNING_PROGRESS'].includes(String(row.status))
    },
    {
      name: 'submit-loan-request',
      label: '提交请款资料',
      path: (row) => `/application/${row.id}/submit-loan-request`,
      fields: [{ prop: 'remark', label: '请款备注', type: 'textarea' }],
      visible: (row) =>
        ['SIGNED', 'PENDING_LOAN_REQUEST', 'LOAN_REQUEST_REJECTED'].includes(String(row.status))
    },
    {
      name: 'approve-loan-request',
      label: '请款审核通过',
      path: (row) => `/application/${row.id}/approve-loan-request`,
      fields: approvalFields,
      defaults: (row) => ({
        amount: row.approvedAmount || row.amount,
        term: row.approvedTerm || row.term,
        rate: row.approvedRate || row.rate
      }),
      visible: (row) => String(row.status) === 'LOAN_REQUEST_REVIEWING'
    },
    {
      name: 'reject-loan-request',
      label: '请款审核拒绝',
      type: 'danger',
      path: (row) => `/application/${row.id}/reject-loan-request`,
      fields: approvalFields.slice(0, 2),
      visible: (row) => String(row.status) === 'LOAN_REQUEST_REVIEWING'
    },
    {
      name: 'gps-installed',
      label: 'GPS安装完成',
      path: (row) => `/application/${row.id}/gps-installed`,
      fields: [
        { prop: 'gpsDeviceNo', label: 'GPS设备号' },
        { prop: 'gpsInstallImg', label: '安装照片URL' },
        { prop: 'gpsInstallAt', label: '安装时间', type: 'date' }
      ],
      visible: (row) => String(row.status) === 'PENDING_DISBURSEMENT'
    },
    {
      name: 'mortgage-done',
      label: '抵押完成',
      path: (row) => `/application/${row.id}/mortgage-done`,
      fields: [
        { prop: 'mortgageStatus', label: '抵押状态', defaultValue: 'DONE' },
        { prop: 'mortgageImg', label: '抵押回执URL' },
        { prop: 'mortgageAt', label: '抵押时间', type: 'date' }
      ],
      visible: (row) => String(row.status) === 'PENDING_DISBURSEMENT'
    },
    {
      name: 'request-disbursement',
      label: '提交资方放款',
      path: (row) => `/application/${row.id}/request-disbursement`,
      fields: [{ prop: 'remark', label: '放款申请备注', type: 'textarea' }],
      visible: (row) =>
        ['LOAN_REQUEST_APPROVED', 'PENDING_DISBURSEMENT'].includes(String(row.status))
    },
    {
      name: 'confirm-disbursement',
      label: '放款确认',
      path: (row) => `/application/${row.id}/confirm-disbursement`,
      fields: [
        { prop: 'disburseAmount', label: '放款金额', type: 'number', precision: 2, required: true },
        { prop: 'disburseAccount', label: '放款账户' },
        { prop: 'firstDueDate', label: '首期还款日', type: 'date' },
        { prop: 'transactionNo', label: '交易流水号' },
        { prop: 'voucherUrl', label: '放款凭证URL' },
        { prop: 'remark', label: '备注', type: 'textarea' }
      ],
      defaults: (row) => ({ disburseAmount: row.approvedAmount || row.amount }),
      visible: (row) => String(row.status) === 'PENDING_DISBURSEMENT'
    },
    {
      name: 'settle',
      label: '结清归档',
      type: 'success',
      path: (row) => `/application/${row.id}/settle`,
      fields: [{ prop: 'remark', label: '结清备注', type: 'textarea' }],
      visible: (row) => String(row.status) === 'DISBURSED'
    }
  ]

  const configs: Record<string, PageConfig> = {
    org: {
      title: '机构管理',
      description: '统一维护合作机构的基础资料、服务套餐、API接入与业务规模。',
      api: 'org',
      keywordField: 'name',
      keywordParam: 'keyword',
      keywordPlaceholder: '机构名称/编码/联系人/电话',
      columns: [
        { prop: 'name', label: '机构信息', width: 220 },
        { prop: 'contactName', label: '联系人', width: 170 },
        { prop: 'packageType', label: '套餐与有效期', width: 190 },
        { prop: 'apiEnabled', label: 'API接入', width: 110 },
        { prop: 'businessScale', label: '业务配置', width: 210 },
        { prop: 'status', label: '状态', width: 110 }
      ],
      detailColumns: [
        { prop: 'name', label: '机构名称' },
        { prop: 'code', label: '机构编码' },
        { prop: 'creditCode', label: '统一社会信用代码' },
        { prop: 'contactName', label: '联系人' },
        { prop: 'contactPhone', label: '联系电话' },
        { prop: 'address', label: '办公地址' },
        { prop: 'packageType', label: '套餐类型' },
        { prop: 'expireAt', label: '有效期' },
        { prop: 'apiEnabled', label: 'API接入' },
        { prop: 'businessScale', label: '业务配置' },
        { prop: 'status', label: '状态' }
      ],
      formFields: [
        { prop: 'name', label: '机构名称', required: true, group: '基础信息' },
        { prop: 'code', label: '机构编码', required: true, placeholder: '建议使用英文或拼音缩写' },
        { prop: 'creditCode', label: '统一社会信用代码', placeholder: '18位统一社会信用代码' },
        {
          prop: 'status',
          label: '状态',
          type: 'select',
          options: orgStatusOptions,
          defaultValue: 'ACTIVE'
        },
        { prop: 'contactName', label: '联系人', group: '联系信息' },
        { prop: 'contactPhone', label: '联系电话' },
        { prop: 'address', label: '办公地址', type: 'textarea' },
        {
          prop: 'packageType',
          label: '套餐类型',
          type: 'select',
          options: orgPackageOptions,
          defaultValue: 'STANDARD',
          group: '服务配置'
        },
        { prop: 'expireAt', label: '到期时间', type: 'date', placeholder: '不填表示暂不限制' },
        { prop: 'apiEnabled', label: 'API接入', type: 'switch', defaultValue: true }
      ],
      actions: [
        {
          name: 'enable',
          label: '启用',
          path: (row) => `/org/${row.id}/enable`,
          visible: (row) => String(row.status) !== 'ACTIVE'
        },
        {
          name: 'disable',
          label: '停用',
          type: 'warning',
          path: (row) => `/org/${row.id}/disable`,
          visible: (row) => String(row.status) === 'ACTIVE'
        }
      ]
    },
    dept: {
      title: '部门管理',
      description: '维护机构下的部门层级和负责人。',
      api: 'dept',
      keywordField: 'name',
      columns: [
        { prop: 'name', label: '部门名称' },
        { prop: 'orgName', label: '所属机构', width: 160 },
        { prop: 'parentName', label: '上级部门', width: 160 },
        { prop: 'managerName', label: '负责人', width: 140 },
        { prop: 'managerPhone', label: '负责人电话', width: 140 }
      ],
      formFields: [
        {
          prop: 'orgId',
          label: '所属机构',
          type: 'select',
          required: true,
          remoteOptions: { module: 'org', params: { status: 'ACTIVE' } },
          placeholder: '请选择所属机构'
        },
        { prop: 'name', label: '部门名称', required: true },
        {
          prop: 'parentId',
          label: '上级部门',
          type: 'select',
          remoteOptions: { module: 'dept', params: (model) => ({ orgId: model.orgId }) },
          placeholder: '可不选，表示一级部门'
        },
        {
          prop: 'managerId',
          label: '负责人',
          type: 'select',
          remoteOptions: {
            module: 'user',
            labelField: 'nickName',
            params: (model) => ({ orgId: model.orgId })
          },
          placeholder: '请选择负责人'
        },
        { prop: 'sort', label: '排序', type: 'number', defaultValue: 0 }
      ],
      actions: []
    },
    product: {
      title: '产品管理',
      description: '维护车贷产品、利率、金额、期限与准入规则。',
      api: 'product',
      keywordField: 'name',
      columns: [
        { prop: 'name', label: '产品名称' },
        { prop: 'productType', label: '产品类型', width: 120 },
        { prop: 'minAmount', label: '最低金额', width: 120 },
        { prop: 'maxAmount', label: '最高金额', width: 120 },
        { prop: 'status', label: '状态', width: 100 }
      ],
      formFields: [
        {
          prop: 'orgId',
          label: '所属机构',
          type: 'select',
          required: true,
          remoteOptions: { module: 'org', params: { status: 'ACTIVE' } },
          placeholder: '请选择所属机构'
        },
        { prop: 'name', label: '产品名称', required: true },
        {
          prop: 'productType',
          label: '产品类型',
          type: 'select',
          options: productTypeOptions,
          defaultValue: 'CAR_LOAN',
          required: true
        },
        {
          prop: 'status',
          label: '状态',
          type: 'select',
          options: activeStatusOptions,
          defaultValue: 'ACTIVE'
        },
        {
          prop: 'minAmount',
          label: '最低金额',
          type: 'number',
          precision: 2,
          unit: '元',
          required: true,
          group: '授信范围'
        },
        {
          prop: 'maxAmount',
          label: '最高金额',
          type: 'number',
          precision: 2,
          unit: '元',
          required: true
        },
        { prop: 'minTerm', label: '最短期限', type: 'number', unit: '个月', required: true },
        { prop: 'maxTerm', label: '最长期限', type: 'number', unit: '个月', required: true },
        {
          prop: 'minRate',
          label: '最低年利率',
          type: 'number',
          precision: 2,
          unit: '%',
          transform: 'percent',
          defaultValue: 3.6,
          required: true
        },
        {
          prop: 'maxRate',
          label: '最高年利率',
          type: 'number',
          precision: 2,
          unit: '%',
          transform: 'percent',
          defaultValue: 12,
          required: true
        },
        {
          prop: 'repaymentMethod',
          label: '还款方式',
          type: 'select',
          options: repaymentMethodOptions,
          defaultValue: '等额本息',
          required: true
        },
        { prop: 'minAge', label: '最低年龄', type: 'number', unit: '岁', group: '准入条件' },
        { prop: 'maxAge', label: '最高年龄', type: 'number', unit: '岁' },
        { prop: 'maxCarAge', label: '最大车龄', type: 'number', unit: '年' },
        { prop: 'maxMileage', label: '最大里程', type: 'number', unit: '公里' },
        {
          prop: 'ltvLimit',
          label: '最高LTV',
          type: 'number',
          precision: 2,
          unit: '%',
          transform: 'percent'
        },
        {
          prop: 'minDownPayment',
          label: '最低首付比例',
          type: 'number',
          precision: 2,
          unit: '%',
          transform: 'percent'
        },
        { prop: 'regions', label: '适用区域', placeholder: '如：上海、苏州、杭州' }
      ],
      actions: []
    },
    funder: {
      title: '资方管理',
      description: '维护银行、消金、租赁、小贷等资金方信息。',
      api: 'funder',
      keywordField: 'name',
      columns: [
        { prop: 'name', label: '资方名称' },
        { prop: 'orgName', label: '所属机构', width: 160 },
        { prop: 'code', label: '资方编码', width: 140 },
        { prop: 'funderType', label: '类型', width: 120 },
        { prop: 'contactName', label: '联系人', width: 120 },
        { prop: 'status', label: '状态', width: 100 }
      ],
      formFields: [
        {
          prop: 'orgId',
          label: '所属机构',
          type: 'select',
          required: true,
          remoteOptions: { module: 'org', params: { status: 'ACTIVE' } },
          placeholder: '请选择所属机构'
        },
        { prop: 'name', label: '资方名称', required: true },
        { prop: 'code', label: '资方编码', required: true },
        {
          prop: 'funderType',
          label: '资方类型',
          type: 'select',
          options: funderTypeOptions,
          defaultValue: 'BANK',
          required: true
        },
        {
          prop: 'status',
          label: '状态',
          type: 'select',
          options: activeStatusOptions,
          defaultValue: 'ACTIVE'
        },
        { prop: 'contactName', label: '联系人', group: '联系信息' },
        { prop: 'contactPhone', label: '联系电话' },
        {
          prop: 'integrationMode',
          label: '对接方式',
          type: 'select',
          options: integrationModeOptions,
          defaultValue: 'MANUAL',
          group: '合作配置'
        },
        { prop: 'creditLimit', label: '授信额度', type: 'number', precision: 2, unit: '元' },
        { prop: 'priority', label: '优先级', type: 'number', defaultValue: 0 }
      ],
      actions: []
    },
    'flow-config': {
      title: '流程与规则',
      description: '维护各机构的业务流程节点、审批层级、资料要求、自动通过与超时规则。',
      api: 'flow-config',
      keywordField: 'name',
      columns: [
        { prop: 'name', label: '规则名称', width: 180 },
        { prop: 'orgName', label: '所属机构', width: 160 },
        { prop: 'businessType', label: '业务类型', width: 120 },
        { prop: 'nodeName', label: '流程节点', width: 120 },
        { prop: 'approveLevel', label: '审批层级', width: 100 },
        { prop: 'requireApproval', label: '需要审批', width: 100 },
        { prop: 'autoPass', label: '自动通过', width: 100 },
        { prop: 'status', label: '状态', width: 100 }
      ],
      detailColumns: [
        { prop: 'name', label: '规则名称' },
        { prop: 'orgName', label: '所属机构' },
        { prop: 'businessType', label: '业务类型' },
        { prop: 'nodeCode', label: '节点编码' },
        { prop: 'nodeName', label: '节点名称' },
        { prop: 'approveLevel', label: '审批层级' },
        { prop: 'amountLimit', label: '金额阈值' },
        { prop: 'timeoutHours', label: '超时时长(小时)' },
        { prop: 'requireMaterials', label: '要求资料' },
        { prop: 'requireApproval', label: '需要审批' },
        { prop: 'autoPass', label: '自动通过' },
        { prop: 'ruleConfig', label: '规则JSON' },
        { prop: 'remark', label: '备注' },
        { prop: 'status', label: '状态' }
      ],
      formFields: [
        {
          prop: 'orgId',
          label: '所属机构',
          type: 'select',
          required: true,
          remoteOptions: { module: 'org', params: { status: 'ACTIVE' } },
          placeholder: '请选择所属机构'
        },
        { prop: 'name', label: '规则名称', required: true },
        {
          prop: 'businessType',
          label: '业务类型',
          type: 'select',
          options: flowBusinessTypeOptions,
          defaultValue: 'CAR_LOAN',
          required: true
        },
        {
          prop: 'nodeCode',
          label: '流程节点',
          type: 'select',
          options: flowNodeOptions,
          defaultValue: 'APPLICATION',
          required: true
        },
        { prop: 'nodeName', label: '节点名称', required: true },
        {
          prop: 'status',
          label: '状态',
          type: 'select',
          options: activeStatusOptions,
          defaultValue: 'ACTIVE'
        },
        {
          prop: 'approveLevel',
          label: '审批层级',
          type: 'number',
          defaultValue: 1,
          required: true,
          group: '审批规则'
        },
        { prop: 'amountLimit', label: '金额阈值', type: 'number', precision: 2, unit: '元' },
        { prop: 'timeoutHours', label: '超时时长', type: 'number', unit: '小时' },
        { prop: 'requireMaterials', label: '要求资料', type: 'switch', defaultValue: false },
        { prop: 'requireApproval', label: '需要审批', type: 'switch', defaultValue: true },
        { prop: 'autoPass', label: '自动通过', type: 'switch', defaultValue: false },
        {
          prop: 'ruleConfig',
          label: '规则JSON',
          type: 'json',
          placeholder: '{"minAmount": 10000, "roles": ["R_APPROVER"]}',
          group: '高级配置'
        },
        { prop: 'remark', label: '备注', type: 'textarea' }
      ],
      actions: []
    },
    lead: {
      title: '线索管理',
      description: '线索分配、跟进、转化和公海池。',
      api: 'lead',
      keywordField: 'name',
      statusMap: commonStatusMap,
      columns: [
        { prop: 'orgName', label: '所属机构', width: 160 },
        { prop: 'name', label: '客户姓名', width: 120 },
        { prop: 'phone', label: '手机号', width: 140 },
        { prop: 'source', label: '来源', width: 120 },
        { prop: 'assigneeName', label: '负责人', width: 120 },
        { prop: 'loanAmount', label: '意向金额', width: 120 },
        { prop: 'status', label: '状态', width: 120 }
      ],
      formFields: [
        {
          prop: 'orgId',
          label: '所属机构',
          type: 'select',
          required: true,
          remoteOptions: { module: 'org', params: { status: 'ACTIVE' } },
          placeholder: '请选择所属机构'
        },
        { prop: 'name', label: '客户姓名', required: true },
        { prop: 'phone', label: '手机号', required: true },
        {
          prop: 'source',
          label: '来源',
          type: 'select',
          options: leadSourceOptions,
          defaultValue: 'SELF',
          required: true
        },
        {
          prop: 'status',
          label: '状态',
          type: 'select',
          options: leadStatusOptions,
          defaultValue: 'PENDING_ASSIGN'
        },
        { prop: 'idCard', label: '身份证号' },
        {
          prop: 'assigneeId',
          label: '负责人',
          type: 'select',
          remoteOptions: {
            module: 'user',
            labelField: 'nickName',
            params: (model) => ({ orgId: model.orgId })
          },
          placeholder: '请选择负责人'
        },
        { prop: 'carBrand', label: '车辆品牌', group: '车辆意向' },
        { prop: 'carModel', label: '车型' },
        { prop: 'loanAmount', label: '意向金额', type: 'number', precision: 2, unit: '元' },
        { prop: 'nextFollowAt', label: '下次跟进时间', type: 'date', group: '跟进信息' },
        { prop: 'remark', label: '备注', type: 'textarea' }
      ],
      actions: leadActions
    },
    customer: {
      title: '客户管理',
      description: '客户基本信息、联系人、车辆、银行卡。',
      api: 'customer',
      keywordField: 'name',
      columns: [
        { prop: 'name', label: '客户姓名', width: 120 },
        { prop: 'phone', label: '手机号', width: 140 },
        { prop: 'gender', label: '性别', width: 80 },
        { prop: 'companyName', label: '单位', width: 160 },
        { prop: 'status', label: '状态', width: 100 }
      ],
      formFields: [
        { prop: 'orgId', label: '机构ID', type: 'number', required: true },
        { prop: 'name', label: '客户姓名', required: true },
        { prop: 'phone', label: '手机号', required: true },
        { prop: 'idCard', label: '身份证号' },
        {
          prop: 'gender',
          label: '性别',
          type: 'select',
          options: genderOptions,
          defaultValue: 'UNKNOWN'
        },
        { prop: 'companyName', label: '单位' },
        { prop: 'monthlyIncome', label: '月收入', type: 'number', precision: 2 },
        { prop: 'address', label: '地址' },
        { prop: 'emergencyName', label: '紧急联系人' },
        { prop: 'emergencyPhone', label: '紧急联系人电话' },
        { prop: 'status', label: '状态', defaultValue: 'ACTIVE' }
      ],
      actions: []
    },
    application: {
      title: '进件管理',
      description: '进件资料、审批流、签约、放款与还款的核心入口。',
      api: 'application',
      keywordField: 'applicationNo',
      statusMap: commonStatusMap,
      columns: [
        { prop: 'applicationNo', label: '申请编号', width: 200 },
        { prop: 'customerName', label: '客户姓名', width: 120 },
        { prop: 'productName', label: '产品', width: 140 },
        { prop: 'funderName', label: '资方', width: 140 },
        { prop: 'amount', label: '申请金额', width: 120 },
        { prop: 'term', label: '期限(月)', width: 100 },
        { prop: 'status', label: '状态', width: 160 }
      ],
      formFields: [
        { prop: 'customerId', label: '客户ID', type: 'number', required: true },
        { prop: 'productId', label: '产品ID', type: 'number' },
        { prop: 'funderId', label: '资方ID', type: 'number' },
        { prop: 'amount', label: '申请金额', type: 'number', precision: 2, required: true },
        { prop: 'term', label: '期限(月)', type: 'number', required: true },
        {
          prop: 'rate',
          label: '年利率',
          type: 'number',
          precision: 4,
          defaultValue: 0.068,
          required: true
        },
        { prop: 'repaymentMethod', label: '还款方式', defaultValue: '等额本息', required: true },
        { prop: 'creatorId', label: '创建人ID', type: 'number', required: true },
        {
          prop: 'status',
          label: '状态',
          type: 'select',
          options: applicationStatusOptions,
          defaultValue: 'DRAFT'
        },
        { prop: 'purpose', label: '贷款用途' },
        { prop: 'remark', label: '备注', type: 'textarea' }
      ],
      actions: applicationActions
    },
    approval: {
      title: '审批管理',
      description: '查看审批记录和审批意见。',
      api: 'approval',
      columns: [
        { prop: 'applicationId', label: '进件ID' },
        { prop: 'approverId', label: '审批人ID' },
        { prop: 'stage', label: '审批阶段' },
        { prop: 'action', label: '动作' },
        { prop: 'opinion', label: '意见' }
      ],
      formFields: [
        { prop: 'applicationId', label: '进件ID', type: 'number', required: true },
        { prop: 'approverId', label: '审批人ID', type: 'number', required: true },
        { prop: 'stage', label: '审批阶段', defaultValue: 'FIRST_REVIEW', required: true },
        { prop: 'action', label: '审批动作', defaultValue: 'PASS', required: true },
        { prop: 'opinion', label: '审批意见', type: 'textarea' },
        { prop: 'amount', label: '核定金额', type: 'number', precision: 2 },
        { prop: 'term', label: '核定期限', type: 'number' },
        { prop: 'rate', label: '核定利率', type: 'number', precision: 4 }
      ],
      actions: []
    },
    signing: {
      title: '签约管理',
      description: '发起签约、合同签署、面签视频和签约状态。',
      api: 'signing',
      columns: [
        { prop: 'applicationId', label: '进件ID' },
        { prop: 'status', label: '签约状态' },
        { prop: 'contractUrl', label: '合同URL' },
        { prop: 'signedAt', label: '签约时间' }
      ],
      formFields: [
        { prop: 'applicationId', label: '进件ID', type: 'number', required: true },
        { prop: 'status', label: '签约状态', defaultValue: 'PENDING' },
        { prop: 'contractUrl', label: '合同URL' },
        { prop: 'videoUrl', label: '面签视频URL' },
        { prop: 'signedAt', label: '签约时间', type: 'date' }
      ],
      actions: []
    },
    disbursement: {
      title: '放款管理',
      description: 'GPS安装、抵押办理和放款确认。',
      api: 'disbursement',
      columns: [
        { prop: 'applicationId', label: '进件ID' },
        { prop: 'status', label: '放款状态' },
        { prop: 'gpsDeviceNo', label: 'GPS设备号' },
        { prop: 'mortgageStatus', label: '抵押状态' },
        { prop: 'disburseAmount', label: '放款金额' }
      ],
      formFields: [
        { prop: 'applicationId', label: '进件ID', type: 'number', required: true },
        { prop: 'status', label: '放款状态', defaultValue: 'PENDING_APPLICATION' },
        { prop: 'gpsDeviceNo', label: 'GPS设备号' },
        { prop: 'mortgageStatus', label: '抵押状态' },
        { prop: 'disburseAmount', label: '放款金额', type: 'number', precision: 2 },
        { prop: 'disburseAccount', label: '放款账户' },
        { prop: 'transactionNo', label: '交易流水号' },
        { prop: 'remark', label: '备注', type: 'textarea' }
      ],
      actions: []
    },
    repayment: {
      title: '还款管理',
      description: '还款计划、还款登记、部分还款和结清。',
      api: 'repayment',
      columns: [
        { prop: 'applicationId', label: '进件ID' },
        { prop: 'period', label: '期数' },
        { prop: 'dueDate', label: '应还日期' },
        { prop: 'totalAmount', label: '应还总额' },
        { prop: 'status', label: '状态' }
      ],
      formFields: [
        { prop: 'applicationId', label: '进件ID', type: 'number', required: true },
        { prop: 'period', label: '期数', type: 'number', required: true },
        { prop: 'dueDate', label: '应还日期', type: 'date', required: true },
        { prop: 'principal', label: '本金', type: 'number', precision: 2, required: true },
        { prop: 'interest', label: '利息', type: 'number', precision: 2, required: true },
        { prop: 'totalAmount', label: '应还总额', type: 'number', precision: 2, required: true },
        { prop: 'status', label: '状态', defaultValue: 'PENDING' }
      ],
      actions: []
    }
  }

  const moduleName = computed(() => resolveBusinessModule())
  const config = computed(() => configs[moduleName.value] || configs.application)
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
  const statusFilterOptions = computed(() => {
    const optionsMap: Record<string, OptionConfig[]> = {
      org: orgStatusOptions,
      product: activeStatusOptions,
      funder: activeStatusOptions,
      'flow-config': activeStatusOptions,
      lead: leadStatusOptions,
      customer: activeStatusOptions,
      application: applicationStatusOptions,
      signing: signingStatusOptions,
      disbursement: disbursementStatusOptions,
      repayment: repaymentStatusOptions
    }
    return optionsMap[moduleName.value] || []
  })

  const extraFilters = computed(() => {
    const m = moduleName.value
    const filters: FilterConfig[] = []
    if (['dept', 'product', 'funder', 'flow-config', 'lead', 'customer', 'application'].includes(m)) {
      filters.push({
        prop: 'orgId',
        label: '所属机构',
        type: 'select',
        remoteOptions: { module: 'org', params: { status: 'ACTIVE' } }
      })
    }
    if (m === 'org') {
      filters.push({
        prop: 'packageType',
        label: '套餐类型',
        type: 'select',
        options: orgPackageOptions
      })
      filters.push({
        prop: 'apiEnabled',
        label: 'API接入',
        type: 'select',
        options: apiEnabledOptions
      })
      filters.push({
        prop: 'expireState',
        label: '到期状态',
        type: 'select',
        options: orgExpireStateOptions
      })
    }
    if (m === 'application') {
      filters.push({ prop: 'customerId', label: '客户ID', type: 'number' })
      filters.push({ prop: 'creatorId', label: '创建人ID', type: 'number' })
    }
    if (['approval', 'signing', 'disbursement', 'repayment'].includes(m)) {
      filters.push({ prop: 'applicationId', label: '进件ID', type: 'number' })
    }
    if (m === 'approval') {
      filters.push({
        prop: 'stage',
        label: '审批阶段',
        type: 'select',
        options: ['FIRST_REVIEW', 'FINAL_REVIEW', 'FUNDER_REVIEW', 'SUPPLEMENT'].map(toOption)
      })
      filters.push({
        prop: 'action',
        label: '审批动作',
        type: 'select',
        options: approvalActionOptions
      })
    }
    if (m === 'lead') {
      filters.push({ prop: 'assigneeId', label: '负责人ID', type: 'number' })
    }
    if (m === 'dept') {
      filters.push({ prop: 'parentId', label: '上级部门ID', type: 'number' })
    }
    if (m === 'product') {
      filters.push({
        prop: 'productType',
        label: '产品类型',
        type: 'select',
        options: [{ label: '车贷', value: 'CAR_LOAN' }]
      })
    }
    if (m === 'funder') {
      filters.push({
        prop: 'funderType',
        label: '资方类型',
        type: 'select',
        options: funderTypeOptions
      })
    }
    if (m === 'flow-config') {
      filters.push({
        prop: 'businessType',
        label: '业务类型',
        type: 'select',
        options: flowBusinessTypeOptions
      })
      filters.push({
        prop: 'nodeCode',
        label: '流程节点',
        type: 'select',
        options: flowNodeOptions
      })
    }
    return filters
  })

  const extraFilterModel = reactive<FormModel>({})
  const orgSummaryItems = computed(() => [
    {
      label: '机构总数',
      value: pagination.value.total,
      icon: 'ri:building-2-line',
      tone: 'is-primary'
    },
    {
      label: '当前页启用',
      value: records.value.filter((row) => row.status === 'ACTIVE').length,
      icon: 'ri:checkbox-circle-line',
      tone: 'is-success'
    },
    {
      label: '当前页API已开启',
      value: records.value.filter((row) => row.apiEnabled !== false).length,
      icon: 'ri:cloud-line',
      tone: 'is-info'
    },
    {
      label: '当前页30天内到期',
      value: records.value.filter((row) => getOrgExpireState(row.expireAt) === 'EXPIRING').length,
      icon: 'ri:calendar-event-line',
      tone: 'is-warning'
    }
  ])

  function getRoutePathModule() {
    return (
      String(route.path || '')
        .split('/')
        .filter(Boolean)
        .pop() || ''
    )
  }

  function resolveDefaultQuery() {
    if (routeMeta.value.defaultQuery) return routeMeta.value.defaultQuery
    const currentNode = applicationNodeByPath[getRoutePathModule()]
    return currentNode ? { currentNode } : {}
  }

  function resolveBusinessModule() {
    const metaModule = routeMeta.value.businessModule
    if (metaModule && configs[String(metaModule)]) return String(metaModule)

    const pathModule = getRoutePathModule()
    if (pathModule && configs[pathModule]) return pathModule

    const name = String(route.name || '').replace(/^Business/i, '')
    const routeNameModule = name ? name.charAt(0).toLowerCase() + name.slice(1) : ''
    if (routeNameModule && configs[routeNameModule]) return routeNameModule

    return 'application'
  }

  function resetRuntimeState() {
    keyword.value = ''
    status.value = ''
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
      const result = await fetchBusinessList(config.value.api, params)
      const rawRecords = (result.records || []) as Record<string, unknown>[]
      records.value = rawRecords.map((r) => flattenRelations(r))
      pagination.value.total = result.total || 0
    } finally {
      loading.value = false
    }
  }

  function handleSearch() {
    pagination.value.current = 1
    loadData()
  }

  function resetSearch() {
    keyword.value = ''
    status.value = ''
    for (const key of Object.keys(extraFilterModel)) delete extraFilterModel[key]
    pagination.value.current = 1
    loadData()
  }

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
      currentRow.value = flattenRelations(
        await fetchBusinessDetail(config.value.api, Number(row.id))
      )
    } catch {
      currentRow.value = row
    }
  }

  async function submitForm() {
    const error = validateRequired(formFields.value, formModel)
    if (error) {
      ElMessage.warning(error)
      return
    }
    submitting.value = true
    try {
      const payload = cleanPayload(formModel, formFields.value)
      if (formMode.value === 'create') {
        await fetchBusinessCreate(config.value.api, payload)
      } else if (currentRow.value?.id) {
        await fetchBusinessUpdate(config.value.api, Number(currentRow.value.id), payload)
      }
      ElMessage.success('保存成功')
      formVisible.value = false
      await loadData()
    } catch (error) {
      ElMessage.error(error instanceof Error ? error.message : '保存失败')
    } finally {
      submitting.value = false
    }
  }

  function rowActions(row: Record<string, unknown>) {
    return config.value.actions.filter((action) => !action.visible || action.visible(row))
  }

  function openAction(row: Record<string, unknown>, action: ActionConfig) {
    activeAction.value = action
    actionRow.value = row
    resetModel(actionModel, action.fields || [], action.defaults?.(row))
    if (!action.fields?.length) {
      ElMessageBox.confirm(`确认执行“${action.label}”？`, '业务动作确认', { type: 'warning' })
        .then(() => submitAction())
        .catch(() => undefined)
      return
    }
    actionVisible.value = true
  }

  async function submitAction() {
    if (!activeAction.value || !actionRow.value) return
    const error = validateRequired(actionFields.value, actionModel)
    if (error) {
      ElMessage.warning(error)
      return
    }
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

  function resetModel(
    target: Record<string, unknown>,
    fields: FieldConfig[],
    source?: Record<string, unknown>
  ) {
    for (const key of Object.keys(target)) delete target[key]
    for (const field of fields) {
      const hasSourceValue =
        source &&
        Object.prototype.hasOwnProperty.call(source, field.prop) &&
        source[field.prop] !== undefined
      const value = hasSourceValue ? source[field.prop] : field.defaultValue
      if (field.type === 'json' && value !== undefined && value !== null && value !== '') {
        target[field.prop] = typeof value === 'string' ? value : JSON.stringify(value, null, 2)
      } else if (field.transform === 'percent' && hasSourceValue) {
        target[field.prop] = toPercentDisplayValue(value)
      } else {
        target[field.prop] = value ?? undefined
      }
    }
  }

  function fieldOptions(field: FieldConfig) {
    return field.remoteOptions ? selectOptions[field.prop] || [] : field.options || []
  }

  function filterOptions(filter: FilterConfig) {
    const key = `filter:${filter.prop}`
    return filter.remoteOptions ? selectOptions[key] || [] : filter.options || []
  }

  function getRemoteOptionParams(source: FieldConfig | FilterConfig) {
    const params = source.remoteOptions?.params
    if (typeof params === 'function') return params(formModel)
    return params || {}
  }

  async function loadRemoteFilterOptions(filters: FilterConfig[]) {
    await Promise.all(
      filters
        .filter((filter) => filter.remoteOptions)
        .map((filter) => loadRemoteFilterOption(filter))
    )
  }

  async function loadRemoteFilterOption(filter: FilterConfig) {
    if (!filter.remoteOptions) return
    const key = `filter:${filter.prop}`
    if (selectOptions[key]?.length || selectLoading[key]) return
    selectLoading[key] = true
    try {
      selectOptions[key] = await fetchRemoteOptions(
        filter.remoteOptions,
        getRemoteOptionParams(filter)
      )
    } finally {
      selectLoading[key] = false
    }
  }

  async function loadRemoteOptions(fields: FieldConfig[], props?: string[]) {
    await Promise.all(
      fields
        .filter((field) => field.remoteOptions && (!props || props.includes(field.prop)))
        .map((field) => loadRemoteOption(field))
    )
  }

  async function loadRemoteOption(field: FieldConfig) {
    if (!field.remoteOptions) return
    const params = getRemoteOptionParams(field)
    if (['parentId', 'managerId'].includes(field.prop) && !params.orgId) {
      selectOptions[field.prop] = []
      return
    }
    selectLoading[field.prop] = true
    try {
      selectOptions[field.prop] = await fetchRemoteOptions(field.remoteOptions, params)
    } finally {
      selectLoading[field.prop] = false
    }
  }

  async function fetchRemoteOptions(config: RemoteOptionsConfig, params: Record<string, unknown>) {
    const result = await fetchBusinessList(config.module, {
      current: 1,
      size: 200,
      ...params
    })
    const labelField = config.labelField || 'name'
    const valueField = config.valueField || 'id'
    return ((result.records || []) as Record<string, unknown>[])
      .filter((item) => item[valueField] !== undefined && item[valueField] !== null)
      .map((item) => ({
        label: formatRemoteOptionLabel(item, labelField, valueField),
        value: item[valueField] as string | number | boolean
      }))
  }

  function formatRemoteOptionLabel(
    item: Record<string, unknown>,
    labelField: string,
    valueField: string
  ) {
    const label = item[labelField] || item[valueField]
    if (labelField === 'nickName' && item.userName && item.userName !== label) {
      return `${label}（${item.userName}）`
    }
    return String(label)
  }

  function handleFieldChange(field: FieldConfig, value: FormValue) {
    if (moduleName.value === 'dept' && field.prop === 'orgId') {
      formModel.parentId = undefined
      formModel.managerId = undefined
      if (value) loadRemoteOptions(formFields.value, ['parentId', 'managerId'])
      else {
        selectOptions.parentId = []
        selectOptions.managerId = []
      }
      return
    }
    if (moduleName.value === 'lead' && field.prop === 'orgId') {
      formModel.assigneeId = undefined
      if (value) loadRemoteOptions(formFields.value, ['assigneeId'])
      else selectOptions.assigneeId = []
    }
    if (moduleName.value === 'flow-config' && field.prop === 'nodeCode') {
      formModel.nodeName =
        flowNodeOptions.find((option) => option.value === value)?.label || formModel.nodeName
    }
  }

  function cleanPayload(source: Record<string, unknown>, fields: FieldConfig[]) {
    const payload: Record<string, unknown> = {}
    const fieldMap = new Map(fields.map((field) => [field.prop, field]))
    for (const [key, value] of Object.entries(source)) {
      if (value === undefined || value === null || value === '') continue
      const field = fieldMap.get(key)
      if (field?.type === 'json') {
        try {
          payload[key] = typeof value === 'string' ? JSON.parse(value) : value
        } catch {
          throw new Error(`${field.label}不是合法JSON`)
        }
      } else if (field?.transform === 'percent') {
        payload[key] = toPercentPayloadValue(value)
      } else {
        payload[key] = value
      }
    }
    return payload
  }

  function toPercentDisplayValue(value: unknown) {
    if (value === undefined || value === null || value === '') return undefined
    const numberValue = Number(value)
    return Number.isFinite(numberValue) ? numberValue * 100 : value
  }

  function toPercentPayloadValue(value: unknown) {
    const numberValue = Number(value)
    return Number.isFinite(numberValue) ? numberValue / 100 : value
  }

  function validateRequired(fields: FieldConfig[], model: Record<string, unknown>) {
    const field = fields.find(
      (item) =>
        item.required &&
        (model[item.prop] === undefined || model[item.prop] === null || model[item.prop] === '')
    )
    return field ? `请填写${field.label}` : ''
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
    } catch {
      // cancel
    }
  }

  function formatCell(row: Record<string, unknown>, prop: string) {
    const value = row[prop]
    if (prop === 'businessScale')
      return `部门${orgCount(row, 'departmentCount')} / 产品${orgCount(row, 'productCount')} / 资方${orgCount(row, 'funderCount')}`
    if (prop === 'apiEnabled') return value === false ? '已关闭' : '已开启'
    if (['requireMaterials', 'requireApproval', 'autoPass'].includes(prop))
      return value ? '是' : '否'
    if (prop === 'businessType')
      return flowBusinessTypeOptions.find((option) => option.value === value)?.label || String(value)
    if (prop === 'nodeCode')
      return flowNodeOptions.find((option) => option.value === value)?.label || String(value)
    if (prop === 'packageType') return packageLabel(value)
    if (prop === 'expireAt') return orgExpiryMeta(value).label
    if (value === undefined || value === null || value === '') return '-'
    if (prop === 'status' || prop === 'gender' || prop === 'action')
      return (
        config.value.statusMap?.[String(value)] || commonStatusMap[String(value)] || String(value)
      )
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        if (value.length === 0) return '-'
        if (value.every((v) => v && typeof v === 'object' && 'name' in v)) {
          return value.map((v: any) => v.name).join(', ')
        }
        return `共${value.length}项`
      }
      if ('name' in value) return String((value as { name?: unknown }).name)
      if ('userName' in value) return String((value as { userName?: unknown }).userName)
      return JSON.stringify(value)
    }
    return String(value)
  }

  function shouldShowFieldGroup(field: FieldConfig, index: number) {
    if (!field.group) return false
    if (index === 0) return true
    return formFields.value[index - 1]?.group !== field.group
  }

  function packageLabel(value: unknown) {
    if (!value) return '未配置套餐'
    return orgPackageOptions.find((option) => option.value === value)?.label || String(value)
  }

  function orgCount(row: Record<string, unknown>, prop: string) {
    const value = row[prop]
    return typeof value === 'number' ? value : 0
  }

  function getOrgExpireState(value: unknown) {
    if (!value) return 'UNSET'
    const time = new Date(String(value)).getTime()
    if (Number.isNaN(time)) return 'UNSET'
    const now = Date.now()
    const diffDays = Math.ceil((time - now) / (24 * 60 * 60 * 1000))
    if (diffDays < 0) return 'EXPIRED'
    if (diffDays <= 30) return 'EXPIRING'
    return 'VALID'
  }

  function orgExpiryMeta(value: unknown): {
    label: string
    type: 'success' | 'warning' | 'danger' | 'info'
  } {
    const state = getOrgExpireState(value)
    if (state === 'UNSET') return { label: '未设置到期', type: 'info' }
    const dateText = formatDate(value)
    if (state === 'EXPIRED') return { label: `${dateText} 已过期`, type: 'danger' }
    if (state === 'EXPIRING') return { label: `${dateText} 即将到期`, type: 'warning' }
    return { label: `${dateText} 有效`, type: 'success' }
  }

  function formatDate(value: unknown) {
    if (!value) return '-'
    const date = new Date(String(value))
    if (Number.isNaN(date.getTime())) return String(value)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  function statusTagType(value: unknown) {
    const statusValue = String(value)
    if (
      [
        'ACTIVE',
        'DISBURSED',
        'PAID',
        'SIGNED',
        'RISK_PRE_PASSED',
        'FUNDER_PRE_PASSED',
        'FIRST_REVIEW_PASSED',
        'FINAL_REVIEW_PASSED',
        'FUNDER_REVIEW_PASSED',
        'LOAN_REQUEST_APPROVED'
      ].includes(statusValue)
    )
      return 'success'
    if (
      [
        'DRAFT',
        'PENDING',
        'SUBMITTED',
        'PENDING_RISK_PRE',
        'PENDING_FUNDER_PRE',
        'PENDING_SUPPLEMENT',
        'PENDING_FIRST_REVIEW',
        'PENDING_FINAL_REVIEW',
        'PENDING_FUNDER_REVIEW',
        'PENDING_SIGN',
        'SIGNING_PROGRESS',
        'PENDING_LOAN_REQUEST',
        'LOAN_REQUEST_REVIEWING',
        'PENDING_DISBURSEMENT'
      ].includes(statusValue)
    )
      return 'warning'
    if (
      ['INACTIVE', 'CANCELLED', 'FAILED', 'OVERDUE'].includes(statusValue) ||
      statusValue.includes('REJECTED')
    )
      return 'danger'
    return 'info'
  }

  function toOption(value: string): OptionConfig {
    return { label: commonStatusMap[value] || value, value }
  }

  function flattenRelations(row: Record<string, unknown>) {
    const flat = { ...row }
    const relationMap: Record<string, string> = {
      customer: 'customerName',
      product: 'productName',
      funder: 'funderName',
      org: 'orgName',
      assignee: 'assigneeName',
      creator: 'creatorName',
      parent: 'parentName'
    }
    for (const [key, alias] of Object.entries(relationMap)) {
      const rel = row[key]
      if (rel && typeof rel === 'object' && !Array.isArray(rel)) {
        const name = (rel as any).name ?? (rel as any).userName ?? (rel as any).realName
        if (name !== undefined) flat[alias] = name
      }
    }
    const count = row._count
    if (count && typeof count === 'object' && !Array.isArray(count)) {
      const source = count as Record<string, unknown>
      flat.departmentCount = Number(source.departments || 0)
      flat.productCount = Number(source.products || 0)
      flat.funderCount = Number(source.funders || 0)
      flat.customerCount = Number(source.customers || 0)
      flat.applicationCount = Number(source.applications || 0)
    }
    return flat
  }

  async function loadCurrentPageData() {
    await loadData()
  }

  onMounted(loadCurrentPageData)
  onActivated(loadCurrentPageData)
  watch(moduleName, async (_module, oldModule) => {
    if (!oldModule) return
    resetRuntimeState()
    await loadData()
  })
</script>

<style scoped>
  .detail-json {
    padding: 16px;
    overflow: auto;
    font-size: 12px;
    line-height: 1.6;
    background: var(--el-fill-color-light);
    border-radius: 8px;
  }

  .business-form {
    max-height: 62vh;
    padding-right: 10px;
    overflow: auto;
  }

  .business-form__section {
    padding: 12px 0 10px;
    margin-bottom: 16px;
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .org-summary {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 16px;
  }

  .org-summary__item {
    display: flex;
    gap: 12px;
    align-items: center;
    min-height: 76px;
    padding: 14px 16px;
    background: var(--el-fill-color-extra-light);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
  }

  .org-summary__icon {
    display: grid;
    flex: 0 0 38px;
    place-items: center;
    width: 38px;
    height: 38px;
    font-size: 20px;
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    border-radius: 8px;
  }

  .org-summary__icon.is-success {
    color: var(--el-color-success);
    background: var(--el-color-success-light-9);
  }

  .org-summary__icon.is-info {
    color: var(--el-color-info);
    background: var(--el-fill-color-light);
  }

  .org-summary__icon.is-warning {
    color: var(--el-color-warning);
    background: var(--el-color-warning-light-9);
  }

  .org-summary__value {
    font-size: 22px;
    font-weight: 700;
    line-height: 1.1;
    color: var(--el-text-color-primary);
  }

  .org-summary__label {
    margin-top: 6px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .org-name-cell {
    display: flex;
    gap: 10px;
    align-items: center;
    min-width: 0;
  }

  .org-name-cell__icon {
    display: grid;
    flex: 0 0 34px;
    place-items: center;
    width: 34px;
    height: 34px;
    font-size: 18px;
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    border-radius: 8px;
  }

  .org-name-cell__content {
    display: flex;
    flex-direction: column;
    min-width: 0;
    line-height: 1.45;
  }

  .org-name-cell__content strong,
  .org-name-cell__content span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .org-name-cell__content span,
  .org-contact-cell span,
  .org-scale-cell {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .org-contact-cell,
  .org-service-cell,
  .org-scale-cell {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }

  .org-contact-cell a {
    color: var(--el-color-primary);
  }

  .org-service-cell__package {
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .org-scale-cell strong {
    color: var(--el-text-color-primary);
  }

  @media (width <= 1200px) {
    .org-summary {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (width <= 768px) {
    .org-summary {
      grid-template-columns: 1fr;
    }
  }
</style>
