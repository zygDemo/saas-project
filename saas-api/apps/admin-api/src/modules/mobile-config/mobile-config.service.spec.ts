import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException, ConflictException } from '@nestjs/common'
import { MobileConfigService } from './mobile-config.service'
import { PrismaService } from '../prisma/prisma.service'

jest.mock('../../common/tenant/tenant-context', () => ({
  getCurrentTenantId: jest.fn(() => 1),
  getRequiredTenantId: jest.fn(() => 1),
}))

const mockTenant = {
  id: 1, mobileModules: ['carloan', 'food'], defaultMobileModule: 'carloan',
}

const mockUser = {
  id: 1, mobileModules: ['carloan'], mobileMultiModule: false,
  roles: [{ roleId: 2, role: { name: '销售' } }],
}

describe('MobileConfigService', () => {
  let service: MobileConfigService
  let mockPrisma: Record<string, unknown>

  beforeEach(async () => {
    mockPrisma = {
      tenant: {
        findUnique: jest.fn().mockResolvedValue(mockTenant),
        update: jest.fn().mockResolvedValue(mockTenant),
      },
      user: {
        findFirst: jest.fn().mockResolvedValue(mockUser),
        findUnique: jest.fn().mockResolvedValue(mockUser),
        update: jest.fn().mockResolvedValue(mockUser),
      },
      role: {
        findFirst: jest.fn().mockResolvedValue({ id: 2, mobileModules: ['food'], mobileMultiModule: true }),
        update: jest.fn(),
      },
    }
    const module: TestingModule = await Test.createTestingModule({
      providers: [MobileConfigService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile()
    service = module.get<MobileConfigService>(MobileConfigService)
  })

  describe('getConfig', () => {
    it('应返回租户移动端配置', async () => {
      const result = await service.getConfig()
      expect(result.available).toBeDefined()
      expect(result.enabled).toEqual(['carloan', 'food'])
      expect(result.defaultModule).toBe('carloan')
    })

    it('应正确判断多模块模式', async () => {
      expect((await service.getConfig()).isMultiModule).toBe(true)
      mockPrisma.tenant.findUnique.mockResolvedValue({ ...mockTenant, mobileModules: ['carloan'] })
      expect((await service.getConfig()).isMultiModule).toBe(false)
    })
  })

  describe('updateConfig', () => {
    it('应更新租户配置', async () => {
      const result = await service.updateConfig({ mobileModules: ['carloan'] } as any)
      expect(mockPrisma.tenant.update).toHaveBeenCalled()
      expect(result.defaultModule).toBe('carloan')
    })

    it('无效模块 key 应抛出异常', async () => {
      await expect(service.updateConfig({ mobileModules: ['invalid_module'] } as any))
        .rejects.toThrow('无效的模块 key')
    })
  })

  describe('getUserConfig', () => {
    it('应返回用户配置及角色信息', async () => {
      const result = await service.getUserConfig(1)
      expect(result.enabled).toEqual(['carloan'])
      expect(result.roles).toEqual([{ roleId: 2, roleName: '销售' }])
    })

    it('用户不存在时应抛出 NotFoundException', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null)
      await expect(service.getUserConfig(999)).rejects.toThrow(NotFoundException)
    })
  })

  describe('updateUserConfig', () => {
    it('应更新用户配置', async () => {
      await service.updateUserConfig(1, { mobileModules: ['carloan', 'food'] } as any)
      expect(mockPrisma.user.update).toHaveBeenCalled()
    })
  })

  describe('resetUserConfig', () => {
    it('应重置用户配置为默认', async () => {
      await service.resetUserConfig(1)
      expect(mockPrisma.user.update).toHaveBeenCalled()
    })
  })

  describe('getResolvedConfig', () => {
    it('应返回合并后的配置', async () => {
      const result = await service.getResolvedConfig(1)
      expect(result).toBeDefined()
      expect(result.available).toBeDefined()
    })
  })
})
