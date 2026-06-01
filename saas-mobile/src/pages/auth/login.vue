<template>
  <app-page nav-title="登录">
    <view class="login-page">
      <view class="login-card">
        <u-text text="用户名密码登录" size="34rpx" bold />
        <u-gap height="24" />
        <u-input
          v-model="username"
          type="text"
          placeholder="请输入用户名"
          clearable
        />
        <u-gap height="16" />
        <u-input
          v-model="password"
          type="password"
          placeholder="请输入密码"
          clearable
        />
        <u-gap height="24" />
        <u-button type="primary" :loading="loading" @click="handleLogin">
          登录
        </u-button>
      </view>
      <u-gap height="16" />
      <view class="login-tip">
        <u-text
          text="提示：演示账号 zyg / 123456"
          size="24rpx"
          color="info"
        />
      </view>
    </view>
  </app-page>
</template>

<script setup>
import { $u } from "uview-pro";
import { ref } from "vue";
// import { useUserStore } from "@/stores/user";
import { useAuthApi } from "@/api/auth";
import { useLocalStore } from "@/stores/local";
import { useSessionStore } from "@/stores/session";

const authApi = useAuthApi();
const localStore = useLocalStore();
const sessionStore = useSessionStore();
// const userStore = useUserStore();
const username = ref("zyg");
const password = ref("123456");
const loading = ref(false);

/**
 * 处理登录逻辑
 */
const handleLogin = async () => {
  // 1. 验证用户名
  if (!username.value || !username.value.trim()) {
    $u.toast("请输入用户名", "error");
    return;
  }
  // 2. 验证密码
  if (!password.value || password.value.length < 6) {
    $u.toast("密码不能少于6位", "error");
    return;
  }
  // 3. 调用登录接口
  loading.value = true;
  try {
    const res = await authApi.login({
      username: username.value,
      password: password.value,
    });
    if (res.code === 200) {
      const { token, salesman } = res || {};
      sessionStore.clearSession();
      localStore.setToken(token);
      localStore.setUserInfo(salesman);
      $u.toast("登录成功！", "success");
      // 4. 延迟跳转到首页（工作台）
      setTimeout(() => {
        uni.reLaunch({
          url: "/pages/business/workbench",
        });
      }, 500);
    }
  } catch (error) {
    // 登录失败，显示错误信息
    const errorMsg = error?.data?.msg || "登录失败，请重试";
    $u.toast(errorMsg, "error");
    console.error("登录失败:", error);
  } finally {
    loading.value = false;
  }
};
</script>

<style lang="scss" scoped>
.login-page {
  padding: 32rpx 24rpx;

  background: linear-gradient(
    180deg,
    rgba(var(--u-type-primary-rgb, 41, 121, 255), 0.06) 0%,
    transparent 60%
  );
}

.login-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 40rpx 32rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
}

.login-tip {
  text-align: center;
  padding: 0 32rpx;
}
</style>
