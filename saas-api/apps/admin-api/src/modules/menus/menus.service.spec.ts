import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException, ConflictException } from '@nestjs/common'
import { MenusService } from './menus.service'
import { PrismaService } from '../prisma/prisma.service'
import { CacheService } from '../redis/cache.service'

jest.mock('../../common/tenant/tenant-context', () => ({
  getCurrentTenantId: jest.fn(() => 1),
  getRequiredTenantId: jest.fn(() => 1),
}))

jest.mock('../../common/utils/helpers', () => ({
  ...jest.requireActual('../../common/utils/helpers'),
  getRequiredTenantId: jest.fn(() => 1),
  formatDate: jest.fn((d: Date | string | null | undefined) => d?.toISOString?.() || d),
}))

const mockMenu = {
  id: 1, tenantId: 1, parentId: null, name: '首页', path: '/dashboard',
  component: 'dashboard/index', sort: 1, status: 'ACTIVE', createdAt: new Date(), updatedAt: new Date(),
  permissions: [], roles: [],
}

  const mockPermission = {
    id: 1, menuId: 1, title: '查询', authMark: 'query', sort: 1,
    createdAt: new Date(), updatedAt: new Date(), roles: [],
  }

describe('MenusService', () => {
  let service: MenusService
  let mockPrisma: Record<string, unknown>
  let mockCache: Record<string, unknown>

  beforeEach(async () => {
    mockPrisma = {
      menu: {
        findMany: jest.fn().mockResolvedValue([mockMenu]),
        findFirst: jest.fn().mockResolvedValue(mockMenu),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue(mockMenu),
        update: jest.fn().mockResolvedValue(mockMenu),
      },
      permission: {
        findMany: jest.fn().mockResolvedValue([mockPermission]),
        findFirst: jest.fn().mockResolvedValue(mockPermission),
        create: jest.fn().mockResolvedValue(mockPermission),
        update: jest.fn().mockResolvedValue(mockPermission),
      },
      role: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue(null),
      },
      roleMenu: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      rolePermission: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      $transaction: jest.fn((arr: unknown[]) => Promise.all(arr)),
    }
    mockCache = {
      getOrSet: jest.fn((_key: string, fn: () => Promise<unknown>) => fn()),
      delByPrefix: jest.fn(),
    }
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MenusService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CacheService, useValue: mockCache },
      ],
    }).compile()
    service = module.get<MenusService>(MenusService)
  })

  describe('getMenuTree', () => {
    it('应返回菜单树', async () => {
      const result = await service.getMenuTree()
      expect(mockPrisma.menu.findMany).toHaveBeenCalled()
      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
    })

    it('应根据角色代码过滤菜单', async () => {
      await service.getMenuTree(['admin'])
      const call = mockPrisma.menu.findMany.mock.calls[0][0]
      expect(call.where.roles).toBeDefined()
    })

    it('无角色代码时应返回全部菜单', async () => {
      await service.getMenuTree()
      const call = mockPrisma.menu.findMany.mock.calls[0][0]
      expect(call.where).toBeUndefined()
    })

    it('应使用缓存', async () => {
      await service.getMenuTree(['admin'])
      expect(mockCache.getOrSet).toHaveBeenCalled()
    })
  })

  describe('createMenu', () => {
    it('应创建菜单', async () => {
      mockPrisma.menu.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(mockMenu)
      const result = await service.createMenu({ name: '新菜单', path: '/test', component: 'test' } as any)
      expect(mockPrisma.menu.create).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
  })

  describe('updateMenu', () => {
    it('应更新菜单', async () => {
      const result = await service.updateMenu(1, { name: '更新菜单' } as any)
      expect(mockPrisma.menu.update).toHaveBeenCalled()
      expect(result).toBeDefined()
    })

    it('菜单不存在时应抛出异常', async () => {
      mockPrisma.menu.findFirst.mockResolvedValue(null)
      await expect(service.updateMenu(999, { name: 'X' } as any)).rejects.toThrow(NotFoundException)
    })
  })

  describe('deleteMenu', () => {
    it('应删除菜单', async () => {
      mockPrisma.menu.findFirst.mockResolvedValue({ id: 1, parentId: null })
      await service.deleteMenu(1)
      expect(mockPrisma.menu.update).toHaveBeenCalled()
    })

  })

  describe('createPermission', () => {
    it('应创建权限', async () => {
      mockPrisma.permission.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(mockPermission)
      const result = await service.createPermission(1, { title: '新增', authMark: 'create' } as any)
      expect(mockPrisma.permission.create).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
  })

  describe('updatePermission', () => {
    it('应更新权限', async () => {
      const result = await service.updatePermission(1, { name: '更新' } as any)
      expect(mockPrisma.permission.update).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
  })

  describe('deletePermission', () => {
    it('应删除权限', async () => {
      await service.deletePermission(1)
      expect(mockPrisma.permission.update).toHaveBeenCalled()
    })
  })
})
