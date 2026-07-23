import { Test, TestingModule } from '@nestjs/testing'
import { OcrService } from './ocr.service'
import { PrismaService } from '../prisma/prisma.service'
import { ConfigService } from '@nestjs/config'

jest.mock('../../common/tenant/tenant-context', () => ({
  getCurrentTenantId: jest.fn(() => 1),
  getRequiredTenantId: jest.fn(() => 1),
}))

describe('OcrService', () => {
  let service: OcrService
  let mockPrisma: Record<string, unknown>
  let mockConfig: Record<string, unknown>

  beforeEach(async () => {
    mockPrisma = { $transaction: jest.fn((arr: unknown[]) => Promise.all(arr)) }
    mockConfig = {
      get: jest.fn((key: string) => {
        if (key === 'OCR_URL') return 'https://ocr.example.com'
        if (key === 'OCR_API_KEY') return 'test-key'
        if (key === 'OCR_TIMEOUT_MS') return 60000
        return null
      }),
    }
    const module: TestingModule = await Test.createTestingModule({
      providers: [OcrService, { provide: PrismaService, useValue: mockPrisma }, { provide: ConfigService, useValue: mockConfig }],
    }).compile()
    service = module.get<OcrService>(OcrService)
  })

  describe('health', () => {
    it('应返回健康状态', async () => {
      const result = await service.health()
      expect(result).toBeDefined()
    })
  })

  describe('配置读取', () => {
    it('应从 ConfigService 读取 OCR_URL', async () => {
      expect(mockConfig.get).toHaveBeenCalledWith('OCR_URL')
    })

    it('应从 ConfigService 读取 OCR_API_KEY', async () => {
      expect(mockConfig.get).toHaveBeenCalledWith('OCR_API_KEY')
    })
  })
})
