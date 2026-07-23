import { Test, TestingModule } from '@nestjs/testing'
import { InternalServerErrorException } from '@nestjs/common'
import { DbOpsService } from './db-ops.service'
import { PrismaService } from '../prisma/prisma.service'

// Mock child_process.execSync
jest.mock('child_process', () => ({
  execSync: jest.fn().mockReturnValue(Buffer.from('success')),
}))

describe('DbOpsService', () => {
  let service: DbOpsService
  let mockPrisma: Record<string, unknown>

  beforeEach(async () => {
    mockPrisma = {
      user: { count: jest.fn().mockResolvedValue(10) },
      role: { count: jest.fn().mockResolvedValue(5) },
      menu: { count: jest.fn().mockResolvedValue(30) },
    }
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DbOpsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile()
    service = module.get<DbOpsService>(DbOpsService)
  })

  describe('getStatus', () => {
    it('应返回数据库状态概览', async () => {
      const result = await service.getStatus()
      expect(result.users).toBe(10)
      expect(result.roles).toBe(5)
      expect(result.menus).toBe(30)
      expect(result.running).toBe(false)
    })
  })

  describe('runMigrate', () => {
    it('应执行迁移命令', async () => {
      const result = await service.runMigrate()
      expect(result).toContain('success')
    })
  })

  describe('runSeed', () => {
    it('应执行种子命令', async () => {
      const result = await service.runSeed()
      expect(result).toContain('success')
    })
  })

  describe('runSyncRoles', () => {
    it('应执行角色同步命令', async () => {
      const result = await service.runSyncRoles()
      expect(result).toContain('success')
    })
  })
})
