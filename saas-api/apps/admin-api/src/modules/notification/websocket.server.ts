import { Injectable, Logger } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { Server, WebSocket } from 'ws'
import { IncomingMessage } from 'http'

interface AuthenticatedSocket extends WebSocket {
  userId?: number
  tenantId?: number
  isAlive?: boolean
}

interface ClientInfo {
  socket: AuthenticatedSocket
  userId?: number
  tenantId?: number
}

@Injectable()
export class WebSocketServer {
  private readonly logger = new Logger(WebSocketServer.name)
  private wss: Server | null = null
  private readonly clients = new Map<WebSocket, ClientInfo>()
  private readonly tenantRooms = new Map<number, Set<WebSocket>>()
  private readonly userRooms = new Map<number, Set<WebSocket>>()

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  setup(server: import('http').Server, path = '/ws') {
    this.wss = new Server({ server, path })

    this.wss.on('connection', (socket: WebSocket, req: IncomingMessage) => {
      const authSocket = socket as AuthenticatedSocket
      const url = new URL(req.url || '', `http://${req.headers.host}`)
      const token = url.searchParams.get('token') || req.headers.authorization?.replace('Bearer ', '')

      if (!token) {
        this.logger.warn(`连接拒绝: 无 token`)
        authSocket.close(1008, 'Missing token')
        return
      }

      try {
        const payload = this.jwtService.verify(token, {
          secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        })

        authSocket.userId = Number(payload.userId ?? payload.sub ?? payload.id)
        authSocket.tenantId = Number(payload.tenantId)
        authSocket.isAlive = true

        this.clients.set(authSocket, {
          socket: authSocket,
          userId: authSocket.userId,
          tenantId: authSocket.tenantId,
        })

        // 加入租户房间
        if (authSocket.tenantId) {
          if (!this.tenantRooms.has(authSocket.tenantId)) {
            this.tenantRooms.set(authSocket.tenantId, new Set())
          }
          this.tenantRooms.get(authSocket.tenantId)!.add(authSocket)
        }

        // 加入用户房间
        if (authSocket.userId) {
          if (!this.userRooms.has(authSocket.userId)) {
            this.userRooms.set(authSocket.userId, new Set())
          }
          this.userRooms.get(authSocket.userId)!.add(authSocket)
        }

        this.logger.log(`客户端连接: user=${authSocket.userId}, tenant=${authSocket.tenantId}`)

        // 发送连接成功消息
        authSocket.send(JSON.stringify({
          event: 'connected',
          data: {
            userId: authSocket.userId,
            tenantId: authSocket.tenantId,
            timestamp: Date.now(),
          },
        }))

        // 处理消息
        authSocket.on('message', (data: Buffer) => {
          try {
            const message = JSON.parse(data.toString())
            this.handleMessage(authSocket, message)
          } catch (err) {
            this.logger.warn(`消息解析失败: ${(err as Error).message}`)
          }
        })

        // 心跳检测
        authSocket.on('pong', () => {
          authSocket.isAlive = true
        })

        // 断开连接
        authSocket.on('close', () => {
          this.logger.log(`客户端断开: user=${authSocket.userId}`)
          this.removeClient(authSocket)
        })

        authSocket.on('error', (err) => {
          this.logger.error(`WebSocket 错误: ${err.message}`)
          this.removeClient(authSocket)
        })

      } catch (err) {
        this.logger.warn(`连接认证失败: ${(err as Error).message}`)
        authSocket.close(1008, 'Invalid token')
      }
    })

    // 定时清理死连接
    setInterval(() => {
      this.wss?.clients.forEach((socket) => {
        const authSocket = socket as AuthenticatedSocket
        if (authSocket.isAlive === false) {
          authSocket.terminate()
          this.removeClient(authSocket)
          return
        }
        authSocket.isAlive = false
        authSocket.ping()
      })
    }, 30000)
  }

  private handleMessage(socket: AuthenticatedSocket, message: Record<string, unknown>) {
    const event = message.event as string
    const payload = message.data as Record<string, unknown> | undefined

    switch (event) {
      case 'ping':
        socket.send(JSON.stringify({ event: 'pong', data: { timestamp: Date.now() } }))
        break
      case 'mark_read':
        this.logger.debug(`标记已读: user=${socket.userId}, data=${JSON.stringify(payload)}`)
        socket.send(JSON.stringify({ event: 'mark_read', data: { success: true } }))
        break
      default:
        this.logger.warn(`未知事件: ${event}`)
    }
  }

  private removeClient(socket: AuthenticatedSocket) {
    const clientInfo = this.clients.get(socket)
    if (!clientInfo) return

    if (clientInfo.userId) {
      const userSet = this.userRooms.get(clientInfo.userId)
      userSet?.delete(socket)
      if (userSet && userSet.size === 0) {
        this.userRooms.delete(clientInfo.userId)
      }
    }

    if (clientInfo.tenantId) {
      const tenantSet = this.tenantRooms.get(clientInfo.tenantId)
      tenantSet?.delete(socket)
      if (tenantSet && tenantSet.size === 0) {
        this.tenantRooms.delete(clientInfo.tenantId)
      }
    }

    this.clients.delete(socket)
  }

  // ─── 服务端推送 ====================================================
  /** 向指定租户所有在线用户推送 */
  emitToTenant(tenantId: number, event: string, data: Record<string, unknown>) {
    const room = this.tenantRooms.get(tenantId)
    if (!room) return

    const message = JSON.stringify({ event, data: { ...data, _ts: Date.now() } })
    room.forEach((socket) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(message)
      }
    })
  }

  /** 向指定用户推送（所有设备） */
  emitToUser(userId: number, event: string, data: Record<string, unknown>) {
    const room = this.userRooms.get(userId)
    if (!room) return

    const message = JSON.stringify({ event, data: { ...data, _ts: Date.now() } })
    room.forEach((socket) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(message)
      }
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
    const message = JSON.stringify({ event, data: { ...data, _ts: Date.now() } })
    this.clients.forEach(({ socket }) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(message)
      }
    })
  }

  /** 获取在线统计 */
  getOnlineStats() {
    return {
      totalConnections: this.clients.size,
      tenantCount: this.tenantRooms.size,
      userCount: this.userRooms.size,
    }
  }
}
