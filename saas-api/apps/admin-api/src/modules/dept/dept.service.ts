import { BadRequestException, Injectable } from '@nestjs/common'
import { BaseBusinessCrudService } from '../base-business-crud.service'
import { PrismaService } from '../prisma/prisma.service'
import { CreateDeptDto, UpdateDeptDto, DeptQueryDto } from './dto/dept.dto'

type DeptManagerOption = {
  id: number
  nickName: string
  userName: string
  phone: string | null
}

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

  async getList(query: DeptQueryDto) {
    const page = await super.getList(query)
    const managerIds = [
      ...new Set(
        page.records
          .map((item: any) => item.managerId)
          .filter((id: unknown): id is number => typeof id === 'number')
      )
    ]
    if (!managerIds.length) return page

    const managers = await this.prisma.user.findMany({
      where: { id: { in: managerIds } },
      select: { id: true, nickName: true, userName: true, phone: true }
    })
    const managerMap = new Map<number, DeptManagerOption>(managers.map((user) => [user.id, user]))

    return {
      ...page,
      records: page.records.map((item: any) => {
        const manager = item.managerId ? managerMap.get(item.managerId) : undefined
        return {
          ...item,
          managerName: manager?.nickName || manager?.userName || '',
          managerPhone: manager?.phone || ''
        }
      })
    }
  }

  private async validateDept(dto: CreateDeptDto | UpdateDeptDto, id?: number) {
    await this.ensureRelatedExists(this.prisma.organization, dto.orgId, '机构不存在')
    await this.ensureManagerBelongsToOrg(dto.managerId, dto.orgId)

    if (dto.parentId) {
      if (dto.parentId === id) throw new BadRequestException('上级部门不能选择自身')
      const parent = await this.prisma.department.findFirst({ where: { id: dto.parentId, orgId: dto.orgId } })
      if (!parent) throw new BadRequestException('父部门不存在或不属于当前机构')
    }
  }

  private async ensureManagerBelongsToOrg(managerId?: number, orgId?: number) {
    if (!managerId) return
    const manager = await this.prisma.user.findUnique({
      where: { id: managerId },
      include: { dept: true }
    })
    if (!manager) throw new BadRequestException('负责人不存在')
    if (manager.deptId && manager.dept?.orgId !== orgId) {
      throw new BadRequestException('负责人不属于当前机构')
    }
  }
}
