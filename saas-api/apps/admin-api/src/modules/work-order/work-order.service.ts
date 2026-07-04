import { Injectable } from '@nestjs/common'
import { BaseBusinessCrudService } from '../base-business-crud.service'
import { PrismaService } from '../prisma/prisma.service'
import { CreateWorkOrderDto, UpdateWorkOrderDto, WorkOrderQueryDto } from './dto/work-order.dto'

@Injectable()
export class WorkOrderService extends BaseBusinessCrudService<
  CreateWorkOrderDto,
  UpdateWorkOrderDto,
  WorkOrderQueryDto
> {
  constructor(private readonly prisma: PrismaService) {
    super({
      model: prisma.workOrder,
      prisma,
      skipTenantFilter: true,
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
      }
    })
  }
}
