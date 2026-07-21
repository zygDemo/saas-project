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
            <text class="hero-slogan">多业务入口统一管理</text>
          </view>
          <view class="hero-avatar" @click="goProfile">
            <image
              v-if="avatar"
              :src="avatar"
              mode="aspectFill"
              alt="用户头像"
            />
            <text v-else class="hero-avatar__text">{{ avatarInitial }}</text>
          </view>
        </view>
      </view>

      <!-- 公告横幅 -->
      <view v-if="announcements.length" class="notice-bar" @click="goAnnouncement(announcements[0])">
        <u-icon name="bell-fill" color="var(--u-type-warning)" size="28" />
        <text class="notice-text">{{ announcements[activeAnnouncementIdx]?.title }}</text>
        <u-icon name="arrow-right" color="var(--u-tips-color)" size="24" />
      </view>

      <!-- 通知消息 -->
      <view v-if="notifications.length" class="notify-section">
        <view class="section-head section-head--compact">
          <view class="section-label">
            <view class="section-mark section-mark--warn" />
            <text class="section-label-text">消息通知</text>
          </view>
          <text class="section-meta" @click="goNotificationList">全部</text>
        </view>
        <view class="notify-list">
          <view
            v-for="item in notifications"
            :key="item.id"
            class="notify-item"
            :class="{ 'notify-item--unread': !item.readAt }"
            @click="handleNotificationTap(item)"
          >
            <view class="notify-icon" :class="`notify-icon--${item.type}`">
              <u-icon :name="getNotifyIcon(item.type)" size="26" color="#fff" />
            </view>
            <view class="notify-body">
              <text class="notify-title">{{ item.title }}</text>
              <text class="notify-content">{{ item.content }}</text>
            </view>
            <text class="notify-time">{{ formatNotifyTime(item.createdAt) }}</text>
          </view>
        </view>
      </view>

      <!-- 业务服务 2×2 网格 -->
      <view class="service-section">
        <view class="section-head">
          <view class="section-label">
            <view class="section-mark" />
            <text class="section-label-text">业务服务</text>
          </view>
          <text class="section-meta">已开启 {{ moduleCount }} 个模块</text>
        </view>
        <view v-if="serviceCards.length" class="service-grid">
          <view
            v-for="item in serviceCards"
            :key="item.key"
            class="service-card"
            role="button"
            :tabindex="0"
            @click="item.handler"
            @keyup.enter="item.handler"
          >
            <view class="service-card-icon" :class="item.iconClass">
              <u-icon :name="item.icon" color="#fff" size="44" />
            </view>
            <view class="service-card-body">
              <text class="service-card-title">{{ item.title }}</text>
              <text class="service-card-desc">{{ item.desc }}</text>
            </view>
            <view class="service-card-arrow">
              <u-icon name="arrow-right" color="#b7c0d4" size="24" />
            </view>
          </view>
        </view>
        <view v-else class="empty-card">
          <u-icon name="grid" color="var(--u-type-primary)" size="36" />
          <text class="empty-card__title">暂无可用模块</text>
          <text class="empty-card__desc">请联系管理员检查移动端模块配置</text>
        </view>
      </view>

      <!-- 快捷功能 -->
      <view class="shortcut-section">
        <view class="section-head section-head--compact">
          <view class="section-label">
            <view class="section-mark section-mark--soft" />
            <text class="section-label-text">快捷功能</text>
          </view>
        </view>
        <view class="shortcut-grid">
          <view
            v-for="item in shortcutItems"
            :key="item.key"
            class="shortcut-item"
            role="button"
            :tabindex="0"
            @click="item.handler"
            @keyup.enter="item.handler"
          >
            <view
              class="shortcut-icon-wrap"
              :style="{ background: item.bgColor }"
            >
              <u-icon :name="item.icon" color="#fff" size="30" />
            </view>
            <text class="shortcut-label">{{ item.label }}</text>
          </view>
        </view>
      </view>

      <!-- 未登录提示 -->
      <view
        v-if="!hasLogin"
        class="login-hint"
        role="button"
        tabindex="0"
        @click="goLogin"
        @keyup.enter="goLogin"
      >
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
import { APP_ROUTES, getInitialMobileEntry } from "@/common/navigation";
import { fetchMobileConfig } from "@/api/mobile-config";
import type { MobileConfigData, MobileModuleItem } from "@/api/mobile-config";
import type { AnnouncementItem } from "@/api/announcement";
import type { NotificationItem } from "@/api/notification";
import { fetchActiveAnnouncements } from "@/api/announcement";
import { fetchNotificationList, markNotificationRead } from "@/api/notification";
import type { CurrentSystemValue } from "@/stores/local";
import { computed, ref, onBeforeUnmount } from "vue";
import { onLoad, onShow } from "@dcloudio/uni-app";
import layout from "@/components/layout/layout.vue";
import { CurrentSystem, useLocalStore } from "@/stores/local";

const localStore = useLocalStore();

const userName = ref("");
const currentDate = ref("");
const avatar = ref("");
const hasLogin = computed(() => Boolean(localStore.token));
const avatarInitial = computed(() =>
  (userName.value || "U").slice(0, 1).toUpperCase(),
);

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
    userName.value = String(
      info.nickName || info.realName || info.userName || info.username,
    );
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
      const data = normalizeMobileConfig(await fetchMobileConfig());
      if (!data) return;
      localStore.setMobileConfig(data);

      // 单模块模式：首次进入首页时自动跳转到该模块，避免手动回首页时闪回
      if (!localStore.hasAutoRedirected) {
        const entry = getInitialMobileEntry(data);
        if (entry.moduleKey) {
          localStore.setAutoRedirected(true);
          localStore.setCurrentSystem(entry.system as CurrentSystemValue);
          uni.reLaunch({ url: entry.route });
          return;
        }
      }

      // 多模块模式：始终显示门户页，用户可自由选择
      filterServiceCards(data);
    } catch {
      // 接口失败时降级使用缓存
      if (localStore.mobileConfig) {
        filterServiceCards(localStore.mobileConfig as MobileConfigData);
      }
    }
  }
  // 未登录：仅展示命理模块，快捷入口隐藏订单/进件
  applyLoginAwareFilter();
});

onShow(() => {
  localStore.setCurrentSystem(CurrentSystem.PORTAL);
  syncUserInfo();
  // 使用缓存的配置过滤模块
  if (localStore.mobileConfig) {
    filterServiceCards(localStore.mobileConfig as MobileConfigData);
  }
  // 未登录：仅展示命理模块，快捷入口隐藏订单/进件
  applyLoginAwareFilter();
  // 加载公告和通知
  loadAnnouncements();
  loadNotifications();
});

// ========== 公告 ==========
const announcements = ref<AnnouncementItem[]>([]);
const activeAnnouncementIdx = ref(0);
let announcementTimer: ReturnType<typeof setInterval> | null = null;

async function loadAnnouncements() {
  try {
    const res = await fetchActiveAnnouncements();
    const list = (Array.isArray(res) ? res : []) as AnnouncementItem[];
    announcements.value = list.slice(0, 5);
    if (announcements.value.length > 1) {
      stopAnnouncementRotation();
      announcementTimer = setInterval(() => {
        activeAnnouncementIdx.value = (activeAnnouncementIdx.value + 1) % announcements.value.length;
      }, 4000);
    }
  } catch {}
}

function stopAnnouncementRotation() {
  if (announcementTimer) {
    clearInterval(announcementTimer);
    announcementTimer = null;
  }
}

function goAnnouncement(item: AnnouncementItem) {
  if (!item) return;
  uni.navigateTo({ url: `/pages/home/announcementDetail?id=${item.id}` });
}

// ========== 通知 ==========
const notifications = ref<NotificationItem[]>([]);

async function loadNotifications() {
  if (!localStore.token) return;
  try {
    const res = await fetchNotificationList({ current: 1, size: 5 });
    const data = res as unknown as { records?: NotificationItem[] };
    notifications.value = data.records ?? [];
  } catch {}
}

function goNotificationList() {
  uni.navigateTo({ url: "/pages/home/notificationList" });
}

async function handleNotificationTap(item: NotificationItem) {
  if (!item.readAt) {
    try {
      await markNotificationRead(item.id);
      item.readAt = new Date().toISOString();
    } catch {}
  }
  if (item.extra?.applicationId) {
    localStore.setCurrentSystem(CurrentSystem.CARLOAN);
    uni.navigateTo({ url: `/pages/carloan/precheck/applyDetail?id=${item.extra.applicationId}` });
  }
}

function getNotifyIcon(type: string): string {
  const map: Record<string, string> = {
    approval: "checkmark-circle", supplement: "edit-pen", signing: "file-text",
    loan: "rmb-circle", announcement: "bell", order: "list", system: "setting",
  };
  return map[type] || "info-circle";
}

function formatNotifyTime(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "刚刚";
  if (m < 60) return `${m}分钟前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}小时前`;
  return `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

onBeforeUnmount(() => {
  stopAnnouncementRotation();
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
      uni.reLaunch({ url: APP_ROUTES.food.home });
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
      uni.reLaunch({ url: APP_ROUTES.credit.home });
    },
  },
  {
    key: "reading",
    title: "读书",
    desc: "小说阅读 · 离线下载",
    icon: "book",
    iconClass: "icon-reading",
    handler: () => {
      localStore.setCurrentSystem(CurrentSystem.READING);
      uni.reLaunch({ url: APP_ROUTES.reading.home });
    },
  },
  {
    key: "mingli",
    title: "命理",
    desc: "八字排盘 · 六爻摇卦",
    icon: "star",
    iconClass: "icon-mingli",
    handler: () => {
      localStore.setCurrentSystem(CurrentSystem.MINGLI);
      uni.navigateTo({ url: APP_ROUTES.mingli.index });
    },
  },
]);

const moduleCount = computed(() => serviceCards.value.length);

function goLogin() {
  uni.navigateTo({ url: APP_ROUTES.auth.login });
}

const shortcutItems = ref([
  // {
  //   key: "apply",
  //   label: "我的进件",
  //   icon: "file-text",
  //   bgColor: "rgba(var(--u-type-primary-rgb, 82, 64, 254), 0.85)",
  //   handler: () => {
  //     if (!hasLogin.value) return goLogin();
  //     localStore.setCurrentSystem(CurrentSystem.CARLOAN);
  //     uni.reLaunch({ url: APP_ROUTES.carloan.home });
  //   },
  // },
  // {
  //   key: "order",
  //   label: "我的订单",
  //   icon: "order",
  //   bgColor: "rgba(var(--u-type-success-rgb, 25, 190, 107), 0.85)",
  //   handler: () => uni.navigateTo({ url: APP_ROUTES.food.orders }),
  // },
  {
    key: "notice",
    label: "公告通知",
    icon: "bell",
    bgColor: "rgba(var(--u-type-warning-rgb, 255, 153, 0), 0.85)",
    handler: () => goNotificationList(),
  },
  {
    key: "service",
    label: "联系客服",
    icon: "customer-service",
    bgColor: "rgba(var(--u-type-info-rgb, 144, 147, 153), 0.85)",
    handler: () => uni.makePhoneCall({ phoneNumber: "13818821494" }),
  },
]);

/** 登录状态感知过滤：未登录时首页仅保留命理模块，快捷入口隐藏订单/进件 */
function applyLoginAwareFilter() {
  if (!hasLogin.value) {
    serviceCards.value = allServiceCards.filter(
      (card) => card.key === "mingli",
    );
    shortcutItems.value = allShortcutItems.filter(
      (item) => item.key !== "apply" && item.key !== "order",
    );
    return;
  }
  // 已登录且没有模块配置时，恢复完整列表
  if (!localStore.mobileConfig) {
    serviceCards.value = allServiceCards;
    shortcutItems.value = allShortcutItems;
  }
}

/** 模块 key 到首页路由 */
/** 原始完整服务卡片列表 */
const allServiceCards = [...serviceCards.value];

/** 原始完整快捷功能列表 */
const allShortcutItems = [...shortcutItems.value];

function normalizeMobileConfig(response: unknown): MobileConfigData | null {
  const raw = (response as Record<string, unknown>)?.data
    ? ((response as Record<string, unknown>).data as Record<string, unknown>)
    : (response as Record<string, unknown>);
  const config = raw as unknown as MobileConfigData;
  if (!config || !Array.isArray(config.enabled)) return null;
  return {
    available: Array.isArray(config.available)
      ? (config.available as MobileModuleItem[])
      : [],
    enabled: config.enabled,
    defaultModule: config.defaultModule ?? null,
    isMultiModule: Boolean(config.isMultiModule),
  };
}

/** 根据已启用模块过滤服务卡片 + 快捷功能 */
function filterServiceCards(configOrEnabled: MobileConfigData | string[]) {
  const config = Array.isArray(configOrEnabled)
    ? { available: [] as MobileModuleItem[], enabled: configOrEnabled }
    : configOrEnabled;
  const enabled = config.enabled;
  const available = Array.isArray(config.available) ? config.available : [];
  const enabledSet = new Set(enabled);
  const cardMap = new Map(allServiceCards.map((card) => [card.key, card]));
  const availableCards = available
    .filter((item) => enabledSet.has(item.key) && cardMap.has(item.key))
    .map((item) => {
      const card = cardMap.get(item.key)!;
      return {
        ...card,
        title: item.name || card.title,
        desc: item.desc || card.desc,
        icon: item.icon || card.icon,
      };
    });
  serviceCards.value = availableCards.length
    ? availableCards
    : allServiceCards.filter((c) => enabledSet.has(c.key));
  // 快捷功能：保留不依赖特定模块的项(联系客服) + 匹配已启用模块的项
  shortcutItems.value = allShortcutItems.filter((item) => {
    if (item.key === "service" || item.key === "notice") return true;
    if (item.key === "apply") return enabledSet.has("carloan");
    if (item.key === "order") return enabledSet.has("food");
    return true;
  });
}

const goProfile = () => {
  if (!hasLogin.value) return goLogin();
  uni.switchTab({ url: APP_ROUTES.my.home });
};
</script>

<style scoped lang="scss">
.index-page {
  min-height: 100vh;
  background: linear-gradient(
    180deg,
    var(--u-type-primary-light, #eef3ff) 0%,
    rgba(var(--u-type-primary-rgb, 79, 124, 255), 0.05) 38%,
    #f8fafc 100%
  );
  padding-bottom: env(safe-area-inset-bottom);
}

/* ===== Hero ===== */
.hero {
  position: relative;
  padding: 42rpx 32rpx 58rpx;
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
    var(--u-type-primary-dark, #3f6ff3) 0%,
    var(--u-type-primary, #4f7cff) 52%,
    var(--u-type-primary-disabled, #8ea7ff) 100%
  );
  border-radius: 0 0 32rpx 32rpx;
  box-shadow: 0 18rpx 40rpx rgba(var(--u-type-primary-rgb, 79, 124, 255), 0.22);
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
  min-width: 0;
}

.hero-greeting {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.75);
  margin-bottom: 6rpx;
}

.hero-name {
  max-width: 460rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 46rpx;
  font-weight: 800;
  color: #fff;
  margin-bottom: 8rpx;
}

.hero-date {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.6);
}

.hero-slogan {
  margin-top: 16rpx;
  width: fit-content;
  padding: 8rpx 18rpx;
  color: rgba(255, 255, 255, 0.88);
  font-size: 23rpx;
  border-radius: 14rpx;
  background: rgba(255, 255, 255, 0.14);
}

.hero-avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  overflow: hidden;
  border: 4rpx solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.12);
  flex-shrink: 0;
  background: #fff;

  image {
    width: 100%;
    height: 100%;
  }
}

.hero-avatar__text {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--u-type-primary);
  font-size: 40rpx;
  font-weight: 800;
  background: #fff;
}

/* ===== Notice bar ===== */
.notice-bar {
  position: relative;
  z-index: 2;
  margin: -24rpx 28rpx 26rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
  background: rgba(255, 255, 255, 0.96);
  border: 1rpx solid rgba(226, 232, 240, 0.9);
  border-radius: 16rpx;
  padding: 16rpx 24rpx;
  box-shadow:
    4rpx 4rpx 12rpx rgba(30, 41, 59, 0.06),
    -2rpx -2rpx 8rpx rgba(255, 255, 255, 0.9);
}

.notice-text {
  flex: 1;
  font-size: 24rpx;
  color: var(--u-content-color, #606266);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ===== 通知列表 ===== */
.notify-section {
  margin: 0 28rpx 8rpx;
  background: rgba(255, 255, 255, 0.96);
  border-radius: 16rpx;
  padding: 20rpx 24rpx;
  box-shadow: 4rpx 4rpx 12rpx rgba(30, 41, 59, 0.06);
}

.section-mark--warn {
  background: linear-gradient(135deg, #ff9a56, #ff6b6b);
}

.notify-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-top: 16rpx;
}

.notify-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 16rpx;
  border-radius: 12rpx;
  background: #f8f9fb;

  &--unread {
    background: #f0f4ff;
    border-left: 4rpx solid var(--u-type-primary, #4f7cff);
  }

  &:active {
    opacity: 0.7;
  }
}

.notify-icon {
  width: 56rpx;
  height: 56rpx;
  border-radius: 14rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &--approval { background: linear-gradient(135deg, #667eea, #764ba2); }
  &--supplement { background: linear-gradient(135deg, #f093fb, #f5576c); }
  &--signing { background: linear-gradient(135deg, #4facfe, #00f2fe); }
  &--loan { background: linear-gradient(135deg, #43e97b, #38f9d7); }
  &--announcement { background: linear-gradient(135deg, #ff9a56, #ff6b6b); }
  &--order { background: linear-gradient(135deg, #a18cd1, #fbc2eb); }
  &--system { background: linear-gradient(135deg, #89919c, #bdc3c7); }
}

.notify-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.notify-title {
  font-size: 26rpx;
  font-weight: 600;
  color: #1a1a2e;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.notify-content {
  font-size: 22rpx;
  color: #999;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.notify-time {
  font-size: 20rpx;
  color: #ccc;
  flex-shrink: 0;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  margin-bottom: 16rpx;
}

.section-head--compact {
  margin-bottom: 18rpx;
}

.section-label {
  display: flex;
  align-items: center;
  min-width: 0;
}

.section-mark {
  width: 8rpx;
  height: 30rpx;
  margin-right: 12rpx;
  border-radius: 8rpx;
  background: linear-gradient(
    180deg,
    var(--u-type-primary, #4f7cff),
    var(--u-type-primary-disabled, #8ea7ff)
  );
}

.section-mark--soft {
  background: linear-gradient(
    180deg,
    var(--u-type-primary-disabled, #8ea7ff),
    var(--u-type-primary-light, #eef3ff)
  );
}

.section-label-text {
  font-size: 30rpx;
  font-weight: 800;
  color: #1a1d29;
}

.section-meta {
  flex-shrink: 0;
  padding: 8rpx 16rpx;
  color: var(--u-type-primary, #4f7cff);
  font-size: 22rpx;
  font-weight: 700;
  border-radius: 14rpx;
  background: rgba(var(--u-type-primary-rgb, 79, 124, 255), 0.08);
}

/* ===== Service 2×2 grid ===== */
.service-section {
  padding: 0 28rpx;
}

.service-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
}

.service-card {
  position: relative;
  min-height: 236rpx;
  background: #fff;
  border: 1rpx solid #e8edf5;
  border-radius: 24rpx;
  padding: 24rpx 20rpx 20rpx;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  box-shadow:
    4rpx 4rpx 12rpx rgba(26, 29, 41, 0.06),
    -2rpx -2rpx 8rpx rgba(255, 255, 255, 0.8);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease;
  overflow: hidden;

  &::after {
    content: "";
    position: absolute;
    top: -42rpx;
    right: -42rpx;
    width: 120rpx;
    height: 120rpx;
    border-radius: 50%;
    background: rgba(var(--u-type-primary-rgb, 79, 124, 255), 0.06);
  }

  &:active {
    transform: scale(0.98);
    box-shadow: 0 6rpx 18rpx rgba(26, 29, 41, 0.06);
  }
}

.service-card-icon {
  position: relative;
  z-index: 1;
  width: 82rpx;
  height: 82rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16rpx;
}

.icon-carloan {
  background: linear-gradient(
    135deg,
    var(--u-type-primary, #4f7cff) 0%,
    var(--u-type-primary-dark, #3f6ff3) 100%
  );
  box-shadow: 0 8rpx 20rpx rgba(var(--u-type-primary-rgb, 79, 124, 255), 0.32);
}

.icon-food {
  background: linear-gradient(135deg, #f5576c 0%, #e84575 100%);
  box-shadow: 0 8rpx 20rpx rgba(245, 87, 108, 0.35);
}

.icon-credit {
  background: linear-gradient(135deg, #409eff 0%, #337ecc 100%);
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
  display: block;
  font-size: 31rpx;
  font-weight: 800;
  color: #1a1d29;
  margin-bottom: 8rpx;
}

.service-card-desc {
  display: -webkit-box;
  overflow: hidden;
  color: #8b93a7;
  font-size: 22rpx;
  line-height: 1.45;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.service-card-body {
  position: relative;
  z-index: 1;
  min-width: 0;
  padding-right: 24rpx;
}

.service-card-arrow {
  position: absolute;
  right: 18rpx;
  bottom: 18rpx;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42rpx;
  height: 42rpx;
  border-radius: 14rpx;
  background: #f5f7fb;
}

.empty-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
  padding: 48rpx 24rpx;
  background: #fff;
  border: 1rpx dashed #cbd5e1;
  border-radius: 22rpx;
}

.empty-card__title {
  color: #1a1d29;
  font-size: 28rpx;
  font-weight: 800;
}

.empty-card__desc {
  color: #8b93a7;
  font-size: 23rpx;
}

/* ===== Shortcut section ===== */
.shortcut-section {
  margin: 28rpx 28rpx 0;
  background: #fff;
  border: 1rpx solid #e8edf5;
  border-radius: 22rpx;
  padding: 26rpx 24rpx 24rpx;
  box-shadow:
    4rpx 4rpx 12rpx rgba(26, 29, 41, 0.06),
    -2rpx -2rpx 8rpx rgba(255, 255, 255, 0.8);
}

.shortcut-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8rpx;
}

.shortcut-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
  padding: 8rpx 0;
  border-radius: 16rpx;
  transition:
    transform 0.18s ease,
    background 0.18s ease;

  &:active {
    background: #f8fafc;
    transform: scale(0.96);
  }
}

.shortcut-icon-wrap {
  width: 70rpx;
  height: 70rpx;
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12rpx;
  box-shadow: 0 8rpx 18rpx rgba(15, 23, 42, 0.1);
}

.shortcut-label {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 22rpx;
  color: #4e5566;
}

/* ===== Login hint ===== */
.login-hint {
  margin: 24rpx 28rpx 0;
  display: flex;
  align-items: center;
  gap: 12rpx;
  background: rgba(var(--u-type-primary-rgb, 79, 124, 255), 0.06);
  border: 1rpx solid rgba(var(--u-type-primary-rgb, 79, 124, 255), 0.16);
  border-radius: 16rpx;
  padding: 16rpx 24rpx;
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
