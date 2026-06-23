import { AppRouteRecord } from '@/types/router'

const roles = ['R_SUPER', 'R_ADMIN']

export const dataCenterRoutes: AppRouteRecord = {
  path: '/data-center',
  name: 'DataCenter',
  component: '/index/index',
  meta: {
    title: 'menus.dataCenter.title',
    icon: 'ri:database-2-line',
    roles
  },
  children: [
    {
      path: 'stats',
      name: 'DataStats',
      component: '/data-center/stats',
      meta: {
        title: 'menus.dataCenter.stats',
        icon: 'ri:bar-chart-grouped-line',
        keepAlive: true,
        roles
      }
    },
    {
      path: 'audit-log',
      name: 'AuditLog',
      component: '/data-center/audit-log',
      meta: {
        title: 'menus.dataCenter.auditLog',
        icon: 'ri:file-shield-line',
        keepAlive: true,
        roles
      }
    }
  ]
}
