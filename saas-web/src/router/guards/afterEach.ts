import { nextTick } from 'vue'
import { useSettingStore } from '@/store/modules/setting'
import { Router } from 'vue-router'
import NProgress from 'nprogress'
import { useCommon } from '@/hooks/core/useCommon'
import { loadingService } from '@/utils/ui'
import { getPendingLoading, resetPendingLoading } from './beforeEach'
import { reportPerformance } from '@/utils/monitor/monitor'

/** 路由全局后置守卫 */
export function setupAfterEachGuard(router: Router) {
  const { scrollToTop } = useCommon()

  router.afterEach((to, from) => {
    scrollToTop()

    const settingStore = useSettingStore()
    if (settingStore.showNprogress) {
      NProgress.done()
      setTimeout(() => {
        NProgress.remove()
      }, 600)
    }

    if (getPendingLoading()) {
      nextTick(() => {
        loadingService.hideLoading()
        resetPendingLoading()
      })
    }

    const fromRoute = from.fullPath
    const toRoute = to.fullPath
    if (fromRoute !== toRoute) {
      reportPerformance({
        type: 'route',
        name: to.name as string,
        url: toRoute
      })
    }
  })
}
