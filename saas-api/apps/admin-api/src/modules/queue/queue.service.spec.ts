import { Test, TestingModule } from '@nestjs/testing'
import { QueueService } from './queue.service'

describe('QueueService', () => {
  let service: QueueService
  let mockQueue: Record<string, unknown>

  beforeEach(async () => {
    mockQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-123', name: 'health-check' }),
    }
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueService,
        { provide: 'BullQueue_maintenance', useValue: mockQueue },
      ],
    }).compile()
    service = module.get<QueueService>(QueueService)
  })

  describe('enqueueHealthCheck', () => {
    it('应添加健康检查任务到队列', async () => {
      const result = await service.enqueueHealthCheck()
      expect(mockQueue.add).toHaveBeenCalledWith(
        'health-check',
        expect.objectContaining({ requestedAt: expect.any(String) }),
        expect.objectContaining({ removeOnComplete: 50, removeOnFail: 100 })
      )
      expect(result.id).toBe('job-123')
      expect(result.name).toBe('health-check')
    })

    it('应返回正确的任务信息', async () => {
      mockQueue.add.mockResolvedValue({ id: 456, name: 'health-check' })
      const result = await service.enqueueHealthCheck()
      expect(result.id).toBe('456')
    })
  })
})
