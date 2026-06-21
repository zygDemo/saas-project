<template>
  <layout nav-title="下载管理" :back="true">
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
                  color="#667eea"
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
import layout from "@/pages/layout/layout.vue";
import { computed, ref } from "vue";

interface DownloadItem {
  id: string;
  title: string;
  author: string;
  cover: string;
  progress: number;
  downloadedSize: string;
  totalSize: string;
  speed: string;
  isPaused: boolean;
  completedTime?: string;
}

const downloadingList = ref<DownloadItem[]>([
  {
    id: "1",
    title: "斗破苍穹",
    author: "天蚕土豆",
    cover: "https://picsum.photos/seed/book1/200/280",
    progress: 65,
    downloadedSize: "12.5MB",
    totalSize: "19.2MB",
    speed: "1.2MB/s",
    isPaused: false,
  },
  {
    id: "2",
    title: "凡人修仙传",
    author: "忘语",
    cover: "https://picsum.photos/seed/book2/200/280",
    progress: 32,
    downloadedSize: "8.1MB",
    totalSize: "25.3MB",
    speed: "0KB/s",
    isPaused: true,
  },
]);

const completedList = ref<DownloadItem[]>([
  {
    id: "3",
    title: "诡秘之主",
    author: "爱潜水的乌贼",
    cover: "https://picsum.photos/seed/book3/200/280",
    progress: 100,
    downloadedSize: "22.8MB",
    totalSize: "22.8MB",
    speed: "",
    isPaused: false,
    completedTime: "2024-01-15 14:30",
  },
  {
    id: "4",
    title: "大奉打更人",
    author: "卖报小郎君",
    cover: "https://picsum.photos/seed/book4/200/280",
    progress: 100,
    downloadedSize: "18.5MB",
    totalSize: "18.5MB",
    speed: "",
    isPaused: false,
    completedTime: "2024-01-14 09:15",
  },
]);

const downloadingCount = computed(() => downloadingList.value.length);
const completedCount = computed(() => completedList.value.length);

const totalSize = computed(() => {
  const allItems = [...downloadingList.value, ...completedList.value];
  let totalMB = 0;
  allItems.forEach((item) => {
    const size = parseFloat(item.totalSize);
    if (!isNaN(size)) totalMB += size;
  });
  return totalMB.toFixed(1) + "MB";
});

const pauseDownload = (item: DownloadItem) => {
  item.isPaused = true;
  item.speed = "0KB/s";
};

const resumeDownload = (item: DownloadItem) => {
  item.isPaused = false;
  item.speed = "1.2MB/s";
};

const cancelDownload = (item: DownloadItem) => {
  uni.showModal({
    title: "提示",
    content: `确定取消下载《${item.title}》？`,
    success: (res) => {
      if (res.confirm) {
        downloadingList.value = downloadingList.value.filter((d) => d.id !== item.id);
        uni.showToast({ title: "已取消下载", icon: "success" });
      }
    },
  });
};

const deleteDownload = (item: DownloadItem) => {
  uni.showModal({
    title: "提示",
    content: `确定删除《${item.title}》的下载文件？`,
    success: (res) => {
      if (res.confirm) {
        completedList.value = completedList.value.filter((d) => d.id !== item.id);
        uni.showToast({ title: "已删除", icon: "success" });
      }
    },
  });
};

const openBook = (item: DownloadItem) => {
  uni.navigateTo({
    url: `/pages/reading/reader/index?bookId=${item.id}`,
  });
};

const pauseAll = () => {
  downloadingList.value.forEach((item) => {
    item.isPaused = true;
    item.speed = "0KB/s";
  });
  uni.showToast({ title: "已全部暂停", icon: "success" });
};

const clearAll = () => {
  uni.showModal({
    title: "提示",
    content: "确定清空所有已完成的下载？",
    success: (res) => {
      if (res.confirm) {
        completedList.value = [];
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
  background-color: #f5f6f8;
  padding-bottom: 40rpx;
}

.stats-section {
  display: flex;
  align-items: center;
  justify-content: space-around;
  background: #fff;
  padding: 30rpx 24rpx;
  margin-bottom: 20rpx;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 40rpx;
  font-weight: 700;
  color: #667eea;
}

.stat-label {
  font-size: 24rpx;
  color: #909399;
  margin-top: 8rpx;
}

.stat-divider {
  width: 1rpx;
  height: 60rpx;
  background: #eee;
}

.section {
  margin-bottom: 20rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 24rpx;
  background: #fff;
  border-bottom: 1rpx solid #f5f5f5;
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #303133;
}

.section-action {
  font-size: 24rpx;
  color: #667eea;
}

.download-list {
  background: #fff;
}

.download-item {
  display: flex;
  align-items: center;
  padding: 24rpx;
  border-bottom: 1rpx solid #f5f5f5;

  &:last-child {
    border-bottom: none;
  }
}

.book-cover {
  width: 100rpx;
  height: 140rpx;
  border-radius: 8rpx;
  flex-shrink: 0;
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
  height: 8rpx;
  background: #f0f0f0;
  border-radius: 4rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 4rpx;
  transition: width 0.3s;
}

.progress-text {
  font-size: 22rpx;
  color: #667eea;
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
  padding: 120rpx 0;
}

.empty-text {
  font-size: 28rpx;
  color: #909399;
  margin: 20rpx 0 30rpx;
}
</style>
