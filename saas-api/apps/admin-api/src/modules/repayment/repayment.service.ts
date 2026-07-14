import { BadRequestException, Injectable } from '@nestjs/common'
import { Prisma, RepaymentStatus } from '@prisma/client'
import { BaseBusinessCrudService } from '../base-business-crud.service'
import { getCurrentTenantId } from '../../common/tenant/tenant-context'
import { PrismaService } from '../prisma/prisma.service'
import { DataScopeService } from '../../common/auth/data-scope.service'
import { getCurrentUserRoles } from '../../common/tenant/tenant-context'
import { CreateRepaymentDto, UpdateRepaymentDto, RepaymentQueryDto } from './dto/repayment.dto'

@Injectable()
export class RepaymentService extends BaseBusinessCrudService<CreateRepaymentDto, UpdateRepaymentDto, RepaymentQueryDto> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dataScopeService: DataScopeService
  ) {
    super({
      model: prisma.repaymentPlan,
      prisma,
      exactFields: ['applicationId', 'status'],
      include: { application: true, records: true },
      getExtraWhere: async () => {
        const roleIds = getCurrentUserRoles()
        if (!roleIds.length) return {}
        const roles = await prisma.role.findMany({ where: { id: { in: roleIds } }, select: { dataScope: true } })
        const scopePriority: Record<string, number> = { SELF: 1, DEPT: 2, CUSTOM: 3, ALL: 4 }
        const minScope = roles.map(r => r.dataScope).sort((a, b) => (scopePriority[a] ?? 99) - (scopePriority[b] ?? 99))[0]
        if (!minScope || minScope === 'ALL') return {}
        const visibleIds = await dataScopeService.getVisibleUserIds(minScope)
        return { application: { creatorId: { in: visibleIds } } }
      },
      validateCreate: async (dto) => {
        await this.ensureRelatedExists(this.prisma.application, dto.applicationId, '进件不存在')
      },
      validateUpdate: async (_id, dto) => {
        await this.ensureRelatedExists(this.prisma.application, dto.applicationId, '进件不存在')
      },
    })
  }

  // ==================== 还款计划查询 ====================

  /** 获取进件的还款计划列表 */
  async getRepaymentPlans(applicationId: number) {
    return this.prisma.repaymentPlan.findMany({
      where: this.addTenantId({ applicationId }),
      orderBy: { period: 'asc' },
      include: { records: { orderBy: { createdAt: 'desc' } } }
    })
  }

  // ==================== 还款登记 ====================

  /** 按进件自动选择第一个未还清计划进行还款 */
  async registerRepaymentByApplication(applicationId: number, dto: {
    amount: number
    principal?: number
    interest?: number
    penalty?: number
    paymentMethod: string
    transactionNo?: string
    voucherUrl?: string
    remark?: string
    createdBy?: number
  }) {
    const plan = await this.prisma.repaymentPlan.findFirst({
      where: this.addTenantId({
        applicationId,
        status: { in: [RepaymentStatus.NOT_DUE, RepaymentStatus.OVERDUE, RepaymentStatus.PARTIAL] }
      }),
      orderBy: { period: 'asc' }
    })
    if (!plan) throw new BadRequestException('没有待还款的计划')

    if (!dto.createdBy) {
      const admin = await this.prisma.user.findFirst({ where: { tenantId: getCurrentTenantId()! } })
      dto.createdBy = admin?.id
    }
    return this.registerRepayment(plan.id, dto)
  }

  /** 指定还款计划ID进行还款登记 */
  async registerRepayment(planId: number, dto: {
    amount: number
    principal?: number
    interest?: number
    penalty?: number
    paymentMethod: string
    transactionNo?: string
    voucherUrl?: string
    remark?: string
    createdBy?: number
  }) {
    if (dto.createdBy) await this.ensureRelatedExists(this.prisma.user, dto.createdBy, '登记人不存在')
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const plan = await tx.repaymentPlan.findFirst({
        where: this.addTenantId({ id: planId })
      })
      if (!plan) throw new BadRequestException('还款计划不存在')

      const principal = dto.principal ?? dto.amount
      const interest = dto.interest ?? 0
      const penalty = dto.penalty ?? 0
      const paidPrincipal = Number(plan.paidPrincipal) + principal
      const paidInterest = Number(plan.paidInterest) + interest
      const paidTotal = Number(plan.paidTotal) + dto.amount
      const totalDue = Number(plan.totalAmount) + Number(plan.penaltyAmount)
      const nextStatus = paidTotal >= totalDue ? RepaymentStatus.PAID : RepaymentStatus.PARTIAL

      await tx.repaymentRecord.create({
        data: {
          tenantId: getCurrentTenantId()!,
          planId,
          amount: dto.amount,
          principal,
          interest,
          penalty,
          paymentMethod: dto.paymentMethod,
          transactionNo: dto.transactionNo,
          voucherUrl: dto.voucherUrl,
          remark: dto.remark,
          createdBy: dto.createdBy
        }
      })
      return tx.repaymentPlan.update({
        where: { id: planId },
        data: {
          paidPrincipal,
          paidInterest,
          paidTotal,
          status: nextStatus,
          paidAt: nextStatus === RepaymentStatus.PAID ? new Date() : plan.paidAt
        },
        include: { records: true, application: true }
      })
    })
  }

  // ==================== 逾期催收 ====================

  /** 获取逾期还款计划列表 */
  async getOverduePlans(query: { page?: number; pageSize?: number }) {
    const { page = 1, pageSize = 20 } = query
    const where = this.addTenantId({
      status: RepaymentStatus.OVERDUE,
      deletedAt: null
    })
    const [items, total] = await Promise.all([
      this.prisma.repaymentPlan.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { dueDate: 'asc' },
        include: {
          application: { select: { applicationNo: true, customer: { select: { name: true, phone: true } } } },
          records: { orderBy: { createdAt: 'desc' }, take: 3 }
        }
      }),
      this.prisma.repaymentPlan.count({ where })
    ])
    return { items, total, page, pageSize }
  }

  /** 添加催收记录 */
  async addCollectionRecord(applicationId: number, dto: {
    collectorId?: number
    collectType?: string
    content: string
    result?: string
    nextAction?: string
    nextDate?: string
  }) {
    return this.prisma.collectionRecord.create({
      data: {
        tenantId: getCurrentTenantId()!,
        applicationId,
        collectorId: dto.collectorId,
        collectType: dto.collectType ?? 'PHONE',
        content: dto.content,
        result: dto.result,
        nextAction: dto.nextAction,
        nextDate: dto.nextDate ? new Date(dto.nextDate) : undefined
      }
    })
  }

  /** 获取催收记录列表 */
  async getCollectionRecords(applicationId: number) {
    return this.prisma.collectionRecord.findMany({
      where: this.addTenantId({ applicationId }),
      orderBy: { createdAt: 'desc' }
    })
  }

  // ==================== 提前还款 ====================

  /** 申请提前还款 */
  async applyEarlyRepayment(applicationId: number, dto: {
    repayType?: string
    amount?: number
    principal?: number
    interest?: number
    penalty?: number
    reason?: string
  }) {
    const repayType = dto.repayType ?? 'FULL'
    let amount: number = dto.amount ?? 0
    let principal: number = dto.principal ?? 0
    let interest: number = dto.interest ?? 0

    // 未传金额时，从还款计划自动计算
    if (!dto.amount || !dto.principal || !dto.interest) {
      const unpaidPlans = await this.prisma.repaymentPlan.findMany({
        where: this.addTenantId({
          applicationId,
          status: { in: [RepaymentStatus.NOT_DUE, RepaymentStatus.OVERDUE, RepaymentStatus.PARTIAL] }
        }),
        orderBy: { period: 'asc' }
      })
       
      principal = unpaidPlans.reduce((sum: number, p: any) => sum + Number(p.principal), 0)
       
      interest = unpaidPlans.reduce((sum: number, p: any) => sum + Number(p.interest), 0)
      amount = Math.round((principal + interest) * 100) / 100
    }

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const earlyRepayment = await tx.earlyRepayment.create({
        data: {
          tenantId: getCurrentTenantId()!,
          applicationId,
          repayType,
          amount,
          principal,
          interest,
          penalty: dto.penalty ?? 0,
          reason: dto.reason
        }
      })

      if (repayType === 'FULL') {
        const unpaidPlans = await tx.repaymentPlan.findMany({
          where: {
            applicationId,
            status: { in: [RepaymentStatus.NOT_DUE, RepaymentStatus.OVERDUE, RepaymentStatus.PARTIAL] }
          }
        })
        for (const plan of unpaidPlans) {
          await tx.repaymentPlan.update({
            where: { id: plan.id },
            data: {
              status: RepaymentStatus.PAID,
              paidPrincipal: Number(plan.paidPrincipal) + Number(plan.principal),
              paidInterest: Number(plan.paidInterest) + Number(plan.interest),
              paidTotal: Number(plan.paidTotal) + Number(plan.totalAmount),
              paidAt: new Date()
            }
          })
        }
      } else {
        // 部分提前：调整第一个未还清计划
        const plan = await tx.repaymentPlan.findFirst({
          where: this.addTenantId({
            applicationId,
            status: { in: [RepaymentStatus.NOT_DUE, RepaymentStatus.OVERDUE, RepaymentStatus.PARTIAL] }
          }),
          orderBy: { period: 'asc' }
        })
        if (plan) {
          const adjustPrincipal = Math.min(principal, Number(plan.principal))
          const adjustInterest = Math.min(interest, Number(plan.interest))
          const adjustTotal = adjustPrincipal + adjustInterest
          const newPaidTotal = Number(plan.paidTotal) + adjustTotal
          const planTotalDue = Number(plan.totalAmount) + Number(plan.penaltyAmount)
          const nextStatus = newPaidTotal >= planTotalDue ? RepaymentStatus.PAID : RepaymentStatus.PARTIAL

          await tx.repaymentPlan.update({
            where: { id: plan.id },
            data: {
              paidPrincipal: Number(plan.paidPrincipal) + adjustPrincipal,
              paidInterest: Number(plan.paidInterest) + adjustInterest,
              paidTotal: newPaidTotal,
              status: nextStatus,
              paidAt: nextStatus === RepaymentStatus.PAID ? new Date() : plan.paidAt
            }
          })
        }
      }

      return earlyRepayment
    })
  }

  async approveEarlyRepayment(id: number, dto: { approvedBy: number; remark?: string }) {
    return this.prisma.earlyRepayment.update({
      where: { id },
      data: {
        repayStatus: 'APPROVED',
        approvedBy: dto.approvedBy,
        approvedAt: new Date(),
        remark: dto.remark
      }
    })
  }

  async completeEarlyRepayment(id: number) {
    return this.prisma.earlyRepayment.update({
      where: { id },
      data: { repayStatus: 'COMPLETED', completedAt: new Date() }
    })
  }

  async getEarlyRepayments(applicationId: number) {
    return this.prisma.earlyRepayment.findMany({
      where: this.addTenantId({ applicationId }),
      orderBy: { createdAt: 'desc' }
    })
  }

  // ==================== 还款计划自动生成 ====================

  /** 放款确认时自动生成等额本金还款计划 */
  async createRepaymentPlansIfNeeded(
    tx: Prisma.TransactionClient,
    application: { id: number; approvedTerm?: number | null; term: number; approvedRate?: number | null; rate: number },
    dto: { disburseAmount: number; disburseAt?: Date | string | null; firstDueDate?: Date | string | null }
  ) {
    const existed = await tx.repaymentPlan.count({ where: { applicationId: application.id } })
    if (existed > 0) return

    const term = Number(application.approvedTerm ?? application.term)
    const amount = Number(dto.disburseAmount)
    const annualRate = Number(application.approvedRate ?? application.rate)
    const monthlyRate = annualRate / 100 / 12
    const roundedMonthlyPrincipal = Math.round((amount / term) * 100) / 100

    const baseDueDate = dto.firstDueDate
      ? new Date(dto.firstDueDate)
      : new Date(dto.disburseAt || new Date())
    if (!dto.firstDueDate) baseDueDate.setMonth(baseDueDate.getMonth() + 1)

    const plans = Array.from({ length: term }, (_, index) => {
      const dueDate = new Date(baseDueDate)
      dueDate.setMonth(baseDueDate.getMonth() + index)
      const principal =
        index === term - 1
          ? Math.round((amount - roundedMonthlyPrincipal * (term - 1)) * 100) / 100
          : roundedMonthlyPrincipal
      const remainingPrincipal = Math.round((amount - roundedMonthlyPrincipal * index) * 100) / 100
      const interest = Math.round(remainingPrincipal * monthlyRate * 100) / 100
      return {
        tenantId: getCurrentTenantId()!,
        applicationId: application.id,
        period: index + 1,
        dueDate,
        principal,
        interest,
        totalAmount: Math.round((principal + interest) * 100) / 100,
        status: RepaymentStatus.NOT_DUE
      }
    })

    await tx.repaymentPlan.createMany({ data: plans })
  }

  // ==================== 结清 ====================

  /** 结清进件（标记所有还款计划为已结清） */
  async settleApplication(
    tx: Prisma.TransactionClient,
    applicationId: number
  ) {
    const unpaid = await tx.repaymentPlan.count({
      where: {
        applicationId,
        status: { notIn: [RepaymentStatus.PAID, RepaymentStatus.SETTLED] }
      }
    })
    if (unpaid > 0) throw new BadRequestException('仍有未结清还款计划')
    await tx.repaymentPlan.updateMany({
      where: { applicationId },
      data: { status: RepaymentStatus.SETTLED }
    })
  }

  // ==================== 工具方法 ====================

  private addTenantId(where: Record<string, unknown>): Record<string, unknown> {
    const tenantId = getCurrentTenantId()
    if (!tenantId) return where
    return { ...where, tenantId, deletedAt: null }
  }
}
