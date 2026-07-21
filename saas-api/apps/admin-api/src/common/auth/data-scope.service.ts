import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../modules/prisma/prisma.service'
import { getCurrentTenantId, getCurrentUserId, getCurrentUserRoles } from '../tenant/tenant-context'

export type DataScope = 'ALL' | 'DEPT' | 'SELF' | 'CUSTOM'

/**
 * 数据权限过滤结果：
 * - undefined = 不过滤（ALL）
 * - number[]  = 可见的 userId 列表
 */
export type VisibleUserIds = number[] | undefined

@Injectable()
export class DataScopeService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取当前用户基于数据权限可见的 userId 列表
   * 从 AsyncLocalStorage 中自动获取当前用户上下文
   */
  async getVisibleUserIds(dataScope: DataScope): Promise<VisibleUserIds> {
    const userId = getCurrentUserId()
    const tenantId = getCurrentTenantId()
    const roleIds = getCurrentUserRoles()

    if (!userId || !tenantId) return [userId ?? -1]

    switch (dataScope) {
      case 'ALL':
        return undefined

      case 'SELF':
        return [userId]

      case 'DEPT': {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { deptId: true }
        })
        if (!user?.deptId) return [userId]
        const deptIds = await this.getDeptAndChildren(user.deptId, tenantId)
        return this.getUserIdsByDepts(deptIds, tenantId)
      }

      case 'CUSTOM': {
        if (!roleIds.length) return [userId]
        const deptIds = await this.getCustomDeptIds(roleIds)
        if (!deptIds.length) return [userId]
        return this.getUserIdsByDepts(deptIds, tenantId)
      }

      default:
        return [userId]
    }
  }

  /**
   * 将可见 userId 列表注入到 Prisma where 条件中
   */
  injectDataScope(
    where: Record<string, unknown>,
    visibleIds: VisibleUserIds,
    field = 'creatorId'
  ): Record<string, unknown> {
    if (visibleIds === undefined) return where
    if (visibleIds.length === 0) {
      return { ...where, [field]: -1 }
    }
    return { ...where, [field]: { in: visibleIds } }
  }

  /** 获取部门及所有下级部门 ID（单次查询+内存遍历） */
  private async getDeptAndChildren(deptId: number, tenantId: number): Promise<number[]> {
    // 一次查询拿全部部门，内存中构建树
    const allDepts = await this.prisma.department.findMany({
      where: { tenantId },
      select: { id: true, parentId: true }
    })
    const childrenMap = new Map<number, number[]>()
    for (const d of allDepts) {
      if (d.parentId != null) {
        const arr = childrenMap.get(d.parentId) ?? []
        arr.push(d.id)
        childrenMap.set(d.parentId, arr)
      }
    }
    const result: number[] = [deptId]
    const queue = [deptId]
    while (queue.length) {
      const pid = queue.shift()!
      const kids = childrenMap.get(pid)
      if (kids) {
        result.push(...kids)
        queue.push(...kids)
      }
    }
    return result
  }

  /** 根据部门 ID 列表获取用户 ID 列表 */
  private async getUserIdsByDepts(deptIds: number[], tenantId: number): Promise<number[]> {
    const users = await this.prisma.user.findMany({
      where: { deptId: { in: deptIds }, tenantId },
      select: { id: true }
    })
    return users.map(u => u.id)
  }

  /** 获取角色自定义关联的部门 ID 列表 */
  private async getCustomDeptIds(roleIds: number[]): Promise<number[]> {
    const roleDepts = await this.prisma.roleDepartment.findMany({
      where: { roleId: { in: roleIds } },
      select: { departmentId: true }
    })
    return [...new Set<number>(roleDepts.map((rd) => (rd as { departmentId: number }).departmentId))]
  }

  /**
   * 一站式构建数据权限过滤条件
   *
   * 自动从 AsyncLocalStorage 获取当前用户角色，计算最小数据权限范围，
   * 返回可直接合并到 Prisma where 的过滤条件。
   *
   * @param field 数据权限过滤字段，默认 'creatorId'
   * @returns Prisma where 条件对象，ALL 权限时返回空对象
   */
  async buildDataScopeFilter(field = 'creatorId'): Promise<Record<string, unknown>> {
    const roleIds = getCurrentUserRoles()
    if (!roleIds.length) return {}

    const roles = await this.prisma.role.findMany({
      where: { id: { in: roleIds } },
      select: { dataScope: true }
    })

    const scopePriority: Record<string, number> = { SELF: 1, DEPT: 2, CUSTOM: 3, ALL: 4 }
    const minScope = roles
      .map((r: { dataScope: string }) => r.dataScope)
      .sort((a: string, b: string) => (scopePriority[a] ?? 99) - (scopePriority[b] ?? 99))[0]

    if (!minScope || minScope === 'ALL') return {}

    const visibleIds = await this.getVisibleUserIds(minScope as DataScope)
    return this.injectDataScope({}, visibleIds, field)
  }
}
