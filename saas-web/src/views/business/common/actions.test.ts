import { describe, it, expect } from 'vitest'
import { leadActions, applicationActions, approvalFields } from './actions'

// ==================== approvalFields ====================
describe('approvalFields', () => {
  it('has 5 standard approval fields', () => {
    expect(approvalFields).toHaveLength(5)
    expect(approvalFields.map((f) => f.prop)).toEqual([
      'approverId',
      'opinion',
      'amount',
      'term',
      'rate'
    ])
  })

  it('approverId is required', () => {
    const field = approvalFields.find((f) => f.prop === 'approverId')
    expect(field?.required).toBe(true)
  })
})

// ==================== leadActions ====================
describe('leadActions', () => {
  it('has 2 actions', () => {
    expect(leadActions).toHaveLength(2)
    expect(leadActions[0].name).toBe('assign')
    expect(leadActions[1].name).toBe('follow-up')
  })

  describe('assign action visibility', () => {
    const assign = leadActions.find((a) => a.name === 'assign')!

    it('visible for PENDING_ASSIGN', () => {
      expect(assign.visible!({ status: 'PENDING_ASSIGN' })).toBe(true)
    })

    it('visible for PUBLIC_POOL', () => {
      expect(assign.visible!({ status: 'PUBLIC_POOL' })).toBe(true)
    })

    it('visible for DORMANT', () => {
      expect(assign.visible!({ status: 'DORMANT' })).toBe(true)
    })

    it('hidden for FOLLOWING', () => {
      expect(assign.visible!({ status: 'FOLLOWING' })).toBe(false)
    })

    it('hidden for CONVERTED', () => {
      expect(assign.visible!({ status: 'CONVERTED' })).toBe(false)
    })
  })

  describe('follow-up action visibility', () => {
    const followUp = leadActions.find((a) => a.name === 'follow-up')!

    it('visible for PENDING_FOLLOW', () => {
      expect(followUp.visible!({ status: 'PENDING_FOLLOW' })).toBe(true)
    })

    it('visible for FOLLOWING', () => {
      expect(followUp.visible!({ status: 'FOLLOWING' })).toBe(true)
    })

    it('hidden for PENDING_ASSIGN', () => {
      expect(followUp.visible!({ status: 'PENDING_ASSIGN' })).toBe(false)
    })

    it('hidden for CONVERTED', () => {
      expect(followUp.visible!({ status: 'CONVERTED' })).toBe(false)
    })
  })
})

// ==================== applicationActions ====================
describe('applicationActions', () => {
  it('has all expected action names', () => {
    const names = applicationActions.map((a) => a.name)
    expect(names).toContain('process')
    expect(names).toContain('submit')
    expect(names).toContain('risk-pre-pass')
    expect(names).toContain('risk-pre-reject')
    expect(names).toContain('funder-pre-pass')
    expect(names).toContain('funder-pre-reject')
    expect(names).toContain('complete-supplement')
    expect(names).toContain('approve')
    expect(names).toContain('reject')
    expect(names).toContain('supplement')
    expect(names).toContain('submit-funder-review')
    expect(names).toContain('funder-pass')
    expect(names).toContain('funder-reject')
    expect(names).toContain('start-signing')
    expect(names).toContain('complete-signing')
    expect(names).toContain('submit-loan-request')
    expect(names).toContain('approve-loan-request')
    expect(names).toContain('reject-loan-request')
    expect(names).toContain('gps-installed')
    expect(names).toContain('mortgage-done')
    expect(names).toContain('request-disbursement')
    expect(names).toContain('confirm-disbursement')
    expect(names).toContain('settle')
  })

  describe('submit action', () => {
    const submit = applicationActions.find((a) => a.name === 'submit')!

    it('visible for DRAFT', () => {
      expect(submit.visible!({ status: 'DRAFT' })).toBe(true)
    })

    it('visible for PENDING_SUPPLEMENT', () => {
      expect(submit.visible!({ status: 'PENDING_SUPPLEMENT' })).toBe(true)
    })

    it('hidden for DISBURSED', () => {
      expect(submit.visible!({ status: 'DISBURSED' })).toBe(false)
    })
  })

  describe('risk-pre-pass action', () => {
    const action = applicationActions.find((a) => a.name === 'risk-pre-pass')!

    it('visible for SUBMITTED', () => {
      expect(action.visible!({ status: 'SUBMITTED' })).toBe(true)
    })

    it('visible for PENDING_RISK_PRE', () => {
      expect(action.visible!({ status: 'PENDING_RISK_PRE' })).toBe(true)
    })

    it('hidden for DRAFT', () => {
      expect(action.visible!({ status: 'DRAFT' })).toBe(false)
    })
  })

  describe('risk-pre-reject action', () => {
    const action = applicationActions.find((a) => a.name === 'risk-pre-reject')!

    it('visible for SUBMITTED and PENDING_RISK_PRE', () => {
      expect(action.visible!({ status: 'SUBMITTED' })).toBe(true)
      expect(action.visible!({ status: 'PENDING_RISK_PRE' })).toBe(true)
    })

    it('hidden for other statuses', () => {
      expect(action.visible!({ status: 'RISK_PRE_PASSED' })).toBe(false)
    })

    it('has danger type', () => {
      expect(action.type).toBe('danger')
    })
  })

  describe('funder-pre-pass action', () => {
    const action = applicationActions.find((a) => a.name === 'funder-pre-pass')!

    it('visible only for PENDING_FUNDER_PRE', () => {
      expect(action.visible!({ status: 'PENDING_FUNDER_PRE' })).toBe(true)
      expect(action.visible!({ status: 'SUBMITTED' })).toBe(false)
    })

    it('has approval fields plus funderApprovalNo', () => {
      expect(action.fields).toBeDefined()
      const props = action.fields!.map((f) => f.prop)
      expect(props).toContain('approverId')
      expect(props).toContain('funderApprovalNo')
    })
  })

  describe('complete-supplement action', () => {
    const action = applicationActions.find((a) => a.name === 'complete-supplement')!

    it('visible for PENDING_SUPPLEMENT', () => {
      expect(action.visible!({ status: 'PENDING_SUPPLEMENT' })).toBe(true)
    })

    it('visible for FUNDER_PRE_PASSED', () => {
      expect(action.visible!({ status: 'FUNDER_PRE_PASSED' })).toBe(true)
    })

    it('hidden for SUBMITTED', () => {
      expect(action.visible!({ status: 'SUBMITTED' })).toBe(false)
    })
  })

  describe('approve action', () => {
    const action = applicationActions.find((a) => a.name === 'approve')!

    it('visible for PENDING_FIRST_REVIEW and PENDING_FINAL_REVIEW', () => {
      expect(action.visible!({ status: 'PENDING_FIRST_REVIEW' })).toBe(true)
      expect(action.visible!({ status: 'PENDING_FINAL_REVIEW' })).toBe(true)
    })

    it('hidden for PENDING_FUNDER_REVIEW', () => {
      expect(action.visible!({ status: 'PENDING_FUNDER_REVIEW' })).toBe(false)
    })

    it('defaults use row values', () => {
      const row = { amount: 100000, term: 24, rate: 0.05 }
      expect(action.defaults!(row)).toEqual({ amount: 100000, term: 24, rate: 0.05 })
    })
  })

  describe('submit-funder-review action', () => {
    const action = applicationActions.find((a) => a.name === 'submit-funder-review')!

    it('visible only for FINAL_REVIEW_PASSED', () => {
      expect(action.visible!({ status: 'FINAL_REVIEW_PASSED' })).toBe(true)
      expect(action.visible!({ status: 'PENDING_FINAL_REVIEW' })).toBe(false)
    })
  })

  describe('funder-pass action', () => {
    const action = applicationActions.find((a) => a.name === 'funder-pass')!

    it('visible only for PENDING_FUNDER_REVIEW', () => {
      expect(action.visible!({ status: 'PENDING_FUNDER_REVIEW' })).toBe(true)
      expect(action.visible!({ status: 'FINAL_REVIEW_PASSED' })).toBe(false)
    })

    it('defaults use approvedAmount/term/rate with fallback', () => {
      const row = {
        approvedAmount: 80000,
        amount: 100000,
        approvedTerm: 12,
        term: 24,
        approvedRate: 0.04,
        rate: 0.05
      }
      expect(action.defaults!(row)).toEqual({ amount: 80000, term: 12, rate: 0.04 })
    })

    it('defaults fallback to original when approved is missing', () => {
      const row = { amount: 100000, term: 24, rate: 0.05 }
      expect(action.defaults!(row)).toEqual({ amount: 100000, term: 24, rate: 0.05 })
    })
  })

  describe('start-signing action', () => {
    const action = applicationActions.find((a) => a.name === 'start-signing')!

    it('visible for FINAL_REVIEW_PASSED and FUNDER_REVIEW_PASSED', () => {
      expect(action.visible!({ status: 'FINAL_REVIEW_PASSED' })).toBe(true)
      expect(action.visible!({ status: 'FUNDER_REVIEW_PASSED' })).toBe(true)
    })

    it('hidden for other statuses', () => {
      expect(action.visible!({ status: 'SIGNED' })).toBe(false)
    })
  })

  describe('complete-signing action', () => {
    const action = applicationActions.find((a) => a.name === 'complete-signing')!

    it('visible for PENDING_SIGN and SIGNING_PROGRESS', () => {
      expect(action.visible!({ status: 'PENDING_SIGN' })).toBe(true)
      expect(action.visible!({ status: 'SIGNING_PROGRESS' })).toBe(true)
    })
  })

  describe('submit-loan-request action', () => {
    const action = applicationActions.find((a) => a.name === 'submit-loan-request')!

    it('visible for SIGNED, PENDING_LOAN_REQUEST, LOAN_REQUEST_REJECTED', () => {
      expect(action.visible!({ status: 'SIGNED' })).toBe(true)
      expect(action.visible!({ status: 'PENDING_LOAN_REQUEST' })).toBe(true)
      expect(action.visible!({ status: 'LOAN_REQUEST_REJECTED' })).toBe(true)
    })
  })

  describe('gps-installed action', () => {
    const action = applicationActions.find((a) => a.name === 'gps-installed')!

    it('visible only for PENDING_DISBURSEMENT', () => {
      expect(action.visible!({ status: 'PENDING_DISBURSEMENT' })).toBe(true)
      expect(action.visible!({ status: 'LOAN_REQUEST_APPROVED' })).toBe(false)
    })
  })

  describe('confirm-disbursement action', () => {
    const action = applicationActions.find((a) => a.name === 'confirm-disbursement')!

    it('visible only for PENDING_DISBURSEMENT', () => {
      expect(action.visible!({ status: 'PENDING_DISBURSEMENT' })).toBe(true)
    })

    it('defaults use approvedAmount', () => {
      const row = { approvedAmount: 80000, amount: 100000 }
      expect(action.defaults!(row)).toEqual({ disburseAmount: 80000 })
    })

    it('defaults fallback to amount', () => {
      const row = { amount: 100000 }
      expect(action.defaults!(row)).toEqual({ disburseAmount: 100000 })
    })
  })

  describe('settle action', () => {
    const action = applicationActions.find((a) => a.name === 'settle')!

    it('visible only for DISBURSED', () => {
      expect(action.visible!({ status: 'DISBURSED' })).toBe(true)
      expect(action.visible!({ status: 'SIGNED' })).toBe(false)
    })

    it('has success type', () => {
      expect(action.type).toBe('success')
    })
  })

  describe('process action', () => {
    const process = applicationActions.find((a) => a.name === 'process')!

    it('generates correct path for different statuses', () => {
      const pathFn = process.path!
      expect(pathFn({ id: 1, status: 'PENDING_SUPPLEMENT' })).toBe(
        '/application/1/complete-supplement'
      )
      expect(pathFn({ id: 2, status: 'SUBMITTED' })).toBe('/application/2/risk-pre-pass')
      expect(pathFn({ id: 3, status: 'PENDING_RISK_PRE' })).toBe('/application/3/risk-pre-pass')
      expect(pathFn({ id: 4, status: 'PENDING_FUNDER_PRE' })).toBe('/application/4/funder-pre-pass')
      expect(pathFn({ id: 5, status: 'DRAFT' })).toBe('/application/5/submit')
    })

    it('hidden for DISBURSED', () => {
      expect(process.visible!({ status: 'DISBURSED' })).toBe(false)
    })

    it('hidden for CANCELLED', () => {
      expect(process.visible!({ status: 'CANCELLED' })).toBe(false)
    })

    it('hidden for rejected statuses', () => {
      expect(process.visible!({ status: 'RISK_PRE_REJECTED' })).toBe(false)
      expect(process.visible!({ status: 'FIRST_REVIEW_REJECTED' })).toBe(false)
    })

    it('hidden for dedicated statuses', () => {
      expect(process.visible!({ status: 'SIGNED' })).toBe(false)
      expect(process.visible!({ status: 'PENDING_SIGN' })).toBe(false)
      expect(process.visible!({ status: 'DISBURSED' })).toBe(false)
    })
  })

  describe('reject action', () => {
    const action = applicationActions.find((a) => a.name === 'reject')!

    it('visible for multiple review statuses', () => {
      expect(action.visible!({ status: 'SUBMITTED' })).toBe(true)
      expect(action.visible!({ status: 'PENDING_RISK_PRE' })).toBe(true)
      expect(action.visible!({ status: 'PENDING_FUNDER_PRE' })).toBe(true)
      expect(action.visible!({ status: 'PENDING_FIRST_REVIEW' })).toBe(true)
      expect(action.visible!({ status: 'PENDING_FINAL_REVIEW' })).toBe(true)
      expect(action.visible!({ status: 'PENDING_FUNDER_REVIEW' })).toBe(true)
    })

    it('hidden for non-review statuses', () => {
      expect(action.visible!({ status: 'SIGNED' })).toBe(false)
      expect(action.visible!({ status: 'DISBURSED' })).toBe(false)
    })
  })
})
