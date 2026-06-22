<template>
  <layout :active-tab="0" nav-title="我的书架" :show-tabbar="true" tabbar-scope="reading" back back-url="/pages/index/index">
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
          <view class="header-bg">

          </view>
          <view class="header-content">
            <view class="header-left">
              <text class="header-title">我的书架</text>
              <text class="header-sub">{{ bookshelf.length }}本在读 · 已读{{ totalReadCount }}本</text>
            </view>
            <view class="header-right">
              <view class="sign-btn" :class="{ signed: hasSigned }" @click="handleSign">
                <view class="sign-icon-wrap">
                  <u-icon :name="hasSigned ? 'checkmark-circle' : 'gift'" color="#fff" size="32" />
                </view>
                <text>{{ hasSigned ? '已签到' : '签到' }}</text>
                <view v-if="!hasSigned" class="sign-pulse" />
              </view>
            </view>
          </view>

          <view class="header-shortcuts">
            <view class="header-shortcut" @click="goBookStore">
              <u-icon name="shopping-cart" color="#fff" size="30" />
              <text>去书城</text>
            </view>
            <view class="header-shortcut" @click="goDownload">
              <u-icon name="download" color="#fff" size="30" />
              <text>下载管理</text>
            </view>
            <view class="header-shortcut" @click="goPortal">
              <u-icon name="home" color="#fff" size="30" />
              <text>项目选择</text>
            </view>
          </view>
        </view>

        <!-- 阅读统计卡片 -->
        <view class="stats-card">
          <view class="stats-row">
            <view class="stat-item" @click="goReadingHistory">
              <view class="stat-icon-wrap" style="background: linear-gradient(135deg, var(--u-type-primary-dark, #3b2f8a) 0%, var(--u-type-primary, #5240FE) 100%)">
                <u-icon name="clock" color="#fff" size="28" />
              </view>
              <text class="stat-value">{{ todayReadMinutes }}</text>
              <text class="stat-label">今日(分钟)</text>
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
            <view class="section-title-wrap">
              <text class="section-icon">📖</text>
              <text class="section-title">今日推荐</text>
            </view>
            <view class="refresh-btn" @click="refreshRecommend">
              <u-icon name="reload" color="var(--u-type-primary)" size="28" />
              <text>换一批</text>
            </view>
          </view>
          <view class="recommend-card" @click="goDetail(todayRecommend)">
            <view class="recommend-cover-wrap">
              <image class="recommend-cover" :src="todayRecommend.cover" mode="aspectFill" />
              <view class="recommend-cover-shadow" />
            </view>
            <view class="recommend-info">
              <text class="recommend-title">{{ todayRecommend.title }}</text>
              <view class="recommend-author-row">
                <u-icon name="account" color="#909399" size="20" />
                <text class="recommend-author">{{ todayRecommend.author }}</text>
              </view>
              <view class="recommend-tags">
                <text class="tag category">{{ todayRecommend.category }}</text>
                <text class="tag words">{{ todayRecommend.wordCount }}</text>
                <text v-if="todayRecommend.isSerial" class="tag serial">连载中</text>
                <text v-else class="tag finish">已完结</text>
              </view>
              <text class="recommend-desc">{{ todayRecommend.desc }}</text>
              <view class="recommend-stats">
                <view class="stat">
                  <u-icon name="eye" color="#909399" size="18" />
                  <text>{{ formatNumber(todayRecommend.views || 0) }}</text>
                </view>
                <view class="stat">
                  <u-icon name="star" color="#ffa502" size="18" />
                  <text>{{ todayRecommend.rating?.toFixed(1) || '4.5' }}</text>
                </view>
              </view>
            </view>
          </view>
        </view>

        <!-- 书架列表 -->
        <view class="bookshelf-section">
          <view class="section-header">
            <view class="section-title-wrap">
              <text class="section-icon">📚</text>
              <text class="section-title">我的书架</text>
              <text class="section-count">{{ bookshelf.length }}本</text>
            </view>
            <view class="section-actions">
              <view class="action-btn" :class="{ active: sortMode === 'time' }" @click="sortMode = 'time'">
                <u-icon name="clock" :color="sortMode === 'time' ? 'var(--u-type-primary, #5240FE)' : '#909399'" size="24" />
                <text :style="{ color: sortMode === 'time' ? 'var(--u-type-primary, #5240FE)' : '#909399' }">时间</text>
              </view>
              <view class="action-btn" :class="{ active: sortMode === 'name' }" @click="sortMode = 'name'">
                <u-icon name="list" :color="sortMode === 'name' ? 'var(--u-type-primary, #5240FE)' : '#909399'" size="24" />
                <text :style="{ color: sortMode === 'name' ? 'var(--u-type-primary, #5240FE)' : '#909399' }">名称</text>
              </view>
              <view class="action-btn add-btn" @click="goBookStore">
                <u-icon name="plus-circle-fill" color="var(--u-type-primary)" size="28" />
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
                @input="onSearchInput"
              />
              <view v-if="keyword" class="clear-btn" @click="keyword = ''">
                <u-icon name="close-circle-fill" color="#c0c4cc" size="28" />
              </view>
            </view>
          </view>

          <!-- 书籍列表 -->
          <view class="book-list">
            <view
              v-for="(book, index) in filteredBooks"
              :key="book.id"
              class="book-card"
              :style="{ animationDelay: index * 0.05 + 's' }"
              @click="openBook(book)"
              @longpress="showBookMenu(book)"
            >
              <view class="book-cover-wrap">
                <image class="book-cover" :src="book.cover" mode="aspectFill" />
                <view v-if="book.hasUpdate" class="update-badge">
                  <text>更新</text>
                </view>
                <view v-if="book.progress > 0" class="progress-ring">
                  <progress-ring :progress="book.progress" :size="48" />
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
                <view class="book-actions-row">
                  <view class="continue-btn" @click.stop="openBook(book)">
                    <u-icon name="play-right" color="#fff" size="20" />
                    <text>继续阅读</text>
                  </view>
                </view>
                <view class="book-progress-bar">
                  <view class="progress-bg" />
                  <view class="progress-fill" :style="{ width: book.progress + '%' }" />
                  <text class="progress-text">{{ book.progress }}%</text>
                </view>
              </view>
              <view class="book-actions" @click.stop="showBookMenu(book)">
                <view class="more-btn">
                  <view class="more-dot" />
                  <view class="more-dot" />
                  <view class="more-dot" />
                </view>
              </view>
            </view>

            <!-- 空状态 -->
            <view v-if="filteredBooks.length === 0" class="empty-state">
              <view class="empty-icon-wrap">
                <u-icon name="file-text" color="#ddd" size="120" />
              </view>
              <text class="empty-title">{{ keyword ? '没有找到匹配的书籍' : '书架还是空的' }}</text>
              <text class="empty-desc">{{ keyword ? '换个关键词试试' : '去书城找找喜欢的书吧' }}</text>
              <view class="empty-btn" @click="keyword ? clearSearch() : goBookStore()">
                <text>{{ keyword ? '清除搜索' : '去书城逛逛' }}</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 最近阅读 -->
        <view v-if="recentlyRead.length > 0" class="recent-section">
          <view class="section-header">
            <view class="section-title-wrap">
              <text class="section-icon">🕐</text>
              <text class="section-title">最近阅读</text>
            </view>
            <view class="more-link" @click="goReadingHistory">
              <text>全部</text>
              <u-icon name="arrow-right" color="#909399" size="20" />
            </view>
          </view>
          <scroll-view class="recent-scroll" scroll-x :show-scrollbar="false">
            <view class="recent-list">
              <view
                v-for="book in recentlyRead"
                :key="book.id"
                class="recent-item"
                @click="openBook(book)"
              >
                <view class="recent-cover-wrap">
                  <image class="recent-cover" :src="book.cover" mode="aspectFill" />
                  <view class="recent-progress">{{ book.progress }}%</view>
                </view>
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
  views?: number;
  rating?: number;
}

const keyword = ref("");
const refreshing = ref(false);
const hasSigned = ref(false);
const sortMode = ref<"time" | "name">("time");
const searchTimer = ref<ReturnType<typeof setTimeout> | null>(null);
const readingStore = useReadingStore();
const localStore = useLocalStore();

const onSearchInput = () => {
  if (searchTimer.value) clearTimeout(searchTimer.value);
  searchTimer.value = setTimeout(() => {}, 300);
};

const bookshelf = computed(() => readingStore.bookshelf);
const totalReadCount = computed(() => readingStore.totalReadCount);
const todayReadMinutes = computed(() => readingStore.todayReadMinutes);
const downloadCount = computed(() => readingStore.downloads.length);

const todayRecommend = ref<BookItem | null>({
  id: "10",
  title: "十方武圣",
  author: "莫默",
  cover: "/static/reading/covers/book10.svg",
  category: "玄幻",
  wordCount: "156万字",
  isSerial: true,
  desc: "武道极致，十方无敌。一个少年从微末崛起，踏上武道巅峰的故事。",
  progress: 0,
  totalChapters: 534,
  views: 2150000,
  rating: 4.2,
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

const particleStyle = (index: number) => ({
  left: (index * 18) + '%',
  animationDelay: (index * 0.5) + 's',
  animationDuration: (3 + index * 0.5) + 's',
});

const formatNumber = (num: number) => {
  if (num >= 10000000) return (num / 10000000).toFixed(1) + "千万";
  if (num >= 10000) return (num / 10000).toFixed(1) + "万";
  return num.toString();
};

const onRefresh = () => {
  refreshing.value = true;
  setTimeout(() => {
    refreshing.value = false;
    uni.showToast({ title: "已刷新", icon: "success" });
  }, 1000);
};

const handleSign = () => {
  if (hasSigned.value) {
    uni.showToast({ title: "今日已签到，明日再来", icon: "none" });
    return;
  }
  hasSigned.value = true;
  uni.showToast({ title: "签到成功 +10阅读积分", icon: "success" });
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

const goPortal = () => {
  localStore.setCurrentSystem(CurrentSystem.PORTAL);
  uni.reLaunch({ url: "/pages/index/index" });
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
  padding: 0 0 40rpx;
}

.header-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 280rpx;
  background: linear-gradient(135deg, var(--u-type-primary-dark) 0%, var(--u-type-primary) 100%);
  border-radius: 0 0 40rpx 40rpx;
  overflow: hidden;
}

.header-particles {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.particle {
  position: absolute;
  width: 8rpx;
  height: 8rpx;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) scale(1);
    opacity: 0.3;
  }
  50% {
    transform: translateY(-30rpx) scale(1.5);
    opacity: 0.8;
  }
}

.header-content {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 50rpx 32rpx 0;
}

.header-left {
  display: flex;
  flex-direction: column;
}

.header-title {
  font-size: 44rpx;
  font-weight: 700;
  color: #fff;
  letter-spacing: 2rpx;
}

.header-sub {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 8rpx;
}

.sign-btn {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  background: rgba(255, 255, 255, 0.2);
  padding: 20rpx 28rpx;
  border-radius: 20rpx;
  backdrop-filter: blur(10px);
  border: 1rpx solid rgba(255, 255, 255, 0.3);

  &.signed {
    background: rgba(255, 255, 255, 0.1);
    opacity: 0.7;
  }

  text {
    font-size: 22rpx;
    color: #fff;
    font-weight: 500;
  }
}

.sign-icon-wrap {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sign-pulse {
  position: absolute;
  top: 10rpx;
  right: 10rpx;
  width: 12rpx;
  height: 12rpx;
  background: #ff4757;
  border-radius: 50%;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(255, 71, 87, 0.4);
  }
  70% {
    transform: scale(1.2);
    box-shadow: 0 0 0 10rpx rgba(255, 71, 87, 0);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(255, 71, 87, 0);
  }
}

/* 统计卡片 */
.stats-card {
  margin: -50rpx 24rpx 24rpx;
  background: #fff;
  border-radius: 24rpx;
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
  gap: 10rpx;
}

.stat-icon-wrap {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
}

.stat-value {
  font-size: 40rpx;
  font-weight: 700;
  color: #303133;
}

.stat-label {
  font-size: 22rpx;
  color: #909399;
}

/* Section 通用 */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.section-title-wrap {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.section-icon {
  font-size: 36rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #303133;
}

.section-actions {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6rpx;
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  background: #f5f6f8;
  transition: all 0.2s;

  &.active {
    background: rgba(102, 126, 234, 0.1);
  }

  text {
    font-size: 22rpx;
    color: #909399;
  }
}

.add-btn {
  background: rgba(102, 126, 234, 0.1);
  padding: 8rpx;
}

.more-link {
  display: flex;
  align-items: center;
  gap: 4rpx;
  font-size: 24rpx;
  color: #909399;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  background: rgba(102, 126, 234, 0.1);

  text {
    font-size: 24rpx;
    color: var(--u-type-primary);
  }
}

/* 今日推荐 */
.recommend-section {
  margin: 0 24rpx 24rpx;
}

.recommend-card {
  display: flex;
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
}

.recommend-cover-wrap {
  position: relative;
  width: 180rpx;
  height: 240rpx;
  flex-shrink: 0;
}

.recommend-cover {
  width: 100%;
  height: 100%;
  border-radius: 12rpx;
}

.recommend-cover-shadow {
  position: absolute;
  bottom: -10rpx;
  left: 10rpx;
  right: 10rpx;
  height: 30rpx;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  filter: blur(10rpx);
}

.recommend-info {
  flex: 1;
  margin-left: 24rpx;
  display: flex;
  flex-direction: column;
}

.recommend-title {
  font-size: 34rpx;
  font-weight: 700;
  color: #303133;
}

.recommend-author-row {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-top: 10rpx;
}

.recommend-author {
  font-size: 26rpx;
  color: #909399;
}

.recommend-tags {
  display: flex;
  gap: 12rpx;
  margin-top: 16rpx;
  flex-wrap: wrap;
}

.tag {
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 6rpx;

  &.category {
    color: var(--u-type-primary);
    background: rgba(102, 126, 234, 0.1);
  }

  &.words {
    color: #ff8e53;
    background: rgba(255, 142, 83, 0.1);
  }

  &.serial {
    color: #19be6b;
    background: rgba(25, 190, 107, 0.1);
  }

  &.finish {
    color: #909399;
    background: #f5f6f8;
  }
}

.recommend-desc {
  font-size: 24rpx;
  color: #606266;
  line-height: 1.6;
  margin-top: 12rpx;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.recommend-stats {
  display: flex;
  gap: 24rpx;
  margin-top: 16rpx;

  .stat {
    display: flex;
    align-items: center;
    gap: 6rpx;
    font-size: 22rpx;
    color: #909399;
  }
}

/* 书架区域 */
.bookshelf-section {
  margin: 0 24rpx 24rpx;
  background: #fff;
  border-radius: 24rpx;
  padding: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
}

/* 搜索栏 */
.search-bar {
  margin-bottom: 20rpx;
}

.search-input-wrap {
  display: flex;
  align-items: center;
  background: #f5f6f8;
  border-radius: 36rpx;
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

.clear-btn {
  padding: 4rpx;
}

/* 书籍列表 */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.book-card {
  display: flex;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
  animation: slideUp 0.3s ease-out forwards;

  &:last-child {
    border-bottom: none;
  }

  &:active {
    background: #f9f9f9;
    border-radius: 12rpx;
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
  border-radius: 12rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
}

.update-badge {
  position: absolute;
  top: 0;
  left: 0;
  background: linear-gradient(135deg, #ff4757 0%, #ff6b81 100%);
  color: #fff;
  font-size: 18rpx;
  padding: 4rpx 12rpx;
  border-radius: 12rpx 0 12rpx 0;
}

.progress-ring {
  position: absolute;
  bottom: 8rpx;
  right: 8rpx;
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
  font-size: 18rpx;
  padding: 2rpx 8rpx;
  background: linear-gradient(135deg, #f5af19 0%, #f12711 100%);
  color: #fff;
  border-radius: 4rpx;
  flex-shrink: 0;
}

.book-author {
  font-size: 24rpx;
  color: #909399;
  margin-top: 6rpx;
}

.book-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8rpx;
}

.book-actions-row {
  margin-top: 10rpx;
}

.continue-btn {
  display: inline-flex;
  align-items: center;
  gap: 6rpx;
  background: linear-gradient(135deg, var(--u-type-primary-dark, #3b2f8a), var(--u-type-primary, #5240FE));
  padding: 6rpx 20rpx;
  border-radius: 24rpx;
  align-self: flex-start;

  text {
    font-size: 22rpx;
    color: #fff;
    font-weight: 500;
  }

  &:active {
    opacity: 0.8;
    transform: scale(0.96);
  }
}

.section-count {
  font-size: 24rpx;
  color: #909399;
  font-weight: 400;
  margin-left: 8rpx;
}

.last-read {
  font-size: 22rpx;
  color: var(--u-type-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.last-time {
  font-size: 20rpx;
  color: #c0c4cc;
  flex-shrink: 0;
  margin-left: 16rpx;
}

.book-progress-bar {
  position: relative;
  height: 8rpx;
  margin-top: 12rpx;
  border-radius: 4rpx;
  overflow: hidden;
}

.progress-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #f0f0f0;
  border-radius: 4rpx;
}

.progress-fill {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  background: linear-gradient(90deg, var(--u-type-primary) 0%, var(--u-type-primary-dark) 100%);
  border-radius: 4rpx;
  transition: width 0.5s ease;
}

.progress-text {
  position: absolute;
  right: 0;
  top: -24rpx;
  font-size: 18rpx;
  color: var(--u-type-primary);
  font-weight: 500;
}

.book-actions {
  display: flex;
  align-items: center;
  padding-left: 16rpx;
}

.more-btn {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  padding: 12rpx;
}

.more-dot {
  width: 6rpx;
  height: 6rpx;
  background: #c0c4cc;
  border-radius: 50%;
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
  gap: 24rpx;
  padding: 4rpx 0;
}

.recent-item {
  width: 180rpx;
  flex-shrink: 0;
}

.recent-cover-wrap {
  position: relative;
  width: 180rpx;
  height: 240rpx;
}

.recent-cover {
  width: 100%;
  height: 100%;
  border-radius: 12rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
}

.recent-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 20rpx;
  padding: 6rpx 0;
  text-align: center;
  border-radius: 0 0 12rpx 12rpx;
}

.recent-title {
  display: block;
  font-size: 26rpx;
  color: #303133;
  margin-top: 12rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
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

.empty-icon-wrap {
  width: 200rpx;
  height: 200rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f6f8;
  border-radius: 50%;
  margin-bottom: 24rpx;
}

.empty-title {
  font-size: 32rpx;
  color: #303133;
  font-weight: 600;
  margin-bottom: 12rpx;
}

.empty-desc {
  font-size: 26rpx;
  color: #909399;
  margin-bottom: 32rpx;
}

.empty-btn {
  background: linear-gradient(135deg, var(--u-type-primary-dark) 0%, var(--u-type-primary) 100%);
  color: #fff;
  font-size: 28rpx;
  padding: 20rpx 48rpx;
  border-radius: 40rpx;
  box-shadow: 0 4rpx 16rpx rgba(102, 126, 234, 0.3);

  &:active {
    transform: scale(0.98);
  }
}


.header-shortcuts {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
  padding: 28rpx 32rpx 0;
}

.header-shortcut {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  height: 72rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.28);
  border-radius: 20rpx;
  background: rgba(255, 255, 255, 0.16);
  backdrop-filter: blur(12px);

  text {
    color: #fff;
    font-size: 24rpx;
    font-weight: 500;
  }

  &:active {
    transform: scale(0.98);
    background: rgba(255, 255, 255, 0.24);
  }
}

</style>