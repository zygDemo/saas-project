import { Injectable } from '@nestjs/common'
import { BaseBusinessCrudService } from '../base-business-crud.service'
import { PrismaService } from '../prisma/prisma.service'
import { CreateSigningDto, UpdateSigningDto, SigningQueryDto } from './dto/signing.dto'

@Injectable()
export class SigningService extends BaseBusinessCrudService<CreateSigningDto, UpdateSigningDto, SigningQueryDto> {
  constructor(private readonly prisma: PrismaService) {
    super({
      model: prisma.signRecord,
      prisma,
      exactFields: ['applicationId', 'status'],
      include: { application: true },
      validateCreate: async (dto) => {
        await this.ensureRelatedExists(this.prisma.application, dto.applicationId, '进件不存在')
      },
      validateUpdate: async (_id, dto) => {
        await this.ensureRelatedExists(this.prisma.application, dto.applicationId, '进件不存在')
      },
    })
  }
}
