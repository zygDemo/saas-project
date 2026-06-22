<template>
  <app-page nav-title="登录">
    <view class="login-page">
      <view class="login-card">
        <view class="login-brand">
          <image class="login-logo" src="/static/logo.png" mode="aspectFit" />
          <text class="login-app-name">予艺助手</text>
        </view>
        <u-text text="账号登录" size="30rpx" color="u-content" />
        <u-gap height="24" />
        <view class="form-item">
          <text class="form-label">用户名</text>
          <u-input
            v-model="username"
            type="text"
            placeholder="请输入用户名"
            clearable
            autocomplete="username"
          />
        </view>
        <u-gap height="16" />
        <view class="form-item">
          <text class="form-label">密码</text>
          <u-input
            v-model="password"
            type="password"
            placeholder="请输入密码"
            clearable
            autocomplete="current-password"
          />
        </view>
        <u-gap height="32" />
        <u-button type="primary" :loading="loading" @click="handleLogin">
          登录
        </u-button>
      </view>
      <u-gap height="16" />
      <view v-if="showDemoTip" class="login-tip">
        <u-text
          text="开发环境可使用后端配置的演示账号登录"
          size="24rpx"
          color="u-content"
        />
      </view>
    </view>
  </app-page>
</template>

<script setup>
import { $u } from "uview-pro";
import { computed, ref } from "vue";
// import { useUserStore } from "@/stores/user";
import { isDev } from "@/common/env";
import { useAuthApi } from "@/api/auth";
import { useLocalStore } from "@/stores/local";
import { useSessionStore } from "@/stores/session";

const authApi = useAuthApi();
const localStore = useLocalStore();
const sessionStore = useSessionStore();
// const userStore = useUserStore();
const username = ref("Super");
const password = ref("123456");
const loading = ref(false);
const showDemoTip = computed(() => isDev);

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
      userName: username.value,
      password: password.value,
    });
    if (res.code === 200) {
      const payload = res.data || res;
      const token = payload.token || payload.accessToken || res.token;
      const refreshToken = payload.refreshToken || res.refreshToken || "";

      if (!token) {
        $u.toast("登录接口未返回Token", "error");
        return;
      }

      sessionStore.clearSession();
      localStore.setToken(token);
      localStore.setRefreshToken(refreshToken);
      const fallbackUserInfo =
        payload.userInfo || payload.user || payload.salesman || res.salesman || null;
      const userInfo = await loadCurrentUserInfo(fallbackUserInfo);
      const roles = normalizeRoles(payload.roles || userInfo?.roles || []);
      const roleKeys =
        payload.roleKeys ||
        payload.roleCodes ||
        userInfo?.roleKeys ||
        roles.map((role) => role.roleKey || "").filter(Boolean);
      const permissions =
        payload.permissions || payload.perms || userInfo?.permissions || userInfo?.buttons || [];

      localStore.setUserInfo(userInfo);
      localStore.setAuthContext({
        orgId: payload.orgId || userInfo?.orgId || userInfo?.dept?.orgId,
        deptId: payload.deptId || userInfo?.deptId,
        roles,
        roleKeys,
        permissions,
        expires: payload.expires || payload.expiresIn || res.expires,
      });
      $u.toast("登录成功！", "success");
      // 4. 延迟跳转到首页（工作台）
      setTimeout(() => {
        uni.reLaunch({
          url: "/pages/index/index",
        });
      }, 500);
    } else {
      $u.toast(res.msg || "登录失败，请检查账号或密码", "error");
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

async function loadCurrentUserInfo(fallbackUserInfo) {
  try {
    const infoRes = await authApi.getUserInfo();
    const info = infoRes.data || infoRes;
    return normalizeUserInfo(info || fallbackUserInfo);
  } catch (error) {
    console.warn("获取当前用户信息失败，使用登录响应兜底:", error);
    return normalizeUserInfo(fallbackUserInfo);
  }
}

function normalizeUserInfo(info) {
  if (!info) return null;
  const roles = normalizeRoles(info.roles || []);
  return {
    ...info,
    roles,
    roleKeys: info.roleKeys || roles.map((role) => role.roleKey || "").filter(Boolean),
    permissions: info.permissions || info.buttons || [],
  };
}

function normalizeRoles(roles) {
  if (!Array.isArray(roles)) return [];
  return roles.map((role) => {
    if (typeof role === "string") {
      return {
        roleId: 0,
        roleName: role,
        roleKey: role,
      };
    }
    return role;
  });
}
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

.login-brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 24rpx;
}

.login-logo {
  width: 96rpx;
  height: 96rpx;
  border-radius: 20rpx;
  margin-bottom: 16rpx;
}

.login-app-name {
  font-size: 32rpx;
  font-weight: 600;
  color: #1f2937;
  letter-spacing: 0.02em;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.form-label {
  font-size: 26rpx;
  color: #4b5563;
  font-weight: 500;
}

.login-tip {
  text-align: center;
  padding: 0 32rpx;
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .login-card {
    background: #1f2937;
  }
  .login-app-name {
    color: #f3f4f6;
  }
  .form-label {
    color: #d1d5db;
  }
}
</style>
