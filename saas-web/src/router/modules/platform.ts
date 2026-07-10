import { AppRouteRecord } from '@/types/router'

const businessPage = '/business/common-list'
const roles = ['R_SUPER', 'R_OPERATION']

function platformRoute(
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

export const platformRoutes: AppRouteRecord = {
  path: '/platform',
  name: 'Platform',
  component: '/index/index',
  meta: {
    title: '平台管理',
    icon: 'ri:global-line',
    roles
  },
  children: [
    platformRoute('tenant', 'TenantMgmt', '租户机构管理', 'ri:building-2-line', 'tenant'),
    platformRoute(
      'package-billing',
      'PackageBilling',
      '套餐与计费',
      'ri:money-dollar-circle-line',
      'package-billing'
    ),
    platformRoute(
      'product-template',
      'ProductTemplate',
      '产品与资方模板',
      'ri:file-copy-line',
      'product-template'
    ),
    platformRoute(
      'supervision',
      'PlatformSupervision',
      '平台业务监管',
      'ri:eye-line',
      'supervision'
    ),
    platformRoute(
      'third-party',
      'ThirdPartyService',
      '第三方服务管理',
      'ri:plug-line',
      'third-party'
    ),
    platformRoute(
      'work-order',
      'WorkOrder',
      '运营工单中心',
      'ri:customer-service-2-line',
      'work-order'
    )
  ]
}
