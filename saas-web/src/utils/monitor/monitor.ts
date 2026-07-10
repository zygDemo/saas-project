/**
 * 前端监控埋点基础能力
 *
 * 当前提供三部分能力：
 * - 错误上报：Vue error、script error、Promise error、资源错误、接口错误
 * - 性能上报：首屏 / 路由切换 / 接口耗时 / 资源加载
 * - 行为埋点：按钮点击、Tab 切换、表单提交等自定义事件
 *
 * 生产环境默认启用，可通过 VITE_MONITOR_ENABLED 关闭。
 * 上报地址可通过 VITE_MONITOR_API 覆盖。
 */

export interface MonitorError {
  type: 'vue' | 'script' | 'promise' | 'resource' | 'request' | 'request-error'
  message: string
  source?: string
  lineno?: number
  colno?: number
  stack?: string
  route?: string
  userAgent?: string
  timestamp?: string
}

export interface MonitorPerformance {
  type: 'page' | 'route' | 'request' | 'resource'
  name?: string
  duration?: number
  statusCode?: number
  url?: string
  route?: string
  timestamp?: string
}

export interface MonitorAction {
  event: string
  page?: string
  route?: string
  params?: Record<string, unknown>
  timestamp?: string
}

export type MonitorReportItem = MonitorError | MonitorPerformance | MonitorAction

const isBrowser = typeof window !== 'undefined'
const isDev = import.meta.env.DEV
const enabled = isBrowser && import.meta.env.VITE_MONITOR_ENABLED !== 'false'
const apiUrl = (import.meta.env.VITE_MONITOR_API || '/saas/api/monitor/collect').replace(/\/+$/, '')

function getUa(): string {
  return isBrowser ? window.navigator.userAgent : ''
}

function getRoute(): string {
  try {
    return isBrowser ? window.location.pathname : ''
  } catch {
    return ''
  }
}

function now(): string {
  return new Date().toISOString()
}

function buildCommon(extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    app: 'saas',
    env: isDev ? 'dev' : 'prod',
    route: getRoute(),
    userAgent: getUa(),
    timestamp: now(),
    ...extra
  }
}

function safeStringify(data: unknown): string {
  try {
    return JSON.stringify(data)
  } catch {
    return String(data)
  }
}

/**
 * 上报到监控服务
 */
export async function report(item: MonitorReportItem): Promise<void> {
  if (!enabled) return

  const payload = buildCommon(item as unknown as Record<string, unknown>)

  try {
    const send = () => {
      const blob = new Blob([safeStringify(payload)], { type: 'application/json' })
      if (navigator.sendBeacon && apiUrl) {
        navigator.sendBeacon(apiUrl, blob)
      } else if (apiUrl) {
        fetch(apiUrl, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: safeStringify(payload),
          keepalive: true
        })
      }
    }

    if (document.readyState === 'complete') {
      send()
    } else {
      window.addEventListener('load', send, { once: true })
    }
  } catch {
    // 监控上报失败不应影响业务
  }
}

/**
 * 错误上报
 */
export function reportError(input: Omit<MonitorError, 'route' | 'userAgent' | 'timestamp'>): void {
  report({
    ...input,
    route: getRoute(),
    userAgent: getUa(),
    timestamp: now()
  })
}

/**
 * 性能上报
 */
export function reportPerformance(input: Omit<MonitorPerformance, 'route' | 'timestamp'>): void {
  report({
    ...input,
    route: getRoute(),
    timestamp: now()
  })
}

/**
 * 行为埋点
 */
export function reportAction(input: Omit<MonitorAction, 'route' | 'timestamp'>): void {
  report({
    ...input,
    route: getRoute(),
    timestamp: now()
  })
}
