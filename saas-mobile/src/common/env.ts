/**
 * 环境变量工具函数
 * 用于获取和操作环境变量
 */

/**
 * 获取环境变量
 * @param key 环境变量名
 * @param defaultValue 默认值
 */
export function getEnv(key: keyof ImportMetaEnv, defaultValue = ""): string {
  const value = import.meta.env[key];
  return value !== undefined ? String(value) : defaultValue;
}

export function getFirstEnv(
  keys: Array<keyof ImportMetaEnv>,
  defaultValue = "",
): string {
  for (const key of keys) {
    const value = import.meta.env[key];
    if (value !== undefined && value !== "") return String(value);
  }
  return defaultValue;
}

/**
 * 获取布尔类型的环境变量
 * @param key 环境变量名
 * @param defaultValue 默认值
 */
export function getEnvBoolean(
  key: keyof ImportMetaEnv,
  defaultValue = false,
): boolean {
  const value = import.meta.env[key];
  if (value === undefined) return defaultValue;
  return value === "true" || value === true;
}

/**
 * 获取数字类型的环境变量
 * @param key 环境变量名
 * @param defaultValue 默认值
 */
export function getEnvNumber(
  key: keyof ImportMetaEnv,
  defaultValue = 0,
): number {
  const value = import.meta.env[key];
  if (value === undefined) return defaultValue;
  const num = Number(value);
  return Number.isNaN(num) ? defaultValue : num;
}

/**
 * 当前环境标识
 */
export const ENV = {
  /** 开发环境 */
  DEVELOPMENT: "development",
  /** SIT测试环境 */
  SIT: "sit",
  /** 生产环境 */
  PRODUCTION: "production",
} as const;

/**
 * 当前环境
 */
export const currentEnv = getEnv("VITE_APP_ENV", "development");

/**
 * 环境判断
 */
export const isDev = currentEnv === ENV.DEVELOPMENT;
export const isSit = currentEnv === ENV.SIT;
export const isProd = currentEnv === ENV.PRODUCTION;

/**
 * API 基础地址
 */
export const API_BASE_URL = getFirstEnv(
  ["VITE_API_BASE_URL", "VITE_API_URL"],
  "",
);

/**
 * 图片基础地址
 */
export const IMAGE_BASE_URL = getFirstEnv(
  ["VITE_IMAGE_BASE_URL", "VITE_API_BASE_URL", "VITE_API_URL"],
  "",
);

/**
 * 默认租户 ID
 */
export const TENANT_ID = getEnv("VITE_TENANT_ID", "1");

/**
 * 应用名称
 */
export const APP_NAME = getEnv("VITE_APP_NAME", "予艺助手");

/**
 * 是否开启调试
 */
export const DEBUG = getEnvBoolean("VITE_DEBUG", false);

/**
 * 上传文件大小限制 (MB)
 */
export const UPLOAD_MAX_SIZE = getEnvNumber("VITE_UPLOAD_MAX_SIZE", 10);

/**
 * 请求超时时间 (ms)
 */
export const REQUEST_TIMEOUT = getEnvNumber("VITE_REQUEST_TIMEOUT", 30000);
/** WebSocket 基础地址 */
export const WS_BASE_URL = getFirstEnv(
  ["VITE_WS_URL", "VITE_WS_BASE_URL"],
  "",
);
