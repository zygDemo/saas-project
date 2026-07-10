import { describe, it, expect } from 'vitest'
import {
  toOption,
  commonStatusMap,
  orgStatusOptions,
  activeStatusOptions,
  orgPackageOptions,
  yesNoOptions,
  leadStatusOptions,
  leadSourceOptions,
  genderOptions,
  signingStatusOptions,
  disbursementStatusOptions,
  repaymentStatusOptions,
  approvalActionOptions,
  productTypeOptions,
  repaymentMethodOptions,
  funderTypeOptions,
  flowBusinessTypeOptions,
  flowNodeOptions,
  applicationStatusOptions,
  applicationNodeByPath,
  applicationPhaseByPath,
  phaseTitleMap,
  phaseNodeTabsMap
} from './constants'

// ==================== toOption ====================
describe('toOption', () => {
  it('returns label from commonStatusMap for known values', () => {
    expect(toOption('ACTIVE')).toEqual({ label: '启用', value: 'ACTIVE' })
    expect(toOption('INACTIVE')).toEqual({ label: '停用', value: 'INACTIVE' })
  })

  it('returns raw value as label for unknown values', () => {
    expect(toOption('UNKNOWN_VAL')).toEqual({ label: 'UNKNOWN_VAL', value: 'UNKNOWN_VAL' })
  })
})

// ==================== commonStatusMap ====================
describe('commonStatusMap', () => {
  it('contains key car loan workflow statuses', () => {
    expect(commonStatusMap.DRAFT).toBe('草稿')
    expect(commonStatusMap.SUBMITTED).toBe('已提交')
    expect(commonStatusMap.RISK_PRE_PASSED).toBe('风控预审通过')
    expect(commonStatusMap.DISBURSED).toBe('已放款')
    expect(commonStatusMap.CANCELLED).toBe('已取消')
    expect(commonStatusMap.SIGNED).toBe('已签约')
  })

  it('contains repayment statuses', () => {
    expect(commonStatusMap.PAID).toBe('已还款')
    expect(commonStatusMap.OVERDUE).toBe('逾期')
    expect(commonStatusMap.SETTLED).toBe('已结清')
  })

  it('contains gender mappings', () => {
    expect(commonStatusMap.MALE).toBe('男')
    expect(commonStatusMap.FEMALE).toBe('女')
  })
})

// ==================== Option arrays ====================
describe('option arrays', () => {
  it('orgStatusOptions has 3 items', () => {
    expect(orgStatusOptions).toHaveLength(3)
    expect(orgStatusOptions.map((o) => o.value)).toEqual(['ACTIVE', 'INACTIVE', 'SUSPENDED'])
  })

  it('activeStatusOptions has 2 items', () => {
    expect(activeStatusOptions).toHaveLength(2)
  })

  it('yesNoOptions has boolean values', () => {
    expect(yesNoOptions).toEqual([
      { label: '是', value: true },
      { label: '否', value: false }
    ])
  })

  it('orgPackageOptions has 4 tiers', () => {
    expect(orgPackageOptions).toHaveLength(4)
    expect(orgPackageOptions.map((o) => o.value)).toEqual([
      'STANDARD',
      'PRO',
      'ENTERPRISE',
      'TRIAL'
    ])
  })

  it('productTypeOptions includes CAR_LOAN', () => {
    const carLoan = productTypeOptions.find((o) => o.value === 'CAR_LOAN')
    expect(carLoan).toBeDefined()
    expect(carLoan!.label).toBe('车贷')
  })

  it('repaymentMethodOptions has 4 methods', () => {
    expect(repaymentMethodOptions).toHaveLength(4)
    expect(repaymentMethodOptions[0].label).toBe('等额本息')
  })

  it('funderTypeOptions has 4 types', () => {
    expect(funderTypeOptions).toHaveLength(4)
    expect(funderTypeOptions.map((o) => o.value)).toEqual([
      'BANK',
      'CONSUMER_FINANCE',
      'LEASING',
      'MICRO_LOAN'
    ])
  })

  it('flowBusinessTypeOptions has 3 types', () => {
    expect(flowBusinessTypeOptions).toHaveLength(3)
  })

  it('leadStatusOptions covers full lead lifecycle', () => {
    expect(leadStatusOptions).toHaveLength(7)
    expect(leadStatusOptions.map((o) => o.value)).toContain('PENDING_ASSIGN')
    expect(leadStatusOptions.map((o) => o.value)).toContain('PUBLIC_POOL')
  })

  it('leadSourceOptions has 4 sources', () => {
    expect(leadSourceOptions).toHaveLength(4)
  })

  it('genderOptions has 3 items', () => {
    expect(genderOptions).toHaveLength(3)
  })

  it('signingStatusOptions covers signing lifecycle', () => {
    expect(signingStatusOptions.map((o) => o.value)).toEqual([
      'PENDING',
      'SENT',
      'SIGNED',
      'CANCELLED',
      'EXPIRED'
    ])
  })

  it('disbursementStatusOptions covers disbursement lifecycle', () => {
    expect(disbursementStatusOptions).toHaveLength(6)
    expect(disbursementStatusOptions.map((o) => o.value)).toContain('DISBURSED')
  })

  it('repaymentStatusOptions covers repayment lifecycle', () => {
    expect(repaymentStatusOptions).toHaveLength(6)
    expect(repaymentStatusOptions.map((o) => o.value)).toContain('OVERDUE')
  })

  it('approvalActionOptions has 4 actions', () => {
    expect(approvalActionOptions.map((o) => o.value)).toEqual([
      'PASS',
      'REJECT',
      'SUPPLEMENT',
      'RETURN'
    ])
  })

  it('flowNodeOptions covers all car loan nodes', () => {
    expect(flowNodeOptions.length).toBeGreaterThan(20)
    expect(flowNodeOptions[0].value).toBe('1100')
    expect(flowNodeOptions[flowNodeOptions.length - 1].value).toBe('1900')
  })

  it('applicationStatusOptions covers full application lifecycle', () => {
    expect(applicationStatusOptions.length).toBeGreaterThan(20)
    const values = applicationStatusOptions.map((o) => o.value)
    expect(values).toContain('DRAFT')
    expect(values).toContain('DISBURSED')
    expect(values).toContain('CANCELLED')
  })
})

// ==================== Phase mapping ====================
describe('applicationNodeByPath', () => {
  it('maps path segments to node codes', () => {
    expect(applicationNodeByPath['pre-entry']).toBe(1100)
    expect(applicationNodeByPath['risk-pre']).toBe(1200)
    expect(applicationNodeByPath['disbursement-node']).toBe(1800)
  })
})

describe('applicationPhaseByPath', () => {
  it('maps path segments to phase codes', () => {
    expect(applicationPhaseByPath.precheck).toBe(1000)
    expect(applicationPhaseByPath.supplement).toBe(1300)
    expect(applicationPhaseByPath.approval).toBe(1400)
    expect(applicationPhaseByPath.signing).toBe(1600)
    expect(applicationPhaseByPath.disbursement).toBe(1700)
    expect(applicationPhaseByPath['post-loan']).toBe(1900)
  })
})

describe('phaseTitleMap', () => {
  it('has title for every phase code', () => {
    expect(phaseTitleMap[1000]).toBe('预审阶段')
    expect(phaseTitleMap[1300]).toBe('补件阶段')
    expect(phaseTitleMap[1400]).toBe('风控审批')
    expect(phaseTitleMap[1500]).toBe('资方终审')
    expect(phaseTitleMap[1600]).toBe('签约阶段')
    expect(phaseTitleMap[1700]).toBe('请款放款')
    expect(phaseTitleMap[1900]).toBe('贷后阶段')
  })
})

describe('phaseNodeTabsMap', () => {
  it('has node tabs for phase 1000 (pre-screening)', () => {
    const tabs = phaseNodeTabsMap[1000]
    expect(tabs).toBeDefined()
    expect(tabs.length).toBe(7)
    expect(tabs[0]).toEqual({ label: '身份证信息', value: 1100 })
  })

  it('has node tabs for phase 1600 (signing)', () => {
    const tabs = phaseNodeTabsMap[1600]
    expect(tabs).toBeDefined()
    expect(tabs.length).toBe(7)
    expect(tabs.map((t) => t.value)).toContain(1630) // 合同签署
  })

  it('has node tabs for phase 1900 (post-loan)', () => {
    const tabs = phaseNodeTabsMap[1900]
    expect(tabs).toBeDefined()
    expect(tabs).toHaveLength(1)
    expect(tabs[0].label).toBe('贷后还款')
  })
})
