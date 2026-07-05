import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { RequestUser } from '../../common/types/request-user'
import { MobileSalesLeadDto, MobileFollowUpDto } from './dto/mobile-business.dto'
import { getDefaultOrg, getCustomerByUuid } from './mobile-business.db-helpers'

@Injectable()
export class MobileLeadService {
  constructor(private readonly prisma: PrismaService) {}

  async addSalesLead(dto: MobileSalesLeadDto, user: RequestUser, headerOrgId?: number) {
    const org = await getDefaultOrg(this.prisma, headerOrgId)

    const customer = await this.prisma.customer.findFirst({
      where: { orgId: org.id, phone: dto.telephone }
    })

    if (customer) {
      return {
        code: 200,
        msg: 'success',
        data: {
          uuid: String(customer.id),
          personName: customer.name,
          telephone: customer.phone
        }
      }
    }

    const newCustomer = await this.prisma.customer.create({
      data: {
        orgId: org.id,
        name: dto.personName,
        phone: dto.telephone,
        idCard: dto.idCard,
        status: 'ACTIVE'
      }
    })

    await this.prisma.lead.create({
      data: {
        orgId: org.id,
        source: dto.source || 'SELF',
        name: dto.personName,
        phone: dto.telephone,
        idCard: dto.idCard,
        carBrand: dto.carBrand,
        carModel: dto.carModel,
        loanAmount: dto.loanAmount,
        remark: dto.remark,
        status: 'PENDING_ASSIGN',
        createdBy: user.sub
      }
    })

    return {
      code: 200,
      msg: 'success',
      data: {
        uuid: String(newCustomer.id),
        personName: newCustomer.name,
        telephone: newCustomer.phone
      }
    }
  }

  async addFollowUp(dto: MobileFollowUpDto, user: RequestUser) {
    const customer = await getCustomerByUuid(this.prisma, dto.uuid)
    if (!customer) throw new NotFoundException('客户不存在')

    const lead = await this.prisma.lead.findFirst({
      where: { phone: customer.phone, orgId: customer.orgId }
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
        createdBy: user.sub
      }
    })

    if (nextFollowAt) {
      await this.prisma.lead.update({
        where: { id: lead.id },
        data: { nextFollowAt: new Date(nextFollowAt), status: 'FOLLOWING' }
      })
    }

    return { code: 200, msg: 'success', data: followUp }
  }

  async getFollowUpList(uuid: string) {
    const customer = await getCustomerByUuid(this.prisma, uuid)
    if (!customer) return []

    const lead = await this.prisma.lead.findFirst({
      where: { phone: customer.phone }
    })

    if (!lead) return []

    const records = await this.prisma.leadFollowUp.findMany({
      where: { leadId: lead.id },
      orderBy: { createdAt: 'desc' }
    })

    return { code: 200, msg: 'success', data: records }
  }
}
