import { Prisma } from '@prisma/client'
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { BaseBusinessCrudService } from '../base-business-crud.service'
import { PrismaService } from '../prisma/prisma.service'
import { getCurrentTenantId } from '../../common/tenant/tenant-context'
import { CreateSigningDto, UpdateSigningDto, SigningQueryDto } from './dto/signing.dto'

@Injectable()
export class SigningService extends BaseBusinessCrudService<CreateSigningDto, UpdateSigningDto, SigningQueryDto> {
  constructor(private readonly prisma: PrismaService) {
    super({
      model: prisma.signRecord,
      prisma,
      exactFields: ['applicationId', 'status'],
      include: { application: true },
      detailInclude: { application: { include: { customer: true, product: true } } },
      validateCreate: async (dto) => {
        await this.ensureRelatedExists(this.prisma.application, dto.applicationId, '进件不存在')
      },
      validateUpdate: async (_id, dto) => {
        await this.ensureRelatedExists(this.prisma.application, dto.applicationId, '进件不存在')
      },
    })
  }

  /** 授权签署 - 一键完成签署 */
  async authorizeSign(id: number) {
    const tenantId = getCurrentTenantId()
    const signRecord = await this.prisma.signRecord.findFirst({
      where: { id, ...(tenantId && { tenantId }), deletedAt: null },
      include: { application: true }
    })

    if (!signRecord) throw new NotFoundException('签署记录不存在')
    if (!['PENDING', 'SENT'].includes(signRecord.status))
      throw new BadRequestException(`当前状态 ${signRecord.status} 不允许签署`)

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const updatedSignRecord = await tx.signRecord.update({
        where: tenantId ? { id, tenantId } : { id },
        data: { status: 'SIGNED', signedAt: new Date() }
      })

      await tx.application.update({
        where: tenantId ? { id: signRecord.applicationId, tenantId } : { id: signRecord.applicationId },
        data: { status: 'SIGNED' }
      })

      return {
        code: 200,
        message: '授权签署成功',
        data: updatedSignRecord
      }
    })
  }
}
