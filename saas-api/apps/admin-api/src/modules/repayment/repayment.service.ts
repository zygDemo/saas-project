import { Injectable } from '@nestjs/common'
import { BaseBusinessCrudService } from '../base-business-crud.service'
import { PrismaService } from '../prisma/prisma.service'
import { CreateRepaymentDto, UpdateRepaymentDto, RepaymentQueryDto } from './dto/repayment.dto'

@Injectable()
export class RepaymentService extends BaseBusinessCrudService<CreateRepaymentDto, UpdateRepaymentDto, RepaymentQueryDto> {
  constructor(private readonly prisma: PrismaService) {
    super({
      model: prisma.repaymentPlan,
      prisma,
      exactFields: ['applicationId', 'status'],
      include: { application: true, records: true },
      validateCreate: async (dto) => {
        await this.ensureRelatedExists(this.prisma.application, dto.applicationId, '进件不存在')
      },
      validateUpdate: async (_id, dto) => {
        await this.ensureRelatedExists(this.prisma.application, dto.applicationId, '进件不存在')
      },
    })
  }
}
