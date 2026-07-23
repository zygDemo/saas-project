import { Test, TestingModule } from '@nestjs/testing'
import { NotificationService } from './notification.service'
import { NotificationGateway } from './notification.gateway'

describe('NotificationService', () => {
  let service: NotificationService
  let mockGateway: Record<string, unknown>

  beforeEach(async () => {
    mockGateway = {
      emitToUser: jest.fn(),
      emitToTenant: jest.fn(),
      emitToUsers: jest.fn(),
      emitBroadcast: jest.fn(),
      getOnlineStats: jest.fn().mockReturnValue({ totalConnections: 5, tenantCount: 2, userCount: 4 }),
    }
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: NotificationGateway, useValue: mockGateway },
      ],
    }).compile()
    service = module.get<NotificationService>(NotificationService)
  })

  describe('pushToUser', () => {
    it('应推送通知给指定用户', () => {
      service.pushToUser(1, { type: 'approval', title: '审批通知', content: '您的进件已通过' })
      expect(mockGateway.emitToUser).toHaveBeenCalledWith(1, 'notification', expect.objectContaining({
        type: 'approval',
        title: '审批通知',
      }))
    })
    it('网关异常时不应抛出', () => {
      mockGateway.emitToUser.mockImplementation(() => { throw new Error('连接断开') })
      expect(() => service.pushToUser(1, { type: 'system', title: 'X', content: 'Y' })).not.toThrow()
    })
  })

  describe('pushToTenant', () => {
    it('应推送通知给租户', () => {
      service.pushToTenant(1, { type: 'announcement', title: '公告', content: '内容' })
      expect(mockGateway.emitToTenant).toHaveBeenCalledWith(1, 'notification', expect.objectContaining({
        type: 'announcement',
      }))
    })
    it('网关异常时不应抛出', () => {
      mockGateway.emitToTenant.mockImplementation(() => { throw new Error('连接断开') })
      expect(() => service.pushToTenant(1, { type: 'system', title: 'X', content: 'Y' })).not.toThrow()
    })
  })

  describe('pushAnnouncement', () => {
    it('应推送公告给租户', () => {
      service.pushAnnouncement(1, { id: 1, title: '公告', content: '内容' })
      expect(mockGateway.emitToTenant).toHaveBeenCalledWith(1, 'announcement', expect.objectContaining({
        type: 'announcement',
        title: '公告',
      }))
    })
    it('网关异常时不应抛出', () => {
      mockGateway.emitToTenant.mockImplementation(() => { throw new Error('连接断开') })
      expect(() => service.pushAnnouncement(1, { id: 1, title: 'X', content: 'Y' })).not.toThrow()
    })
  })

  describe('pushApprovalStatus', () => {
    it('应推送审批状态给用户', () => {
      service.pushApprovalStatus(1, { applicationId: 100, status: '审批通过', title: '审批结果' })
      expect(mockGateway.emitToUser).toHaveBeenCalledWith(1, 'notification', expect.objectContaining({
        type: 'approval',
        content: expect.stringContaining('100'),
      }))
    })
  })

  describe('pushSupplement', () => {
    it('应推送补件通知', () => {
      service.pushSupplement(1, { applicationId: 100, title: '补件通知' })
      expect(mockGateway.emitToUser).toHaveBeenCalled()
    })
  })

  describe('pushSigning', () => {
    it('应推送签约通知', () => {
      service.pushSigning(1, { applicationId: 100, title: '签约通知' })
      expect(mockGateway.emitToUser).toHaveBeenCalled()
    })
  })

  describe('pushLoan', () => {
    it('应推送放款通知', () => {
      service.pushLoan(1, { applicationId: 100, amount: 150000 })
      expect(mockGateway.emitToUser).toHaveBeenCalled()
    })
  })

  describe('getOnlineStats', () => {
    it('应返回在线统计', () => {
      const result = service.getOnlineStats()
      expect(result.totalConnections).toBe(5)
    })
  })
})
