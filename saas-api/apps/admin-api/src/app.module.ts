import { BullModule } from '@nestjs/bullmq'
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TenantMiddleware } from './common/tenant/tenant.middleware'
import { AuthModule } from './modules/auth/auth.module'
import { HealthModule } from './modules/health/health.module'
import { MenusModule } from './modules/menus/menus.module'
import { PrismaModule } from './modules/prisma/prisma.module'
import { QueueModule } from './modules/queue/queue.module'
import { RedisModule } from './modules/redis/redis.module'
import { RolesModule } from './modules/roles/roles.module'
import { UsersModule } from './modules/users/users.module'

const appEnv = process.env.NODE_ENV || 'development'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        `env/.env.${appEnv}`,
        'env/.env'
      ]
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
          password: config.get<string>('REDIS_PASSWORD') || undefined
        }
      })
    }),
    PrismaModule,
    RedisModule,
    QueueModule,
    AuthModule,
    UsersModule,
    RolesModule,
    MenusModule,
    HealthModule
  ]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*')
  }
}
