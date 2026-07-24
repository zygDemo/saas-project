import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException, ConflictException } from '@nestjs/common'
import { DictService } from './dict.service'
import { PrismaService } from '../prisma/prisma.service'
import { CacheService } from '../redis/cache.service'

jest.mock('../../common/tenant/tenant-context', () => ({
  getCurrentTenantId: jest.fn(() => 1),
}))

jest.mock('../../common/utils/helpers', () => ({
  ...jest.requireActual('../../common/utils/helpers'),
  getRequiredTenantId: jest.fn(() => 1),
  formatDate: jest.fn((d) => d?.toISOString?.() || d),
}))

const mockDictType = {
  id: 1, tenantId: 1, name: '性别', code: 'gender', status: 'ACTIVE', remark: null,
  deletedAt: null, createdAt: new Date(), updatedAt: new Date(),
  _count: { items: 3 },
}

const mockDictData = {
  id: 1, tenantId: 1, typeId: 1, label: '男', value: 'MALE', sort: 1,
  status: 'ACTIVE', remark: null, deletedAt: null, createdAt: new Date(), updatedAt: new Date(),
  type: { code: 'gender' },
}

describe('DictService', () => {
  let service: DictService
  let mockPrisma: Record<string, unknown>
  let mockCache: Record<string, unknown>

  beforeEach(async () => {
    mockPrisma = {
      dictType: {
        findFirst: jest.fn().mockResolvedValue(mockDictType),
        findMany: jest.fn().mockResolvedValue([mockDictType]),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue(mockDictType),
        update: jest.fn().mockResolvedValue(mockDictType),
      },
      dictData: {
        findFirst: jest.fn().mockResolvedValue(mockDictData),
        findMany: jest.fn().mockResolvedValue([mockDictData]),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue(mockDictData),
        update: jest.fn().mockResolvedValue(mockDictData),
      },
      $transaction: jest.fn((arr) => Promise.all(arr)),
    }
    mockCache = {
      getOrSet: jest.fn((_key, fn) => fn()),
      delByPrefix: jest.fn(),
    }
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DictService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CacheService, useValue: mockCache },
      ],
    }).compile()
    service = module.get<DictService>(DictService)
  })

  describe('getTypeList', () => {
    it('应返回分页字典类型列表', async () => {
      const result = await service.getTypeList({} as any)
      expect(mockPrisma.dictType.findMany).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('应支持名称搜索', async () => {
      await service.getTypeList({ name: '性别' } as any)
      const call = mockPrisma.dictType.findMany.mock.calls[0][0]
      expect(call.where.name).toBeDefined()
    })
  })

  describe('createType', () => {
    it('应创建字典类型', async () => {
      mockPrisma.dictType.findFirst.mockResolvedValue(null)
      await service.createType({ name: '新类型', code: 'new_type' } as any)
      expect(mockPrisma.dictType.create).toHaveBeenCalled()
    })
    it('编码已存在时应抛出 ConflictException', async () => {
      await expect(service.createType({ name: 'X', code: 'gender' } as any)).rejects.toThrow(ConflictException)
    })
  })

  describe('updateType', () => {
    it('应更新字典类型', async () => {
      await service.updateType(1, { name: '更新名称' } as any)
      expect(mockPrisma.dictType.update).toHaveBeenCalled()
    })
    it('类型不存在时应抛出异常', async () => {
      mockPrisma.dictType.findFirst.mockResolvedValue(null)
      await expect(service.updateType(999, {} as any)).rejects.toThrow()
    })
  })

  describe('deleteType', () => {
    it('应软删除字典类型', async () => {
      await service.deleteType(1)
      expect(mockPrisma.dictType.update).toHaveBeenCalled()
    })
    it('类型不存在时应抛出异常', async () => {
      mockPrisma.dictType.findFirst.mockResolvedValue(null)
      await expect(service.deleteType(999)).rejects.toThrow()
    })
  })

  describe('getDataList', () => {
    it('应返回字典数据列表', async () => {
      const result = await service.getDataList({ typeId: 1 } as any)
      expect(mockPrisma.dictData.findMany).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
  })

  describe('createData', () => {
    it('应创建字典数据', async () => {
      mockPrisma.dictData.findFirst.mockResolvedValue(null)
      await service.createData({ typeId: 1, label: '女', value: 'FEMALE' } as any)
      expect(mockPrisma.dictData.create).toHaveBeenCalled()
    })
    it('同类型下值重复时应抛出异常', async () => {
      await expect(service.createData({ typeId: 1, label: 'X', value: 'MALE' } as any)).rejects.toThrow(ConflictException)
    })
  })

  describe('updateData', () => {
    it('应更新字典数据', async () => {
      await service.updateData(1, { label: '更新标签' } as any)
      expect(mockPrisma.dictData.update).toHaveBeenCalled()
    })
  })

  describe('deleteData', () => {
    it('应软删除字典数据', async () => {
      await service.deleteData(1)
      expect(mockPrisma.dictData.update).toHaveBeenCalled()
    })
  })

  describe('getOptions', () => {
    it('应返回按 code 分组的选项', async () => {
      const result = await service.getOptions('gender')
      expect(result).toBeDefined()
      expect(mockCache.getOrSet).toHaveBeenCalled()
    })
    it('空 code 应返回空对象', async () => {
      const result = await service.getOptions('')
      expect(result).toEqual({})
    })
  })
})
