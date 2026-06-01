import { PrismaClient, UserStatus } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const statusMap: Record<string, UserStatus> = {
  Super: UserStatus.ONLINE,
  Admin: UserStatus.ONLINE,
  Operator: UserStatus.ONLINE,
  CS: UserStatus.ONLINE
}

async function main() {
  // 创建默认租户
  const tenant = await prisma.tenant.upsert({
    where: { code: 'default' },
    update: {},
    create: { name: 'Default Tenant', code: 'default' }
  })

  const passwordHash = await bcrypt.hash('123456', 10)

  // 创建角色（含车贷 SaaS 业务角色）
  const roleDefs = [
    { name: 'Super Admin', code: 'R_SUPER', description: '平台超级管理员，全平台管理', dataScope: 'ALL' },
    { name: 'Admin', code: 'R_ADMIN', description: '机构管理员', dataScope: 'ALL' },
    { name: 'Platform Operator', code: 'R_OPERATION', description: '平台运营', dataScope: 'ALL' },
    { name: 'Sales Manager', code: 'R_SALES_MANAGER', description: '部门经理/团队负责人', dataScope: 'DEPT' },
    { name: 'Sales', code: 'R_SALES', description: '业务员/客户经理', dataScope: 'SELF' },
    { name: 'Approver', code: 'R_APPROVER', description: '风控审批员', dataScope: 'ALL' },
    { name: 'Finance', code: 'R_FINANCE', description: '财务人员', dataScope: 'ALL' },
    { name: 'CS & Collection', code: 'R_CS_COLLECTION', description: '客服/催收', dataScope: 'ALL' },
    { name: 'User', code: 'R_USER', description: '普通用户，仅移动端操作权限', dataScope: 'SELF' }
  ]

  const roles = await Promise.all(
    roleDefs.map((role) =>
      prisma.role.upsert({
        where: { tenantId_code: { tenantId: tenant.id, code: role.code } },
        update: role,
        create: { ...role, tenantId: tenant.id }
      })
    )
  )

  const roleByCode = Object.fromEntries(roles.map((role) => [role.code, role]))

  // 创建默认用户
  const userDefs = [
    { userName: 'Super', nickName: 'Super Admin', email: 'super@example.com', phone: '13800000001', gender: 'Male', roleCode: 'R_SUPER' },
    { userName: 'Admin', nickName: 'Admin', email: 'admin@example.com', phone: '13800000002', gender: 'Female', roleCode: 'R_ADMIN' },
    { userName: 'Operator', nickName: 'Operator', email: 'operator@example.com', phone: '13800000007', gender: 'Unknown', roleCode: 'R_OPERATION' },
    { userName: 'Sales', nickName: 'Sales', email: 'sales@example.com', phone: '13800000003', gender: 'Unknown', roleCode: 'R_SALES' },
    { userName: 'Approver', nickName: 'Approver', email: 'approver@example.com', phone: '13800000004', gender: 'Unknown', roleCode: 'R_APPROVER' },
    { userName: 'Finance', nickName: 'Finance', email: 'finance@example.com', phone: '13800000005', gender: 'Unknown', roleCode: 'R_FINANCE' },
    { userName: 'CS', nickName: 'CS', email: 'cs@example.com', phone: '13800000006', gender: 'Unknown', roleCode: 'R_CS_COLLECTION' },
    { userName: 'User', nickName: 'User', email: 'user@example.com', phone: '13800000008', gender: 'Unknown', roleCode: 'R_USER' }
  ]

  await Promise.all(
    userDefs.map(async (user) => {
      const saved = await prisma.user.upsert({
        where: { tenantId_userName: { tenantId: tenant.id, userName: user.userName } },
        update: {
          nickName: user.nickName,
          email: user.email,
          phone: user.phone,
          gender: user.gender,
          status: statusMap[user.userName as keyof typeof statusMap] ?? UserStatus.ONLINE,
          passwordHash
        },
        create: {
          tenantId: tenant.id,
          userName: user.userName,
          nickName: user.nickName,
          email: user.email,
          phone: user.phone,
          gender: user.gender,
          status: statusMap[user.userName as keyof typeof statusMap] ?? UserStatus.ONLINE,
          passwordHash
        }
      })

      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: saved.id, roleId: roleByCode[user.roleCode].id } },
        update: {},
        create: { userId: saved.id, roleId: roleByCode[user.roleCode].id }
      })
    })
  )

  // 创建菜单（系统菜单 + 车贷 SaaS 业务菜单）
  const menus = await seedAllMenus(tenant.id)

  // 分配菜单权限给角色（按 PRD 角色菜单树）
  const filterIds = (...names: string[]) => menus.filter((m) => names.includes(m.name)).map((m) => m.id)

  // 公共：所有角色都有仪表盘工作台
  const dashIds = filterIds('Dashboard', 'Console', 'Analysis')

  // 平台管理菜单
  const platformIds = filterIds('Platform', 'TenantMgmt', 'PackageBilling', 'ProductTemplate', 'PlatformSupervision', 'ThirdPartyService', 'WorkOrder')
  // 数据中心
  const dataCenterIds = filterIds('DataCenter', 'DataStats', 'AuditLog')
  // 系统管理
  const systemFullIds = filterIds('System', 'User', 'Role', 'Menus', 'DictMgmt', 'RegionMgmt', 'FileConfig', 'MsgTemplate', 'SysParam', 'Notice', 'UserCenter')
  const systemBasicIds = filterIds('System', 'User', 'Role', 'Menus', 'UserCenter')
  // 业务管理 - 全部
  const bizAllIds = filterIds('Business', 'Org', 'Dept', 'Product', 'Funder', 'FlowConfig',
    'Lead', 'Customer', 'Application', 'Approval', 'Signing', 'Disbursement', 'OrderMgmt', 'Repayment', 'PawnBusiness', 'Reports', 'OrgConfig')
  // 业务管理 - 核心进件流程
  const bizCoreIds = filterIds('Business', 'Lead', 'Customer', 'Application', 'Signing')
  // 业务管理 - 审批相关
  const bizApprovalIds = filterIds('Business', 'Application', 'Approval')
  // 业务管理 - 财务相关
  const bizFinanceIds = filterIds('Business', 'Disbursement', 'OrderMgmt', 'Repayment', 'Reports')
  // 业务管理 - 客服催收相关
  const bizCsIds = filterIds('Business', 'Customer', 'Repayment', 'Reports')
  // 业务管理 - 经理视角（线索分配 + 业务跟进 + 团队统计）
  const bizManagerIds = filterIds('Business', 'Org', 'Dept', 'FlowConfig',
    'Lead', 'Customer', 'Application', 'Approval', 'Signing', 'Disbursement', 'OrderMgmt', 'Repayment', 'Reports')
  // 业务管理 - 机构管理员（全业务模块）
  const bizAdminIds = filterIds('Business', 'Org', 'Dept', 'Product', 'Funder', 'FlowConfig',
    'Lead', 'Customer', 'Application', 'Approval', 'Signing', 'Disbursement', 'OrderMgmt', 'Repayment', 'PawnBusiness', 'Reports', 'OrgConfig')

  // R_SUPER: 全部
  await connectRoleMenus(roleByCode.R_SUPER.id, menus.map((m) => m.id))
  // R_OPERATION: 仪表盘 + 平台管理（部分）+ 数据中心 + 公告 + 基础业务查看
  await connectRoleMenus(roleByCode.R_OPERATION.id, [...dashIds, ...platformIds, ...dataCenterIds, ...filterIds('Notice'), ...filterIds('Business', 'Lead', 'Customer', 'Application', 'Approval', 'Disbursement', 'Repayment'), ...filterIds('WorkOrder')])
  // R_ADMIN: 仪表盘 + 系统基础 + 全业务模块
  await connectRoleMenus(roleByCode.R_ADMIN.id, [...dashIds, ...systemBasicIds, ...bizAdminIds])
  // R_SALES_MANAGER: 仪表盘 + 业务经理视角
  await connectRoleMenus(roleByCode.R_SALES_MANAGER.id, [...dashIds, ...bizManagerIds])
  // R_SALES: 仪表盘 + 核心业务流程
  await connectRoleMenus(roleByCode.R_SALES.id, [...dashIds, ...bizCoreIds])
  // R_APPROVER: 仪表盘 + 审批相关
  await connectRoleMenus(roleByCode.R_APPROVER.id, [...dashIds, ...bizApprovalIds])
  // R_FINANCE: 仪表盘 + 财务相关
  await connectRoleMenus(roleByCode.R_FINANCE.id, [...dashIds, ...bizFinanceIds])
  // R_CS_COLLECTION: 仪表盘 + 客服催收视角
  await connectRoleMenus(roleByCode.R_CS_COLLECTION.id, [...dashIds, ...bizCsIds])
  // R_USER: 仅仪表盘（移动端操作权限，管理后台无业务菜单）
  await connectRoleMenus(roleByCode.R_USER.id, dashIds)

  await seedBusinessData(tenant.id)

  console.log('Seed completed.')
}

async function seedAllMenus(tenantId: number) {
  const bp = '/business/common-list'

  // ============== 仪表盘 ==============
  const dashboard = await upsertMenu(tenantId, { path: '/dashboard', name: 'Dashboard', component: '/index/index', title: '仪表盘', icon: 'ri:dashboard-line', sort: 10 })
  const consoleMenu = await upsertMenu(tenantId, { parentId: dashboard.id, path: 'console', name: 'Console', component: '/dashboard/console', title: '工作台', icon: 'ri:computer-line', sort: 11, keepAlive: true })
  const analysis = await upsertMenu(tenantId, { parentId: dashboard.id, path: 'analysis', name: 'Analysis', component: '/dashboard/analysis', title: '分析页', icon: 'ri:line-chart-line', sort: 12, keepAlive: true })

  // ============== 平台管理（超级管理员/平台运营） ==============
  const platform = await upsertMenu(tenantId, { path: '/platform', name: 'Platform', component: '/index/index', title: '平台管理', icon: 'ri:global-line', sort: 20 })
  const tenantMgmt = await upsertMenu(tenantId, { parentId: platform.id, path: 'tenant', name: 'TenantMgmt', component: bp, title: '租户机构管理', icon: 'ri:building-2-line', sort: 21, keepAlive: true })
  const packageBilling = await upsertMenu(tenantId, { parentId: platform.id, path: 'package-billing', name: 'PackageBilling', component: bp, title: '套餐与计费', icon: 'ri:money-dollar-circle-line', sort: 22, keepAlive: true })
  const productTemplate = await upsertMenu(tenantId, { parentId: platform.id, path: 'product-template', name: 'ProductTemplate', component: bp, title: '产品与资方模板', icon: 'ri:file-copy-line', sort: 23, keepAlive: true })
  const platformSupervision = await upsertMenu(tenantId, { parentId: platform.id, path: 'supervision', name: 'PlatformSupervision', component: bp, title: '平台业务监管', icon: 'ri:eye-line', sort: 24, keepAlive: true })
  const thirdPartyService = await upsertMenu(tenantId, { parentId: platform.id, path: 'third-party', name: 'ThirdPartyService', component: bp, title: '第三方服务管理', icon: 'ri:plug-line', sort: 25, keepAlive: true })
  const workOrder = await upsertMenu(tenantId, { parentId: platform.id, path: 'work-order', name: 'WorkOrder', component: bp, title: '运营工单中心', icon: 'ri:customer-service-2-line', sort: 26, keepAlive: true })

  // ============== 数据中心（超级管理员） ==============
  const dataCenter = await upsertMenu(tenantId, { path: '/datacenter', name: 'DataCenter', component: '/index/index', title: '数据中心', icon: 'ri:bar-chart-box-line', sort: 30 })
  const dataStats = await upsertMenu(tenantId, { parentId: dataCenter.id, path: 'stats', name: 'DataStats', component: bp, title: '数据统计', icon: 'ri:bar-chart-line', sort: 31, keepAlive: true })
  const auditLog = await upsertMenu(tenantId, { parentId: dataCenter.id, path: 'audit-log', name: 'AuditLog', component: bp, title: '日志审计', icon: 'ri:file-list-3-line', sort: 32, keepAlive: true })

  // ============== 系统管理 ==============
  const system = await upsertMenu(tenantId, { path: '/system', name: 'System', component: '/index/index', title: '系统管理', icon: 'ri:settings-3-line', sort: 40 })
  const user = await upsertMenu(tenantId, { parentId: system.id, path: 'user', name: 'User', component: '/system/user', title: '用户管理', icon: 'ri:user-line', sort: 41, keepAlive: true })
  const role = await upsertMenu(tenantId, { parentId: system.id, path: 'role', name: 'Role', component: '/system/role', title: '角色管理', icon: 'ri:user-settings-line', sort: 42, keepAlive: true })
  const menu = await upsertMenu(tenantId, { parentId: system.id, path: 'menu', name: 'Menus', component: '/system/menu', title: '菜单管理', icon: 'ri:menu-line', sort: 43, keepAlive: true })
  const dictMgmt = await upsertMenu(tenantId, { parentId: system.id, path: 'dict', name: 'DictMgmt', component: '/system/dict', title: '字典管理', icon: 'ri:book-open-line', sort: 44, keepAlive: true })
  const regionMgmt = await upsertMenu(tenantId, { parentId: system.id, path: 'region', name: 'RegionMgmt', component: bp, title: '地区管理', icon: 'ri:map-pin-line', sort: 45, keepAlive: true })
  const fileConfig = await upsertMenu(tenantId, { parentId: system.id, path: 'file-config', name: 'FileConfig', component: bp, title: '文件存储配置', icon: 'ri:hard-drive-2-line', sort: 46, keepAlive: true })
  const msgTemplate = await upsertMenu(tenantId, { parentId: system.id, path: 'msg-template', name: 'MsgTemplate', component: bp, title: '消息模板', icon: 'ri:mail-send-line', sort: 47, keepAlive: true })
  const sysParam = await upsertMenu(tenantId, { parentId: system.id, path: 'sys-param', name: 'SysParam', component: bp, title: '系统参数', icon: 'ri:settings-line', sort: 48, keepAlive: true })
  const notice = await upsertMenu(tenantId, { parentId: system.id, path: 'notice', name: 'Notice', component: bp, title: '公告管理', icon: 'ri:notification-line', sort: 49, keepAlive: true })
  const userCenter = await upsertMenu(tenantId, { parentId: system.id, path: 'user-center', name: 'UserCenter', component: '/system/user-center', title: '用户中心', icon: 'ri:user-line', sort: 50, keepAlive: true, hidden: true, hiddenTab: true })

  // ============== 业务管理 ==============
  const business = await upsertMenu(tenantId, { path: '/business', name: 'Business', component: '/index/index', title: '业务管理', icon: 'ri:briefcase-line', sort: 60 })
  const org = await upsertMenu(tenantId, { parentId: business.id, path: 'org', name: 'Org', component: bp, title: '机构管理', icon: 'ri:building-line', sort: 61, keepAlive: true })
  const dept = await upsertMenu(tenantId, { parentId: business.id, path: 'dept', name: 'Dept', component: bp, title: '部门管理', icon: 'ri:organization-chart', sort: 62, keepAlive: true })
  const product = await upsertMenu(tenantId, { parentId: business.id, path: 'product', name: 'Product', component: bp, title: '产品配置', icon: 'ri:file-list-line', sort: 63, keepAlive: true })
  const funder = await upsertMenu(tenantId, { parentId: business.id, path: 'funder', name: 'Funder', component: bp, title: '资方配置', icon: 'ri:bank-line', sort: 64, keepAlive: true })
  const flowConfig = await upsertMenu(tenantId, { parentId: business.id, path: 'flow-config', name: 'FlowConfig', component: bp, title: '流程与规则', icon: 'ri:git-branch-line', sort: 65, keepAlive: true })
  const lead = await upsertMenu(tenantId, { parentId: business.id, path: 'lead', name: 'Lead', component: bp, title: '线索管理', icon: 'ri:customer-service-line', sort: 66, keepAlive: true })
  const customer = await upsertMenu(tenantId, { parentId: business.id, path: 'customer', name: 'Customer', component: bp, title: '客户管理', icon: 'ri:contacts-line', sort: 67, keepAlive: true })
  const application = await upsertMenu(tenantId, { parentId: business.id, path: 'application', name: 'Application', component: bp, title: '进件管理', icon: 'ri:file-edit-line', sort: 68, keepAlive: true })
  const approval = await upsertMenu(tenantId, { parentId: business.id, path: 'approval', name: 'Approval', component: bp, title: '审批管理', icon: 'ri:shield-check-line', sort: 69, keepAlive: true })
  const signing = await upsertMenu(tenantId, { parentId: business.id, path: 'signing', name: 'Signing', component: bp, title: '签约管理', icon: 'ri:pen-nib-line', sort: 70, keepAlive: true })
  const disbursement = await upsertMenu(tenantId, { parentId: business.id, path: 'disbursement', name: 'Disbursement', component: bp, title: '放款管理', icon: 'ri:money-cny-circle-line', sort: 71, keepAlive: true })
  const orderMgmt = await upsertMenu(tenantId, { parentId: business.id, path: 'order', name: 'OrderMgmt', component: bp, title: '订单管理', icon: 'ri:file-list-2-line', sort: 72, keepAlive: true })
  const repayment = await upsertMenu(tenantId, { parentId: business.id, path: 'repayment', name: 'Repayment', component: bp, title: '还款管理', icon: 'ri:refund-line', sort: 73, keepAlive: true })
  const pawnBusiness = await upsertMenu(tenantId, { parentId: business.id, path: 'pawn', name: 'PawnBusiness', component: bp, title: '典当业务', icon: 'ri:swap-box-line', sort: 74, keepAlive: true })
  const reports = await upsertMenu(tenantId, { parentId: business.id, path: 'reports', name: 'Reports', component: bp, title: '报表统计', icon: 'ri:pie-chart-line', sort: 75, keepAlive: true })
  const orgConfig = await upsertMenu(tenantId, { parentId: business.id, path: 'org-config', name: 'OrgConfig', component: bp, title: '机构配置', icon: 'ri:tools-line', sort: 76, keepAlive: true })

  // 按钮权限
  const bizMenus = [tenantMgmt, packageBilling, productTemplate, platformSupervision, thirdPartyService, workOrder,
    dataStats, auditLog, org, dept, product, funder, flowConfig, lead, customer, application, approval, signing,
    disbursement, orderMgmt, repayment, pawnBusiness, reports, orgConfig, menu, dictMgmt, regionMgmt, msgTemplate, notice]
  for (const m of bizMenus) {
    for (const authMark of ['add', 'edit', 'delete']) {
      await prisma.permission.upsert({
        where: { tenantId_menuId_authMark: { tenantId, menuId: m.id, authMark } },
        update: { title: permissionTitle(authMark) },
        create: { tenantId, menuId: m.id, authMark, title: permissionTitle(authMark) }
      })
    }
  }

  return [
    dashboard, consoleMenu, analysis,
    platform, tenantMgmt, packageBilling, productTemplate, platformSupervision, thirdPartyService, workOrder,
    dataCenter, dataStats, auditLog,
    system, user, role, menu, dictMgmt, regionMgmt, fileConfig, msgTemplate, sysParam, notice, userCenter,
    business, org, dept, product, funder, flowConfig, lead, customer, application, approval, signing,
    disbursement, orderMgmt, repayment, pawnBusiness, reports, orgConfig
  ]
}

function permissionTitle(authMark: string) {
  return ({ add: 'Add', edit: 'Edit', delete: 'Delete' } as Record<string, string>)[authMark]
}

async function upsertMenu(
  tenantId: number,
  data: {
    parentId?: number
    path: string
    name: string
    component: string
    title: string
    icon: string
    sort: number
    keepAlive?: boolean
    hidden?: boolean
    hiddenTab?: boolean
  }
) {
  return prisma.menu.upsert({
    where: { tenantId_name: { tenantId, name: data.name } },
    update: data,
    create: { ...data, tenantId }
  })
}

async function connectRoleMenus(roleId: number, menuIds: number[]) {
  await Promise.all(
    menuIds.map((menuId) =>
      prisma.roleMenu.upsert({
        where: { roleId_menuId: { roleId, menuId } },
        update: {},
        create: { roleId, menuId }
      })
    )
  )
}

async function seedBusinessData(tenantId: number) {
  const [sales, approver, finance] = await Promise.all([
    prisma.user.findUnique({ where: { tenantId_userName: { tenantId, userName: 'Sales' } } }),
    prisma.user.findUnique({ where: { tenantId_userName: { tenantId, userName: 'Approver' } } }),
    prisma.user.findUnique({ where: { tenantId_userName: { tenantId, userName: 'Finance' } } })
  ])

  if (!sales || !approver || !finance) {
    throw new Error('Seed users are missing')
  }

  const org = await prisma.organization.upsert({
    where: { code: 'DEMO_ORG' },
    update: {
      tenantId,
      name: '示例车贷机构',
      contactName: '张经理',
      contactPhone: '13810000000',
      address: '北京市朝阳区示例路 100 号',
      status: 'ACTIVE',
      packageType: 'STANDARD',
      apiEnabled: true
    },
    create: {
      tenantId,
      name: '示例车贷机构',
      code: 'DEMO_ORG',
      creditCode: '91110000DEMO000001',
      contactName: '张经理',
      contactPhone: '13810000000',
      address: '北京市朝阳区示例路 100 号',
      status: 'ACTIVE',
      packageType: 'STANDARD',
      apiEnabled: true
    }
  })

  const dept = await prisma.department.upsert({
    where: { orgId_name: { orgId: org.id, name: '车贷业务一部' } },
    update: {
      tenantId,
      managerId: sales.id,
      sort: 1
    },
    create: {
      tenantId,
      orgId: org.id,
      name: '车贷业务一部',
      managerId: sales.id,
      sort: 1
    }
  })

  await prisma.user.update({
    where: { id: sales.id },
    data: { deptId: dept.id }
  })

  const productData = {
    tenantId,
    orgId: org.id,
    name: '标准车抵贷',
    productType: 'CAR_LOAN',
    minRate: 0.036,
    maxRate: 0.108,
    minAmount: 50000,
    maxAmount: 500000,
    minTerm: 6,
    maxTerm: 36,
    repaymentMethod: '等额本息',
    minAge: 22,
    maxAge: 60,
    maxCarAge: 8,
    maxMileage: 150000,
    ltvLimit: 0.8,
    minDownPayment: 0.2,
    regions: '北京,天津,河北',
    status: 'ACTIVE',
    fileChecklist: ['身份证', '行驶证', '登记证', '银行卡']
  }
  const existedProduct = await prisma.product.findFirst({
    where: { tenantId, orgId: org.id, name: productData.name }
  })
  const product = existedProduct
    ? await prisma.product.update({ where: { id: existedProduct.id }, data: productData })
    : await prisma.product.create({ data: productData })

  const funder = await prisma.funder.upsert({
    where: { orgId_code: { orgId: org.id, code: 'DEMO_BANK' } },
    update: {
      tenantId,
      name: '示例银行资金方',
      funderType: 'BANK',
      contactName: '李经理',
      contactPhone: '13810000001',
      priority: 1,
      status: 'ACTIVE'
    },
    create: {
      tenantId,
      orgId: org.id,
      name: '示例银行资金方',
      code: 'DEMO_BANK',
      funderType: 'BANK',
      contactName: '李经理',
      contactPhone: '13810000001',
      priority: 1,
      status: 'ACTIVE'
    }
  })

  const leadData = {
    tenantId,
    orgId: org.id,
    source: 'SELF',
    name: '王小明',
    phone: '13910000001',
    idCard: '110101199001010011',
    carBrand: '大众',
    carModel: '迈腾',
    loanAmount: 120000,
    remark: '客户计划置换经营周转资金',
    status: 'FOLLOWING',
    assigneeId: sales.id,
    createdBy: sales.id,
    nextFollowAt: new Date('2026-06-01T10:00:00+08:00')
  }
  const existedLead = await prisma.lead.findFirst({
    where: { tenantId, orgId: org.id, phone: leadData.phone }
  })
  const lead = existedLead
    ? await prisma.lead.update({ where: { id: existedLead.id }, data: leadData })
    : await prisma.lead.create({ data: leadData })

  const customer = await prisma.customer.upsert({
    where: { orgId_phone: { orgId: org.id, phone: '13910000001' } },
    update: {
      tenantId,
      name: '王小明',
      idCard: '110101199001010011',
      gender: 'MALE',
      companyName: '北京示例商贸有限公司',
      monthlyIncome: 28000,
      address: '北京市海淀区示例小区 8 号',
      emergencyName: '王女士',
      emergencyPhone: '13910000002',
      status: 'ACTIVE'
    },
    create: {
      tenantId,
      orgId: org.id,
      name: '王小明',
      phone: '13910000001',
      idCard: '110101199001010011',
      gender: 'MALE',
      companyName: '北京示例商贸有限公司',
      monthlyIncome: 28000,
      address: '北京市海淀区示例小区 8 号',
      emergencyName: '王女士',
      emergencyPhone: '13910000002',
      status: 'ACTIVE'
    }
  })

  const vehicle = await prisma.vehicle.findFirst({
    where: { customerId: customer.id, vin: 'Ldemo202605290001' }
  })
  const vehicleData = {
    customerId: customer.id,
    vin: 'Ldemo202605290001',
    plateNumber: '京A12345',
    brand: '大众',
    model: '迈腾',
    color: '黑色',
    year: 2021,
    mileage: 42000,
    purchasePrice: 210000,
    estimateValue: 160000,
    isMortgaged: false
  }
  if (vehicle) {
    await prisma.vehicle.update({
      where: { id: vehicle.id },
      data: vehicleData
    })
  } else {
    await prisma.vehicle.create({
      data: vehicleData
    })
  }

  const bankCard = await prisma.bankCard.findFirst({
    where: { customerId: customer.id, cardNo: '6222000000000000000' }
  })
  const bankCardData = {
    customerId: customer.id,
    bankName: '示例银行',
    cardNo: '6222000000000000000',
    cardType: '借记卡',
    isDefault: true
  }
  if (bankCard) {
    await prisma.bankCard.update({
      where: { id: bankCard.id },
      data: bankCardData
    })
  } else {
    await prisma.bankCard.create({
      data: bankCardData
    })
  }

  const contact = await prisma.customerContact.findFirst({
    where: { customerId: customer.id, phone: '13910000002' }
  })
  const contactData = {
    customerId: customer.id,
    name: '王女士',
    relation: '配偶',
    phone: '13910000002',
    address: '北京市海淀区示例小区 8 号',
    isEmergency: true
  }
  if (contact) {
    await prisma.customerContact.update({
      where: { id: contact.id },
      data: contactData
    })
  } else {
    await prisma.customerContact.create({
      data: contactData
    })
  }

  const followUp = await prisma.leadFollowUp.findFirst({
    where: { leadId: lead.id, content: '客户已提交车辆资料，准备转进件。' }
  })
  const followUpData = {
    leadId: lead.id,
    followType: 'PHONE',
    content: '客户已提交车辆资料，准备转进件。',
    nextFollowAt: new Date('2026-06-01T10:00:00+08:00'),
    createdBy: sales.id
  }
  if (followUp) {
    await prisma.leadFollowUp.update({
      where: { id: followUp.id },
      data: followUpData
    })
  } else {
    await prisma.leadFollowUp.create({
      data: followUpData
    })
  }

  const application = await prisma.application.upsert({
    where: { applicationNo: 'APP-DEMO-0001' },
    update: {
      tenantId,
      orgId: org.id,
      customerId: customer.id,
      productId: product.id,
      funderId: funder.id,
      amount: 120000,
      term: 24,
      rate: 0.068,
      repaymentMethod: '等额本息',
      purpose: '经营周转',
      status: 'PENDING_DISBURSEMENT',
      creatorId: sales.id,
      sourceLeadId: lead.id,
      approvedAmount: 115000,
      approvedTerm: 24,
      approvedRate: 0.066,
      remark: '示例进件数据'
    },
    create: {
      tenantId,
      orgId: org.id,
      customerId: customer.id,
      productId: product.id,
      funderId: funder.id,
      applicationNo: 'APP-DEMO-0001',
      amount: 120000,
      term: 24,
      rate: 0.068,
      repaymentMethod: '等额本息',
      purpose: '经营周转',
      status: 'PENDING_DISBURSEMENT',
      creatorId: sales.id,
      sourceLeadId: lead.id,
      approvedAmount: 115000,
      approvedTerm: 24,
      approvedRate: 0.066,
      remark: '示例进件数据'
    }
  })

  const appFiles = [
    {
      fileType: 'ID_CARD',
      fileUrl: 'https://example.com/files/id-card.jpg',
      fileName: '身份证.jpg'
    },
    {
      fileType: 'VEHICLE_LICENSE',
      fileUrl: 'https://example.com/files/vehicle-license.jpg',
      fileName: '行驶证.jpg'
    }
  ]
  for (const file of appFiles) {
    const existedFile = await prisma.applicationFile.findFirst({
      where: { applicationId: application.id, fileType: file.fileType }
    })
    if (existedFile) {
      await prisma.applicationFile.update({
        where: { id: existedFile.id },
        data: file
      })
    } else {
      await prisma.applicationFile.create({
        data: { ...file, applicationId: application.id }
      })
    }
  }

  const approvals = [
    {
      tenantId,
      applicationId: application.id,
      approverId: approver.id,
      stage: 'FIRST_REVIEW',
      action: 'PASS',
      opinion: '资料完整，初审通过',
      amount: 115000,
      term: 24,
      rate: 0.066
    },
    {
      tenantId,
      applicationId: application.id,
      approverId: approver.id,
      stage: 'FINAL_REVIEW',
      action: 'PASS',
      opinion: '终审通过，可进入签约放款',
      amount: 115000,
      term: 24,
      rate: 0.066
    }
  ] as const
  for (const approval of approvals) {
    const existedApproval = await prisma.approvalRecord.findFirst({
      where: {
        applicationId: approval.applicationId,
        stage: approval.stage,
        action: approval.action
      }
    })
    if (existedApproval) {
      await prisma.approvalRecord.update({
        where: { id: existedApproval.id },
        data: approval
      })
    } else {
      await prisma.approvalRecord.create({
        data: approval
      })
    }
  }

  await prisma.signRecord.upsert({
    where: { applicationId: application.id },
    update: {
      tenantId,
      status: 'SIGNED',
      contractUrl: 'https://example.com/contracts/APP-DEMO-0001.pdf',
      videoUrl: 'https://example.com/videos/APP-DEMO-0001.mp4',
      signedAt: new Date('2026-05-29T09:30:00+08:00')
    },
    create: {
      tenantId,
      applicationId: application.id,
      status: 'SIGNED',
      contractUrl: 'https://example.com/contracts/APP-DEMO-0001.pdf',
      videoUrl: 'https://example.com/videos/APP-DEMO-0001.mp4',
      signedAt: new Date('2026-05-29T09:30:00+08:00')
    }
  })

  await prisma.disbursement.upsert({
    where: { applicationId: application.id },
    update: {
      tenantId,
      status: 'MORTGAGE_DONE',
      gpsDeviceNo: 'GPS-DEMO-001',
      gpsInstallImg: 'https://example.com/gps/APP-DEMO-0001.jpg',
      gpsInstallAt: new Date('2026-05-29T10:00:00+08:00'),
      mortgageStatus: 'DONE',
      mortgageImg: 'https://example.com/mortgage/APP-DEMO-0001.jpg',
      mortgageAt: new Date('2026-05-29T11:00:00+08:00'),
      disburseAmount: 115000,
      disburseAccount: '6222000000000000000',
      transactionNo: 'TX-DEMO-0001',
      remark: '待财务确认放款'
    },
    create: {
      tenantId,
      applicationId: application.id,
      status: 'MORTGAGE_DONE',
      gpsDeviceNo: 'GPS-DEMO-001',
      gpsInstallImg: 'https://example.com/gps/APP-DEMO-0001.jpg',
      gpsInstallAt: new Date('2026-05-29T10:00:00+08:00'),
      mortgageStatus: 'DONE',
      mortgageImg: 'https://example.com/mortgage/APP-DEMO-0001.jpg',
      mortgageAt: new Date('2026-05-29T11:00:00+08:00'),
      disburseAmount: 115000,
      disburseAccount: '6222000000000000000',
      transactionNo: 'TX-DEMO-0001',
      remark: '待财务确认放款'
    }
  })

  await prisma.repaymentPlan.upsert({
    where: { applicationId_period: { applicationId: application.id, period: 1 } },
    update: {
      tenantId,
      dueDate: new Date('2026-06-29T00:00:00+08:00'),
      principal: 4791.67,
      interest: 632.5,
      totalAmount: 5424.17,
      status: 'NOT_DUE'
    },
    create: {
      tenantId,
      applicationId: application.id,
      period: 1,
      dueDate: new Date('2026-06-29T00:00:00+08:00'),
      principal: 4791.67,
      interest: 632.5,
      totalAmount: 5424.17,
      status: 'NOT_DUE'
    }
  })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
