<template>
  <layout :active-tab="0" nav-title="我的书架" show-tabbar tabbar-scope="reading">
    <scroll-view
      class="bookshelf-scroll"
      scroll-y
      :refresher-enabled="true"
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <view class="bookshelf-page">
        <!-- 顶部渐变头部 -->
        <view class="header-section">
          <view class="header-bg" />
          <view class="header-content">
            <view class="header-left">
              <text class="header-title">我的书架</text>
              <text class="header-sub">{{ bookshelf.length }}本在读</text>
            </view>
            <view class="header-right">
              <view class="sign-btn" :class="{ signed: hasSigned }" @click="handleSign">
                <u-icon :name="hasSigned ? 'checkmark-circle' : 'gift'" color="#fff" size="32" />
                <text>{{ hasSigned ? '已签到' : '签到' }}</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 阅读统计卡片 -->
        <view class="stats-card">
          <view class="stats-row">
            <view class="stat-item" @click="goReadingHistory">
              <view class="stat-icon-wrap" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
                <u-icon name="clock" color="#fff" size="28" />
              </view>
              <text class="stat-value">{{ todayReadMinutes }}</text>
              <text class="stat-label">今日阅读(分钟)</text>
            </view>
            <view class="stat-item" @click="goReadingHistory">
              <view class="stat-icon-wrap" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)">
                <u-icon name="checkmark-circle" color="#fff" size="28" />
              </view>
              <text class="stat-value">{{ totalReadCount }}</text>
              <text class="stat-label">已读完</text>
            </view>
            <view class="stat-item" @click="goReadingHistory">
              <view class="stat-icon-wrap" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)">
                <u-icon name="heart" color="#fff" size="28" />
              </view>
              <text class="stat-value">{{ bookshelf.length }}</text>
              <text class="stat-label">在读</text>
            </view>
            <view class="stat-item" @click="goDownload">
              <view class="stat-icon-wrap" style="background: linear-gradient(135deg, #a8e6cf 0%, #3dc1d3 100%)">
                <u-icon name="download" color="#fff" size="28" />
              </view>
              <text class="stat-value">{{ downloadCount }}</text>
              <text class="stat-label">已下载</text>
            </view>
          </view>
        </view>

        <!-- 今日推荐 -->
        <view v-if="todayRecommend" class="recommend-section">
          <view class="section-header">
            <text class="section-title">📖 今日推荐</text>
            <text class="section-more" @click="refreshRecommend">换一批</text>
          </view>
          <view class="recommend-card" @click="goDetail(todayRecommend)">
            <image class="recommend-cover" :src="todayRecommend.cover" mode="aspectFill" />
            <view class="recommend-info">
              <text class="recommend-title">{{ todayRecommend.title }}</text>
              <text class="recommend-author">{{ todayRecommend.author }}</text>
              <view class="recommend-tags">
                <text class="tag">{{ todayRecommend.category }}</text>
                <text class="tag">{{ todayRecommend.wordCount }}</text>
                <text v-if="todayRecommend.isSerial" class="tag serial">连载中</text>
                <text v-else class="tag finish">已完结</text>
              </view>
              <text class="recommend-desc">{{ todayRecommend.desc }}</text>
            </view>
          </view>
        </view>

        <!-- 书架列表 -->
        <view class="bookshelf-section">
          <view class="section-header">
            <text class="section-title">📚 我的书架</text>
            <view class="section-actions">
              <view class="action-btn" @click="toggleSortMode">
                <u-icon :name="sortMode === 'time' ? 'clock' : 'list'" color="#909399" size="24" />
                <text>{{ sortMode === 'time' ? '按时间' : '按名称' }}</text>
              </view>
              <view class="action-btn" @click="goBookStore">
                <u-icon name="plus-circle" color="#667eea" size="24" />
                <text>添加</text>
              </view>
            </view>
          </view>

          <!-- 搜索 -->
          <view class="search-bar">
            <view class="search-input-wrap">
              <u-icon name="search" color="#c0c4cc" size="28" />
              <input
                v-model="keyword"
                class="search-input"
                placeholder="搜索书架中的书"
                placeholder-class="search-placeholder"
                confirm-type="search"
              />
              <u-icon
                v-if="keyword"
                name="close-circle-fill"
                color="#c0c4cc"
                size="28"
                @click="keyword = ''"
              />
            </view>
          </view>

          <!-- 书籍列表 -->
          <view class="book-list">
            <view
              v-for="book in filteredBooks"
              :key="book.id"
              class="book-card"
              @click="openBook(book)"
              @longpress="showBookMenu(book)"
            >
              <view class="book-cover-wrap">
                <image class="book-cover" :src="book.cover" mode="aspectFill" />
                <view v-if="book.hasUpdate" class="update-badge">更新</view>
                <view v-if="book.progress > 0" class="progress-indicator">
                  <text class="progress-text">{{ book.progress }}%</text>
                </view>
              </view>
              <view class="book-info">
                <view class="book-title-row">
                  <text class="book-title">{{ book.title }}</text>
                  <view v-if="book.isVip" class="vip-badge">VIP</view>
                </view>
                <text class="book-author">{{ book.author }}</text>
                <view class="book-meta">
                  <text class="last-read">{{ book.lastReadChapter || '未开始阅读' }}</text>
                  <text class="last-time">{{ formatTime(book.lastReadTime) }}</text>
                </view>
                <view class="book-progress-bar">
                  <view class="progress-fill" :style="{ width: book.progress + '%' }" />
                </view>
              </view>
              <view class="book-actions" @click.stop="showBookMenu(book)">
                <u-icon name="more-dot-fill" color="#c0c4cc" size="36" />
              </view>
            </view>

            <!-- 空状态 -->
            <view v-if="filteredBooks.length === 0" class="empty-state">
              <image
                class="empty-img"
                src="https://img.yzcdn.cn/vant/empty-image-default.png"
                mode="aspectFit"
              />
              <text class="empty-title">{{ keyword ? '没有找到匹配的书籍' : '书架还是空的' }}</text>
              <text class="empty-desc">{{ keyword ? '换个关键词试试' : '去书城找找喜欢的书吧' }}</text>
              <u-button
                :text="keyword ? '清除搜索' : '去书城逛逛'"
                type="primary"
                size="small"
                @click="keyword ? clearSearch() : goBookStore()"
              />
            </view>
          </view>
        </view>

        <!-- 最近阅读 -->
        <view v-if="recentlyRead.length > 0" class="recent-section">
          <view class="section-header">
            <text class="section-title">🕐 最近阅读</text>
            <text class="section-more" @click="goReadingHistory">全部</text>
          </view>
          <scroll-view class="recent-scroll" scroll-x :show-scrollbar="false">
            <view class="recent-list">
              <view
                v-for="book in recentlyRead"
                :key="book.id"
                class="recent-item"
                @click="openBook(book)"
              >
                <image class="recent-cover" :src="book.cover" mode="aspectFill" />
                <text class="recent-title">{{ book.title }}</text>
                <text class="recent-chapter">{{ book.lastReadChapter }}</text>
              </view>
            </view>
          </scroll-view>
        </view>
      </view>
    </scroll-view>
  </layout>
</template>

<script setup lang="ts">
import layout from "@/pages/layout/layout.vue";
import { useReadingStore } from "@/stores/reading";
import { computed, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { CurrentSystem, useLocalStore } from "@/stores/local";

interface BookItem {
  id: string;
  title: string;
  author: string;
  cover: string;
  progress: number;
  lastReadChapter?: string;
  lastReadTime?: number;
  hasUpdate?: boolean;
  totalChapters: number;
  category: string;
  wordCount?: string;
  isVip?: boolean;
  isSerial?: boolean;
  desc?: string;
}

const keyword = ref("");
const refreshing = ref(false);
const hasSigned = ref(false);
const sortMode = ref<"time" | "name">("time");
const readingStore = useReadingStore();
const localStore = useLocalStore();

const bookshelf = computed(() => readingStore.bookshelf);
const totalReadCount = computed(() => readingStore.totalReadCount);
const todayReadMinutes = computed(() => readingStore.todayReadMinutes);
const downloadCount = computed(() => readingStore.downloads.length);

const todayRecommend = ref<BookItem | null>({
  id: "10",
  title: "十方武圣",
  author: "莫默",
  cover: "https://picsum.photos/seed/book10/200/280",
  category: "玄幻",
  wordCount: "156万字",
  isSerial: true,
  desc: "武道极致，十方无敌。一个少年从微末崛起，踏上武道巅峰的故事。",
  progress: 0,
  totalChapters: 534,
});

const recentlyRead = computed(() => {
  return bookshelf.value
    .filter((b: BookItem) => b.lastReadTime)
    .sort((a: BookItem, b: BookItem) => (b.lastReadTime || 0) - (a.lastReadTime || 0))
    .slice(0, 5);
});

const filteredBooks = computed(() => {
  const kw = keyword.value.trim().toLowerCase();
  let books = bookshelf.value;

  if (kw) {
    books = books.filter(
      (book: BookItem) =>
        book.title.toLowerCase().includes(kw) ||
        book.author.toLowerCase().includes(kw)
    );
  }

  if (sortMode.value === "name") {
    books = [...books].sort((a: BookItem, b: BookItem) => a.title.localeCompare(b.title));
  }

  return books;
});

onLoad(() => {
  localStore.setCurrentSystem(CurrentSystem.READING);
});

const onRefresh = () => {
  refreshing.value = true;
  setTimeout(() => {
    refreshing.value = false;
    uni.showToast({ title: "已刷新", icon: "success" });
  }, 1000);
};

const handleSign = () => {
  if (hasSigned.value) {
    uni.showToast({ title: "今天已经签到过了", icon: "none" });
    return;
  }
  hasSigned.value = true;
  uni.showToast({ title: "签到成功 +10积分", icon: "success" });
};

const formatTime = (timestamp?: number) => {
  if (!timestamp) return "";
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  return `${days}天前`;
};

const toggleSortMode = () => {
  sortMode.value = sortMode.value === "time" ? "name" : "time";
};

const openBook = (book: BookItem) => {
  uni.navigateTo({
    url: `/pages/reading/reader/index?bookId=${book.id}`,
  });
};

const showBookMenu = (book: BookItem) => {
  uni.showActionSheet({
    itemList: ["查看详情", "继续阅读", "移出书架", "下载全本", "置顶"],
    success: (res) => {
      switch (res.tapIndex) {
        case 0:
          goDetail(book);
          break;
        case 1:
          openBook(book);
          break;
        case 2:
          uni.showModal({
            title: "提示",
            content: `确定将《${book.title}》移出书架？`,
            success: (modalRes) => {
              if (modalRes.confirm) {
                readingStore.removeFromBookshelf(book.id);
                uni.showToast({ title: "已移出书架", icon: "success" });
              }
            },
          });
          break;
        case 3:
          readingStore.downloadBook(book.id);
          uni.showToast({ title: "开始下载", icon: "success" });
          break;
        case 4:
          uni.showToast({ title: "已置顶", icon: "success" });
          break;
      }
    },
  });
};

const goDetail = (book: BookItem) => {
  uni.navigateTo({
    url: `/pages/reading/store/detail?id=${book.id}`,
  });
};

const goBookStore = () => {
  uni.navigateTo({ url: "/pages/reading/store/index" });
};

const goReadingHistory = () => {
  uni.showToast({ title: "阅读历史功能开发中", icon: "none" });
};

const goDownload = () => {
  uni.navigateTo({ url: "/pages/reading/download/list" });
};

const clearSearch = () => {
  keyword.value = "";
};

const refreshRecommend = () => {
  uni.showToast({ title: "换一批推荐", icon: "success" });
};
</script>

<style scoped lang="scss">
.bookshelf-scroll {
  height: 100%;
}

.bookshelf-page {
  min-height: 100%;
  background-color: #f5f6f8;
  padding-bottom: 160rpx;
}

/* 头部 */
.header-section {
  position: relative;
  padding: 0 0 30rpx;
}

.header-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 260rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 0 0 40rpx 40rpx;
}

.header-content {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 40rpx 32rpx 0;
}

.header-left {
  display: flex;
  flex-direction: column;
}

.header-title {
  font-size: 40rpx;
  font-weight: 700;
  color: #fff;
}

.header-sub {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 8rpx;
}

.sign-btn {
  display: flex;
  align-items: center;
  gap: 8rpx;
  background: rgba(255, 255, 255, 0.2);
  padding: 16rpx 28rpx;
  border-radius: 32rpx;
  backdrop-filter: blur(10px);

  &.signed {
    background: rgba(255, 255, 255, 0.1);
    opacity: 0.7;
  }

  text {
    font-size: 26rpx;
    color: #fff;
  }
}

/* 统计卡片 */
.stats-card {
  margin: -40rpx 24rpx 24rpx;
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx 20rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.08);
  position: relative;
  z-index: 2;
}

.stats-row {
  display: flex;
  justify-content: space-around;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.stat-icon-wrap {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-value {
  font-size: 36rpx;
  font-weight: 700;
  color: #303133;
}

.stat-label {
  font-size: 22rpx;
  color: #909399;
}

/* 今日推荐 */
.recommend-section {
  margin: 0 24rpx 24rpx;
}

.recommend-card {
  display: flex;
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
}

.recommend-cover {
  width: 180rpx;
  height: 240rpx;
  border-radius: 12rpx;
  flex-shrink: 0;
}

.recommend-info {
  flex: 1;
  margin-left: 24rpx;
  display: flex;
  flex-direction: column;
}

.recommend-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #303133;
}

.recommend-author {
  font-size: 26rpx;
  color: #909399;
  margin-top: 8rpx;
}

.recommend-tags {
  display: flex;
  gap: 12rpx;
  margin-top: 16rpx;
  flex-wrap: wrap;
}

.tag {
  font-size: 22rpx;
  padding: 4rpx 12rpx;
  border-radius: 4rpx;
  background: #f5f6f8;
  color: #606266;

  &.serial {
    color: #667eea;
    background: rgba(102, 126, 234, 0.1);
  }

  &.finish {
    color: #19be6b;
    background: rgba(25, 190, 107, 0.1);
  }
}

.recommend-desc {
  font-size: 24rpx;
  color: #606266;
  line-height: 1.6;
  margin-top: 16rpx;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 书架区域 */
.bookshelf-section {
  margin: 0 24rpx 24rpx;
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #303133;
}

.section-more {
  font-size: 24rpx;
  color: #667eea;
}

.section-actions {
  display: flex;
  gap: 20rpx;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6rpx;
  font-size: 24rpx;
  color: #909399;
}

/* 搜索栏 */
.search-bar {
  margin-bottom: 20rpx;
}

.search-input-wrap {
  display: flex;
  align-items: center;
  background: #f5f6f8;
  border-radius: 32rpx;
  padding: 16rpx 24rpx;
  gap: 12rpx;
}

.search-input {
  flex: 1;
  font-size: 28rpx;
  color: #303133;
}

.search-placeholder {
  color: #c0c4cc;
  font-size: 28rpx;
}

/* 书籍列表 */
.book-card {
  display: flex;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f5f5f5;

  &:last-child {
    border-bottom: none;
  }

  &:active {
    background: #f9f9f9;
  }
}

.book-cover-wrap {
  position: relative;
  width: 140rpx;
  height: 190rpx;
  flex-shrink: 0;
}

.book-cover {
  width: 100%;
  height: 100%;
  border-radius: 10rpx;
}

.update-badge {
  position: absolute;
  top: 0;
  left: 0;
  background: #ff4757;
  color: #fff;
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 10rpx 0 10rpx 0;
}

.progress-indicator {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.5);
  padding: 4rpx 0;
  text-align: center;
  border-radius: 0 0 10rpx 10rpx;
}

.progress-text {
  font-size: 20rpx;
  color: #fff;
}

.book-info {
  flex: 1;
  margin-left: 20rpx;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
}

.book-title-row {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.book-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.vip-badge {
  font-size: 20rpx;
  padding: 2rpx 8rpx;
  background: linear-gradient(135deg, #f5af19 0%, #f12711 100%);
  color: #fff;
  border-radius: 4rpx;
  flex-shrink: 0;
}

.book-author {
  font-size: 24rpx;
  color: #909399;
  margin-top: 8rpx;
}

.book-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8rpx;
}

.last-read {
  font-size: 22rpx;
  color: #667eea;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.last-time {
  font-size: 22rpx;
  color: #c0c4cc;
  flex-shrink: 0;
  margin-left: 16rpx;
}

.book-progress-bar {
  height: 6rpx;
  background: #f0f0f0;
  border-radius: 3rpx;
  margin-top: 12rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 3rpx;
  transition: width 0.3s;
}

.book-actions {
  display: flex;
  align-items: center;
  padding-left: 16rpx;
}

/* 最近阅读 */
.recent-section {
  margin: 0 24rpx 24rpx;
}

.recent-scroll {
  white-space: nowrap;
}

.recent-list {
  display: flex;
  gap: 20rpx;
  padding: 4rpx 0;
}

.recent-item {
  width: 180rpx;
  flex-shrink: 0;
}

.recent-cover {
  width: 180rpx;
  height: 240rpx;
  border-radius: 12rpx;
}

.recent-title {
  display: block;
  font-size: 26rpx;
  color: #303133;
  margin-top: 12rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recent-chapter {
  display: block;
  font-size: 22rpx;
  color: #909399;
  margin-top: 4rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 0;
}

.empty-img {
  width: 240rpx;
  height: 240rpx;
  margin-bottom: 24rpx;
}

.empty-title {
  font-size: 30rpx;
  color: #303133;
  font-weight: 600;
  margin-bottom: 8rpx;
}

.empty-desc {
  font-size: 26rpx;
  color: #909399;
  margin-bottom: 30rpx;
}
</style>
