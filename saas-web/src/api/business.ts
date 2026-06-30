import request from '@/utils/http'

export interface BusinessQuery {
  current?: number
  size?: number
  [key: string]: unknown
}

export interface BusinessPage<T = Record<string, unknown>> {
  records: T[]
  total: number
  current: number
  size: number
}

export interface FlowNodeMeta {
  code: number
  name: string
  phaseCode: number
  phaseName: string
  sort: number
  operationSide?: string
  executor?: string
  parentNode?: number
  parallel?: boolean
  required?: boolean
  steps?: Array<{
    code: string
    name: string
    operationSide?: string
    executor?: string
    sort?: number
    required?: boolean
  }>
  transitions?: Array<{
    action: number
    toNode: number
    condition?: string
  }>
}

export interface FlowConfigMeta {
  businessTypes: Array<{ label: string; value: string }>
  actions: Array<{ label: string; value: number; code: string }>
  statuses: Array<{ label: string; value: number; code: string }>
  nodes: FlowNodeMeta[]
  phases: Array<{ code: number; name: string; nodes: number[] }>
}

export function fetchBusinessList<T = Record<string, unknown>>(
  module: string,
  params: BusinessQuery,
  listApi = 'list'
) {
  return request.get<BusinessPage<T>>({
    url: `/${module}/${listApi}`,
    params
  })
}

export function fetchBusinessDetail<T = Record<string, unknown>>(module: string, id: number) {
  return request.get<T>({
    url: `/${module}/${id}`
  })
}

export function fetchBusinessCreate<T = Record<string, unknown>>(
  module: string,
  data: Record<string, unknown>
) {
  return request.post<T>({
    url: `/${module}`,
    data
  })
}

export function fetchBusinessUpdate<T = Record<string, unknown>>(
  module: string,
  id: number,
  data: Record<string, unknown>
) {
  return request.post<T>({
    url: `/${module}/${id}`,
    data
  })
}

export function fetchBusinessDelete(module: string, id: number) {
  return request.post<{ id: number }>({
    url: `/${module}/${id}/delete`
  })
}

export function fetchBusinessAction<T = Record<string, unknown>>(
  url: string,
  data?: Record<string, unknown>
) {
  return request.post<T>({
    url,
    data: data || {}
  })
}

export function fetchFlowConfigMeta() {
  return request.get<FlowConfigMeta>({
    url: '/flow-config/meta'
  })
}

export function fetchInitDefaultFlowConfig(params: { orgId: number; businessType?: string }) {
  return request.post<{ count: number; records: Record<string, unknown>[] }>({
    url: '/flow-config/init-default',
    params
  })
}

export function fetchApplicationLifecycle<T = Record<string, unknown>>(id: number) {
  return request.get<T[]>({
    url: `/application/lifecycle/${id}`
  })
}

export function fetchApplicationFlowList<T = Record<string, unknown>>(params: BusinessQuery) {
  return request.get<BusinessPage<T>>({
    url: '/application/flow-list',
    params
  })
}
