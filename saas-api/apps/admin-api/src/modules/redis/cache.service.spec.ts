import { Test, TestingModule } from '@nestjs/testing'
import { CacheService } from './cache.service'
import { RedisService } from './redis.service'

describe('CacheService', () => {
  let service: CacheService
  let mockRedis: Record<string, unknown>

  beforeEach(async () => {
    mockRedis = {
      client: {
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue('OK'),
        del: jest.fn().mockResolvedValue(1),
        keys: jest.fn().mockResolvedValue([]),
      },
    }
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        { provide: RedisService, useValue: mockRedis },
      ],
    }).compile()
    service = module.get<CacheService>(CacheService)
  })

  describe('get', () => {
    it('键不存在应返回 null', async () => {
      mockRedis.client.get.mockResolvedValue(null)
      const result = await service.get('nonexistent')
      expect(result).toBeNull()
    })

    it('应解析 JSON 值', async () => {
      mockRedis.client.get.mockResolvedValue(JSON.stringify({ name: 'test' }))
      const result = await service.get('key')
      expect(result).toEqual({ name: 'test' })
    })

    it('Redis 异常时应返回 null', async () => {
      mockRedis.client.get.mockRejectedValue(new Error('连接断开'))
      const result = await service.get('key')
      expect(result).toBeNull()
    })
  })

  describe('set', () => {
    it('应序列化并存储值', async () => {
      await service.set('key', { data: 123 }, 300)
      expect(mockRedis.client.set).toHaveBeenCalledWith('key', JSON.stringify({ data: 123 }), 'EX', 300)
    })

    it('应使用默认 TTL', async () => {
      await service.set('key', 'value')
      expect(mockRedis.client.set).toHaveBeenCalledWith('key', '"value"', 'EX', 600)
    })

    it('Redis 异常时不应抛出', async () => {
      mockRedis.client.set.mockRejectedValue(new Error('连接断开'))
      await expect(service.set('key', 'value')).resolves.not.toThrow()
    })
  })

  describe('del', () => {
    it('应删除指定键', async () => {
      await service.del('key')
      expect(mockRedis.client.del).toHaveBeenCalledWith('key')
    })

    it('Redis 异常时不应抛出', async () => {
      mockRedis.client.del.mockRejectedValue(new Error('连接断开'))
      await expect(service.del('key')).resolves.not.toThrow()
    })
  })

  describe('delPattern', () => {
    it('应按模式删除匹配的键', async () => {
      mockRedis.client.keys.mockResolvedValue(['dict:1', 'dict:2', 'dict:3'])
      await service.delPattern('dict:*')
      expect(mockRedis.client.keys).toHaveBeenCalledWith('dict:*')
      expect(mockRedis.client.del).toHaveBeenCalledWith('dict:1', 'dict:2', 'dict:3')
    })

    it('无匹配键时不应调用 del', async () => {
      mockRedis.client.keys.mockResolvedValue([])
      await service.delPattern('nonexistent:*')
      expect(mockRedis.client.del).not.toHaveBeenCalled()
    })

    it('Redis 异常时不应抛出', async () => {
      mockRedis.client.keys.mockRejectedValue(new Error('连接断开'))
      await expect(service.delPattern('key:*')).resolves.not.toThrow()
    })
  })
})
