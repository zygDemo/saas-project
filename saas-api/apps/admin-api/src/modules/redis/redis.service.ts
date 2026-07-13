import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name)
  readonly client: Redis

  constructor(config: ConfigService) {
    this.client = new Redis({
      host: config.get<string>('REDIS_HOST', 'localhost'),
      port: config.get<number>('REDIS_PORT', 6379),
      password: config.get<string>('REDIS_PASSWORD') || undefined,
      maxRetriesPerRequest: null,
      retryStrategy: (times: number) => {
        if (times > 3) {
          this.logger.warn(`Redis reconnect attempts exhausted (${times}), giving up`)
          return null
        }
        return Math.min(times * 500, 2000)
      }
    })

    // 捕获连接错误，避免 ioredis Unhandled error event 导致进程崩溃
    this.client.on('error', (err: Error) => {
      if (err.message.includes('ECONNREFUSED')) {
        this.logger.warn(`Redis 连接失败: ${err.message} (缓存功能将不可用)`)
      } else {
        this.logger.warn(`Redis error: ${err.message}`)
      }
    })

    this.client.on('connect', () => {
      this.logger.log('Redis 已连接')
    })
  }

  async onModuleDestroy() {
    try {
      await this.client.quit()
    } catch {
      // ignore
    }
  }
}
