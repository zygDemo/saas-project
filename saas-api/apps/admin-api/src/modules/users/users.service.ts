import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma, UserStatus } from '@prisma/client'
import * as bcrypt from 'bcryptjs'
import { getCurrentTenantId } from '../../common/tenant/tenant-context'
import { PaginatedResponse } from '../../common/types/pagination'
import { getPagination, toPaginatedResponse } from '../../common/utils/pagination'
import { PrismaService } from '../prisma/prisma.service'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'

const statusCodeMap: Record<UserStatus, string> = {
  ONLINE: '1',
  OFFLINE: '2',
  ABNORMAL: '3',
  DISABLED: '4'
}

const queryStatusMap: Record<string, UserStatus> = {
  '1': UserStatus.ONLINE,
  '2': UserStatus.OFFLINE,
  '3': UserStatus.ABNORMAL,
  '4': UserStatus.DISABLED
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserInfo(userId: number) {
    const tenantId = getCurrentTenantId()
    const user = await this.prisma.user.findFirst({
      where: { id: userId, ...(tenantId ? { tenantId } : {}) },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: { include: { permission: true } }
              }
            }
          }
        }
      }
    })

    if (!user) throw new NotFoundException('User not found')

    const roles = user.roles.map(({ role }: any) => role.code)
    const buttons = user.roles.flatMap(({ role }: any) =>
      role.permissions.map(({ permission }: any) => permission.authMark)
    )

    return {
      buttons: [...new Set(buttons)],
      roles,
      userId: user.id,
      userName: user.userName,
      email: user.email,
      avatar: user.avatar
    }
  }

  async getUserList(query: Record<string, string | undefined>): Promise<PaginatedResponse<unknown>> {
    const pagination = getPagination(query)
    const where: Prisma.UserWhereInput = {
      id: query.id ? Number(query.id) : undefined,
      userName: query.userName ? { contains: query.userName, mode: 'insensitive' } : undefined,
      gender: query.userGender ? query.userGender : undefined,
      phone: query.userPhone ? { contains: query.userPhone } : undefined,
      email: query.userEmail ? { contains: query.userEmail, mode: 'insensitive' } : undefined,
      status: query.status ? queryStatusMap[query.status] : undefined,
      ...(query.orgId
        ? {
            OR: [
              { deptId: null },
              {
                dept: {
                  orgId: Number(query.orgId)
                }
              }
            ]
          }
        : {}),
      deptId: query.deptId ? Number(query.deptId) : undefined
    }

    const [records, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { id: 'asc' },
        include: { dept: { include: { org: true } }, roles: { include: { role: true } } }
      }),
      this.prisma.user.count({ where })
    ])

    return toPaginatedResponse(records.map(mapUserListItem), total, pagination)
  }

  async createUser(dto: CreateUserDto, operator = 'system') {
    await this.ensureDeptExists(dto.deptId)

    const existedUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { userName: { equals: dto.userName, mode: 'insensitive' } },
          { email: { equals: dto.email, mode: 'insensitive' } }
        ]
      }
    })

    if (existedUser?.userName.toLowerCase() === dto.userName.toLowerCase()) {
      throw new ConflictException('Username already exists')
    }

    if (existedUser?.email.toLowerCase() === dto.email.toLowerCase()) {
      throw new ConflictException('Email already exists')
    }

    const roles = await this.getRolesByCodes(dto.roleCodes)

    const user = await this.prisma.user.create({
      data: {
        userName: dto.userName,
        nickName: dto.nickName || dto.userName,
        passwordHash: await bcrypt.hash(dto.password, 10),
        email: dto.email,
        phone: dto.phone,
        gender: normalizeGender(dto.gender),
        deptId: dto.deptId,
        status: dto.status ? queryStatusMap[dto.status] : UserStatus.ONLINE,
        createdBy: operator,
        updatedBy: operator,
        roles: {
          create: roles.map((role: any) => ({
            role: { connect: { id: role.id } }
          }))
        }
      },
      include: { dept: { include: { org: true } }, roles: { include: { role: true } } }
    })

    return mapUserListItem(user)
  }

  async updateUser(id: number, dto: UpdateUserDto, operator = 'system') {
    const user = await this.prisma.user.findUnique({ where: { id } })
    if (!user) throw new NotFoundException('User not found')
    await this.ensureDeptExists(dto.deptId)

    if (dto.userName || dto.email) {
      const existedUser = await this.prisma.user.findFirst({
        where: {
          id: { not: id },
          OR: [
            ...(dto.userName ? [{ userName: { equals: dto.userName, mode: 'insensitive' as const } }] : []),
            ...(dto.email ? [{ email: { equals: dto.email, mode: 'insensitive' as const } }] : [])
          ]
        }
      })

      if (dto.userName && existedUser?.userName.toLowerCase() === dto.userName.toLowerCase()) {
        throw new ConflictException('Username already exists')
      }

      if (dto.email && existedUser?.email.toLowerCase() === dto.email.toLowerCase()) {
        throw new ConflictException('Email already exists')
      }
    }

    const roles = dto.roleCodes ? await this.getRolesByCodes(dto.roleCodes) : undefined
    const passwordHash = dto.password ? await bcrypt.hash(dto.password, 10) : undefined

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        userName: dto.userName,
        nickName: dto.nickName,
        passwordHash,
        email: dto.email,
        phone: dto.phone,
        gender: dto.gender ? normalizeGender(dto.gender) : undefined,
        deptId: dto.deptId,
        status: dto.status ? queryStatusMap[dto.status] : undefined,
        updatedBy: operator,
        roles: roles
          ? {
              deleteMany: {},
              create: roles.map((role: any) => ({
                role: { connect: { id: role.id } }
              }))
            }
          : undefined
      },
      include: { dept: { include: { org: true } }, roles: { include: { role: true } } }
    })

    return mapUserListItem(updatedUser)
  }

  async deleteUser(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } })
    if (!user) throw new NotFoundException('User not found')

    await this.prisma.user.delete({ where: { id } })
    return { id }
  }

  private async getRolesByCodes(roleCodes: string[]) {
    const uniqueRoleCodes = [...new Set(roleCodes)]
    const roles = await this.prisma.role.findMany({
      where: { code: { in: uniqueRoleCodes } },
      select: { id: true, code: true }
    })
    const roleCodeSet = new Set(roles.map((role: any) => role.code))
    const missingRoleCodes = uniqueRoleCodes.filter((roleCode) => !roleCodeSet.has(roleCode))

    if (missingRoleCodes.length > 0) {
      throw new BadRequestException(`Role not found: ${missingRoleCodes.join(', ')}`)
    }

    return roles
  }

  private async ensureDeptExists(deptId?: number) {
    if (!deptId) return
    const tenantId = getCurrentTenantId()
    const dept = await this.prisma.department.findFirst({
      where: { id: deptId, ...(tenantId ? { tenantId } : {}) }
    })
    if (!dept) throw new BadRequestException('所属部门不存在')
  }
}

function formatDate(date: Date) {
  return date.toISOString().replace('T', ' ').slice(0, 19)
}

type UserWithRoles = Prisma.UserGetPayload<{
  include: { dept: { include: { org: true } }; roles: { include: { role: true } } }
}>

function mapUserListItem(user: UserWithRoles) {
  return {
    id: user.id,
    avatar: user.avatar ?? '',
    status: statusCodeMap[user.status],
    userName: user.userName,
    userGender: user.gender,
    nickName: user.nickName,
    userPhone: user.phone ?? '',
    userEmail: user.email,
    deptId: user.deptId,
    deptName: user.dept?.name ?? '',
    orgId: user.dept?.orgId,
    orgName: user.dept?.org?.name ?? '',
    userRoles: user.roles.map(({ role }: any) => role.code),
    createBy: user.createdBy,
    createTime: formatDate(user.createdAt),
    updateBy: user.updatedBy,
    updateTime: formatDate(user.updatedAt)
  }
}

function normalizeGender(gender?: string) {
  if (gender === '男' || gender === '女') return gender
  return '未知'
}
