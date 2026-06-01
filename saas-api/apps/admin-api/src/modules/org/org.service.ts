import { BadRequestException, Injectable } from '@nestjs/common'
import { BaseBusinessCrudService } from '../base-business-crud.service'
import { PrismaService } from '../prisma/prisma.service'
import { CreateOrganizationDto, UpdateOrganizationDto, OrganizationQueryDto } from './dto/org.dto'

@Injectable()
export class OrganizationService extends BaseBusinessCrudService<CreateOrganizationDto, UpdateOrganizationDto, OrganizationQueryDto> {
  constructor(private readonly prisma: PrismaService) {
    super({
      model: prisma.organization,
      prisma,
      searchableFields: ['name', 'code'],
      exactFields: ['status'],
      detailInclude: { departments: true, products: true, funders: true },
      validateCreate: async (dto) => {
        await this.ensureUniqueCode(dto.code)
        await this.ensureUniqueCreditCode(dto.creditCode)
      },
      validateUpdate: async (id, dto) => {
        await this.ensureUniqueCode(dto.code, id)
        await this.ensureUniqueCreditCode(dto.creditCode, id)
      }
    })
  }

  async enable(id: number) {
    await this.ensureExists(id)
    return this.prisma.organization.update({ where: { id }, data: { status: 'ACTIVE' } })
  }

  async disable(id: number) {
    await this.ensureExists(id)
    return this.prisma.organization.update({ where: { id }, data: { status: 'INACTIVE' } })
  }

  private async ensureUniqueCode(code?: string, excludeId?: number) {
    if (!code) return
    const item = await this.prisma.organization.findUnique({ where: { code } })
    if (item && item.id !== excludeId) throw new BadRequestException('机构编码已存在')
  }

  private async ensureUniqueCreditCode(creditCode?: string, excludeId?: number) {
    if (!creditCode) return
    const item = await this.prisma.organization.findUnique({ where: { creditCode } })
    if (item && item.id !== excludeId) throw new BadRequestException('统一社会信用代码已存在')
  }
}
