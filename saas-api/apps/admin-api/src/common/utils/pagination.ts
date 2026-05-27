import { PaginatedResponse } from '../types/pagination'

export interface PaginationQuery {
  current?: string | number
  size?: string | number
}

export interface PaginationMeta {
  current: number
  size: number
  skip: number
  take: number
}

export function getPagination(query: PaginationQuery): PaginationMeta {
  const current = Math.max(Number(query.current ?? 1) || 1, 1)
  const size = Math.min(Math.max(Number(query.size ?? 20) || 20, 1), 200)

  return {
    current,
    size,
    skip: (current - 1) * size,
    take: size
  }
}

export function toPaginatedResponse<T>(
  records: T[],
  total: number,
  pagination: Pick<PaginationMeta, 'current' | 'size'>
): PaginatedResponse<T> {
  return {
    records,
    current: pagination.current,
    size: pagination.size,
    total
  }
}
