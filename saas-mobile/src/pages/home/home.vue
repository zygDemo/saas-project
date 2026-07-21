<template>
  <layout :active-tab="0" show-tabbar tabbar-scope="carloan">
    <view class="app-container">
      <!-- 欢迎区域 -->
      <view class="hero-section">
        <view class="hero-content">
          <view class="user-info">
            <u-text
              :text="`欢迎，${userName}`"
              size="48rpx"
              bold
              color="var(--u-white-color)"
            />
            <u-tag
              :text="userRoleText"
              type="warning"
              size="mini"
              custom-class="user-role-tag"
            />
          </view>
          <u-text
            text="车贷业务移动办公平台"
            size="26rpx"
            color="var(--u-white-color)"
          />
          <u-text
            :text="`今日待处理: ${businessStats.pendingApproval} 件`"
            size="24rpx"
            color="var(--u-content-color)"
            custom-class="hero-badge"
          />
        </view>
        <view class="hero-stats">
          <view class="stat-item">
            <u-text
              :text="String(businessStats.todayLeads)"
              size="36rpx"
              bold
              color="var(--u-white-color)"
            />
            <u-text text="今日线索" size="24rpx" color="var(--u-white-color)" />
          </view>
          <view class="stat-item">
            <u-text
              :text="String(businessStats.pendingApproval)"
              size="36rpx"
              bold
              color="var(--u-white-color)"
            />
            <u-text text="待审批" size="24rpx" color="var(--u-white-color)" />
          </view>
          <view class="stat-item">
            <u-text
              :text="String(businessStats.monthlyDeals)"
              size="36rpx"
              bold
              color="var(--u-white-color)"
            />
            <u-text text="本月成交" size="24rpx" color="var(--u-white-color)" />
          </view>
        </view>
      </view>

      <!-- 公告通知 -->
      <view class="section-card">
        <view class="section-header">
          <view class="section-title-wrapper">
            <view class="section-dot"></view>
            <text class="section-heading">公告通知</text>
          </view>
          <view class="section-right" @click="goNotificationList">
            <text class="section-link">全部</text>
            <u-icon name="arrow-right" size="22" color="#999" />
          </view>
        </view>
        <view class="section-body">
          <!-- 公告轮播 -->
          <view v-if="announcements.length" class="announcement-bar" @click="goAnnouncement(announcements[activeAnnouncementIndex])">
            <u-icon name="bell-fill" size="32" color="#ff9500" />
            <view class="announcement-text-wrap">
              <text class="announcement-text">{{ announcements[activeAnnouncementIndex]?.title }}</text>
            </view>
            <u-icon name="arrow-right" size="22" color="#ccc" />
          </view>

          <!-- 通知列表 -->
          <view v-if="notifications.length" class="notification-list">
            <view
              v-for="item in notifications"
              :key="item.id"
              class="notification-item"
              :class="{ 'notification-item--unread': !item.readAt }"
              @click="handleNotificationTap(item)"
            >
              <view class="notification-icon-wrap" :class="`notification-icon--${item.type}`">
                <u-icon :name="getNotificationIcon(item.type)" size="28" color="#fff" />
              </view>
              <view class="notification-body">
                <text class="notification-title">{{ item.title }}</text>
                <text class="notification-content">{{ item.content }}</text>
                <text class="notification-time">{{ formatTime(item.createdAt) }}</text>
              </view>
              <view v-if="!item.readAt" class="notification-dot"></view>
            </view>
          </view>

          <!-- 空状态 -->
          <view v-if="!announcements.length && !notifications.length" class="empty-state">
            <u-icon name="bell" size="64" color="#ddd" />
            <text class="empty-text">暂无公告和通知</text>
          </view>
        </view>
      </view>

      <!-- 业务快捷入口 -->
      <view class="section-card">
        <view class="section-header">
          <view class="section-title-wrapper">
            <view class="section-dot"></view>
            <text class="section-heading">业务快捷入口</text>
          </view>
          <text class="section-sub">快速办理常用业务</text>
        </view>
        <view class="section-body">
          <view class="feature-list">
            <view
              v-for="(card, idx) in businessCards"
              :key="idx"
              class="feature-item"
              @click="navigateToFeature(card.url, card.title)"
            >
              <view
                class="feature-icon-bg"
                :class="`feature-icon-bg--${card.color}`"
              >
                <u-icon
                  :name="card.icon"
                  size="28"
                  :color="$u.getColor(card.color)"
                />
              </view>
              <view class="feature-body">
                <text class="feature-title">{{ card.title }}</text>
                <text class="feature-desc">{{ card.desc }}</text>
              </view>
              <u-icon
                name="arrow-right"
                size="24"
                color="#d9d9d9"
                class="feature-arrow"
              />
            </view>
          </view>
        </view>
      </view>

      <!-- 车贷业务功能 -->
      <view class="section-card">
        <view class="section-header">
          <view class="section-title-wrapper">
            <view class="section-dot"></view>
            <text class="section-heading">车贷业务功能</text>
          </view>
          <text class="section-sub">完整业务流程处理</text>
        </view>
        <view class="section-body">
          <view class="feature-list">
            <view
              v-for="(feature, index) in businessFeatures"
              :key="index"
              class="feature-item"
              @click="navigateToFeature(feature.url, feature.title)"
            >
              <view
                class="feature-icon-bg"
                :class="`feature-icon-bg--${feature.color}`"
              >
                <u-icon
                  :name="feature.icon"
                  size="28"
                  :color="$u.getColor(feature.color)"
                />
              </view>
              <view class="feature-body">
                <text class="feature-title">{{ feature.title }}</text>
                <text class="feature-desc">{{ feature.desc }}</text>
              </view>
              <u-icon
                name="arrow-right"
                size="24"
                color="#d9d9d9"
                class="feature-arrow"
              />
            </view>
          </view>
        </view>
      </view>
    </view>
  </layout>
</template>

<script setup lang="ts">
import type { ColorType } from "uview-pro/types/global";
import type { StatisticsOverview } from "@/api/business";
import type { AnnouncementItem } from "@/api/announcement";
import type { NotificationItem } from "@/api/notification";
import { $u } from "uview-pro";
import layout from "@/components/layout/layout.vue";
import { useBusinessApi } from "@/api/business";
import { fetchActiveAnnouncements } from "@/api/announcement";
import { fetchNotificationList, markNotificationRead } from "@/api/notification";
import { useLocalStore } from "@/stores";
import { storeToRefs } from "pinia";
import { computed, ref, onBeforeUnmount } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const localStore = useLocalStore();
const { userInfo } = storeToRefs(localStore);

const userName = computed(() => {
  return (
    (userInfo.value?.userName as string) ||
    (userInfo.value?.phone as string) ||
    "访客"
  );
});

const userRoleText = computed(() => {
  const roleMap: Record<string, string> = {
    sales: "业务员",
    approver: "审批员",
    admin: "管理员",
  };
  return roleMap[(userInfo.value?.role as string) || "sales"] || "业务员";
});

const businessApi = useBusinessApi();

const businessStats = ref({
  todayLeads: 0,
  pendingApproval: 0,
  monthlyDeals: 0,
});

async function loadBusinessStats() {
  if (!localStore.token) return;
  try {
    const res = await businessApi.getStatisticsOverview();
    const d = (res?.data ?? res ?? {}) as StatisticsOverview;
    businessStats.value = {
      todayLeads: Number(d.todayLeads ?? d.leadCount ?? 0),
      pendingApproval: Number(d.pendingApproval ?? 0),
      monthlyDeals: Number(d.todayApplications ?? d.entryCount ?? 0),
    };
  } catch (e) {
    console.error("loadBusinessStats failed", e);
  }
}

// ========== 公告 ==========
const announcements = ref<AnnouncementItem[]>([]);
const activeAnnouncementIndex = ref(0);
let announcementTimer: ReturnType<typeof setInterval> | null = null;

async function loadAnnouncements() {
  try {
    const res = await fetchActiveAnnouncements();
    const list = (Array.isArray(res) ? res : (res as any)?.data ?? []) as AnnouncementItem[];
    announcements.value = list.slice(0, 5);
    startAnnouncementRotation();
  } catch (e) {
    console.error("loadAnnouncements failed", e);
  }
}

function startAnnouncementRotation() {
  stopAnnouncementRotation();
  if (announcements.value.length <= 1) return;
  announcementTimer = setInterval(() => {
    activeAnnouncementIndex.value =
      (activeAnnouncementIndex.value + 1) % announcements.value.length;
  }, 4000);
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
  } catch (e) {
    console.error("loadNotifications failed", e);
  }
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
  // 如果有额外跳转信息
  if (item.extra?.applicationId) {
    uni.navigateTo({ url: `/pages/carloan/precheck/applyDetail?id=${item.extra.applicationId}` });
  }
}

function getNotificationIcon(type: string): string {
  const iconMap: Record<string, string> = {
    approval: "checkmark-circle",
    supplement: "edit-pen",
    signing: "file-text",
    loan: "rmb-circle",
    announcement: "bell",
    order: "list",
    system: "setting",
  };
  return iconMap[type] || "info-circle";
}

function formatTime(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}天前`;
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${month}-${day}`;
}

// ========== 快捷入口 ==========
const businessCards = [
  {
    title: "线索查询",
    desc: "查看分配线索，跟进客户",
    icon: "search",
    url: "/pages/carloan/precheck/leadList",
    color: "primary" as ColorType,
  },
  {
    title: "进件申请",
    desc: "快速创建进件，上传资料",
    icon: "file-text",
    url: "/pages/carloan/precheck/applySubmit",
    color: "success" as ColorType,
  },
  {
    title: "审批列表",
    desc: "处理待审批进件",
    icon: "list",
    url: "/pages/carloan/approval/approvalList",
    color: "warning" as ColorType,
  },
  {
    title: "工作台",
    desc: "全部业务功能入口",
    icon: "grid",
    url: "/pages/carloan/workbench/workbench",
    color: "error" as ColorType,
  },
];

const businessFeatures = [
  {
    title: "线索管理",
    desc: "线索查询、线索列表",
    icon: "search",
    url: "/pages/carloan/precheck/leadList",
    color: "primary" as ColorType,
  },
  {
    title: "进件管理",
    desc: "身份证、车辆信息、申请提交",
    icon: "file-text",
    url: "/pages/carloan/precheck/applySubmit",
    color: "success" as ColorType,
  },
  {
    title: "资料补充",
    desc: "客户、车辆、订单信息补充",
    icon: "edit-pen",
    url: "/pages/carloan/supplement/idInfoSupplement",
    color: "warning" as ColorType,
  },
  {
    title: "审批流程",
    desc: "初审、终审、审批记录",
    icon: "list",
    url: "/pages/carloan/approval/approvalList",
    color: "error" as ColorType,
  },
  {
    title: "面签管理",
    desc: "面签列表、视频面签、AI面签",
    icon: "camera",
    url: "/pages/carloan/signing/faceSignList",
    color: "success" as ColorType,
  },
];

onShow(() => {
  loadBusinessStats();
  loadAnnouncements();
  loadNotifications();
});

onBeforeUnmount(() => {
  stopAnnouncementRotation();
});

function navigateToFeature(url: string, _title: string) {
  uni.navigateTo({
    url,
    fail: (err) => {
      $u.toast(`${t("common.jumpFailed")}: ${err.errMsg}`, "error");
    },
  });
}
</script>

<style lang="scss" scoped>
.app-container {
  padding: 0;
  background: linear-gradient(180deg, #f5f8ff 0%, #f8fafc 50%, #fafbfc 100%);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  padding-bottom: 24rpx;
}

// Hero区域
.hero-section {
  position: relative;
  margin: 0;
  border-radius: 0 0 32rpx 32rpx;
  overflow: hidden;
  box-shadow: 0 8rpx 32rpx rgba(102, 126, 234, 0.25);
  transition: all 0.3s ease;

  &:active {
    transform: scale(0.98);
  }

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
    opacity: 0.98;
  }

  &::after {
    content: "";
    position: absolute;
    top: -50%;
    right: -20%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%);
    animation: heroGlow 8s ease-in-out infinite;
  }

  .hero-content {
    position: relative;
    z-index: 2;
    text-align: center;
    padding: 64rpx 32rpx;
    display: flex;
    flex-direction: column;
    gap: 20rpx;
    align-items: center;

    .user-info {
      display: flex;
      align-items: center;
      gap: 16rpx;

      :deep(.user-role-tag) {
        background: rgba(255, 255, 255, 0.3) !important;
        border-color: rgba(255, 255, 255, 0.5) !important;
        color: #ffffff !important;
      }
    }

    :deep(.hero-badge) {
      display: inline-block;
      padding: 4rpx 12rpx;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 8rpx;
      font-size: 20rpx;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: 1rpx;
      backdrop-filter: blur(10rpx);
    }
  }

  .hero-stats {
    position: relative;
    z-index: 2;
    display: flex;
    justify-content: space-around;
    align-items: center;
    padding: 0 32rpx 32rpx;

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8rpx;
    }
  }
}

@keyframes heroGlow {
  0%,
  100% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(-5%, 5%);
  }
}

// Section卡片
.section-card {
  margin: 0 24rpx;
  background: #ffffff;
  border-radius: 20rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 28rpx 16rpx;

  .section-title-wrapper {
    display: flex;
    align-items: center;
    gap: 12rpx;
  }

  .section-dot {
    width: 8rpx;
    height: 32rpx;
    border-radius: 4rpx;
    background: linear-gradient(180deg, #667eea, #764ba2);
  }

  .section-heading {
    font-size: 30rpx;
    font-weight: 600;
    color: #1a1a2e;
  }

  .section-sub {
    font-size: 24rpx;
    color: #999;
  }

  .section-right {
    display: flex;
    align-items: center;
    gap: 4rpx;
  }

  .section-link {
    font-size: 24rpx;
    color: #999;
  }
}

.section-body {
  padding: 0 28rpx 28rpx;
}

// 公告栏
.announcement-bar {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 20rpx 24rpx;
  background: linear-gradient(90deg, #fff8f0, #fffaf5);
  border-radius: 12rpx;
  border: 1rpx solid #ffe8d6;
  margin-bottom: 20rpx;

  .announcement-text-wrap {
    flex: 1;
    overflow: hidden;
  }

  .announcement-text {
    font-size: 26rpx;
    color: #333;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

// 通知列表
.notification-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  padding: 20rpx;
  border-radius: 12rpx;
  background: #fafbfc;
  position: relative;
  transition: background 0.2s;

  &:active {
    background: #f0f2f5;
  }

  &--unread {
    background: #f5f8ff;
    border-left: 4rpx solid #667eea;
  }

  .notification-icon-wrap {
    width: 64rpx;
    height: 64rpx;
    border-radius: 16rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &.notification-icon--approval {
      background: linear-gradient(135deg, #667eea, #764ba2);
    }
    &.notification-icon--supplement {
      background: linear-gradient(135deg, #f093fb, #f5576c);
    }
    &.notification-icon--signing {
      background: linear-gradient(135deg, #4facfe, #00f2fe);
    }
    &.notification-icon--loan {
      background: linear-gradient(135deg, #43e97b, #38f9d7);
    }
    &.notification-icon--announcement {
      background: linear-gradient(135deg, #ff9a56, #ff6b6b);
    }
    &.notification-icon--order {
      background: linear-gradient(135deg, #a18cd1, #fbc2eb);
    }
    &.notification-icon--system {
      background: linear-gradient(135deg, #89919c, #bdc3c7);
    }
  }

  .notification-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6rpx;
    overflow: hidden;
  }

  .notification-title {
    font-size: 28rpx;
    font-weight: 600;
    color: #1a1a2e;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .notification-content {
    font-size: 24rpx;
    color: #666;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .notification-time {
    font-size: 22rpx;
    color: #bbb;
  }

  .notification-dot {
    position: absolute;
    top: 20rpx;
    right: 20rpx;
    width: 12rpx;
    height: 12rpx;
    border-radius: 50%;
    background: #ff4757;
  }
}

// 空状态
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
  padding: 48rpx 0;

  .empty-text {
    font-size: 26rpx;
    color: #ccc;
  }
}

// 功能列表
.feature-list {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 24rpx 16rpx;
  border-radius: 12rpx;
  transition: background 0.2s;

  &:active {
    background: #f8f9fa;
  }

  .feature-icon-bg {
    width: 72rpx;
    height: 72rpx;
    border-radius: 16rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &--primary {
      background: rgba(102, 126, 234, 0.1);
    }
    &--success {
      background: rgba(67, 233, 123, 0.1);
    }
    &--warning {
      background: rgba(255, 149, 0, 0.1);
    }
    &--error {
      background: rgba(255, 71, 87, 0.1);
    }
  }

  .feature-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4rpx;

    .feature-title {
      font-size: 28rpx;
      font-weight: 600;
      color: #1a1a2e;
    }

    .feature-desc {
      font-size: 24rpx;
      color: #999;
    }
  }

  .feature-arrow {
    flex-shrink: 0;
  }
}
</style>
