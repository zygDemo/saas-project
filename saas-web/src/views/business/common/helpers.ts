import type { FieldConfig, FilterConfig, OptionConfig } from './types'
import type { FormModel } from './types'
import { commonStatusMap, flowBusinessTypeOptions, flowNodeOptions, orgPackageOptions } from './constants'
import type { PageConfig } from './types'

// 关联实体类型（用于 flattenRelations 和 formatCell）
interface RelationEntity {
  name?: string
  userName?: string
  realName?: string
}

// ==================== 格式化工具 ====================

export function formatDate(value: unknown): string {
  if (!value) return '-'
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return String(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function packageLabel(value: unknown): string {
  if (!value) return '未配置套餐'
  return orgPackageOptions.find((option) => option.value === value)?.label || String(value)
}

export function orgCount(row: Record<string, unknown>, prop: string): number {
  const value = row[prop]
  return typeof value === 'number' ? value : 0
}

export function getOrgExpireState(value: unknown): string {
  if (!value) return 'UNSET'
  const time = new Date(String(value)).getTime()
  if (Number.isNaN(time)) return 'UNSET'
  const now = Date.now()
  const diffDays = Math.ceil((time - now) / (24 * 60 * 60 * 1000))
  if (diffDays < 0) return 'EXPIRED'
  if (diffDays <= 30) return 'EXPIRING'
  return 'VALID'
}

export function orgExpiryMeta(value: unknown): {
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

export function statusTagType(value: unknown): string {
  const statusValue = String(value)
  if (
    [
      'ACTIVE', 'DISBURSED', 'PAID', 'SIGNED',
      'RISK_PRE_PASSED', 'FUNDER_PRE_PASSED', 'FIRST_REVIEW_PASSED',
      'FINAL_REVIEW_PASSED', 'FUNDER_REVIEW_PASSED', 'LOAN_REQUEST_APPROVED'
    ].includes(statusValue)
  )
    return 'success'
  if (
    [
      'DRAFT', 'PENDING', 'SUBMITTED', 'PENDING_RISK_PRE', 'PENDING_FUNDER_PRE',
      'PENDING_SUPPLEMENT', 'PENDING_FIRST_REVIEW', 'PENDING_FINAL_REVIEW',
      'PENDING_FUNDER_REVIEW', 'PENDING_SIGN', 'SIGNING_PROGRESS',
      'PENDING_LOAN_REQUEST', 'LOAN_REQUEST_REVIEWING', 'PENDING_DISBURSEMENT'
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

export function formatCell(
  row: Record<string, unknown>,
  prop: string,
  config: PageConfig
): string {
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
    return config.statusMap?.[String(value)] || commonStatusMap[String(value)] || String(value)
  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      if (value.length === 0) return '-'
      if (value.every((v) => v && typeof v === 'object' && 'name' in v)) {
        return value.map((v: unknown) => (v as RelationEntity).name ?? '').join(', ')
      }
      return `共${value.length}项`
    }
    if ('name' in value) return String((value as { name?: unknown }).name)
    if ('userName' in value) return String((value as { userName?: unknown }).userName)
    return JSON.stringify(value)
  }
  return String(value)
}

export function shouldShowFieldGroup(
  fields: FieldConfig[],
  field: FieldConfig,
  index: number
): boolean {
  if (!field.group) return false
  if (index === 0) return true
  return fields[index - 1]?.group !== field.group
}

// ==================== 数据处理 ====================

export function flattenRelations(row: Record<string, unknown>): Record<string, unknown> {
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
      const relEntity = rel as RelationEntity
      const name = relEntity.name ?? relEntity.userName ?? relEntity.realName
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

// ==================== 表单工具 ====================

export function resetModel(
  target: Record<string, unknown>,
  fields: FieldConfig[],
  source?: Record<string, unknown>
): void {
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

export function cleanPayload(source: Record<string, unknown>, fields: FieldConfig[]): Record<string, unknown> {
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

export function validateRequired(fields: FieldConfig[], model: Record<string, unknown>): string {
  const field = fields.find(
    (item) =>
      item.required &&
      (model[item.prop] === undefined || model[item.prop] === null || model[item.prop] === '')
  )
  return field ? `请填写${field.label}` : ''
}

export function toPercentDisplayValue(value: unknown): unknown {
  if (value === undefined || value === null || value === '') return undefined
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue * 100 : value
}

export function toPercentPayloadValue(value: unknown): unknown {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue / 100 : value
}

export function fieldOptions(
  field: FieldConfig,
  selectOptions: Record<string, OptionConfig[]>
): OptionConfig[] {
  return field.remoteOptions ? selectOptions[field.prop] || [] : field.options || []
}

export function getRemoteOptionParams(
  source: FieldConfig | FilterConfig,
  formModel: Record<string, unknown>
): Record<string, unknown> {
  const params = source.remoteOptions?.params
  if (typeof params === 'function') return (params as (model: FormModel) => Record<string, unknown>)(formModel as FormModel)
  return params || {}
}
