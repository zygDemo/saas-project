import { Test, TestingModule } from '@nestjs/testing'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { BadRequestException, UnauthorizedException } from '@nestjs/common'
import * as bcrypt from 'bcryptjs'
import { AuthService } from './auth.service'
import { PrismaService } from '../prisma/prisma.service'
import { CacheService } from '../redis/cache.service'
import { EmailService } from '../email/email.service'
import { getCurrentTenantId } from '../../common/tenant/tenant-context'

jest.mock('../../common/tenant/tenant-context', () => ({
  getCurrentTenantId: jest.fn(() => 1),
}))

const createMockUser = (overrides: Record<string, unknown> = {}) => ({
  id: '1',
  userName: 'testuser',
  email: 'a@b.com',
  passwordHash: bcrypt.hashSync('password', 10),
  status: 'ONLINE',
  tenantId: 1,
  roles: [{ role: { code: 'admin' } }],
  ...overrides,
})

describe('AuthService', () => {
  let service: AuthService
  let mockPrisma: Record<string, unknown>
  let mockJwtService: jest.Mocked<JwtService>
  let mockConfigService: jest.Mocked<ConfigService>
  let mockCache: jest.Mocked<CacheService>
  let mockEmail: jest.Mocked<EmailService>

  beforeEach(async () => {
    jest.clearAllMocks()

    mockPrisma = {
      user: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
    }

    mockJwtService = {
      signAsync: jest.fn().mockResolvedValue('signed-token'),
    } as unknown as jest.Mocked<JwtService>

    mockConfigService = {
      get: jest.fn((key: string, def?: string) => {
        if (key === 'JWT_REFRESH_SECRET') return 'test-refresh-secret'
        if (key === 'JWT_REFRESH_EXPIRES_IN') return '7d'
        return def
      }),
    } as unknown as jest.Mocked<ConfigService>

    mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    } as unknown as jest.Mocked<CacheService>

    mockEmail = {
      sendVerificationCode: jest.fn(),
    } as unknown as jest.Mocked<EmailService>

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: CacheService, useValue: mockCache },
        { provide: EmailService, useValue: mockEmail },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('login', () => {
    it('should throw UnauthorizedException when user not found', async () => {
      mockPrisma.user.findFirst = jest.fn().mockResolvedValue(null)
      await expect(
        service.login({ userName: 'nonexistent', password: 'password' }),
      ).rejects.toThrow(UnauthorizedException)
    })

    it('should throw UnauthorizedException when password does not match', async () => {
      mockPrisma.user.findFirst = jest
        .fn()
        .mockResolvedValue(createMockUser({ passwordHash: bcrypt.hashSync('password', 10) }))
      await expect(
        service.login({ userName: 'testuser', password: 'wrongpassword' }),
      ).rejects.toThrow(UnauthorizedException)
    })

    it('should return token when credentials are valid', async () => {
      mockPrisma.user.findFirst = jest.fn().mockResolvedValue(createMockUser())
      const result = await service.login({ userName: 'testuser', password: 'password' })
      expect(result.token).toBe('Bearer signed-token')
      expect(result.refreshToken).toBe('Bearer signed-token')
    })
  })

  describe('sendEmailCode', () => {
    it('should send code and return message', async () => {
      mockCache.get = jest.fn().mockResolvedValue(null)
      mockCache.set = jest.fn().mockResolvedValue(undefined)
      mockEmail.sendVerificationCode = jest.fn().mockResolvedValue(true)

      const result = await service.sendEmailCode('a@b.com', 'login')

      expect(result.message).toBe('验证码已发送')
      expect(mockEmail.sendVerificationCode).toHaveBeenCalledWith(
        'a@b.com',
        expect.stringMatching(/^\d{6}$/),
      )
      expect(mockCache.set).toHaveBeenCalledTimes(2)
    })

    it('should throw when rate limited', async () => {
      mockCache.get = jest.fn().mockResolvedValue('1')
      await expect(service.sendEmailCode('a@b.com', 'login')).rejects.toThrow(
        BadRequestException,
      )
    })

    it('should throw when email send fails', async () => {
      mockCache.get = jest.fn().mockResolvedValue(null)
      mockEmail.sendVerificationCode = jest.fn().mockResolvedValue(false)
      await expect(service.sendEmailCode('a@b.com', 'login')).rejects.toThrow(
        BadRequestException,
      )
    })
  })

  describe('emailLogin', () => {
    const codeKey = 'email_code:1:a@b.com:login'

    it('should login existing user and return tokens', async () => {
      mockCache.get = jest.fn().mockResolvedValue('123456')
      mockCache.del = jest.fn().mockResolvedValue(undefined)
      mockPrisma.user.findFirst = jest.fn().mockResolvedValue(createMockUser())

      const result = await service.emailLogin('a@b.com', '123456')

      expect(result.token).toBe('Bearer signed-token')
      expect(result.refreshToken).toBe('Bearer signed-token')
      expect(mockCache.del).toHaveBeenCalledWith(codeKey)
    })

    it('should auto-register new user and return tokens', async () => {
      mockCache.get = jest.fn().mockResolvedValue('123456')
      mockCache.del = jest.fn().mockResolvedValue(undefined)
      mockPrisma.user.findFirst = jest.fn().mockResolvedValue(null)
      mockPrisma.user.create = jest.fn().mockResolvedValue(createMockUser())

      const result = await service.emailLogin('new@b.com', '123456')

      expect(result.token).toBe('Bearer signed-token')
      expect(mockPrisma.user.create).toHaveBeenCalledTimes(1)
      const createArg = mockPrisma.user.create.mock.calls[0][0]
      expect(createArg.data.passwordHash).toBeTruthy()
    })

    it('should throw when code is wrong', async () => {
      mockCache.get = jest.fn().mockResolvedValue('000000')
      await expect(service.emailLogin('a@b.com', '123456')).rejects.toThrow(
        BadRequestException,
      )
    })
  })
})
