import { Injectable } from '@nestjs/common'
import { BaseBusinessCrudService } from '../base-business-crud.service'
import { PrismaService } from '../prisma/prisma.service'
import { CreateOrganizationDto, UpdateOrganizationDto, OrganizationQueryDto } from './dto/org.dto'

@Injectable()
export class OrganizationService extends BaseBusinessCrudService<CreateOrganizationDto, UpdateOrganizationDto, OrganizationQueryDto> {
  constructor(private readonly prisma: PrismaService) {
    super({
      model: prisma.organization,
      prisma,
      searchableFields: ['name', 'code'], exactFields: ['status'],
      detailInclude: { departments: true, products: true, funders: true },
      
    })
  }
}
