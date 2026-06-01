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
          placeholder="关键词/编号"
          style="width: 220px"
          @keyup.enter="loadData"
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
            @keyup.enter="loadData"
          />
          <ElSelect
            v-else
            v-model="extraFilterModel[filter.prop]"
            clearable
            filterable
            :placeholder="filter.label"
            style="width: 160px"
          >
            <ElOption v-for="opt in filter.options" :key="String(opt.value)" :label="opt.label" :value="opt.value" />
          </ElSelect>
        </template>
        <ElButton type="primary" @click="loadData">查询</ElButton>
        <ElButton @click="resetSearch">重置</ElButton>
      </ElSpace>
    </ElCard>

    <ElCard class="art-table-card" style="margin-top: 0">
      <template #header>
        <div class="flex-cb">
          <h4 class="m-0">{{ config.title }}列表</h4>
          <ElSpace>
            <ElButton type="primary" @click="openCreate">新增</ElButton>
            <ElButton :loading="loading" @click="loadData">刷新</ElButton>
            <ElButton v-if="config.actions.length" type="success" plain @click="showActions = !showActions">
              {{ showActions ? '隐藏动作接口' : '查看动作接口' }}
            </ElButton>
          </ElSpace>
        </div>
      </template>

      <ElAlert v-if="showActions && config.actions.length" class="mb-4" type="success" :closable="false">
        <template #title>已接入业务动作接口</template>
        <div class="flex flex-wrap gap-2 mt-2">
          <ElTag v-for="action in config.actions" :key="action.label" type="success">{{ action.label }}</ElTag>
        </div>
      </ElAlert>

      <ElTable v-loading="loading" :data="records" row-key="id" border stripe>
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
            <ElTag v-if="column.prop === 'status'" :type="statusTagType(row[column.prop])" effect="light">
              {{ formatCell(row, column.prop) }}
            </ElTag>
            <span v-else>{{ formatCell(row, column.prop) }}</span>
          </template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="360" fixed="right">
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

    <ElDialog v-model="formVisible" :title="formMode === 'create' ? `新增${config.title}` : `编辑${config.title}`" width="680px">
      <ElForm label-width="120px" class="business-form">
        <ElFormItem v-for="field in formFields" :key="field.prop" :label="field.label" :required="field.required">
          <ElInputNumber
            v-if="field.type === 'number'"
            v-model="formModel[field.prop] as number"
            :min="0"
            :precision="field.precision"
            controls-position="right"
            style="width: 100%"
          />
          <ElSelect v-else-if="field.type === 'select'" v-model="formModel[field.prop]" clearable filterable style="width: 100%">
            <ElOption
              v-for="option in field.options || []"
              :key="String(option.value)"
              :label="option.label"
              :value="option.value"
            />
          </ElSelect>
          <ElSwitch v-else-if="field.type === 'switch'" v-model="formModel[field.prop] as boolean" />
          <ElDatePicker
            v-else-if="field.type === 'date'"
            v-model="formModel[field.prop] as string | number | Date | string[] | undefined"
            type="datetime"
            value-format="YYYY-MM-DDTHH:mm:ss.SSSZ"
            style="width: 100%"
          />
          <ElInput
            v-else
            v-model="formModel[field.prop] as string"
            clearable
            :autosize="field.type === 'json' || field.type === 'textarea' ? { minRows: 3, maxRows: 8 } : undefined"
            :type="field.type === 'textarea' || field.type === 'json' ? 'textarea' : 'text'"
          />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="formVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="submitting" @click="submitForm">保存</ElButton>
      </template>
    </ElDialog>

    <ElDialog v-model="actionVisible" :title="activeAction?.label || '业务动作'" width="560px">
      <ElForm label-width="120px" class="business-form">
        <ElFormItem v-for="field in actionFields" :key="field.prop" :label="field.label" :required="field.required">
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
          <ElInput v-else v-model="actionModel[field.prop] as string" clearable :type="field.type === 'textarea' ? 'textarea' : 'text'" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="actionVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="submitting" @click="submitAction">确认执行</ElButton>
      </template>
    </ElDialog>

    <ElDrawer v-model="detailVisible" :title="`${config.title}详情`" size="640px">
      <ElDescriptions v-if="currentRow" :column="1" border>
        <ElDescriptionsItem v-for="column in detailColumns" :key="column.prop" :label="column.label">
          {{ formatCell(currentRow, column.prop) }}
        </ElDescriptionsItem>
      </ElDescriptions>
      <ElDivider>原始数据</ElDivider>
      <pre class="detail-json">{{ JSON.stringify(currentRow, null, 2) }}</pre>
    </ElDrawer>
  </div>
</template>

<script setup lang="ts">
  import { computed, onActivated, onMounted, reactive, ref } from 'vue'
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
  type ColumnConfig = { prop: string; label: string; width?: number }
  type FieldConfig = {
    prop: string
    label: string
    type?: FieldType
    required?: boolean
    precision?: number
    defaultValue?: unknown
    options?: OptionConfig[]
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
    columns: ColumnConfig[]
    formFields: FieldConfig[]
    statusMap?: Record<string, string>
    actions: ActionConfig[]
  }

  const route = useRoute()
  const pageRouteName = String(route.name || '')
  const pageModuleName = String(route.meta.businessModule || 'application')
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
  const activeAction = ref<ActionConfig | null>(null)
  const actionRow = ref<Record<string, unknown> | null>(null)
  const pagination = ref({ current: 1, size: 20, total: 0 })

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
    SUBMITTED: '资料校验中',
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
    SIGNED: '已签约',
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
  const leadStatusOptions = ['PENDING_ASSIGN', 'PENDING_FOLLOW', 'FOLLOWING', 'CONVERTED', 'INVALID', 'DORMANT', 'PUBLIC_POOL'].map(toOption)
  const genderOptions = ['MALE', 'FEMALE', 'UNKNOWN'].map(toOption)
  const signingStatusOptions = ['PENDING', 'SENT', 'SIGNED', 'CANCELLED', 'EXPIRED'].map(toOption)
  const disbursementStatusOptions = ['PENDING_APPLICATION', 'PENDING_APPROVAL', 'GPS_INSTALLED', 'MORTGAGE_DONE', 'DISBURSED', 'FAILED'].map(toOption)
  const repaymentStatusOptions = ['NOT_DUE', 'PENDING', 'PARTIAL', 'PAID', 'OVERDUE', 'SETTLED'].map(toOption)
  const approvalActionOptions = ['PASS', 'REJECT', 'SUPPLEMENT', 'RETURN'].map(toOption)
  const productTypeOptions = [
    { label: '车贷', value: 'CAR_LOAN' },
    { label: '抵押贷', value: 'MORTGAGE_LOAN' },
    { label: '信用贷', value: 'CREDIT_LOAN' }
  ]
  const repaymentMethodOptions = ['等额本息', '等额本金', '先息后本', '一次性还本付息'].map((value) => ({ label: value, value }))
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
  const applicationStatusOptions = [
    'DRAFT',
    'SUBMITTED',
    'PENDING_FIRST_REVIEW',
    'PENDING_FINAL_REVIEW',
    'FINAL_REVIEW_PASSED',
    'PENDING_FUNDER_REVIEW',
    'FUNDER_REVIEW_PASSED',
    'FUNDER_REVIEW_REJECTED',
    'PENDING_SIGN',
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
      name: 'precheck-pass',
      label: '预审通过',
      path: (row) => `/application/${row.id}/precheck-pass`,
      fields: [
        { prop: 'reviewerId', label: '预审人ID', type: 'number' },
        { prop: 'opinion', label: '预审意见', type: 'textarea' }
      ],
      visible: (row) => String(row.status) === 'SUBMITTED'
    },
    {
      name: 'approve',
      label: '初审/终审通过',
      path: (row) => `/application/${row.id}/approve`,
      fields: approvalFields,
      defaults: (row) => ({ amount: row.amount, term: row.term, rate: row.rate }),
      visible: (row) => ['PENDING_FIRST_REVIEW', 'PENDING_FINAL_REVIEW'].includes(String(row.status))
    },
    {
      name: 'reject',
      label: '审批驳回',
      type: 'danger',
      path: (row) => `/application/${row.id}/reject`,
      fields: approvalFields.slice(0, 2),
      visible: (row) => ['SUBMITTED', 'PENDING_FIRST_REVIEW', 'PENDING_FINAL_REVIEW', 'PENDING_FUNDER_REVIEW'].includes(String(row.status))
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
      visible: (row) => ['SUBMITTED', 'PENDING_FIRST_REVIEW', 'PENDING_FINAL_REVIEW', 'PENDING_FUNDER_REVIEW'].includes(String(row.status))
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
      fields: [
        ...approvalFields,
        { prop: 'funderApprovalNo', label: '资方审批编号' }
      ],
      defaults: (row) => ({ amount: row.approvedAmount || row.amount, term: row.approvedTerm || row.term, rate: row.approvedRate || row.rate }),
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
      visible: (row) => String(row.status) === 'PENDING_SIGN'
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
      label: '出账申请',
      path: (row) => `/application/${row.id}/request-disbursement`,
      fields: [
        { prop: 'remark', label: '出账备注', type: 'textarea' }
      ],
      visible: (row) => String(row.status) === 'PENDING_DISBURSEMENT'
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
      fields: [
        { prop: 'remark', label: '结清备注', type: 'textarea' }
      ],
      visible: (row) => String(row.status) === 'DISBURSED'
    }
  ]

  const configs: Record<string, PageConfig> = {
    org: {
      title: '机构管理',
      description: '维护租户机构、套餐、到期时间与API开关。',
      api: 'org',
      keywordField: 'name',
      columns: [
        { prop: 'name', label: '机构名称' },
        { prop: 'code', label: '机构编码' },
        { prop: 'contactName', label: '联系人' },
        { prop: 'contactPhone', label: '联系电话' },
        { prop: 'status', label: '状态' }
      ],
      formFields: [
        { prop: 'name', label: '机构名称', required: true },
        { prop: 'code', label: '机构编码', required: true },
        { prop: 'contactName', label: '联系人' },
        { prop: 'contactPhone', label: '联系电话' },
        { prop: 'address', label: '地址' },
        { prop: 'creditCode', label: '统一社会信用代码' },
        { prop: 'packageType', label: '套餐类型', defaultValue: 'STANDARD' },
        { prop: 'expireAt', label: '到期时间', type: 'date' },
        { prop: 'apiEnabled', label: 'API开关', type: 'switch', defaultValue: true },
        { prop: 'status', label: '状态', type: 'select', options: orgStatusOptions, defaultValue: 'ACTIVE' }
      ],
      actions: [
        { name: 'enable', label: '启用', path: (row) => `/org/${row.id}/enable`, visible: (row) => String(row.status) !== 'ACTIVE' },
        { name: 'disable', label: '停用', type: 'warning', path: (row) => `/org/${row.id}/disable`, visible: (row) => String(row.status) === 'ACTIVE' }
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
        { prop: 'managerId', label: '负责人ID', width: 120 }
      ],
      formFields: [
        { prop: 'orgId', label: '机构ID', type: 'number', required: true },
        { prop: 'name', label: '部门名称', required: true },
        { prop: 'parentId', label: '上级部门ID', type: 'number' },
        { prop: 'managerId', label: '负责人ID', type: 'number' },
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
        { prop: 'orgId', label: '机构ID', type: 'number', required: true },
        { prop: 'name', label: '产品名称', required: true },
        { prop: 'productType', label: '产品类型', type: 'select', options: productTypeOptions, defaultValue: 'CAR_LOAN', required: true },
        { prop: 'minRate', label: '最低年利率', type: 'number', precision: 4, defaultValue: 0.036, required: true },
        { prop: 'maxRate', label: '最高年利率', type: 'number', precision: 4, defaultValue: 0.12, required: true },
        { prop: 'minAmount', label: '最低金额', type: 'number', precision: 2, required: true },
        { prop: 'maxAmount', label: '最高金额', type: 'number', precision: 2, required: true },
        { prop: 'minTerm', label: '最短期限(月)', type: 'number', required: true },
        { prop: 'maxTerm', label: '最长期限(月)', type: 'number', required: true },
        { prop: 'repaymentMethod', label: '还款方式', type: 'select', options: repaymentMethodOptions, defaultValue: '等额本息', required: true },
        { prop: 'minAge', label: '最低年龄', type: 'number' },
        { prop: 'maxAge', label: '最高年龄', type: 'number' },
        { prop: 'maxCarAge', label: '最大车龄', type: 'number' },
        { prop: 'maxMileage', label: '最大里程', type: 'number' },
        { prop: 'ltvLimit', label: '最高LTV', type: 'number', precision: 4 },
        { prop: 'minDownPayment', label: '最低首付比例', type: 'number', precision: 4 },
        { prop: 'valuationDiscountRate', label: '估值折扣率', type: 'number', precision: 4 },
        { prop: 'regions', label: '适用区域' },
        { prop: 'applicableFunders', label: '适用资方JSON', type: 'json' },
        { prop: 'accessConditions', label: '准入条件JSON', type: 'json' },
        { prop: 'fileChecklist', label: '文件清单JSON', type: 'json' },
        { prop: 'status', label: '状态', type: 'select', options: activeStatusOptions, defaultValue: 'ACTIVE' }
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
        { prop: 'code', label: '资方编码', width: 140 },
        { prop: 'funderType', label: '类型', width: 120 },
        { prop: 'contactName', label: '联系人', width: 120 },
        { prop: 'status', label: '状态', width: 100 }
      ],
      formFields: [
        { prop: 'orgId', label: '机构ID', type: 'number', required: true },
        { prop: 'name', label: '资方名称', required: true },
        { prop: 'code', label: '资方编码', required: true },
        { prop: 'funderType', label: '资方类型', type: 'select', options: funderTypeOptions, defaultValue: 'BANK', required: true },
        { prop: 'contactName', label: '联系人' },
        { prop: 'contactPhone', label: '联系电话' },
        { prop: 'integrationMode', label: '对接方式', type: 'select', options: integrationModeOptions, defaultValue: 'MANUAL' },
        { prop: 'creditLimit', label: '授信额度', type: 'number', precision: 2 },
        { prop: 'apiConfig', label: 'API配置JSON', type: 'json' },
        { prop: 'approvalRules', label: '审批规则JSON', type: 'json' },
        { prop: 'priority', label: '优先级', type: 'number', defaultValue: 0 },
        { prop: 'status', label: '状态', type: 'select', options: activeStatusOptions, defaultValue: 'ACTIVE' }
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
        { prop: 'name', label: '客户姓名', width: 120 },
        { prop: 'phone', label: '手机号', width: 140 },
        { prop: 'source', label: '来源', width: 120 },
        { prop: 'loanAmount', label: '意向金额', width: 120 },
        { prop: 'status', label: '状态', width: 120 }
      ],
      formFields: [
        { prop: 'orgId', label: '机构ID', type: 'number', required: true },
        { prop: 'source', label: '来源', defaultValue: 'SELF', required: true },
        { prop: 'name', label: '客户姓名', required: true },
        { prop: 'phone', label: '手机号', required: true },
        { prop: 'idCard', label: '身份证号' },
        { prop: 'carBrand', label: '车辆品牌' },
        { prop: 'carModel', label: '车型' },
        { prop: 'loanAmount', label: '意向金额', type: 'number', precision: 2 },
        { prop: 'assigneeId', label: '负责人ID', type: 'number' },
        { prop: 'status', label: '状态', type: 'select', options: leadStatusOptions, defaultValue: 'PENDING_ASSIGN' },
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
        { prop: 'gender', label: '性别', type: 'select', options: genderOptions, defaultValue: 'UNKNOWN' },
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
        { prop: 'orgId', label: '机构ID', type: 'number', required: true },
        { prop: 'customerId', label: '客户ID', type: 'number', required: true },
        { prop: 'productId', label: '产品ID', type: 'number' },
        { prop: 'funderId', label: '资方ID', type: 'number' },
        { prop: 'amount', label: '申请金额', type: 'number', precision: 2, required: true },
        { prop: 'term', label: '期限(月)', type: 'number', required: true },
        { prop: 'rate', label: '年利率', type: 'number', precision: 4, defaultValue: 0.068, required: true },
        { prop: 'repaymentMethod', label: '还款方式', defaultValue: '等额本息', required: true },
        { prop: 'creatorId', label: '创建人ID', type: 'number', required: true },
        { prop: 'status', label: '状态', type: 'select', options: applicationStatusOptions, defaultValue: 'DRAFT' },
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

  const moduleName = computed(() => pageModuleName)
  const config = computed(() => configs[moduleName.value] || configs.application)
  const formFields = computed(() => config.value.formFields)
  const actionFields = computed(() => activeAction.value?.fields || [])
  const detailColumns = computed(() => [
    { prop: 'id', label: 'ID' },
    ...config.value.columns,
    { prop: 'createdAt', label: '创建时间' },
    { prop: 'updatedAt', label: '更新时间' }
  ])
  const statusFilterOptions = computed(() => {
    const optionsMap: Record<string, OptionConfig[]> = {
      org: orgStatusOptions,
      product: activeStatusOptions,
      funder: activeStatusOptions,
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
    const filters: { prop: string; label: string; type: 'select' | 'number'; options?: OptionConfig[] }[] = []
    if (['org', 'dept', 'product', 'funder', 'lead', 'customer', 'application'].includes(m)) {
      filters.push({ prop: 'orgId', label: '机构ID', type: 'number' })
    }
    if (m === 'application') {
      filters.push({ prop: 'customerId', label: '客户ID', type: 'number' })
      filters.push({ prop: 'creatorId', label: '创建人ID', type: 'number' })
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
      filters.push({ prop: 'funderType', label: '资方类型', type: 'select', options: [{ label: '银行', value: 'BANK' }, { label: '消金', value: 'CONSUMER_FINANCE' }, { label: '租赁', value: 'LEASE' }, { label: '小贷', value: 'MICRO_LOAN' }] })
    }
    return filters
  })

  const extraFilterModel = reactive<FormModel>({})

  async function loadData() {
    loading.value = true
    try {
      const params: Record<string, unknown> = {
        current: pagination.value.current,
        size: pagination.value.size
      }
      if (keyword.value && config.value.keywordField) params[config.value.keywordField] = keyword.value
      if (status.value && statusFilterOptions.value.length) params.status = status.value
      for (const filter of extraFilters.value) {
        const v = extraFilterModel[filter.prop]
        if (v !== undefined && v !== null && v !== '') params[filter.prop] = v
      }
      const result = await fetchBusinessList(config.value.api, params)
      const rawRecords = (result.records || []) as Record<string, unknown>[]
      records.value = rawRecords.map((r) => flattenRelations(r))
      pagination.value.total = result.total || 0
    } finally {
      loading.value = false
    }
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
  }

  function openEdit(row: Record<string, unknown>) {
    formMode.value = 'edit'
    resetModel(formModel, formFields.value, row)
    currentRow.value = row
    formVisible.value = true
  }

  async function openDetail(row: Record<string, unknown>) {
    currentRow.value = row
    detailVisible.value = true
    try {
      currentRow.value = await fetchBusinessDetail(config.value.api, Number(row.id))
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
      await fetchBusinessAction(activeAction.value.path(actionRow.value), cleanPayload(actionModel, actionFields.value))
      ElMessage.success('操作成功')
      actionVisible.value = false
      await loadData()
    } catch (error) {
      ElMessage.error(error instanceof Error ? error.message : '操作失败')
    } finally {
      submitting.value = false
    }
  }

  function resetModel(target: Record<string, unknown>, fields: FieldConfig[], source?: Record<string, unknown>) {
    for (const key of Object.keys(target)) delete target[key]
    for (const field of fields) {
      const value = source && source[field.prop] !== undefined ? source[field.prop] : field.defaultValue
      if (field.type === 'json' && value !== undefined && value !== null && value !== '') {
        target[field.prop] = typeof value === 'string' ? value : JSON.stringify(value, null, 2)
      } else {
        target[field.prop] = value ?? undefined
      }
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
      } else {
        payload[key] = value
      }
    }
    return payload
  }

  function validateRequired(fields: FieldConfig[], model: Record<string, unknown>) {
    const field = fields.find((item) => item.required && (model[item.prop] === undefined || model[item.prop] === null || model[item.prop] === ''))
    return field ? `请填写${field.label}` : ''
  }

  async function handleDelete(row: Record<string, unknown>) {
    try {
      await ElMessageBox.confirm(`确认删除该${config.value.title}记录？`, '删除确认', { type: 'warning' })
      await fetchBusinessDelete(config.value.api, Number(row.id))
      ElMessage.success('删除成功')
      await loadData()
    } catch {
      // cancel
    }
  }

  function formatCell(row: Record<string, unknown>, prop: string) {
    const value = row[prop]
    if (value === undefined || value === null || value === '') return '-'
    if (prop === 'status' || prop === 'gender' || prop === 'action') return config.value.statusMap?.[String(value)] || commonStatusMap[String(value)] || String(value)
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

  function statusTagType(value: unknown) {
    const statusValue = String(value)
    if (['ACTIVE', 'DISBURSED', 'PAID', 'SIGNED', 'FINAL_REVIEW_PASSED'].includes(statusValue)) return 'success'
    if (['DRAFT', 'PENDING', 'PENDING_FIRST_REVIEW', 'PENDING_FINAL_REVIEW', 'PENDING_SIGN', 'PENDING_DISBURSEMENT'].includes(statusValue)) return 'warning'
    if (['INACTIVE', 'CANCELLED', 'FAILED', 'OVERDUE'].includes(statusValue) || statusValue.includes('REJECTED')) return 'danger'
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
    return flat
  }

  let hasLoaded = false

  async function loadCurrentPageData() {
    if (pageRouteName && String(route.name || '') !== pageRouteName) return
    if (hasLoaded) return
    hasLoaded = true
    await loadData()
  }

  onMounted(loadCurrentPageData)
  onActivated(loadCurrentPageData)
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
</style>
