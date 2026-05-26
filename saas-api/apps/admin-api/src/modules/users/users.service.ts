import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma, UserStatus } from '@prisma/client'
import * as bcrypt from 'bcryptjs'
import { PaginatedResponse } from '../../common/types/pagination'
import { PrismaService } from '../prisma/prisma.service'
import { CreateUserDto } from './dto/create-user.dto'

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
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
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

    const roles = user.roles.map(({ role }) => role.code)
    const buttons = user.roles.flatMap(({ role }) =>
      role.permissions.map(({ permission }) => permission.authMark)
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
    const current = Number(query.current ?? 1)
    const size = Number(query.size ?? 20)
    const where: Prisma.UserWhereInput = {
      userName: query.userName ? { contains: query.userName, mode: 'insensitive' } : undefined,
      gender: query.userGender ? query.userGender : undefined,
      phone: query.userPhone ? { contains: query.userPhone } : undefined,
      email: query.userEmail ? { contains: query.userEmail, mode: 'insensitive' } : undefined,
      status: query.status ? queryStatusMap[query.status] : undefined
    }

    const [records, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip: (current - 1) * size,
        take: size,
        orderBy: { id: 'asc' },
        include: { roles: { include: { role: true } } }
      }),
      this.prisma.user.count({ where })
    ])

    return {
      records: records.map((user) => ({
        id: user.id,
        avatar: user.avatar ?? '',
        status: statusCodeMap[user.status],
        userName: user.userName,
        userGender: user.gender,
        nickName: user.nickName,
        userPhone: user.phone ?? '',
        userEmail: user.email,
        userRoles: user.roles.map(({ role }) => role.code),
        createBy: user.createdBy,
        createTime: formatDate(user.createdAt),
        updateBy: user.updatedBy,
        updateTime: formatDate(user.updatedAt)
      })),
      current,
      size,
      total
    }
  }

  async createUser(dto: CreateUserDto, operator = 'system') {
    const existedUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ userName: dto.userName }, { email: dto.email }]
      }
    })

    if (existedUser?.userName === dto.userName) {
      throw new ConflictException('Username already exists')
    }

    if (existedUser?.email === dto.email) {
      throw new ConflictException('Email already exists')
    }

    const roles = await this.prisma.role.findMany({
      where: { code: { in: dto.roleCodes } },
      select: { id: true, code: true }
    })
    const roleCodeSet = new Set(roles.map((role) => role.code))
    const missingRoleCodes = dto.roleCodes.filter((roleCode) => !roleCodeSet.has(roleCode))

    if (missingRoleCodes.length > 0) {
      throw new BadRequestException(`Role not found: ${missingRoleCodes.join(', ')}`)
    }

    const user = await this.prisma.user.create({
      data: {
        userName: dto.userName,
        nickName: dto.nickName || dto.userName,
        passwordHash: await bcrypt.hash(dto.password, 10),
        email: dto.email,
        phone: dto.phone,
        gender: normalizeGender(dto.gender),
        status: dto.status ? queryStatusMap[dto.status] : UserStatus.ONLINE,
        createdBy: operator,
        updatedBy: operator,
        roles: {
          create: roles.map((role) => ({
            role: { connect: { id: role.id } }
          }))
        }
      },
      include: { roles: { include: { role: true } } }
    })

    return {
      id: user.id,
      avatar: user.avatar ?? '',
      status: statusCodeMap[user.status],
      userName: user.userName,
      userGender: user.gender,
      nickName: user.nickName,
      userPhone: user.phone ?? '',
      userEmail: user.email,
      userRoles: user.roles.map(({ role }) => role.code),
      createBy: user.createdBy,
      createTime: formatDate(user.createdAt),
      updateBy: user.updatedBy,
      updateTime: formatDate(user.updatedAt)
    }
  }
}

function formatDate(date: Date) {
  return date.toISOString().replace('T', ' ').slice(0, 19)
}

function normalizeGender(gender?: string) {
  if (gender === '男' || gender === '女') return gender
  return '未知'
}
