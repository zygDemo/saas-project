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
          <view :class="['mode-tab', loginMode === 'password' && 'mode-tab--active']" @click="loginMode = 'password'">
            <text>密码登录</text>
          </view>
          <view :class="['mode-tab', loginMode === 'email' && 'mode-tab--active']" @click="loginMode = 'email'">
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
            custom-style="loginBtnStyle"
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
            custom-style="loginBtnStyle"
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
  } catch (e) {
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
      localStore.setUserRoles(roleKeys);
      localStore.setUserInfo(userInfo || {});
      $u.toast('登录成功');
      const entry = await getInitialMobileEntry();
      uni.reLaunch({ url: entry });
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
    radial-gradient(ellipse 80% 50% at 50% 0%, rgba(190, 200, 255, 0.55) 0%, rgba(190, 200, 255, 0) 70%),
    linear-gradient(180deg, #eef0ff 0%, #f3f4ff 35%, #fafaff 70%, #ffffff 100%);
  padding: 0 48rpx 60rpx;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

/* 顶部柔和光斑 */
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
  filter: blur(40rpx);
  opacity: 0.55;
}
.bg-circle--1 {
  width: 360rpx;
  height: 360rpx;
  top: -120rpx;
  left: -100rpx;
  background: radial-gradient(circle, #c5cdff 0%, rgba(197, 205, 255, 0) 70%);
}
.bg-circle--2 {
  width: 420rpx;
  height: 420rpx;
  top: 80rpx;
  right: -160rpx;
  background: radial-gradient(circle, #d8d0ff 0%, rgba(216, 208, 255, 0) 70%);
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
  padding-top: 160rpx;
  margin-bottom: 60rpx;
}
.brand-logo-wrap {
  width: 144rpx;
  height: 144rpx;
  border-radius: 36rpx;
  overflow: hidden;
  margin-bottom: 28rpx;
  box-shadow:
    0 12rpx 32rpx rgba(79, 92, 180, 0.18),
    0 0 0 6rpx rgba(255, 255, 255, 0.6);
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}
.brand-logo {
  width: 100%;
  height: 100%;
}
.brand-name {
  font-size: 46rpx;
  font-weight: 700;
  color: #1a1d33;
  margin-bottom: 10rpx;
  letter-spacing: 2rpx;
}
.brand-slogan {
  font-size: 26rpx;
  color: #8b93a7;
  letter-spacing: 1rpx;
}

/* ================== 表单卡片 ================== */
.form-card {
  background: #fff;
  border-radius: 28rpx;
  padding: 32rpx 32rpx 28rpx;
  box-shadow:
    0 16rpx 48rpx rgba(60, 72, 140, 0.08),
    0 2rpx 8rpx rgba(60, 72, 140, 0.04);
}
.form-header {
  margin-bottom: 22rpx;
}
.form-title {
  font-size: 36rpx;
  font-weight: 700;
  color: #1a1d33;
  display: block;
  margin-bottom: 6rpx;
  letter-spacing: 1rpx;
}
.form-subtitle {
  font-size: 24rpx;
  color: #9ba1b3;
  display: block;
}

/* ================== 模式切换 ================== */
.mode-tabs {
  display: flex;
  margin-bottom: 22rpx;
  background: #f3f4f9;
  border-radius: 14rpx;
  padding: 5rpx;
}
.mode-tab {
  flex: 1;
  text-align: center;
  padding: 14rpx 0;
  border-radius: 10rpx;
  font-size: 26rpx;
  color: #8b93a7;
  transition: all 0.3s;
}
.mode-tab--active {
  background: #fff;
  color: #4f7cff;
  font-weight: 600;
  box-shadow: 0 2rpx 10rpx rgba(79, 124, 255, 0.12);
}

/* ================== 输入框 ================== */
.form-item {
  display: flex;
  align-items: center;
  background: #f5f7fb;
  border-radius: 16rpx;
  padding: 0 24rpx;
  height: 88rpx;
  margin-bottom: 18rpx;
  border: 2rpx solid transparent;
  transition: all 0.25s ease;
}
.form-item:focus-within {
  background: #fff;
  border-color: #c8d2ff;
  box-shadow: 0 4rpx 16rpx rgba(79, 124, 255, 0.08);
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
  padding: 0 28rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #4f7cff, #6b9bff);
  border-radius: 12rpx;
  font-size: 26rpx;
  color: #fff;
  margin-left: 16rpx;
  font-weight: 500;
  box-shadow: 0 4rpx 12rpx rgba(79, 124, 255, 0.25);
}
.code-btn--disabled {
  background: #c5cad6;
  box-shadow: none;
  color: #fff;
}

/* ================== 登录按钮 ================== */
.login-btn {
  margin-top: 8rpx;
  height: 90rpx;
  border-radius: 18rpx;
  font-size: 30rpx;
  font-weight: 600;
  letter-spacing: 8rpx;
  background: linear-gradient(135deg, #4f7cff 0%, #5b8aff 50%, #6b9bff 100%);
  box-shadow:
    0 10rpx 24rpx rgba(79, 124, 255, 0.35),
    inset 0 -2rpx 0 rgba(0, 0, 0, 0.05);
  color: #fff;
}

/* ================== 演示提示 ================== */
.demo-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 18rpx;
  gap: 8rpx;
}
.demo-tip__text {
  font-size: 24rpx;
  color: #8b93a7;
}

/* ================== 底部协议 ================== */
.footer {
  margin-top: auto;
  padding: 48rpx 0 16rpx;
  text-align: center;
}
.footer__text {
  font-size: 24rpx;
  color: #b0b6c6;
  line-height: 1.6;
}
</style>