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

export function fetchBusinessList<T = Record<string, unknown>>(module: string, params: BusinessQuery) {
  return request.get<BusinessPage<T>>({
    url: `/${module}/list`,
    params
  })
}

export function fetchBusinessDetail<T = Record<string, unknown>>(module: string, id: number) {
  return request.get<T>({
    url: `/${module}/${id}`
  })
}

export function fetchBusinessCreate<T = Record<string, unknown>>(module: string, params: Record<string, unknown>) {
  return request.post<T>({
    url: `/${module}`,
    params,
    showSuccessMessage: true
  })
}

export function fetchBusinessUpdate<T = Record<string, unknown>>(module: string, id: number, params: Record<string, unknown>) {
  return request.put<T>({
    url: `/${module}/${id}`,
    params,
    showSuccessMessage: true
  })
}

export function fetchBusinessDelete(module: string, id: number) {
  return request.del<{ id: number }>({
    url: `/${module}/${id}`,
    showSuccessMessage: true
  })
}

export function fetchBusinessAction<T = Record<string, unknown>>(url: string, params?: Record<string, unknown>) {
  return request.post<T>({
    url,
    params: params || {},
    showSuccessMessage: true
  })
}
