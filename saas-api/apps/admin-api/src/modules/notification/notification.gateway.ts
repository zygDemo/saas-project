import { OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, ConnectedSocket, SubscribeMessage, MessageBody } from '@nestjs/websockets'
import { Logger } from '@nestjs/common'
import { WebSocketServer as NativeWebSocketServer } from './websocket.server'

export interface WsNotification {
  type: 'announcement' | 'approval' | 'supplement' | 'signing' | 'loan' | 'order' | 'system'
  title: string
  content: string
  extra?: Record<string, unknown>
  _ts?: number
}

@ConnectedSocket()
export class NotificationGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(NotificationGateway.name)

  constructor(private readonly wsServer: NativeWebSocketServer) {}

  afterInit() {
    this.logger.log('WebSocket 网关已启动 /ws')
  }

  handleConnection(client: any) {
    // 原生 WebSocket 连接已在 websocket.server.ts 中处理
    this.logger.debug(`客户端连接: ${client.userId}`)
  }

  handleDisconnect(client: any) {
    this.logger.debug(`客户端断开: ${client.userId}`)
  }

  // ─── 服务端推送 ====================================================
  emitToTenant(tenantId: number, event: string, data: Record<string, unknown>) {
    this.wsServer.emitToTenant(tenantId, event, data)
  }

  emitToUser(userId: number, event: string, data: Record<string, unknown>) {
    this.wsServer.emitToUser(userId, event, data)
  }

  emitToUsers(userIds: number[], event: string, data: Record<string, unknown>) {
    this.wsServer.emitToUsers(userIds, event, data)
  }

  emitBroadcast(event: string, data: Record<string, unknown>) {
    this.wsServer.emitBroadcast(event, data)
  }

  getOnlineStats() {
    return this.wsServer.getOnlineStats()
  }
}
