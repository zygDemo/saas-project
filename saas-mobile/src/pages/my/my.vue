<template>
  <layout :active-tab="2" navTitle="我的" show-tabbar>
    <view class="about-page">
      <!-- 用户信息卡片 -->
      <view class="hero-card" @click="handleUserCardClick">
        <view class="hero-card__bg" />
        <view class="hero-card__content">
          <view class="hero-avatar">
            <view class="hero-avatar__wrapper">
              <u-avatar
                :text="userName.charAt(0)"
                size="160"
                bg-color="#fff"
                color="#2979ff"
              />
            </view>
          </view>
          <view class="hero-info">
            <view class="hero-info__name">
              <text class="hero-info__name-text">
                {{ userName }}
              </text>
              <view class="hero-info__badge">
                {{ userRole }}
              </view>
            </view>
            <view class="hero-info__desc">
              <text>{{ userPhone }}</text>
            </view>
            <view class="hero-info__tagline"> 车贷业务移动办公平台 </view>
          </view>
        </view>
      </view>

      <!-- 业务统计 -->
      <view class="stats-card">
        <view class="stats-item">
          <text class="stats-value">{{ businessStats.totalLeads }}</text>
          <text class="stats-label">累计线索</text>
        </view>
        <view class="stats-divider" />
        <view class="stats-item">
          <text class="stats-value">{{ businessStats.totalDeals }}</text>
          <text class="stats-label">进件</text>
        </view>
        <view class="stats-divider" />
        <view class="stats-item">
          <text class="stats-value">{{ businessStats.pendingApproval }}</text>
          <text class="stats-label">放款笔数</text>
        </view>
        <view class="stats-divider" />
        <view class="stats-item">
          <text class="stats-value">{{ businessStats.monthlyAmount }}</text>
          <text class="stats-label">放款金额</text>
        </view>
      </view>
      <!-- 功能列表 -->
      <view class="menu-section">
        <view class="menu-list">
          <view
            v-for="(item, index) in menuList"
            :key="index"
            class="menu-card"
            :style="{ animationDelay: `${index * 0.08}s` }"
            @click="navigateTo(item.path)"
          >
            <view
              class="menu-card__icon"
              :style="{ background: item.gradient }"
            >
              <u-icon :name="item.icon" size="48" color="#fff" />
            </view>
            <view class="menu-card__info">
              <text class="menu-card__title">{{ item.title }}</text>
              <text class="menu-card__desc">{{ item.desc }}</text>
            </view>
            <u-icon name="arrow-right" size="28" color="#c0c4cc" />
          </view>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="action-section">
        <u-button
          type="warning"
          shape="circle"
          icon="trash"
          @click="handleClearCache"
        >
          清除缓存
        </u-button>
        <u-button
          v-if="userInfo"
          type="error"
          shape="circle"
          icon="close-circle"
          @click="handleLogout"
        >
          退出登录
        </u-button>
      </view>
    </view>
  </layout>
</template>

<script setup lang="ts">
import layout from "@/pages/layout/layout.vue";
import { useLocalStore, useSessionStore } from "@/stores";
import { $u, useTheme } from "uview-pro";
import { computed, ref } from "vue";
import { storeToRefs } from "pinia";
import { useI18n } from "vue-i18n";
import { useBusinessApi } from "@/api/business";

useI18n();
const sessionStore = useSessionStore();
const localStore = useLocalStore();
const businessApi = useBusinessApi();
const { userInfo } = storeToRefs(localStore);
const { initTheme, setDarkMode } = useTheme();

// 用户信息
const userName = computed(() => {
  const name = userInfo.value?.userName as string;
  return name || "未登录";
});

const userPhone = computed(() => {
  const phone = String(userInfo.value?.phonenumber || "");
  return phone ? `${phone.slice(0, 3)}****${phone.slice(-4)}` : "";
});

const userRole = computed(() => {
  const role = userInfo.value?.role as string;
  const roleMap: Record<string, string> = {
    sales: "业务员",
    approver: "审批员",
    admin: "管理员",
  };
  return roleMap[role] || "业务员";
});

// 业务统计
const businessStats = ref({
  totalLeads: 0,
  totalDeals: 0,
  pendingApproval: 0,
  monthlyAmount: "0",
});

/** 加载业务统计 */
async function loadBusinessStats() {
  try {
    const res: any = await businessApi.getStatisticsOverview();
    if (res?.code === 200) {
      const { leadCount, entryCount, loanCount, loanAmount } = res;
      businessStats.value = {
        totalLeads: leadCount ?? 0,
        totalDeals: entryCount ?? 0,
        pendingApproval: loanCount ?? 0,
        monthlyAmount: formatLoanAmount(loanAmount),
      };
    }
  } catch (e) {
    console.error("获取业务统计失败:", e);
  }
}

/** 格式化放款金额 */
function formatLoanAmount(amount: unknown) {
  if (amount == null) return "0";
  const num = Number(amount);
  if (num >= 10000) {
    return `${(num / 10000).toFixed(1)}万`;
  }
  return String(num);
}

// 功能菜单列表 - 网格样式
// 功能列表 - 仅保留这几个，从上往下依次排列
const menuList = ref([
  // {
  //   icon: "setting",
  //   title: "个人设置",
  //   desc: "修改资料与偏好",
  //   path: "/pages/my/settings",
  //   gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  // },
  {
    icon: "question-circle",
    title: "帮助中心",
    desc: "常见问题解答",
    path: "/pages/my/faq",
    gradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  },
  {
    icon: "file-text",
    title: "隐私政策",
    desc: "了解隐私保护",
    path: "/pages/my/privacy",
    gradient: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
  },
  {
    icon: "file-text-fill",
    title: "用户协议",
    desc: "服务条款与协议",
    path: "/pages/my/agreement",
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  },
]);

/**
 * 清除缓存
 * 清除本地存储和会话存储的所有数据，并重置主题设置
 */
function handleClearCache() {
  uni.showModal({
    title: "清除缓存",
    content: "将清除所有本地数据和会话，需要重新登录",
    success: (res) => {
      if (res.confirm) {
        try {
          // 清除会话存储
          uni.clearStorageSync();
          // 清除状态管理
          sessionStore.clearSession();
          // 重置主题为默认主题（海洋蓝）
          initTheme(undefined, undefined, true);
          setDarkMode("light");
          $u.toast("缓存已清除");
          // 延迟跳转到登录页
          setTimeout(() => {
            uni.reLaunch({
              url: "/pages/auth/login",
            });
          }, 800);
        } catch (err) {
          console.error("清除缓存失败:", err);
          $u.toast("清除缓存失败", "error");
        }
      }
    },
  });
}

/**
 * 退出登录
 * 为什么：统一处理登出逻辑，清理状态并跳转
 */
function handleLogout() {
  uni.showModal({
    title: "确认退出",
    content: "退出后需要重新登录",
    success: (res) => {
      if (res.confirm) {
        sessionStore.clearSession();
        $u.toast("已退出登录");
        setTimeout(() => {
          uni.reLaunch({ url: "/pages/auth/login" });
        }, 500);
      }
    },
  });
}

/**
 * 点击用户卡片
 * 未登录时点击跳转登录页
 */
function handleUserCardClick() {
  if (!userInfo.value) {
    uni.navigateTo({
      url: "/pages/auth/login",
    });
  }
}

/**
 * 导航到指定页面
 */
function navigateTo(path: string) {
  uni.navigateTo({
    url: path,
  });
}

// 初始化加载业务统计
loadBusinessStats();
</script>

<style lang="scss" scoped>
.about-page {
  padding: 24rpx;
  background: linear-gradient(
    180deg,
    rgba(41, 121, 255, 0.1) 0%,
    transparent 100%
  );
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

// Hero 卡片
.hero-card {
  position: relative;
  margin: 0 0 8rpx;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 12rpx 32rpx rgba(41, 121, 255, 0.2);
  transition: all 0.3s ease;

  &:active {
    transform: scale(0.98);
  }

  &__bg {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, #2979ff 0%, #19be6b 50%, #ff9900 100%);
    opacity: 0.95;

    &::before {
      content: "";
      position: absolute;
      top: -50%;
      right: -20%;
      width: 200%;
      height: 200%;
      background: radial-gradient(
        circle,
        rgba(255, 255, 255, 0.2) 0%,
        transparent 70%
      );
      animation: heroGlow 8s ease-in-out infinite;
    }
  }

  &__content {
    position: relative;
    z-index: 2;
    padding: 40rpx 32rpx;
    display: flex;
    align-items: center;
    gap: 24rpx;
  }
}

@keyframes heroGlow {
  0%,
  100% {
    transform: rotate(0deg);
    opacity: 0.3;
  }
  50% {
    transform: rotate(180deg);
    opacity: 0.6;
  }
}

.hero-avatar {
  flex-shrink: 0;

  &__wrapper {
    position: relative;
    width: 160rpx;
    height: 160rpx;
    filter: drop-shadow(0 8rpx 16rpx rgba(0, 0, 0, 0.2));
  }

  &__ring {
    position: absolute;
    top: -8rpx;
    left: -8rpx;
    right: -8rpx;
    bottom: -8rpx;
    border: 4rpx solid rgba(255, 255, 255, 0.6);
    border-radius: 50%;
    animation: ringRotate 3s linear infinite;
    box-shadow: 0 0 20rpx rgba(255, 255, 255, 0.3);
  }
}

@keyframes ringRotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.hero-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12rpx;

  &__name {
    display: flex;
    align-items: center;
    gap: 12rpx;
  }

  &__name-text {
    font-size: 44rpx;
    font-weight: 800;
    color: #ffffff;
    letter-spacing: 2rpx;
    text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.2);
  }

  &__badge {
    padding: 4rpx 12rpx;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 8rpx;
    font-size: 20rpx;
    font-weight: 700;
    color: #ffffff;
    letter-spacing: 1rpx;
    backdrop-filter: blur(10rpx);
  }

  &__desc {
    display: flex;
    align-items: center;
    gap: 8rpx;
    font-size: 26rpx;
    color: rgba(255, 255, 255, 0.9);
  }

  &__desc-icon {
    font-size: 28rpx;
  }

  &__tagline {
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.8);
    margin-top: 4rpx;
  }
}

.hero-arrow {
  flex-shrink: 0;
  opacity: 0.8;
  transition: all 0.3s ease;
}

.hero-card:active .hero-arrow {
  transform: translateX(4rpx);
}

// 统计卡片
.stats-card {
  display: flex;
  align-items: center;
  justify-content: space-around;
  background: $u-bg-white;
  border-radius: 20rpx;
  padding: 32rpx 24rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.06);

  .stats-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8rpx;
    flex: 1;
  }

  .stats-value {
    font-size: 36rpx;
    font-weight: 700;
    color: $u-type-primary;
  }

  .stats-label {
    font-size: 24rpx;
    color: $u-tips-color;
  }

  .stats-divider {
    width: 1rpx;
    height: 60rpx;
    background: #e5e5e5;
  }
}

// 清除缓存和退出登录按钮区域
.action-section {
  padding: 32rpx 24rpx;
  margin-top: 16rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;

  :deep(.u-btn) {
    width: 100%;
  }
}

.spacer {
  height: 20rpx;
}

// 区块卡片
.section-card {
  background: $u-bg-gray-light;
  border-radius: 20rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.06);
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 12rpx 32rpx rgba(41, 121, 255, 0.12);
  }

  &__header {
    padding: 28rpx 32rpx;
    display: flex;
    align-items: center;
    gap: 16rpx;
    background: linear-gradient(
      135deg,
      rgba(41, 121, 255, 0.05),
      rgba(25, 190, 107, 0.05)
    );
    border-bottom: 1rpx solid rgba(0, 0, 0, 0.04);
  }

  &__title {
    font-size: 32rpx;
    font-weight: 700;
    color: $u-main-color;
    letter-spacing: 1rpx;
  }

  &__body {
    padding: 8rpx 0;
  }
}

// 关于文本
.about-text {
  padding: 24rpx 32rpx 32rpx;
  font-size: 28rpx;
  line-height: 1.8;
  color: $u-content-color;

  &__highlight {
    font-weight: 700;
    background: linear-gradient(135deg, #2979ff, #19be6b);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
}

// 信息项
.info-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 24rpx 32rpx;
  transition: all 0.2s ease;
  border-bottom: 1rpx solid rgba(0, 0, 0, 0.04);
  position: relative;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 0;
    background: linear-gradient(
      135deg,
      rgba(41, 121, 255, 0.1),
      rgba(25, 190, 107, 0.1)
    );
    transition: width 0.3s ease;
  }

  &:last-child {
    border-bottom: none;
  }

  &:active {
    background: rgba(41, 121, 255, 0.04);
    transform: translateX(4rpx);

    &::before {
      width: 6rpx;
    }
  }

  &__icon {
    flex-shrink: 0;
    width: 64rpx;
    height: 64rpx;
    border-radius: 12rpx;
    overflow: hidden;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
    transition: all 0.3s ease;
  }

  &:active &__icon {
    transform: scale(1.05);
    box-shadow: 0 6rpx 16rpx rgba(41, 121, 255, 0.2);
  }

  &__content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8rpx;
  }

  &__title {
    font-size: 30rpx;
    font-weight: 600;
    color: $u-main-color;
    transition: color 0.2s ease;
  }

  &:active &__title {
    color: var(--u-type-primary);
  }

  &__label {
    font-size: 24rpx;
    color: $u-tips-color;
    line-height: 1.5;
  }

  &__arrow {
    flex-shrink: 0;
    opacity: 0.6;
    transition: all 0.2s ease;
  }
}

.info-item:active .info-item__arrow {
  transform: translateX(4rpx);
  opacity: 1;
  color: var(--u-type-primary);
}

// 功能列表
.menu-section {
  margin-top: 12rpx;
}

.menu-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.menu-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx 24rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
  animation: slideUp 0.5s ease-out both;

  &:active {
    transform: scale(0.98);
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.menu-card__icon {
  width: 88rpx;
  height: 88rpx;
  border-radius: 22rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.12);
}

.menu-card__info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.menu-card__title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
}

.menu-card__desc {
  font-size: 24rpx;
  color: #999;
}

// 操作按钮
.action-section {
  margin-top: 32rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;

  :deep(.u-btn) {
    width: 100%;
    height: 88rpx;
    font-size: 30rpx;
    font-weight: 600;
  }
}
</style>
