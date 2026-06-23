import { ElNotification } from 'element-plus'
import { h, type VNode } from 'vue'

interface VersionInfo {
  version?: string
  hash?: string
  buildTime?: string
}

const VERSION_URL = `${import.meta.env.BASE_URL || '/'}version.json`
const CHECK_INTERVAL = 60 * 1000
const DISMISSED_HASH_KEY = 'sys-update-notice-dismissed-hash'

let currentHash = ''
let timer: number | undefined
let notificationVisible = false

export function startUpdateNotice(): void {
  if (!import.meta.env.PROD || timer) return

  setTimeout(checkForUpdate, 5000)
  timer = window.setInterval(checkForUpdate, CHECK_INTERVAL)
}

async function checkForUpdate(): Promise<void> {
  try {
    const versionInfo = await fetchVersionInfo()
    const nextHash = versionInfo.hash || versionInfo.version

    if (!nextHash) return

    if (!currentHash) {
      currentHash = nextHash
      return
    }

    if (nextHash !== currentHash && nextHash !== localStorage.getItem(DISMISSED_HASH_KEY)) {
      showUpdateNotification(nextHash)
    }
  } catch (error) {
    console.debug('[UpdateNotice] Failed to check app version:', error)
  }
}

async function fetchVersionInfo(): Promise<VersionInfo> {
  const response = await fetch(`${VERSION_URL}?t=${Date.now()}`, {
    cache: 'no-store'
  })

  if (!response.ok) {
    throw new Error(`Version check failed: ${response.status}`)
  }

  return response.json()
}

function showUpdateNotification(nextHash: string): void {
  if (notificationVisible) return

  notificationVisible = true

  const message = createNotificationContent(
    nextHash,
    () => {
      notification.close()
      window.location.reload()
    },
    () => {
      localStorage.setItem(DISMISSED_HASH_KEY, nextHash)
      notification.close()
    }
  )

  const notification = ElNotification({
    title: '系统更新',
    message,
    position: 'bottom-right',
    duration: 0,
    type: 'info',
    customClass: 'app-update-notice',
    onClose: () => {
      notificationVisible = false
    }
  })
}

function createNotificationContent(
  nextHash: string,
  refresh: () => void,
  dismiss: () => void
): VNode {
  return h('div', { class: 'app-update-notice__content' }, [
    h(
      'p',
      { class: 'app-update-notice__description' },
      '为了您更好的体验，我们升级了系统，请您刷新页面体验最新版本!'
    ),
    h('div', { class: 'app-update-notice__actions' }, [
      h(
        'button',
        {
          type: 'button',
          class: 'app-update-notice__button app-update-notice__button--text',
          onClick: dismiss
        },
        '忽略'
      ),
      h(
        'button',
        {
          type: 'button',
          class: 'app-update-notice__button app-update-notice__button--primary',
          onClick: refresh
        },
        '刷新'
      )
    ]),
    h('span', { style: { display: 'none' } }, nextHash)
  ])
}
