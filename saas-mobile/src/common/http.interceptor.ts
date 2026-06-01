import type {
  RequestConfig,
  RequestInterceptor,
  RequestMeta,
  RequestOptions,
} from "uview-pro";
import { useLocalStore } from "@/stores/local";
import { useSessionStore } from "@/stores/session";

// 基础配置
const baseUrl =
  import.meta.env.VITE_API_BASE_URL || "http://122.51.140.89:10088";

export const httpRequestConfig: RequestConfig = {
  baseUrl,
  header: {
    "content-type": "application/json",
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
      config.header["M-Authorization"] = `Bearer ${token}`;
    }

    return config;
  },

  response: (response: any) => {
    const meta: RequestMeta = response.config?.meta || {};

    // 1. 统一关闭 Loading
    if (meta.loading) {
      uni.hideLoading();
    }

    // 2. HTTP 状态码错误 (非 200)
    if (response.statusCode !== 200) {
      handleHttpError(response, meta);
      // 返回 false 让请求进入 catch，阻断后续代码
      return false;
    }

    // 3. 业务状态码错误 (code !== 200)
    if (response.data && response.data.code !== 200) {
      handleBusinessError(response, meta);
      return false;
    }

    // 4. 返回成功数据
    return response.data;
  },
};

// --- 错误处理辅助函数 ---

function handleHttpError(response: any, meta: RequestMeta) {
  // 401 - 未授权
  if (response.statusCode === 401) {
    handleUnauthorized(meta);
    return;
  }

  // 其他 HTTP 错误
  const msg = getErrorMessage(response.statusCode);
  if (meta.toast) {
    uni.showToast({ title: msg, icon: "none" });
  }
}

function handleBusinessError(response: any, meta: RequestMeta) {
  // 业务层面的 401 (Token 过期)
  if (response.data.code === 401) {
    handleUnauthorized(meta, response.data.message);
    return;
  }

  // 其他业务错误
  if (meta.toast) {
    uni.showToast({
      title: response.data.msg || "操作失败",
      icon: "none",
    });
  }
}

// 统一处理未授权：清数据 + 跳转登录
function handleUnauthorized(meta: RequestMeta, msg?: string) {
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

/** 通用文件上传（使用 uni.uploadFile） */
export function uploadFile(filePath: string, url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const token = getRequestToken();

    uni.uploadFile({
      url: `${baseUrl}${url}`,
      filePath,
      name: "file",
      header: {
        "M-Authorization": token ? `Bearer ${token}` : "",
      },
      success: (res) => {
        try {
          const data = JSON.parse(res.data);
          resolve(data);
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
): Promise<any> {
  return new Promise((resolve, reject) => {
    const token = getRequestToken();

    uni.uploadFile({
      url: `${baseUrl}${url}`,
      filePath,
      name: "file",
      formData,
      header: {
        "M-Authorization": token ? `Bearer ${token}` : "",
      },
      success: (res) => {
        try {
          const data = JSON.parse(res.data);
          resolve(data);
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
    return sessionStore.transferToken || "";
  }

  return localStore.token || "";
}
