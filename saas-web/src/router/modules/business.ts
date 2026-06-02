import { AppRouteRecord } from '@/types/router'

const businessPage = '/business/common-list'
const roles = ['R_SUPER', 'R_ADMIN', 'R_SALES_MANAGER', 'R_SALES', 'R_APPROVER', 'R_FINANCE']

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
      path: 'application',
      name: 'BusinessApplication',
      component: businessPage,
      meta: {
        title: '进件管理',
        icon: 'ri:file-list-3-line',
        keepAlive: true,
        roles,
        businessModule: 'application'
      }
    },
    {
      path: 'approval',
      name: 'BusinessApproval',
      component: businessPage,
      meta: {
        title: '审批管理',
        icon: 'ri:shield-check-line',
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
    }
  ]
}
