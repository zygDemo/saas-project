import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common'
import { RolesService } from './roles.service'
import { PrismaService } from '../prisma/prisma.service'
import { CacheService } from '../redis/cache.service'

jest.mock('../../common/tenant/tenant-context', () => ({
  getCurrentTenantId: jest.fn(() => 1),
}))

const mockRole = {
  id: 1, tenantId: 1, name: '管理员', code: 'admin', description: '系统管理员',
  enabled: true, dataScope: 'ALL', createdAt: new Date(), updatedAt: new Date(),
  departments: [],
}

describe('RolesService', () => {
  let service: RolesService
  let mockPrisma: Record<string, unknown>
  let mockCache: Record<string, unknown>

  beforeEach(async () => {
    mockPrisma = {
      role: {
        findFirst: jest.fn().mockResolvedValue(mockRole),
        findMany: jest.fn().mockResolvedValue([mockRole]),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue(mockRole),
        update: jest.fn().mockResolvedValue(mockRole),
      },
      roleDepartment: { createMany: jest.fn(), deleteMany: jest.fn() },
      roleMenu: { deleteMany: jest.fn(), createMany: jest.fn() },
      rolePermission: { deleteMany: jest.fn(), createMany: jest.fn() },
      menu: { findMany: jest.fn().mockResolvedValue([{ id: 1 }, { id: 2 }]) },
      permission: { findMany: jest.fn().mockResolvedValue([{ id: 1 }, { id: 2 }]) },
      department: { findMany: jest.fn().mockResolvedValue([{ id: 1 }, { id: 2 }]) },
      $transaction: jest.fn((arg) => {
        if (Array.isArray(arg)) return Promise.all(arg)
        return arg(mockPrisma)
      }),
    }
    mockCache = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn(),
      del: jest.fn(),
      delByPrefix: jest.fn(),
      getOrSet: jest.fn((_key, factory) => factory()),
    }
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CacheService, useValue: mockCache },
      ],
    }).compile()
    service = module.get<RolesService>(RolesService)
  })

  describe('getRoleList', () => {
    it('应返回分页角色列表', async () => {
      const result = await service.getRoleList({} as any)
      expect(mockPrisma.role.findMany).toHaveBeenCalled()
      expect(result.list).toHaveLength(1)
      expect(result.meta.total).toBe(1)
    })
    it('应支持角色名搜索', async () => {
      await service.getRoleList({ roleName: '管理' } as any)
      const call = mockPrisma.role.findMany.mock.calls[0][0]
      expect(call.where.name).toEqual({ contains: '管理', mode: 'insensitive' })
    })
  })

  describe('createRole', () => {
    it('应创建角色', async () => {
      mockPrisma.role.findFirst = jest.fn().mockResolvedValue(null) // 编码不存在
      await service.createRole({ roleName: '新角色', roleCode: 'new_role' } as any)
      expect(mockPrisma.role.create).toHaveBeenCalled()
    })
    it('角色编码已存在时应抛出异常', async () => {
      await expect(service.createRole({ roleName: 'X', roleCode: 'admin' } as any)).rejects.toThrow(ConflictException)
    })
    it('CUSTOM 数据范围应创建部门关联', async () => {
      mockPrisma.role.findFirst = jest.fn().mockResolvedValue(null)
      await service.createRole({ roleName: 'X', roleCode: 'custom', dataScope: 'CUSTOM', departmentIds: [1, 2] } as any)
      expect(mockPrisma.roleDepartment.createMany).toHaveBeenCalled()
    })
  })

  describe('updateRole', () => {
    it('应更新角色', async () => {
      await service.updateRole(1, { roleName: '更新名称' } as any)
      expect(mockPrisma.role.update).toHaveBeenCalled()
    })
    it('角色不存在时应抛出异常', async () => {
      mockPrisma.role.findFirst = jest.fn().mockResolvedValue(null)
      await expect(service.updateRole(999, {} as any)).rejects.toThrow()
    })
    it('应更新数据范围', async () => {
      await service.updateRole(1, { dataScope: 'DEPT' } as any)
      expect(mockPrisma.role.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ dataScope: 'DEPT' }) })
      )
    })
  })

  describe('deleteRole', () => {
    it('应删除角色', async () => {
      await service.deleteRole(1)
      expect(mockPrisma.role.update).toHaveBeenCalled()
    })
  })

  describe('saveRolePermission', () => {
    it('应保存角色权限', async () => {
      ;(service as any).getRolePermission = jest.fn().mockResolvedValue({ menus: [], permissions: [] })
      await service.saveRolePermission(1, { menuIds: [1, 2], permissionIds: [1, 2] } as any)
      expect(mockPrisma.roleMenu.deleteMany).toHaveBeenCalled()
      expect(mockPrisma.rolePermission.deleteMany).toHaveBeenCalled()
      expect(mockPrisma.roleMenu.createMany).toHaveBeenCalled()
      expect(mockPrisma.rolePermission.createMany).toHaveBeenCalled()
    })
  })
})
