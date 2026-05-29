import { Injectable } from '@nestjs/common'
import { BaseBusinessCrudService } from '../base-business-crud.service'
import { PrismaService } from '../prisma/prisma.service'
import { CreateFunderDto, UpdateFunderDto, FunderQueryDto } from './dto/funder.dto'

@Injectable()
export class FunderService extends BaseBusinessCrudService<CreateFunderDto, UpdateFunderDto, FunderQueryDto> {
  constructor(private readonly prisma: PrismaService) {
    super({
      model: prisma.funder,
      prisma,
      searchableFields: ['name', 'code'], exactFields: ['orgId', 'funderType', 'status'],
      include: { org: true },
      validateCreate: async (dto) => {
        await this.ensureRelatedExists(this.prisma.organization, dto.orgId, '机构不存在')
      },
      validateUpdate: async (_id, dto) => {
        await this.ensureRelatedExists(this.prisma.organization, dto.orgId, '机构不存在')
      },
    })
  }
}
