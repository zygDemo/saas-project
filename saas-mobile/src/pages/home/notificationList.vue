<template>
  <layout nav-title="消息通知" show-back>
    <view class="page">
      <!-- 操作栏 -->
      <view v-if="notifications.length" class="action-bar">
        <text class="action-count">共 {{ total }} 条通知</text>
        <text class="action-read-all" @click="handleMarkAllRead">全部已读</text>
      </view>

      <!-- 通知列表 -->
      <view class="list">
        <view
          v-for="item in notifications"
          :key="item.id"
          class="card"
          :class="{ 'card--unread': !item.readAt }"
          @click="handleTap(item)"
        >
          <view class="card-icon" :class="`card-icon--${item.type}`">
            <u-icon :name="getIcon(item.type)" size="28" color="#fff" />
          </view>
          <view class="card-body">
            <view class="card-header">
              <text class="card-title">{{ item.title }}</text>
              <text class="card-time">{{ formatTime(item.createdAt) }}</text>
            </view>
            <text class="card-content">{{ item.content }}</text>
          </view>
          <view v-if="!item.readAt" class="card-dot"></view>
        </view>
      </view>

      <!-- 加载更多 -->
      <view v-if="loading" class="loading">
        <u-loading-icon size="36" />
      </view>
      <view v-else-if="!hasMore && notifications.length" class="no-more">
        <text class="no-more-text">没有更多了</text>
      </view>

      <!-- 空状态 -->
      <view v-if="!loading && !notifications.length" class="empty">
        <u-icon name="bell" size="80" color="#ddd" />
        <text class="empty-text">暂无通知消息</text>
      </view>
    </view>
  </layout>
</template>

<script setup lang="ts">
import type { NotificationItem } from "@/api/notification";
import { fetchNotificationList, markNotificationRead, markAllNotificationsRead } from "@/api/notification";
import layout from "@/components/layout/layout.vue";
import { ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { useLocalStore } from "@/stores";

const localStore = useLocalStore();
const notifications = ref<NotificationItem[]>([]);
const total = ref(0);
const page = ref(1);
const loading = ref(false);
const hasMore = ref(true);

async function loadNotifications(reset = false) {
  if (loading.value) return;
  if (reset) {
    page.value = 1;
    hasMore.value = true;
    notifications.value = [];
  }
  if (!hasMore.value) return;

  loading.value = true;
  try {
    const res = await fetchNotificationList({ current: page.value, size: 20 });
    const data = res as unknown as { records?: NotificationItem[]; total?: number };
    const list = data.records ?? [];
    total.value = data.total ?? 0;
    if (reset) {
      notifications.value = list;
    } else {
      notifications.value.push(...list);
    }
    hasMore.value = list.length >= 20;
    page.value++;
  } catch (e) {
    console.error("loadNotifications failed", e);
  } finally {
    loading.value = false;
  }
}

async function handleTap(item: NotificationItem) {
  if (!item.readAt) {
    try {
      await markNotificationRead(item.id);
      item.readAt = new Date().toISOString();
    } catch {}
  }
  if (item.extra?.applicationId) {
    uni.navigateTo({ url: `/pages/carloan/precheck/applyDetail?id=${item.extra.applicationId}` });
  }
}

async function handleMarkAllRead() {
  try {
    await markAllNotificationsRead();
    notifications.value.forEach((n) => {
      if (!n.readAt) n.readAt = new Date().toISOString();
    });
    uni.showToast({ title: "全部已读", icon: "success" });
  } catch {
    uni.showToast({ title: "操作失败", icon: "none" });
  }
}

function getIcon(type: string): string {
  const map: Record<string, string> = {
    approval: "checkmark-circle", supplement: "edit-pen", signing: "file-text",
    loan: "rmb-circle", announcement: "bell", order: "list", system: "setting",
  };
  return map[type] || "info-circle";
}

function formatTime(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "刚刚";
  if (m < 60) return `${m}分钟前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}小时前`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}天前`;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

onShow(() => {
  if (localStore.token) loadNotifications(true);
});
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: env(safe-area-inset-bottom);
}

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 32rpx;

  .action-count {
    font-size: 24rpx;
    color: #999;
  }

  .action-read-all {
    font-size: 26rpx;
    color: var(--u-type-primary, #4f7cff);

    &:active { opacity: 0.7; }
  }
}

.list {
  padding: 0 24rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.card {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  padding: 24rpx;
  background: #fff;
  border-radius: 16rpx;
  position: relative;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.03);

  &--unread {
    background: #f8faff;
    border-left: 4rpx solid var(--u-type-primary, #4f7cff);
  }

  &:active { opacity: 0.8; }

  .card-icon {
    width: 64rpx;
    height: 64rpx;
    border-radius: 16rpx;
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

  .card-body {
    flex: 1;
    min-width: 0;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8rpx;
  }

  .card-title {
    font-size: 28rpx;
    font-weight: 600;
    color: #1a1a2e;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .card-time {
    font-size: 22rpx;
    color: #ccc;
    flex-shrink: 0;
    margin-left: 16rpx;
  }

  .card-content {
    font-size: 24rpx;
    color: #666;
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .card-dot {
    position: absolute;
    top: 24rpx;
    right: 24rpx;
    width: 12rpx;
    height: 12rpx;
    border-radius: 50%;
    background: #ff4757;
  }
}

.loading, .no-more {
  display: flex;
  justify-content: center;
  padding: 32rpx;
}

.no-more-text {
  font-size: 24rpx;
  color: #ccc;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24rpx;
  padding: 200rpx 0;

  .empty-text {
    font-size: 28rpx;
    color: #ccc;
  }
}
</style>
