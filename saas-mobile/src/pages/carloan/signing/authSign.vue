<template>
  <app-page nav-title="签署授权" :show-nav-back="!isCustomerRole">
    <view class="auth-sign-page">
      <web-view v-if="authUrl" :src="authUrl" />
      <web-view v-else-if="previewUrl" :src="previewUrl" />
      <view v-else class="empty-tip">
        <u-icon name="warning" size="60" color="#ff4d4f" />
        <text class="tip-text">{{ emptyTip }}</text>
        <u-button type="primary" size="medium" @click="isCustomerRole ? closeBrowser() : goBack()">
          {{ isCustomerRole ? "关闭" : "返回" }}
        </u-button>
      </view>
    </view>
  </app-page>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onLoad, onShow, onBackPress } from "@dcloudio/uni-app";
import { useSessionStore } from "@/stores";
import { useCarloanApi } from "@/api/carloan";
import { closeBrowser } from "@/composables/useCloseBrowser";

const sessionStore = useSessionStore();
const businessApi = useCarloanApi();

const authUrl = ref("");
const previewUrl = ref("");
const creditOrderId = ref("");
const uuid = ref("");
const signType = ref<"face" | "contract">("face");
const mode = ref<"sign" | "preview">("sign");
const hasFetched = ref(false);
const emptyTip = computed(() =>
  mode.value === "preview" ? "预览地址无效" : "授权地址无效",
);
const isCustomerRole = computed(() => {
  const roleTags = String(sessionStore.transferInfo?.roleTags || "");
  return roleTags === "客户" || roleTags.includes("客户");
});

onLoad((options) => {
  authUrl.value = options?.authUrl ? decodeURIComponent(options.authUrl) : "";
  previewUrl.value = options?.previewUrl
    ? decodeURIComponent(options.previewUrl)
    : "";
  creditOrderId.value = options?.creditOrderId || "";
  uuid.value = options?.uuid || "";
  signType.value = (options?.type as "face" | "contract") || "face";
  mode.value = (options?.mode as "sign" | "preview") || "sign";
  hasFetched.value = false;
});

// 从三方授权返回后，仅调用一次接口获取结果
onShow(() => {
  if (!creditOrderId.value || hasFetched.value) return;
  hasFetched.value = true;
  fetchResultOnce();
});

async function fetchResultOnce() {
  try {
    // 查询订单详情确认签约状态
    const res = await businessApi.getCreditDetailByOrderId(creditOrderId.value);
    if (res?.code === 200 && res.data) {
      const d = res.data;
      const nodeStatus = d.currentStatus || d.nodeStatus || d.status;

      // 根据签约类型更新本地进度
      if (signType.value === "contract") {
        if (nodeStatus === "SIGNED" || d.isSignContract === 1) {
          saveSignProgress("SIGNED");
        } else {
          // 签约完成，推进到下一步
          saveSignProgress("GPS_APPOINTING");
        }
      } else {
        // 面签完成
        saveSignProgress("GPS_APPOINTING");
      }
    }
  } catch (e) {
    console.error("获取签约结果失败", e);
  } finally {
    // 返回签约中心刷新状态
    uni.navigateBack();
  }
}

const SIGN_PROGRESS_STORAGE_KEY = "SIGN_PROGRESS_MAP";

function saveSignProgress(status: string) {
  if (!creditOrderId.value || !status) return;
  const progressMap = uni.getStorageSync(SIGN_PROGRESS_STORAGE_KEY) || {};
  progressMap[creditOrderId.value] = {
    ...(progressMap[creditOrderId.value] || {}),
    status,
    updatedAt: Date.now(),
  };
  uni.setStorageSync(SIGN_PROGRESS_STORAGE_KEY, progressMap);
}

onBackPress(() => {
  if (isCustomerRole.value) {
    closeBrowser();
    return true;
  }

  uni.showModal({
    title: "提示",
    content: "授权尚未完成，确定退出吗？",
    success: (res) => {
      if (res.confirm) uni.navigateBack();
    },
  });
  return true;
});

function goBack() {
  uni.navigateBack();
}
</script>

<style lang="scss" scoped>
.auth-sign-page {
  width: 100%;
  height: 100%;
  web-view {
    width: 100%;
    height: 100%;
  }
}
.empty-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24rpx;
  padding-top: 200rpx;
  .tip-text {
    font-size: 28rpx;
    color: #8c8c8c;
  }
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .page-container { background-color: #121212; }
  .card { background-color: #1e1e1e; }
  .card-item { background-color: #1e1e1e; }
  .list-item { background-color: #1e1e1e; }
  .section { background-color: #1e1e1e; }
  .form-item { background-color: #1e1e1e; border-color: #2a2a2a; }
  .title { color: #e5e6eb; }
  .subtitle { color: #8b8c91; }
  .desc { color: #8b8c91; }
  .label { color: #b0b3b8; }
  .value { color: #e5e6eb; }
  .name { color: #e5e6eb; }
  .info { color: #b0b3b8; }
  .text { color: #e5e6eb; }
  .tip { color: #8b8c91; }
  .divider { background-color: #2a2a2a; }
  .border { border-color: #2a2a2a; }
  .input { background-color: #2a2a2a; color: #e5e6eb; }
  .textarea { background-color: #2a2a2a; color: #e5e6eb; }
  .picker { background-color: #2a2a2a; color: #e5e6eb; }
  .footer { background-color: #1e1e1e; }
}
</style>