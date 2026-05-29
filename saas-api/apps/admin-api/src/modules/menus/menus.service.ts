import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { getCurrentTenantId } from '../../common/tenant/tenant-context'
import { PrismaService } from '../prisma/prisma.service'
import { CreateMenuDto, CreatePermissionDto, UpdateMenuDto, UpdatePermissionDto } from './dto/menu.dto'

type MenuWithRelations = Prisma.MenuGetPayload<{
  include: {
    permissions: {
      include: {
        roles: { include: { role: true } }
      }
    }
    roles: { include: { role: true } }
  }
}>

export interface AppRouteRecord {
  id: number
  parentId: number | null
  path: string
  name: string
  component: string
  meta: Record<string, unknown>
  children?: AppRouteRecord[]
}

@Injectable()
export class MenusService {
  constructor(private readonly prisma: PrismaService) {}

  async getMenuTree(roleCodes?: string[]): Promise<AppRouteRecord[]> {
    const menus = await this.prisma.menu.findMany({
      where: roleCodes?.length
        ? {
            roles: {
              some: {
                role: {
                  code: { in: roleCodes },
                  enabled: true
                }
              }
            }
          }
        : undefined,
      include: menuInclude(roleCodes),
      orderBy: [{ sort: 'asc' }, { id: 'asc' }]
    })

    return buildTree(menus)
  }

  async createMenu(dto: CreateMenuDto) {
    const tenantId = getRequiredTenantId()
    await this.assertMenuNameAvailable(dto.name)
    await this.assertParentExists(dto.parentId)

    const menu = await this.prisma.menu.create({
      data: {
        tenantId,
        parentId: dto.parentId ?? null,
        path: dto.path,
        name: dto.name,
        component: dto.component ?? '',
        title: dto.title,
        icon: dto.icon,
        sort: dto.sort ?? 0,
        keepAlive: dto.keepAlive ?? false,
        hidden: dto.hidden ?? false,
        hiddenTab: dto.hiddenTab ?? false,
        link: dto.link,
        iframe: dto.iframe ?? false
      }
    })

    await this.syncMenuRoles(menu.id, dto.roleCodes)
    return this.getMenuById(menu.id)
  }

  async updateMenu(id: number, dto: UpdateMenuDto) {
    const menu = await this.prisma.menu.findUnique({ where: { id } })
    if (!menu) throw new NotFoundException('Menu not found')

    if (dto.name && dto.name !== menu.name) {
      await this.assertMenuNameAvailable(dto.name, id)
    }
    await this.assertParentExists(dto.parentId, id)

    await this.prisma.menu.update({
      where: { id },
      data: {
        parentId: dto.parentId,
        path: dto.path,
        name: dto.name,
        component: dto.component,
        title: dto.title,
        icon: dto.icon,
        sort: dto.sort,
        keepAlive: dto.keepAlive,
        hidden: dto.hidden,
        hiddenTab: dto.hiddenTab,
        link: dto.link,
        iframe: dto.iframe
      }
    })

    if (dto.roleCodes) {
      await this.syncMenuRoles(id, dto.roleCodes)
    }

    return this.getMenuById(id)
  }

  async deleteMenu(id: number) {
    const menu = await this.prisma.menu.findUnique({ where: { id } })
    if (!menu) throw new NotFoundException('Menu not found')

    await this.prisma.menu.delete({ where: { id } })
    return { id }
  }

  async createPermission(menuId: number, dto: CreatePermissionDto) {
    const tenantId = getRequiredTenantId()
    const menu = await this.prisma.menu.findUnique({ where: { id: menuId } })
    if (!menu) throw new NotFoundException('Menu not found')
    await this.assertPermissionMarkAvailable(menuId, dto.authMark)

    const permission = await this.prisma.permission.create({
      data: {
        tenantId,
        menuId,
        title: dto.title,
        authMark: dto.authMark
      }
    })

    await this.syncPermissionRoles(permission.id, dto.roleCodes)
    return this.getPermissionById(permission.id)
  }

  async updatePermission(id: number, dto: UpdatePermissionDto) {
    const permission = await this.prisma.permission.findUnique({ where: { id } })
    if (!permission) throw new NotFoundException('Permission not found')
    if (dto.authMark && dto.authMark !== permission.authMark) {
      await this.assertPermissionMarkAvailable(permission.menuId, dto.authMark, id)
    }

    await this.prisma.permission.update({
      where: { id },
      data: {
        title: dto.title,
        authMark: dto.authMark
      }
    })

    if (dto.roleCodes) {
      await this.syncPermissionRoles(id, dto.roleCodes)
    }

    return this.getPermissionById(id)
  }

  async deletePermission(id: number) {
    const permission = await this.prisma.permission.findUnique({ where: { id } })
    if (!permission) throw new NotFoundException('Permission not found')

    await this.prisma.permission.delete({ where: { id } })
    return { id }
  }

  private async getMenuById(id: number) {
    const menu = await this.prisma.menu.findUnique({
      where: { id },
      include: menuInclude()
    })
    if (!menu) throw new NotFoundException('Menu not found')
    return mapMenu(menu)
  }

  private async getPermissionById(id: number) {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
      include: { roles: { include: { role: true } } }
    })
    if (!permission) throw new NotFoundException('Permission not found')

    return {
      id: permission.id,
      menuId: permission.menuId,
      title: permission.title,
      authMark: permission.authMark,
      roles: permission.roles.map(({ role }: any) => role.code)
    }
  }

  private async syncMenuRoles(menuId: number, roleCodes?: string[]) {
    if (!roleCodes) return

    const roles = await this.getRolesByCodes(roleCodes)

    await this.prisma.$transaction([
      this.prisma.roleMenu.deleteMany({ where: { menuId } }),
      ...(roles.length
        ? [
            this.prisma.roleMenu.createMany({
              data: roles.map((role: any) => ({ menuId, roleId: role.id })),
              skipDuplicates: true
            })
          ]
        : [])
    ])
  }

  private async syncPermissionRoles(permissionId: number, roleCodes?: string[]) {
    if (!roleCodes) return

    const roles = await this.getRolesByCodes(roleCodes)

    await this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({ where: { permissionId } }),
      ...(roles.length
        ? [
            this.prisma.rolePermission.createMany({
              data: roles.map((role: any) => ({ permissionId, roleId: role.id })),
              skipDuplicates: true
            })
          ]
        : [])
    ])
  }

  private async getRolesByCodes(roleCodes: string[]) {
    const uniqueRoleCodes = [...new Set(roleCodes)]
    const roles = await this.prisma.role.findMany({
      where: { code: { in: uniqueRoleCodes } },
      select: { id: true, code: true }
    })
    const roleCodeSet = new Set(roles.map((role: any) => role.code))
    const missingRoleCodes = uniqueRoleCodes.filter((roleCode) => !roleCodeSet.has(roleCode))

    if (missingRoleCodes.length > 0) {
      throw new BadRequestException(`Role not found: ${missingRoleCodes.join(', ')}`)
    }

    return roles
  }

  private async assertMenuNameAvailable(name: string, excludeId?: number) {
    const existedMenu = await this.prisma.menu.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } }
    })
    if (existedMenu && existedMenu.id !== excludeId) {
      throw new ConflictException('菜单标识已存在，请换一个')
    }
  }

  private async assertPermissionMarkAvailable(menuId: number, authMark: string, excludeId?: number) {
    const existedPermission = await this.prisma.permission.findFirst({
      where: { menuId, authMark: { equals: authMark, mode: 'insensitive' } }
    })
    if (existedPermission && existedPermission.id !== excludeId) {
      throw new ConflictException('权限标识已存在，请换一个')
    }
  }

  private async assertParentExists(parentId?: number | null, currentId?: number) {
    if (!parentId) return
    if (parentId === currentId) throw new ConflictException('不能选择自己作为上级菜单')

    const parent = await this.prisma.menu.findUnique({ where: { id: parentId } })
    if (!parent) throw new NotFoundException('Parent menu not found')
  }
}

function getRequiredTenantId() {
  const tenantId = getCurrentTenantId()
  if (!tenantId) throw new BadRequestException('X-Tenant-ID header is required')
  return tenantId
}

function menuInclude(roleCodes?: string[]) {
  return {
    permissions: {
      where: roleCodes
        ? {
            roles: {
              some: {
                role: {
                  code: { in: roleCodes }
                }
              }
            }
          }
        : undefined,
      include: {
        roles: { include: { role: true } }
      },
      orderBy: { id: 'asc' as const }
    },
    roles: { include: { role: true } }
  }
}

function buildTree(menus: MenuWithRelations[], parentId: number | null = null): AppRouteRecord[] {
  return menus
    .filter((menu) => menu.parentId === parentId)
    .map((menu) => {
      const children = buildTree(menus, menu.id)
      return {
        ...mapMenu(menu),
        ...(children.length ? { children } : {})
      }
    })
}

function mapMenu(menu: MenuWithRelations): AppRouteRecord {
  return {
    id: menu.id,
    parentId: menu.parentId,
    path: menu.path,
    name: menu.name,
    component: menu.component,
    meta: {
      title: menu.title,
      icon: menu.icon,
      sort: menu.sort,
      keepAlive: menu.keepAlive,
      isHide: menu.hidden,
      isHideTab: menu.hiddenTab,
      link: menu.link,
      isIframe: menu.iframe,
      roles: menu.roles.map(({ role }: any) => role.code),
      authList: menu.permissions.map((permission) => ({
        id: permission.id,
        title: permission.title,
        authMark: permission.authMark,
        roles: permission.roles.map(({ role }: any) => role.code)
      }))
    }
  }
}
