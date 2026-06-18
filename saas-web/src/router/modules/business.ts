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
    orderPhaseRoute('lead', 'Lead', '线索管理', 'ri:user-search-line', 900),
    orderPhaseRoute('pre-review', 'PreReview', '预审阶段', 'ri:file-search-line', 1000),
    orderPhaseRoute('supplement', 'Supplement', '补件阶段', 'ri:folder-upload-line', 1300),
    orderPhaseRoute('approval', 'Approval', '风控审批', 'ri:shield-check-line', 1400, [
      'R_SUPER',
      'R_ADMIN',
      'R_APPROVER'
    ]),
    orderPhaseRoute('funder-review', 'FunderReview', '资方终审', 'ri:bank-line', 1500),
    orderPhaseRoute('signing', 'Signing', '签约阶段', 'ri:contract-line', 1600),
    orderPhaseRoute('disbursement', 'Disbursement', '请款放款', 'ri:money-cny-circle-line', 1700, [
      'R_SUPER',
      'R_ADMIN',
      'R_FINANCE',
      'R_SALES_MANAGER'
    ]),
    orderPhaseRoute('post-loan', 'PostLoan', '贷后阶段', 'ri:refund-2-line', 1900, [
      'R_SUPER',
      'R_ADMIN',
      'R_FINANCE',
      'R_CS_COLLECTION',
      'R_SALES_MANAGER'
    ]),
    orderPhaseRoute('reports', 'Reports', '报表统计', 'ri:bar-chart-box-line', 1900, [
      'R_SUPER',
      'R_ADMIN',
      'R_FINANCE',
      'R_CS_COLLECTION',
      'R_SALES_MANAGER'
    ])
  ]
}
