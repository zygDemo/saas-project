/**
 * HTTP 请求封装模块
 * 基于 Axios 封装的 HTTP 请求工具，提供统一的请求/响应处理
 *
 * ## 主要功能
 *
 * - 请求/响应拦截器（自动添加 Token、统一错误处理）
 * - 401 未授权自动登出（带防抖机制）
 * - 请求失败自动重试（可配置）
 * - 统一的成功/错误消息提示
 * - 支持 GET/POST/PUT/DELETE 等常用方法
 *
 * @module utils/http
 * @author Art Design Pro Team
 */

import axios, { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { useUserStore } from '@/store/modules/user'
import { ApiStatus } from './status'
import { HttpError, handleError, showError, showSuccess } from './error'
import { $t } from '@/locales'
import { ApiResponse } from '@/types'
import { reportError, reportPerformance } from '@/utils/monitor/monitor'

/** 请求配置常量 */
const REQUEST_TIMEOUT = 15000
const LOGOUT_DELAY = 500
const MAX_RETRIES = 0
const RETRY_DELAY = 1000
const UNAUTHORIZED_DEBOUNCE_TIME = 3000

/** 401防抖状态 */
let isUnauthorizedErrorShown = false
let unauthorizedTimer: NodeJS.Timeout | null = null

/** 扩展 AxiosRequestConfig */
interface ExtendedAxiosRequestConfig extends AxiosRequestConfig {
  showErrorMessage?: boolean
  showSuccessMessage?: boolean
}

const { VITE_API_URL, VITE_WITH_CREDENTIALS, VITE_TENANT_ID } = import.meta.env
const normalizedApiRoot = (VITE_API_URL || '/saas').replace(/\/+$/, '')
export const API_BASE_URL = normalizedApiRoot.endsWith('/api')
  ? normalizedApiRoot
  : `${normalizedApiRoot}/api`
const TENANT_ID = VITE_TENANT_ID || '1'

/** Axios实例 */
const axiosInstance = axios.create({
  timeout: REQUEST_TIMEOUT,
  baseURL: API_BASE_URL,
  withCredentials: VITE_WITH_CREDENTIALS === 'true',
  validateStatus: (status) => status >= 200 && status < 300,
  transformResponse: [
    (data, headers) => {
      const contentType = String(headers['content-type'] || '')
      if (contentType?.includes('application/json')) {
        try {
          return JSON.parse(data)
        } catch {
          return data
        }
      }
      return data
    }
  ]
})

/** 请求拦截器 */
axiosInstance.interceptors.request.use(
  (request: InternalAxiosRequestConfig) => {
    const { accessToken } = useUserStore()
    if (accessToken) request.headers.set('Authorization', accessToken)
    if (TENANT_ID) request.headers.set('x-tenant-id', TENANT_ID)

    if (request.data && !(request.data instanceof FormData) && !request.headers['Content-Type']) {
      request.headers.set('Content-Type', 'application/json')
      request.data = JSON.stringify(request.data)
    }

    const startTime = Date.now()
    const requestUrl = request.url || ''
    request.headers.set('X-Request-Id', `${startTime}-${Math.random().toString(36).slice(2, 9)}`)
    ;(request as ExtendedAxiosRequestConfig & { __monitorStart?: number }).__monitorStart =
      startTime
    ;(request as ExtendedAxiosRequestConfig & { __monitorUrl?: string }).__monitorUrl = requestUrl

    return request
  },
  async (error) => {
    showError(createHttpError($t('httpMsg.requestConfigError'), ApiStatus.error))
    return Promise.reject(error)
  }
)

/** 响应拦截器 */
axiosInstance.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const { code, msg } = response.data
    if (code === ApiStatus.success) {
      const startTime = (
        response.config as ExtendedAxiosRequestConfig & { __monitorStart?: number }
      ).__monitorStart
      const requestUrl =
        (response.config as ExtendedAxiosRequestConfig & { __monitorUrl?: string }).__monitorUrl ||
        response.config.url ||
        ''
      if (typeof startTime === 'number') {
        const duration = Date.now() - startTime
        reportPerformance({
          type: 'request',
          name: requestUrl,
          duration,
          statusCode: response.status,
          url: requestUrl
        })
      }
      return response
    }
    if (code === ApiStatus.unauthorized) {
      throw createHttpError(msg || $t('httpMsg.requestFailed'), ApiStatus.unauthorized)
    }

    // 业务非成功状态码统一抛出业务错误
    throw createHttpError(msg || $t('httpMsg.requestFailed'), code)
  },
  async (error) => {
    if (error.response?.status === ApiStatus.unauthorized) {
      const refreshed = await tryHandleRefresh()
      if (refreshed) {
        const userStore = useUserStore()
        const token = userStore.accessToken
        if (token) {
          error.config.headers = error.config.headers || {}
          error.config.headers.set('Authorization', token)
        }
        return axiosInstance.request(error.config)
      }
      handleUnauthorizedError()
    }
    const startTime = (error.config as ExtendedAxiosRequestConfig & { __monitorStart?: number })
      .__monitorStart
    const requestUrl =
      (error.config as ExtendedAxiosRequestConfig & { __monitorUrl?: string }).__monitorUrl ||
      error.config?.url ||
      ''
    if (typeof startTime === 'number') {
      const duration = Date.now() - startTime
      reportPerformance({
        type: 'request',
        name: requestUrl,
        duration,
        statusCode: error.response?.status,
        url: requestUrl
      })
    }
    reportError({
      type: 'request-error',
      message: error.message,
      source: requestUrl,
      stack: error.stack
    })
    return Promise.reject(handleError(error))
  }
)

/** 统一创建HttpError */
function createHttpError(message: string, code: number) {
  return new HttpError(message, code)
}

/** 处理401错误（带防抖） */
let isRefreshing = false
let refreshPromise: Promise<{ token: string; refreshToken: string }> | null = null

async function tryRefreshToken(): Promise<{ token: string; refreshToken: string }> {
  const userStore = useUserStore()
  const token = userStore.refreshToken
  if (!token) throw new Error('missing refresh token')

  isRefreshing = true
  try {
    refreshPromise = refreshToken({ refreshToken: token })
    const result = await refreshPromise
    userStore.setToken(result.token, result.refreshToken)
    return result
  } finally {
    isRefreshing = false
    refreshPromise = null
  }
}

async function tryHandleRefresh(): Promise<boolean> {
  if (isRefreshing) return false
  const userStore = useUserStore()
  if (!userStore.refreshToken) return false

  try {
    await tryRefreshToken()
    return true
  } catch {
    return false
  }
}

function handleUnauthorizedError(message?: string): never {
  const error = createHttpError(message || $t('httpMsg.unauthorized'), ApiStatus.unauthorized)

  if (!isUnauthorizedErrorShown) {
    isUnauthorizedErrorShown = true
    logOut()

    unauthorizedTimer = setTimeout(resetUnauthorizedError, UNAUTHORIZED_DEBOUNCE_TIME)

    showError(error, true)
    throw error
  }

  throw error
}

/** 重置401防抖状态 */
function resetUnauthorizedError() {
  isUnauthorizedErrorShown = false
  if (unauthorizedTimer) clearTimeout(unauthorizedTimer)
  unauthorizedTimer = null
}

/** 退出登录函数 */
function logOut() {
  setTimeout(() => {
    useUserStore().logOut()
  }, LOGOUT_DELAY)
}

/** 是否需要重试 */
function shouldRetry(statusCode: number) {
  return [
    ApiStatus.requestTimeout,
    ApiStatus.internalServerError,
    ApiStatus.badGateway,
    ApiStatus.serviceUnavailable,
    ApiStatus.gatewayTimeout
  ].includes(statusCode)
}

/** 请求重试逻辑 */
async function retryRequest<T>(
  config: ExtendedAxiosRequestConfig,
  retries: number = MAX_RETRIES
): Promise<T> {
  try {
    return await request<T>(config)
  } catch (error) {
    if (retries > 0 && error instanceof HttpError && shouldRetry(error.code)) {
      await delay(RETRY_DELAY)
      return retryRequest<T>(config, retries - 1)
    }
    throw error
  }
}

/** 延迟函数 */
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * 统一分页响应格式
 * 后端统一返回 { list, meta }，前端仍可能使用 .records/.total/.current/.size
 * 这里做兼容转换，同时保留 list/meta 和 records/total/current/size
 */
function normalizePaginatedData<T>(data: T): T {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return data
  const obj = data as Record<string, unknown>
  if (!('list' in obj) || !('meta' in obj)) return data
  const meta = (obj.meta || {}) as Record<string, unknown>
  return {
    ...obj,
    records: obj.list,
    total: meta.total,
    current: meta.page,
    size: meta.pageSize,
    totalPages: meta.totalPages
  } as T
}

/** 请求函数 */
async function request<T = unknown>(config: ExtendedAxiosRequestConfig): Promise<T> {
  try {
    const res = await axiosInstance.request<ApiResponse<T>>(config)

    // 显示成功消息
    if (config.showSuccessMessage && res.data.msg) {
      showSuccess(res.data.msg)
    }

    return normalizePaginatedData(res.data.data) as T
  } catch (error) {
    if (error instanceof HttpError && error.code !== ApiStatus.unauthorized) {
      const showMsg = config.showErrorMessage !== false
      showError(error, showMsg)
    }
    return Promise.reject(error)
  }
}

/** API方法集合 */
const api = {
  get<T>(config: ExtendedAxiosRequestConfig) {
    return retryRequest<T>({ ...config, method: 'GET' })
  },
  post<T>(config: ExtendedAxiosRequestConfig) {
    return retryRequest<T>({ ...config, method: 'POST' })
  },
  put<T>(config: ExtendedAxiosRequestConfig) {
    return retryRequest<T>({ ...config, method: 'PUT' })
  },
  del<T>(config: ExtendedAxiosRequestConfig) {
    return retryRequest<T>({ ...config, method: 'DELETE' })
  },
  upload<T>(config: ExtendedAxiosRequestConfig) {
    return retryRequest<T>({ ...config, method: 'POST' })
  },
  request<T>(config: ExtendedAxiosRequestConfig) {
    return retryRequest<T>(config)
  }
}

export default api
