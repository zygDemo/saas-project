import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { MobileSigningStartDto } from './dto/mobile-business.dto'
import { findApplicationByOrderId } from './mobile-business.db-helpers'

@Injectable()
import { getRequiredTenantId } from '../../common/utils/helpers'

export class MobileSigningService {
  constructor(private readonly prisma: PrismaService) {}

  async startFaceSign(dto: MobileSigningStartDto) {
    const tenantId = getRequiredTenantId()
    const application = await findApplicationByOrderId(this.prisma, dto.creditOrderId || '', tenantId)
    if (!application) throw new NotFoundException('订单不存在')

    await this.prisma.application.update({
      where: { id: application.id },
      data: { status: 'SIGNING_PROGRESS' }
    })

    await this.prisma.signRecord.upsert({
      where: { applicationId: application.id },
      update: { status: 'SENT' },
      create: {
        tenantId: application.tenantId,
        applicationId: application.id,
        status: 'SENT'
      }
    })

    return {
      code: 200,
      msg: 'success',
      data: {
        uuid: dto.uuid,
        creditOrderId: dto.creditOrderId,
        status: 'PROCESSING',
        signUrl: dto.redirectUrl || ''
      }
    }
  }

  async startAuthContractSign(dto: MobileSigningStartDto) {
    const tenantId = getRequiredTenantId()
    const application = await findApplicationByOrderId(this.prisma, dto.creditOrderId || '', tenantId)
    if (!application) throw new NotFoundException('订单不存在')

    return {
      code: 200,
      msg: 'success',
      data: {
        uuid: dto.uuid,
        creditOrderId: dto.creditOrderId,
        status: 'PENDING',
        signUrl: dto.redirectUrl || '',
        callbackUrl: ''
      }
    }
  }

  async startContractSign(dto: MobileSigningStartDto) {
    const tenantId = getRequiredTenantId()
    const application = await findApplicationByOrderId(this.prisma, dto.creditOrderId || '', tenantId)
    if (!application) throw new NotFoundException('订单不存在')

    return {
      code: 200,
      msg: 'success',
      data: {
        uuid: dto.uuid,
        creditOrderId: dto.creditOrderId,
        status: 'PENDING',
        signUrl: dto.redirectUrl || '',
        callbackUrl: ''
      }
    }
  }

  async getFaceSignDetail(creditOrderId: string) {
    const tenantId = getRequiredTenantId()
    const application = await findApplicationByOrderId(this.prisma, creditOrderId, tenantId)
    if (!application) throw new NotFoundException('订单不存在')

    const signRecord = await this.prisma.signRecord.findFirst({
      where: { applicationId: application.id }
    })

    return {
      code: 200,
      msg: 'success',
      data: {
        creditOrderId,
        status: signRecord?.status || 'PENDING',
        signedAt: signRecord?.signedAt
      }
    }
  }

  async getAuthContractDetail(creditOrderId: string) {
    const tenantId = getRequiredTenantId()
    const application = await findApplicationByOrderId(this.prisma, creditOrderId, tenantId)
    if (!application) throw new NotFoundException('订单不存在')

    const signRecord = await this.prisma.signRecord.findFirst({
      where: { applicationId: application.id }
    })

    return {
      code: 200,
      msg: 'success',
      data: {
        creditOrderId,
        status: signRecord?.status || 'PENDING',
        contractUrl: signRecord?.contractUrl
      }
    }
  }

  async getContractDetail(creditOrderId: string) {
    const tenantId = getRequiredTenantId()
    const application = await findApplicationByOrderId(this.prisma, creditOrderId, tenantId)
    if (!application) throw new NotFoundException('订单不存在')

    const signRecord = await this.prisma.signRecord.findFirst({
      where: { applicationId: application.id }
    })

    return {
      code: 200,
      msg: 'success',
      data: {
        creditOrderId,
        status: signRecord?.status || 'PENDING',
        contractUrl: signRecord?.contractUrl,
        signedAt: signRecord?.signedAt
      }
    }
  }
}
