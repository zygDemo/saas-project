import { AppRouteRecord } from '@/types/router'

const businessPage = '/business/common-list'
const roles = [
  'R_SUPER',
  'R_ADMIN',
  'R_SALES_MANAGER',
  'R_SALES',
  'R_APPROVER',
  'R_FINANCE',
  'R_CS_COLLECTION'
]

function orderPhaseRoute(
  path: string,
  name: string,
  title: string,
  icon: string,
  phaseCode: number,
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
      businessModule: name,
      defaultQuery: { phaseCode }
    }
  }
}

export const businessRoutes: AppRouteRecord = {
  path: '/business',
  name: 'Business',
  component: '/index/index',
  meta: {
    title: '车贷业务',
    icon: 'ri:briefcase-4-line',
    roles
  },
  children: [
    orderPhaseRoute('lead', 'Lead', '线索管理', 'ri:user-search-line', 900, [
      'R_SUPER',
      'R_ADMIN',
      'R_SALES_MANAGER',
      'R_SALES'
    ]),
    orderPhaseRoute('precheck', 'BusinessPrecheck', '预审阶段', 'ri:file-search-line', 1000, [
      'R_SUPER',
      'R_ADMIN',
      'R_SALES_MANAGER',
      'R_SALES'
    ]),
    orderPhaseRoute('supplement', 'BusinessSupplement', '补件阶段', 'ri:folder-upload-line', 1300, [
      'R_SUPER',
      'R_ADMIN',
      'R_SALES_MANAGER',
      'R_SALES'
    ]),
    orderPhaseRoute('risk-approval', 'BusinessRiskApproval', '风控审批', 'ri:shield-check-line', 1400, [
      'R_SUPER',
      'R_ADMIN',
      'R_APPROVER'
    ]),
    orderPhaseRoute('funder-final', 'BusinessFunderFinal', '资方终审', 'ri:bank-line', 1500, [
      'R_SUPER',
      'R_ADMIN',
      'R_APPROVER',
      'R_SALES_MANAGER'
    ]),
    orderPhaseRoute('signing', 'BusinessSigning', '客户签约', 'ri:contract-line', 1600, [
      'R_SUPER',
      'R_ADMIN',
      'R_SALES_MANAGER',
      'R_SALES',
      'R_FINANCE'
    ]),
    orderPhaseRoute('disbursement', 'BusinessDisbursement', '请款放款', 'ri:money-cny-circle-line', 1700, [
      'R_SUPER',
      'R_ADMIN',
      'R_FINANCE',
      'R_SALES_MANAGER'
    ]),
    orderPhaseRoute('post-loan', 'BusinessPostLoan', '贷后阶段', 'ri:refund-2-line', 1900, [
      'R_SUPER',
      'R_ADMIN',
      'R_FINANCE',
      'R_CS_COLLECTION'
    ]),
    orderPhaseRoute('reports', 'Reports', '报表统计', 'ri:bar-chart-box-line', 1900, [
      'R_SUPER',
      'R_ADMIN',
      'R_FINANCE',
      'R_SALES_MANAGER'
    ]),
    {
      path: 'order-query',
      name: 'BusinessOrderQuery',
      component: businessPage,
      meta: {
        title: '综合查询',
        icon: 'ri:search-eye-line',
        keepAlive: true,
        roles,
        businessModule: 'order-query',
        defaultQuery: { phaseCode: 1000 }
      }
    }
  ]
}
