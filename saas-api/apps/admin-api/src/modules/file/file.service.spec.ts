import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException, BadRequestException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { FileService } from './file.service'
import { PrismaService } from '../prisma/prisma.service'
import { DataScopeService } from '../../common/auth/data-scope.service'

jest.mock('../../common/tenant/tenant-context', () => ({
  getCurrentTenantId: jest.fn(() => 1),
  getCurrentUserRoles: jest.fn(() => [1]),
}))

const mockFileAsset = {
  id: 1, tenantId: 1, fileName: 'test.jpg', originalName: 'test.jpg',
  fileUrl: '/uploads/test.jpg', fileSize: 1024, mimeType: 'image/jpeg',
  category: 'image', bizType: 'avatar', bizId: null,
  uploaderId: 1, createdAt: new Date(), updatedAt: new Date(),
}

describe('FileService', () => {
  let service: FileService
  let mockPrisma: any

  beforeEach(async () => {
    mockPrisma = {
      fileAsset: {
        findMany: jest.fn().mockResolvedValue([mockFileAsset]),
        findFirst: jest.fn().mockResolvedValue(mockFileAsset),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue(mockFileAsset),
        update: jest.fn().mockResolvedValue(mockFileAsset),
        delete: jest.fn().mockResolvedValue(mockFileAsset),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      role: { findMany: jest.fn().mockResolvedValue([{ dataScope: 'ALL' }]) },
      $transaction: jest.fn((arr) => Promise.all(arr)),
    }
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: { get: jest.fn((k, d) => d) } },
        { provide: DataScopeService, useValue: { getVisibleUserIds: jest.fn().mockResolvedValue([1]) } },
      ],
    }).compile()
    service = module.get<FileService>(FileService)
  })

  describe('getList', () => {
    it('应返回分页文件列表', async () => {
      const result = await service.getList({} as any)
      expect(mockPrisma.fileAsset.findMany).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('应支持文件名搜索', async () => {
      await service.getList({ keyword: 'test' } as any)
      const call = mockPrisma.fileAsset.findMany.mock.calls[0][0]
      expect(call.where.OR).toBeDefined()
    })
  })

  describe('getDetail', () => {
    it('应返回文件详情', async () => {
      const result = await service.getDetail(1)
      expect(result).toEqual(mockFileAsset)
    })
    it('文件不存在应抛异常', async () => {
      mockPrisma.fileAsset.findFirst.mockResolvedValue(null)
      await expect(service.getDetail(999)).rejects.toThrow(NotFoundException)
    })
  })

  describe('create', () => {
    it('应创建文件记录', async () => {
      await service.create({ fileName: 'new.jpg', fileUrl: '/uploads/new.jpg' } as any)
      expect(mockPrisma.fileAsset.create).toHaveBeenCalled()
    })
  })

  describe('update', () => {
    it('应更新文件记录', async () => {
      await service.update(1, { category: 'document' } as any)
      expect(mockPrisma.fileAsset.update).toHaveBeenCalled()
    })
  })

  describe('remove', () => {
    it('应删除文件记录', async () => {
      await service.remove(1)
      expect(mockPrisma.fileAsset.delete).toHaveBeenCalled()
    })
    it('文件不存在应抛异常', async () => {
      mockPrisma.fileAsset.findFirst.mockResolvedValue(null)
      await expect(service.remove(999)).rejects.toThrow()
    })
  })

  describe('batchRemove', () => {
    it('应批量删除文件', async () => {
      await service.batchRemove([1, 2, 3])
      expect(mockPrisma.fileAsset.deleteMany).toHaveBeenCalled()
    })
    it('空数组应抛异常', async () => {
      await expect(service.batchRemove([])).rejects.toThrow(BadRequestException)
    })

  describe('上传', () => {
    it('uploadImage 应创建文件记录', async () => {
      const mockFile = { originalname: 'test.jpg', size: 1024, mimetype: 'image/jpeg', filename: 'abc123.jpg', path: '/uploads/abc123.jpg' }
      const result = await service.uploadImage(mockFile as any, { bizType: 'avatar' } as any)
      expect(mockPrisma.fileAsset.create).toHaveBeenCalled()
    })
    it('uploadImage 无文件应抛异常', async () => {
      await expect(service.uploadImage(null as any, {} as any)).rejects.toThrow()
    })
  })

  describe('业务文件', () => {
    it('getBusinessFiles 应返回业务文件列表', async () => {
      mockPrisma.fileAsset.findMany.mockResolvedValue([mockFileAsset])
      const result = await service.getBusinessFiles({ bizType: 'avatar', bizId: '1' } as any)
      expect(mockPrisma.fileAsset.findMany).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('getBusinessCategories 应返回业务文件分类', async () => {
      mockPrisma.fileAsset.findMany.mockResolvedValue([{ category: 'image' }])
      const result = await service.getBusinessCategories({ bizType: 'avatar' } as any)
      expect(result).toBeDefined()
    })
  })
})
