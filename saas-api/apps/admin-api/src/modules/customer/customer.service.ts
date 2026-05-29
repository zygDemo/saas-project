import { BadRequestException, Injectable } from '@nestjs/common'
import { BaseBusinessCrudService, omitNested } from '../base-business-crud.service'
import { PrismaService } from '../prisma/prisma.service'
import { CreateCustomerDto, UpdateCustomerDto, CustomerQueryDto } from './dto/customer.dto'

@Injectable()
export class CustomerService extends BaseBusinessCrudService<CreateCustomerDto, UpdateCustomerDto, CustomerQueryDto> {
  constructor(private readonly prisma: PrismaService) {
    super({
      model: prisma.customer,
      prisma,
      searchableFields: ['name', 'phone', 'idCard'],
      exactFields: ['orgId', 'status'],
      include: { org: true },
      detailInclude: { org: true, contacts: true, vehicles: true, bankCards: true, applications: true },
      validateCreate: async (dto) => {
        await this.ensureRelatedExists(this.prisma.organization, dto.orgId, '机构不存在')
      },
      validateUpdate: async (_id, dto) => {
        await this.ensureRelatedExists(this.prisma.organization, dto.orgId, '机构不存在')
      },
      beforeCreate: (dto) => {
        const data = omitNested(dto as unknown as Record<string, unknown>, ['contacts', 'vehicles', 'bankCards'])
        if (dto.contacts?.length) data.contacts = { create: dto.contacts }
        if (dto.vehicles?.length) data.vehicles = { create: dto.vehicles }
        if (dto.bankCards?.length) data.bankCards = { create: dto.bankCards }
        return data
      },
      beforeUpdate: (dto) => omitNested(dto as unknown as Record<string, unknown>, ['contacts', 'vehicles', 'bankCards'])
    })
  }

  async addContact(customerId: number, data: NonNullable<CreateCustomerDto['contacts']>[number]) {
    await this.ensureExists(customerId)
    return this.prisma.customerContact.create({ data: { ...data, customerId } })
  }

  async addVehicle(customerId: number, data: NonNullable<CreateCustomerDto['vehicles']>[number]) {
    await this.ensureExists(customerId)
    return this.prisma.vehicle.create({ data: { ...data, customerId } })
  }

  async addBankCard(customerId: number, data: NonNullable<CreateCustomerDto['bankCards']>[number]) {
    await this.ensureExists(customerId)
    if (data.isDefault) {
      await this.prisma.bankCard.updateMany({ where: { customerId }, data: { isDefault: false } })
    }
    const cards = await this.prisma.bankCard.count({ where: { customerId } })
    if (cards >= 10) throw new BadRequestException('银行卡数量已达上限')
    return this.prisma.bankCard.create({ data: { ...data, customerId } })
  }
}
