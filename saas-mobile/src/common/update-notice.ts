/**
 * 应用更新检测模块
 *
 * 定时轮询 version.json，检测应用是否有新版本发布
 * 与 saas-web 端保持一致的更新通知机制
 *
 * ## 主要功能
 *
 * - 跨端版本信息获取（H5 使用 fetch，小程序/App 使用 uni.request）
 * - 定时轮询版本变更
 * - 检测到新版本时通过回调通知 UI 层展示更新提示
 * - 支持忽略指定版本（用户关闭后不再重复提示）
 *
 * @module common/update-notice
 */

/** 版本信息 */
export interface VersionInfo {
  /** 版本号 */
  version?: string
  /** 构建哈希 */
  hash?: string
  /** 构建时间 */
  buildTime?: string
}

/** 更新检测配置 */
export interface UpdateNoticeOptions {
  /** 版本文件地址，默认基于 base 拼接 */
  versionUrl?: string
  /** 轮询间隔（毫秒），默认 60s */
  checkInterval?: number
  /** 首次检测延迟（毫秒），默认 5s */
  initialDelay?: number
  /** 检测到新版本时的回调 */
  onUpdate: (versionInfo: VersionInfo) => void
}

/** 忽略的版本 hash 存储键 */
const DISMISSED_HASH_KEY = 'sys-update-notice-dismissed-hash'

/** 默认轮询间隔 */
const DEFAULT_CHECK_INTERVAL = 60 * 1000

/** 默认首次检测延迟 */
const DEFAULT_INITIAL_DELAY = 5000

let currentHash = ''
let timer: ReturnType<typeof setInterval> | undefined
let isChecking = false

/**
 * 获取 version.json 的完整 URL
 */
function getVersionUrl(): string {
  // H5 环境使用 import.meta.env.BASE_URL
  // #ifdef H5
  const base = import.meta.env.BASE_URL || '/saas/mobile/'
  return `${base}version.json`
  // #endif

  // #ifndef H5
  // 小程序/App 环境，使用静态资源路径
  return '/static/version.json'
  // #endif
}

/**
 * 跨端获取版本信息
 * H5 使用 fetch（支持 cache: no-store），小程序/App 使用 uni.request
 */
async function fetchVersionInfo(url: string): Promise<VersionInfo> {
  // #ifdef H5
  const response = await fetch(`${url}?t=${Date.now()}`, {
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`Version check failed: ${response.status}`)
  }

  return response.json()
  // #endif

  // #ifndef H5
  return new Promise((resolve, reject) => {
    uni.request({
      url: `${url}?t=${Date.now()}`,
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200 && res.data) {
          resolve(res.data as VersionInfo)
        }
        else {
          reject(new Error(`Version check failed: ${res.statusCode}`))
        }
      },
      fail: (err) => {
        reject(new Error(`Version check failed: ${err.errMsg || 'unknown'}`))
      },
    })
  })
  // #endif
}

/**
 * 执行一次版本检测
 */
async function checkForUpdate(options: UpdateNoticeOptions): Promise<void> {
  if (isChecking) return
  isChecking = true

  try {
    const versionUrl = options.versionUrl || getVersionUrl()
    const versionInfo = await fetchVersionInfo(versionUrl)
    const nextHash = versionInfo.hash || versionInfo.version

    if (!nextHash) return

    // 首次获取，记录当前版本
    if (!currentHash) {
      currentHash = nextHash
      return
    }

    // 版本未变化
    if (nextHash === currentHash) return

    // 用户已忽略该版本
    const dismissedHash = uni.getStorageSync(DISMISSED_HASH_KEY)
    if (nextHash === dismissedHash) return

    // 检测到新版本，触发回调
    options.onUpdate(versionInfo)
  }
  catch (error) {
    console.warn('[UpdateNotice] 版本检测失败:', error)
  }
  finally {
    isChecking = false
  }
}

/**
 * 启动更新检测
 *
 * 仅在生产环境生效，开发环境跳过
 *
 * @param options 配置选项
 * @returns 停止检测的函数
 */
export function startUpdateNotice(options: UpdateNoticeOptions): () => void {
  // 仅 H5 生产环境启用
  // #ifdef H5
  if (!import.meta.env.PROD) {
    console.warn('[UpdateNotice] 非生产环境，跳过更新检测')
    return () => {}
  }
  // #endif

  // #ifndef H5
  // 小程序/App 端暂不启用轮询（可通过其他方式触发）
  console.warn('[UpdateNotice] 非 H5 环境，跳过自动更新检测')
  return () => {}
  // #endif

  // #ifdef H5
  if (timer) {
    console.warn('[UpdateNotice] 检测已启动，跳过重复启动')
    return () => stopUpdateNotice()
  }

  const checkInterval = options.checkInterval ?? DEFAULT_CHECK_INTERVAL
  const initialDelay = options.initialDelay ?? DEFAULT_INITIAL_DELAY

  // 延迟首次检测
  setTimeout(() => {
    checkForUpdate(options)
  }, initialDelay)

  // 定时轮询
  timer = setInterval(() => {
    checkForUpdate(options)
  }, checkInterval)

  return () => stopUpdateNotice()
  // #endif
}

/**
 * 停止更新检测
 */
export function stopUpdateNotice(): void {
  if (timer) {
    clearInterval(timer)
    timer = undefined
  }
}

/**
 * 标记某个版本 hash 为已忽略
 * 用户点击"忽略"后，不再重复提示该版本
 */
export function dismissUpdate(nextHash: string): void {
  uni.setStorageSync(DISMISSED_HASH_KEY, nextHash)
}

/**
 * 重置当前版本记录
 * 用于用户点击"刷新"后重置状态
 */
export function resetCurrentHash(): void {
  currentHash = ''
}
