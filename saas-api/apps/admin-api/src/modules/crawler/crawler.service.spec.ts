import { Test, TestingModule } from '@nestjs/testing'
import { CrawlerService } from './crawler.service'
import { PrismaService } from '../prisma/prisma.service'

jest.mock('../../common/tenant/tenant-context', () => ({
  getCurrentTenantId: jest.fn(() => 1),
  getRequiredTenantId: jest.fn(() => 1),
}))

describe('CrawlerService', () => {
  let service: CrawlerService
  let mockPrisma: Record<string, unknown>

  beforeEach(async () => {
    mockPrisma = { $transaction: jest.fn((arr: unknown[]) => Promise.all(arr)) }
    const module: TestingModule = await Test.createTestingModule({
      providers: [CrawlerService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile()
    service = module.get<CrawlerService>(CrawlerService)
  })

  describe('getProgress', () => {
    it('不存在任务时应返回 null', async () => {
      const result = service.getProgress('nonexistent')
      expect(result).toBeNull()
    })
  })

  describe('pauseTask', () => {
    it('不存在或非下载中任务应返回 false', async () => {
      expect(service.pauseTask('nonexistent')).toBe(false)
    })
  })

  describe('resumeTask', () => {
    it('不存在或非暂停任务应返回 false', async () => {
      expect(service.resumeTask('nonexistent')).toBe(false)
    })
  })
})
