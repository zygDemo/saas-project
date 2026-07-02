<template>
  <layout :active-tab="0" nav-title="首页" show-tabbar tabbar-scope="portal">
    <view class="index-page">
      <!-- Hero 渐变头部 -->
      <view class="hero">
        <view class="hero-bg" />
        <view class="hero-content">
          <view class="hero-left">
            <text class="hero-greeting">{{ greeting }}，</text>
            <text class="hero-name">{{ userName }}</text>
            <text class="hero-date">{{ currentDate }}</text>
          </view>
          <view class="hero-avatar" @click="goProfile">
            <image :src="avatar || defaultAvatar" mode="aspectFill" alt="用户头像" />
          </view>
        </view>
      </view>

      <!-- 公告横幅 -->
      <view class="notice-bar" @click="goNotice">
        <u-icon name="bell-fill" color="var(--u-type-warning)" size="28" />
        <text class="notice-text">欢迎使用予艺助手，聚合多种服务一站式体验</text>
        <u-icon name="arrow-right" color="var(--u-tips-color)" size="24" />
      </view>

      <!-- 业务服务 2×2 网格 -->
      <view class="service-section">
        <view class="section-label">
          <text class="section-icon">🔹</text>
          <text class="section-label-text">业务服务</text>
        </view>
        <view class="service-grid">
          <view
            v-for="item in serviceCards"
            :key="item.key"
            class="service-card" role="button" :tabindex="0"
            @click="item.handler" @keyup.enter="item.handler"
          >
            <view class="service-card-icon" :class="item.iconClass">
              <u-icon :name="item.icon" color="#fff" size="44" />
            </view>
            <text class="service-card-title">{{ item.title }}</text>
            <text class="service-card-desc">{{ item.desc }}</text>
          </view>
        </view>
      </view>

      <!-- 快捷功能 -->
      <view class="shortcut-section">
        <view class="section-label">
          <text class="section-icon">⚡</text>
          <text class="section-label-text">快捷功能</text>
        </view>
        <view class="shortcut-grid">
          <view
            v-for="item in shortcutItems"
            :key="item.key"
            class="shortcut-item" role="button" :tabindex="0"
            @click="item.handler" @keyup.enter="item.handler"
          >
            <view class="shortcut-icon-wrap" :style="{ background: item.bgColor }">
              <u-icon :name="item.icon" color="#fff" size="30" />
            </view>
            <text class="shortcut-label">{{ item.label }}</text>
          </view>
        </view>
      </view>

      <!-- 未登录提示 -->
      <view v-if="!hasLogin" class="login-hint" role="button" tabindex="0" @click="goLogin" @keyup.enter="goLogin">
        <u-icon name="account-fill" color="var(--u-type-primary)" size="32" />
        <text class="login-hint-text">登录后查看进件、订单、征信等</text>
        <u-icon name="arrow-right" color="var(--u-tips-color)" size="24" />
      </view>

      <!-- 底部安全区 -->
      <view class="safe-bottom" />
    </view>
  </layout>
</template>

<script setup lang="ts">
import { APP_ROUTES, getSystemByRoute } from "@/common/navigation";
import { fetchMobileConfig, type MobileModuleItem } from "@/api/mobile-config";
import { computed, ref } from "vue";
import { onLoad, onShow } from "@dcloudio/uni-app";
import layout from "@/pages/layout/layout.vue";
import { CurrentSystem, useLocalStore } from "@/stores/local";

const localStore = useLocalStore();

const userName = ref("");
const currentDate = ref("");
const avatar = ref("");
const defaultAvatar = "https://img.uviewui.com/avatar/default.png";

const hasLogin = computed(() => Boolean(localStore.token));

const greeting = computed(() => {
  const h = new Date().getHours();
  if (h < 6) return "凌晨好";
  if (h < 9) return "早上好";
  if (h < 12) return "上午好";
  if (h < 14) return "中午好";
  if (h < 18) return "下午好";
  return "晚上好";
});

const formatCurrentDate = (date: Date) => {
  const weekMap = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  return `${date.getMonth() + 1}月${date.getDate()}日 ${weekMap[date.getDay()]}`;
};

const syncUserInfo = () => {
  const info = localStore.userInfo;
  if (info?.nickName || info?.realName || info?.userName || info?.username) {
    userName.value = String(info.nickName || info.realName || info.userName || info.username);
    avatar.value = info.avatar || "";
    return;
  }
  userName.value = "用户";
  avatar.value = "";
};

onLoad(async () => {
  localStore.setCurrentSystem(CurrentSystem.PORTAL);
  currentDate.value = formatCurrentDate(new Date());
  syncUserInfo();

  // 已登录用户：获取租户移动端模块配置
  if (localStore.token) {
    try {
      const data = await fetchMobileConfig();
      localStore.setMobileConfig(data);

      // 单模块模式 → 直接进入该模块（不用 data.enabled.length，用 isMultiModule 语义更准确）
      if (!data.isMultiModule && data.enabled.length > 0) {
        const target = getModuleRoute(data.enabled[0]);
        if (target) {
          localStore.setCurrentSystem(getSystemByRoute(target) as any);
          uni.reLaunch({ url: target });
          return;
        }
      }

      // 多模块模式：始终显示门户页，用户可自由选择
      filterServiceCards(data.enabled);
    } catch {
      // 接口失败时降级使用缓存
      if (localStore.mobileConfig) {
        filterServiceCards(localStore.mobileConfig.enabled);
      }
    }
  }
});

onShow(() => {
  localStore.setCurrentSystem(CurrentSystem.PORTAL);
  syncUserInfo();
  // 使用缓存的配置过滤模块
  if (localStore.mobileConfig) {
    filterServiceCards(localStore.mobileConfig.enabled);
  }
});

const serviceCards = ref([
  {
    key: "carloan",
    title: "车抵贷",
    desc: "业务进件 · 进度查询",
    icon: "car",
    iconClass: "icon-carloan",
    handler: () => {
      localStore.setCurrentSystem(CurrentSystem.CARLOAN);
      uni.reLaunch({ url: APP_ROUTES.carloan.home });
    },
  },
  {
    key: "food",
    title: "点餐",
    desc: "门店点餐 · 外卖配送",
    icon: "bag",
    iconClass: "icon-food",
    handler: () => {
      localStore.setCurrentSystem(CurrentSystem.FOOD);
      uni.navigateTo({ url: APP_ROUTES.food.home });
    },
  },
  {
    key: "credit",
    title: "征信查询",
    desc: "在线查询 · 信用报告",
    icon: "file-text",
    iconClass: "icon-credit",
    handler: () => {
      localStore.setCurrentSystem(CurrentSystem.CREDIT);
      uni.navigateTo({ url: APP_ROUTES.credit.home });
    },
  },
  {
    key: "reading",
    title: "读书",
    desc: "小说阅读 · 离线下载",
    icon: "book",
    iconClass: "icon-reading",
    handler: () => {
      uni.navigateTo({ url: APP_ROUTES.reading.home });
    },
  },
]);

const shortcutItems = ref([
  {
    key: "apply",
    label: "我的进件",
    icon: "file-text",
    bgColor: "rgba(var(--u-type-primary-rgb, 82, 64, 254), 0.85)",
    handler: () => {
      if (!hasLogin.value) return goLogin();
      localStore.setCurrentSystem(CurrentSystem.CARLOAN);
      uni.reLaunch({ url: APP_ROUTES.carloan.home });
    },
  },
  {
    key: "order",
    label: "我的订单",
    icon: "order",
    bgColor: "rgba(var(--u-type-success-rgb, 25, 190, 107), 0.85)",
    handler: () => uni.switchTab({ url: APP_ROUTES.food.orders }),
  },
  {
    key: "notice",
    label: "公告通知",
    icon: "bell",
    bgColor: "rgba(var(--u-type-warning-rgb, 255, 153, 0), 0.85)",
    handler: () => uni.showToast({ title: "公告功能建设中", icon: "none" }),
  },
  {
    key: "service",
    label: "联系客服",
    icon: "customer-service",
    bgColor: "rgba(var(--u-type-info-rgb, 144, 147, 153), 0.85)",
    handler: () => uni.makePhoneCall({ phoneNumber: "13818821494" }),
  },

]);



/** 模块 key → 首页路由 */
function getModuleRoute(key: string): string | null {
  const map: Record<string, string> = {
    carloan: APP_ROUTES.carloan.home,
    food: APP_ROUTES.food.home,
    credit: APP_ROUTES.credit.home,
    reading: APP_ROUTES.reading.home,
  };
  return map[key] ?? null;
}

/** 原始完整服务卡片列表 */
const allServiceCards = [...serviceCards.value];

/** 原始完整快捷功能列表 */
const allShortcutItems = [...shortcutItems.value];

/** 根据已启用模块过滤服务卡片 + 快捷功能 */
function filterServiceCards(enabled: string[]) {
  const enabledSet = new Set(enabled);
  serviceCards.value = allServiceCards.filter((c) => enabledSet.has(c.key));
  // 快捷功能：保留不依赖特定模块的项(联系客服) + 匹配已启用模块的项
  shortcutItems.value = allShortcutItems.filter((item) => {
    if (item.key === 'service' || item.key === 'notice') return true;
    if (item.key === 'apply') return enabledSet.has('carloan');
    if (item.key === 'order') return enabledSet.has('food');
    return true;
  });
}

const goProfile = () => {
  if (!hasLogin.value) return goLogin();
  uni.switchTab({ url: APP_ROUTES.my.home });
};
const goLogin = () => uni.navigateTo({ url: APP_ROUTES.auth.login });
const goNotice = () => uni.showToast({ title: "公告功能建设中", icon: "none" });
</script>

<style scoped lang="scss">
.index-page {
  min-height: 100vh;
  background: linear-gradient(
    180deg,
    rgba(var(--u-type-primary-rgb, 82, 64, 254), 0.06) 0%,
    var(--u-bg-color, #f5f6fa) 30%
  );
  padding-bottom: env(safe-area-inset-bottom);
}

/* ===== Hero ===== */
.hero {
  position: relative;
  padding: 40rpx 32rpx 48rpx;
  overflow: hidden;
}

.hero-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 320rpx;
  background: linear-gradient(
    135deg,
    var(--u-type-primary-dark) 0%,
    var(--u-type-primary) 60%,
    var(--u-type-primary-disabled) 100%
  );
  border-radius: 0 0 40rpx 40rpx;
}

.hero-content {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.hero-left {
  display: flex;
  flex-direction: column;
}

.hero-greeting {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.75);
  margin-bottom: 6rpx;
}

.hero-name {
  font-size: 42rpx;
  font-weight: 700;
  color: #fff;
  margin-bottom: 8rpx;
}

.hero-date {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.6);
}

.hero-avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  overflow: hidden;
  border: 4rpx solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.12);
  flex-shrink: 0;

  image {
    width: 100%;
    height: 100%;
  }
}

/* ===== Notice bar ===== */
.notice-bar {
  position: relative;
  z-index: 2;
  margin: -16rpx 28rpx 24rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
  background: var(--u-bg-white, #fff);
  border-radius: 14rpx;
  padding: 18rpx 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
}

.notice-text {
  flex: 1;
  font-size: 24rpx;
  color: var(--u-content-color, #606266);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ===== Section label ===== */
.section-label {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.section-icon {
  font-size: 32rpx;
  margin-right: 8rpx;
}

.section-label-text {
  font-size: 30rpx;
  font-weight: 600;
  color: var(--u-main-color, #303133);
}

/* ===== Service 2×2 grid ===== */
.service-section {
  padding: 0 28rpx;
}

.service-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
}

.service-card {
  background: var(--u-bg-white, #fff);
  border-radius: 20rpx;
  padding: 32rpx 24rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
  transition: transform 0.2s;

  &:active {
    transform: scale(0.96);
  }
}

.service-card-icon {
  width: 88rpx;
  height: 88rpx;
  border-radius: 22rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 18rpx;
}

.icon-carloan {
  background: linear-gradient(135deg, #5b5ce2 0%, #4a3db8 100%);
  box-shadow: 0 8rpx 20rpx rgba(91, 92, 226, 0.35);
}

.icon-food {
  background: linear-gradient(135deg, #f5576c 0%, #e84575 100%);
  box-shadow: 0 8rpx 20rpx rgba(245, 87, 108, 0.35);
}

.icon-credit {
  background: linear-gradient(135deg, #409EFF 0%, #337ECC 100%);
  box-shadow: 0 8rpx 20rpx rgba(64, 158, 255, 0.35);
}

.icon-reading {
  background: linear-gradient(135deg, #3dc1d3 0%, #2ba3b3 100%);
  box-shadow: 0 8rpx 20rpx rgba(61, 193, 211, 0.35);
}

.icon-more {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  box-shadow: 0 8rpx 20rpx rgba(168, 237, 234, 0.3);
}

.service-card-title {
  font-size: 30rpx;
  font-weight: 600;
  color: var(--u-main-color, #303133);
  margin-bottom: 6rpx;
}

.service-card-desc {
  font-size: 22rpx;
  color: var(--u-tips-color, #909399);
  text-align: center;
}

/* ===== Shortcut section ===== */
.shortcut-section {
  margin: 28rpx 28rpx 0;
  background: var(--u-bg-white, #fff);
  border-radius: 20rpx;
  padding: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
}

.shortcut-grid {
  display: flex;
  justify-content: space-around;
}

.shortcut-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 25%;
  transition: transform 0.2s;

  &:active {
    transform: scale(0.92);
  }
}

.shortcut-icon-wrap {
  width: 72rpx;
  height: 72rpx;
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12rpx;
}

.shortcut-label {
  font-size: 22rpx;
  color: var(--u-content-color, #606266);
}

/* ===== Login hint ===== */
.login-hint {
  margin: 24rpx 28rpx 0;
  display: flex;
  align-items: center;
  gap: 12rpx;
  background: rgba(var(--u-type-primary-rgb, 82, 64, 254), 0.04);
  border: 2rpx solid rgba(var(--u-type-primary-rgb, 82, 64, 254), 0.1);
  border-radius: 14rpx;
  padding: 20rpx 24rpx;
  transition: opacity 0.2s;

  &:active {
    opacity: 0.7;
  }
}

.login-hint-text {
  flex: 1;
  font-size: 24rpx;
  color: var(--u-type-primary);
}

.safe-bottom {
  height: 40rpx;
}
</style>
