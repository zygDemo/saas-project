/**
 * 全局错误处理模块
 *
 * 提供统一的错误捕获和处理机制
 *
 * ## 主要功能
 *
 * - Vue 运行时错误捕获（组件错误、生命周期错误等）
 * - 全局脚本错误捕获（语法错误、运行时错误等）
 * - Promise 未捕获错误处理（unhandledrejection）
 * - 静态资源加载错误监控（图片、脚本、样式等）
 * - 错误日志记录和上报
 * - 统一的错误处理入口
 *
 * ## 使用场景
 * - 应用启动时安装全局错误处理器
 * - 捕获和记录所有类型的错误
 * - 错误上报到监控平台
 * - 提升应用稳定性和可维护性
 * - 问题排查和调试
 *
 * ## 错误类型
 *
 * - VueError: Vue 组件相关错误
 * - ScriptError: JavaScript 脚本错误
 * - PromiseError: Promise 未捕获的 rejection
 * - ResourceError: 静态资源加载失败
 *
 * @module utils/sys/error-handle
 * @author Art Design Pro Team
 */
import type { App, ComponentPublicInstance } from 'vue'
import { reportError, reportPerformance } from '@/utils/monitor/monitor'

const IGNORABLE_SCRIPT_ERRORS = [
  'ResizeObserver loop completed with undelivered notifications.',
  'ResizeObserver loop limit exceeded'
]

function normalizeErrorMessage(message: Event | string): string {
  if (typeof message === 'string') {
    return message
  }

  if ('message' in message && typeof message.message === 'string') {
    return message.message
  }

  return ''
}

function isIgnorableScriptError(message: Event | string, source?: string): boolean {
  const normalizedMessage = normalizeErrorMessage(message)

  if (!normalizedMessage) {
    return false
  }

  if (IGNORABLE_SCRIPT_ERRORS.some((item) => normalizedMessage.includes(item))) {
    return true
  }

  if (normalizedMessage === 'Script error.' && source === '') {
    return true
  }

  return false
}

export function vueErrorHandler(err: unknown, instance: ComponentPublicInstance | null, info: string) {
  console.error('[VueError]', err, info, instance)
  reportError({
    type: 'vue',
    message: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
    source: instance?.$options?.name || info,
  })
}

export function scriptErrorHandler(
  message: Event | string,
  source?: string,
  lineno?: number,
  colno?: number,
  error?: Error
): boolean {
  if (isIgnorableScriptError(message, source)) {
    return true
  }

  console.error('[ScriptError]', { message, source, lineno, colno, error })
  reportError({
    type: 'script',
    message: normalizeErrorMessage(message),
    source,
    lineno: typeof lineno === 'number' ? lineno : undefined,
    colno: typeof colno === 'number' ? colno : undefined,
    stack: error?.stack,
  })
  return true
}

export function registerPromiseErrorHandler() {
  window.addEventListener('unhandledrejection', (event) => {
    console.error('[PromiseError]', event.reason)
    const reason = event.reason
    reportError({
      type: 'promise',
      message: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
    })
  })
}

export function registerResourceErrorHandler() {
  window.addEventListener(
    'error',
    (event: Event) => {
      const target = event.target as HTMLElement
      if (
        target &&
        (target.tagName === 'IMG' || target.tagName === 'SCRIPT' || target.tagName === 'LINK')
      ) {
        console.error('[ResourceError]', {
          tagName: target.tagName,
          src:
            (target as HTMLImageElement).src ||
            (target as HTMLScriptElement).src ||
            (target as HTMLLinkElement).href
        })
        reportError({
          type: 'resource',
          message: `${target.tagName} load failed`,
          source:
            (target as HTMLImageElement).src ||
            (target as HTMLScriptElement).src ||
            (target as HTMLLinkElement).href,
        })
      }
    },
    true
  )
}

export function setupErrorHandle(app: App) {
  app.config.errorHandler = vueErrorHandler
  window.onerror = scriptErrorHandler
  registerPromiseErrorHandler()
  registerResourceErrorHandler()
}
