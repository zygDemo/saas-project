import { PrismaClient, UserStatus } from '@prisma/client'
import * as bcrypt from 'bcryptjs'
import { LeadStatus, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

const statusMap: Record<string, UserStatus> = {
  Super: UserStatus.ONLINE,
  Admin: UserStatus.ONLINE,
  Operator: UserStatus.ONLINE,
  CS: UserStatus.ONLINE
}

const defaultFlowNodes = [
  {
    code: 1100,
    name: '身份证信息（订单创建）',
    phaseCode: 1000,
    phaseName: '预审阶段',
    sort: 1100,
    operationSide: '移动端',
    executor: '客户/业务员',
    requireMaterials: true,
    requireApproval: false,
    transitions: [{ action: 10, toNode: 1110 }]
  },
  {
    code: 1110,
    name: '车辆信息',
    phaseCode: 1000,
    phaseName: '预审阶段',
    sort: 1110,
    operationSide: '移动端',
    executor: '客户/业务员',
    requireMaterials: true,
    requireApproval: false,
    transitions: [{ action: 10, toNode: 1120 }]
  },
  {
    code: 1120,
    name: '申请信息',
    phaseCode: 1000,
    phaseName: '预审阶段',
    sort: 1120,
    operationSide: '移动端',
    executor: '客户/业务员',
    requireMaterials: true,
    requireApproval: false,
    transitions: [{ action: 10, toNode: 1130 }]
  },
  {
    code: 1130,
    name: '签署授权书',
    phaseCode: 1000,
    phaseName: '预审阶段',
    sort: 1130,
    operationSide: '移动端',
    executor: '客户/业务员',
    requireMaterials: true,
    requireApproval: false,
    transitions: [{ action: 10, toNode: 1140 }]
  },
  {
    code: 1140,
    name: '待预审',
    phaseCode: 1000,
    phaseName: '预审阶段',
    sort: 1140,
    operationSide: '系统',
    executor: '系统',
    requireMaterials: false,
    requireApproval: false,
    transitions: [{ action: 10, toNode: 1200 }]
  },
  {
    code: 1200,
    name: '风控预审',
    phaseCode: 1000,
    phaseName: '预审阶段',
    sort: 1200,
    operationSide: '系统',
    executor: '系统自动化',
    requireMaterials: false,
    requireApproval: false,
    autoPass: true,
    transitions: [{ action: 20, toNode: 1250 }]
  },
  {
    code: 1250,
    name: '资方预审',
    phaseCode: 1000,
    phaseName: '预审阶段',
    sort: 1250,
    operationSide: '三方接口',
    executor: '资方接口',
    requireMaterials: false,
    requireApproval: true,
    transitions: [
      { action: 20, toNode: 1300 },
      { action: 50, toNode: 1300 }
    ]
  },
  {
    code: 1300,
    name: '资料补充',
    phaseCode: 1300,
    phaseName: '补件阶段',
    sort: 1300,
    operationSide: '移动端',
    executor: '客户/业务员',
    requireMaterials: false,
    requireApproval: false,
    transitions: [{ action: 10, toNode: 1350, condition: 'ALL_PARALLEL_REQUIRED_COMPLETED' }]
  },
  {
    code: 1310,
    name: '客户资料',
    phaseCode: 1300,
    phaseName: '补件阶段',
    sort: 1310,
    parentNode: 1300,
    parallel: true,
    required: true,
    operationSide: '移动端',
    executor: '客户',
    requireMaterials: true,
    requireApproval: false
  },
  {
    code: 1320,
    name: '车辆资料',
    phaseCode: 1300,
    phaseName: '补件阶段',
    sort: 1320,
    parentNode: 1300,
    parallel: true,
    required: true,
    operationSide: '移动端',
    executor: '客户',
    requireMaterials: true,
    requireApproval: false
  },
  {
    code: 1330,
    name: '订单资料',
    phaseCode: 1300,
    phaseName: '补件阶段',
    sort: 1330,
    parentNode: 1300,
    parallel: true,
    required: true,
    operationSide: '移动端',
    executor: '客户',
    requireMaterials: true,
    requireApproval: false
  },
  {
    code: 1340,
    name: '文件资料',
    phaseCode: 1300,
    phaseName: '补件阶段',
    sort: 1340,
    parentNode: 1300,
    parallel: true,
    required: true,
    operationSide: '移动端',
    executor: '客户',
    requireMaterials: true,
    requireApproval: false
  },
  {
    code: 1350,
    name: '待提交',
    phaseCode: 1300,
    phaseName: '补件阶段',
    sort: 1350,
    operationSide: '移动端',
    executor: '客户/业务员',
    requireMaterials: false,
    requireApproval: false,
    transitions: [{ action: 10, toNode: 1400 }]
  },
  {
    code: 1400,
    name: '风控初审',
    phaseCode: 1400,
    phaseName: '风控审批',
    sort: 1400,
    operationSide: 'Web',
    executor: '风控专员',
    requireMaterials: false,
    requireApproval: true,
    amountLimit: 200000,
    transitions: [
      { action: 20, toNode: 1450, condition: 'LOAN_AMOUNT_GT_LIMIT' },
      { action: 20, toNode: 1500, condition: 'LOAN_AMOUNT_LTE_LIMIT' },
      { action: 50, toNode: 1300 }
    ]
  },
  {
    code: 1450,
    name: '风控终审',
    phaseCode: 1400,
    phaseName: '风控审批',
    sort: 1450,
    operationSide: 'Web',
    executor: '风控主管',
    requireMaterials: false,
    requireApproval: true,
    approveLevel: 2,
    transitions: [
      { action: 20, toNode: 1500 },
      { action: 50, toNode: 1300 }
    ]
  },
  {
    code: 1500,
    name: '资方终审',
    phaseCode: 1500,
    phaseName: '资方终审',
    sort: 1500,
    operationSide: '三方接口',
    executor: '资方接口',
    requireMaterials: false,
    requireApproval: true,
    transitions: [
      { action: 20, toNode: 1600 },
      { action: 50, toNode: 1300 }
    ]
  },
  {
    code: 1600,
    name: '签约办理',
    phaseCode: 1600,
    phaseName: '签约阶段',
    sort: 1600,
    operationSide: '移动端',
    executor: '客户/业务员',
    requireMaterials: false,
    requireApproval: false,
    transitions: [{ action: 10, toNode: 1660, condition: 'ALL_PARALLEL_REQUIRED_COMPLETED' }]
  },
  {
    code: 1610,
    name: '额度确认',
    phaseCode: 1600,
    phaseName: '签约阶段',
    sort: 1610,
    parentNode: 1600,
    parallel: true,
    required: true,
    operationSide: '移动端',
    executor: '客户',
    requireMaterials: false,
    requireApproval: false
  },
  {
    code: 1620,
    name: '绑银行卡',
    phaseCode: 1600,
    phaseName: '签约阶段',
    sort: 1620,
    parentNode: 1600,
    parallel: true,
    required: true,
    operationSide: '移动端',
    executor: '客户',
    requireMaterials: true,
    requireApproval: false
  },
  {
    code: 1630,
    name: '合同签署',
    phaseCode: 1600,
    phaseName: '签约阶段',
    sort: 1630,
    parentNode: 1600,
    parallel: true,
    required: true,
    operationSide: '移动端',
    executor: '客户',
    requireMaterials: true,
    requireApproval: false
  },
  {
    code: 1640,
    name: 'GPS安装',
    phaseCode: 1600,
    phaseName: '签约阶段',
    sort: 1640,
    parentNode: 1600,
    parallel: true,
    required: true,
    operationSide: '移动端',
    executor: '客户/业务员',
    requireMaterials: true,
    requireApproval: false
  },
  {
    code: 1650,
    name: '抵押办理',
    phaseCode: 1600,
    phaseName: '签约阶段',
    sort: 1650,
    parentNode: 1600,
    parallel: true,
    required: true,
    operationSide: '移动端',
    executor: '客户/业务员',
    requireMaterials: true,
    requireApproval: false
  },
  {
    code: 1660,
    name: '待请款',
    phaseCode: 1600,
    phaseName: '签约阶段',
    sort: 1660,
    operationSide: '系统',
    executor: '系统',
    requireMaterials: false,
    requireApproval: false,
    transitions: [{ action: 10, toNode: 1700 }]
  },
  {
    code: 1700,
    name: '请款资料',
    phaseCode: 1700,
    phaseName: '请款放款',
    sort: 1700,
    operationSide: 'Web',
    executor: '业务专员',
    requireMaterials: true,
    requireApproval: false,
    transitions: [{ action: 20, toNode: 1800 }]
  },
  {
    code: 1800,
    name: '资方放款',
    phaseCode: 1700,
    phaseName: '请款放款',
    sort: 1800,
    operationSide: '三方接口',
    executor: '资方接口',
    requireMaterials: false,
    requireApproval: false,
    transitions: [{ action: 20, toNode: 1900 }]
  },
  {
    code: 1900,
    name: '贷后还款',
    phaseCode: 1900,
    phaseName: '贷后阶段',
    sort: 1900,
    operationSide: 'Web',
    executor: '贷后专员',
    requireMaterials: false,
    requireApproval: false
  }
]

const obsoleteDefaultFlowNodeCodes = [
  '2000',
  '2100',
  '2200',
  '3000',
  '3100',
  '4000',
  '4100',
  '4200',
  '4300',
  '4400',
  '5000',
  '5100',
  '6000',
  '6100',
  '7000',
  '8000',
  '9000'
]

async function main() {
  // 创建默认租户
  const tenant = await prisma.tenant.upsert({
    where: { code: 'default' },
    update: {},
    create: { name: 'Default Tenant', code: 'default' }
  })

  const passwordHash = await bcrypt.hash('123456', 10)

  // 创建角色（包含车贷 SaaS 业务角色）
  const roleDefs = [
    {
      name: 'Super Admin',
      code: 'R_SUPER',
      description: '平台超级管理员，全平台管理',
      dataScope: 'ALL'
    },
    { name: 'Admin', code: 'R_ADMIN', description: '机构管理员', dataScope: 'ALL' },
    { name: 'Platform Operator', code: 'R_OPERATION', description: '平台运营', dataScope: 'ALL' },
    {
      name: 'Sales Manager',
      code: 'R_SALES_MANAGER',
      description: '部门经理/团队负责人',
      dataScope: 'DEPT'
    },
    { name: 'Sales', code: 'R_SALES', description: '业务员/客户经理', dataScope: 'SELF' },
    { name: 'Approver', code: 'R_APPROVER', description: '风控审批员', dataScope: 'ALL' },
    { name: 'Finance', code: 'R_FINANCE', description: '财务人员', dataScope: 'ALL' },
    {
      name: 'CS & Collection',
      code: 'R_CS_COLLECTION',
      description: '客服/催收',
      dataScope: 'ALL'
    },
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
    {
      userName: 'Super',
      nickName: 'Super Admin',
      email: 'super@example.com',
      phone: '13800000001',
      gender: 'Male',
      roleCode: 'R_SUPER'
    },
    {
      userName: 'Admin',
      nickName: 'Admin',
      email: 'admin@example.com',
      phone: '13800000002',
      gender: 'Female',
      roleCode: 'R_ADMIN'
    },
    {
      userName: 'Operator',
      nickName: 'Operator',
      email: 'operator@example.com',
      phone: '13800000007',
      gender: 'Unknown',
      roleCode: 'R_OPERATION'
    },
    {
      userName: 'Sales',
      nickName: 'Sales',
      email: 'sales@example.com',
      phone: '13800000003',
      gender: 'Unknown',
      roleCode: 'R_SALES'
    },
    {
      userName: 'Approver',
      nickName: 'Approver',
      email: 'approver@example.com',
      phone: '13800000004',
      gender: 'Unknown',
      roleCode: 'R_APPROVER'
    },
    {
      userName: 'Finance',
      nickName: 'Finance',
      email: 'finance@example.com',
      phone: '13800000005',
      gender: 'Unknown',
      roleCode: 'R_FINANCE'
    },
    {
      userName: 'CS',
      nickName: 'CS',
      email: 'cs@example.com',
      phone: '13800000006',
      gender: 'Unknown',
      roleCode: 'R_CS_COLLECTION'
    },
    {
      userName: 'User',
      nickName: 'User',
      email: 'user@example.com',
      phone: '13800000008',
      gender: 'Unknown',
      roleCode: 'R_USER'
    }
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
  await resetBusinessMenuGrants(tenant.id)

  // 按 PRD 角色菜单树分配菜单权限
  const filterIds = (...names: string[]) =>
    menus.filter((m) => names.includes(m.name)).map((m) => m.id)
  const superMenuIds = menus.map((m) => m.id)

  // 公共菜单：所有角色都有仪表盘工作台
  const dashIds = filterIds('Dashboard', 'Console', 'Analysis')

  // 平台管理相关菜单
  const platformIds = filterIds(
    'Platform',
    'TenantMgmt',
    'PackageBilling',
    'ProductTemplate',
    'PlatformSupervision',
    'ThirdPartyService',
    'WorkOrder',
    'FlowConfig',
    'Org',
    'Dept',
    'Product',
    'Funder'
  )
  // 数据中心相关菜单
  const dataCenterIds = filterIds('DataCenter', 'DataStats', 'AuditLog')
  // 系统管理相关菜单
  const systemFullIds = filterIds(
    'System',
    'User',
    'Role',
    'Menus',
    'DictMgmt',
    'RegionMgmt',
    'FileManage',
    'FileConfig',
    'MsgTemplate',
    'SysParam',
    'Notice',
    'UserCenter',
    'WorkOrder'
  )
  const systemBasicIds = filterIds('System', 'User', 'Role', 'Menus', 'FileManage', 'UserCenter')
  const bizStageIds = filterIds(
    'Business',
    'BusinessPrecheck',
    'BusinessSupplement',
    'BusinessRiskApproval',
    'BusinessFunderFinal',
    'BusinessSigning',
    'BusinessDisbursement',
    'BusinessOrderQuery'
  )
  const bizCoreIds = filterIds(
    'Business',
    'BusinessPrecheck',
    'BusinessSupplement',
    'BusinessRiskApproval',
    'BusinessFunderFinal',
    'BusinessSigning',
    'BusinessDisbursement',
    'BusinessOrderQuery'
  )
  const bizApprovalIds = filterIds(
    'Business',
    'BusinessPrecheck',
    'BusinessSupplement',
    'BusinessRiskApproval',
    'BusinessFunderFinal',
    'BusinessOrderQuery'
  )
  const bizFinanceIds = filterIds(
    'Business',
    'BusinessPrecheck',
    'BusinessSupplement',
    'BusinessRiskApproval',
    'BusinessFunderFinal',
    'BusinessSigning',
    'BusinessDisbursement',
    'BusinessOrderQuery'
  )
  const bizCsIds = filterIds(
    'Business',
    'BusinessPrecheck',
    'BusinessSupplement',
    'BusinessRiskApproval',
    'BusinessFunderFinal',
    'BusinessSigning',
    'BusinessDisbursement',
    'BusinessOrderQuery'
  )
  const bizManagerIds = filterIds(
    'Platform',
    'FlowConfig',
    'Business',
    'BusinessPrecheck',
    'BusinessSupplement',
    'BusinessRiskApproval',
    'BusinessFunderFinal',
    'BusinessSigning',
    'BusinessDisbursement',
    'BusinessOrderQuery'
  )
  const bizAdminIds = filterIds(
    'Platform',
    'FlowConfig',
    'Business',
    'BusinessPrecheck',
    'BusinessSupplement',
    'BusinessRiskApproval',
    'BusinessFunderFinal',
    'BusinessSigning',
    'BusinessDisbursement',
    'BusinessOrderQuery'
  )

  // R_SUPER：全部菜单
  await connectRoleMenus(roleByCode.R_SUPER.id, superMenuIds)
  // R_OPERATION：仪表盘 + 平台管理 + 数据中心 + 车贷业务 + 公告
  await connectRoleMenus(roleByCode.R_OPERATION.id, [
    ...dashIds,
    ...platformIds,
    ...dataCenterIds,
    ...filterIds('Notice'),
    ...bizStageIds,
    ...filterIds('WorkOrder')
  ])
  // R_ADMIN：仪表盘 + 系统基础 + 流程配置 + 全流程业务菜单
  await connectRoleMenus(roleByCode.R_ADMIN.id, [
    ...dashIds,
    ...filterIds('Platform', 'FlowConfig'),
    ...systemBasicIds,
    ...bizAdminIds
  ])
  // R_SALES_MANAGER：仪表盘 + 业务菜单
  await connectRoleMenus(roleByCode.R_SALES_MANAGER.id, [
    ...dashIds,
    ...filterIds('Platform', 'FlowConfig'),
    ...bizManagerIds
  ])
  // R_SALES：仪表盘 + 业务菜单
  await connectRoleMenus(roleByCode.R_SALES.id, [...dashIds, ...bizCoreIds])
  // R_APPROVER：仪表盘 + 审批相关阶段
  await connectRoleMenus(roleByCode.R_APPROVER.id, [...dashIds, ...bizApprovalIds])
  // R_FINANCE：仪表盘 + 财务相关阶段
  await connectRoleMenus(roleByCode.R_FINANCE.id, [...dashIds, ...bizFinanceIds])
  // R_CS_COLLECTION：仪表盘 + 贷后相关业务菜单
  await connectRoleMenus(roleByCode.R_CS_COLLECTION.id, [...dashIds, ...bizCsIds])
  // R_USER：仅仪表盘（移动端操作权限，管理后台无业务菜单）
  await connectRoleMenus(roleByCode.R_USER.id, dashIds)

  await seedBusinessData(tenant.id)

  console.log('Seed completed.')
}

async function seedAllMenus(tenantId: number) {
  const bp = '/business/common-list'

  // ============== 仪表盘 ==============
  const dashboard = await upsertMenu(tenantId, {
    path: '/dashboard',
    name: 'Dashboard',
    component: '/index/index',
    title: '仪表盘',
    icon: 'ri:dashboard-line',
    sort: 10
  })
  const consoleMenu = await upsertMenu(tenantId, {
    parentId: dashboard.id,
    path: 'console',
    name: 'Console',
    component: '/dashboard/console',
    title: '工作台',
    icon: 'ri:computer-line',
    sort: 11,
    keepAlive: true
  })
  const analysis = await upsertMenu(tenantId, {
    parentId: dashboard.id,
    path: 'analysis',
    name: 'Analysis',
    component: '/dashboard/analysis',
    title: '分析页',
    icon: 'ri:line-chart-line',
    sort: 12,
    keepAlive: true
  })

  // ============== 平台管理（超级管理员/平台运营） ==============
  const platform = await upsertMenu(tenantId, {
    path: '/platform',
    name: 'Platform',
    component: '/index/index',
    title: '平台管理',
    icon: 'ri:global-line',
    sort: 20
  })
  const tenantMgmt = await upsertMenu(tenantId, {
    parentId: platform.id,
    path: 'tenant',
    name: 'TenantMgmt',
    component: bp,
    title: '租户机构管理',
    icon: 'ri:building-2-line',
    sort: 21,
    keepAlive: true
  })
  const packageBilling = await upsertMenu(tenantId, {
    parentId: platform.id,
    path: 'package-billing',
    name: 'PackageBilling',
    component: bp,
    title: '套餐与计费',
    icon: 'ri:money-dollar-circle-line',
    sort: 22,
    keepAlive: true
  })
  const productTemplate = await upsertMenu(tenantId, {
    parentId: platform.id,
    path: 'product-template',
    name: 'ProductTemplate',
    component: bp,
    title: '产品与资方模板',
    icon: 'ri:file-copy-line',
    sort: 23,
    keepAlive: true
  })
  const platformSupervision = await upsertMenu(tenantId, {
    parentId: platform.id,
    path: 'supervision',
    name: 'PlatformSupervision',
    component: bp,
    title: '平台业务监管',
    icon: 'ri:eye-line',
    sort: 24,
    keepAlive: true
  })
  const thirdPartyService = await upsertMenu(tenantId, {
    parentId: platform.id,
    path: 'third-party',
    name: 'ThirdPartyService',
    component: bp,
    title: '第三方服务管理',
    icon: 'ri:plug-line',
    sort: 25,
    keepAlive: true
  })
  const workOrder = await upsertMenu(tenantId, {
    parentId: platform.id,
    path: 'work-order',
    name: 'WorkOrder',
    component: bp,
    title: '运营工单中心',
    icon: 'ri:customer-service-2-line',
    sort: 26,
    keepAlive: true
  })
  const flowConfig = await upsertMenu(tenantId, {
    parentId: platform.id,
    path: 'flow-config',
    name: 'FlowConfig',
    component: '/business/flow-config',
    title: '流程与规则',
    icon: 'ri:git-branch-line',
    sort: 71,
    keepAlive: true
  })

  // ============== 数据中心（超级管理员） ==============
  const dataCenter = await upsertMenu(tenantId, {
    path: '/datacenter',
    name: 'DataCenter',
    component: '/index/index',
    title: '数据中心',
    icon: 'ri:bar-chart-box-line',
    sort: 30
  })
  const dataStats = await upsertMenu(tenantId, {
    parentId: dataCenter.id,
    path: 'stats',
    name: 'DataStats',
    component: '/data-center/stats',
    title: '数据统计',
    icon: 'ri:bar-chart-line',
    sort: 31,
    keepAlive: true
  })
  const auditLog = await upsertMenu(tenantId, {
    parentId: dataCenter.id,
    path: 'audit-log',
    name: 'AuditLog',
    component: '/data-center/audit-log',
    title: '日志审计',
    icon: 'ri:file-list-3-line',
    sort: 32,
    keepAlive: true
  })

  // ============== 系统管理 ==============
  const system = await upsertMenu(tenantId, {
    path: '/system',
    name: 'System',
    component: '/index/index',
    title: '系统管理',
    icon: 'ri:settings-3-line',
    sort: 40
  })
  const user = await upsertMenu(tenantId, {
    parentId: system.id,
    path: 'user',
    name: 'User',
    component: '/system/user',
    title: '用户管理',
    icon: 'ri:user-line',
    sort: 41,
    keepAlive: true
  })
  const role = await upsertMenu(tenantId, {
    parentId: system.id,
    path: 'role',
    name: 'Role',
    component: '/system/role',
    title: '角色管理',
    icon: 'ri:user-settings-line',
    sort: 42,
    keepAlive: true
  })
  const menu = await upsertMenu(tenantId, {
    parentId: system.id,
    path: 'menu',
    name: 'Menus',
    component: '/system/menu',
    title: '菜单管理',
    icon: 'ri:menu-line',
    sort: 43,
    keepAlive: true
  })
  const dictMgmt = await upsertMenu(tenantId, {
    parentId: system.id,
    path: 'dict',
    name: 'DictMgmt',
    component: '/system/dict',
    title: '字典管理',
    icon: 'ri:book-open-line',
    sort: 44,
    keepAlive: true
  })
  const regionMgmt = await upsertMenu(tenantId, {
    parentId: system.id,
    path: 'region',
    name: 'RegionMgmt',
    component: bp,
    title: '地区管理',
    icon: 'ri:map-pin-line',
    sort: 45,
    keepAlive: true
  })
  const fileManage = await upsertMenu(tenantId, {
    parentId: system.id,
    path: 'file',
    name: 'FileManage',
    component: '/system/file',
    title: '文件管理',
    icon: 'ri:file-list-3-line',
    sort: 46,
    keepAlive: true
  })
  const fileConfig = await upsertMenu(tenantId, {
    parentId: system.id,
    path: 'file-config',
    name: 'FileConfig',
    component: '/system/file-config',
    title: '文件存储配置',
    icon: 'ri:hard-drive-2-line',
    sort: 47,
    keepAlive: true
  })
  const msgTemplate = await upsertMenu(tenantId, {
    parentId: system.id,
    path: 'msg-template',
    name: 'MsgTemplate',
    component: bp,
    title: '消息模板',
    icon: 'ri:mail-send-line',
    sort: 48,
    keepAlive: true
  })
  const sysParam = await upsertMenu(tenantId, {
    parentId: system.id,
    path: 'sys-param',
    name: 'SysParam',
    component: bp,
    title: '系统参数',
    icon: 'ri:settings-line',
    sort: 49,
    keepAlive: true
  })
  const notice = await upsertMenu(tenantId, {
    parentId: system.id,
    path: 'notice',
    name: 'Notice',
    component: bp,
    title: '公告管理',
    icon: 'ri:notification-line',
    sort: 50,
    keepAlive: true
  })
  const userCenter = await upsertMenu(tenantId, {
    parentId: system.id,
    path: 'user-center',
    name: 'UserCenter',
    component: '/system/user-center',
    title: '用户中心',
    icon: 'ri:user-line',
    sort: 51,
    keepAlive: true,
    hidden: true,
    hiddenTab: true
  })
  const systemWorkOrder = await upsertMenu(tenantId, {
    parentId: system.id,
    path: 'work-order',
    name: 'WorkOrder',
    component: '/system/work-order',
    title: '执行工单',
    icon: 'ri:customer-service-2-line',
    sort: 52,
    keepAlive: true
  })

  // ============== 读书管理 ==============
  const reading = await upsertMenu(tenantId, {
    path: '/reading',
    name: 'Reading',
    component: '/index/index',
    title: '读书管理',
    icon: 'ri:book-3-line',
    sort: 55
  })
  const readingBookshelf = await upsertMenu(tenantId, {
    parentId: reading.id,
    path: 'bookshelf',
    name: 'ReadingBookshelf',
    component: '/reading/bookshelf/index',
    title: '书架管理',
    icon: 'ri:bookshelf-line',
    sort: 551,
    keepAlive: true
  })
  const readingBooks = await upsertMenu(tenantId, {
    parentId: reading.id,
    path: 'books',
    name: 'ReadingBooks',
    component: '/reading/books/index',
    title: '图书管理',
    icon: 'ri:book-open-line',
    sort: 552,
    keepAlive: true
  })
  const readingCategory = await upsertMenu(tenantId, {
    parentId: reading.id,
    path: 'category',
    name: 'ReadingCategory',
    component: '/reading/category/index',
    title: '分类管理',
    icon: 'ri:folder-2-line',
    sort: 553,
    keepAlive: true
  })
  const readingComment = await upsertMenu(tenantId, {
    parentId: reading.id,
    path: 'comment',
    name: 'ReadingComment',
    component: '/reading/comment/index',
    title: '评论管理',
    icon: 'ri:chat-3-line',
    sort: 554,
    keepAlive: true
  })

  // ============== 业务管理 ==============
  const business = await upsertMenu(tenantId, {
    path: '/business',
    name: 'Business',
    component: '/index/index',
    title: '业务管理',
    icon: 'ri:briefcase-line',
    sort: 60
  })
  const businessPrecheck = await upsertMenu(tenantId, {
    parentId: business.id,
    path: 'precheck',
    name: 'BusinessPrecheck',
    component: bp,
    title: '预审阶段',
    icon: 'ri:file-search-line',
    sort: 61,
    keepAlive: true
  })
  const businessSupplement = await upsertMenu(tenantId, {
    parentId: business.id,
    path: 'supplement',
    name: 'BusinessSupplement',
    component: bp,
    title: '补件阶段',
    icon: 'ri:folder-upload-line',
    sort: 62,
    keepAlive: true
  })
  const businessRiskApproval = await upsertMenu(tenantId, {
    parentId: business.id,
    path: 'risk-approval',
    name: 'BusinessRiskApproval',
    component: bp,
    title: '风控审批',
    icon: 'ri:shield-check-line',
    sort: 63,
    keepAlive: true
  })
  const businessFunderFinal = await upsertMenu(tenantId, {
    parentId: business.id,
    path: 'funder-final',
    name: 'BusinessFunderFinal',
    component: bp,
    title: '资方终审',
    icon: 'ri:bank-line',
    sort: 64,
    keepAlive: true
  })
  const businessSigning = await upsertMenu(tenantId, {
    parentId: business.id,
    path: 'signing',
    name: 'BusinessSigning',
    component: bp,
    title: '客户签约',
    icon: 'ri:contract-line',
    sort: 65,
    keepAlive: true
  })
  const businessDisbursement = await upsertMenu(tenantId, {
    parentId: business.id,
    path: 'disbursement',
    name: 'BusinessDisbursement',
    component: bp,
    title: '请款放款',
    icon: 'ri:money-cny-circle-line',
    sort: 66,
    keepAlive: true
  })
  const org = await upsertMenu(tenantId, {
    parentId: business.id,
    path: 'org',
    name: 'Org',
    component: bp,
    title: '机构管理',
    icon: 'ri:building-line',
    sort: 61,
    keepAlive: true
  })
  const dept = await upsertMenu(tenantId, {
    parentId: business.id,
    path: 'dept',
    name: 'Dept',
    component: bp,
    title: '部门管理',
    icon: 'ri:organization-chart',
    sort: 62,
    keepAlive: true
  })
  const product = await upsertMenu(tenantId, {
    parentId: business.id,
    path: 'product',
    name: 'Product',
    component: bp,
    title: '产品配置',
    icon: 'ri:file-list-line',
    sort: 63,
    keepAlive: true
  })
  const funder = await upsertMenu(tenantId, {
    parentId: business.id,
    path: 'funder',
    name: 'Funder',
    component: bp,
    title: '资方配置',
    icon: 'ri:bank-line',
    sort: 64,
    keepAlive: true
  })
  const lead = await upsertMenu(tenantId, {
    parentId: business.id,
    path: 'lead',
    name: 'Lead',
    component: bp,
    title: '线索管理',
    icon: 'ri:customer-service-line',
    sort: 66,
    keepAlive: true
  })
  const preEntry = await upsertMenu(tenantId, {
    parentId: business.id,
    path: 'pre-entry',
    name: 'PreEntry',
    component: bp,
    title: '预审进件',
    icon: 'ri:file-edit-line',
    sort: 67,
    keepAlive: true
  })
  const riskPre = await upsertMenu(tenantId, {
    parentId: business.id,
    path: 'risk-pre',
    name: 'RiskPre',
    component: bp,
    title: '风控预审',
    icon: 'ri:robot-2-line',
    sort: 68,
    keepAlive: true
  })
  const funderPre = await upsertMenu(tenantId, {
    parentId: business.id,
    path: 'funder-pre',
    name: 'FunderPre',
    component: bp,
    title: '资方预审',
    icon: 'ri:bank-card-line',
    sort: 69,
    keepAlive: true
  })
  const supplement = await upsertMenu(tenantId, {
    parentId: business.id,
    path: 'supplement',
    name: 'Supplement',
    component: bp,
    title: '资料补充',
    icon: 'ri:folder-upload-line',
    sort: 70,
    keepAlive: true
  })
  const firstReview = await upsertMenu(tenantId, {
    parentId: business.id,
    path: 'first-review',
    name: 'FirstReview',
    component: bp,
    title: '风控初审',
    icon: 'ri:shield-check-line',
    sort: 71,
    keepAlive: true
  })
  const finalReview = await upsertMenu(tenantId, {
    parentId: business.id,
    path: 'final-review',
    name: 'FinalReview',
    component: bp,
    title: '风控终审',
    icon: 'ri:verified-badge-line',
    sort: 72,
    keepAlive: true
  })
  const loanRequest = await upsertMenu(tenantId, {
    parentId: business.id,
    path: 'loan-request',
    name: 'LoanRequest',
    component: bp,
    title: '请款资料',
    icon: 'ri:file-paper-2-line',
    sort: 73,
    keepAlive: true
  })
  const funderFinal = await upsertMenu(tenantId, {
    parentId: business.id,
    path: 'funder-final',
    name: 'FunderFinal',
    component: bp,
    title: '资方终审',
    icon: 'ri:bank-line',
    sort: 74,
    keepAlive: true
  })
  const disbursementNode = await upsertMenu(tenantId, {
    parentId: business.id,
    path: 'disbursement-node',
    name: 'DisbursementNode',
    component: bp,
    title: '资方放款',
    icon: 'ri:money-cny-circle-line',
    sort: 75,
    keepAlive: true
  })
  const customer = await upsertMenu(tenantId, {
    parentId: business.id,
    path: 'customer',
    name: 'Customer',
    component: bp,
    title: '客户管理',
    icon: 'ri:contacts-line',
    sort: 76,
    keepAlive: true
  })
  const application = await upsertMenu(tenantId, {
    parentId: business.id,
    path: 'application',
    name: 'Application',
    component: bp,
    title: '全部进件',
    icon: 'ri:file-edit-line',
    sort: 77,
    keepAlive: true
  })
  const orderQuery = await upsertMenu(tenantId, {
    parentId: business.id,
    path: 'order-query',
    name: 'BusinessOrderQuery',
    component: bp,
    title: '综合查询',
    icon: 'ri:search-eye-line',
    sort: 67,
    keepAlive: true
  })
  const approval = await upsertMenu(tenantId, {
    parentId: business.id,
    path: 'approval',
    name: 'Approval',
    component: bp,
    title: '审批记录',
    icon: 'ri:shield-check-line',
    sort: 79,
    keepAlive: true
  })
  const signing = await upsertMenu(tenantId, {
    parentId: business.id,
    path: 'signing',
    name: 'Signing',
    component: bp,
    title: '签约管理',
    icon: 'ri:pen-nib-line',
    sort: 80,
    keepAlive: true
  })
  const disbursement = await upsertMenu(tenantId, {
    parentId: business.id,
    path: 'disbursement',
    name: 'Disbursement',
    component: bp,
    title: '放款管理',
    icon: 'ri:money-cny-circle-line',
    sort: 81,
    keepAlive: true
  })
  const orderMgmt = await upsertMenu(tenantId, {
    parentId: business.id,
    path: 'order',
    name: 'OrderMgmt',
    component: bp,
    title: '订单管理',
    icon: 'ri:file-list-2-line',
    sort: 82,
    keepAlive: true
  })
  const repayment = await upsertMenu(tenantId, {
    parentId: business.id,
    path: 'repayment',
    name: 'Repayment',
    component: bp,
    title: '还款管理',
    icon: 'ri:refund-line',
    sort: 83,
    keepAlive: true
  })
  const reports = await upsertMenu(tenantId, {
    parentId: business.id,
    path: 'reports',
    name: 'Reports',
    component: bp,
    title: '报表统计',
    icon: 'ri:pie-chart-line',
    sort: 84,
    keepAlive: true
  })
  const orgConfig = await upsertMenu(tenantId, {
    parentId: business.id,
    path: 'org-config',
    name: 'OrgConfig',
    component: bp,
    title: '机构配置',
    icon: 'ri:tools-line',
    sort: 85,
    keepAlive: true
  })

  await prisma.menu.updateMany({
    where: {
      tenantId,
      parentId: business.id,
      name: {
        notIn: [
          'BusinessPrecheck',
          'BusinessSupplement',
          'BusinessRiskApproval',
          'BusinessFunderFinal',
          'BusinessSigning',
          'BusinessDisbursement',
          'BusinessOrderQuery'
        ]
      }
    },
    data: { hidden: true, hiddenTab: true }
  })

  await prisma.menu.updateMany({
    where: {
      tenantId,
      parentId: business.id,
      name: {
        in: [
          'BusinessPrecheck',
          'BusinessSupplement',
          'BusinessRiskApproval',
          'BusinessFunderFinal',
          'BusinessSigning',
          'BusinessDisbursement',
          'BusinessOrderQuery'
        ]
      }
    },
    data: { hidden: false, hiddenTab: false }
  })

  // 初始化按钮权限
  const bizMenus = [
    reading,
    readingBookshelf,
    readingBooks,
    readingCategory,
    readingComment,
    tenantMgmt,
    packageBilling,
    productTemplate,
    platformSupervision,
    thirdPartyService,
    workOrder,
    dataStats,
    auditLog,
    businessPrecheck,
    businessSupplement,
    businessRiskApproval,
    businessFunderFinal,
    businessSigning,
    businessDisbursement,
    orderQuery,
    org,
    dept,
    product,
    funder,
    flowConfig,
    lead,
    preEntry,
    riskPre,
    funderPre,
    supplement,
    firstReview,
    finalReview,
    loanRequest,
    funderFinal,
    disbursementNode,
    customer,
    application,
    approval,
    signing,
    disbursement,
    orderMgmt,
    repayment,
    reports,
    orgConfig,
    menu,
    dictMgmt,
    regionMgmt,
    fileManage,
    msgTemplate,
    notice
  ]
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
    dashboard,
    consoleMenu,
    analysis,
    platform,
    tenantMgmt,
    packageBilling,
    productTemplate,
    platformSupervision,
    thirdPartyService,
    workOrder,
    dataCenter,
    dataStats,
    auditLog,
    system,
    user,
    role,
    menu,
    dictMgmt,
    regionMgmt,
    fileManage,
    fileConfig,
    msgTemplate,
    sysParam,
    notice,
    userCenter,
    reading,
    readingBookshelf,
    readingBooks,
    readingCategory,
    readingComment,
    business,
    businessPrecheck,
    businessSupplement,
    businessRiskApproval,
    businessFunderFinal,
    businessSigning,
    businessDisbursement,
    org,
    dept,
    product,
    funder,
    flowConfig,
    lead,
    preEntry,
    riskPre,
    funderPre,
    supplement,
    firstReview,
    finalReview,
    loanRequest,
    funderFinal,
    disbursementNode,
    customer,
    application,
    orderQuery,
    approval,
    signing,
    disbursement,
    orderMgmt,
    repayment,
    reports,
    orgConfig
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

async function resetBusinessMenuGrants(tenantId: number) {
  const business = await prisma.menu.findUnique({
    where: { tenantId_name: { tenantId, name: 'Business' } }
  })

  if (!business) return

  await prisma.roleMenu.deleteMany({
    where: {
      menu: {
        tenantId,
        OR: [{ id: business.id }, { parentId: business.id }]
      }
    }
  })
}

function buildDefaultFlowRule(node: (typeof defaultFlowNodes)[number]): Prisma.InputJsonObject {
  const parentNode = 'parentNode' in node && node.parentNode ? node.parentNode : undefined
  return {
    nodeCode: node.code,
    phaseCode: node.phaseCode,
    phaseName: node.phaseName,
    sort: node.sort,
    parallel: Boolean('parallel' in node && node.parallel),
    required: Boolean('required' in node && node.required),
    initialStatus: 'parentNode' in node && node.parentNode ? 0 : 10,
    transitions: ('transitions' in node ? node.transitions || [] : []) as Prisma.InputJsonValue,
    operationSide: 'operationSide' in node ? node.operationSide : undefined,
    executor: 'executor' in node ? node.executor : undefined,
    steps: ('steps' in node ? node.steps || [] : []) as Prisma.InputJsonValue,
    ...(parentNode ? { parentNode } : {})
  }
}

async function seedDefaultFlowConfigs(tenantId: number, orgId: number, businessType = 'CAR_LOAN') {
  await prisma.flowConfig.deleteMany({
    where: {
      orgId,
      businessType,
      nodeCode: { in: obsoleteDefaultFlowNodeCodes }
    }
  })

  for (const node of defaultFlowNodes) {
    await prisma.flowConfig.upsert({
      where: {
        orgId_businessType_nodeCode: {
          orgId,
          businessType,
          nodeCode: String(node.code)
        }
      },
      update: {
        tenantId,
        name: `${node.phaseName}-${node.name}`,
        nodeName: node.name,
        approveLevel: 'approveLevel' in node && node.approveLevel ? node.approveLevel : 1,
        amountLimit: ('amountLimit' in node ? (node as any).amountLimit : undefined),
        requireMaterials: Boolean('requireMaterials' in node && node.requireMaterials),
        requireApproval: 'requireApproval' in node ? node.requireApproval : true,
        autoPass: Boolean('autoPass' in node && node.autoPass),
        ruleConfig: buildDefaultFlowRule(node),
        status: 'ACTIVE'
      },
      create: {
        tenantId,
        orgId,
        name: `${node.phaseName}-${node.name}`,
        businessType,
        nodeCode: String(node.code),
        nodeName: node.name,
        approveLevel: 'approveLevel' in node && node.approveLevel ? node.approveLevel : 1,
        requireMaterials: Boolean('requireMaterials' in node && node.requireMaterials),
        requireApproval: 'requireApproval' in node ? node.requireApproval : true,
        autoPass: Boolean('autoPass' in node && node.autoPass),
        ruleConfig: buildDefaultFlowRule(node),
        status: 'ACTIVE'
      }
    })
  }
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
      name: '示例汽车金融机构',
      contactName: '张经理',
      contactPhone: '13810000000',
      address: '北京市朝阳区示范路 100 号',
      status: 'ACTIVE',
      packageType: 'STANDARD',
      apiEnabled: true
    },
    create: {
      tenantId,
      name: '示例汽车金融机构',
      code: 'DEMO_ORG',
      creditCode: '91110000DEMO000001',
      contactName: '张经理',
      contactPhone: '13810000000',
      address: '北京市朝阳区示范路 100 号',
      status: 'ACTIVE',
      packageType: 'STANDARD',
      apiEnabled: true
    }
  })

  await seedDefaultFlowConfigs(tenantId, org.id)

  const dept = await prisma.department.upsert({
    where: { orgId_name: { orgId: org.id, name: '汽车金融业务一部' } },
    update: {
      tenantId,
      managerId: sales.id,
      sort: 1
    },
    create: {
      tenantId,
      orgId: org.id,
      name: '汽车金融业务一部',
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
    name: '标准车辆抵押贷',
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
      name: '示例银行资方',
      funderType: 'BANK',
      contactName: '李经理',
      contactPhone: '13810000001',
      priority: 1,
      status: 'ACTIVE'
    },
    create: {
      tenantId,
      orgId: org.id,
      name: '示例银行资方',
      code: 'DEMO_BANK',
      funderType: 'BANK',
      contactName: '李经理',
      contactPhone: '13810000001',
      priority: 1,
      status: 'ACTIVE'
    }
  })

  const leadData: Prisma.LeadUncheckedCreateInput = {
    tenantId,
    orgId: org.id,
    source: 'SELF',
    name: '王小明',
    phone: '13910000001',
    idCard: '110101199001010011',
    carBrand: '大众',
    carModel: '迈腾',
    loanAmount: 120000,
    remark: '客户计划申请经营周转贷款',
    status: LeadStatus.FOLLOWING,
    assigneeId: sales.id,
    createdBy: sales.id,
    nextFollowAt: new Date('2026-06-01T10:00:00+08:00')
  }
  const leadUpdateData: Prisma.LeadUncheckedUpdateInput = { ...leadData }
  const existedLead = await prisma.lead.findFirst({
    where: { tenantId, orgId: org.id, phone: leadData.phone }
  })
  const lead = existedLead
    ? await prisma.lead.update({ where: { id: existedLead.id }, data: leadUpdateData })
    : await prisma.lead.create({ data: leadData })

  const customer = await prisma.customer.upsert({
    where: { orgId_phone: { orgId: org.id, phone: '13910000001' } },
    update: {
      tenantId,
      name: '王小明',
      idCard: '110101199001010011',
      gender: 'MALE',
      companyName: '北京示范商贸有限公司',
      monthlyIncome: 28000,
      address: '北京市海淀区示范小区 8 号',
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
      companyName: '北京示范商贸有限公司',
      monthlyIncome: 28000,
      address: '北京市海淀区示范小区 8 号',
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
    bankName: '示范银行',
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
    address: '北京市海淀区示范小区 8 号',
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
    where: {
      leadId: lead.id,
      content: {
        in: ['客户已提交车辆资料，准备转进件。', '客户已提交车辆资料，准备转入进件流程。']
      }
    }
  })
  const followUpData = {
    leadId: lead.id,
    followType: 'PHONE',
    content: '客户已提交车辆资料，准备转入进件流程。',
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
      currentNode: 6100,
      currentStatus: 10,
      creatorId: sales.id,
      sourceLeadId: lead.id,
      approvedAmount: 115000,
      approvedTerm: 24,
      approvedRate: 0.066,
      remark: '示例订单数据'
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
      currentNode: 6100,
      currentStatus: 10,
      creatorId: sales.id,
      sourceLeadId: lead.id,
      approvedAmount: 115000,
      approvedTerm: 24,
      approvedRate: 0.066,
      remark: '示例订单数据'
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
      opinion: '资料完整，初审通过。',
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
      opinion: '终审通过，可进入签约与放款阶段。',
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
      remark: '待财务确认放款。'
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
      remark: '待财务确认放款。'
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
