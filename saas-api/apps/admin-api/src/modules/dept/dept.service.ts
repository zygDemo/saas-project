import { BadRequestException, Injectable } from '@nestjs/common'
import { BaseBusinessCrudService } from '../base-business-crud.service'
import { PrismaService } from '../prisma/prisma.service'
import { CreateDeptDto, UpdateDeptDto, DeptQueryDto } from './dto/dept.dto'

@Injectable()
export class DeptService extends BaseBusinessCrudService<CreateDeptDto, UpdateDeptDto, DeptQueryDto> {
  constructor(private readonly prisma: PrismaService) {
    super({
      model: prisma.department,
      prisma,
      searchableFields: ['name'],
      exactFields: ['orgId', 'parentId'],
      include: { org: true, parent: true },
      validateCreate: async (dto) => this.validateDept(dto),
      validateUpdate: async (id, dto) => this.validateDept(dto, id)
    })
  }

  private async validateDept(dto: CreateDeptDto | UpdateDeptDto, id?: number) {
    await this.ensureRelatedExists(this.prisma.organization, dto.orgId, '机构不存在')
    await this.ensureRelatedExists(this.prisma.user, dto.managerId, '负责人不存在')

    if (dto.parentId) {
      if (dto.parentId === id) throw new BadRequestException('上级部门不能选择自身')
      const parent = await this.prisma.department.findFirst({ where: { id: dto.parentId, orgId: dto.orgId } })
      if (!parent) throw new BadRequestException('父部门不存在或不属于当前机构')
    }
  }
}
