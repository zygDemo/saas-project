import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common'
import { UsersService } from './users.service'
import { PrismaService } from '../prisma/prisma.service'

jest.mock('../../common/tenant/tenant-context', () => ({
  getCurrentTenantId: jest.fn(() => 1),
}))

const mockUser = {
  id: 1, tenantId: 1, deptId: 1, userName: 'testuser', passwordHash: '$2a$10$hashed',
  nickName: '测试用户', gender: 'MALE', phone: '13800000000', email: 'test@example.com',
  avatar: null, status: 'ONLINE', createdAt: new Date(), updatedAt: new Date(),
  roles: [{ role: { code: 'admin', permissions: [{ permission: { authMark: 'sys:user:list' } }] } }],
}

describe('UsersService', () => {
  let service: UsersService
  let mockPrisma: any

  beforeEach(async () => {
    mockPrisma = {
      user: {
        findFirst: jest.fn().mockResolvedValue(mockUser),
        findMany: jest.fn().mockResolvedValue([mockUser]),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue(mockUser),
        update: jest.fn().mockResolvedValue(mockUser),
      },
      role: { findMany: jest.fn().mockResolvedValue([{ id: 1, code: 'admin' }]) },
      department: { findFirst: jest.fn().mockResolvedValue({ id: 1 }) },
      $transaction: jest.fn((arr) => Promise.all(arr)),
    }
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile()
    service = module.get<UsersService>(UsersService)
  })

  describe('getUserInfo', () => {
    it('应返回用户信息含角色和按钮权限', async () => {
      const result = await service.getUserInfo(1)
      expect(result.userName).toBe('testuser')
      expect(result.roles).toContain('admin')
      expect(result.buttons).toContain('sys:user:list')
    })
    it('用户不存在时应抛出 NotFoundException', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null)
      await expect(service.getUserInfo(999)).rejects.toThrow(NotFoundException)
    })
  })

  describe('getUserList', () => {
    it('应返回分页用户列表', async () => {
      const result = await service.getUserList({} as any)
      expect(mockPrisma.user.findMany).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('应支持用户名搜索', async () => {
      await service.getUserList({ userName: 'test' } as any)
      const call = mockPrisma.user.findMany.mock.calls[0][0]
      expect(call.where.userName).toBeDefined()
    })
    it('应支持状态过滤', async () => {
      await service.getUserList({ status: '1' } as any)
      const call = mockPrisma.user.findMany.mock.calls[0][0]
      expect(call.where.status).toBe('ONLINE')
    })
  })

  describe('createUser', () => {
    it('应创建用户并加密密码', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null) // 用户名不存在
      await service.createUser({ userName: 'newuser', password: 'pass123', nickName: '新用户' } as any)
      expect(mockPrisma.user.create).toHaveBeenCalled()
      const call = mockPrisma.user.create.mock.calls[0][0]
      expect(call.data.passwordHash).toBeDefined()
      expect(call.data.passwordHash).not.toBe('pass123')
    })
    it('用户名已存在时应抛出 ConflictException', async () => {
      await expect(service.createUser({ userName: 'testuser', password: 'p', nickName: 'X' } as any)).rejects.toThrow(ConflictException)
    })
    it('部门不存在时应抛出异常', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null)
      mockPrisma.department.findFirst.mockResolvedValue(null)
      await expect(service.createUser({ userName: 'u', password: 'p', nickName: 'X', deptId: 999 } as any)).rejects.toThrow(BadRequestException)
    })
  })

  describe('updateUser', () => {
    it('应更新用户信息', async () => {
      await service.updateUser(1, { nickName: '更新昵称' } as any)
      expect(mockPrisma.user.update).toHaveBeenCalled()
    })
    it('用户不存在时应抛出异常', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null)
      await expect(service.updateUser(999, {} as any)).rejects.toThrow()
    })
  })

  describe('deleteUser', () => {
    it('应删除用户', async () => {
      await service.deleteUser(1)
      expect(mockPrisma.user.update).toHaveBeenCalled()
    })
  })
})
