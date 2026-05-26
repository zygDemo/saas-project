import { PrismaClient, UserStatus } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const statusMap = {
  Super: UserStatus.ONLINE,
  Admin: UserStatus.ONLINE,
  User: UserStatus.OFFLINE
} as const

async function main() {
  const passwordHash = await bcrypt.hash('123456', 10)

  const roles = await Promise.all(
    [
      { name: 'Super Admin', code: 'R_SUPER', description: 'Full system access' },
      { name: 'Admin', code: 'R_ADMIN', description: 'Most admin features' },
      { name: 'User', code: 'R_USER', description: 'Basic access' }
    ].map((role) =>
      prisma.role.upsert({
        where: { code: role.code },
        update: role,
        create: role
      })
    )
  )

  const roleByCode = Object.fromEntries(roles.map((role) => [role.code, role]))

  await Promise.all(
    [
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
        userName: 'User',
        nickName: 'User',
        email: 'user@example.com',
        phone: '13800000003',
        gender: 'Unknown',
        roleCode: 'R_USER'
      }
    ].map(async (user) => {
      const saved = await prisma.user.upsert({
        where: { userName: user.userName },
        update: {
          nickName: user.nickName,
          email: user.email,
          phone: user.phone,
          gender: user.gender,
          status: statusMap[user.userName as keyof typeof statusMap],
          passwordHash
        },
        create: {
          userName: user.userName,
          nickName: user.nickName,
          email: user.email,
          phone: user.phone,
          gender: user.gender,
          status: statusMap[user.userName as keyof typeof statusMap],
          passwordHash
        }
      })

      await prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: saved.id,
            roleId: roleByCode[user.roleCode].id
          }
        },
        update: {},
        create: {
          userId: saved.id,
          roleId: roleByCode[user.roleCode].id
        }
      })
    })
  )

  const menus = await seedMenus()
  await connectRoleMenus(roleByCode.R_SUPER.id, menus.map((menu) => menu.id))
  await connectRoleMenus(
    roleByCode.R_ADMIN.id,
    menus.filter((menu) => !['Role', 'Menus'].includes(menu.name)).map((menu) => menu.id)
  )
  await connectRoleMenus(
    roleByCode.R_USER.id,
    menus.filter((menu) => ['Dashboard', 'Console'].includes(menu.name)).map((menu) => menu.id)
  )

  const menuPermission = await prisma.permission.findFirst({
    where: { authMark: 'add', menu: { name: 'Menus' } }
  })
  if (menuPermission) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: roleByCode.R_SUPER.id,
          permissionId: menuPermission.id
        }
      },
      update: {},
      create: {
        roleId: roleByCode.R_SUPER.id,
        permissionId: menuPermission.id
      }
    })
  }
}

async function seedMenus() {
  const dashboard = await upsertMenu({
    path: '/dashboard',
    name: 'Dashboard',
    component: '/index/index',
    title: 'menus.dashboard.title',
    icon: 'ri:dashboard-line',
    sort: 10
  })
  const consoleMenu = await upsertMenu({
    parentId: dashboard.id,
    path: 'console',
    name: 'Console',
    component: '/dashboard/console',
    title: 'menus.dashboard.console',
    icon: 'ri:computer-line',
    sort: 11,
    keepAlive: true
  })
  const analysis = await upsertMenu({
    parentId: dashboard.id,
    path: 'analysis',
    name: 'Analysis',
    component: '/dashboard/analysis',
    title: 'menus.dashboard.analysis',
    icon: 'ri:line-chart-line',
    sort: 12,
    keepAlive: true
  })
  const system = await upsertMenu({
    path: '/system',
    name: 'System',
    component: '/index/index',
    title: 'menus.system.title',
    icon: 'ri:user-3-line',
    sort: 20
  })
  const user = await upsertMenu({
    parentId: system.id,
    path: 'user',
    name: 'User',
    component: '/system/user',
    title: 'menus.system.user',
    icon: 'ri:user-line',
    sort: 21,
    keepAlive: true
  })
  const role = await upsertMenu({
    parentId: system.id,
    path: 'role',
    name: 'Role',
    component: '/system/role',
    title: 'menus.system.role',
    icon: 'ri:user-settings-line',
    sort: 22,
    keepAlive: true
  })
  const menu = await upsertMenu({
    parentId: system.id,
    path: 'menu',
    name: 'Menus',
    component: '/system/menu',
    title: 'menus.system.menu',
    icon: 'ri:menu-line',
    sort: 23,
    keepAlive: true
  })

  await Promise.all(
    ['add', 'edit', 'delete'].map((authMark) =>
      prisma.permission.upsert({
        where: { menuId_authMark: { menuId: menu.id, authMark } },
        update: { title: permissionTitle(authMark) },
        create: { menuId: menu.id, authMark, title: permissionTitle(authMark) }
      })
    )
  )

  return [dashboard, consoleMenu, analysis, system, user, role, menu]
}

function permissionTitle(authMark: string) {
  return ({ add: 'Add', edit: 'Edit', delete: 'Delete' } as Record<string, string>)[authMark]
}

async function upsertMenu(data: {
  parentId?: number
  path: string
  name: string
  component: string
  title: string
  icon: string
  sort: number
  keepAlive?: boolean
}) {
  return prisma.menu.upsert({
    where: { name: data.name },
    update: data,
    create: data
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
