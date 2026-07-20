import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PaginatedResponse } from '../../common/types/pagination'
import { getPagination, toPaginatedResponse } from '../../common/utils/pagination'
import { PrismaService } from '../prisma/prisma.service'
import { CreateRoleDto, SaveRolePermissionDto, UpdateRoleDto, RoleQueryDto } from './dto/role.dto'

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async getRoleList(query: RoleQueryDto): Promise<PaginatedResponse<unknown>> {
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

    // 用事务保证 role 创建 + department 关联的原子性
    const role = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const created = await tx.role.create({
        data: {
          name: dto.roleName,
          code: dto.roleCode,
          description: dto.description ?? '',
          enabled: dto.enabled ?? true,
          dataScope: dto.dataScope ?? 'ALL'
        }
      })

      // 如果是 CUSTOM 范围，保存自定义部门关联
      if (dto.dataScope === 'CUSTOM' && dto.departmentIds?.length) {
        await tx.roleDepartment.createMany({
          data: dto.departmentIds.map((deptId) => ({ roleId: created.id, departmentId: deptId })),
          skipDuplicates: true
        })
      }

      return created
    })

    return mapRoleListItem(role)
  }

  async updateRole(id: number, dto: UpdateRoleDto) {
    const role = await this.prisma.role.findFirst({ where: { id } })
    if (!role) throw new NotFoundException('角色不存在')

    if (dto.roleCode && dto.roleCode !== role.code) {
      await this.assertRoleCodeAvailable(dto.roleCode, id)
    }

    const updateData: Prisma.RoleUpdateInput = {}
    if (dto.roleName !== undefined) updateData.name = dto.roleName
    if (dto.roleCode !== undefined) updateData.code = dto.roleCode
    if (dto.description !== undefined) updateData.description = dto.description
    if (dto.enabled !== undefined) updateData.enabled = dto.enabled
    if (dto.dataScope !== undefined) updateData.dataScope = dto.dataScope

    // 用事务保证 role 更新 + department 关联的原子性
    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.role.update({ where: { id }, data: updateData })

      // 如果更新了 dataScope 或 departmentIds，同步部门关联
      if (dto.dataScope !== undefined || dto.departmentIds !== undefined) {
        const newScope = dto.dataScope ?? role.dataScope
        if (newScope === 'CUSTOM' && dto.departmentIds) {
          await tx.roleDepartment.deleteMany({ where: { roleId: id } })
          if (dto.departmentIds.length) {
            await tx.roleDepartment.createMany({
              data: dto.departmentIds.map((deptId) => ({ roleId: id, departmentId: deptId })),
              skipDuplicates: true
            })
          }
        } else if (newScope !== 'CUSTOM') {
          await tx.roleDepartment.deleteMany({ where: { roleId: id } })
        }
      }
    })

    const updatedRole = await this.prisma.role.findFirst({ where: { id } })
    return mapRoleListItem(updatedRole!)
  }

  async deleteRole(id: number) {
    const role = await this.prisma.role.findFirst({ where: { id } })
    if (!role) throw new NotFoundException('角色不存在')

    await this.prisma.role.update({ where: { id }, data: { deletedAt: new Date() } })
    return { id }
  }

  /** 获取角色数据权限配置（dataScope + 自定义部门 ID 列表） */
  async getRoleDataScope(id: number) {
    const role = await this.prisma.role.findFirst({
      where: { id },
      include: {
        departments: { select: { departmentId: true } }
      }
    })
    if (!role) throw new NotFoundException('角色不存在')

    return {
      roleId: role.id,
      dataScope: role.dataScope,
      departmentIds: role.departments.map((d: { departmentId: number }) => d.departmentId)
    }
  }

  /** 保存角色数据权限配置 */
  async saveRoleDataScope(id: number, dto: { dataScope: string; departmentIds?: number[] }) {
    const role = await this.prisma.role.findFirst({ where: { id } })
    if (!role) throw new NotFoundException('角色不存在')

    // 用事务保证原子性
    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.role.update({ where: { id }, data: { dataScope: dto.dataScope } })
      await tx.roleDepartment.deleteMany({ where: { roleId: id } })
      if (dto.dataScope === 'CUSTOM' && dto.departmentIds?.length) {
        await tx.roleDepartment.createMany({
          data: dto.departmentIds.map((deptId) => ({ roleId: id, departmentId: deptId })),
          skipDuplicates: true
        })
      }
    })

    return this.getRoleDataScope(id)
  }

  async getRolePermission(id: number) {
    const role = await this.prisma.role.findFirst({
      where: { id },
      include: {
        menus: { select: { menuId: true } },
        permissions: { select: { permissionId: true } }
      }
    })
    if (!role) throw new NotFoundException('角色不存在')

    return {
      roleId: role.id,
      menuIds: role.menus.map((item: { menuId: number }) => item.menuId),
      permissionIds: role.permissions.map((item: { permissionId: number }) => item.permissionId)
    }
  }

  async saveRolePermission(id: number, dto: SaveRolePermissionDto) {
    const role = await this.prisma.role.findFirst({ where: { id } })
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
    const menuIdSet = new Set(menus.map((menu: { id: number }) => menu.id))
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
    const permissionIdSet = new Set(permissions.map((permission: { id: number }) => permission.id))
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
    dataScope: role.dataScope,
    createTime: role.createdAt.toISOString().replace('T', ' ').slice(0, 19)
  }
}
