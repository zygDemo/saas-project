import { Injectable } from '@nestjs/common'
import { BaseBusinessCrudService } from '../base-business-crud.service'
import { PrismaService } from '../prisma/prisma.service'
import { CreateLeadDto, UpdateLeadDto, LeadQueryDto } from './dto/lead.dto'

@Injectable()
export class LeadService extends BaseBusinessCrudService<CreateLeadDto, UpdateLeadDto, LeadQueryDto> {
  constructor(private readonly prisma: PrismaService) {
    super({
      model: prisma.lead,
      prisma,
      searchableFields: ['name', 'phone'], exactFields: ['orgId', 'status', 'assigneeId'],
      include: { org: true, assignee: true }, detailInclude: { org: true, assignee: true, followUps: true },
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
}
