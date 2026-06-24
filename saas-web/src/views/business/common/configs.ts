import type { PageConfig, FieldConfig, ActionConfig } from './types'
import {
  orgStatusOptions, activeStatusOptions, orgPackageOptions, leadStatusOptions,
  leadSourceOptions, genderOptions, signingStatusOptions, disbursementStatusOptions,
  repaymentStatusOptions, approvalActionOptions, productTypeOptions,
  repaymentMethodOptions, funderTypeOptions, integrationModeOptions,
  flowBusinessTypeOptions, flowNodeOptions, applicationStatusOptions,
  yesNoOptions, apiEnabledOptions, orgExpireStateOptions, toOption
} from './constants'

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
      name: 'process',
      label: '处理',
      type: 'primary',
      path: (row) => {
        const status = String(row.status)
        if (status === 'PENDING_SUPPLEMENT') return `/application/${row.id}/complete-supplement`
        if (status === 'SUBMITTED' || status === 'PENDING_RISK_PRE') return `/application/${row.id}/risk-pre-pass`
        if (status === 'PENDING_FUNDER_PRE') return `/application/${row.id}/funder-pre-pass`
        return `/application/${row.id}/submit`
      },
      fields: [
        { prop: 'approverId', label: '处理人ID', type: 'number', required: true },
        { prop: 'opinion', label: '处理意见', type: 'textarea' },
        { prop: 'amount', label: '核定金额', type: 'number', precision: 2 },
        { prop: 'term', label: '核定期限(月)', type: 'number' },
        { prop: 'rate', label: '核定利率', type: 'number', precision: 4 },
        { prop: 'funderApprovalNo', label: '资方审批编号' }
      ],
      defaults: (row) => ({
        amount: row.approvedAmount || row.amount,
        term: row.approvedTerm || row.term,
        rate: row.approvedRate || row.rate
      }),
      visible: (row) => {
        const status = String(row.status || row.currentStatusName || '')
        // 终态不显示
        if (status === 'DISBURSED' || status === 'CANCELLED' || status.includes('REJECTED')) return false
        // 已有专门操作按钮的状态不再显示通用处理，避免重复入口
        const dedicatedStatuses = new Set([
          'DRAFT',
          'PENDING_SUPPLEMENT',
          'FUNDER_PRE_PASSED',
          'SUBMITTED',
          'PENDING_RISK_PRE',
          'PENDING_FUNDER_PRE',
          'PENDING_FIRST_REVIEW',
          'PENDING_FINAL_REVIEW',
          'FINAL_REVIEW_PASSED',
          'PENDING_FUNDER_REVIEW',
          'PENDING_SIGN',
          'SIGNING_PROGRESS',
          'SIGNED',
          'PENDING_LOAN_REQUEST',
          'LOAN_REQUEST_REJECTED',
          'LOAN_REQUEST_REVIEWING',
          'LOAN_REQUEST_APPROVED',
          'PENDING_DISBURSEMENT',
          'DISBURSED',
          'RISK_PRE_PASSED',
          'FUNDER_REVIEW_PASSED'
        ])
        return !dedicatedStatuses.has(status)
      }
    },
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

export const configs: Record<string, PageConfig> = {
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
        defaultValue: '1100',
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
      {
        prop: 'status',
        label: '状态',
        type: 'select',
        options: activeStatusOptions,
        defaultValue: 'ACTIVE'
      }
    ],
    actions: []
  },
  application: {
    title: '进件管理',
    description: '进件资料、审批流、签约、放款与还款的核心入口。',
    api: 'application',
    listApi: 'flow-list',
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
      { prop: 'repaymentMethod', label: '还款方式', type: 'select', options: repaymentMethodOptions, defaultValue: '等额本息', required: true },
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
  'order-query': {
    title: '综合查询',
    description: '按订单号、客户、手机号、车牌号、流程节点和状态查询订单列表。',
    api: 'application',
    listApi: 'order-list',
    readonly: true,
    keywordField: 'keyword',
    keywordParam: 'keyword',
    keywordPlaceholder: '订单号/姓名/手机号/车牌号',
    statusMap: commonStatusMap,
    columns: [
      { prop: 'orderNo', label: '订单号', width: 200 },
      { prop: 'customerName', label: '客户姓名', width: 120 },
      { prop: 'phone', label: '手机号', width: 140 },
      { prop: 'plateNumber', label: '车牌号', width: 120 },
      { prop: 'productName', label: '产品', width: 140 },
      { prop: 'funderName', label: '资方', width: 140 },
      { prop: 'amount', label: '申请金额', width: 120 },
      { prop: 'approvedAmount', label: '审批金额', width: 120 },
      { prop: 'currentNodeName', label: '当前节点', width: 140 },
      { prop: 'status', label: '状态', width: 160 }
    ],
    detailColumns: [
      { prop: 'orderNo', label: '订单号' },
      { prop: 'creditOrderId', label: '授信订单号' },
      { prop: 'customerName', label: '客户姓名' },
      { prop: 'phone', label: '手机号' },
      { prop: 'idCard', label: '身份证号' },
      { prop: 'plateNumber', label: '车牌号' },
      { prop: 'productName', label: '产品' },
      { prop: 'funderName', label: '资方' },
      { prop: 'amount', label: '申请金额' },
      { prop: 'approvedAmount', label: '审批金额' },
      { prop: 'term', label: '期限(月)' },
      { prop: 'currentNodeName', label: '当前节点' },
      { prop: 'currentStatusName', label: '节点状态' },
      { prop: 'status', label: '订单状态' }
    ],
    formFields: [],
    actions: []
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
      {
        prop: 'status',
        label: '签约状态',
        type: 'select',
        options: signingStatusOptions,
        defaultValue: 'PENDING'
      },
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
      {
        prop: 'status',
        label: '放款状态',
        type: 'select',
        options: disbursementStatusOptions,
        defaultValue: 'PENDING_APPLICATION'
      },
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
      {
        prop: 'status',
        label: '状态',
        type: 'select',
        options: repaymentStatusOptions,
        defaultValue: 'PENDING'
      }
    ],
    actions: []
  }
}
