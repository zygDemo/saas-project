import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { NotificationGateway } from './notification.gateway'
import { WebSocketServer } from './websocket.server'
import { NotificationService } from './notification.service'
import { NotificationController } from './notification.controller'

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN', '7d') },
      }),
    }),
  ],
  controllers: [NotificationController],
  providers: [NotificationGateway, NotificationService, WebSocketServer],
  exports: [NotificationService],
})
export class NotificationModule {}
