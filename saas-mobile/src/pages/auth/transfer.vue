<template>
  <app-page nav-title="嗨车无忧">
    <view class="transfer-page">
      <view class="status-panel">
        <u-loading mode="circle" size="52" color="#2979ff" />
        <text class="status-title">{{ statusTitle }}</text>
        <text class="status-desc">{{ statusDesc }}</text>
      </view>
    </view>

    <!-- 二次确认弹窗，仅开发环境使用 -->
    <app-confirm v-if="isDev" ref="confirmRef" />
  </app-page>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { useLocalStore, useSessionStore } from "@/stores";
import type { TransferInfo } from "@/stores/session";
import { useAuthApi } from "@/api/auth";
import { useConfirm } from "@/composables/useConfirm";
import { isDev } from "@/common/env";

type NavigateType = "redirectTo" | "reLaunch";
type QueryValue = string | undefined;

interface TransferQuery extends TransferInfo {
  transferInfo?: string;
}

type TransferUrlParams = Partial<TransferInfo>;

const TRANSFER_FIELD_KEYS = [
  "path",
  "salesmanId",
  "expirationTime",
  "roleTags",
  "orderId",
  "creditOrderId",
  "uuid",
  "businessType",
] as const;

const HOME_PAGE = "/pages/business/workbench";
const LOGIN_PAGE = "/pages/auth/login";

const localStore = useLocalStore();
const sessionStore = useSessionStore();
const authApi = useAuthApi();
const { confirmRef, confirm } = useConfirm();

const loadingText = ref("正在处理跳转信息");
const errorText = ref("");

const statusTitle = computed(() =>
  errorText.value ? "跳转失败" : loadingText.value,
);
const statusDesc = computed(() =>
  errorText.value || "请稍候,系统正在为你打开目标页面。",
);

onLoad((options) => {
  const query = resolveTransferInfo(normalizeQuery(options || {}));
  initTransfer(query);
});

async function initTransfer(query: TransferQuery) {
  try {
    validateExpiration(query);
    const transferInfo = pickTransferInfo(query);

    sessionStore.clearSession();
    cacheTransferContext(transferInfo);

    if (!transferInfo.salesmanId) {
      throw new Error("缺少业务员ID，请联系客户经理重新生成二维码");
    }

    // 如果有 salesmanId，调用接口获取 token 并存储到会话存储
    loadingText.value = "正在获取授权信息";
    try {
      const result = await authApi.getToken(transferInfo.salesmanId);
      const token = result?.data || result?.token || "";
      if (token) {
        localStore.logout();
        sessionStore.setToken(token);
        console.log("Token 已成功存储到会话存储");
      }
    } catch (tokenError: any) {
      console.error("获取 Token 失败:", tokenError);
      // Token 获取失败不阻断流程，继续跳转
    }
    loadingText.value = "正在处理跳转信息";

    const target = normalizeTargetPath(query.path) || getFallbackPage();
    const url = buildTargetUrl(target, transferInfo);
    navigate(url, target === HOME_PAGE ? "reLaunch" : "redirectTo");
  } catch (error: any) {
    console.error("中转页处理失败:", error);
    errorText.value = error?.message || "处理失败,请重新进入";
    uni.showToast({ title: errorText.value, icon: "none" });
    setTimeout(() => {
      uni.reLaunch({ url: LOGIN_PAGE });
    }, 900);
  }
}

function validateExpiration(query: TransferQuery) {
  const expirationTime = Number(query.expirationTime || 0);
  if (!expirationTime || Number.isNaN(expirationTime)) {
    return;
  }

  if (Date.now() > expirationTime) {
    throw new Error("二维码已过期，请重新获取");
  }
}

function cacheTransferContext(info: TransferInfo) {
  sessionStore.setTransferInfo(info);
}

function getFallbackPage() {
  if (!localStore.token) {
    return LOGIN_PAGE;
  }
  return HOME_PAGE;
}

function buildTargetUrl(target: string, query: TransferInfo) {
  const params: TransferUrlParams = {
    salesmanId: query.salesmanId,
    expirationTime: query.expirationTime,
    roleTags: query.roleTags,
    orderId: query.orderId,
    creditOrderId: query.creditOrderId,
    uuid: query.uuid,
    businessType: query.businessType,
  };

  return buildUrl(target, params);
}

function normalizeTargetPath(path?: QueryValue) {
  if (!path) return "";

  const pathMap: Record<string, string> = {
    login: LOGIN_PAGE,
    userPage: HOME_PAGE,
    layout: HOME_PAGE,
    workbench: HOME_PAGE,
    leadAdd: "/pages/business/leadAdd",
    orderList: "/pages/business/orderList",
    my: "/pages/my/my",
    idInfo: "/pages/business/idInfo",
    carInfo: "/pages/business/carInfo",
    applyInfo: "/pages/business/applyInfo",
    supplementInfo: "/pages/business/supplementDetail",
    carInfoPage: "/pages/business/carInfoSupplement",
    idInfoPage: "/pages/business/idInfoSupplement",
    orderInfoPage: "/pages/business/orderInfoSupplement",
    fileInfoPage: "/pages/business/fileInfoSupplement",
    creditConfirmDetails: "/pages/business/applyDetail",
    customerContract: "/pages/business/videoFaceSign",
    filePreview: "/pages/business/faceSignResult",
  };

  if (pathMap[path]) return pathMap[path];
  if (path.startsWith("/pages/")) return path;
  if (path.startsWith("pages/")) return `/${path}`;
  if (path.startsWith("/")) return path;
  return `/pages/business/${path}`;
}

function buildUrl(path: string, params: TransferUrlParams) {
  const query = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
    .join("&");
  return query ? `${path}?${query}` : path;
}

function navigate(url: string, type: NavigateType = "redirectTo") {
  // 更新状态
  loadingText.value = isDev ? "等待确认" : "正在打开目标页面";

  const doNavigate = () => {
    loadingText.value = "正在打开目标页面";
    if (type === "reLaunch") {
      uni.reLaunch({ url });
    } else {
      uni.redirectTo({ url });
    }
  };

  if (!isDev) {
    doNavigate();
    return;
  }

  // 二次确认后跳转目标页面
  nextTick(() => {
    if (confirmRef.value) {
      confirm("即将跳转到目标页面，是否继续？", doNavigate);
      return;
    }

    uni.showModal({
      title: "提示",
      content: "即将跳转到目标页面，是否继续？",
      confirmText: "确认",
      cancelText: "取消",
      success: (res) => {
        if (res.confirm) {
          doNavigate();
          return;
        }
        loadingText.value = "已取消跳转";
      },
    });
  });
}

function normalizeQuery(
  options: Record<string, string | string[] | undefined | null>,
): TransferQuery {
  const query = Object.fromEntries(
    Object.entries(options).map(([key, value]) => [
      key,
      Array.isArray(value) ? String(value[0] || "") : String(value ?? ""),
    ]),
  ) as TransferQuery;

  return {
    ...pickTransferInfo(query),
    transferInfo: query.transferInfo,
  };
}

function resolveTransferInfo(query: TransferQuery): TransferQuery {
  if (!query.transferInfo) {
    return query;
  }

  return {
    ...query,
    ...normalizeTransferInfo(parseTransferInfo(query.transferInfo)),
  };
}

function parseTransferInfo(raw: string): TransferInfo {
  const decoded = safeDecode(raw);
  if (!decoded) return {} as TransferInfo;

  try {
    const parsed = JSON.parse(decoded);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as TransferInfo;
    }
  } catch {
    // 兼容 transferInfo=path%3DidInfo%26salesmanId%3D8 这类查询串格式
  }

  const queryString = decoded.startsWith("?") ? decoded.slice(1) : decoded;
  return Object.fromEntries(
    queryString
      .split("&")
      .filter(Boolean)
      .map((item) => {
        const [key, ...valueParts] = item.split("=");
        return [key, safeDecode(valueParts.join("="))];
      }),
  ) as TransferInfo;
}

function normalizeTransferInfo(info: TransferInfo): TransferQuery {
  return pickTransferInfo(Object.fromEntries(
    Object.entries(info).map(([key, value]) => [key, value == null ? "" : String(value)]),
  ) as TransferQuery);
}

function pickTransferInfo(query: TransferQuery): TransferInfo {
  return Object.fromEntries(
    TRANSFER_FIELD_KEYS
      .map((key) => [key, query[key]])
      .filter(([, value]) => value !== undefined && value !== null && value !== ""),
  ) as TransferInfo;
}

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
</script>

<style lang="scss" scoped>
.transfer-page {
  min-height: 100vh;
  padding: 48rpx 32rpx;
  background: linear-gradient(180deg, #f4f8ff 0%, #f8fafc 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-panel {
  width: 100%;
  background: #fff;
  border-radius: 16rpx;
  padding: 56rpx 40rpx;
  box-shadow: 0 8rpx 28rpx rgba(41, 121, 255, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
  text-align: center;
}

.status-title {
  font-size: 34rpx;
  font-weight: 700;
  color: #1f2937;
}

.status-desc {
  font-size: 26rpx;
  color: #6b7280;
  line-height: 1.6;
}
</style>
