import { Test, TestingModule } from '@nestjs/testing'
import { ConflictException, NotFoundException } from '@nestjs/common'
import { MsgTemplateService } from './msg-template.service'
import { PrismaService } from '../prisma/prisma.service'

jest.mock('../../common/tenant/tenant-context', () => ({
  getCurrentTenantId: jest.fn(() => 1),
  getRequiredTenantId: jest.fn(() => 1),
}))

const mockTemplate = {
  id: 1, tenantId: 1, name: '欢迎短信', code: 'WELCOME_SMS',
  channel: 'SMS', scene: 'GENERAL', title: '欢迎', content: '欢迎使用', variables: null,
  status: 'ACTIVE', remark: null, createdAt: new Date(), updatedAt: new Date(),
}

describe('MsgTemplateService', () => {
  let service: MsgTemplateService
  let mockPrisma: Record<string, unknown>

  beforeEach(async () => {
    mockPrisma = {
      messageTemplate: {
        findMany: jest.fn().mockResolvedValue([mockTemplate]),
        findFirst: jest.fn().mockResolvedValue(mockTemplate),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue(mockTemplate),
        update: jest.fn().mockResolvedValue(mockTemplate),
      },
      $transaction: jest.fn((arr: unknown[]) => Promise.all(arr)),
    }
    const module: TestingModule = await Test.createTestingModule({
      providers: [MsgTemplateService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile()
    service = module.get<MsgTemplateService>(MsgTemplateService)
  })

  describe('getList', () => {
    it('应返回分页消息模板列表', async () => {
      const result = await service.getList({} as any)
      expect(mockPrisma.messageTemplate.findMany).toHaveBeenCalled()
      expect(result.records).toBeDefined()
    })

    it('应支持 keyword 搜索', async () => {
      await service.getList({ keyword: '欢迎' } as any)
      const call = mockPrisma.messageTemplate.findMany.mock.calls[0][0]
      expect(call.where.OR).toBeDefined()
    })

    it('应支持 channel 过滤', async () => {
      await service.getList({ channel: 'SMS' } as any)
      const call = mockPrisma.messageTemplate.findMany.mock.calls[0][0]
      expect(call.where.channel).toBe('SMS')
    })
  })

  describe('getDetail', () => {
    it('应返回模板详情', async () => {
      const result = await service.getDetail(1)
      expect(mockPrisma.messageTemplate.findFirst).toHaveBeenCalled()
      expect(result).toBeDefined()
    })

    it('不存在时应抛出 NotFoundException', async () => {
      mockPrisma.messageTemplate.findFirst.mockResolvedValue(null)
      await expect(service.getDetail(999)).rejects.toThrow(NotFoundException)
    })
  })

  describe('create', () => {
    it('应创建模板', async () => {
      const result = await service.create({ name: '新模板', code: 'NEW_TPL', channel: 'SMS', content: '内容' } as any)
      expect(mockPrisma.messageTemplate.create).toHaveBeenCalled()
      expect(result).toBeDefined()
    })

    it('code 重复时应抛出 ConflictException', async () => {
      mockPrisma.messageTemplate.findFirst.mockResolvedValue({ id: 2, code: 'WELCOME_SMS' })
      await expect(service.create({ name: '重复', code: 'WELCOME_SMS', channel: 'SMS', content: 'x' } as any))
        .rejects.toThrow(ConflictException)
    })
  })

  describe('update', () => {
    it('应更新模板', async () => {
      const result = await service.update(1, { name: '更新模板' } as any)
      expect(mockPrisma.messageTemplate.update).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
  })

  describe('enable / disable', () => {
    it('应启用模板', async () => {
      await service.enable(1)
      expect(mockPrisma.messageTemplate.update).toHaveBeenCalled()
      const call = mockPrisma.messageTemplate.update.mock.calls[0][0]
      expect(call.data.status).toBe('ACTIVE')
    })

    it('应禁用模板', async () => {
      await service.disable(1)
      const call = mockPrisma.messageTemplate.update.mock.calls[0][0]
      expect(call.data.status).toBe('DISABLED')
    })
  })

  describe('remove', () => {
    it('应删除模板', async () => {
      mockPrisma.messageTemplate.findFirst.mockResolvedValue(mockTemplate)
      await service.remove(1)
      expect(mockPrisma.messageTemplate.update).toHaveBeenCalled()
    })
  })
})
