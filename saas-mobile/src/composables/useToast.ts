/**
 * Vant 风格 Toast 轻提示封装（兼容层）
 *
 * 注意：全局反馈体系已统一到 `useGlobalLoadingToast`。
 * 本文件仅作兼容保留，建议后续迁移到 `@/composables/useGlobalLoadingToast`。
 *
 * 支持：
 * - showToast / showLoadingToast / showSuccessToast / showFailToast
 * - closeToast / allowMultipleToast
 * - setToastDefaultOptions / resetToastDefaultOptions
 * - 单例模式 / 多例模式
 * - 动态更新 message
 */

type ToastPosition = 'top' | 'middle' | 'bottom'
type ToastType = 'text' | 'loading' | 'success' | 'fail'

interface ToastOptions {
  type?: ToastType
  position?: ToastPosition
  message?: string
  duration?: number
  forbidClick?: boolean
  loadingType?: 'spinner' | 'circular'
  icon?: string
  iconSize?: number | string
  className?: string | Array<string> | Record<string, boolean>
  overlay?: boolean
  zIndex?: number | string
}

interface ToastInstance {
  id: number
  message: string
  close: () => void
}

let toastId = 0
let multipleMode = false
const activeToasts = new Map<number, ToastInstance>()
let defaultOptions: Required<ToastOptions> = {
  type: 'text',
  position: 'middle',
  message: '',
  duration: 2000,
  forbidClick: false,
  loadingType: 'circular',
  icon: '',
  iconSize: 36,
  className: '',
  overlay: false,
  zIndex: 1000,
}

function normalizeMessage(options: ToastOptions | string): Required<ToastOptions> {
  if (typeof options === 'string') {
    return { ...defaultOptions, message: options }
  }
  return { ...defaultOptions, ...options }
}

function closeById(id: number) {
  const instance = activeToasts.get(id)
  if (!instance) return
  try {
    uni.hideToast()
  } catch {
    // ignore
  }
  activeToasts.delete(id)
}

function closeAll() {
  const ids = Array.from(activeToasts.keys())
  ids.forEach(closeById)
}

function buildUniToast(options: Required<ToastOptions>): Promise<ToastInstance> {
  return new Promise((resolve) => {
    const id = ++toastId
    const instance: ToastInstance = {
      id,
      message: options.message,
      close: () => closeById(id),
    }
    activeToasts.set(id, instance)

    const title = options.message || ''

    if (options.type === 'success' || options.type === 'fail') {
      uni.showToast({
        title,
        icon: options.type === 'success' ? 'success' : 'none',
        duration: options.duration,
        forbidClick: options.forbidClick,
        success: () => resolve(instance),
        fail: () => resolve(instance),
      })
    } else if (options.type === 'loading') {
      uni.showLoading({
        title,
        mask: options.overlay || options.forbidClick,
        success: () => resolve(instance),
        fail: () => resolve(instance),
      })
    } else {
      uni.showToast({
        title,
        icon: options.icon ? 'none' : 'none',
        duration: options.duration,
        forbidClick: options.forbidClick,
        success: () => resolve(instance),
        fail: () => resolve(instance),
      })
    }

    if (options.duration > 0 && options.type !== 'loading') {
      setTimeout(() => {
        closeById(id)
      }, options.duration)
    }
  })
}

function showToast(options: ToastOptions | string): ToastInstance {
  const opts = normalizeMessage(options)
  if (!multipleMode && activeToasts.size) {
    closeAll()
  }
  const instance = buildUniToast(opts)
  // 兼容 Vant 风格返回值
  return {
    id: toastId,
    message: opts.message,
    close: () => {
      closeAll()
    },
  }
}

function showLoadingToast(options: ToastOptions | string = '加载中...') {
  const opts = normalizeMessage(options)
  opts.type = 'loading'
  opts.forbidClick = true
  opts.duration = 0
  return showToast(opts)
}

function showSuccessToast(message: string, options?: ToastOptions) {
  const opts = normalizeMessage(options)
  opts.type = 'success'
  opts.message = message
  return showToast(opts)
}

function showFailToast(message: string, options?: ToastOptions) {
  const opts = normalizeMessage(options)
  opts.type = 'fail'
  opts.message = message
  return showToast(opts)
}

function closeToast(closeAllFlag?: boolean) {
  if (closeAllFlag) {
    closeAll()
  } else {
    closeAll()
  }
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
      type: 'text',
      position: 'middle',
      message: '',
      duration: 2000,
      forbidClick: false,
      loadingType: 'circular',
      icon: '',
      iconSize: 36,
      className: '',
      overlay: false,
      zIndex: 1000,
    }
  }
}

export function useToast() {
  return {
    showToast,
    showLoadingToast,
    showSuccessToast,
    showFailToast,
    closeToast,
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
  closeToast,
  allowMultipleToast,
  setToastDefaultOptions,
  resetToastDefaultOptions,
}
