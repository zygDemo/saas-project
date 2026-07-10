import { BadRequestException } from '@nestjs/common'
import { Injectable, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../prisma/prisma.service'
import { mapApplication } from './mobile-business.utils'

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
        ...(dto.term && { approvedTerm: dto.term }),
        ...(dto.rate && { approvedRate: dto.rate })
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

  async registerRepaymentMobile(applicationId: number, dto: { amount: number; principal?: number; interest?: number; penalty?: number; paymentMethod: string; transactionNo?: string; remark?: string }) {
    const plan = await this.prisma.repaymentPlan.findFirst({
      where: {
        applicationId,
        status: { in: ['NOT_DUE', 'OVERDUE', 'PARTIAL'] as any }
      },
      orderBy: { period: 'asc' }
    })
    if (!plan) throw new BadRequestException('没有待还款的计划')

    const principal = dto.principal ?? dto.amount
    const interest = dto.interest ?? 0
    const penalty = dto.penalty ?? 0
    const paidPrincipal = Number(plan.paidPrincipal) + principal
    const paidInterest = Number(plan.paidInterest) + interest
    const paidTotal = Number(plan.paidTotal) + dto.amount
    const totalDue = Number(plan.totalAmount) + Number(plan.penaltyAmount)
    const nextStatus = paidTotal >= totalDue ? 'PAID' : 'PARTIAL'

    return this.prisma.$transaction(async (tx) => {
      await tx.repaymentRecord.create({
        data: {
          tenantId: 1,
          planId: plan.id,
          amount: dto.amount,
          principal,
          interest,
          penalty,
          paymentMethod: dto.paymentMethod,
          transactionNo: dto.transactionNo,
          voucherUrl: undefined,
          remark: dto.remark,
          createdBy: undefined
        }
      })
      return tx.repaymentPlan.update({
        where: { id: plan.id },
        data: {
          paidPrincipal,
          paidInterest,
          paidTotal,
          status: nextStatus,
          paidAt: nextStatus === 'PAID' ? new Date() : plan.paidAt
        }
      })
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
        repayments: { orderBy: { period: 'asc' } }
      }
    })
    if (!app) throw new NotFoundException('订单不存在')
    const apiPrefix = this.config.get<string>('API_PREFIX', 'saas/api')
    return mapApplication(app, apiPrefix, true)
  }
}