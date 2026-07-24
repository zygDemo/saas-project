/**
 * 单独插入"执行工单"菜单
 * 在 Windows VSCode 终端执行：npx tsx prisma/add-work-order-menu.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // 1. 找到系统管理菜单
  const system = await prisma.menu.findFirst({
    where: { name: 'System', path: '/system' }
  })

  if (!system) {
    console.error('❌ 未找到"系统管理"菜单，请先运行 seed')
    process.exit(1)
  }

  // 2. 检查是否已存在
  const exists = await prisma.menu.findFirst({
    where: { name: 'WorkOrder', parentId: system.id }
  })

  if (exists) {
    console.log('✅ "执行工单"菜单已存在，跳过插入')
  } else {
    // 3. 插入菜单
    const menu = await prisma.menu.create({
      data: {
        parentId: system.id,
        path: 'work-order',
        name: 'WorkOrder',
        title: '执行工单',
        component: '/system/work-order',
        meta: {
          title: '执行工单',
          icon: 'ri:customer-service-2-line',
          sort: 52,
          keepAlive: true,
          isHide: false,
          isHideTab: false,
          link: null,
          isIframe: false,
          roles: ['R_SUPER'],
          authList: [
            { title: '新增', authMark: 'add' },
            { title: '指派', authMark: 'assign' },
            { title: '处理', authMark: 'process' },
            { title: '删除', authMark: 'delete' }
          ]
        }
      }
    })
    console.log(`✅ 菜单创建成功: ${menu.name} (id: ${menu.id})`)

    // 4. 给 R_SUPER 绑定权限
    const superRole = await prisma.role.findFirst({
      where: { code: 'R_SUPER' }
    })

    if (superRole) {
      await prisma.roleMenu.create({
        data: {
          roleId: superRole.id,
          menuId: menu.id
        }
      })
      console.log('✅ R_SUPER 角色权限绑定成功')
    }
  }

  // 5. 验证
  const all = await prisma.menu.findMany({
    where: { parentId: system.id },
    orderBy: { id: 'asc' }
  })
  console.log('\n系统管理子菜单:')
  all.forEach(m => {
    const meta = m.meta as any
    console.log(`  ${meta?.sort || '-'} | ${meta?.title || m.name} (${m.path})`)
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
