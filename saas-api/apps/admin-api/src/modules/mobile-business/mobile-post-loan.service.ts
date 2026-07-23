import { BadRequestException } from '@nestjs/common'
import { Injectable, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../prisma/prisma.service'
import { mapApplication } from './mobile-business.utils'
import { getCurrentTenantId, getCurrentTenantIdOrThrow } from '../../common/tenant/tenant-context'
import { RepaymentStatus } from '@prisma/client'

@Injectable()
export class MobilePostLoanService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService
  ) {}

  async confirmAmount(applicationId: number, dto: { approvedAmount: number; term?: number; rate?: number }) {
    const tenantId = getCurrentTenantId()
    return this.prisma.application.update({
      where: tenantId ? { id: applicationId, tenantId } : { id: applicationId },
      data: {
        approvedAmount: dto.approvedAmount,
        ...(dto.term && { approvedTerm: dto.term }),
        ...(dto.rate && { approvedRate: dto.rate })
      }
    })
  }

  async getRepaymentPlansMobile(applicationId: number) {
    const tenantId = getCurrentTenantId()
    return this.prisma.repaymentPlan.findMany({
      where: { applicationId, ...(tenantId && { tenantId }), deletedAt: null },
      orderBy: { period: 'asc' },
      include: { records: { orderBy: { createdAt: 'desc' } } }
    })
  }

  async applyEarlyRepaymentMobile(applicationId: number, dto: { repayType?: string; amount: number; principal: number; interest: number; penalty?: number; reason?: string }) {
    const tenantId = getCurrentTenantId()
    if (!tenantId) throw new BadRequestException('租户上下文缺失')
    return this.prisma.earlyRepayment.create({
      data: {
        tenantId,
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
    const tenantId = getCurrentTenantIdOrThrow()
    const plan = await this.prisma.repaymentPlan.findFirst({
      where: {
        applicationId,
        ...(tenantId && { tenantId }),
        deletedAt: null,
        status: { in: [RepaymentStatus.NOT_DUE, RepaymentStatus.OVERDUE, RepaymentStatus.PARTIAL] }
      },
      orderBy: { period: 'asc' }
    })
    if (!plan) throw new BadRequestException('没有待还款的计划')

    const principal = dto.principal ?? dto.amount
    const interest = dto.interest ?? 0
    const penalty = dto.penalty ?? 0

    return this.prisma.$transaction(async (tx) => {
      // 乐观锁：重新读取 paidTotal，事务内 CAS 更新
      const current = await tx.repaymentPlan.findFirst({
        where: { id: plan.id, paidTotal: plan.paidTotal }
      })
      if (!current) throw new BadRequestException('还款计划状态已变更，请刷新后重试')

      const paidPrincipal = Number(current.paidPrincipal) + principal
      const paidInterest = Number(current.paidInterest) + interest
      const paidTotal = Number(current.paidTotal) + dto.amount
      const totalDue = Number(current.totalAmount) + Number(current.penaltyAmount)
      const nextStatus = paidTotal >= totalDue ? RepaymentStatus.PAID : RepaymentStatus.PARTIAL

      await tx.repaymentRecord.create({
        data: {
          tenantId: tenantId,
          planId: current.id,
          amount: dto.amount,
          principal,
          interest,
          penalty,
          paymentMethod: dto.paymentMethod,
          transactionNo: dto.transactionNo,
          remark: dto.remark,
        }
      })
      return tx.repaymentPlan.update({
        where: { id: current.id },
        data: {
          paidPrincipal,
          paidInterest,
          paidTotal,
          status: nextStatus,
          paidAt: nextStatus === RepaymentStatus.PAID ? new Date() : current.paidAt
        }
      })
    })
  }

  async getApplicationDetailMobile(id: number) {
    const tenantId = getCurrentTenantId()
    const app = await this.prisma.application.findFirst({
      where: { id, ...(tenantId && { tenantId }), deletedAt: null },
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