import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { RequestUser } from '../../common/types/request-user'
import { MobileSalesLeadDto, MobileFollowUpDto } from './dto/mobile-business.dto'
import { getDefaultOrg, getCustomerByUuid } from './mobile-business.db-helpers'
import { getRequiredTenantId } from '../../common/utils/helpers'

@Injectable()
export class MobileLeadService {
  constructor(private readonly prisma: PrismaService) {}

  async addSalesLead(dto: MobileSalesLeadDto, user: RequestUser, headerOrgId?: number) {
    const org = await getDefaultOrg(this.prisma, headerOrgId)
    const personName = dto.personName || dto.customerName
    const telephone = dto.telephone || dto.phone

    if (!personName?.trim()) throw new BadRequestException('客户姓名不能为空')
    if (!telephone?.trim()) throw new BadRequestException('手机号不能为空')

    const customer = await this.prisma.customer.findFirst({
      where: { orgId: org.id, phone: telephone, tenantId: org.tenantId, deletedAt: null }
    })

    if (customer) {
      return {
        uuid: String(customer.id),
        personName: customer.name,
        telephone: customer.phone
      }
    }

    const newCustomer = await this.prisma.customer.create({
      data: {
        tenantId: org.tenantId,
        orgId: org.id,
        name: personName,
        phone: telephone,
        idCard: dto.idCard,
        status: 'ACTIVE'
      }
    })

    await this.prisma.lead.create({
      data: {
        tenantId: org.tenantId,
        orgId: org.id,
        source: dto.source || 'SELF',
        name: personName,
        phone: telephone,
        idCard: dto.idCard,
        carBrand: dto.carBrand,
        carModel: dto.carModel,
        province: dto.province,
        city: dto.city,
        loanAmount: dto.loanAmount,
        remark: dto.remark,
        status: 'PENDING_ASSIGN',
        assigneeId: dto.salesmanId,
        createdBy: Number(user.userId)
      }
    })

    return {
      uuid: String(newCustomer.id),
      personName: newCustomer.name,
      telephone: newCustomer.phone
    }
  }

  async addFollowUp(dto: MobileFollowUpDto, user: RequestUser) {
    const tenantId = getRequiredTenantId()
    const customer = await getCustomerByUuid(this.prisma, dto.uuid, tenantId)
    if (!customer) throw new NotFoundException('客户不存在')

    const lead = await this.prisma.lead.findFirst({
      where: { phone: customer.phone, orgId: customer.orgId, tenantId, deletedAt: null }
    })

    if (!lead) throw new NotFoundException('线索不存在')

    const content = dto.content ?? dto.followContent
    if (!content?.trim()) throw new BadRequestException('跟进内容不能为空')

    const nextFollowAt = dto.nextFollowAt ?? dto.nextFollowTime

    const followUp = await this.prisma.leadFollowUp.create({
      data: {
        leadId: lead.id,
        followType: dto.followType || 'OTHER',
        content,
        nextFollowAt: nextFollowAt ? new Date(nextFollowAt) : undefined,
        createdBy: Number(user.userId)
      }
    })

    if (nextFollowAt) {
      await this.prisma.lead.update({
        where: { id: lead.id },
        data: { nextFollowAt: new Date(nextFollowAt), status: 'FOLLOWING' }
      })
    }

    return followUp
  }

  async getFollowUpList(uuid: string) {
    const tenantId = getRequiredTenantId()
    const customer = await getCustomerByUuid(this.prisma, uuid, tenantId)
    if (!customer) return []

    const lead = await this.prisma.lead.findFirst({
      where: { phone: customer.phone, tenantId, deletedAt: null }
    })

    if (!lead) return []

    const records = await this.prisma.leadFollowUp.findMany({
      where: { leadId: lead.id },
      orderBy: { createdAt: 'desc' }
    })

    return records
  }
}
