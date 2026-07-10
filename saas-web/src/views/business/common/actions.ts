import type { FieldConfig, ActionConfig } from './types'

/** 审批通用字段 */
export const approvalFields: FieldConfig[] = [
  { prop: 'approverId', label: '审批人ID', type: 'number', required: true },
  { prop: 'opinion', label: '审批意见', type: 'textarea' },
  { prop: 'amount', label: '核定金额', type: 'number', precision: 2 },
  { prop: 'term', label: '核定期限(月)', type: 'number' },
  { prop: 'rate', label: '核定利率', type: 'number', precision: 4 }
]

/** 线索操作 */
export const leadActions: ActionConfig[] = [
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

/** 进件操作（全流程） */
export const applicationActions: ActionConfig[] = [
  {
    name: 'process',
    label: '处理',
    type: 'primary',
    path: (row) => {
      const status = String(row.status)
      if (status === 'PENDING_SUPPLEMENT') return `/application/${row.id}/complete-supplement`
      if (status === 'SUBMITTED' || status === 'PENDING_RISK_PRE')
        return `/application/${row.id}/risk-pre-pass`
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
      if (status === 'DISBURSED' || status === 'CANCELLED' || status.includes('REJECTED'))
        return false
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
    type: 'success',
    path: (row) => `/application/${row.id}/risk-pre-pass`,
    fields: [
      { prop: 'reviewerId', label: '处理人ID', type: 'number', required: true },
      { prop: 'opinion', label: '审批备注', type: 'textarea', required: true }
    ],
    visible: (row) => ['SUBMITTED', 'PENDING_RISK_PRE'].includes(String(row.status))
  },
  {
    name: 'risk-pre-reject',
    label: '风控预审拒绝',
    type: 'danger',
    path: (row) => `/application/${row.id}/risk-pre-reject`,
    fields: [
      { prop: 'reviewerId', label: '处理人ID', type: 'number', required: true },
      { prop: 'opinion', label: '拒绝原因', type: 'textarea', required: true }
    ],
    visible: (row) => ['SUBMITTED', 'PENDING_RISK_PRE'].includes(String(row.status))
  },
  {
    name: 'risk-pre-return',
    label: '风控预审驳回',
    type: 'warning',
    path: (row) => `/application/${row.id}/risk-pre-return`,
    fields: [
      { prop: 'reviewerId', label: '处理人ID', type: 'number', required: true },
      { prop: 'opinion', label: '驳回备注', type: 'textarea', required: true }
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
    visible: (row) => ['PENDING_FIRST_REVIEW', 'PENDING_FINAL_REVIEW'].includes(String(row.status))
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
    visible: (row) => ['LOAN_REQUEST_APPROVED', 'PENDING_DISBURSEMENT'].includes(String(row.status))
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
  },
  {
    name: 'register-repayment',
    label: '登记还款',
    type: 'primary',
    path: (row) => `/application/${row.id}/register-repayment`,
    fields: [
      { prop: 'amount', label: '还款金额', type: 'number', precision: 2, required: true },
      { prop: 'principal', label: '本金', type: 'number', precision: 2 },
      { prop: 'interest', label: '利息', type: 'number', precision: 2 },
      { prop: 'penalty', label: '罚息', type: 'number', precision: 2 },
      {
        prop: 'paymentMethod',
        label: '还款方式',
        type: 'select',
        options: [
          { label: '银行转账', value: 'BANK_TRANSFER' },
          { label: '现金', value: 'CASH' },
          { label: '支付宝', value: 'ALIPAY' },
          { label: '微信', value: 'WECHAT' }
        ],
        required: true
      },
      { prop: 'transactionNo', label: '交易流水号' },
      { prop: 'remark', label: '备注', type: 'textarea' },
      { prop: 'createdBy', label: '登记人', type: 'number', visible: false }
    ],
    defaults: (row) => {
      // 从还款计划中预填当期金额
      const plans = (row.repayments || []) as Record<string, unknown>[]
      const unpaid = plans.find((p: Record<string, unknown>) => {
        const s = String(p.status)
        return s !== 'PAID' && s !== 'SETTLED'
      })
      return {
        amount: unpaid?.totalAmount ?? 0,
        principal: unpaid?.principal ?? 0,
        interest: unpaid?.interest ?? 0,
        penalty: unpaid?.penaltyAmount
          ? Number(unpaid.penaltyAmount) > 0
            ? unpaid.penaltyAmount
            : undefined
          : undefined,
        paymentMethod: 'BANK_TRANSFER'
      }
    },
    visible: (row) => String(row.status) === 'DISBURSED'
  },
  {
    name: 'early-repayment',
    label: '提前还款',
    type: 'warning',
    path: (row) => `/application/${row.id}/early-repayment`,
    fields: [
      {
        prop: 'repayType',
        label: '还款类型',
        type: 'select',
        options: [
          { label: '提前结清', value: 'FULL' },
          { label: '部分提前', value: 'PARTIAL' }
        ],
        required: true
      },
      { prop: 'amount', label: '还款总额', type: 'number', precision: 2, required: true },
      { prop: 'principal', label: '本金', type: 'number', precision: 2, required: true },
      { prop: 'interest', label: '利息', type: 'number', precision: 2, required: true },
      { prop: 'penalty', label: '违约金', type: 'number', precision: 2 },
      { prop: 'reason', label: '提前还款原因', type: 'textarea' }
    ],
    defaults: (row) => {
      // 从还款计划中自动计算剩余金额
      const plans = (row.repayments || []) as Record<string, unknown>[]
      let remainingPrincipal = 0
      let remainingInterest = 0
      for (const p of plans) {
        const s = String(p.status)
        if (s !== 'PAID' && s !== 'SETTLED') {
          remainingPrincipal += Number(p.principal || 0)
          remainingInterest += Number(p.interest || 0)
        }
      }
      const total = Math.round((remainingPrincipal + remainingInterest) * 100) / 100
      // 保存原始值用于部分结清时重算
      ;(row as Record<string, unknown>).__earlyRepayOrigPrincipal = remainingPrincipal
      ;(row as Record<string, unknown>).__earlyRepayOrigInterest = remainingInterest
      return {
        repayType: 'FULL',
        amount: total,
        principal: Math.round(remainingPrincipal * 100) / 100,
        interest: Math.round(remainingInterest * 100) / 100
      }
    },
    visible: (row) => String(row.status) === 'DISBURSED'
  }
]
