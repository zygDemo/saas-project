import { AppRouteRecord } from '@/types/router'

const businessPage = '/business/common-list'
const roles = ['R_SUPER', 'R_ADMIN', 'R_SALES_MANAGER', 'R_SALES', 'R_APPROVER', 'R_FINANCE']

function baseDataRoute(
  path: string,
  name: string,
  title: string,
  icon: string,
  module: string,
  visibleRoles = roles
): AppRouteRecord {
  return {
    path,
    name,
    component: businessPage,
    meta: {
      title,
      icon,
      keepAlive: true,
      roles: visibleRoles,
      businessModule: module
    }
  }
}

export const baseDataRoutes: AppRouteRecord = {
  path: '/base-data',
  name: 'BaseData',
  component: '/index/index',
  meta: {
    title: '基础数据',
    icon: 'ri:database-2-line',
    roles
  },
  children: [
    baseDataRoute('org', 'OrgManage', '机构管理', 'ri:building-2-line', 'org', [
      'R_SUPER',
      'R_ADMIN'
    ]),
    baseDataRoute('dept', 'DeptManage', '部门管理', 'ri:team-line', 'dept', ['R_SUPER', 'R_ADMIN']),
    baseDataRoute('product', 'ProductManage', '产品管理', 'ri:product-hunt-line', 'product'),
    baseDataRoute('funder', 'FunderManage', '资方管理', 'ri:bank-line', 'funder'),
    baseDataRoute('flow-config', 'FlowConfig', '流程配置', 'ri:flow-chart', 'flow-config', [
      'R_SUPER',
      'R_ADMIN'
    ])
  ]
}
