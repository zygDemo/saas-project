import { ref, onUnmounted } from 'vue'
import { refreshToken } from '@/api/auth'
import { useUserStore } from '@/store/modules/user'

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
let ws: WebSocket | null = null
let pingTimer: ReturnType<typeof setInterval> | null = null
let manualClose = false
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let isRefreshing = false

export function useWebSocket() {
  const userStore = useUserStore()

  function buildWsUrl(): string {
    const token = userStore.accessToken
    if (!token) return ''

    const apiBase = (import.meta.env.VITE_API_URL || window.location.origin) as string
    let origin: string
    try {
      origin = new URL(apiBase).origin
    } catch {
      origin = window.location.origin
    }

    return `${origin}/ws?token=${encodeURIComponent(token)}`
  }

  function connect() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }

    if (ws && (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)) {
      return
    }

    const url = buildWsUrl()
    if (!url) return

    manualClose = false
    ws = new WebSocket(url)

    ws.onopen = () => {
      isConnected.value = true
      console.debug('[WS] 已连接')
      startPing()
    }

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        const eventName = message.event as string
        const data = (message.data || message) as Record<string, unknown>
        const notification = data as WsNotification

        if (eventName === 'notification' || eventName === 'announcement') {
          handlers.forEach((fn) => fn(notification))
          showBrowserNotification(notification)
        } else if (eventName === 'connected') {
          console.debug('[WS] 认证成功:', data)
        } else if (eventName === 'pong') {
          // heartbeat response
        } else {
          console.debug('[WS] 未处理事件:', eventName, data)
        }
      } catch (e) {
        console.warn('[WS] 消息解析失败:', e)
      }
    }

    ws.onclose = async (event) => {
      isConnected.value = false
      stopPing()
      ws = null

      if (manualClose) return

      if (event.code === 1008 && userStore.refreshToken && !isRefreshing) {
        try {
          isRefreshing = true
          const res = await refreshToken({ refreshToken: userStore.refreshToken })
          userStore.setToken(res.token, res.refreshToken)
          disconnect()
          connect()
          return
        } catch (err) {
          console.error('[WS] refresh token 失败，停止重连', err)
          userStore.logOut()
          return
        } finally {
          isRefreshing = false
        }
      }

      reconnectTimer = setTimeout(() => {
        reconnectTimer = null
        connect()
      }, 3000)
    }

    ws.onerror = (err) => {
      console.warn('[WS] 连接错误:', err)
    }
  }

  function disconnect() {
    manualClose = true
    stopPing()
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    ws?.close()
    ws = null
    isConnected.value = false
  }

  function onNotification(handler: NotificationHandler) {
    handlers.add(handler)
    return () => handlers.delete(handler)
  }

  function markRead(notificationId: number) {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ event: 'mark_read', data: { notificationId } }))
    }
  }

  function startPing() {
    stopPing()
    pingTimer = setInterval(() => {
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ event: 'ping', data: {} }))
      }
    }, 30000)
  }

  function stopPing() {
    if (pingTimer) {
      clearInterval(pingTimer)
      pingTimer = null
    }
  }

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
    startPing,
    stopPing,
  }
}

function showBrowserNotification(data: WsNotification) {
  const typeMap: Record<string, 'success' | 'warning' | 'info' | 'error'> = {
    announcement: 'info',
    approval: 'warning',
    supplement: 'warning',
    signing: 'success',
    loan: 'success',
    order: 'info',
    system: 'info',
  }

  import('element-plus').then(({ ElNotification }) => {
    ElNotification({
      title: data.title || '新通知',
      message: data.content,
      type: typeMap[data.type] || 'info',
      duration: 5000,
      position: 'top-right',
    })
  })
}
