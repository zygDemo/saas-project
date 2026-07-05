/**
 * 前后端共享的 API 响应契约
 *
 * 与后端 NestJS 统一接口结构对齐，供 saas-web API 客户端与页面复用。
 * 与现有 `src/types/common/response.ts` 的 `BaseResponse` 配合使用。
 */

import type { BaseResponse } from '@/types/common/response'

/** 分页响应（records 形态） */
export interface BasePageResponse<T = unknown> {
  records: T[]
  current: number
  size: number
  total: number
}

/** 查询参数基类 */
export interface PageQuery {
  current?: number
  size?: number
  [key: string]: unknown
}

/** 错误响应 */
export interface ErrorResponse {
  code: number
  msg: string
}
