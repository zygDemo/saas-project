import { AppRouteRecord } from '@/types/router'

const businessPage = '/business/common-list'
const roles = ['R_SUPER', 'R_ADMIN', 'R_SALES_MANAGER', 'R_SALES', 'R_APPROVER', 'R_FINANCE']

function customerRoute(
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

export const customerRoutes: AppRouteRecord = {
  path: '/customer-mgmt',
  name: 'CustomerMgmt',
  component: '/index/index',
  meta: {
    title: '客户管理',
    icon: 'ri:user-star-line',
    roles
  },
  children: [
    customerRoute('lead', 'LeadManage', '线索管理', 'ri:contacts-line', 'lead'),
    customerRoute('customer', 'CustomerManage', '客户档案', 'ri:user-3-line', 'customer')
  ]
}
