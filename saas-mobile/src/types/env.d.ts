/// <reference types="vite/client" />

/**
 * 环境变量类型声明
 */
interface ImportMetaEnv {
  /** 环境标识 */
  readonly VITE_APP_ENV: 'development' | 'sit' | 'production'
  /** API 基础地址 */
  readonly VITE_API_BASE_URL: string
  /** 图片基础地址 */
  readonly VITE_IMAGE_BASE_URL: string
  /** 应用名称 */
  readonly VITE_APP_NAME: string
  /** 是否开启调试 */
  readonly VITE_DEBUG: string
  /** 上传文件大小限制 */
  readonly VITE_UPLOAD_MAX_SIZE: string
  /** 请求超时时间 */
  readonly VITE_REQUEST_TIMEOUT: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
