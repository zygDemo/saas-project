import { ApplicationStatus } from '@prisma/client'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { createApplicationWithUniqueNo } from '../../common/utils/application-no'
import { RequestUser } from '../../common/types/request-user'
import { PrismaService } from '../prisma/prisma.service'

export async function getDefaultOrg(prisma: PrismaService, orgId?: number) {
  if (orgId && Number.isInteger(orgId) && orgId > 0) {
    const headerOrg = await prisma.organization.findFirst({ where: { id: orgId } })
    if (headerOrg) return headerOrg
  }
  const org = await prisma.organization.findFirst({ orderBy: { id: 'asc' } })
  if (!org) throw new BadRequestException('请先配置机构')
  return org
}

export async function getDefaultProduct(prisma: PrismaService, orgId: number) {
  const active = await prisma.product.findFirst({
    where: { orgId, status: 'ACTIVE' },
    orderBy: { id: 'asc' }
  })
  if (active) return active
  return prisma.product.findFirst({
    where: { orgId },
    orderBy: { id: 'asc' }
  })
}

export async function getDefaultFunder(prisma: PrismaService, orgId: number) {
  return prisma.funder.findFirst({
    where: { orgId, status: 'ACTIVE' },
    orderBy: [{ priority: 'desc' }, { id: 'asc' }]
  })
}

export async function findCustomerByUuid(prisma: PrismaService, uuid: string) {
  const id = Number(uuid)
  if (!Number.isInteger(id) || id <= 0) return null
  return prisma.customer.findFirst({ where: { id } })
}

export async function getCustomerByUuid(prisma: PrismaService, uuid: string) {
  const customer = await findCustomerByUuid(prisma, uuid)
  if (!customer) throw new NotFoundException('客户信息不存在')
  return customer
}

export async function findApplication(
  prisma: PrismaService,
  idOrNo: string | number
) {
  const numericId = Number(idOrNo)
  const application =
    Number.isInteger(numericId) && numericId > 0
      ? await prisma.application.findFirst({
          where: { id: numericId },
          include: {
            customer: { include: { vehicles: true } },
            product: true,
            funder: true,
            approvals: { orderBy: { createdAt: 'desc' }, take: 5 }
          }
        })
      : await prisma.application.findFirst({
          where: { applicationNo: String(idOrNo) },
          include: {
            customer: { include: { vehicles: true } },
            product: true,
            funder: true,
            approvals: { orderBy: { createdAt: 'desc' }, take: 5 }
          }
        })
  if (!application) throw new NotFoundException('授信申请不存在')
  return application
}

export async function findApplicationByOrderId(prisma: PrismaService, creditOrderId: string) {
  if (!creditOrderId) return null
  return prisma.application.findFirst({
    where: { applicationNo: creditOrderId }
  })
}

export async function findLatestDraftApplication(prisma: PrismaService, customerId: number) {
  return prisma.application.findFirst({
    where: {
      customerId,
      status: ApplicationStatus.DRAFT
    },
    orderBy: { id: 'desc' }
  })
}

export async function findDraftApplicationByNo(
  prisma: PrismaService,
  customerId: number,
  applicationNo: string
) {
  return prisma.application.findFirst({
    where: {
      customerId,
      applicationNo,
      status: ApplicationStatus.DRAFT
    }
  })
}

export async function ensureCustomerDraftApplication(
  prisma: PrismaService,
  customer: any,
  user: RequestUser,
  options: { businessType?: string } = {}
) {
  const current = await findLatestDraftApplication(prisma, customer.id)
  if (current) {
    if (current.currentNode < 1100 || current.currentStatus !== 10) {
      return prisma.application.update({
        where: { id: current.id },
        data: { currentNode: 1100, currentStatus: 10 }
      })
    }
    return current
  }

  const product = await getDefaultProduct(prisma, customer.orgId)
  const funder = await getDefaultFunder(prisma, customer.orgId)
  const rate = product ? Number(product.minRate) : 0.006

  return createApplicationWithUniqueNo((applicationNo) =>
    prisma.application.create({
      data: {
        orgId: customer.orgId,
        customerId: customer.id,
        productId: product?.id,
        funderId: funder?.id,
        applicationNo,
        amount: 0,
        term: product?.minTerm || 12,
        rate,
        repaymentMethod: product?.repaymentMethod || '等额本息',
        status: ApplicationStatus.DRAFT,
        businessType: options.businessType === 'pawn' ? 'PAWN' : 'CAR_LOAN',
        currentNode: 1100,
        currentStatus: 10,
        creatorId: user.sub,
        remark: '移动端身份证信息提交自动创建订单草稿'
      }
    })
  )
}

export function getFileAssetModel(prisma: PrismaService) {
  return (
    prisma as unknown as {
      fileAsset?: {
        findMany(args: unknown): Promise<unknown[]>
        create(args: unknown): Promise<unknown>
        update(args: unknown): Promise<unknown>
      }
    }
  ).fileAsset
}

export async function getCustomerApplicationIds(prisma: PrismaService, customerId: number) {
  const applications = await prisma.application.findMany({
    where: { customerId },
    select: { id: true }
  })
  return applications.map((item: { id: number }) => item.id)
}

export async function getCustomerVehicleIds(prisma: PrismaService, customerId: number) {
  const vehicles = await prisma.vehicle.findMany({
    where: { customerId },
    select: { id: true }
  })
  return vehicles.map((item: { id: number }) => item.id)
}
