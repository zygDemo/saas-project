import { Injectable } from '@nestjs/common'
import { BaseBusinessCrudService } from '../base-business-crud.service'
import { PrismaService } from '../prisma/prisma.service'
import { DataScopeService } from '../../common/auth/data-scope.service'
import { getCurrentUserRoles } from '../../common/tenant/tenant-context'
import { CreateWorkOrderDto, UpdateWorkOrderDto, WorkOrderQueryDto } from './dto/work-order.dto'

@Injectable()
export class WorkOrderService extends BaseBusinessCrudService<
  CreateWorkOrderDto,
  UpdateWorkOrderDto,
  WorkOrderQueryDto
> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dataScopeService: DataScopeService
  ) {
    super({
      model: prisma.workOrder,
      prisma,
      skipTenantFilter: true,
        validateCreate: async (dto) => {
          if (dto.creatorId) {
            await this.ensureRelatedExists(this.prisma.user, dto.creatorId, '创建人不存在')
          }
          if (dto.assigneeId) {
            await this.ensureRelatedExists(this.prisma.user, dto.assigneeId, '处理人不存在')
          }
        },
        validateUpdate: async (_id, dto) => {
          if (dto.creatorId) {
            await this.ensureRelatedExists(this.prisma.user, dto.creatorId, '创建人不存在')
          }
          if (dto.assigneeId) {
            await this.ensureRelatedExists(this.prisma.user, dto.assigneeId, '处理人不存在')
          }
        },
      buildWhere: (query) => {
        const where: Record<string, unknown> = {}
        const contains = (value: string) => ({ contains: value, mode: 'insensitive' })

        if (query.keyword) {
          where.OR = [
            { title: contains(query.keyword) }
          ]
        }
        if (query.title) where.title = contains(query.title)
        if (query.tenantId) where.tenantId = query.tenantId
        if (query.orderType) where.orderType = query.orderType
        if (query.priority) where.priority = query.priority
        if (query.status) where.status = query.status
        if (query.creatorId) where.creatorId = query.creatorId
        if (query.assigneeId) where.assigneeId = query.assigneeId

        return where
      },
      getExtraWhere: async () => {
        const roleIds = getCurrentUserRoles()
        if (!roleIds.length) return {}
        const roles = await prisma.role.findMany({ where: { id: { in: roleIds } }, select: { dataScope: true } })
        const scopePriority: Record<string, number> = { SELF: 1, DEPT: 2, CUSTOM: 3, ALL: 4 }
        const minScope = roles.map(r => r.dataScope).sort((a, b) => (scopePriority[a] ?? 99) - (scopePriority[b] ?? 99))[0]
        if (!minScope || minScope === 'ALL') return {}
        const visibleIds = await dataScopeService.getVisibleUserIds(minScope)
        return { creatorId: { in: visibleIds } }
      }
    })
  }
}