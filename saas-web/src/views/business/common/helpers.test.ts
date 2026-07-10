import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  formatDate,
  packageLabel,
  orgCount,
  getOrgExpireState,
  orgExpiryMeta,
  statusTagType,
  formatCell,
  shouldShowFieldGroup,
  flattenRelations,
  resetModel,
  cleanPayload,
  validateRequired,
  toPercentDisplayValue,
  toPercentPayloadValue,
  fieldOptions,
  getRemoteOptionParams
} from './helpers'
import type { FieldConfig, PageConfig } from './types'

// ==================== formatDate ====================
describe('formatDate', () => {
  it('returns "-" for falsy values', () => {
    expect(formatDate(null)).toBe('-')
    expect(formatDate(undefined)).toBe('-')
    expect(formatDate('')).toBe('-')
    expect(formatDate(0)).toBe('-')
  })

  it('formats a valid date string', () => {
    expect(formatDate('2025-03-15T00:00:00Z')).toBe('2025-03-15')
  })

  it('formats a Date object', () => {
    expect(formatDate(new Date(2024, 0, 5))).toBe('2024-01-05')
  })

  it('returns raw string for invalid dates', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date')
  })

  it('pads single-digit months and days', () => {
    expect(formatDate('2025-01-02T00:00:00Z')).toBe('2025-01-02')
  })
})

// ==================== packageLabel ====================
describe('packageLabel', () => {
  it('returns "未配置套餐" for falsy values', () => {
    expect(packageLabel(null)).toBe('未配置套餐')
    expect(packageLabel(undefined)).toBe('未配置套餐')
    expect(packageLabel('')).toBe('未配置套餐')
  })

  it('returns correct label for known values', () => {
    expect(packageLabel('STANDARD')).toBe('标准版')
    expect(packageLabel('PRO')).toBe('专业版')
    expect(packageLabel('ENTERPRISE')).toBe('企业版')
    expect(packageLabel('TRIAL')).toBe('试用版')
  })

  it('returns the raw value for unknown package types', () => {
    expect(packageLabel('PREMIUM')).toBe('PREMIUM')
  })
})

// ==================== orgCount ====================
describe('orgCount', () => {
  it('returns numeric value when prop is a number', () => {
    expect(orgCount({ departments: 5 }, 'departments')).toBe(5)
  })

  it('returns 0 when value is not a number', () => {
    expect(orgCount({ departments: 'abc' }, 'departments')).toBe(0)
    expect(orgCount({}, 'departments')).toBe(0)
    expect(orgCount({ departments: null }, 'departments')).toBe(0)
  })
})

// ==================== getOrgExpireState ====================
describe('getOrgExpireState', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns "UNSET" for falsy values', () => {
    expect(getOrgExpireState(null)).toBe('UNSET')
    expect(getOrgExpireState(undefined)).toBe('UNSET')
    expect(getOrgExpireState('')).toBe('UNSET')
  })

  it('returns "UNSET" for invalid date strings', () => {
    expect(getOrgExpireState('invalid')).toBe('UNSET')
  })

  it('returns "EXPIRED" for past dates', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-06-15'))
    expect(getOrgExpireState('2025-06-14')).toBe('EXPIRED')
  })

  it('returns "EXPIRING" for dates within 30 days', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-06-15'))
    expect(getOrgExpireState('2025-07-10')).toBe('EXPIRING')
  })

  it('returns "VALID" for dates more than 30 days away', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-06-15'))
    expect(getOrgExpireState('2025-12-31')).toBe('VALID')
  })
})

// ==================== orgExpiryMeta ====================
describe('orgExpiryMeta', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns info type for UNSET', () => {
    const result = orgExpiryMeta(null)
    expect(result.label).toBe('未设置到期')
    expect(result.type).toBe('info')
  })

  it('returns danger type for EXPIRED', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-06-15'))
    const result = orgExpiryMeta('2025-01-01')
    expect(result.type).toBe('danger')
    expect(result.label).toContain('已过期')
  })

  it('returns warning type for EXPIRING', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-06-15'))
    const result = orgExpiryMeta('2025-07-10')
    expect(result.type).toBe('warning')
    expect(result.label).toContain('即将到期')
  })

  it('returns success type for VALID', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-06-15'))
    const result = orgExpiryMeta('2025-12-31')
    expect(result.type).toBe('success')
    expect(result.label).toContain('有效')
  })
})

// ==================== statusTagType ====================
describe('statusTagType', () => {
  it('returns "success" for active/disbursed statuses', () => {
    expect(statusTagType('ACTIVE')).toBe('success')
    expect(statusTagType('DISBURSED')).toBe('success')
    expect(statusTagType('PAID')).toBe('success')
    expect(statusTagType('SIGNED')).toBe('success')
    expect(statusTagType('RISK_PRE_PASSED')).toBe('success')
    expect(statusTagType('LOAN_REQUEST_APPROVED')).toBe('success')
  })

  it('returns "warning" for pending/processing statuses', () => {
    expect(statusTagType('DRAFT')).toBe('warning')
    expect(statusTagType('PENDING')).toBe('warning')
    expect(statusTagType('SUBMITTED')).toBe('warning')
    expect(statusTagType('PENDING_RISK_PRE')).toBe('warning')
    expect(statusTagType('PENDING_SUPPLEMENT')).toBe('warning')
    expect(statusTagType('SIGNING_PROGRESS')).toBe('warning')
    expect(statusTagType('PENDING_DISBURSEMENT')).toBe('warning')
  })

  it('returns "danger" for rejected/cancelled statuses', () => {
    expect(statusTagType('INACTIVE')).toBe('danger')
    expect(statusTagType('CANCELLED')).toBe('danger')
    expect(statusTagType('FAILED')).toBe('danger')
    expect(statusTagType('OVERDUE')).toBe('danger')
    expect(statusTagType('RISK_PRE_REJECTED')).toBe('danger')
    expect(statusTagType('FIRST_REVIEW_REJECTED')).toBe('danger')
  })

  it('returns "info" for unknown statuses', () => {
    expect(statusTagType('UNKNOWN_STATUS')).toBe('info')
  })
})

// ==================== formatCell ====================
describe('formatCell', () => {
  const emptyConfig: PageConfig = {
    title: 'Test',
    description: '',
    api: 'test',
    columns: [],
    formFields: [],
    actions: []
  }

  it('formats businessScale with counts', () => {
    const row = { departmentCount: 3, productCount: 5, funderCount: 2 }
    expect(formatCell(row, 'businessScale', emptyConfig)).toBe('部门3 / 产品5 / 资方2')
  })

  it('formats apiEnabled boolean', () => {
    expect(formatCell({ apiEnabled: false }, 'apiEnabled', emptyConfig)).toBe('已关闭')
    expect(formatCell({ apiEnabled: true }, 'apiEnabled', emptyConfig)).toBe('已开启')
  })

  it('formats boolean fields (requireMaterials, requireApproval, autoPass)', () => {
    expect(formatCell({ requireMaterials: true }, 'requireMaterials', emptyConfig)).toBe('是')
    expect(formatCell({ autoPass: false }, 'autoPass', emptyConfig)).toBe('否')
  })

  it('formats businessType', () => {
    expect(formatCell({ businessType: 'CAR_LOAN' }, 'businessType', emptyConfig)).toBe('车贷')
  })

  it('formats nodeCode', () => {
    expect(formatCell({ nodeCode: '1100' }, 'nodeCode', emptyConfig)).toBe('1100 身份证信息')
  })

  it('returns "-" for null/undefined/empty values', () => {
    expect(formatCell({}, 'name', emptyConfig)).toBe('-')
    expect(formatCell({ name: null }, 'name', emptyConfig)).toBe('-')
    expect(formatCell({ name: '' }, 'name', emptyConfig)).toBe('-')
  })

  it('uses statusMap for status/gender/action props', () => {
    const config: PageConfig = {
      ...emptyConfig,
      statusMap: { ACTIVE: '已启用' }
    }
    expect(formatCell({ status: 'ACTIVE' }, 'status', config)).toBe('已启用')
    expect(formatCell({ gender: 'MALE' }, 'gender', emptyConfig)).toBe('男')
  })

  it('formats arrays of objects with name property', () => {
    const row = { tags: [{ name: 'Tag1' }, { name: 'Tag2' }] }
    expect(formatCell(row, 'tags', emptyConfig)).toBe('Tag1, Tag2')
  })

  it('formats empty arrays', () => {
    expect(formatCell({ tags: [] }, 'tags', emptyConfig)).toBe('-')
  })

  it('formats generic arrays', () => {
    expect(formatCell({ items: [1, 2, 3] }, 'items', emptyConfig)).toBe('共3项')
  })

  it('formats objects with name property', () => {
    expect(formatCell({ creator: { name: 'Admin' } }, 'creator', emptyConfig)).toBe('Admin')
  })

  it('formats objects with userName property', () => {
    expect(formatCell({ user: { userName: 'admin01' } }, 'user', emptyConfig)).toBe('admin01')
  })

  it('stringifies unknown objects', () => {
    const row = { data: { foo: 'bar' } }
    expect(formatCell(row, 'data', emptyConfig)).toBe('{"foo":"bar"}')
  })
})

// ==================== shouldShowFieldGroup ====================
describe('shouldShowFieldGroup', () => {
  const fields: FieldConfig[] = [
    { prop: 'a', label: 'A', group: '基础' },
    { prop: 'b', label: 'B', group: '基础' },
    { prop: 'c', label: 'C', group: '联系' },
    { prop: 'd', label: 'D' }
  ]

  it('shows group header for the first field in a group', () => {
    expect(shouldShowFieldGroup(fields, fields[0], 0)).toBe(true)
  })

  it('hides group header when previous field has same group', () => {
    expect(shouldShowFieldGroup(fields, fields[1], 1)).toBe(false)
  })

  it('shows group header when group changes', () => {
    expect(shouldShowFieldGroup(fields, fields[2], 2)).toBe(true)
  })

  it('returns false when field has no group', () => {
    expect(shouldShowFieldGroup(fields, fields[3], 3)).toBe(false)
  })
})

// ==================== flattenRelations ====================
describe('flattenRelations', () => {
  it('flattens customer relation to customerName', () => {
    const row = { customer: { name: '张三' } }
    const result = flattenRelations(row)
    expect(result.customerName).toBe('张三')
  })

  it('flattens product relation to productName', () => {
    const row = { product: { name: '车贷A' } }
    const result = flattenRelations(row)
    expect(result.productName).toBe('车贷A')
  })

  it('flattens funder relation to funderName', () => {
    const row = { funder: { name: '银行A' } }
    const result = flattenRelations(row)
    expect(result.funderName).toBe('银行A')
  })

  it('prefers name over userName over realName', () => {
    const row = { assignee: { name: 'A', userName: 'B', realName: 'C' } }
    const result = flattenRelations(row)
    expect(result.assigneeName).toBe('A')
  })

  it('falls back to userName when name is missing', () => {
    const row = { assignee: { userName: 'user1' } }
    const result = flattenRelations(row)
    expect(result.assigneeName).toBe('user1')
  })

  it('falls back to realName', () => {
    const row = { creator: { realName: '李四' } }
    const result = flattenRelations(row)
    expect(result.creatorName).toBe('李四')
  })

  it('does not overwrite existing properties if relation has no name', () => {
    const row = { customer: { id: 1 } }
    const result = flattenRelations(row)
    expect(result.customerName).toBeUndefined()
  })

  it('flattens _count object', () => {
    const row = {
      _count: { departments: 3, products: 5, funders: 2, customers: 10, applications: 7 }
    }
    const result = flattenRelations(row)
    expect(result.departmentCount).toBe(3)
    expect(result.productCount).toBe(5)
    expect(result.funderCount).toBe(2)
    expect(result.customerCount).toBe(10)
    expect(result.applicationCount).toBe(7)
  })

  it('handles missing _count gracefully', () => {
    const row = { id: 1 }
    const result = flattenRelations(row)
    expect(result.id).toBe(1)
    expect(result.departmentCount).toBeUndefined()
  })
})

// ==================== resetModel ====================
describe('resetModel', () => {
  it('clears existing keys and sets default values', () => {
    const target: Record<string, unknown> = { oldKey: 'old' }
    const fields: FieldConfig[] = [
      { prop: 'name', label: '名称', defaultValue: '默认' },
      { prop: 'status', label: '状态', defaultValue: 'ACTIVE' }
    ]
    resetModel(target, fields)
    expect(target).toEqual({ name: '默认', status: 'ACTIVE' })
    expect(target.oldKey).toBeUndefined()
  })

  it('uses source values when provided', () => {
    const target: Record<string, unknown> = {}
    const fields: FieldConfig[] = [{ prop: 'name', label: '名称', defaultValue: '默认' }]
    const source = { name: '来自服务器' }
    resetModel(target, fields, source)
    expect(target.name).toBe('来自服务器')
  })

  it('handles json type fields with stringification', () => {
    const target: Record<string, unknown> = {}
    const fields: FieldConfig[] = [
      { prop: 'config', label: '配置', type: 'json', defaultValue: { a: 1 } }
    ]
    resetModel(target, fields)
    expect(target.config).toBe('{\n  "a": 1\n}')
  })

  it('handles percent transform', () => {
    const target: Record<string, unknown> = {}
    const fields: FieldConfig[] = [{ prop: 'rate', label: '利率', transform: 'percent' }]
    const source = { rate: 0.05 }
    resetModel(target, fields, source)
    expect(target.rate).toBe(5)
  })
})

// ==================== cleanPayload ====================
describe('cleanPayload', () => {
  it('removes undefined, null, and empty string values', () => {
    const source = { name: 'test', desc: '', age: null, extra: undefined }
    const fields: FieldConfig[] = [
      { prop: 'name', label: '名称' },
      { prop: 'desc', label: '描述' },
      { prop: 'age', label: '年龄' },
      { prop: 'extra', label: '额外' }
    ]
    const result = cleanPayload(source, fields)
    expect(result).toEqual({ name: 'test' })
  })

  it('parses json type fields', () => {
    const source = { config: '{"key":"value"}' }
    const fields: FieldConfig[] = [{ prop: 'config', label: '配置', type: 'json' }]
    const result = cleanPayload(source, fields)
    expect(result.config).toEqual({ key: 'value' })
  })

  it('throws on invalid JSON for json fields', () => {
    const source = { config: 'not-json' }
    const fields: FieldConfig[] = [{ prop: 'config', label: '配置', type: 'json' }]
    expect(() => cleanPayload(source, fields)).toThrow('不是合法JSON')
  })

  it('converts percent transform values', () => {
    const source = { rate: 5 }
    const fields: FieldConfig[] = [{ prop: 'rate', label: '利率', transform: 'percent' }]
    const result = cleanPayload(source, fields)
    expect(result.rate).toBe(0.05)
  })
})

// ==================== validateRequired ====================
describe('validateRequired', () => {
  it('returns empty string when all required fields are filled', () => {
    const fields: FieldConfig[] = [{ prop: 'name', label: '名称', required: true }]
    expect(validateRequired(fields, { name: 'test' })).toBe('')
  })

  it('returns error message for first missing required field', () => {
    const fields: FieldConfig[] = [
      { prop: 'name', label: '名称', required: true },
      { prop: 'code', label: '编码', required: true }
    ]
    expect(validateRequired(fields, { code: 'abc' })).toBe('请填写名称')
  })

  it('treats empty string as missing', () => {
    const fields: FieldConfig[] = [{ prop: 'name', label: '名称', required: true }]
    expect(validateRequired(fields, { name: '' })).toBe('请填写名称')
  })

  it('treats null as missing', () => {
    const fields: FieldConfig[] = [{ prop: 'name', label: '名称', required: true }]
    expect(validateRequired(fields, { name: null })).toBe('请填写名称')
  })

  it('returns empty when no required fields', () => {
    const fields: FieldConfig[] = [{ prop: 'name', label: '名称' }]
    expect(validateRequired(fields, {})).toBe('')
  })
})

// ==================== toPercentDisplayValue / toPercentPayloadValue ====================
describe('percent value conversion', () => {
  it('toPercentDisplayValue multiplies by 100', () => {
    expect(toPercentDisplayValue(0.05)).toBe(5)
    expect(toPercentDisplayValue(0.12)).toBeCloseTo(12)
  })

  it('toPercentDisplayValue returns undefined for falsy', () => {
    expect(toPercentDisplayValue(undefined)).toBeUndefined()
    expect(toPercentDisplayValue(null)).toBeUndefined()
    expect(toPercentDisplayValue('')).toBeUndefined()
  })

  it('toPercentDisplayValue returns original for non-finite', () => {
    expect(toPercentDisplayValue('abc')).toBe('abc')
  })

  it('toPercentPayloadValue divides by 100', () => {
    expect(toPercentPayloadValue(5)).toBe(0.05)
    expect(toPercentPayloadValue(12)).toBeCloseTo(0.12)
  })

  it('toPercentPayloadValue returns original for non-finite', () => {
    expect(toPercentPayloadValue('abc')).toBe('abc')
  })
})

// ==================== fieldOptions ====================
describe('fieldOptions', () => {
  it('returns static options for non-remote fields', () => {
    const field: FieldConfig = {
      prop: 'status',
      label: '状态',
      options: [{ label: '启用', value: 'ACTIVE' }]
    }
    expect(fieldOptions(field, {})).toEqual([{ label: '启用', value: 'ACTIVE' }])
  })

  it('returns remote options when available', () => {
    const field: FieldConfig = {
      prop: 'orgId',
      label: '机构',
      remoteOptions: { module: 'org' }
    }
    const selectOptions = { orgId: [{ label: '机构A', value: 1 }] }
    expect(fieldOptions(field, selectOptions)).toEqual([{ label: '机构A', value: 1 }])
  })

  it('returns empty array when remote options not loaded', () => {
    const field: FieldConfig = {
      prop: 'orgId',
      label: '机构',
      remoteOptions: { module: 'org' }
    }
    expect(fieldOptions(field, {})).toEqual([])
  })
})

// ==================== getRemoteOptionParams ====================
describe('getRemoteOptionParams', () => {
  it('returns static params', () => {
    const source: FieldConfig = {
      prop: 'orgId',
      label: '机构',
      remoteOptions: { module: 'org', params: { status: 'ACTIVE' } }
    }
    expect(getRemoteOptionParams(source, {})).toEqual({ status: 'ACTIVE' })
  })

  it('calls function params with formModel', () => {
    const paramsFn = vi.fn().mockReturnValue({ orgId: 5 })
    const source: FieldConfig = {
      prop: 'deptId',
      label: '部门',
      remoteOptions: { module: 'dept', params: paramsFn }
    }
    const model = { orgId: 5 }
    expect(getRemoteOptionParams(source, model)).toEqual({ orgId: 5 })
    expect(paramsFn).toHaveBeenCalledWith(model)
  })

  it('returns empty object when no params', () => {
    const source: FieldConfig = {
      prop: 'orgId',
      label: '机构',
      remoteOptions: { module: 'org' }
    }
    expect(getRemoteOptionParams(source, {})).toEqual({})
  })
})
