<template>
  <layout nav-title="下载管理" :show-tabbar="true" tabbar-scope="reading" back back-url="/pages/reading/index/index">
    <scroll-view class="download-scroll" scroll-y>
      <view class="download-page">
        <!-- 下载统计 -->
        <view class="stats-section">
          <view class="stat-item">
            <text class="stat-value">{{ downloadingCount }}</text>
            <text class="stat-label">下载中</text>
          </view>
          <view class="stat-divider" />
          <view class="stat-item">
            <text class="stat-value">{{ completedCount }}</text>
            <text class="stat-label">已完成</text>
          </view>
          <view class="stat-divider" />
          <view class="stat-item">
            <text class="stat-value">{{ totalSize }}</text>
            <text class="stat-label">总大小</text>
          </view>
        </view>

        <!-- 下载中 -->
        <view v-if="downloadingList.length > 0" class="section">
          <view class="section-header">
            <text class="section-title">下载中</text>
            <text class="section-action" @click="pauseAll">全部暂停</text>
          </view>
          <view class="download-list">
            <view
              v-for="item in downloadingList"
              :key="item.id"
              class="download-item"
            >
              <image class="book-cover" :src="item.cover" mode="aspectFill" />
              <view class="download-info">
                <text class="book-title">{{ item.title }}</text>
                <view class="progress-wrap">
                  <view class="progress-bar">
                    <view class="progress-fill" :style="{ width: item.progress + '%' }" />
                  </view>
                  <text class="progress-text">{{ item.progress }}%</text>
                </view>
                <view class="download-meta">
                  <text class="download-size">{{ item.downloadedSize }}/{{ item.totalSize }}</text>
                  <text class="download-speed">{{ item.speed }}</text>
                </view>
              </view>
              <view class="download-actions">
                <u-icon
                  v-if="item.isPaused"
                  name="play-circle"
                  color="var(--u-type-primary)"
                  size="48"
                  @click="resumeDownload(item)"
                />
                <u-icon
                  v-else
                  name="pause-circle"
                  color="#909399"
                  size="48"
                  @click="pauseDownload(item)"
                />
                <u-icon
                  name="close-circle"
                  color="#ff4757"
                  size="48"
                  @click="cancelDownload(item)"
                />
              </view>
            </view>
          </view>
        </view>

        <!-- 已完成 -->
        <view v-if="completedList.length > 0" class="section">
          <view class="section-header">
            <text class="section-title">已完成</text>
            <text class="section-action" @click="clearAll">清空</text>
          </view>
          <view class="download-list">
            <view
              v-for="item in completedList"
              :key="item.id"
              class="download-item"
            >
              <image class="book-cover" :src="item.cover" mode="aspectFill" />
              <view class="download-info">
                <text class="book-title">{{ item.title }}</text>
                <text class="book-author">{{ item.author }}</text>
                <view class="download-meta">
                  <text class="download-size">{{ item.totalSize }}</text>
                  <text class="download-time">{{ item.completedTime }}</text>
                </view>
              </view>
              <view class="download-actions">
                <u-button
                  text="阅读"
                  type="primary"
                  size="mini"
                  @click="openBook(item)"
                />
                <u-icon
                  name="trash"
                  color="#ff4757"
                  size="40"
                  @click="deleteDownload(item)"
                />
              </view>
            </view>
          </view>
        </view>

        <!-- 空状态 -->
        <view v-if="downloadingList.length === 0 && completedList.length === 0" class="empty-state">
          <u-icon name="download" color="#ddd" size="120" />
          <text class="empty-text">暂无下载任务</text>
          <u-button
            text="去书城看看"
            type="primary"
            size="small"
            @click="goBookStore"
          />
        </view>
      </view>
    </scroll-view>
  </layout>
</template>

<script setup lang="ts">
import layout from "@/components/layout/layout.vue";
import { useReadingStore } from "@/stores/reading";
import { computed } from "vue";

const readingStore = useReadingStore();

const downloadingList = computed(() =>
  readingStore.downloads.filter((d) => d.progress < 100),
);
const completedList = computed(() =>
  readingStore.downloads.filter((d) => d.progress >= 100),
);

const downloadingCount = computed(() => downloadingList.value.length);
const completedCount = computed(() => completedList.value.length);

const totalSize = computed(() => {
  let totalMB = 0;
  readingStore.downloads.forEach((item) => {
    const size = parseFloat(item.totalSize);
    if (!isNaN(size)) totalMB += size;
  });
  return totalMB.toFixed(1) + "MB";
});

const pauseDownload = (item: { id: string }) => {
  readingStore.pauseDownload(item.id);
};

const resumeDownload = (item: { id: string }) => {
  readingStore.resumeDownload(item.id);
};

const cancelDownload = (item: { id: string; title: string }) => {
  uni.showModal({
    title: "提示",
    content: `确定取消下载《${item.title}》？`,
    success: (res) => {
      if (res.confirm) {
        readingStore.removeDownload(item.id);
        uni.showToast({ title: "已取消下载", icon: "success" });
      }
    },
  });
};

const deleteDownload = (item: { id: string; title: string }) => {
  uni.showModal({
    title: "提示",
    content: `确定删除《${item.title}》的下载文件？`,
    success: (res) => {
      if (res.confirm) {
        readingStore.removeDownload(item.id);
        uni.showToast({ title: "已删除", icon: "success" });
      }
    },
  });
};

const openBook = (item: { id: string }) => {
  const progress = readingStore.getReadingProgress(item.id);
  const chapterQuery = progress?.chapterId ? `&chapterId=${progress.chapterId}` : "";
  uni.navigateTo({
    url: `/pages/reading/reader/index?bookId=${item.id}${chapterQuery}`,
  });
};

const pauseAll = () => {
  downloadingList.value.forEach((item) => {
    readingStore.pauseDownload(item.id);
  });
  uni.showToast({ title: "已全部暂停", icon: "success" });
};

const clearAll = () => {
  uni.showModal({
    title: "提示",
    content: "确定清空所有已完成的下载？",
    success: (res) => {
      if (res.confirm) {
        readingStore.clearCompletedDownloads();
        uni.showToast({ title: "已清空", icon: "success" });
      }
    },
  });
};

const goBookStore = () => {
  uni.navigateTo({ url: "/pages/reading/store/index" });
};
</script>

<style scoped lang="scss">
.download-scroll {
  height: 100%;
}

.download-page {
  min-height: 100%;
  background:
    radial-gradient(circle at 16% 0%, rgba(var(--u-type-primary-rgb, 82, 64, 254), 0.14), transparent 36%),
    linear-gradient(180deg, var(--app-page-bg-soft, #eef3ff) 0%, var(--app-page-bg, #f6f8fc) 46%);
  padding: 24rpx 24rpx calc(160rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

.stats-section {
  display: flex;
  align-items: center;
  justify-content: space-around;
  background: rgba(255, 255, 255, 0.92);
  border: 1rpx solid rgba(var(--u-type-primary-rgb, 82, 64, 254), 0.1);
  border-radius: 24rpx;
  padding: 30rpx 24rpx;
  margin-bottom: 28rpx;
  box-shadow: 4rpx 4rpx 12rpx rgba(26, 29, 41, 0.06), -2rpx -2rpx 8rpx rgba(255,255,255,0.8);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 40rpx;
  font-weight: 700;
  color: var(--u-type-primary);
}

.stat-label {
  font-size: 24rpx;
  color: #7d8494;
  margin-top: 8rpx;
}

.stat-divider {
  width: 1rpx;
  height: 60rpx;
  background: rgba(var(--u-type-primary-rgb, 82, 64, 254), 0.12);
}

.section {
  margin-bottom: 28rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 4rpx 16rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #303133;
}

.section-action {
  font-size: 24rpx;
  color: var(--u-type-primary);
  padding: 10rpx 18rpx;
  border-radius: 999rpx;
  background: rgba(var(--u-type-primary-rgb, 82, 64, 254), 0.08);
}

.download-list {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.download-item {
  display: flex;
  align-items: center;
  padding: 24rpx;
  border: 1rpx solid var(--app-border, #e8edf5);
  border-radius: 22rpx;
  background: var(--app-surface, #fff);
  box-shadow: var(--app-shadow-card, 0 4rpx 20rpx rgba(26, 29, 41, 0.05));
}

.book-cover {
  width: 100rpx;
  height: 140rpx;
  border-radius: 14rpx;
  flex-shrink: 0;
  box-shadow: 0 8rpx 18rpx rgba(17, 24, 39, 0.12);
}

.download-info {
  flex: 1;
  margin: 0 20rpx;
  overflow: hidden;
}

.book-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.book-author {
  display: block;
  font-size: 24rpx;
  color: #909399;
  margin-top: 8rpx;
}

.progress-wrap {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-top: 12rpx;
}

.progress-bar {
  flex: 1;
  height: 10rpx;
  background: rgba(var(--u-type-primary-rgb, 82, 64, 254), 0.1);
  border-radius: 999rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--u-type-primary) 0%, var(--u-type-primary-dark) 100%);
  border-radius: 999rpx;
  transition: width 0.3s;
}

.progress-text {
  font-size: 22rpx;
  color: var(--u-type-primary);
  width: 60rpx;
  text-align: right;
}

.download-meta {
  display: flex;
  justify-content: space-between;
  margin-top: 8rpx;
}

.download-size,
.download-time {
  font-size: 22rpx;
  color: #909399;
}

.download-speed {
  font-size: 22rpx;
  color: #19be6b;
}

.download-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
  flex-shrink: 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: 80rpx;
  padding: 90rpx 32rpx;
  background: rgba(255, 255, 255, 0.86);
  border: 1rpx solid var(--app-border, #e8edf5);
  border-radius: 24rpx;
  box-shadow: 4rpx 4rpx 12rpx rgba(26,29,41,0.06), -2rpx -2rpx 8rpx rgba(255,255,255,0.8), 0 4rpx 20rpx rgba(26, 29, 41, 0.05);
}

.empty-text {
  font-size: 28rpx;
  color: #909399;
  margin: 20rpx 0 30rpx;
}

@media (prefers-color-scheme: dark) {
  .download-page {
    background: linear-gradient(180deg, #141821 0%, #101217 100%);
  }

  .stats-section,
  .download-item,
  .empty-state {
    background: rgba(31, 34, 43, 0.92);
    border-color: rgba(255, 255, 255, 0.06);
    box-shadow: none;
  }

  .section-title,
  .book-title {
    color: #e5e6eb;
  }

  .stat-label,
  .book-author,
  .download-size,
  .download-time,
  .empty-text {
    color: #8b8c91;
  }
}
</style>
<style>
/* 覆盖全局竖线 */
.section-title::before { display: none !important; }
.section-title { padding-left: 0 !important; }
</style>
