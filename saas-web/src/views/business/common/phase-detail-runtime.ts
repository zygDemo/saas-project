import type { FileItem, ActionConfig } from './types'

export type PhaseFieldValue = {
  prop: string
  label: string
  value: unknown
}

export type PhaseGroup = {
  nodeCode: number
  nodeName: string
  fields: PhaseFieldValue[]
}

export type PhaseTab = {
  code: number
  name: string
  actions: ActionConfig[]
  groups: PhaseGroup[]
}

export const nodeFieldDefs: Record<number, { source?: string; label: string; fields: string[] }> = {
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
  1900: { source: '', label: '贷后还款', fields: ['status', 'approvedAmount', 'approvedTerm', 'approvedRate', 'repaymentMethod', 'repaymentSummary', 'repayments'] }
}

export const phaseConfig = [
  {
    code: 1000,
    name: '预审阶段',
    nodes: [1100, 1110, 1120, 1130, 1140, 1200, 1250],
    actions: [
      { name: 'submit', label: '提交进件', type: 'primary', visible: (row: Record<string, unknown>) => ['DRAFT', 'PENDING_SUPPLEMENT'].includes(String(row.status)) },
      { name: 'risk-pre-pass', label: '风控预审通过', type: 'success', visible: (row: Record<string, unknown>) => ['SUBMITTED', 'PENDING_RISK_PRE'].includes(String(row.status)) },
      { name: 'risk-pre-reject', label: '风控预审拒绝', type: 'danger', visible: (row: Record<string, unknown>) => ['SUBMITTED', 'PENDING_RISK_PRE'].includes(String(row.status)) },
      { name: 'funder-pre-pass', label: '资方预审通过', type: 'success', visible: (row: Record<string, unknown>) => String(row.status) === 'PENDING_FUNDER_PRE' },
      { name: 'funder-pre-reject', label: '资方预审拒绝', type: 'danger', visible: (row: Record<string, unknown>) => String(row.status) === 'PENDING_FUNDER_PRE' }
    ]
  },
  {
    code: 1300,
    name: '补件阶段',
    nodes: [1300, 1310, 1320, 1330, 1340, 1350],
    actions: [
      { name: 'complete-supplement', label: '资料补充完成', type: 'primary', visible: (row: Record<string, unknown>) => ['PENDING_SUPPLEMENT', 'FUNDER_PRE_PASSED'].includes(String(row.status)) }
    ]
  },
  {
    code: 1400,
    name: '风控审批',
    nodes: [1400, 1450],
    actions: [
      { name: 'approve', label: '初审/终审通过', type: 'success', visible: (row: Record<string, unknown>) => ['PENDING_FIRST_REVIEW', 'PENDING_FINAL_REVIEW'].includes(String(row.status)) },
      { name: 'reject', label: '审批驳回', type: 'danger', visible: (row: Record<string, unknown>) => ['PENDING_FIRST_REVIEW', 'PENDING_FINAL_REVIEW', 'PENDING_FUNDER_REVIEW'].includes(String(row.status)) },
      { name: 'supplement', label: '要求补件', type: 'warning', visible: (row: Record<string, unknown>) => ['PENDING_FIRST_REVIEW', 'PENDING_FINAL_REVIEW', 'PENDING_FUNDER_REVIEW'].includes(String(row.status)) },
      { name: 'submit-funder-review', label: '提交资方审批', type: 'primary', visible: (row: Record<string, unknown>) => String(row.status) === 'FINAL_REVIEW_PASSED' }
    ]
  },
  {
    code: 1500,
    name: '资方终审',
    nodes: [1500],
    actions: [
      { name: 'funder-pass', label: '资方通过', type: 'success', visible: (row: Record<string, unknown>) => String(row.status) === 'PENDING_FUNDER_REVIEW' },
      { name: 'funder-reject', label: '资方拒绝', type: 'danger', visible: (row: Record<string, unknown>) => String(row.status) === 'PENDING_FUNDER_REVIEW' },
      { name: 'start-signing', label: '发起签约', type: 'primary', visible: (row: Record<string, unknown>) => ['FINAL_REVIEW_PASSED', 'FUNDER_REVIEW_PASSED'].includes(String(row.status)) }
    ]
  },
  {
    code: 1600,
    name: '签约阶段',
    nodes: [1600, 1610, 1620, 1630, 1640, 1650, 1660],
    actions: [
      { name: 'complete-signing', label: '签约完成', type: 'success', visible: (row: Record<string, unknown>) => ['PENDING_SIGN', 'SIGNING_PROGRESS'].includes(String(row.status)) }
    ]
  },
  {
    code: 1700,
    name: '请款放款',
    nodes: [1700, 1800],
    actions: [
      { name: 'submit-loan-request', label: '提交请款资料', type: 'primary', visible: (row: Record<string, unknown>) => ['SIGNED', 'PENDING_LOAN_REQUEST', 'LOAN_REQUEST_REJECTED'].includes(String(row.status)) },
      { name: 'approve-loan-request', label: '请款审核通过', type: 'success', visible: (row: Record<string, unknown>) => String(row.status) === 'LOAN_REQUEST_REVIEWING' },
      { name: 'reject-loan-request', label: '请款审核拒绝', type: 'danger', visible: (row: Record<string, unknown>) => String(row.status) === 'LOAN_REQUEST_REVIEWING' },
      { name: 'gps-installed', label: 'GPS安装完成', type: 'success', visible: (row: Record<string, unknown>) => String(row.status) === 'PENDING_DISBURSEMENT' },
      { name: 'mortgage-done', label: '抵押完成', type: 'success', visible: (row: Record<string, unknown>) => String(row.status) === 'PENDING_DISBURSEMENT' },
      { name: 'request-disbursement', label: '提交资方放款', type: 'primary', visible: (row: Record<string, unknown>) => ['LOAN_REQUEST_APPROVED', 'PENDING_DISBURSEMENT'].includes(String(row.status)) },
      { name: 'confirm-disbursement', label: '放款确认', type: 'success', visible: (row: Record<string, unknown>) => String(row.status) === 'PENDING_DISBURSEMENT' }
    ]
  },
  {
    code: 1900,
    name: '贷后阶段',
    nodes: [1900],
    actions: [
      { name: 'settle', label: '结清归档', type: 'success', visible: (row: Record<string, unknown>) => String(row.status) === 'DISBURSED' },
      { name: 'register-repayment', label: '登记还款', type: 'primary', visible: (row: Record<string, unknown>) => String(row.status) === 'DISBURSED' },
      { name: 'early-repayment', label: '提前还款', type: 'warning', visible: (row: Record<string, unknown>) => String(row.status) === 'DISBURSED' }
    ]
  }
] satisfies Array<{ code: number; name: string; nodes: number[]; actions: ActionConfig[] }>

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
  approvedAmount: '审批金额', approvedTerm: '审批期限', approvedRate: '审批利率',
  // 复杂字段标签
  sign: '签约记录', disbursement: '放款信息',
  repaymentSummary: '还款摘要', repayments: '还款计划',
  approvals: '审批记录'
}

function getFileType(fileName: string): 'image' | 'pdf' | 'video' | 'audio' | 'other' {
  const ext = (fileName || '').split('.').pop()?.toLowerCase() || ''
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) return 'image'
  if (ext === 'pdf') return 'pdf'
  if (['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv'].includes(ext)) return 'video'
  if (['mp3', 'wav', 'ogg', 'aac', 'flac'].includes(ext)) return 'audio'
  return 'other'
}

export function extractNodeFields(row: Record<string, unknown>, nodeCode: number): PhaseFieldValue[] {
  const def = nodeFieldDefs[nodeCode]
  if (!def) return []
  const sourceData = def.source ? ((row[def.source] as Record<string, unknown>) || {}) : row

  if (nodeCode === 1340 || nodeCode === 1130) {
    const files = (row.files || []) as FileItem[]
    if (!files.length) return []
    return [{
      prop: '_files',
      label: '文件资料',
      value: files.map((f: FileItem) => ({
        ...f,
        displayType: getFileType(f.fileName || f.fileUrl || '')
      }))
    }]
  }

  return def.fields
    .filter((f) => sourceData[f] !== undefined && sourceData[f] !== null && sourceData[f] !== '')
    .map((f) => {
      const value = sourceData[f]
      // 处理复杂字段（数组/对象）
      if (Array.isArray(value)) {
        const repayStatusMap: Record<string, string> = {
          'NOT_DUE': '未到期', 'PAID': '已还清', 'OVERDUE': '已逾期',
          'PARTIAL': '部分还款', 'PENDING': '待还款'
        }
        
        if (f === 'repayments' && value.length > 0) {
          const firstItem = value[0] as Record<string, unknown>
          if (firstItem.period !== undefined) {
            // 还款计划：返回表格类型
            return {
              prop: f,
              label: '还款计划',
              value: value,
              type: 'repayment-table'
            }
          }
        }
        
        // 其他数组：提取关键信息拼接
        const display = value
          .map((item: Record<string, unknown>) => {
            const name = item.approverName || item.name || item.nickName
            if (name) return String(name)
            const status = item.status ? repayStatusMap[String(item.status)] || String(item.status) : ''
            return status
          })
          .filter(Boolean)
          .slice(0, 5)
          .join('、')
        const suffix = value.length > 5 ? `等${value.length}项` : ''
        return { prop: f, label: fieldLabelMap[f] || f, value: (display || `${value.length}项`) + suffix }
      }
      if (value && typeof value === 'object') {
        // 对象类型：根据字段名格式化显示
        const obj = value as Record<string, unknown>
        let display = ''
        
        if (f === 'sign') {
          // 签约记录：显示状态 + 签约时间
          const statusMap: Record<string, string> = {
            'PENDING': '待签约', 'SIGNING_PROGRESS': '签约中',
            'SIGNED': '已签约', 'EXPIRED': '已过期', 'CANCELLED': '已取消'
          }
          const statusText = statusMap[String(obj.status)] || obj.status || ''
          const signedAt = obj.signedAt ? new Date(obj.signedAt as string).toLocaleDateString() : ''
          display = [statusText, signedAt].filter(Boolean).join(' - ') || '暂无数据'
        } else if (f === 'disbursement') {
          // 放款信息：显示状态 + 金额
          const statusMap: Record<string, string> = {
            'PENDING_APPLICATION': '待请款', 'REVIEWING': '审核中',
            'APPROVED': '已批准', 'PENDING_DISBURSEMENT': '待放款',
            'DISBURSED': '已放款', 'REJECTED': '已拒绝'
          }
          const statusText = statusMap[String(obj.status)] || obj.status || ''
          const amount = obj.disburseAmount ? `${obj.disburseAmount}元` : ''
          display = [statusText, amount].filter(Boolean).join(' - ') || '暂无数据'
        } else if (f === 'repaymentSummary') {
          // 还款摘要：格式化显示
          const total = obj.totalPeriods ?? 0
          const paid = obj.paidPeriods ?? 0
          const overdue = obj.overduePeriods ?? 0
          const unpaid = Number(obj.unpaidAmount ?? 0).toFixed(2)
          display = `总${total}期 / 已还${paid}期 / 逾期${overdue}期 / 待还${unpaid}元`
        } else {
          // 其他对象：提取关键字段
          display = String(obj.currentNodeName || obj.name || obj.status || 
            obj.contractUrl || obj.disburseAmount || '')
        }
        
        return { 
          prop: f, 
          label: fieldLabelMap[f] || f, 
          value: display || JSON.stringify(value).slice(0, 100)
        }
      }
      // 还款方式：数字转文字
      if (f === 'repaymentMethod') {
        const methodMap: Record<string, string> = { '1': '等额本息', '2': '等额本金', '3': '先息后本', '4': '到期一次性还本付息' }
        const methodLabel = methodMap[String(value)] || String(value)
        return { prop: f, label: fieldLabelMap[f] || f, value: methodLabel }
      }
      // 状态：数字转文字
      if (f === 'status') {
        const statusMap: Record<string, string> = {
          'DRAFT': '草稿', 'SUBMITTED': '已提交', 'PENDING_RISK_PRE': '待风控预审',
          'RISK_PRE_PASSED': '风控预审通过', 'RISK_PRE_REJECTED': '风控预审拒绝',
          'PENDING_FUNDER_PRE': '待资方预审', 'PENDING_FIRST_REVIEW': '待初审',
          'PENDING_FINAL_REVIEW': '待终审', 'PENDING_FUNDER_REVIEW': '待资方终审',
          'PENDING_SIGN': '待签约', 'SIGNED': '已签约',
          'PENDING_LOAN_REQUEST': '待请款', 'LOAN_REQUEST_REVIEWING': '请款审核中',
          'PENDING_DISBURSEMENT': '待放款', 'DISBURSED': '已放款',
          'SETTLED': '已结清', 'CANCELLED': '已取消'
        }
        return { prop: f, label: fieldLabelMap[f] || f, value: statusMap[String(value)] || String(value) }
      }
      return { prop: f, label: fieldLabelMap[f] || f, value }
    })
}

export function buildPhaseTabs(currentRow: Record<string, unknown> | null): PhaseTab[] {
  return phaseConfig.map((phase) => ({
    code: phase.code,
    name: phase.name,
    actions: phase.actions || [],
    groups: phase.nodes
      .map((nodeCode) => {
        const fields = currentRow ? extractNodeFields(currentRow, nodeCode) : []
        return {
          nodeCode,
          nodeName: nodeFieldDefs[nodeCode]?.label || `节点${nodeCode}`,
          fields
        }
      })
      .filter((group) => group.fields.length > 0)
  }))
}

export function resolveRowPhaseCode(
  row: Record<string, unknown>,
  fallbackPhaseCode: number
): number {
  const rowPhase = Number(row.phaseCode || row.nodeCode || 0)
  if (rowPhase && phaseConfig.some((p) => p.code === rowPhase || p.nodes.some((n) => n === rowPhase))) {
    return rowPhase
  }
  const nodeMap: Record<number, number> = {
    1100: 1000, 1110: 1000, 1120: 1000, 1130: 1000, 1140: 1000, 1200: 1000, 1250: 1000,
    1300: 1300, 1310: 1300, 1320: 1300, 1330: 1300, 1340: 1300, 1350: 1300,
    1400: 1400, 1450: 1400,
    1500: 1500,
    1600: 1600, 1610: 1600, 1620: 1600, 1630: 1600, 1640: 1600, 1650: 1600, 1660: 1600,
    1700: 1700, 1800: 1700,
    1900: 1900
  }
  return nodeMap[Number(row.currentNode || 0)] || fallbackPhaseCode
}
