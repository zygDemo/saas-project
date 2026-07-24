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
const MAX_RECONNECT = 10

/**
 * 移动端 WebSocket 通知客户端
 *
 * 使用方式:
 *   const { connect, disconnect, onNotification } = useWebSocket()
 *   onNotification((msg) => { console.log(msg) })
 */
export function useWebSocket() {
  const localStore = useLocalStore()

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

    const url = getWsUrl()
    console.info('[WS] 正在连接', url)

    socketTask = uni.connectSocket({
      url,
      header: {},
      complete() {},
    }) as unknown as UniApp.SocketTask

    socketTask.onOpen(() => {
      isConnected.value = true
      reconnectAttempts = 0
      console.debug('[WS] 已连接', url)

      // 发送认证
      socketTask!.send({
        data: JSON.stringify({
          type: 'auth',
          auth: { token: `Bearer ${token}` },
        }),
      })

      startPing()
    })

    socketTask.onMessage((res) => {
      try {
        const data = JSON.parse(res.data as string)

        if (data.event === 'notification' || data.event === 'announcement') {
          const notification = data.data || data
          handlers.forEach((fn) => fn(notification))

          // 显示提示
          uni.showToast({
            title: notification.title || '新通知',
            icon: 'none',
            duration: 3000,
          })
        }
      } catch (e) {
        // ignore parse errors
      }
    })

    socketTask.onClose(() => {
      isConnected.value = false
      socketTask = null
      stopPing()

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
    return () => handlers.delete(handler)
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

  // 页面卸载时自动断开
  onUnmounted(() => {
    disconnect()
    handlers.clear()
  })

  return {
    isConnected,
    connect,
    disconnect,
    onNotification,
    markRead,
  }
}

