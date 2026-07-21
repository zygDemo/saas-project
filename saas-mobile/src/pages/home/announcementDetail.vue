<template>
  <layout nav-title="公告详情" show-back>
    <view class="page">
      <view v-if="announcement" class="detail">
        <view class="header">
          <text class="title">{{ announcement.title }}</text>
          <view class="meta">
            <u-tag :text="announcement.type || '公告'" type="primary" size="mini" plain />
            <text class="time">{{ formatTime(announcement.publishAt || announcement.createdAt) }}</text>
          </view>
        </view>
        <view class="divider"></view>
        <view class="content">
          <text class="content-text">{{ announcement.content }}</text>
        </view>
      </view>
      <view v-else-if="loading" class="loading">
        <u-loading-icon size="48" />
      </view>
      <view v-else class="empty">
        <u-icon name="info-circle" size="80" color="#ddd" />
        <text class="empty-text">公告不存在或已过期</text>
      </view>
    </view>
  </layout>
</template>

<script setup lang="ts">
import type { AnnouncementItem } from "@/api/announcement";
import { fetchAnnouncementDetail } from "@/api/announcement";
import layout from "@/components/layout/layout.vue";
import { ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";

const announcement = ref<AnnouncementItem | null>(null);
const loading = ref(true);

onLoad(async (options) => {
  const id = Number(options?.id);
  if (!id) {
    loading.value = false;
    return;
  }
  try {
    const res = await fetchAnnouncementDetail(id);
    announcement.value = res as unknown as AnnouncementItem;
  } catch (e) {
    console.error("load announcement failed", e);
  } finally {
    loading.value = false;
  }
});

function formatTime(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: env(safe-area-inset-bottom);
}

.detail {
  margin: 24rpx;
  background: #fff;
  border-radius: 16rpx;
  padding: 32rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.03);
}

.header {
  .title {
    font-size: 36rpx;
    font-weight: 700;
    color: #1a1a2e;
    line-height: 1.4;
    display: block;
    margin-bottom: 20rpx;
  }

  .meta {
    display: flex;
    align-items: center;
    gap: 16rpx;
  }

  .time {
    font-size: 24rpx;
    color: #999;
  }
}

.divider {
  height: 1rpx;
  background: #f0f0f0;
  margin: 28rpx 0;
}

.content {
  .content-text {
    font-size: 28rpx;
    color: #333;
    line-height: 1.8;
    white-space: pre-wrap;
    word-break: break-all;
  }
}

.loading {
  display: flex;
  justify-content: center;
  padding: 200rpx 0;
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
