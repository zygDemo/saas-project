/**
 * 全局 Loading 管理 — 支持并发请求排队
 *
 * - 多个请求同时发起时，loading 保持显示直到最后一个完成
 * - 每个 show() 返回唯一 ID，hide(id) 精确移除
 * - 模块级响应式变量，可在拦截器（非组件上下文）中调用
 */
import { computed, ref } from 'vue'

const loadingSet = ref(new Set<number>())

let uid = 0

export function useGlobalLoading() {
  const visible = computed(() => loadingSet.value.size > 0)

  function show(): number {
    const id = ++uid
    const next = new Set(loadingSet.value)
    next.add(id)
    loadingSet.value = next
    return id
  }

  function hide(id?: number) {
    if (id !== undefined) {
      const next = new Set(loadingSet.value)
      next.delete(id)
      loadingSet.value = next
    } else {
      loadingSet.value = new Set()
    }
  }

  /** 一键清空（用于页面跳转等场景兜底） */
  function clearAll() {
    loadingSet.value = new Set()
  }

  return { visible, show, hide, clearAll }
}
