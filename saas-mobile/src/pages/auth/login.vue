<template>
  <app-page hide-nav>
    <view class="login-page">
      <!-- 装饰背景 -->
      <view class="bg-decor">
        <view class="bg-circle bg-circle--1" />
        <view class="bg-circle bg-circle--2" />
      </view>

      <!-- 品牌区 -->
      <view class="brand-section">
        <view class="brand-logo-wrap">
          <image class="brand-logo" src="/static/logo.png" mode="aspectFit" />
        </view>
        <text class="brand-name">予艺助手</text>
        <text class="brand-slogan">智能车贷 · 高效办公</text>
      </view>

      <!-- 表单卡片 -->
      <view class="form-card">
        <view class="form-header">
          <text class="form-title">账号登录</text>
          <text class="form-subtitle">欢迎回来，请输入账号信息</text>
        </view>

        <view class="form-item">
          <view class="form-icon">
            <u-icon name="account" size="36rpx" color="#8b93a7" />
          </view>
          <u-input
            v-model="username"
            type="text"
            placeholder="请输入用户名"
            clearable
            autocomplete="username"
            :custom-style="{ paddingLeft: '8rpx' }"
          />
        </view>

        <view class="form-item">
          <view class="form-icon">
            <u-icon name="lock" size="36rpx" color="#8b93a7" />
          </view>
          <u-input
            v-model="password"
            type="password"
            placeholder="请输入密码"
            clearable
            autocomplete="current-password"
            :custom-style="{ paddingLeft: '8rpx' }"
          />
        </view>

        <u-button
          type="primary"
          :loading="loading"
          :custom-style="loginBtnStyle"
          @click="handleLogin"
        >
          登 录
        </u-button>

        <view v-if="showDemoTip" class="demo-tip">
          <u-icon name="info-circle" size="24rpx" color="#8b93a7" />
          <text class="demo-tip__text">开发环境可使用演示账号登录</text>
        </view>
      </view>

      <!-- 底部协议 -->
      <view class="footer">
        <text class="footer__text">登录即代表同意《用户协议》和《隐私政策》</text>
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
import { fetchMobileConfig } from "@/api/mobile-config";
import { getInitialMobileEntry } from "@/common/navigation";
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

const loginBtnStyle = {
  marginTop: "16rpx",
  height: "88rpx",
  borderRadius: "16rpx",
  fontSize: "32rpx",
  fontWeight: "600",
  letterSpacing: "8rpx",
  backgroundImage: "linear-gradient(135deg, #4f7cff, #6366f1)",
  boxShadow: "0 8rpx 24rpx rgba(79, 124, 255, 0.3)",
};

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
      const entry = await resolveMobileEntry();
      setTimeout(() => {
        uni.reLaunch({
          url: entry.route,
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

async function resolveMobileEntry() {
  try {
    const response = await fetchMobileConfig();
    const config = normalizeMobileConfig(response);
    localStore.setMobileConfig(config);
    const entry = getInitialMobileEntry(config);
    localStore.setCurrentSystem(entry.system);
    return entry;
  } catch (error) {
    console.warn("load mobile config failed", error);
    const entry = getInitialMobileEntry(localStore.mobileConfig);
    localStore.setCurrentSystem(entry.system);
    return entry;
  }
}

function normalizeMobileConfig(response) {
  const config = response?.data?.enabled ? response.data : response;
  if (!config || !Array.isArray(config.enabled)) {
    return {
      available: [],
      enabled: [],
      defaultModule: null,
      isMultiModule: true,
    };
  }
  return {
    available: Array.isArray(config.available) ? config.available : [],
    enabled: config.enabled,
    defaultModule: config.defaultModule ?? null,
    isMultiModule: Boolean(config.isMultiModule),
  };
}

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
$primary: #4f7cff;
$text-main: #1a1d29;
$text-body: #4e5566;
$text-hint: #8b93a7;
$text-light: #b0b8cc;
$ease-out: cubic-bezier(0.16, 1, 0.3, 1);

.login-page {
  position: relative;
  min-height: 100vh;
  padding: 0 48rpx;
  background: linear-gradient(180deg, #f0f3ff 0%, #f5f7fa 40%, #f5f7fa 100%);
  overflow: hidden;
}

/* ===== 装饰背景 ===== */
.bg-decor {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 600rpx;
  pointer-events: none;
  overflow: hidden;
}

.bg-circle {
  position: absolute;
  border-radius: 50%;
  filter: blur(2rpx);

  &--1 {
    top: -120rpx;
    right: -80rpx;
    width: 360rpx;
    height: 360rpx;
    background: radial-gradient(circle, rgba(79, 124, 255, 0.18), transparent 70%);
  }

  &--2 {
    top: 80rpx;
    left: -100rpx;
    width: 300rpx;
    height: 300rpx;
    background: radial-gradient(circle, rgba(99, 102, 241, 0.12), transparent 70%);
  }
}

/* ===== 品牌区 ===== */
.brand-section {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 140rpx;
  padding-bottom: 60rpx;
}

.brand-logo-wrap {
  width: 128rpx;
  height: 128rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border-radius: 32rpx;
  box-shadow: 0 8rpx 32rpx rgba(79, 124, 255, 0.18);
  margin-bottom: 24rpx;
}

.brand-logo {
  width: 80rpx;
  height: 80rpx;
}

.brand-name {
  font-size: 40rpx;
  font-weight: 700;
  color: $text-main;
  letter-spacing: 2rpx;
  margin-bottom: 8rpx;
}

.brand-slogan {
  font-size: 24rpx;
  color: $text-hint;
  letter-spacing: 1rpx;
}

/* ===== 表单卡片 ===== */
.form-card {
  position: relative;
  z-index: 1;
  background: #fff;
  border-radius: 24rpx;
  padding: 48rpx 40rpx 40rpx;
  box-shadow: 6rpx 6rpx 16rpx rgba(26, 29, 41, 0.08), -3rpx -3rpx 10rpx rgba(255,255,255,0.9);
}

.form-header {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  margin-bottom: 40rpx;
}

.form-title {
  font-size: 36rpx;
  font-weight: 700;
  color: $text-main;
}

.form-subtitle {
  font-size: 24rpx;
  color: $text-hint;
}

.form-item {
  display: flex;
  align-items: center;
  height: 96rpx;
  padding: 0 24rpx;
  margin-bottom: 24rpx;
  background: #f5f7fa;
  border-radius: 16rpx;
  border: 1rpx solid transparent;
  transition: all 0.2s $ease-out;

  &:focus-within {
    background: #fff;
    border-color: $primary;
    box-shadow: 0 0 0 4rpx rgba(79, 124, 255, 0.1);
  }
}

.form-icon {
  width: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* ===== 演示提示 ===== */
.demo-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  margin-top: 24rpx;
}

.demo-tip__text {
  font-size: 22rpx;
  color: $text-hint;
}

/* ===== 底部 ===== */
.footer {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48rpx 0 calc(48rpx + env(safe-area-inset-bottom));
}

.footer__text {
  font-size: 22rpx;
  color: $text-light;
}

/* ===== 深色模式 ===== */
@media (prefers-color-scheme: dark) {
  .login-page {
    background: linear-gradient(180deg, #1a1d29 0%, #14161f 40%, #14161f 100%);
  }

  .bg-circle--1 {
    background: radial-gradient(circle, rgba(79, 124, 255, 0.25), transparent 70%);
  }
  .bg-circle--2 {
    background: radial-gradient(circle, rgba(99, 102, 241, 0.18), transparent 70%);
  }

  .brand-logo-wrap {
    background: #252836;
  }

  .brand-name {
    color: #f3f4f6;
  }

  .form-card {
    background: #1f2231;
    box-shadow: 0 8rpx 40rpx rgba(0, 0, 0, 0.3);
  }

  .form-title {
    color: #f3f4f6;
  }

  .form-item {
    background: #252836;

    &:focus-within {
      background: #2a2d3e;
      border-color: $primary;
    }
  }

  .footer__text {
    color: #5a6178;
  }
}
</style>
