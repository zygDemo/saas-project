import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class MobileBankCardService {
  constructor(private readonly prisma: PrismaService) {}

  async getBankCards(customerId: number) {
    return this.prisma.bankCard.findMany({
      where: { customerId, deletedAt: null },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }]
    })
  }

  async addBankCard(customerId: number, dto: { bankName: string; cardNo: string; cardType?: string; isDefault?: boolean }) {
    if (dto.isDefault) {
      await this.prisma.bankCard.updateMany({
        where: { customerId, isDefault: true },
        data: { isDefault: false }
      })
    }
    return this.prisma.bankCard.create({
      data: {
        customerId,
        bankName: dto.bankName,
        cardNo: dto.cardNo,
        cardType: dto.cardType || 'DEBIT',
        isDefault: dto.isDefault ?? false
      }
    })
  }

  async deleteBankCard(id: number) {
    return this.prisma.bankCard.delete({ where: { id } })
  }
}
