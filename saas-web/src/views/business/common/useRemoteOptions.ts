import { reactive } from 'vue'
import type { FieldConfig, FilterConfig, OptionConfig, RemoteOptionsConfig } from './types'
import { fetchBusinessList } from '@/api/business'
import { getRemoteOptionParams } from './helpers'

export function useRemoteOptions(formModel: Record<string, unknown>) {
  const selectOptions = reactive<Record<string, OptionConfig[]>>({})
  const selectLoading = reactive<Record<string, boolean>>({})

  async function fetchRemoteOptions(
    config: RemoteOptionsConfig,
    params: Record<string, unknown>
  ): Promise<OptionConfig[]> {
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
  ): string {
    const label = item[labelField] || item[valueField]
    if (labelField === 'nickName' && item.userName && item.userName !== label) {
      return `${label}（${item.userName}）`
    }
    return String(label)
  }

  async function loadRemoteOption(field: FieldConfig): Promise<void> {
    if (!field.remoteOptions) return
    const params = getRemoteOptionParams(field, formModel)
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

  async function loadRemoteFilterOption(filter: FilterConfig): Promise<void> {
    if (!filter.remoteOptions) return
    const key = `filter:${filter.prop}`
    if (selectOptions[key]?.length || selectLoading[key]) return
    selectLoading[key] = true
    try {
      selectOptions[key] = await fetchRemoteOptions(
        filter.remoteOptions,
        getRemoteOptionParams(filter, formModel)
      )
    } finally {
      selectLoading[key] = false
    }
  }

  async function loadRemoteOptions(fields: FieldConfig[], props?: string[]): Promise<void> {
    await Promise.all(
      fields
        .filter((field) => field.remoteOptions && (!props || props.includes(field.prop)))
        .map((field) => loadRemoteOption(field))
    )
  }

  async function loadRemoteFilterOptions(filters: FilterConfig[]): Promise<void> {
    await Promise.all(
      filters
        .filter((filter) => filter.remoteOptions)
        .map((filter) => loadRemoteFilterOption(filter))
    )
  }

  return {
    selectOptions,
    selectLoading,
    loadRemoteOptions,
    loadRemoteFilterOptions
  }
}
