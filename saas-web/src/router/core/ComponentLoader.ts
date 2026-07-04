/**
 * 组件加载器
 *
 * 负责动态加载 Vue 组件
 *
 * @module router/core/ComponentLoader
 * @author Art Design Pro Team
 */

import { h, type Component } from 'vue'
import { router } from '@/router'

/** Module shape returned by Vite's import.meta.glob for .vue files */
type VueModule = { default: Component }

export class ComponentLoader {
  private modules: Record<string, () => Promise<{ default: unknown }>>

  constructor() {
    // 动态导入 views 目录下所有 .vue 组件
    this.modules = import.meta.glob('../../views/**/*.vue')
  }

  /**
   * 加载组件
   */
  load(componentPath: string): () => Promise<{ default: unknown }> {
    if (!componentPath) {
      return this.createEmptyComponent()
    }

    // 构建可能的路径
    const fullPath = `../../views${componentPath}.vue`
    const fullPathWithIndex = `../../views${componentPath}/index.vue`

    // 先尝试直接路径，再尝试添加/index的路径
    const module = this.modules[fullPath] || this.modules[fullPathWithIndex]

    if (!module) {
      console.error(
        `[ComponentLoader] 未找到组件: ${componentPath}，尝试过的路径: ${fullPath} 和 ${fullPathWithIndex}`
      )
      return this.createErrorComponent(componentPath)
    }

    return module
  }

  /**
   * 加载布局组件
   */
  loadLayout(): () => Promise<{ default: unknown }> {
    return () => import('@/views/index/index.vue')
  }

  /**
   * 加载 iframe 组件
   */
  loadIframe(): () => Promise<{ default: unknown }> {
    return () => import('@/views/outside/Iframe.vue')
  }

  /**
   * 创建空组件
   */
  private createEmptyComponent(): () => Promise<{ default: unknown }> {
    return () =>
      Promise.resolve({
        render() {
          return hRouteFallback()
        }
      })
  }

  /**
   * 创建错误提示组件
   */
  private createErrorComponent(componentPath: string): () => Promise<{ default: unknown }> {
    return () =>
      Promise.resolve({
        render() {
          return hRouteFallback(componentPath)
        }
      })
  }
}

function hRouteFallback(componentPath?: string) {
  const goHome = () => {
    router.push('/dashboard')
  }

  const goBack = () => {
    if (window.history.length > 1) {
      window.history.back()
      return
    }

    goHome()
  }

  return h('div', { class: 'route-fallback', style: fallbackPageStyle }, [
    h('div', { style: fallbackPanelStyle }, [
      h('div', { style: fallbackIconStyle }, '!'),
      h('h2', { style: fallbackTitleStyle }, '页面暂未配置'),
      h(
        'p',
        { style: fallbackTextStyle },
        componentPath
          ? `组件路径不存在或尚未创建：${componentPath}`
          : '当前菜单还没有配置可渲染的页面组件。'
      ),
      h('div', { style: fallbackActionsStyle }, [
        h(
          'button',
          {
            type: 'button',
            onClick: goBack,
            style: fallbackButtonStyle('default')
          },
          '返回上一页'
        ),
        h(
          'button',
          {
            type: 'button',
            onClick: goHome,
            style: fallbackButtonStyle('primary')
          },
          '返回首页'
        )
      ])
    ])
  ])
}

const fallbackPageStyle = {
  minHeight: 'calc(100vh - 140px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '48px 24px'
}

const fallbackPanelStyle = {
  width: 'min(520px, 100%)',
  padding: '32px',
  border: '1px solid var(--el-border-color-lighter)',
  borderRadius: '8px',
  background: 'var(--el-bg-color)',
  boxShadow: 'var(--el-box-shadow-light)',
  textAlign: 'center'
}

const fallbackIconStyle = {
  width: '56px',
  height: '56px',
  margin: '0 auto 18px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'var(--el-color-warning-light-9)',
  color: 'var(--el-color-warning)',
  fontSize: '28px',
  fontWeight: '700'
}

const fallbackTitleStyle = {
  margin: '0 0 10px',
  color: 'var(--el-text-color-primary)',
  fontSize: '20px',
  fontWeight: '600'
}

const fallbackTextStyle = {
  margin: '0 0 24px',
  color: 'var(--el-text-color-secondary)',
  fontSize: '14px',
  lineHeight: '1.7'
}

const fallbackActionsStyle = {
  display: 'flex',
  justifyContent: 'center',
  gap: '12px',
  flexWrap: 'wrap'
}

function fallbackButtonStyle(type: 'default' | 'primary') {
  const isPrimary = type === 'primary'

  return {
    height: '36px',
    padding: '0 18px',
    border: `1px solid ${isPrimary ? 'var(--el-color-primary)' : 'var(--el-border-color)'}`,
    borderRadius: '4px',
    background: isPrimary ? 'var(--el-color-primary)' : 'var(--el-bg-color)',
    color: isPrimary ? '#fff' : 'var(--el-text-color-regular)',
    cursor: 'pointer',
    fontSize: '14px'
  }
}
