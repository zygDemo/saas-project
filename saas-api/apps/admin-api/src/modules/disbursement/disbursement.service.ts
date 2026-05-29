import { Injectable } from '@nestjs/common'
import { BaseBusinessCrudService } from '../base-business-crud.service'
import { PrismaService } from '../prisma/prisma.service'
import { CreateDisbursementDto, UpdateDisbursementDto, DisbursementQueryDto } from './dto/disbursement.dto'

@Injectable()
export class DisbursementService extends BaseBusinessCrudService<CreateDisbursementDto, UpdateDisbursementDto, DisbursementQueryDto> {
  constructor(private readonly prisma: PrismaService) {
    super({
      model: prisma.disbursement,
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
