import { AppRouteRecord } from '@/types/router'

const businessPage = '/business/common-list'
const roles = ['R_SUPER', 'R_ADMIN', 'R_SALES_MANAGER', 'R_SALES', 'R_APPROVER', 'R_FINANCE']

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
      businessModule: 'order-query',
      defaultQuery: { phaseCode }
    }
  }
}

export const businessRoutes: AppRouteRecord = {
  path: '/business',
  name: 'Business',
  component: '/index/index',
  meta: {
    title: '业务管理',
    icon: 'ri:briefcase-4-line',
    roles
  },
  children: [
    orderPhaseRoute('precheck', 'BusinessPrecheck', '预审阶段', 'ri:file-search-line', 1000),
    orderPhaseRoute('supplement', 'BusinessSupplement', '补件阶段', 'ri:folder-upload-line', 1400),
    orderPhaseRoute('risk-approval', 'BusinessRiskApproval', '风控审批', 'ri:shield-check-line', 2000, [
      'R_SUPER',
      'R_ADMIN',
      'R_APPROVER'
    ]),
    orderPhaseRoute('funder-final', 'BusinessFunderFinal', '资方终审', 'ri:bank-line', 3000),
    orderPhaseRoute('signing', 'BusinessSigning', '客户签约', 'ri:contract-line', 4000),
    orderPhaseRoute('disbursement', 'BusinessDisbursement', '请款放款', 'ri:money-cny-circle-line', 5000, [
      'R_SUPER',
      'R_ADMIN',
      'R_FINANCE',
      'R_SALES_MANAGER'
    ])
  ]
}
