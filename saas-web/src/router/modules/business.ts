import { AppRouteRecord } from '@/types/router'

const businessPage = '/business/common-list'
const roles = ['R_SUPER', 'R_ADMIN', 'R_SALES_MANAGER', 'R_SALES', 'R_APPROVER', 'R_FINANCE']

function applicationRoute(
  path: string,
  name: string,
  title: string,
  icon: string,
  currentNode?: number,
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
      businessModule: 'application',
      defaultQuery: currentNode ? { currentNode } : undefined
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
    {
      path: 'lead',
      name: 'BusinessLead',
      component: businessPage,
      meta: {
        title: '线索管理',
        icon: 'ri:customer-service-2-line',
        keepAlive: true,
        roles,
        businessModule: 'lead'
      }
    },
    applicationRoute('pre-entry', 'BusinessPreEntry', '预审进件', 'ri:file-edit-line', 1100),
    applicationRoute('risk-pre', 'BusinessRiskPre', '风控模型预审', 'ri:robot-2-line', 2000, [
      'R_SUPER',
      'R_ADMIN',
      'R_APPROVER'
    ]),
    applicationRoute('funder-pre', 'BusinessFunderPre', '资方预审', 'ri:bank-card-line', 3000),
    applicationRoute('supplement', 'BusinessSupplement', '资料补充', 'ri:folder-upload-line', 4000),
    applicationRoute('first-review', 'BusinessFirstReview', '风控初审', 'ri:shield-check-line', 5000, [
      'R_SUPER',
      'R_ADMIN',
      'R_APPROVER'
    ]),
    applicationRoute('final-review', 'BusinessFinalReview', '风控终审', 'ri:verified-badge-line', 6000, [
      'R_SUPER',
      'R_ADMIN',
      'R_APPROVER'
    ]),
    applicationRoute('loan-request', 'BusinessLoanRequest', '请款资料', 'ri:file-paper-2-line', 7000, [
      'R_SUPER',
      'R_ADMIN',
      'R_FINANCE',
      'R_SALES_MANAGER'
    ]),
    applicationRoute('funder-final', 'BusinessFunderFinal', '资方终审', 'ri:bank-line', 8000),
    applicationRoute('disbursement-node', 'BusinessDisbursementNode', '资方放款', 'ri:money-cny-circle-line', 9000, [
      'R_SUPER',
      'R_ADMIN',
      'R_FINANCE'
    ]),
    applicationRoute('application', 'BusinessApplication', '全部进件', 'ri:file-list-3-line'),
    {
      path: 'customer',
      name: 'BusinessCustomer',
      component: businessPage,
      meta: {
        title: '客户管理',
        icon: 'ri:user-heart-line',
        keepAlive: true,
        roles,
        businessModule: 'customer'
      }
    },
    {
      path: 'approval',
      name: 'BusinessApproval',
      component: businessPage,
      meta: {
        title: '审批记录',
        icon: 'ri:history-line',
        keepAlive: true,
        roles,
        businessModule: 'approval'
      }
    },
    {
      path: 'signing',
      name: 'BusinessSigning',
      component: businessPage,
      meta: {
        title: '签约管理',
        icon: 'ri:contract-line',
        keepAlive: true,
        roles,
        businessModule: 'signing'
      }
    },
    {
      path: 'disbursement',
      name: 'BusinessDisbursement',
      component: businessPage,
      meta: {
        title: '放款管理',
        icon: 'ri:money-cny-circle-line',
        keepAlive: true,
        roles,
        businessModule: 'disbursement'
      }
    },
    {
      path: 'repayment',
      name: 'BusinessRepayment',
      component: businessPage,
      meta: {
        title: '还款管理',
        icon: 'ri:refund-2-line',
        keepAlive: true,
        roles,
        businessModule: 'repayment'
      }
    },
    {
      path: 'product',
      name: 'BusinessProduct',
      component: businessPage,
      meta: {
        title: '产品管理',
        icon: 'ri:box-3-line',
        keepAlive: true,
        roles,
        businessModule: 'product'
      }
    },
    {
      path: 'funder',
      name: 'BusinessFunder',
      component: businessPage,
      meta: {
        title: '资方管理',
        icon: 'ri:bank-line',
        keepAlive: true,
        roles,
        businessModule: 'funder'
      }
    },
    {
      path: 'flow-config',
      name: 'BusinessFlowConfig',
      component: '/business/flow-config',
      meta: {
        title: '流程与规则',
        icon: 'ri:git-branch-line',
        keepAlive: true,
        roles,
        businessModule: 'flow-config'
      }
    },
    {
      path: 'org',
      name: 'BusinessOrg',
      component: businessPage,
      meta: {
        title: '机构管理',
        icon: 'ri:building-2-line',
        keepAlive: true,
        roles,
        businessModule: 'org'
      }
    },
    {
      path: 'dept',
      name: 'BusinessDept',
      component: businessPage,
      meta: {
        title: '部门管理',
        icon: 'ri:organization-chart',
        keepAlive: true,
        roles,
        businessModule: 'dept'
      }
    }
  ]
}

