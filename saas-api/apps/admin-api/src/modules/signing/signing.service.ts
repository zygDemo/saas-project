import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { BaseBusinessCrudService } from '../base-business-crud.service'
import { PrismaService } from '../prisma/prisma.service'
import { CreateSigningDto, UpdateSigningDto, SigningQueryDto } from './dto/signing.dto'

@Injectable()
export class SigningService extends BaseBusinessCrudService<CreateSigningDto, UpdateSigningDto, SigningQueryDto> {
  constructor(private readonly prisma: PrismaService) {
    super({
      model: prisma.signRecord,
      prisma,
      exactFields: ['applicationId', 'status'],
      include: { application: true },
      validateCreate: async (dto) => {
        await this.ensureRelatedExists(this.prisma.application, dto.applicationId, '进件不存在')
      },
      validateUpdate: async (_id, dto) => {
        await this.ensureRelatedExists(this.prisma.application, dto.applicationId, '进件不存在')
      },
    })
  }

  /**
   * 授权签署 - 一键完成签署
   */
  async authorizeSign(id: number) {
    // 查询签署记录
    const signRecord = await this.prisma.signRecord.findUnique({
      where: { id },
      include: { application: true }
    })

    if (!signRecord) {
      throw new NotFoundException('签署记录不存在')
    }

    // 检查状态，只有 PENDING 或 SENT 状态才能签署
    if (!['PENDING', 'SENT'].includes(signRecord.status)) {
      throw new BadRequestException(`当前状态 ${signRecord.status} 不允许签署`)
    }

    // 使用事务同时更新签署记录和申请状态
    const result = await this.prisma.$transaction(async (tx) => {
      // 更新签署记录为已签署
      const updatedSignRecord = await tx.signRecord.update({
        where: { id },
        data: {
          status: 'SIGNED',
          signedAt: new Date()
        }
      })

      // 更新申请状态为已签约
      await tx.application.update({
        where: { id: signRecord.applicationId },
        data: {
          status: 'SIGNED'
        }
      })

      return updatedSignRecord
    })

    return {
      code: 200,
      message: '授权签署成功',
      data: result
    }
  }
}
