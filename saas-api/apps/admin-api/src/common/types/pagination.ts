export interface PaginatedResponse<T> {
  records: T[]
  current: number
  size: number
  total: number
}
