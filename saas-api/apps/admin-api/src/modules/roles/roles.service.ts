import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PaginatedResponse } from '../../common/types/pagination'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async getRoleList(query: Record<string, string | undefined>): Promise<PaginatedResponse<unknown>> {
    const current = Number(query.current ?? 1)
    const size = Number(query.size ?? 20)
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
        skip: (current - 1) * size,
        take: size,
        orderBy: { id: 'asc' }
      }),
      this.prisma.role.count({ where })
    ])

    return {
      records: records.map((role) => ({
        roleId: role.id,
        roleName: role.name,
        roleCode: role.code,
        description: role.description,
        enabled: role.enabled,
        createTime: role.createdAt.toISOString().replace('T', ' ').slice(0, 19)
      })),
      current,
      size,
      total
    }
  }
}
