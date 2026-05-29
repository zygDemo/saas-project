import { PrismaClient, UserStatus } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const statusMap = {
  Super: UserStatus.ONLINE,
  Admin: UserStatus.ONLINE,
  User: UserStatus.OFFLINE
} as const

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
    { name: 'Sales Manager', code: 'R_SALES_MANAGER', description: '部门经理/团队负责人', dataScope: 'DEPT' },
    { name: 'Sales', code: 'R_SALES', description: '业务员/客户经理', dataScope: 'SELF' },
    { name: 'Approver', code: 'R_APPROVER', description: '风控审批员', dataScope: 'ALL' },
    { name: 'Finance', code: 'R_FINANCE', description: '财务人员', dataScope: 'ALL' },
    { name: 'User', code: 'R_USER', description: '普通用户', dataScope: 'SELF' }
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
    { userName: 'Sales', nickName: 'Sales', email: 'sales@example.com', phone: '13800000003', gender: 'Unknown', roleCode: 'R_SALES' },
    { userName: 'Approver', nickName: 'Approver', email: 'approver@example.com', phone: '13800000004', gender: 'Unknown', roleCode: 'R_APPROVER' },
    { userName: 'Finance', nickName: 'Finance', email: 'finance@example.com', phone: '13800000005', gender: 'Unknown', roleCode: 'R_FINANCE' },
    { userName: 'User', nickName: 'User', email: 'user@example.com', phone: '13800000006', gender: 'Unknown', roleCode: 'R_USER' }
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

  // 分配菜单权限给角色
  const allMenuIds = menus.map((m) => m.id)
  const dashboardMenuIds = menus.filter((m) => m.name === 'Dashboard' || m.name === 'Console' || m.name === 'Analysis').map((m) => m.id)
  const systemMenuIds = menus.filter((m) => ['System', 'User', 'Role', 'Menus'].includes(m.name)).map((m) => m.id)
  const businessMenuIds = menus.filter((m) =>
    ['Business', 'Org', 'Dept', 'Product', 'Funder', 'Lead', 'Customer', 'Application', 'Approval', 'Signing', 'Disbursement', 'Repayment'].includes(m.name)
  ).map((m) => m.id)

  // Super: 全部
  await connectRoleMenus(roleByCode.R_SUPER.id, allMenuIds)
  // Admin: 系统 + 业务
  await connectRoleMenus(roleByCode.R_ADMIN.id, [...systemMenuIds, ...businessMenuIds, ...dashboardMenuIds])
  // Sales Manager: 仪表盘 + 业务
  await connectRoleMenus(roleByCode.R_SALES_MANAGER.id, [...dashboardMenuIds, ...businessMenuIds])
  // Sales: 仪表盘 + 线索 + 客户 + 进件
  const salesMenuIds = menus.filter((m) =>
    ['Dashboard', 'Console', 'Analysis', 'Business', 'Lead', 'Customer', 'Application'].includes(m.name)
  ).map((m) => m.id)
  await connectRoleMenus(roleByCode.R_SALES.id, salesMenuIds)
  // Approver: 仪表盘 + 审批
  const approverMenuIds = menus.filter((m) =>
    ['Dashboard', 'Console', 'Analysis', 'Business', 'Approval'].includes(m.name)
  ).map((m) => m.id)
  await connectRoleMenus(roleByCode.R_APPROVER.id, approverMenuIds)
  // Finance: 仪表盘 + 放款 + 还款
  const financeMenuIds = menus.filter((m) =>
    ['Dashboard', 'Console', 'Analysis', 'Business', 'Disbursement', 'Repayment'].includes(m.name)
  ).map((m) => m.id)
  await connectRoleMenus(roleByCode.R_FINANCE.id, financeMenuIds)
  // User: 仅仪表盘
  await connectRoleMenus(roleByCode.R_USER.id, dashboardMenuIds)

  console.log('Seed completed.')
}

async function seedAllMenus(tenantId: number) {
  // 仪表盘
  const dashboard = await upsertMenu(tenantId, { path: '/dashboard', name: 'Dashboard', component: '/index/index', title: '仪表盘', icon: 'ri:dashboard-line', sort: 10 })
  const consoleMenu = await upsertMenu(tenantId, { parentId: dashboard.id, path: 'console', name: 'Console', component: '/dashboard/console', title: '工作台', icon: 'ri:computer-line', sort: 11, keepAlive: true })
  const analysis = await upsertMenu(tenantId, { parentId: dashboard.id, path: 'analysis', name: 'Analysis', component: '/dashboard/analysis', title: '分析页', icon: 'ri:line-chart-line', sort: 12, keepAlive: true })

  // 系统管理
  const system = await upsertMenu(tenantId, { path: '/system', name: 'System', component: '/index/index', title: '系统管理', icon: 'ri:user-3-line', sort: 20 })
  const user = await upsertMenu(tenantId, { parentId: system.id, path: 'user', name: 'User', component: '/system/user', title: '用户管理', icon: 'ri:user-line', sort: 21, keepAlive: true })
  const role = await upsertMenu(tenantId, { parentId: system.id, path: 'role', name: 'Role', component: '/system/role', title: '角色管理', icon: 'ri:user-settings-line', sort: 22, keepAlive: true })
  const menu = await upsertMenu(tenantId, { parentId: system.id, path: 'menu', name: 'Menus', component: '/system/menu', title: '菜单管理', icon: 'ri:menu-line', sort: 23, keepAlive: true })
  const userCenter = await upsertMenu(tenantId, { parentId: system.id, path: 'user-center', name: 'UserCenter', component: '/system/user-center', title: '用户中心', icon: 'ri:user-line', sort: 24, keepAlive: true, hidden: true, hiddenTab: true })

  // 车贷业务管理
  const business = await upsertMenu(tenantId, { path: '/business', name: 'Business', component: '/index/index', title: '业务管理', icon: 'ri:briefcase-line', sort: 30 })
  const businessPage = '/business/common-list'
  const org = await upsertMenu(tenantId, { parentId: business.id, path: 'org', name: 'Org', component: businessPage, title: '机构管理', icon: 'ri:building-line', sort: 31, keepAlive: true })
  const dept = await upsertMenu(tenantId, { parentId: business.id, path: 'dept', name: 'Dept', component: businessPage, title: '部门管理', icon: 'ri:organization-chart', sort: 32, keepAlive: true })
  const product = await upsertMenu(tenantId, { parentId: business.id, path: 'product', name: 'Product', component: businessPage, title: '产品管理', icon: 'ri:file-list-line', sort: 33, keepAlive: true })
  const funder = await upsertMenu(tenantId, { parentId: business.id, path: 'funder', name: 'Funder', component: businessPage, title: '资方管理', icon: 'ri:bank-line', sort: 34, keepAlive: true })
  const lead = await upsertMenu(tenantId, { parentId: business.id, path: 'lead', name: 'Lead', component: businessPage, title: '线索管理', icon: 'ri:customer-service-line', sort: 35, keepAlive: true })
  const customer = await upsertMenu(tenantId, { parentId: business.id, path: 'customer', name: 'Customer', component: businessPage, title: '客户管理', icon: 'ri:contacts-line', sort: 36, keepAlive: true })
  const application = await upsertMenu(tenantId, { parentId: business.id, path: 'application', name: 'Application', component: businessPage, title: '进件管理', icon: 'ri:file-edit-line', sort: 37, keepAlive: true })
  const approval = await upsertMenu(tenantId, { parentId: business.id, path: 'approval', name: 'Approval', component: businessPage, title: '审批管理', icon: 'ri:shield-check-line', sort: 38, keepAlive: true })
  const signing = await upsertMenu(tenantId, { parentId: business.id, path: 'signing', name: 'Signing', component: businessPage, title: '签约管理', icon: 'ri:pen-nib-line', sort: 39, keepAlive: true })
  const disbursement = await upsertMenu(tenantId, { parentId: business.id, path: 'disbursement', name: 'Disbursement', component: businessPage, title: '放款管理', icon: 'ri:money-cny-circle-line', sort: 40, keepAlive: true })
  const repayment = await upsertMenu(tenantId, { parentId: business.id, path: 'repayment', name: 'Repayment', component: businessPage, title: '还款管理', icon: 'ri:refund-line', sort: 41, keepAlive: true })

  // 为菜单创建按钮权限
  const menuNamesWithPerms = ['Menus', 'Org', 'Dept', 'Product', 'Funder', 'Lead', 'Customer', 'Application', 'Approval', 'Signing', 'Disbursement', 'Repayment']
  for (const menuName of menuNamesWithPerms) {
    const m = [menu, org, dept, product, funder, lead, customer, application, approval, signing, disbursement, repayment].find((x) => x.name === menuName)
    if (!m) continue
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
    system, user, role, menu, userCenter,
    business, org, dept, product, funder, lead, customer, application, approval, signing, disbursement, repayment
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

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
