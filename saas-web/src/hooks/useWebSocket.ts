import { ref, onMounted, onUnmounted } from 'vue'
import { io, Socket } from 'socket.io-client'
import { useUserStore } from '@/store/modules/user'
import { ElNotification } from 'element-plus'

export interface WsNotification {
  type: 'announcement' | 'approval' | 'supplement' | 'signing' | 'loan' | 'order' | 'system'
  title: string
  content: string
  extra?: Record<string, unknown>
  _ts?: number
}

type NotificationHandler = (notification: WsNotification) => void

const socket = ref<Socket | null>(null)
const isConnected = ref(false)
const handlers = new Set<NotificationHandler>()

/**
 * WebSocket 通知客户端
 *
 * 使用方式:
 *   const { connect, disconnect, onNotification } = useWebSocket()
 *   onNotification((msg) => { console.log(msg) })
 */
export function useWebSocket() {
  const userStore = useUserStore()

  function connect() {
    if (socket.value?.connected) return

    const token = userStore.token
    if (!token) return

    const wsUrl = import.meta.env.VITE_API_URL || window.location.origin

    socket.value = io(`${wsUrl}/ws`, {
      auth: { token: `Bearer ${token}` },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 3000,
    })

    socket.value.on('connect', () => {
      isConnected.value = true
      console.debug('[WS] 已连接', socket.value?.id)
    })

    socket.value.on('disconnect', (reason) => {
      isConnected.value = false
      console.debug('[WS] 已断开:', reason)
    })

    socket.value.on('connected', (data) => {
      console.debug('[WS] 认证成功:', data)
    })

    // 通用通知
    socket.value.on('notification', (data: WsNotification) => {
      console.debug('[WS] 收到通知:', data)

      // 触发所有注册的 handler
      handlers.forEach((fn) => fn(data))

      // 弹出桌面通知
      showBrowserNotification(data)
    })

    // 公告推送
    socket.value.on('announcement', (data: WsNotification) => {
      handlers.forEach((fn) => fn({ ...data, type: 'announcement' }))
      showBrowserNotification({ ...data, type: 'announcement' })
    })

    socket.value.on('pong', () => {
      // 心跳响应
    })
  }

  function disconnect() {
    socket.value?.disconnect()
    socket.value = null
    isConnected.value = false
  }

  function onNotification(handler: NotificationHandler) {
    handlers.add(handler)
    return () => handlers.delete(handler)
  }

  function markRead(notificationId: number) {
    socket.value?.emit('mark_read', { notificationId })
  }

  // 心跳保活
  let pingTimer: ReturnType<typeof setInterval> | null = null
  function startPing() {
    pingTimer = setInterval(() => {
      socket.value?.emit('ping')
    }, 30000)
  }

  function stopPing() {
    if (pingTimer) clearInterval(pingTimer)
  }

  // 组件卸载时自动断开
  onUnmounted(() => {
    disconnect()
    stopPing()
    handlers.clear()
  })

  return {
    socket,
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
  // Element Plus 桌面通知
  const typeMap: Record<string, 'success' | 'warning' | 'info' | 'error'> = {
    announcement: 'info',
    approval: 'warning',
    supplement: 'warning',
    signing: 'success',
    loan: 'success',
    order: 'info',
    system: 'info',
  }

  ElNotification({
    title: data.title || '新通知',
    message: data.content,
    type: typeMap[data.type] || 'info',
    duration: 5000,
    position: 'top-right',
  })
}
