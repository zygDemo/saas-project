import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { MobileContactDto } from './dto/mobile-business.dto'
import { getCustomerByUuid } from './mobile-business.db-helpers'
import { getRequiredTenantId } from '../../common/utils/helpers'

@Injectable()
export class MobileContactService {
  constructor(private readonly prisma: PrismaService) {}

  async addOrUpdateContact(dto: MobileContactDto) {
    const tenantId = getRequiredTenantId()
    const customer = await getCustomerByUuid(this.prisma, dto.userUuid, tenantId)
    if (!customer) throw new NotFoundException('客户不存在或无权访问')

    const relationMap: Record<number, string> = {
      1: '配偶',
      2: '父母',
      3: '子女',
      4: '朋友',
      5: '兄弟姐妹',
      6: '亲戚',
      7: '同事',
      8: '其他'
    }

    const normalizedName = dto.contactName?.trim()
    const normalizedPhone = dto.contactTelephone?.trim()
    const normalizedRelation = dto.contactRelationship ? relationMap[dto.contactRelationship] : undefined

    if (!normalizedName) throw new BadRequestException('联系人姓名不能为空')
    if (!normalizedPhone) throw new BadRequestException('联系人手机号不能为空')
    if (!normalizedRelation) throw new BadRequestException('联系人关系不正确')

    const data = {
      customerId: customer.id,
      name: normalizedName,
      relation: normalizedRelation,
      phone: normalizedPhone,
      isEmergency: dto.contactType === 2 || dto.contactType === 3
    }

    if (dto.id) {
      const existing = await this.prisma.customerContact.findFirst({
        where: { id: dto.id, customerId: customer.id }
      })
      if (!existing) throw new NotFoundException('联系人不存在')
      return this.prisma.customerContact.update({
        where: { id: dto.id },
        data
      })
    }

    return this.prisma.customerContact.create({ data })
  }

  async getContacts(userUuid: string) {
    const tenantId = getRequiredTenantId()
    const customer = await getCustomerByUuid(this.prisma, userUuid, tenantId)
    if (!customer) return []

    return this.prisma.customerContact.findMany({
      where: { customerId: customer.id, deletedAt: null },
      orderBy: { id: 'desc' }
    })
  }

  async deleteContact(id: number) {
    await this.prisma.customerContact.update({ where: { id }, data: { deletedAt: new Date() } })
    return { code: 200, msg: 'success' }
  }
}
