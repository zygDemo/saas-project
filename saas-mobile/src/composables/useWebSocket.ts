import { ref, onMounted, onUnmounted } from 'vue'
import { useLocalStore } from '@/stores'
import { WS_BASE_URL, API_BASE_URL } from '@/common/env'

export interface WsNotification {
  type: 'announcement' | 'approval' | 'supplement' | 'signing' | 'loan' | 'order' | 'system'
  title: string
  content: string
  extra?: Record<string, unknown>
  _ts?: number
}

type NotificationHandler = (notification: WsNotification) => void

const isConnected = ref(false)
const handlers = new Set<NotificationHandler>()
let socketTask: UniApp.SocketTask | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let pingTimer: ReturnType<typeof setInterval> | null = null
let reconnectAttempts = 0
let refCount = 0
let manualDisconnect = false
const MAX_RECONNECT = 10

/**
 * 移动端 WebSocket 通知客户端（应用级单例）
 *
 * 使用方式:
 *   const { connect, disconnect, onNotification } = useWebSocket()
 *   onNotification((msg) => { console.log(msg) })
 */
export function useWebSocket() {
  const localStore = useLocalStore()
  const instanceHandlers = new Set<NotificationHandler>()

  function getWsUrl(): string {
    // 优先使用独立的 WS 地址
    const explicit = WS_BASE_URL
    if (explicit) {
      return explicit.replace(/\/$/, '') + '/ws'
    }

    // 从 API 地址推导：只保留 origin，避免把 /saas/api 拼进 WS 路径
    const apiBase = API_BASE_URL || 'http://localhost:3001'
    try {
      const origin = new URL(apiBase).origin
      return origin.replace(/^http/, 'ws') + '/ws'
    } catch {
      return 'ws://localhost:3001/ws'
    }
  }

  function connect() {
    if (socketTask) return

    const token = localStore.token
    if (!token) {
      console.warn('[WS] 未登录，跳过连接')
      return
    }

    manualDisconnect = false
    const url = getWsUrl()
    const wsUrl = `${url}?token=${encodeURIComponent(token)}`
    console.info('[WS] 正在连接', wsUrl)

    socketTask = uni.connectSocket({
      url: wsUrl,
      header: {},
      complete() {},
    }) as unknown as UniApp.SocketTask

    socketTask.onOpen(() => {
      isConnected.value = true
      reconnectAttempts = 0
      console.debug('[WS] 已连接', wsUrl)
      startPing()
    })

    socketTask.onMessage((res) => {
      try {
        const message = JSON.parse(res.data as string)
        const event = message.event as string
        const data = (message.data || message) as Record<string, unknown>
        const notification = data as WsNotification

        if (event === 'notification' || event === 'announcement') {
          handlers.forEach((fn) => fn(notification))

          uni.showToast({
            title: notification.title || '新通知',
            icon: 'none',
            duration: 3000,
          })
        } else if (event === 'connected') {
          console.debug('[WS] 服务端确认连接', data)
        } else if (event === 'pong') {
          console.debug('[WS] pong', data)
        } else if (event === 'exception') {
          console.warn('[WS] 服务端异常', data)
        }
      } catch (e) {
        // ignore parse errors
      }
    })

    socketTask.onClose(() => {
      isConnected.value = false
      socketTask = null
      stopPing()

      // 主动断开时不自动重连
      if (manualDisconnect) return

      // 自动重连
      if (reconnectAttempts < MAX_RECONNECT) {
        const delay = Math.min(3000 * Math.pow(1.5, reconnectAttempts), 30000)
        reconnectTimer = setTimeout(() => {
          reconnectAttempts++
          connect()
        }, delay)
      }
    })

    socketTask.onError((err) => {
      console.warn('[WS] 连接错误:', err)
    })
  }

  function disconnect() {
    manualDisconnect = true
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    stopPing()
    socketTask?.close({})
    socketTask = null
    isConnected.value = false
  }

  function onNotification(handler: NotificationHandler) {
    handlers.add(handler)
    instanceHandlers.add(handler)
    return () => {
      handlers.delete(handler)
      instanceHandlers.delete(handler)
    }
  }

  function markRead(notificationId: number) {
    socketTask?.send({
      data: JSON.stringify({ event: 'mark_read', data: { notificationId } }),
    })
  }

  function startPing() {
    pingTimer = setInterval(() => {
      socketTask?.send({ data: JSON.stringify({ event: 'ping' }) })
    }, 30000)
  }

  function stopPing() {
    if (pingTimer) {
      clearInterval(pingTimer)
      pingTimer = null
    }
  }

  // 引用计数：多页面共享同一连接，最后一个使用者离开才断开
  onMounted(() => {
    refCount++
  })

  onUnmounted(() => {
    instanceHandlers.forEach((handler) => handlers.delete(handler))
    instanceHandlers.clear()

    refCount--
    if (refCount <= 0) {
      refCount = 0
      disconnect()
      handlers.clear()
    }
  })

  return {
    isConnected,
    connect,
    disconnect,
    onNotification,
    markRead,
  }
}
