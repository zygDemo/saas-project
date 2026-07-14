import { Injectable } from '@nestjs/common'
import { LeadStatus, Prisma } from '@prisma/client'
import { BaseBusinessCrudService } from '../base-business-crud.service'
import { PrismaService } from '../prisma/prisma.service'
import { DataScopeService } from '../../common/auth/data-scope.service'
import { getCurrentUserRoles } from '../../common/tenant/tenant-context'
import { AssignLeadDto, CreateLeadDto, CreateLeadFollowUpDto, LeadQueryDto, UpdateLeadDto } from './dto/lead.dto'

@Injectable()
export class LeadService extends BaseBusinessCrudService<CreateLeadDto, UpdateLeadDto, LeadQueryDto> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dataScopeService: DataScopeService
  ) {
    super({
      model: prisma.lead,
      prisma,
      searchableFields: ['name', 'phone'], exactFields: ['orgId', 'status', 'assigneeId'],
      include: { org: true, assignee: true }, detailInclude: { org: true, assignee: true, followUps: true },
      getExtraWhere: async () => {
        const roleIds = getCurrentUserRoles()
        if (!roleIds.length) return {}
        const roles = await prisma.role.findMany({ where: { id: { in: roleIds } }, select: { dataScope: true } })
        const scopePriority: Record<string, number> = { SELF: 1, DEPT: 2, CUSTOM: 3, ALL: 4 }
        const minScope = roles.map(r => r.dataScope).sort((a, b) => (scopePriority[a] ?? 99) - (scopePriority[b] ?? 99))[0]
        if (!minScope || minScope === 'ALL') return {}
        const visibleIds = await dataScopeService.getVisibleUserIds(minScope)
        return { createdBy: { in: visibleIds } }
      },
      validateCreate: async (dto) => {
        await this.ensureRelatedExists(this.prisma.organization, dto.orgId, '机构不存在')
        await this.ensureRelatedExists(this.prisma.user, dto.assigneeId, '业务员不存在')
      },
      validateUpdate: async (_id, dto) => {
        await this.ensureRelatedExists(this.prisma.organization, dto.orgId, '机构不存在')
        await this.ensureRelatedExists(this.prisma.user, dto.assigneeId, '业务员不存在')
      },
    })
  }

  async assign(id: number, dto: AssignLeadDto) {
    await this.ensureExists(id)
    await this.ensureRelatedExists(this.prisma.user, dto.assigneeId, '业务员不存在')
    return this.prisma.lead.update({
      where: { id },
      data: {
        assigneeId: dto.assigneeId,
        remark: dto.remark,
        status: LeadStatus.PENDING_FOLLOW
      }
    })
  }

  async addFollowUp(id: number, dto: CreateLeadFollowUpDto) {
    await this.ensureExists(id)
    await this.ensureRelatedExists(this.prisma.user, dto.createdBy, '跟进人不存在')
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.leadFollowUp.create({
        data: {
          leadId: id,
          followType: dto.followType,
          content: dto.content,
          nextFollowAt: dto.nextFollowAt,
          createdBy: dto.createdBy
        }
      })
      return tx.lead.update({
        where: { id },
        data: {
          status: LeadStatus.FOLLOWING,
          nextFollowAt: dto.nextFollowAt,
          remark: dto.content
        }
      })
    })
  }
}
