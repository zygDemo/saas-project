import { Injectable, Logger } from '@nestjs/common'
import { RedisService } from './redis.service'

/**
 * 通用 Redis 缓存服务
 * 
 * 使用方式:
 *   constructor(private readonly cache: CacheService) {}
 * 
 *   // 基本用法
 *   const data = await this.cache.getOrSet('key', () => fetchFromDb(), 300)
 * 
 *   // 手动管理
 *   await this.cache.set('key', value, 600)
 *   await this.cache.del('key')
 *   await this.cache.delPattern('dict:*')
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name)
  private readonly DEFAULT_TTL = 600 // 10 分钟

  constructor(private readonly redis: RedisService) {}

  /**
   * 获取缓存值
   */
  async get<T = any>(key: string): Promise<T | null> {
    try {
      const raw = await this.redis.client.get(key)
      if (raw === null) return null
      return JSON.parse(raw) as T
    } catch (err) {
      this.logger.warn(`Cache GET failed [${key}]: ${err}`)
      return null
    }
  }

  /**
   * 设置缓存值
   * @param key 缓存键
   * @param value 缓存值（会被 JSON 序列化）
   * @param ttlSeconds 过期时间（秒），默认 600 秒
   */
  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    try {
      const ttl = ttlSeconds ?? this.DEFAULT_TTL
      const serialized = JSON.stringify(value)
      await this.redis.client.set(key, serialized, 'EX', ttl)
    } catch (err) {
      this.logger.warn(`Cache SET failed [${key}]: ${err}`)
    }
  }

  /**
   * 删除单个缓存键
   */
  async del(key: string): Promise<void> {
    try {
      await this.redis.client.del(key)
    } catch (err) {
      this.logger.warn(`Cache DEL failed [${key}]: ${err}`)
    }
  }

  /**
   * 按模式删除缓存键（支持通配符）
   * 例: await this.cache.delPattern('dict:1:*')
   */
  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.client.keys(pattern)
      if (keys.length > 0) {
        await this.redis.client.del(...keys)
      }
    } catch (err) {
      this.logger.warn(`Cache DEL_PATTERN failed [${pattern}]: ${err}`)
    }
  }

  /**
   * 获取缓存，若不存在则调用工厂函数并缓存结果
   * @param key 缓存键
   * @param factory 数据工厂函数（缓存未命中时调用）
   * @param ttlSeconds 过期时间（秒），默认 600 秒
   */
  async getOrSet<T = any>(key: string, factory: () => Promise<T>, ttlSeconds?: number): Promise<T> {
    const cached = await this.get<T>(key)
    if (cached !== null) return cached

    const value = await factory()
    // 只缓存非 null/undefined 的值
    if (value !== null && value !== undefined) {
      await this.set(key, value, ttlSeconds)
    }
    return value
  }

  /**
   * 批量删除指定前缀的所有缓存
   * @param prefix 缓存前缀，如 'dict:', 'menu:'
   * @param tenantId 可选的租户 ID
   */
  async delByPrefix(prefix: string, tenantId?: number): Promise<void> {
    const pattern = tenantId ? `${prefix}${tenantId}:*` : `${prefix}*`
    await this.delPattern(pattern)
  }
}
