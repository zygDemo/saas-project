import { BadRequestException, Injectable } from '@nestjs/common'
import { BaseBusinessCrudService } from '../base-business-crud.service'
import { PrismaService } from '../prisma/prisma.service'
import { CreateFunderDto, UpdateFunderDto, FunderQueryDto } from './dto/funder.dto'

@Injectable()
export class FunderService extends BaseBusinessCrudService<CreateFunderDto, UpdateFunderDto, FunderQueryDto> {
  constructor(private readonly prisma: PrismaService) {
    super({
      model: prisma.funder,
      prisma,
      searchableFields: ['name', 'code'],
      exactFields: ['orgId', 'funderType', 'status'],
      include: { org: true },
      validateCreate: async (dto) => this.validateFunder(dto),
      validateUpdate: async (id, dto) => this.validateFunder(dto, id)
    })
  }

  private async validateFunder(dto: CreateFunderDto | UpdateFunderDto, id?: number) {
    await this.ensureRelatedExists(this.prisma.organization, dto.orgId, '机构不存在')
    if (dto.code && dto.orgId) {
      const item = await this.prisma.funder.findFirst({ where: { orgId: dto.orgId, code: dto.code } })
      if (item && item.id !== id) throw new BadRequestException('同一机构下资方编码已存在')
    }
  }
}
