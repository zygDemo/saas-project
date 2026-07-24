import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException, BadRequestException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { FileService } from './file.service'
import { PrismaService } from '../prisma/prisma.service'
import { DataScopeService } from '../../common/auth/data-scope.service'

jest.mock('fs/promises', () => ({
  mkdir: jest.fn().mockResolvedValue(undefined),
  writeFile: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('../../common/tenant/tenant-context', () => ({
  getCurrentTenantId: jest.fn(() => 1),
  getCurrentUserRoles: jest.fn(() => [1]),
}))

const mockFileAsset = {
  id: 1,
  tenantId: 1,
  orgId: 1,
  businessType: 'APPLICATION',
  businessId: 1,
  categoryCode: 'CONTRACT',
  categoryName: '合同文件',
  fileName: 'test.jpg',
  originalName: 'test.jpg',
  fileUrl: '/uploads/test.jpg',
  url: '/uploads/test.jpg',
  fileSize: 1024,
  mimeType: 'image/jpeg',
  objectKey: 'files/test.jpg',
  uploaderId: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('FileService', () => {
  let service: FileService
  let mockPrisma: any

  beforeEach(async () => {
    jest.clearAllMocks()
    mockPrisma = {
      fileAsset: {
        findMany: jest.fn().mockResolvedValue([mockFileAsset]),
        findFirst: jest.fn().mockResolvedValue(mockFileAsset),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue(mockFileAsset),
        update: jest.fn().mockResolvedValue(mockFileAsset),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        delete: jest.fn().mockResolvedValue(mockFileAsset),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      applicationFile: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue(null),
        count: jest.fn().mockResolvedValue(0),
      },
      role: {
        findMany: jest.fn().mockResolvedValue([{ dataScope: 'ALL' }]),
      },
      organization: {
        findFirst: jest.fn().mockResolvedValue({ id: 1 }),
      },
      $transaction: jest.fn((arr: any) => Promise.all(arr)),
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
      const result = await service.getList({ page: 1, pageSize: 10 } as any)
      expect(mockPrisma.fileAsset.findMany).toHaveBeenCalled()
      expect(result.list).toEqual([expect.objectContaining({ id: 1 })])
      expect(result.meta.total).toBe(1)
    })
    it('应支持文件名搜索', async () => {
      await service.getList({ fileName: 'test', page: 1, pageSize: 10 } as any)
      const call = mockPrisma.fileAsset.findMany.mock.calls[0][0]
      expect(call.where.fileName).toBeDefined()
    })
  })

  describe('getDetail', () => {
    it('应返回文件详情', async () => {
      const result = await service.getDetail(1)
      expect(result).toMatchObject({ id: 1, fileName: 'test.jpg' })
      expect(result.url).toContain('/saas/api/uploads/')
    })
    it('文件不存在应抛异常', async () => {
      mockPrisma.fileAsset.findFirst = jest.fn().mockResolvedValue(null)
      await expect(service.getDetail(999)).rejects.toThrow(NotFoundException)
    })
  })

  describe('create', () => {
    it('应创建文件记录', async () => {
      await service.create(
        { fileName: 'new.jpg', fileUrl: '/uploads/new.jpg' } as any,
        { userId: 1 } as any,
      )
      expect(mockPrisma.fileAsset.create).toHaveBeenCalled()
    })
  })

  describe('update', () => {
    it('应更新文件记录', async () => {
      await service.update(1, { categoryCode: 'IMAGE' } as any)
      expect(mockPrisma.fileAsset.update).toHaveBeenCalled()
    })
  })

  describe('remove', () => {
    it('应软删除文件记录', async () => {
      await service.remove(1)
      const call = mockPrisma.fileAsset.update.mock.calls[0][0]
      expect(call.data.deletedAt).toBeInstanceOf(Date)
    })
  })

  describe('batchRemove', () => {
    it('应批量软删除文件', async () => {
      await service.batchRemove([1, 2, 3])
      expect(mockPrisma.fileAsset.updateMany).toHaveBeenCalled()
    })
    it('空数组应抛异常', async () => {
      await expect(service.batchRemove([])).rejects.toThrow(BadRequestException)
    })
  })

  describe('uploadImage', () => {
    it('应返回上传URL', async () => {
      const mockFile = {
        originalname: 'test.jpg',
        size: 1024,
        mimetype: 'image/jpeg',
        buffer: Buffer.from(''),
      }
      const result = await service.uploadImage(mockFile as any, { userId: 1 } as any)
      expect(result.url).toContain('/saas/api/uploads/images/')
      expect(result.objectKey).toBeDefined()
    })
    it('无文件应抛异常', async () => {
      await expect(service.uploadImage(null as any, {} as any)).rejects.toThrow()
    })
  })

  describe('业务文件', () => {
    it('getBusinessFiles 应返回业务文件列表', async () => {
      const result = await service.getBusinessFiles({ businessType: 'APPLICATION', businessId: 1 } as any)
      expect(mockPrisma.fileAsset.findMany).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('缺少参数应抛异常', async () => {
      await expect(service.getBusinessFiles({} as any)).rejects.toThrow(BadRequestException)
    })
    it('getBusinessCategories 应返回分类', async () => {
      mockPrisma.fileAsset.findMany = jest.fn().mockResolvedValue([{ categoryCode: 'IMAGE', categoryName: '图片' }])
      const result = await service.getBusinessCategories({ businessType: 'APPLICATION', businessId: 1 } as any)
      expect(result).toBeInstanceOf(Array)
    })
  })
})
