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
import { closeBrowser } from "@/composables/useCloseBrowser";

const sessionStore = useSessionStore();

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
  //   fetchResultOnce();
});

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
</style>