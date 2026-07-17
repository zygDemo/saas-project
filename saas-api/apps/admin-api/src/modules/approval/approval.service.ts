import { Injectable } from '@nestjs/common'
import { BaseBusinessCrudService } from '../base-business-crud.service'
import { PrismaService } from '../prisma/prisma.service'
import { CreateApprovalDto, UpdateApprovalDto, ApprovalQueryDto } from './dto/approval.dto'

@Injectable()
export class ApprovalService extends BaseBusinessCrudService<CreateApprovalDto, UpdateApprovalDto, ApprovalQueryDto> {
  constructor(private readonly prisma: PrismaService) {
    super({
      model: prisma.approvalRecord,
      prisma,
      exactFields: ['applicationId', 'stage', 'action'],
      include: { application: true, approver: true },
        detailInclude: { application: { include: { customer: true, product: true } }, approver: true },
      validateCreate: async (dto) => {
        await this.ensureRelatedExists(this.prisma.application, dto.applicationId, '进件不存在')
        await this.ensureRelatedExists(this.prisma.user, dto.approverId, '审批人不存在')
      },
      validateUpdate: async (_id, dto) => {
        await this.ensureRelatedExists(this.prisma.application, dto.applicationId, '进件不存在')
        await this.ensureRelatedExists(this.prisma.user, dto.approverId, '审批人不存在')
      },
    })
  }
}
