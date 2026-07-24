import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets'
import { Logger, UseGuards } from '@nestjs/common'
import { Server, Socket } from 'socket.io'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'

interface AuthenticatedSocket extends Socket {
  userId?: number
  tenantId?: number
}

/**
 * WebSocket 网关 — 实时通知推送
 *
 * 客户端连接时需在 auth 中传入 token:
 *   io('http://localhost:3001', { auth: { token: 'Bearer xxx' } })
 *
 * 事件:
 *   server → client:
 *     'notification'  — 通用通知推送
 *     'announcement'  — 公告推送
 *     'approval'      — 审批状态变更
 *     'order'         — 订单状态变更
 *   client → server:
 *     'mark_read'     — 标记通知已读
 *     'ping'          — 心跳
 */
@WebSocketGateway({
  cors: { origin: true, credentials: true },
  namespace: '/ws',
  transports: ['websocket', 'polling'],
})
export class NotificationGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server

  private readonly logger = new Logger(NotificationGateway.name)
  /** tenantId → Set<socketId> */
  private readonly tenantRooms = new Map<number, Set<string>>()
  /** userId → Set<socketId> */
  private readonly userRooms = new Map<number, Set<string>>()

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  afterInit() {
    this.logger.log('WebSocket 网关已启动 /ws')
  }

  handleConnection(client: AuthenticatedSocket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '')

      if (!token) {
        this.logger.warn(`连接拒绝: 无 token (${client.id})`)
        client.disconnect()
        return
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      })

      client.userId = Number(payload.userId ?? payload.sub ?? payload.id)
      client.tenantId = payload.tenantId

      // 加入租户房间
      if (client.tenantId) {
        if (!this.tenantRooms.has(client.tenantId)) {
          this.tenantRooms.set(client.tenantId, new Set())
        }
        this.tenantRooms.get(client.tenantId)!.add(client.id)
        client.join(`tenant:${client.tenantId}`)
      }

      // 加入用户房间
      if (client.userId) {
        if (!this.userRooms.has(client.userId)) {
          this.userRooms.set(client.userId, new Set())
        }
        this.userRooms.get(client.userId)!.add(client.id)
        client.join(`user:${client.userId}`)
      }

      this.logger.log(
        `客户端连接: ${client.id} (user=${client.userId}, tenant=${client.tenantId})`,
      )

      // 发送连接成功消息
      client.emit('connected', {
        socketId: client.id,
        userId: client.userId,
        tenantId: client.tenantId,
        timestamp: Date.now(),
      })
    } catch (err) {
      this.logger.warn(`连接认证失败: ${client.id} — ${(err as Error).message}`)
      client.disconnect()
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    // 清理房间映射
    if (client.tenantId && this.tenantRooms.has(client.tenantId)) {
      this.tenantRooms.get(client.tenantId)!.delete(client.id)
      if (this.tenantRooms.get(client.tenantId)!.size === 0) {
        this.tenantRooms.delete(client.tenantId)
      }
    }
    if (client.userId && this.userRooms.has(client.userId)) {
      this.userRooms.get(client.userId)!.delete(client.id)
      if (this.userRooms.get(client.userId)!.size === 0) {
        this.userRooms.delete(client.userId)
      }
    }
    this.logger.log(`客户端断开: ${client.id}`)
  }

  // ==================== 客户端消息 ====================

  @SubscribeMessage('mark_read')
  handleMarkRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { notificationId: number },
  ) {
    this.logger.debug(`用户 ${client.userId} 标记通知 ${data.notificationId} 已读`)
    // 可在此处持久化已读状态
    return { event: 'mark_read_ack', data: { id: data.notificationId, ok: true } }
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: AuthenticatedSocket) {
    return { event: 'pong', data: { timestamp: Date.now() } }
  }

  // ==================== 服务端推送 ====================

  /** 向指定租户所有在线用户推送 */
  emitToTenant(tenantId: number, event: string, data: Record<string, unknown>) {
    this.server.to(`tenant:${tenantId}`).emit(event, {
      ...data,
      _ts: Date.now(),
    })
  }

  /** 向指定用户推送（所有设备） */
  emitToUser(userId: number, event: string, data: Record<string, unknown>) {
    this.server.to(`user:${userId}`).emit(event, {
      ...data,
      _ts: Date.now(),
    })
  }

  /** 向指定租户内多个用户推送 */
  emitToUsers(
    userIds: number[],
    event: string,
    data: Record<string, unknown>,
  ) {
    for (const uid of userIds) {
      this.emitToUser(uid, event, data)
    }
  }

  /** 广播所有连接 */
  emitBroadcast(event: string, data: Record<string, unknown>) {
    this.server.emit(event, { ...data, _ts: Date.now() })
  }

  /** 获取在线统计 */
  getOnlineStats() {
    return {
      totalConnections: this.server.engine?.clientsCount ?? 0,
      tenantCount: this.tenantRooms.size,
      userCount: this.userRooms.size,
    }
  }
}
