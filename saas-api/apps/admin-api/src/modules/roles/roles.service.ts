import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PaginatedResponse } from '../../common/types/pagination'
import { getPagination, toPaginatedResponse } from '../../common/utils/pagination'
import { PrismaService } from '../prisma/prisma.service'
import { CreateRoleDto, SaveRolePermissionDto, UpdateRoleDto } from './dto/role.dto'

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async getRoleList(query: Record<string, string | undefined>): Promise<PaginatedResponse<unknown>> {
    const pagination = getPagination(query)
    const where: Prisma.RoleWhereInput = {
      id: query.roleId ? Number(query.roleId) : undefined,
      name: query.roleName ? { contains: query.roleName, mode: 'insensitive' } : undefined,
      code: query.roleCode ? { contains: query.roleCode, mode: 'insensitive' } : undefined,
      description: query.description
        ? { contains: query.description, mode: 'insensitive' }
        : undefined,
      enabled: query.enabled === undefined ? undefined : query.enabled === 'true'
    }

    if (query.startTime || query.endTime) {
      where.createdAt = {
        gte: query.startTime ? new Date(query.startTime) : undefined,
        lte: query.endTime ? new Date(query.endTime) : undefined
      }
    }

    const [records, total] = await this.prisma.$transaction([
      this.prisma.role.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { id: 'asc' }
      }),
      this.prisma.role.count({ where })
    ])

    return toPaginatedResponse(records.map(mapRoleListItem), total, pagination)
  }

  async createRole(dto: CreateRoleDto) {
    await this.assertRoleCodeAvailable(dto.roleCode)

    const role = await this.prisma.role.create({
      data: {
        name: dto.roleName,
        code: dto.roleCode,
        description: dto.description ?? '',
        enabled: dto.enabled ?? true
      }
    })

    return mapRoleListItem(role)
  }

  async updateRole(id: number, dto: UpdateRoleDto) {
    const role = await this.prisma.role.findUnique({ where: { id } })
    if (!role) throw new NotFoundException('角色不存在')

    if (dto.roleCode && dto.roleCode !== role.code) {
      await this.assertRoleCodeAvailable(dto.roleCode, id)
    }

    const updatedRole = await this.prisma.role.update({
      where: { id },
      data: {
        name: dto.roleName,
        code: dto.roleCode,
        description: dto.description,
        enabled: dto.enabled
      }
    })

    return mapRoleListItem(updatedRole)
  }

  async deleteRole(id: number) {
    const role = await this.prisma.role.findUnique({ where: { id } })
    if (!role) throw new NotFoundException('角色不存在')

    await this.prisma.role.delete({ where: { id } })
    return { id }
  }

  async getRolePermission(id: number) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        menus: { select: { menuId: true } },
        permissions: { select: { permissionId: true } }
      }
    })
    if (!role) throw new NotFoundException('角色不存在')

    return {
      roleId: role.id,
      menuIds: role.menus.map((item: any) => item.menuId),
      permissionIds: role.permissions.map((item: any) => item.permissionId)
    }
  }

  async saveRolePermission(id: number, dto: SaveRolePermissionDto) {
    const role = await this.prisma.role.findUnique({ where: { id } })
    if (!role) throw new NotFoundException('角色不存在')

    const menuIds = [...new Set(dto.menuIds ?? [])]
    const permissionIds = [...new Set(dto.permissionIds ?? [])]

    await this.assertMenusExist(menuIds)
    await this.assertPermissionsExist(permissionIds)

    await this.prisma.$transaction([
      this.prisma.roleMenu.deleteMany({ where: { roleId: id } }),
      this.prisma.rolePermission.deleteMany({ where: { roleId: id } }),
      ...(menuIds.length
        ? [
            this.prisma.roleMenu.createMany({
              data: menuIds.map((menuId) => ({ roleId: id, menuId })),
              skipDuplicates: true
            })
          ]
        : []),
      ...(permissionIds.length
        ? [
            this.prisma.rolePermission.createMany({
              data: permissionIds.map((permissionId) => ({ roleId: id, permissionId })),
              skipDuplicates: true
            })
          ]
        : [])
    ])

    return this.getRolePermission(id)
  }

  private async assertRoleCodeAvailable(roleCode: string, excludeId?: number) {
    const existedRole = await this.prisma.role.findFirst({
      where: { code: { equals: roleCode, mode: 'insensitive' } }
    })
    if (existedRole && existedRole.id !== excludeId) {
      throw new ConflictException('角色编码已存在')
    }
  }

  private async assertMenusExist(menuIds: number[]) {
    if (!menuIds.length) return

    const menus = await this.prisma.menu.findMany({
      where: { id: { in: menuIds } },
      select: { id: true }
    })
    const menuIdSet = new Set(menus.map((menu: any) => menu.id))
    const missingMenuIds = menuIds.filter((menuId) => !menuIdSet.has(menuId))

    if (missingMenuIds.length > 0) {
      throw new BadRequestException(`菜单不存在: ${missingMenuIds.join(', ')}`)
    }
  }

  private async assertPermissionsExist(permissionIds: number[]) {
    if (!permissionIds.length) return

    const permissions = await this.prisma.permission.findMany({
      where: { id: { in: permissionIds } },
      select: { id: true }
    })
    const permissionIdSet = new Set(permissions.map((permission: any) => permission.id))
    const missingPermissionIds = permissionIds.filter((permissionId) => !permissionIdSet.has(permissionId))

    if (missingPermissionIds.length > 0) {
      throw new BadRequestException(`权限不存在: ${missingPermissionIds.join(', ')}`)
    }
  }
}

type RoleListItem = Prisma.RoleGetPayload<Record<string, never>>

function mapRoleListItem(role: RoleListItem) {
  return {
    roleId: role.id,
    roleName: role.name,
    roleCode: role.code,
    description: role.description,
    enabled: role.enabled,
    createTime: role.createdAt.toISOString().replace('T', ' ').slice(0, 19)
  }
}
