export enum ApiStatus {
  success = 200,
  error = 400,
  unauthorized = 401,
  forbidden = 403,
  notFound = 404,
  internalServerError = 500
}

export interface ApiResponse<T = unknown> {
  code: number
  msg: string
  data: T
}

export interface PaginatedResponse<T> {
  records: T[]
  current: number
  size: number
  total: number
}
