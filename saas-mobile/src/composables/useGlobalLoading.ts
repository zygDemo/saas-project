/**
 * 全局 Loading 管理 — 支持并发请求排队
 *
 * - 多个请求同时发起时，loading 保持显示直到最后一个完成
 * - 每个 show() 返回唯一 ID，hide(id) 精确移除
 * - 支持 lock 选项：锁定操作时显示遮罩，不锁定时仅展示动画
 * - 模块级响应式变量，可在拦截器（非组件上下文）中调用
 */
import { computed, ref } from 'vue'

type LoadingLock = boolean
const loadingMap = ref(new Map<number, LoadingLock>())

let uid = 0

export function useGlobalLoading() {
  const visible = computed(() => loadingMap.value.size > 0)

  const locked = computed(() => {
    for (const lock of loadingMap.value.values()) {
      if (lock) return true
    }
    return false
  })

  function show(options?: { lock?: boolean }): number {
    const id = ++uid
    loadingMap.value = new Map(loadingMap.value)
    loadingMap.value.set(id, options?.lock ?? true)
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

  /** 一键清空（用于页面跳转等场景兜底） */
  function clearAll() {
    loadingMap.value = new Map()
  }

  return { visible, locked, show, hide, clearAll }
}
