import { AppRouteRecord } from '@/types/router'

const businessPage = '/business/common-list'
const roles = ['R_SUPER', 'R_ADMIN', 'R_OPERATION']

function orgConfigRoute(
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
    component: module === 'flow-config' ? '/business/flow-config' : businessPage,
    meta: {
      title,
      icon,
      keepAlive: true,
      roles: visibleRoles,
      businessModule: module
    }
  }
}

export const orgConfigRoutes: AppRouteRecord = {
  path: '/org-config',
  name: 'OrgConfigRoot',
  component: '/index/index',
  meta: {
    title: '机构配置',
    icon: 'ri:building-4-line',
    roles
  },
  children: [
    orgConfigRoute('org', 'Org', '业务机构管理', 'ri:building-line', 'org'),
    orgConfigRoute('dept', 'Dept', '部门管理', 'ri:organization-chart', 'dept'),
    orgConfigRoute('product', 'Product', '产品配置', 'ri:file-list-line', 'product'),
    orgConfigRoute('funder', 'Funder', '资方配置', 'ri:bank-line', 'funder'),
    orgConfigRoute('flow-config', 'FlowConfig', '流程与规则', 'ri:git-branch-line', 'flow-config')
  ]
}
