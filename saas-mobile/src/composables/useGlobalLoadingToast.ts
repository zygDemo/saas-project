/**
 * Vant 风格全局 Toast 轻提示
 *
 * 基于全局 Loading 系统实现，支持：
 * - showToast / showLoadingToast / showSuccessToast / showFailToast
 * - showConfirmDialog
 * - closeToast / closeAll
 * - allowMultipleToast / setToastDefaultOptions / resetToastDefaultOptions
 * - 单例模式 / 多例模式
 * - 返回 ToastWrapper，支持动态更新 message / duration
 * - 支持 onClose / onOpened 回调
 * - 支持 position：top / middle / bottom
 * - 确认框支持自定义按钮文案和主按钮风险色
 */

import { useGlobalLoading } from '@/composables/useGlobalLoading'

type ToastPosition = 'top' | 'middle' | 'bottom'
type ToastType = 'text' | 'loading' | 'success' | 'fail'

interface ToastOptions {
  message?: string
  type?: ToastType
  position?: ToastPosition
  duration?: number
  forbidClick?: boolean
  lock?: boolean
  className?: string
  onClose?: () => void
  onOpened?: () => void
}

interface ToastWrapper {
  message: string
  close: () => void
}

let multipleMode = false
const activeToasts = new Map<number, ToastWrapper>()
let defaultOptions: Required<ToastOptions> = {
  message: '',
  type: 'text',
  position: 'middle',
  duration: 2000,
  forbidClick: false,
  lock: false,
  className: '',
  onClose: undefined,
  onOpened: undefined,
}


function getLoading() {
  return useGlobalLoading()
}

function normalize(options: ToastOptions | string): Required<ToastOptions> {
  if (typeof options === 'string') {
    return { ...defaultOptions, message: options }
  }
  return { ...defaultOptions, ...options }
}

function closeToast(closeAllFlag?: boolean | ToastWrapper) {
  const { hide } = useGlobalLoading()
  if (closeAllFlag === true) {
    hide()
  } else if (closeAllFlag && typeof closeAllFlag === 'object' && 'close' in closeAllFlag) {
    ;(closeAllFlag as ToastWrapper).close()
  } else {
    hide()
  }
}

function closeAll() {
  const { hide } = useGlobalLoading()
  hide()
}

function allowMultipleToast() {
  multipleMode = true
}

function setToastDefaultOptions(options: ToastOptions) {
  defaultOptions = { ...defaultOptions, ...options }
}

function resetToastDefaultOptions(type?: ToastType) {
  if (type) {
    const base: Record<ToastType, Partial<ToastOptions>> = {
      text: { type: 'text', duration: 2000, forbidClick: false },
      loading: { type: 'loading', duration: 0, forbidClick: true },
      success: { type: 'success', duration: 2000, forbidClick: false },
      fail: { type: 'fail', duration: 2000, forbidClick: false },
    }
    defaultOptions = { ...defaultOptions, ...(base[type] || {}) }
  } else {
    defaultOptions = {
      message: '',
      type: 'text',
      position: 'middle',
      duration: 2000,
      forbidClick: false,
      lock: false,
      className: '',
      onClose: undefined,
      onOpened: undefined,
    }
  }
}

function showToast(options: ToastOptions | string): ToastWrapper {
  const opts = normalize(options)
  const { show: glShow, hide: glHide, update: glUpdate } = useGlobalLoading()
  if (!multipleMode) {
    glHide()
  }
  const effectiveType = opts.type || 'text'
  const id = glShow({
    lock: opts.lock ?? (effectiveType === 'loading'),
    text: opts.message,
    type: effectiveType,
    position: opts.position,
  })

  const wrapper: ToastWrapper = {
    get message() {
      return opts.message
    },
    set message(value) {
      opts.message = value
      glUpdate(id, { text: value })
    },
    close: () => {
      glHide(id)
      opts.onClose?.()
    },
  }

  activeToasts.set(id, wrapper)
  setTimeout(() => {
    opts.onOpened?.()
  }, 16)

  if (opts.duration && opts.duration > 0 && effectiveType !== 'loading') {
    setTimeout(() => {
      glHide(id)
      activeToasts.delete(id)
      opts.onClose?.()
    }, opts.duration)
  }

  return wrapper
}

function showLoadingToast(options: ToastOptions | string = '加载中...') {
  const opts = normalize(options)
  opts.type = 'loading'
  opts.lock = true
  opts.duration = 0
  return showToast(opts)
}

function showSuccessToast(message: string, options?: ToastOptions) {
  const opts = { ...normalize(options), type: 'success' as ToastType, message }
  return showToast(opts)
}

function showFailToast(message: string, options?: ToastOptions) {
  const opts = { ...normalize(options), type: 'fail' as ToastType, message }
  return showToast(opts)
}

function showConfirmDialog(options: {
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  confirmDanger?: boolean
  lock?: boolean
  position?: ToastPosition
}): Promise<boolean> {
  const { confirm: glConfirm } = useGlobalLoading()
  return glConfirm({
    text: options.title || options.message || '确认执行该操作吗？',
    lock: options.lock ?? false,
    position: options.position,
    confirmText: options.confirmText,
    cancelText: options.cancelText,
    confirmDanger: options.confirmDanger,
  })
}

export function useGlobalLoadingToast() {
  return {
    showToast,
    showLoadingToast,
    showSuccessToast,
    showFailToast,
    showConfirmDialog,
    closeToast,
    closeAll,
    allowMultipleToast,
    setToastDefaultOptions,
    resetToastDefaultOptions,
  }
}

export {
  showToast,
  showLoadingToast,
  showSuccessToast,
  showFailToast,
  showConfirmDialog,
  closeToast,
  closeAll,
  allowMultipleToast,
  setToastDefaultOptions,
  resetToastDefaultOptions,
}
