import { BadRequestException, Injectable } from '@nestjs/common'
import { ApplicationStatus, DisbursementStatus, Prisma } from '@prisma/client'
import { BaseBusinessCrudService } from '../base-business-crud.service'
import { getCurrentTenantId } from '../../common/tenant/tenant-context'
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
        detailInclude: { application: { include: { customer: true, product: true } } },
      validateCreate: async (dto) => {
        await this.ensureRelatedExists(this.prisma.application, dto.applicationId, '进件不存在')
      },
      validateUpdate: async (_id, dto) => {
        await this.ensureRelatedExists(this.prisma.application, dto.applicationId, '进件不存在')
      },
    })
  }
  // ==================== GPS安装 ====================
  /** 登记GPS安装完成 */
  async completeGpsInstall(applicationId: number, dto: {
    gpsDeviceNo?: string
    gpsInstallImg?: string
    gpsInstallAt?: string | Date
  }) {
    return this.prisma.disbursement.upsert({
      where: { applicationId },
      update: {
        status: DisbursementStatus.GPS_INSTALLED,
        gpsDeviceNo: dto.gpsDeviceNo,
        gpsInstallImg: dto.gpsInstallImg,
        gpsInstallAt: dto.gpsInstallAt ? new Date(dto.gpsInstallAt) : new Date()
      },
      create: {
        tenantId: getCurrentTenantId()!,
        applicationId,
        status: DisbursementStatus.GPS_INSTALLED,
        gpsDeviceNo: dto.gpsDeviceNo,
        gpsInstallImg: dto.gpsInstallImg,
        gpsInstallAt: dto.gpsInstallAt ? new Date(dto.gpsInstallAt) : new Date()
      }
    })
  }
  // ==================== 抵押登记 ====================
  /** 登记抵押完成 */
  async completeMortgage(applicationId: number, dto: {
    mortgageStatus?: string
    mortgageImg?: string
    mortgageAt?: string | Date
  }) {
    return this.prisma.disbursement.upsert({
      where: { applicationId },
      update: {
        status: DisbursementStatus.MORTGAGE_DONE,
        mortgageStatus: dto.mortgageStatus || 'DONE',
        mortgageImg: dto.mortgageImg,
        mortgageAt: dto.mortgageAt ? new Date(dto.mortgageAt) : new Date()
      },
      create: {
        tenantId: getCurrentTenantId()!,
        applicationId,
        status: DisbursementStatus.MORTGAGE_DONE,
        mortgageStatus: dto.mortgageStatus || 'DONE',
        mortgageImg: dto.mortgageImg,
        mortgageAt: dto.mortgageAt ? new Date(dto.mortgageAt) : new Date()
      }
    })
  }
  // ==================== 出账申请 ====================
  /** 提交出账申请 */
  async requestDisbursement(applicationId: number, dto: { remark?: string }) {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const tenantId = getCurrentTenantId()!
      const existed = await tx.disbursement.findFirst({ where: { applicationId } })
      const nextStatus =
        existed?.status === DisbursementStatus.GPS_INSTALLED ||
        existed?.status === DisbursementStatus.MORTGAGE_DONE
          ? existed.status
          : DisbursementStatus.PENDING_APPROVAL
      await tx.disbursement.upsert({
        where: { applicationId },
        update: { status: nextStatus, remark: dto.remark },
        create: { tenantId, applicationId, status: nextStatus, remark: dto.remark }
      })
      return tx.application.update({
        where: { id: applicationId },
        data: {
          status: ApplicationStatus.PENDING_DISBURSEMENT,
          currentNode: 1800,
          currentStatus: 10
        }
      })
    })
  }
  // ==================== 放款确认（含强校验） ====================
  /** 放款确认 — 强制校验GPS安装和抵押状态 */
  async confirmDisbursement(applicationId: number, dto: {
    disburseAmount: number
    disburseAccount?: string
    transactionNo?: string
    voucherUrl?: string
    remark?: string
    disburseAt?: string | Date
  }) {
    // 🔴 强校验：检查 disbursement 记录
    const disbursement = await this.prisma.disbursement.findFirst({
      where: { applicationId }
    })
    if (!disbursement || !['PENDING_APPROVAL', 'GPS_INSTALLED', 'MORTGAGE_DONE'].includes(disbursement.status)) {
      throw new BadRequestException('请先提交出账申请')
    }
    // 🔴 强校验：GPS必须已安装
    if (!disbursement.gpsInstallAt) {
      throw new BadRequestException('请先完成GPS安装后再确认放款')
    }
    // 🔴 强校验：抵押必须已完成
    if (!disbursement.mortgageAt) {
      throw new BadRequestException('请先完成抵押登记后再确认放款')
    }
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const tenantId = getCurrentTenantId()!
      await tx.disbursement.upsert({
        where: { applicationId },
        update: {
          status: DisbursementStatus.DISBURSED,
          disburseAmount: dto.disburseAmount,
          disburseAccount: dto.disburseAccount,
          disburseAt: dto.disburseAt ? new Date(dto.disburseAt) : new Date(),
          transactionNo: dto.transactionNo,
          voucherUrl: dto.voucherUrl,
          remark: dto.remark
        },
        create: {
          tenantId,
          applicationId,
          status: DisbursementStatus.DISBURSED,
          disburseAmount: dto.disburseAmount,
          disburseAccount: dto.disburseAccount,
          disburseAt: dto.disburseAt ? new Date(dto.disburseAt) : new Date(),
          transactionNo: dto.transactionNo,
          voucherUrl: dto.voucherUrl,
          remark: dto.remark
        }
      })
      return tx.application.update({
        where: { id: applicationId },
        data: {
          status: ApplicationStatus.DISBURSED,
          currentNode: 1900,
          currentStatus: 90
        }
      })
    })
  }
}