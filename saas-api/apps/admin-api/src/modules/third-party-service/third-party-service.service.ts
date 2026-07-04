import { BadRequestException, Injectable } from '@nestjs/common'
import { BaseBusinessCrudService } from '../base-business-crud.service'
import { PrismaService } from '../prisma/prisma.service'
import { CreateThirdPartyServiceDto, UpdateThirdPartyServiceDto, ThirdPartyServiceQueryDto } from './dto/third-party-service.dto'

@Injectable()
export class ThirdPartyServiceService extends BaseBusinessCrudService<
  CreateThirdPartyServiceDto,
  UpdateThirdPartyServiceDto,
  ThirdPartyServiceQueryDto
> {
  constructor(private readonly prisma: PrismaService) {
    super({
      model: prisma.thirdPartyService,
      prisma,
      skipTenantFilter: true,
      buildWhere: (query) => {
        const where: Record<string, unknown> = {}
        const contains = (value: string) => ({ contains: value, mode: 'insensitive' })

        if (query.keyword) {
          where.OR = [
            { name: contains(query.keyword) },
            { code: contains(query.keyword) }
          ]
        }
        if (query.name) where.name = contains(query.name)
        if (query.code) where.code = contains(query.code)
        if (query.serviceType) where.serviceType = query.serviceType
        if (query.status) where.status = query.status

        return where
      },
      validateCreate: async (dto) => {
        await this.ensureUniqueCode(dto.code)
      },
      validateUpdate: async (id, dto) => {
        await this.ensureUniqueCode(dto.code, id)
      }
    })
  }

  private async ensureUniqueCode(code?: string, excludeId?: number) {
    if (!code) return
    const item = await this.prisma.thirdPartyService.findFirst({ where: { code } })
    if (item && item.id !== excludeId) throw new BadRequestException('服务编码已存在')
  }
}
