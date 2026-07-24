import { Test, TestingModule } from '@nestjs/testing'
import { ConflictException, NotFoundException } from '@nestjs/common'
import { SystemParamService } from './system-param.service'
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

const mockParam = {
  id: 1, tenantId: 1, group: 'system', name: '系统名称', key: 'system.name',
  value: '予艺助手', type: 'STRING', status: 'ACTIVE', remark: null,
  createdAt: new Date(), updatedAt: new Date(),
}

describe('SystemParamService', () => {
  let service: SystemParamService
  let mockPrisma: Record<string, unknown>
  let mockCache: Record<string, unknown>

  beforeEach(async () => {
    mockPrisma = {
      systemParam: {
        findMany: jest.fn().mockResolvedValue([mockParam]),
        findFirst: jest.fn(({ where }: any) => {
          if (where?.id === 1 || where?.key === 'system.name') return Promise.resolve(mockParam)
          return Promise.resolve(null)
        }),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue(mockParam),
        update: jest.fn().mockResolvedValue(mockParam),
      },
      $transaction: jest.fn((arg: any) => Array.isArray(arg) ? Promise.all(arg) : arg(mockPrisma)),
    }
    mockCache = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn(),
      getOrSet: jest.fn((_key: string, fn: () => Promise<unknown>) => fn()),
      delByPrefix: jest.fn(),
    }
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SystemParamService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CacheService, useValue: mockCache },
      ],
    }).compile()
    service = module.get<SystemParamService>(SystemParamService)
  })

  describe('getList', () => {
    it('应返回分页系统参数列表', async () => {
      const result = await service.getList({} as any)
      expect(mockPrisma.systemParam.findMany).toHaveBeenCalled()
      expect(result.list).toBeDefined()
    })

    it('应支持 group 过滤', async () => {
      await service.getList({ group: 'system' } as any)
      const call = mockPrisma.systemParam.findMany.mock.calls[0][0]
      expect(call.where.group).toBe('system')
    })

    it('应支持 name 模糊搜索', async () => {
      await service.getList({ name: '系统' } as any)
      const call = mockPrisma.systemParam.findMany.mock.calls[0][0]
      expect(call.where.name.contains).toBeDefined()
    })
  })

  describe('create', () => {
    it('应创建系统参数', async () => {
      const result = await service.create({ group: 'system', name: '新参数', key: 'new.key', value: 'value' } as any)
      expect(mockPrisma.systemParam.create).toHaveBeenCalled()
      expect(result).toBeDefined()
    })

    it('key 重复时应抛出 ConflictException', async () => {
      mockPrisma.systemParam.findFirst.mockResolvedValue({ id: 2, key: 'system.name' })
      await expect(service.create({ group: 'system', name: '重复', key: 'system.name', value: 'x' } as any))
        .rejects.toThrow(ConflictException)
    })

    it('创建后应清除缓存', async () => {
      await service.create({ group: 'system', name: '新参数', key: 'new.key', value: 'value' } as any)
      expect(mockCache.delByPrefix).toHaveBeenCalledWith('sysparam:', 1)
    })
  })

  describe('update', () => {
    it('应更新系统参数', async () => {
      const result = await service.update(1, { value: 'new value' } as any)
      expect(mockPrisma.systemParam.update).toHaveBeenCalled()
      expect(result).toBeDefined()
    })

    it('参数不存在时应抛出 NotFoundException', async () => {
      mockPrisma.systemParam.findFirst.mockResolvedValue(null)
      await expect(service.update(999, { value: 'x' } as any)).rejects.toThrow(NotFoundException)
    })
  })

  describe('delete', () => {
    it('应删除系统参数', async () => {
      mockPrisma.systemParam.findFirst.mockResolvedValue(mockParam)
      await service.delete(1)
      expect(mockPrisma.systemParam.update).toHaveBeenCalled()
    })
  })

  describe('getValueByKey', () => {
    it('应返回参数值', async () => {
      const result = await service.getValueByKey('system.name')
      expect(result).toBe('予艺助手')
    })

    it('key 不存在时应返回 null', async () => {
      mockPrisma.systemParam.findFirst.mockResolvedValue(null)
      const result = await service.getValueByKey('nonexistent')
      expect(result).toBeNull()
    })
  })
})
