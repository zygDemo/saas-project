import type { AppRouteRecord } from '@/types/router'

export const privateRoutes: AppRouteRecord[] = [
  {
    path: '/system/user-center',
    name: 'UserCenter',
    component: '/system/user-center',
    meta: {
      title: 'menus.system.userCenter',
      icon: 'ri:user-line',
      isHide: true,
      keepAlive: true,
      isHideTab: true
    }
  }
]
