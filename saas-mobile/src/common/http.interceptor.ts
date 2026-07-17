import type {
  RequestConfig,
  RequestInterceptor,
  RequestMeta,
  RequestOptions,
} from "uview-pro";
import process from "node:process";
import { API_BASE_URL, TENANT_ID, UPLOAD_MAX_SIZE } from "./env";
import { normalizeUploadResponse } from "./file-url";
import { tokenUtil } from "./token";
import { useLocalStore } from "@/stores/local";
import { useSessionStore } from "@/stores/session";

// H5 开发环境通过 Vite 代理转发，避免 CORS
const isH5Dev =
  process.env.UNI_PLATFORM === "h5" && process.env.NODE_ENV === "development";
const baseUrl = isH5Dev ? "/saas/api" : API_BASE_URL;

export const httpRequestConfig: RequestConfig = {
  baseUrl,
  header: {
    "content-type": "application/json",
    "X-Tenant-ID": TENANT_ID,
  },
  meta: {
    originalData: true,
    toast: true,
    loading: true,
  },
};

export const httpInterceptor: RequestInterceptor = {
  request: (config: RequestOptions) => {
    const meta: RequestMeta = config.meta || {};
    config.header = config.header || {};
    config.header["X-Tenant-ID"] = TENANT_ID;

    // 1. 显示 Loading
    if (meta.loading) {
      uni.showLoading({
        title: "加载中...",
        mask: true,
      });
    }

    // 2. 注入 Token
    const token = getRequestToken();
    if (token) {
      config.header.Authorization = tokenUtil.buildAuthorization(token);
    }

    const localStore = useLocalStore();
    const orgId = localStore.currentOrgId;
    if (orgId) {
      config.header["X-Org-Id"] = String(orgId);
    }

    return config;
  },

  response: (response: unknown) => {
    const res = response as ApiResponseLike;
    const meta: RequestMeta = res.config?.meta || {};

    // 1. 统一关闭 Loading
    if (meta.loading) {
      uni.hideLoading();
    }

    // 2. HTTP 状态码错误 (非 200)
    if (res.statusCode !== 200) {
      handleHttpError(res, meta);
      // 返回 false 让请求进入 catch，阻断后续代码
      return false;
    }

    // 3. 业务状态码错误 (code !== 200)
    if (res.data && res.data.code !== 200) {
      handleBusinessError(res, meta);
      return false;
    }

    // 4. 返回成功数据
    return res.data;
  },
};

// --- 类型补充 ---

interface ApiResponseLike {
  statusCode: number;
  data: Record<string, unknown>;
  config?: {
    meta?: RequestMeta;
  };
}

// --- 错误处理辅助函数 ---

function handleHttpError(response: ApiResponseLike, meta: RequestMeta) {
  // 401 - 未授权
  if (response.statusCode === 401) {
    handleUnauthorized(meta);
    return;
  }
  if (response.data?.msg) {
    uni.showToast({ title: response.data.msg as string, icon: "none" });
  } else {
    // 其他 HTTP 错误
    const msg = getErrorMessage(response.statusCode);
    if (meta.toast) {
      uni.showToast({ title: msg, icon: "none" });
    }
  }
}

function handleBusinessError(response: ApiResponseLike, meta: RequestMeta) {
  // 业务层面的 401 (Token 过期)
  if (response.data.code === 401) {
    handleUnauthorized(meta, response.data.message as string | undefined);
    return;
  }

  // 其他业务错误
  if (meta.toast) {
    uni.showToast({
      title: (response.data.msg as string) || "操作失败",
      icon: "none",
    });
  }
}

// --- Refresh Token 刷新机制 ---

/** 是否正在刷新 Token */
let isRefreshing = false;

/** 等待 Token 刷新的请求队列 */
let refreshQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: Error) => void;
}> = [];

/** 标记当前请求是否为 Token 刷新请求，防止递归 */
const REFRESH_URL = "/auth/refresh";

/** 尝试用 refreshToken 刷新 Token，支持并发请求排队 */
async function tryRefreshToken(): Promise<string> {
  const localStore = useLocalStore();
  const refreshToken = localStore.refreshToken;

  // 没有 refreshToken，直接失败
  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  // 如果已经在刷新，加入队列等待结果
  if (isRefreshing) {
    return new Promise<string>((resolve, reject) => {
      refreshQueue.push({ resolve, reject });
    });
  }

  isRefreshing = true;
  try {
    // 使用原始 uni.request 发送刷新请求，绕过拦截器以避免递归
    const res = await new Promise<{
      code: number;
      data?: { token?: string; refreshToken?: string };
    }>((resolve, reject) => {
      uni.request({
        url: `${baseUrl}${REFRESH_URL}`,
        method: "POST",
        data: { refreshToken },
        header: {
          "Content-Type": "application/json",
          "X-Tenant-ID": TENANT_ID,
        },
        success: (res) => {
          const body = res.data as {
            code: number;
            data?: { token?: string; refreshToken?: string };
          };
          resolve(body);
        },
        fail: reject,
      });
    });

    const newToken = res?.data?.token;
    const newRefreshToken = res?.data?.refreshToken;
    if (res?.code === 200 && newToken) {
      localStore.setToken(newToken);
      if (newRefreshToken) localStore.setRefreshToken(newRefreshToken);

      // 通知队列中所有等待的请求
      refreshQueue.forEach(({ resolve }) => resolve(newToken));
      refreshQueue = [];
      return newToken;
    }
    throw new Error("Refresh token failed");
  } catch (err) {
    // 通知队列中所有等待的请求失败
    const error =
      err instanceof Error ? err : new Error("Refresh token failed");
    refreshQueue.forEach(({ reject }) => reject(error));
    refreshQueue = [];
    throw error;
  } finally {
    isRefreshing = false;
  }
}

// 统一处理未授权：先尝试刷新 Token，失败再清数据 + 跳转登录
async function handleUnauthorized(meta: RequestMeta, msg?: string) {
  // 先尝试刷新 Token
  try {
    await tryRefreshToken();
    if (meta.toast) {
      uni.showToast({ title: "已刷新登录状态，请重试", icon: "none" });
    }
    return;
  } catch {
    // 刷新失败，继续执行下方登出逻辑
  }

  // 刷新失败，清数据 + 跳转登录
  const localStore = useLocalStore();
  localStore.logout();
  uni.reLaunch({ url: "/pages/auth/login" });
  if (meta.toast) {
    uni.showToast({ title: msg || "登录已过期，请重新登录", icon: "none" });
  }
}

function getErrorMessage(statusCode: number): string {
  const map: Record<number, string> = {
    400: "请求参数错误",
    401: "登录已过期",
    403: "拒绝访问",
    404: "请求地址不存在",
    405: "请求方法不允许",
    500: "服务器内部错误",
    502: "网关错误",
    503: "服务不可用",
    504: "网关超时",
  };
  return map[statusCode] || `请求错误(${statusCode})`;
}

// --- 文件上传封装 ---

/** 允许上传的文件扩展名白名单 */
const ALLOWED_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "gif",
  "bmp",
  "webp",
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "mp4",
  "mov",
  "avi",
];

/** 校验文件大小和类型 */
function validateFileBeforeUpload(filePath: string): {
  valid: boolean;
  msg?: string;
} {
  // 1. 文件类型校验（通过扩展名）
  const ext = filePath.split(".").pop()?.toLowerCase() || "";
  if (ext && !ALLOWED_EXTENSIONS.includes(ext)) {
    return { valid: false, msg: `不支持的文件格式: .${ext}` };
  }

  // 2. 文件大小校验
  try {
    const stats = uni.getFileSystemManager().statSync(filePath) as unknown;
    const statsObj = (Array.isArray(stats) ? stats[0] : stats) as
      { size?: number } | undefined;
    const fileSize = statsObj?.size ?? 0;
    if (fileSize > UPLOAD_MAX_SIZE * 1024 * 1024) {
      return { valid: false, msg: `文件大小不能超过 ${UPLOAD_MAX_SIZE}MB` };
    }
  } catch {
    // 获取文件信息失败时跳过大小校验（非阻塞）
  }
  return { valid: true };
}

/** 通用文件上传（使用 uni.uploadFile） */
export function uploadFile(
  filePath: string,
  url: string,
): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    // 前端文件校验（大小 + 类型）
    const check = validateFileBeforeUpload(filePath);
    if (!check.valid) {
      uni.showToast({ title: check.msg || "文件校验失败", icon: "none" });
      reject(new Error(check.msg || "文件校验失败"));
      return;
    }

    const token = getRequestToken();

    uni.uploadFile({
      url: `${baseUrl}${url}`,
      filePath,
      name: "file",
      header: buildUploadAuthHeader(token),
      success: (res) => {
        try {
          const data = JSON.parse(res.data);
          resolve(normalizeUploadResponse(data));
        } catch {
          reject(new Error("解析响应失败"));
        }
      },
      fail: reject,
    });
  });
}

/**
 * 带参数的文件上传（支持 formData）
 * @param filePath 文件本地路径
 * @param url 上传地址
 * @param formData 额外表单参数（uuid、fileType 等）
 */
export function uploadFileWithData(
  filePath: string,
  url: string,
  formData: Record<string, string>,
): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    // 前端文件校验（大小 + 类型）
    const check = validateFileBeforeUpload(filePath);
    if (!check.valid) {
      uni.showToast({ title: check.msg || "文件校验失败", icon: "none" });
      reject(new Error(check.msg || "文件校验失败"));
      return;
    }

    const token = getRequestToken();

    uni.uploadFile({
      url: `${baseUrl}${url}`,
      filePath,
      name: "file",
      formData,
      header: buildUploadAuthHeader(token),
      success: (res) => {
        try {
          const data = JSON.parse(res.data);
          resolve(normalizeUploadResponse(data));
        } catch {
          reject(new Error("解析响应失败"));
        }
      },
      fail: reject,
    });
  });
}

function getRequestToken() {
  const localStore = useLocalStore();
  const sessionStore = useSessionStore();
  const roleTags = String(sessionStore.transferInfo?.roleTags || "").trim();

  if (roleTags === "客户" || roleTags.includes("客户")) {
    return tokenUtil.normalize(sessionStore.transferToken || "");
  }

  return tokenUtil.normalize(localStore.token || "");
}

function buildUploadAuthHeader(token: string) {
  const localStore = useLocalStore();
  const header: Record<string, string> = {};
  header["X-Tenant-ID"] = TENANT_ID;
  if (token) {
    header.Authorization = tokenUtil.buildAuthorization(token);
  }
  const orgId = localStore.currentOrgId;
  if (orgId) {
    header["X-Org-Id"] = String(orgId);
  }
  return header;
}
