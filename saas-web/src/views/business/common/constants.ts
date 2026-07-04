import type { OptionConfig, FilterConfig } from './types'

// ==================== 通用状态映射 ====================

export const commonStatusMap: Record<string, string> = {
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

export function toOption(value: string): OptionConfig {
  return { label: commonStatusMap[value] || value, value }
}

// ==================== 选项列表 ====================

export const yesNoOptions: OptionConfig[] = [
  { label: '是', value: true },
  { label: '否', value: false }
]

export const orgStatusOptions = ['ACTIVE', 'INACTIVE', 'SUSPENDED'].map(toOption)
export const activeStatusOptions = ['ACTIVE', 'INACTIVE'].map(toOption)

export const orgPackageOptions: OptionConfig[] = [
  { label: '标准版', value: 'STANDARD' },
  { label: '专业版', value: 'PRO' },
  { label: '企业版', value: 'ENTERPRISE' },
  { label: '试用版', value: 'TRIAL' }
]

export const apiEnabledOptions: OptionConfig[] = yesNoOptions.map((option) => ({
  label: option.value ? '已开启' : '已关闭',
  value: option.value
}))

export const orgExpireStateOptions: OptionConfig[] = [
  { label: '已过期', value: 'EXPIRED' },
  { label: '30天内到期', value: 'EXPIRING' },
  { label: '有效期充足', value: 'VALID' },
  { label: '未设置到期', value: 'UNSET' }
]

export const leadStatusOptions = [
  'PENDING_ASSIGN',
  'PENDING_FOLLOW',
  'FOLLOWING',
  'CONVERTED',
  'INVALID',
  'DORMANT',
  'PUBLIC_POOL'
].map(toOption)

export const leadSourceOptions: OptionConfig[] = [
  { label: '自拓', value: 'SELF' },
  { label: '渠道', value: 'CHANNEL' },
  { label: '门店', value: 'STORE' },
  { label: '转介绍', value: 'REFERRAL' }
]

export const genderOptions = ['MALE', 'FEMALE', 'UNKNOWN'].map(toOption)
export const signingStatusOptions = ['PENDING', 'SENT', 'SIGNED', 'CANCELLED', 'EXPIRED'].map(
  toOption
)

export const disbursementStatusOptions = [
  'PENDING_APPLICATION',
  'PENDING_APPROVAL',
  'GPS_INSTALLED',
  'MORTGAGE_DONE',
  'DISBURSED',
  'FAILED'
].map(toOption)

export const repaymentStatusOptions = [
  'NOT_DUE',
  'PENDING',
  'PARTIAL',
  'PAID',
  'OVERDUE',
  'SETTLED'
].map(toOption)

export const approvalActionOptions = ['PASS', 'REJECT', 'SUPPLEMENT', 'RETURN'].map(toOption)

export const productTypeOptions: OptionConfig[] = [
  { label: '车贷', value: 'CAR_LOAN' },
  { label: '抵押贷', value: 'MORTGAGE_LOAN' },
  { label: '信用贷', value: 'CREDIT_LOAN' }
]

export const repaymentMethodOptions: OptionConfig[] = [
  '等额本息',
  '等额本金',
  '先息后本',
  '一次性还本付息'
].map((value) => ({ label: value, value }))

export const funderTypeOptions: OptionConfig[] = [
  { label: '银行', value: 'BANK' },
  { label: '消金', value: 'CONSUMER_FINANCE' },
  { label: '融资租赁', value: 'LEASING' },
  { label: '小贷', value: 'MICRO_LOAN' }
]

export const integrationModeOptions: OptionConfig[] = [
  { label: 'API对接', value: 'API' },
  { label: '文件导入导出', value: 'FILE' },
  { label: '人工录入', value: 'MANUAL' }
]

export const flowBusinessTypeOptions: OptionConfig[] = [
  { label: '车贷', value: 'CAR_LOAN' },
  { label: '融资租赁', value: 'LEASE' },
  { label: '典当', value: 'PAWN' }
]

export const flowNodeOptions: OptionConfig[] = [
  { label: '1100 身份证信息', value: '1100' },
  { label: '1110 车辆信息', value: '1110' },
  { label: '1120 申请信息', value: '1120' },
  { label: '1130 签署授权书', value: '1130' },
  { label: '1140 待预审', value: '1140' },
  { label: '1200 风控预审', value: '1200' },
  { label: '1250 资方预审', value: '1250' },
  { label: '1300 资料补充', value: '1300' },
  { label: '1310 客户资料', value: '1310' },
  { label: '1320 车辆资料', value: '1320' },
  { label: '1330 订单资料', value: '1330' },
  { label: '1340 文件资料', value: '1340' },
  { label: '1350 待提交', value: '1350' },
  { label: '1400 风控初审', value: '1400' },
  { label: '1450 风控终审', value: '1450' },
  { label: '1500 资方终审', value: '1500' },
  { label: '1600 签约办理', value: '1600' },
  { label: '1610 额度确认', value: '1610' },
  { label: '1620 绑银行卡', value: '1620' },
  { label: '1630 合同签署', value: '1630' },
  { label: '1640 GPS安装', value: '1640' },
  { label: '1650 抵押办理', value: '1650' },
  { label: '1660 待请款', value: '1660' },
  { label: '1700 请款资料', value: '1700' },
  { label: '1800 资方放款', value: '1800' },
  { label: '1900 贷后还款', value: '1900' }
]

export const flowPhaseOptions: OptionConfig[] = [
  { label: '预审阶段', value: 1000 },
  { label: '补件阶段', value: 1300 },
  { label: '风控审批', value: 1400 },
  { label: '资方终审', value: 1500 },
  { label: '签约阶段', value: 1600 },
  { label: '请款放款', value: 1700 },
  { label: '贷后阶段', value: 1900 }
]

export const flowNodeStatusOptions: OptionConfig[] = [
  { label: '未开始', value: 0 },
  { label: '处理中', value: 10 },
  { label: '已通过', value: 20 },
  { label: '已拒绝', value: 30 },
  { label: '已退回', value: 40 },
  { label: '待补充', value: 50 },
  { label: '已完成', value: 90 }
]

// ==================== 平台管理选项 ====================

export const tenantStatusOptions = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'EXPIRED'].map(toOption)

export const packageBillingStatusOptions = ['ACTIVE', 'INACTIVE', 'ARCHIVED'].map(toOption)

export const productTemplateStatusOptions = ['ACTIVE', 'INACTIVE', 'DRAFT'].map(toOption)

export const thirdPartyServiceTypeOptions: OptionConfig[] = [
  { label: '征信查询', value: 'CREDIT' },
  { label: '身份核验', value: 'IDENTITY' },
  { label: '车辆评估', value: 'CAR_VALUATION' },
  { label: 'GPS定位', value: 'GPS' },
  { label: '电子签约', value: 'E_SIGN' },
  { label: '短信通知', value: 'SMS' },
  { label: '支付通道', value: 'PAYMENT' },
  { label: '其他', value: 'OTHER' }
]

export const thirdPartyStatusOptions = ['ACTIVE', 'INACTIVE', 'MAINTENANCE'].map(toOption)

export const workOrderTypeOptions: OptionConfig[] = [
  { label: '系统问题', value: 'SYSTEM' },
  { label: '业务咨询', value: 'CONSULT' },
  { label: '数据修正', value: 'DATA_FIX' },
  { label: '权限申请', value: 'PERMISSION' },
  { label: '功能需求', value: 'FEATURE' },
  { label: '投诉建议', value: 'COMPLAINT' },
  { label: '其他', value: 'OTHER' }
]

export const workOrderPriorityOptions: OptionConfig[] = [
  { label: '低', value: 'LOW' },
  { label: '中', value: 'MEDIUM' },
  { label: '高', value: 'HIGH' },
  { label: '紧急', value: 'URGENT' }
]

export const workOrderStatusOptions = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'].map(toOption)

export const applicationStatusOptions = [
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

// ==================== 流程阶段映射 ====================

export const applicationNodeByPath: Record<string, number> = {
  'pre-entry': 1100,
  'risk-pre': 1200,
  'funder-pre': 1250,
  supplement: 1300,
  'first-review': 1400,
  'final-review': 1450,
  'funder-final': 1500,
  signing: 1600,
  'loan-request': 1700,
  'disbursement-node': 1800
}

export const applicationPhaseByPath: Record<string, number> = {
  precheck: 1000,
  'pre-review': 1000,
  supplement: 1300,
  'risk-approval': 1400,
  approval: 1400,
  'funder-final': 1500,
  'funder-review': 1500,
  signing: 1600,
  disbursement: 1700,
  'post-loan': 1900,
  reports: 1900
}

export const phaseTitleMap: Record<number, string> = {
  1000: '预审阶段',
  1300: '补件阶段',
  1400: '风控审批',
  1500: '资方终审',
  1600: '签约阶段',
  1700: '请款放款',
  1900: '贷后阶段'
}

export const phaseNodeTabsMap: Record<number, { label: string; value: number }[]> = {
  1000: [
    { label: '身份证信息', value: 1100 },
    { label: '车辆信息', value: 1110 },
    { label: '申请信息', value: 1120 },
    { label: '签署授权书', value: 1130 },
    { label: '待预审', value: 1140 },
    { label: '风控预审', value: 1200 },
    { label: '资方预审', value: 1250 }
  ],
  1300: [
    { label: '资料补充', value: 1300 },
    { label: '客户资料', value: 1310 },
    { label: '车辆资料', value: 1320 },
    { label: '订单资料', value: 1330 },
    { label: '文件资料', value: 1340 },
    { label: '待提交', value: 1350 }
  ],
  1400: [
    { label: '风控初审', value: 1400 },
    { label: '风控终审', value: 1450 }
  ],
  1500: [{ label: '资方终审', value: 1500 }],
  1600: [
    { label: '签约办理', value: 1600 },
    { label: '额度确认', value: 1610 },
    { label: '绑银行卡', value: 1620 },
    { label: '合同签署', value: 1630 },
    { label: 'GPS安装', value: 1640 },
    { label: '抵押办理', value: 1650 },
    { label: '待请款', value: 1660 }
  ],
  1700: [
    { label: '请款资料', value: 1700 },
    { label: '资方放款', value: 1800 }
  ],
  1900: [{ label: '贷后还款', value: 1900 }]
}
