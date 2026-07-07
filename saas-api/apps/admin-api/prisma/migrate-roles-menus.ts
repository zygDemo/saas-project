/**
 * 角色与菜单数据迁移脚本
 *
 * 用途：将 PRD 定义的 9 类角色 + 45 个菜单项同步到数据库
 * 执行方式（Windows 终端）：
 *   cd D:\zygProject\GitHub\saas-project\saas-api\apps\admin-api
 *   copy env\.env.development .env
 *   npx tsx prisma/migrate-roles-menus.ts
 *
 * 特性：
 *   - 所有操作使用 upsert，可重复执行不丢数据
 *   - 不删除已有角色/菜单，仅新增或更新
 *   - 同时更新角色-菜单关联和按钮权限
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // 获取默认租户
  const tenant = await prisma.tenant.findUnique({ where: { code: 'default' } })
  if (!tenant) {
    console.error('默认租户不存在，请先运行 prisma db seed')
    process.exit(1)
  }
  console.log(`Tenant: ${tenant.name} (id=${tenant.id})`)

  // ========== 1. 同步角色 ==========
  console.log('\n--- 同步角色 ---')
  const roleDefs = [
    {
      code: 'R_SUPER',
      name: 'Super Admin',
      description: '平台超级管理员，全平台管理',
      dataScope: 'ALL'
    },
    { code: 'R_OPERATION', name: 'Platform Operator', description: '平台运营', dataScope: 'ALL' },
    { code: 'R_ADMIN', name: 'Admin', description: '机构管理员', dataScope: 'ALL' },
    {
      code: 'R_SALES_MANAGER',
      name: 'Sales Manager',
      description: '部门经理/团队负责人',
      dataScope: 'DEPT'
    },
    { code: 'R_SALES', name: 'Sales', description: '业务员/客户经理', dataScope: 'SELF' },
    { code: 'R_APPROVER', name: 'Approver', description: '风控审批员', dataScope: 'ALL' },
    { code: 'R_FINANCE', name: 'Finance', description: '财务人员', dataScope: 'ALL' },
    {
      code: 'R_CS_COLLECTION',
      name: 'CS & Collection',
      description: '客服/催收',
      dataScope: 'ALL'
    },
    { code: 'R_USER', name: 'User', description: '普通用户，仅移动端操作权限', dataScope: 'SELF' }
  ]

  const roles: Record<string, { id: number }> = {}
  for (const def of roleDefs) {
    const role = await prisma.role.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: def.code } },
      update: { name: def.name, description: def.description, dataScope: def.dataScope },
      create: { ...def, tenantId: tenant.id, enabled: true }
    })
    roles[def.code] = role
    console.log(`  ✓ ${def.code} (id=${role.id}) — ${def.description}`)
  }

  // ========== 2. 同步菜单 ==========
  console.log('\n--- 同步菜单 ---')
  const bp = '/business/common-list'

  const menuDefs: Array<{
    parentKey?: string
    path: string
    name: string
    title: string
    icon: string
    sort: number
    component?: string
    keepAlive?: boolean
    hidden?: boolean
    hiddenTab?: boolean
  }> = [
    // 仪表盘
    { path: '/dashboard', name: 'Dashboard', component: '/index/index', title: '仪表盘', icon: 'ri:dashboard-line', sort: 10 },
    { parentKey: 'Dashboard', path: 'console', name: 'Console', component: '/dashboard/console', title: '工作台', icon: 'ri:computer-line', sort: 11, keepAlive: true },
    { parentKey: 'Dashboard', path: 'analysis', name: 'Analysis', component: '/dashboard/analysis', title: '分析页', icon: 'ri:line-chart-line', sort: 12, keepAlive: true },

    // 平台管理
    { path: '/platform', name: 'Platform', component: '/index/index', title: '平台管理', icon: 'ri:global-line', sort: 20 },
    { parentKey: 'Platform', path: 'tenant', name: 'TenantMgmt', component: bp, title: '租户机构管理', icon: 'ri:building-2-line', sort: 21, keepAlive: true },
    { parentKey: 'Platform', path: 'package-billing', name: 'PackageBilling', component: bp, title: '套餐与计费', icon: 'ri:money-dollar-circle-line', sort: 22, keepAlive: true },
    { parentKey: 'Platform', path: 'product-template', name: 'ProductTemplate', component: bp, title: '产品与资方模板', icon: 'ri:file-copy-line', sort: 23, keepAlive: true },
    { parentKey: 'Platform', path: 'supervision', name: 'PlatformSupervision', component: bp, title: '平台业务监管', icon: 'ri:eye-line', sort: 24, keepAlive: true },
    { parentKey: 'Platform', path: 'third-party', name: 'ThirdPartyService', component: bp, title: '第三方服务管理', icon: 'ri:plug-line', sort: 25, keepAlive: true },
    { parentKey: 'Platform', path: 'work-order', name: 'WorkOrder', component: bp, title: '运营工单中心', icon: 'ri:customer-service-2-line', sort: 26, keepAlive: true },

    // 机构配置
    { path: '/org-config', name: 'OrgConfigRoot', component: '/index/index', title: '机构配置', icon: 'ri:building-4-line', sort: 25 },
    { parentKey: 'OrgConfigRoot', path: 'org', name: 'Org', component: bp, title: '业务机构管理', icon: 'ri:building-line', sort: 251, keepAlive: true },
    { parentKey: 'OrgConfigRoot', path: 'dept', name: 'Dept', component: bp, title: '部门管理', icon: 'ri:organization-chart', sort: 252, keepAlive: true },
    { parentKey: 'OrgConfigRoot', path: 'product', name: 'Product', component: bp, title: '产品配置', icon: 'ri:file-list-line', sort: 253, keepAlive: true },
    { parentKey: 'OrgConfigRoot', path: 'funder', name: 'Funder', component: bp, title: '资方配置', icon: 'ri:bank-line', sort: 254, keepAlive: true },
    { parentKey: 'OrgConfigRoot', path: 'flow-config', name: 'FlowConfig', component: '/business/flow-config', title: '流程与规则', icon: 'ri:git-branch-line', sort: 255, keepAlive: true },

    // 数据中心
    { path: '/datacenter', name: 'DataCenter', component: '/index/index', title: '数据中心', icon: 'ri:bar-chart-box-line', sort: 30 },
    { parentKey: 'DataCenter', path: 'stats', name: 'DataStats', component: '/data-center/stats', title: '数据统计', icon: 'ri:bar-chart-line', sort: 31, keepAlive: true },
    { parentKey: 'DataCenter', path: 'audit-log', name: 'AuditLog', component: '/data-center/audit-log', title: '日志审计', icon: 'ri:file-list-3-line', sort: 32, keepAlive: true },

    // 系统管理
    { path: '/system', name: 'System', component: '/index/index', title: '系统管理', icon: 'ri:settings-3-line', sort: 40 },
    { parentKey: 'System', path: 'user', name: 'User', component: '/system/user', title: '用户管理', icon: 'ri:user-line', sort: 41, keepAlive: true },
    { parentKey: 'System', path: 'role', name: 'Role', component: '/system/role', title: '角色管理', icon: 'ri:user-settings-line', sort: 42, keepAlive: true },
    { parentKey: 'System', path: 'menu', name: 'Menus', component: '/system/menu', title: '菜单管理', icon: 'ri:menu-line', sort: 43, keepAlive: true },
    { parentKey: 'System', path: 'dict', name: 'DictMgmt', component: '/system/dict', title: '字典管理', icon: 'ri:book-open-line', sort: 44, keepAlive: true },
    { parentKey: 'System', path: 'region', name: 'RegionMgmt', component: bp, title: '地区管理', icon: 'ri:map-pin-line', sort: 45, keepAlive: true },
    { parentKey: 'System', path: 'sys-param', name: 'SysParam', component: '/system/sys-param', title: '系统参数', icon: 'ri:settings-line', sort: 49, keepAlive: true },
    { parentKey: 'System', path: 'user-center', name: 'UserCenter', component: '/system/user-center', title: '用户中心', icon: 'ri:user-line', sort: 51, keepAlive: true, hidden: true, hiddenTab: true },

    // 运营中心
    { path: '/operation-center', name: 'OperationCenter', component: '/index/index', title: '运营中心', icon: 'ri:service-line', sort: 45 },
    { parentKey: 'OperationCenter', path: 'file', name: 'FileManage', component: '/system/file', title: '文件管理', icon: 'ri:file-list-3-line', sort: 451, keepAlive: true },
    { parentKey: 'OperationCenter', path: 'file-config', name: 'FileConfig', component: '/system/file-config', title: '文件存储配置', icon: 'ri:hard-drive-2-line', sort: 452, keepAlive: true },
    { parentKey: 'OperationCenter', path: 'msg-template', name: 'MsgTemplate', component: bp, title: '消息模板', icon: 'ri:mail-send-line', sort: 453, keepAlive: true },
    { parentKey: 'OperationCenter', path: 'notice', name: 'Notice', component: '/system/announcement', title: '公告管理', icon: 'ri:notification-line', sort: 454, keepAlive: true },
    { parentKey: 'OperationCenter', path: 'work-order', name: 'SystemWorkOrder', component: '/system/work-order', title: '系统工单管理', icon: 'ri:customer-service-2-line', sort: 455, keepAlive: true },

    // 读书管理
    { path: '/reading', name: 'Reading', component: '/index/index', title: '读书管理', icon: 'ri:book-3-line', sort: 55 },
    { parentKey: 'Reading', path: 'bookshelf', name: 'ReadingBookshelf', component: '/reading/bookshelf/index', title: '书架管理', icon: 'ri:book-2-line', sort: 551, keepAlive: true },
    { parentKey: 'Reading', path: 'books', name: 'ReadingBooks', component: '/reading/books/index', title: '图书管理', icon: 'ri:book-open-line', sort: 552, keepAlive: true },
    { parentKey: 'Reading', path: 'category', name: 'ReadingCategory', component: '/reading/category/index', title: '分类管理', icon: 'ri:folder-2-line', sort: 553, keepAlive: true },
    { parentKey: 'Reading', path: 'comment', name: 'ReadingComment', component: '/reading/comment/index', title: '评论管理', icon: 'ri:chat-3-line', sort: 554, keepAlive: true },
    { parentKey: 'Reading', path: 'crawler', name: 'ReadingCrawler', component: '/reading/crawler/index', title: '小说爬取', icon: 'ri:download-cloud-2-line', sort: 555, keepAlive: true },
    { parentKey: 'Reading', path: 'notes', name: 'ReadingNotes', component: '/reading/notes/index', title: '阅读笔记', icon: 'ri:sticky-note-line', sort: 556, keepAlive: true },
    { parentKey: 'Reading', path: 'dashboard', name: 'ReadingDashboard', component: '/reading/dashboard/index', title: '阅读统计', icon: 'ri:bar-chart-2-line', sort: 557, keepAlive: true },
    { parentKey: 'Reading', path: 'chapters/:bookId', name: 'ReadingChapters', component: '/reading/chapters/index', title: '章节管理', icon: 'ri:file-list-2-line', sort: 558, hidden: true },

    // 车贷业务
    { path: '/business', name: 'Business', component: '/index/index', title: '车贷业务', icon: 'ri:briefcase-line', sort: 60 },
    { parentKey: 'Business', path: 'lead', name: 'Lead', component: bp, title: '线索管理', icon: 'ri:customer-service-line', sort: 66, keepAlive: true },
    { parentKey: 'Business', path: 'precheck', name: 'BusinessPrecheck', component: bp, title: '预审阶段', icon: 'ri:file-search-line', sort: 67, keepAlive: true },
    { parentKey: 'Business', path: 'supplement', name: 'BusinessSupplement', component: bp, title: '补件阶段', icon: 'ri:folder-upload-line', sort: 68, keepAlive: true },
    { parentKey: 'Business', path: 'risk-approval', name: 'BusinessRiskApproval', component: bp, title: '风控审批', icon: 'ri:shield-check-line', sort: 69, keepAlive: true },
    { parentKey: 'Business', path: 'funder-final', name: 'BusinessFunderFinal', component: bp, title: '资方终审', icon: 'ri:bank-line', sort: 70, keepAlive: true },
    { parentKey: 'Business', path: 'signing', name: 'BusinessSigning', component: bp, title: '客户签约', icon: 'ri:contract-line', sort: 71, keepAlive: true },
    { parentKey: 'Business', path: 'disbursement', name: 'BusinessDisbursement', component: bp, title: '请款放款', icon: 'ri:money-cny-circle-line', sort: 72, keepAlive: true },
    { parentKey: 'Business', path: 'post-loan', name: 'BusinessPostLoan', component: bp, title: '贷后阶段', icon: 'ri:refund-line', sort: 73, keepAlive: true },
    { parentKey: 'Business', path: 'repayment', name: 'BusinessRepayment', component: bp, title: '还款管理', icon: 'ri:money-cny-circle-line', sort: 74, keepAlive: true },
    { parentKey: 'Business', path: 'disbursement-mgmt', name: 'BusinessDisbursementMgmt', component: bp, title: '放款管理', icon: 'ri:bank-card-line', sort: 75, keepAlive: true },
    { parentKey: 'Business', path: 'order-query', name: 'BusinessOrderQuery', component: bp, title: '综合查询', icon: 'ri:search-eye-line', sort: 76, keepAlive: true },
    { parentKey: 'Business', path: 'reports', name: 'Reports', component: bp, title: '报表统计', icon: 'ri:pie-chart-line', sort: 77, keepAlive: true }
  ]

  const menuMap: Record<string, { id: number }> = {}
  for (const def of menuDefs) {
    let parentId: number | null = null
    if (def.parentKey && menuMap[def.parentKey]) {
      parentId = menuMap[def.parentKey].id
    }

    const menu = await prisma.menu.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: def.name } },
      update: {
        parentId,
        path: def.path,
        component: def.component ?? (parentId ? bp : '/index/index'),
        title: def.title,
        icon: def.icon,
        sort: def.sort,
        keepAlive: def.keepAlive ?? false,
        hidden: def.hidden ?? false,
        hiddenTab: def.hiddenTab ?? false
      },
      create: {
        tenantId: tenant.id,
        parentId,
        path: def.path,
        name: def.name,
        component: def.component ?? (parentId ? bp : '/index/index'),
        title: def.title,
        icon: def.icon,
        sort: def.sort,
        keepAlive: def.keepAlive ?? false,
        hidden: def.hidden ?? false,
        hiddenTab: def.hiddenTab ?? false
      }
    })
    menuMap[def.name] = menu
    const indent = def.parentKey ? '  ' : ''
    console.log(`${indent}  ✓ ${def.name} (id=${menu.id}) — ${def.title}`)
  }

  // 清理已经废弃的历史菜单，避免继续出现在后端菜单模式的真实侧边栏中
  console.log('\n--- 清理废弃菜单 ---')
  const obsoleteMenuNames = [
    'Customer',
    'PreEntry',
    'Application',
    'RiskPre',
    'FunderPre',
    'FirstReview',
    'FinalReview',
    'LoanRequest',
    'OrderMgmt',
    'Repayment',
    'FunderFinal',
    'DisbursementNode',
    'PawnBusiness',
    'OrgConfig',
    'PreReview',
    'Supplement',
    'Approval',
    'FunderReview',
    'Signing',
    'Disbursement',
    'PostLoan',
    'SystemParam',
    'Announcement',
    'MobileConfig'
  ]

  const obsoleteMenus = await prisma.menu.findMany({
    where: {
      tenantId: tenant.id,
      name: { in: obsoleteMenuNames }
    },
    select: { id: true, name: true, title: true }
  })

  if (obsoleteMenus.length === 0) {
    console.log('  ✓ 无需清理废弃菜单')
  } else {
    const obsoleteMenuIds = obsoleteMenus.map((m) => m.id)
    await prisma.rolePermission.deleteMany({
      where: { permission: { menuId: { in: obsoleteMenuIds } } }
    })
    await prisma.permission.deleteMany({ where: { menuId: { in: obsoleteMenuIds } } })
    await prisma.roleMenu.deleteMany({ where: { menuId: { in: obsoleteMenuIds } } })
    const { count } = await prisma.menu.deleteMany({ where: { id: { in: obsoleteMenuIds } } })
    for (const menu of obsoleteMenus) {
      console.log(`  ✓ 已删除 ${menu.name} (id=${menu.id}) — ${menu.title}`)
    }
    console.log(`  ✓ 共清理 ${count} 个废弃菜单`)
  }

  // ========== 3. 分配角色-菜单关联 ==========
  console.log('\n--- 分配角色菜单 ---')
  const filterIds = (...names: string[]) =>
    names.map((n) => menuMap[n]?.id).filter(Boolean) as number[]

  const dashIds = filterIds('Dashboard', 'Console', 'Analysis')
  const platformIds = filterIds(
    'Platform',
    'TenantMgmt',
    'PackageBilling',
    'ProductTemplate',
    'PlatformSupervision',
    'ThirdPartyService',
    'WorkOrder'
  )
  const orgConfigIds = filterIds('OrgConfigRoot', 'Org', 'Dept', 'Product', 'Funder', 'FlowConfig')
  const dataCenterIds = filterIds('DataCenter', 'DataStats', 'AuditLog')
  const systemBasicIds = filterIds('System', 'User', 'Role', 'Menus', 'DictMgmt', 'RegionMgmt', 'SysParam', 'UserCenter')
  const operationCenterIds = filterIds('OperationCenter', 'FileManage', 'FileConfig', 'MsgTemplate', 'Notice', 'SystemWorkOrder')
  const readingIds = filterIds(
    'Reading',
    'ReadingBookshelf',
    'ReadingBooks',
    'ReadingCategory',
    'ReadingComment',
    'ReadingCrawler',
    'ReadingNotes',
    'ReadingDashboard',
    'ReadingChapters'
  )
  const bizCoreIds = filterIds(
    'Business',
    'Lead',
    'BusinessPrecheck',
    'BusinessSupplement',
    'BusinessSigning',
    'BusinessOrderQuery'
  )
  const bizApprovalIds = filterIds('Business', 'BusinessRiskApproval', 'BusinessFunderFinal', 'BusinessOrderQuery')
  const bizFinanceIds = filterIds(
    'Business',
    'BusinessSigning',
    'BusinessDisbursement',
    'BusinessPostLoan',
    'BusinessRepayment',
    'BusinessDisbursementMgmt',
    'BusinessOrderQuery',
    'Reports'
  )
  const bizCsIds = filterIds('Business', 'BusinessPostLoan', 'BusinessOrderQuery', 'Reports')
  const bizManagerIds = filterIds(
    'Business',
    'Lead',
    'BusinessPrecheck',
    'BusinessSupplement',
    'BusinessRiskApproval',
    'BusinessFunderFinal',
    'BusinessSigning',
    'BusinessDisbursement',
    'BusinessPostLoan',
    'BusinessRepayment',
    'BusinessDisbursementMgmt',
    'BusinessOrderQuery',
    'Reports'
  )
  const bizAdminIds = filterIds(
    'Business',
    'Lead',
    'BusinessPrecheck',
    'BusinessSupplement',
    'BusinessRiskApproval',
    'BusinessFunderFinal',
    'BusinessSigning',
    'BusinessDisbursement',
    'BusinessPostLoan',
    'BusinessRepayment',
    'BusinessDisbursementMgmt',
    'BusinessOrderQuery',
    'Reports'
  )
  const allMenuIds = Object.values(menuMap).map((m) => m.id)

  const roleMenuMap: Record<string, number[]> = {
    R_SUPER: allMenuIds,
    R_OPERATION: [
      ...dashIds,
      ...platformIds,
      ...orgConfigIds,
      ...operationCenterIds,
      ...dataCenterIds
    ],
    R_ADMIN: [...dashIds, ...orgConfigIds, ...systemBasicIds, ...operationCenterIds, ...bizAdminIds, ...readingIds],
    R_SALES_MANAGER: [...dashIds, ...bizManagerIds],
    R_SALES: [...dashIds, ...bizCoreIds],
    R_APPROVER: [...dashIds, ...bizApprovalIds],
    R_FINANCE: [...dashIds, ...bizFinanceIds],
    R_CS_COLLECTION: [...dashIds, ...bizCsIds],
    R_USER: [...dashIds]
  }

  for (const [roleCode, menuIds] of Object.entries(roleMenuMap)) {
    const role = roles[roleCode]
    if (!role) {
      console.log(`  ✗ 角色 ${roleCode} 不存在，跳过`)
      continue
    }

    // 删除旧关联
    await prisma.roleMenu.deleteMany({ where: { roleId: role.id } })

    // 创建新关联
    if (menuIds.length > 0) {
      await prisma.roleMenu.createMany({
        data: menuIds.map((menuId) => ({ roleId: role.id, menuId })),
        skipDuplicates: true
      })
    }
    console.log(`  ✓ ${roleCode} → ${menuIds.length} 个菜单`)
  }

  // ========== 4. 创建按钮权限 ==========
  console.log('\n--- 同步按钮权限 ---')
  const bizMenuNames = [
    'TenantMgmt',
    'PackageBilling',
    'ProductTemplate',
    'PlatformSupervision',
    'ThirdPartyService',
    'WorkOrder',
    'Org',
    'Dept',
    'Product',
    'Funder',
    'FlowConfig',
    'DataStats',
    'AuditLog',
    'ReadingBookshelf',
    'ReadingBooks',
    'ReadingCategory',
    'ReadingComment',
    'ReadingCrawler',
    'ReadingNotes',
    'ReadingDashboard',
    'Lead',
    'BusinessPrecheck',
    'BusinessSupplement',
    'BusinessRiskApproval',
    'BusinessFunderFinal',
    'BusinessSigning',
    'BusinessDisbursement',
    'BusinessPostLoan',
    'BusinessRepayment',
    'BusinessDisbursementMgmt',
    'BusinessOrderQuery',
    'Reports',
    'Menus',
    'DictMgmt',
    'RegionMgmt',
    'FileManage',
    'FileConfig',
    'MsgTemplate',
    'Notice',
    'SystemWorkOrder',
    'SysParam'
  ]

  let permCount = 0
  for (const menuName of bizMenuNames) {
    const menu = menuMap[menuName]
    if (!menu) continue
    const marks = ['add', 'edit', 'delete']
    for (const authMark of marks) {
      await prisma.permission.upsert({
        where: { tenantId_menuId_authMark: { tenantId: tenant.id, menuId: menu.id, authMark } },
        update: { title: authMark.charAt(0).toUpperCase() + authMark.slice(1) },
        create: {
          tenantId: tenant.id,
          menuId: menu.id,
          authMark,
          title: authMark.charAt(0).toUpperCase() + authMark.slice(1)
        }
      })
      permCount++
    }
  }
  console.log(`  ✓ 已创建/更新 ${permCount} 个按钮权限`)

  // ========== 5. 总结 ==========
  const [roleCount, menuCount] = await Promise.all([
    prisma.role.count({ where: { tenantId: tenant.id } }),
    prisma.menu.count({ where: { tenantId: tenant.id } })
  ])

  console.log(`\n========================================`)
  console.log(`  迁移完成！`)
  console.log(`  角色: ${roleCount} 个  |  菜单: ${menuCount} 个`)
  console.log(`========================================`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
