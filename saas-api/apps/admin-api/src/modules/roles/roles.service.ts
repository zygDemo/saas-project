import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PaginatedResponse } from '../../common/types/pagination'
import { getPagination, toPaginatedResponse } from '../../common/utils/pagination'
import { getCurrentTenantId } from '../../common/tenant/tenant-context'
import { PrismaService } from '../prisma/prisma.service'
import { CacheService } from '../redis/cache.service'
import { CreateRoleDto, SaveRolePermissionDto, UpdateRoleDto, RoleQueryDto } from './dto/role.dto'

@Injectable()
export class RolesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  private get cachePrefix() { return `roles:${getCurrentTenantId()}:` }

  async getRoleList(query: RoleQueryDto): Promise<PaginatedResponse<unknown>> {
    const key = `${this.cachePrefix}list:${JSON.stringify(query)}`
    const cached = await this.cache.get<PaginatedResponse<unknown>>(key)
    if (cached) return cached

    const result = await this._getRoleList(query)
    await this.cache.set(key, result, 300)
    return result
  }

  private async _getRoleList(query: RoleQueryDto): Promise<PaginatedResponse<unknown>> {
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
    return toPaginatedResponse(records.map(mapRoleListItem), total, pagination)
  }

  async createRole(dto: CreateRoleDto) {
    await this.assertRoleCodeAvailable(dto.roleCode)

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

      if (dto.dataScope === 'CUSTOM' && dto.departmentIds?.length) {
        await tx.roleDepartment.createMany({
          data: dto.departmentIds.map((deptId) => ({ roleId: created.id, departmentId: deptId })),
          skipDuplicates: true
        })
      }

      return created
    })

    await this.cache.delByPrefix('roles:', getCurrentTenantId() as number)
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

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.role.update({ where: { id }, data: updateData })

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

    await this.cache.delByPrefix('roles:', getCurrentTenantId() as number)
    const updatedRole = await this.prisma.role.findFirst({ where: { id } })
    return mapRoleListItem(updatedRole!)
  }

  async deleteRole(id: number) {
    const role = await this.prisma.role.findFirst({ where: { id } })
    if (!role) throw new NotFoundException('角色不存在')

    await this.prisma.role.update({ where: { id }, data: { deletedAt: new Date() } })
    await this.cache.delByPrefix('roles:', getCurrentTenantId() as number)
    return { id }
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

    await this.cache.delByPrefix('roles:', getCurrentTenantId() as number)
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
