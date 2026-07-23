import { AppRouteRecord } from '@/types/router'

const roles = ['R_SUPER', 'R_ADMIN', 'R_OPERATION']
const superAdminRoles = ['R_SUPER']

export const operationCenterRoutes: AppRouteRecord = {
  path: '/operation-center',
  name: 'OperationCenter',
  component: '/index/index',
  meta: {
    title: '运营中心',
    icon: 'ri:service-line',
    roles
  },
  children: [
    {
      path: 'file',
      name: 'FileManage',
      component: '/system/file',
      meta: { title: '文件管理', icon: 'ri:file-list-3-line', keepAlive: true, roles }
    },
    {
      path: 'file-config',
      name: 'FileConfig',
      component: '/system/file-config',
      meta: { title: '文件存储配置', icon: 'ri:hard-drive-2-line', keepAlive: true, roles }
    },
    {
      path: 'msg-template',
      name: 'MsgTemplate',
      component: '/business/common-list',
      meta: {
        title: '消息模板',
        icon: 'ri:mail-send-line',
        keepAlive: true,
        roles,
        businessModule: 'msg-template'
      }
    },
    {
      path: 'notice',
      name: 'Notice',
      component: '/system/announcement',
      meta: { title: '公告管理', icon: 'ri:notification-line', keepAlive: true, roles }
    },
    {
      path: 'work-order',
      name: 'SystemWorkOrder',
      component: '/system/work-order',
      meta: {
        title: '系统工单管理',
        icon: 'ri:customer-service-2-line',
        keepAlive: true,
        roles: superAdminRoles
      }
    },
    {
      path: 'notification-log',
      name: 'NotificationLog',
      component: '/operation-center/notification-log',
      meta: {
        title: '通知日志',
        icon: 'ri:mail-check-line',
        keepAlive: true,
        roles
      }
    }
  ]
}
