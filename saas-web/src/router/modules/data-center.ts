import { AppRouteRecord } from '@/types/router'

const roles = ['R_SUPER', 'R_ADMIN', 'R_OPERATION']

export const dataCenterRoutes: AppRouteRecord = {
  path: '/datacenter',
  name: 'DataCenter',
  component: '/index/index',
  meta: {
    title: '数据中心',
    icon: 'ri:bar-chart-box-line',
    roles
  },
  children: [
    {
      path: 'stats',
      name: 'DataStats',
      component: '/data-center/stats',
      meta: {
        title: '数据统计',
        icon: 'ri:bar-chart-line',
        keepAlive: true,
        roles
      }
    },
    {
      path: 'audit-log',
      name: 'AuditLog',
      component: '/data-center/audit-log',
      meta: {
        title: '日志审计',
        icon: 'ri:file-list-3-line',
        keepAlive: true,
        roles
      }
    }
  ]
}
