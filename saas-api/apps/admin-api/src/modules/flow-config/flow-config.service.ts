import { BadRequestException, Injectable } from '@nestjs/common'
import { BaseBusinessCrudService } from '../base-business-crud.service'
import { PrismaService } from '../prisma/prisma.service'
import { CreateFlowConfigDto, FlowConfigQueryDto, UpdateFlowConfigDto } from './dto/flow-config.dto'

@Injectable()
export class FlowConfigService extends BaseBusinessCrudService<
  CreateFlowConfigDto,
  UpdateFlowConfigDto,
  FlowConfigQueryDto
> {
  constructor(private readonly prisma: PrismaService) {
    super({
      model: prisma.flowConfig,
      prisma,
      searchableFields: ['name', 'nodeName'],
      exactFields: ['orgId', 'businessType', 'nodeCode', 'status'],
      include: { org: true },
      validateCreate: async (dto) => this.validateFlowConfig(dto),
      validateUpdate: async (_id, dto) => this.validateFlowConfig(dto)
    })
  }

  private async validateFlowConfig(dto: CreateFlowConfigDto | UpdateFlowConfigDto) {
    await this.ensureRelatedExists(this.prisma.organization, dto.orgId, '机构不存在')
    if (dto.autoPass && dto.requireApproval) {
      throw new BadRequestException('自动通过时不能同时要求审批')
    }
    if (dto.amountLimit !== undefined && dto.amountLimit < 0) {
      throw new BadRequestException('金额阈值不能小于0')
    }
    if (dto.timeoutHours !== undefined && dto.timeoutHours < 0) {
      throw new BadRequestException('超时时长不能小于0')
    }
  }
}
