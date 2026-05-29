import { Injectable } from '@nestjs/common'
import { BaseBusinessCrudService } from '../base-business-crud.service'
import { PrismaService } from '../prisma/prisma.service'
import { CreateDeptDto, UpdateDeptDto, DeptQueryDto } from './dto/dept.dto'

@Injectable()
export class DeptService extends BaseBusinessCrudService<CreateDeptDto, UpdateDeptDto, DeptQueryDto> {
  constructor(private readonly prisma: PrismaService) {
    super({
      model: prisma.department,
      prisma,
      searchableFields: ['name'], exactFields: ['orgId', 'parentId'],
      include: { org: true, parent: true },
      validateCreate: async (dto) => {
        await this.ensureRelatedExists(this.prisma.organization, dto.orgId, '机构不存在')
        await this.ensureRelatedExists(this.prisma.department, dto.parentId, '父部门不存在')
        await this.ensureRelatedExists(this.prisma.user, dto.managerId, '负责人不存在')
      },
      validateUpdate: async (_id, dto) => {
        await this.ensureRelatedExists(this.prisma.organization, dto.orgId, '机构不存在')
        await this.ensureRelatedExists(this.prisma.department, dto.parentId, '父部门不存在')
        await this.ensureRelatedExists(this.prisma.user, dto.managerId, '负责人不存在')
      },
    })
  }
}
