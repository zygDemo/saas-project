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
        <text class="brand-slogan">智能助手 · 高效办公</text>
      </view>

      <!-- 表单卡片 -->
      <view class="form-card">
        <view class="form-header">
          <text class="form-title">{{ loginMode === 'password' ? '账号登录' : '邮箱登录' }}</text>
          <text class="form-subtitle">{{ loginMode === 'password' ? '欢迎回来，请输入账号信息' : '使用邮箱验证码登录/注册' }}</text>
        </view>

        <!-- 登录模式切换 -->
        <view class="mode-tabs">
          <view class="mode-tab" :class="{ 'mode-tab--active': loginMode === 'password' }" @click="loginMode = 'password'">
            <text>密码登录</text>
          </view>
          <view class="mode-tab" :class="{ 'mode-tab--active': loginMode === 'email' }" @click="loginMode = 'email'">
            <text>邮箱登录</text>
          </view>
        </view>

        <!-- 密码登录表单 -->
        <view v-if="loginMode === 'password'">
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
        </view>

        <!-- 邮箱登录表单 -->
        <view v-else>
          <view class="form-item">
            <view class="form-icon">
              <u-icon name="email" size="36rpx" color="#8b93a7" />
            </view>
            <u-input
              v-model="email"
              type="text"
              placeholder="请输入邮箱地址"
              clearable
              :custom-style="{ paddingLeft: '8rpx' }"
            />
          </view>

          <view class="form-item form-item--code">
            <view class="form-icon">
              <u-icon name="lock" size="36rpx" color="#8b93a7" />
            </view>
            <u-input
              v-model="emailCode"
              type="number"
              placeholder="请输入6位验证码"
              maxlength="6"
              :custom-style="{ paddingLeft: '8rpx' }"
            />
            <view class="code-btn" :class="{ 'code-btn--disabled': countdown > 0 }" @click="handleSendCode">
              <text>{{ countdown > 0 ? `${countdown}s` : '获取验证码' }}</text>
            </view>
          </view>

          <u-button
            type="primary"
            :loading="loading"
            :custom-style="loginBtnStyle"
            @click="handleEmailLogin"
          >
            登录 / 注册
          </u-button>
        </view>

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
const loginMode = ref("password");
const email = ref("");
const emailCode = ref("");
const countdown = ref(0);
let countdownTimer = null;
const showDemoTip = computed(() => isDev);

const loginBtnStyle = {
  marginTop: "8rpx",
  height: "90rpx",
  borderRadius: "18rpx",
  fontSize: "30rpx",
  fontWeight: "600",
  letterSpacing: "8rpx",
  backgroundImage: "linear-gradient(135deg, #4f7cff 0%, #5b8aff 50%, #6b9bff 100%)",
  boxShadow: "0 10rpx 24rpx rgba(79, 124, 255, 0.35)",
};

/**
 * 发送邮箱验证码
 */
const handleSendCode = async () => {
  if (!email.value || !email.value.includes('@')) {
    $u.toast('请输入正确的邮箱地址', 'error');
    return;
  }
  if (countdown.value > 0) return;
  try {
    await authApi.sendEmailCode(email.value, 'login');
    $u.toast('验证码已发送');
    countdown.value = 60;
    countdownTimer = setInterval(() => {
      countdown.value--;
      if (countdown.value <= 0) {
        clearInterval(countdownTimer);
        countdownTimer = null;
      }
    }, 1000);
  } catch {
    // error handled by interceptor
  }
};

/**
 * 邮箱验证码登录
 */
const handleEmailLogin = async () => {
  if (!email.value || !email.value.includes('@')) {
    $u.toast('请输入正确的邮箱地址', 'error');
    return;
  }
  if (!emailCode.value || emailCode.value.length !== 6) {
    $u.toast('请输入6位验证码', 'error');
    return;
  }
  loading.value = true;
  try {
    const res = await authApi.emailLogin(email.value, emailCode.value);
    if (res.code === 200) {
      const payload = res.data || res;
      const token = payload.token || payload.accessToken || res.token;
      const refreshToken = payload.refreshToken || res.refreshToken || '';
      if (!token) {
        $u.toast('登录接口未返回Token', 'error');
        return;
      }
      sessionStore.clearSession();
      localStore.setToken(token);
      localStore.setRefreshToken(refreshToken);
      const fallbackUserInfo = payload.userInfo || payload.user || payload.salesman || res.salesman || null;
      const userInfo = await loadCurrentUserInfo(fallbackUserInfo);
      const roles = normalizeRoles(payload.roles || userInfo?.roles || []);
      const roleKeys = payload.roleKeys || payload.roleCodes || userInfo?.roleKeys || roles.map((role) => role.roleKey || '').filter(Boolean);
      const permissions = payload.permissions || payload.perms || userInfo?.permissions || userInfo?.buttons || [];

      localStore.setUserInfo(userInfo || {});
      localStore.setAuthContext({
        orgId: payload.orgId || userInfo?.orgId || userInfo?.dept?.orgId,
        deptId: payload.deptId || userInfo?.deptId,
        roles,
        roleKeys,
        permissions,
        expires: payload.expires || payload.expiresIn || res.expires,
      });
      $u.toast('登录成功！', 'success');
      const entry = getInitialMobileEntry();
      setTimeout(() => {
        uni.reLaunch({ url: entry.route });
      }, 500);
    }
  } finally {
    loading.value = false;
  }
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

<style scoped lang="scss">
/* ================== 登录页主容器 ================== */
.login-page {
  min-height: 100vh;
  background:
    radial-gradient(ellipse 100% 60% at 50% -10%, rgba(79, 124, 255, 0.15) 0%, rgba(79, 124, 255, 0) 60%),
    radial-gradient(ellipse 80% 50% at 50% 0%, rgba(99, 102, 241, 0.12) 0%, rgba(99, 102, 241, 0) 50%),
    linear-gradient(180deg, #f0f3ff 0%, #f5f7ff 30%, #fafbff 60%, #ffffff 100%);
  padding: 0 48rpx 40rpx;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

/* 顶部柔和光斑 - 增强版 */
.bg-decor {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}
.bg-circle {
  position: absolute;
  border-radius: 50%;
  filter: blur(60rpx);
  opacity: 0.4;
}
.bg-circle--1 {
  width: 500rpx;
  height: 500rpx;
  top: -200rpx;
  left: -150rpx;
  background: radial-gradient(circle, rgba(79, 124, 255, 0.35) 0%, rgba(79, 124, 255, 0) 70%);
}
.bg-circle--2 {
  width: 600rpx;
  height: 600rpx;
  top: 100rpx;
  right: -250rpx;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, rgba(99, 102, 241, 0) 70%);
}

.brand-section,
.form-card,
.footer {
  position: relative;
  z-index: 1;
}

/* ================== 品牌区 ================== */
.brand-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 140rpx;
  margin-bottom: 56rpx;
}
.brand-logo-wrap {
  width: 152rpx;
  height: 152rpx;
  border-radius: 40rpx;
  overflow: hidden;
  margin-bottom: 32rpx;
  box-shadow:
    0 20rpx 40rpx rgba(79, 124, 255, 0.15),
    0 0 0 8rpx rgba(255, 255, 255, 0.8),
    inset 0 2rpx 8rpx rgba(79, 124, 255, 0.06);
  background: linear-gradient(135deg, #ffffff 0%, #f8faff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}
.brand-logo {
  width: 100%;
  height: 100%;
}
.brand-name {
  font-size: 48rpx;
  font-weight: 700;
  color: #0d1526;
  margin-bottom: 12rpx;
  letter-spacing: 1rpx;
  background: linear-gradient(135deg, #0d1526 0%, #1a2332 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.brand-slogan {
  font-size: 26rpx;
  color: #6b7280;
  letter-spacing: 2rpx;
  font-weight: 400;
}

/* ================== 表单卡片 ================== */
.form-card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20rpx);
  border-radius: 32rpx;
  padding: 40rpx 36rpx 36rpx;
  box-shadow:
    0 24rpx 64rpx rgba(79, 124, 255, 0.08),
    0 4rpx 16rpx rgba(79, 124, 255, 0.04),
    0 0 0 1rpx rgba(255, 255, 255, 0.6);
  border: 1rpx solid rgba(255, 255, 255, 0.8);
}
.form-header {
  margin-bottom: 28rpx;
}
.form-title {
  font-size: 38rpx;
  font-weight: 700;
  color: #0d1526;
  display: block;
  margin-bottom: 8rpx;
  letter-spacing: 0.5rpx;
}
.form-subtitle {
  font-size: 26rpx;
  color: #6b7280;
  display: block;
  font-weight: 400;
}

/* ================== 模式切换 ================== */
.mode-tabs {
  display: flex;
  margin-bottom: 28rpx;
  background: rgba(243, 244, 249, 0.8);
  border-radius: 16rpx;
  padding: 6rpx;
  box-shadow: inset 0 2rpx 4rpx rgba(0, 0, 0, 0.04);
}
.mode-tab {
  flex: 1;
  text-align: center;
  padding: 16rpx 0;
  border-radius: 12rpx;
  font-size: 28rpx;
  color: #6b7280;
  transition: all 0.3s ease;
  font-weight: 500;
}
.mode-tab--active {
  background: #fff;
  color: #4f7cff;
  font-weight: 600;
  box-shadow:
    0 4rpx 16rpx rgba(79, 124, 255, 0.12),
    0 0 0 1rpx rgba(79, 124, 255, 0.08);
}

/* ================== 输入框 ================== */
.form-item {
  display: flex;
  align-items: center;
  background: rgba(245, 247, 251, 0.8);
  border-radius: 18rpx;
  padding: 0 28rpx;
  height: 96rpx;
  margin-bottom: 20rpx;
  border: 2rpx solid transparent;
  transition: all 0.3s ease;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.02);
}
.form-item:focus-within {
  background: #fff;
  border-color: rgba(79, 124, 255, 0.3);
  box-shadow:
    0 8rpx 24rpx rgba(79, 124, 255, 0.1),
    0 0 0 4rpx rgba(79, 124, 255, 0.08);
}
.form-item--code {
  display: flex;
  align-items: center;
}
.form-icon {
  margin-right: 20rpx;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

/* ================== 验证码按钮 ================== */
.code-btn {
  flex-shrink: 0;
  padding: 0 32rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #4f7cff 0%, #6366f1 100%);
  border-radius: 14rpx;
  font-size: 26rpx;
  color: #fff;
  margin-left: 20rpx;
  font-weight: 500;
  box-shadow:
    0 8rpx 20rpx rgba(79, 124, 255, 0.3),
    0 0 0 1rpx rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}
.code-btn:active {
  transform: scale(0.98);
  box-shadow: 0 4rpx 12rpx rgba(79, 124, 255, 0.25);
}
.code-btn--disabled {
  background: #d1d5db;
  box-shadow: none;
  color: #9ca3af;
}

/* ================== 登录按钮 ================== */
.login-btn {
  margin-top: 12rpx;
  height: 96rpx;
  border-radius: 20rpx;
  font-size: 32rpx;
  font-weight: 600;
  letter-spacing: 6rpx;
  background: linear-gradient(135deg, #4f7cff 0%, #5b8aff 50%, #6366f1 100%);
  box-shadow:
    0 16rpx 32rpx rgba(79, 124, 255, 0.35),
    0 4rpx 12rpx rgba(79, 124, 255, 0.2),
    inset 0 1rpx 0 rgba(255, 255, 255, 0.2);
  color: #fff;
  transition: all 0.3s ease;
}
.login-btn:active {
  transform: translateY(2rpx);
  box-shadow:
    0 8rpx 20rpx rgba(79, 124, 255, 0.3),
    0 2rpx 8rpx rgba(79, 124, 255, 0.15),
    inset 0 1rpx 0 rgba(255, 255, 255, 0.2);
}

/* ================== 演示提示 ================== */
.demo-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 24rpx;
  gap: 8rpx;
  padding: 16rpx 24rpx;
  background: rgba(79, 124, 255, 0.06);
  border-radius: 12rpx;
}
.demo-tip__text {
  font-size: 24rpx;
  color: #4f7cff;
  font-weight: 500;
}

/* ================== 底部协议 ================== */
.footer {
  margin-top: auto;
  padding: 40rpx 0 24rpx;
  text-align: center;
}
.footer__text {
  font-size: 24rpx;
  color: #9ca3af;
  line-height: 1.6;
  font-weight: 400;
}
</style>
