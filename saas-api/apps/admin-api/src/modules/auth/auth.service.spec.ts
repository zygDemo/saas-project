import { Test, TestingModule } from '@nestjs/testing'
import { AuthService } from './auth.service'
import { PrismaService } from '../prisma/prisma.service'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { BadRequestException } from '@nestjs/common'
import * as bcrypt from 'bcryptjs'

jest.mock('../../common/tenant/tenant-context', () => ({
  getCurrentTenantId: jest.fn(() => 1),
}))

import { getCurrentTenantId } from '../../common/tenant/tenant-context'

describe('AuthService', () => {
  let service: AuthService
  let mockPrisma: jest.Mocked<PrismaService>
  let mockJwtService: jest.Mocked<JwtService>
  let mockConfigService: jest.Mocked<ConfigService>

  const createMockUser = (overrides = {}) => ({
    id: 1,
    tenantId: 1,
    userName: 'admin',
    passwordHash: bcrypt.hashSync('123456', 10),
    roles: [{ role: { code: 'admin' } }],
    ...overrides,
  })

  beforeEach(async () => {
    mockPrisma = {
      user: {
        findFirst: jest.fn(),
      },
    } as unknown as jest.Mocked<PrismaService>

    mockJwtService = {
      signAsync: jest.fn().mockResolvedValue('signed-token'),
    } as unknown as jest.Mocked<JwtService>

    mockConfigService = {
      get: jest
        .fn()
        .mockReturnValueOnce('test-secret')
        .mockReturnValueOnce('7d'),
    } as unknown as jest.Mocked<ConfigService>

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('login', () => {
    it('应该登录成功并返回 token', async () => {
      ;(getCurrentTenantId as jest.Mock).mockReturnValue(1)
      mockPrisma.user.findFirst!.mockResolvedValue(createMockUser())

      const result = await service.login({ userName: 'admin', password: '123456' })

      expect(result.token).toBe('Bearer signed-token')
      expect(result.refreshToken).toBe('Bearer signed-token')
      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          tenantId: 1,
          userName: { equals: 'admin', mode: 'insensitive' },
        },
        include: { roles: { include: { role: true } } },
      })
    })

    it('缺少 tenantId 时应该抛出 BadRequestException', async () => {
      ;(getCurrentTenantId as jest.Mock).mockReturnValue(null)

      await expect(service.login({ userName: 'admin', password: '123456' })).rejects.toThrow(
        BadRequestException,
      )
    })

    it('用户名不存在时应该抛出 UnauthorizedException', async () => {
      ;(getCurrentTenantId as jest.Mock).mockReturnValue(1)
      mockPrisma.user.findFirst!.mockResolvedValue(null)

      await expect(service.login({ userName: 'nobody', password: '123456' })).rejects.toThrow(
        '用户名或密码错误',
      )
    })

    it('密码错误时应该抛出 UnauthorizedException', async () => {
      ;(getCurrentTenantId as jest.Mock).mockReturnValue(1)
      mockPrisma.user.findFirst!.mockResolvedValue(createMockUser())

      await expect(service.login({ userName: 'admin', password: 'wrong' })).rejects.toThrow(
        '用户名或密码错误',
      )
    })

    it('登录成功应该使用 config 中的 JWT 配置', async () => {
      ;(getCurrentTenantId as jest.Mock).mockReturnValue(1)
      mockPrisma.user.findFirst!.mockResolvedValue(createMockUser())
      mockConfigService.get
        .mockReturnValueOnce('custom-access-secret')
        .mockReturnValueOnce('30d')

      const result = await service.login({ userName: 'admin', password: '123456' })

      expect(result.token).toBe('Bearer signed-token')
      expect(mockConfigService.get).toHaveBeenCalledWith('JWT_REFRESH_SECRET', 'change-me-refresh-secret')
      expect(mockConfigService.get).toHaveBeenCalledWith('JWT_REFRESH_EXPIRES_IN', '7d')
    })
  })
})
