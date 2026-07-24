/**
 * 全局 Loading 管理 — 支持并发请求排队、自定义文案、反馈类型、展示位置、确认框
 *
 * - 多个请求同时发起时，loading 保持显示直到最后一个完成
 * - 每个 show() 返回唯一 ID，hide(id) 精确移除
 * - update(id, options) 支持动态更新文案/类型/位置
 * - 支持 lock 选项：锁定操作时仅锁定卡片区域，不锁全屏
 * - 支持 text/type/position 选项：自定义文案、反馈类型和展示位置
 * - confirm() 支持确认/取消回调，支持按钮文案和主按钮风险色
 * - 模块级响应式变量，可在拦截器（非组件上下文）中调用
 */
import { computed, ref } from 'vue'

interface LoadingItem {
  lock: boolean
  text: string
  type: 'loading' | 'success' | 'fail' | 'text' | 'confirm'
  position: 'top' | 'middle' | 'bottom'
  confirmText?: string
  cancelText?: string
  confirmDanger?: boolean
  _confirm?: () => void
  _cancel?: () => void
}
const loadingMap = ref(new Map<number, LoadingItem>())

let uid = 0

export function useGlobalLoading() {
  const visible = computed(() => loadingMap.value.size > 0)

  const locked = computed(() => {
    for (const item of loadingMap.value.values()) {
      if (item.lock) return true
    }
    return false
  })

  const text = computed(() => {
    if (loadingMap.value.size === 0) return '加载中...'
    const lastKey = Math.max(...loadingMap.value.keys())
    return loadingMap.value.get(lastKey)?.text || '加载中...'
  })

  const toastType = computed(() => {
    if (loadingMap.value.size === 0) return 'loading'
    const lastKey = Math.max(...loadingMap.value.keys())
    return loadingMap.value.get(lastKey)?.type || 'loading'
  })

  const toastPosition = computed(() => {
    if (loadingMap.value.size === 0) return 'middle'
    const lastKey = Math.max(...loadingMap.value.keys())
    return loadingMap.value.get(lastKey)?.position || 'middle'
  })

  const confirmText = computed(() => {
    if (loadingMap.value.size === 0) return '确认'
    const lastKey = Math.max(...loadingMap.value.keys())
    return loadingMap.value.get(lastKey)?.confirmText || '确认'
  })

  const cancelText = computed(() => {
    if (loadingMap.value.size === 0) return '取消'
    const lastKey = Math.max(...loadingMap.value.keys())
    return loadingMap.value.get(lastKey)?.cancelText || '取消'
  })

  const confirmDanger = computed(() => {
    if (loadingMap.value.size === 0) return false
    const lastKey = Math.max(...loadingMap.value.keys())
    return loadingMap.value.get(lastKey)?.confirmDanger || false
  })

  function show(options?: {
    lock?: boolean
    text?: string
    type?: LoadingItem['type']
    position?: LoadingItem['position']
    confirmText?: string
    cancelText?: string
    confirmDanger?: boolean
  }): number {
    const id = ++uid
    loadingMap.value = new Map(loadingMap.value)
    loadingMap.value.set(id, {
      lock: options?.lock ?? true,
      text: options?.text || '加载中...',
      type: options?.type || 'loading',
      position: options?.position || 'middle',
      confirmText: options?.confirmText,
      cancelText: options?.cancelText,
      confirmDanger: options?.confirmDanger,
    })
    return id
  }

  function hide(id?: number) {
    if (id !== undefined) {
      const next = new Map(loadingMap.value)
      next.delete(id)
      loadingMap.value = next
    } else {
      loadingMap.value = new Map()
    }
  }

  function update(
    id: number,
    options: { text?: string; type?: LoadingItem['type']; position?: LoadingItem['position'] },
  ) {
    const next = new Map(loadingMap.value)
    const existing = next.get(id)
    if (!existing) return
    next.set(id, {
      ...existing,
      ...options,
    })
    loadingMap.value = next
  }

  function confirm(options?: {
    text?: string
    lock?: boolean
    position?: LoadingItem['position']
    confirmText?: string
    cancelText?: string
    confirmDanger?: boolean
  }): Promise<boolean> {
    return new Promise((resolve) => {
      const id = show({
        lock: options?.lock ?? false,
        text: options?.text || '确认执行该操作吗？',
        type: 'confirm',
        position: options?.position || 'middle',
        confirmText: options?.confirmText,
        cancelText: options?.cancelText,
        confirmDanger: options?.confirmDanger,
      })

      const next = new Map(loadingMap.value)
      const item = next.get(id)
      if (!item) {
        resolve(false)
        return
      }

      let resolved = false
      const safeHide = () => {
        if (resolved) return
        resolved = true
        hide(id)
      }

      next.set(id, {
        ...item,
        _confirm: () => {
          safeHide()
          resolve(true)
        },
        _cancel: () => {
          safeHide()
          resolve(false)
        },
      })
      loadingMap.value = next
    })
  }

  function triggerConfirm() {
    const lastKey = Math.max(...loadingMap.value.keys())
    const item = loadingMap.value.get(lastKey)
    if (item && item.type === 'confirm') {
      item._confirm?.()
    }
  }

  function triggerCancel() {
    const lastKey = Math.max(...loadingMap.value.keys())
    const item = loadingMap.value.get(lastKey)
    if (item && item.type === 'confirm') {
      item._cancel?.()
    }
  }

  /** 一键清空（用于页面跳转等场景兜底） */
  function clearAll() {
    loadingMap.value = new Map()
  }

  return { visible, locked, text, toastType, toastPosition, confirmText, cancelText, confirmDanger, show, hide, update, confirm, triggerConfirm, triggerCancel, clearAll }
}
