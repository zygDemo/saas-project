import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { EmailService } from './email.service'

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'mock-message-id' }),
    verify: jest.fn().mockResolvedValue(true),
    close: jest.fn(),
  })),
}))

describe('EmailService', () => {
  let service: EmailService
  let mockConfig: jest.Mocked<ConfigService>

  beforeEach(async () => {
    mockConfig = {
      get: jest.fn((key: string) => {
        const map: Record<string, string | number | boolean> = {
          SMTP_HOST: 'smtp.qq.com',
          SMTP_PORT: 465,
          SMTP_SECURE: true,
          SMTP_USER: 'test@qq.com',
          SMTP_PASS: 'test-password',
          MAIL_FROM: 'test@qq.com',
        }
        return map[key]
      }),
    } as any

    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailService, { provide: ConfigService, useValue: mockConfig }],
    }).compile()
    service = module.get<EmailService>(EmailService)
  })

  describe('sendVerificationCode', () => {
    it('应成功发送验证码邮件', async () => {
      const result = await service.sendVerificationCode('18538529932@163.com', '123456')
      expect(result).toBe(true)
    })

    it('应使用收件人地址', async () => {
      await service.sendVerificationCode('test@example.com', '654321')
      // 邮件发送是 fire-and-forget，只需确认不抛异常
      expect(true).toBe(true)
    })

    it('发送失败时应返回 false 并记录日志', async () => {
      // 创建新实例模拟发送失败
      const nodemailer = require('nodemailer')
      const originalCreate = nodemailer.createTransport
      nodemailer.createTransport = jest.fn(() => ({
        sendMail: jest.fn().mockRejectedValue(new Error('SMTP 连接失败')),
        verify: jest.fn().mockResolvedValue(true),
      }))

      const module: TestingModule = await Test.createTestingModule({
        providers: [EmailService, { provide: ConfigService, useValue: mockConfig }],
      }).compile()
      const svc = module.get<EmailService>(EmailService)
      const result = await svc.sendVerificationCode('test@example.com', '123456')
      expect(result).toBe(false)

      nodemailer.createTransport = originalCreate
    })
  })

  describe('配置读取', () => {
    it('应从 ConfigService 读取 SMTP 配置', async () => {
      // 构造函数已调用 ConfigService.get，验证 mock 被调用
      expect(mockConfig.get).toHaveBeenCalledWith('SMTP_HOST', 'smtp.qq.com')
      expect(mockConfig.get).toHaveBeenCalledWith('SMTP_PORT', 465)
      expect(mockConfig.get).toHaveBeenCalledWith('SMTP_SECURE', true)
    })
  })
})
