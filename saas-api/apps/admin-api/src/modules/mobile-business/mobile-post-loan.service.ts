import { Injectable, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../prisma/prisma.service'
import { mapApplication } from './mobile-business.utils'
import { findApplication } from './mobile-business.db-helpers'

@Injectable()
export class MobilePostLoanService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService
  ) {}

  async confirmAmount(applicationId: number, dto: { approvedAmount: number; term?: number; rate?: number }) {
    return this.prisma.application.update({
      where: { id: applicationId },
      data: {
        approvedAmount: dto.approvedAmount,
        ...(dto.term && { term: dto.term }),
        ...(dto.rate && { rate: dto.rate })
      }
    })
  }

  async getRepaymentPlansMobile(applicationId: number) {
    return this.prisma.repaymentPlan.findMany({
      where: { applicationId },
      orderBy: { period: 'asc' },
      include: { records: { orderBy: { createdAt: 'desc' } } }
    })
  }

  async applyEarlyRepaymentMobile(applicationId: number, dto: { repayType?: string; amount: number; principal: number; interest: number; penalty?: number; reason?: string }) {
    return this.prisma.earlyRepayment.create({
      data: {
        tenantId: 1,
        applicationId,
        repayType: dto.repayType ?? 'FULL',
        amount: dto.amount,
        principal: dto.principal,
        interest: dto.interest,
        penalty: dto.penalty ?? 0,
        reason: dto.reason
      }
    })
  }

  async getApplicationDetailMobile(id: number) {
    const app = await this.prisma.application.findFirst({
      where: { id },
      include: {
        customer: true,
        product: true,
        funder: true,
        disbursement: true,
        signRecord: true,
        repaymentPlans: { orderBy: { period: 'asc' } }
      }
    })
    if (!app) throw new NotFoundException('订单不存在')
    const apiPrefix = this.config.get<string>('API_PREFIX', 'saas/api')
    return mapApplication(app, apiPrefix, true)
  }
}
