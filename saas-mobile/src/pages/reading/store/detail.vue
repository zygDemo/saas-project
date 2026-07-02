<template>
  <layout nav-title="书籍详情" :back="true">
    <scroll-view class="detail-scroll" scroll-y>
      <view class="detail-page">
        <!-- 书籍头部信息 -->
        <view class="book-header">
          <view class="header-bg" />
          <view class="header-content">
            <view class="book-cover-wrap">
              <image class="book-cover" :src="book.cover" mode="aspectFill" />
              <view v-if="book.isSerial" class="serial-badge">连载中</view>
              <view v-else class="finish-badge">已完结</view>
            </view>
            <view class="book-meta">
              <text class="book-title">{{ book.title }}</text>
              <view class="author-row" @click="goAuthor">
                <u-icon name="account" color="#fff" size="24" />
                <text class="book-author">{{ book.author }}</text>
                <u-icon name="arrow-right" color="rgba(255,255,255,0.6)" size="20" />
              </view>
              <view class="book-stats">
                <view class="stat">
                  <u-icon name="eye" color="rgba(255,255,255,0.8)" size="20" />
                  <text>{{ formatNumber(book.views) }}人在读</text>
                </view>
                <view class="stat">
                  <u-icon name="list" color="rgba(255,255,255,0.8)" size="20" />
                  <text>{{ book.totalChapters }}章</text>
                </view>
                <view class="stat">
                  <u-icon name="edit-pen" color="rgba(255,255,255,0.8)" size="20" />
                  <text>{{ book.wordCount }}</text>
                </view>
              </view>
              <view class="book-tags">
                <text class="tag">{{ book.category }}</text>
                <text class="tag">{{ book.style }}</text>
                <text class="tag">{{ book.ending }}</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 操作按钮 -->
        <view class="action-bar">
          <view class="action-btn primary" @click="startRead">
            <u-icon name="bookmark" color="#fff" size="32" />
            <text>开始阅读</text>
          </view>
          <view
            class="action-btn"
            :class="{ inShelf: isInBookshelf }"
            @click="toggleBookshelf"
          >
            <u-icon :name="isInBookshelf ? 'checkmark-circle' : 'plus-circle'" :color="isInBookshelf ? 'var(--u-type-primary)' : '#606266'" size="32" />
            <text>{{ isInBookshelf ? '已加入' : '加入书架' }}</text>
          </view>
          <view class="action-btn" @click="downloadBook">
            <u-icon name="download" color="#606266" size="32" />
            <text>下载</text>
          </view>
          <view class="action-btn" @click="shareBook">
            <u-icon name="share" color="#606266" size="32" />
            <text>分享</text>
          </view>
        </view>

        <!-- 评分区域 -->
        <view class="rating-section">
          <view class="rating-left">
            <text class="rating-score">{{ book.rating.toFixed(1) }}</text>
            <u-rate :count="5" :value="book.rating" :size="24" disabled />
            <text class="rating-count">{{ ratingCount }}人评价</text>
          </view>
          <view class="rating-right">
            <view v-for="(item, idx) in ratingDistribution" :key="idx" class="rating-bar-row">
              <text class="bar-label">{{ 5 - idx }}星</text>
              <view class="bar-track">
                <view class="bar-fill" :style="{ width: item.percent + '%' }" />
              </view>
              <text class="bar-percent">{{ item.percent }}%</text>
            </view>
          </view>
        </view>

        <!-- 简介 -->
        <view class="section">
          <view class="section-header">
            <text class="section-title">简介</text>
          </view>
          <view class="section-content">
            <text class="book-desc" :class="{ expanded: descExpanded }">{{ book.desc }}</text>
            <view class="expand-btn" @click="descExpanded = !descExpanded">
              <text>{{ descExpanded ? '收起' : '展开全部' }}</text>
              <u-icon :name="descExpanded ? 'arrow-up' : 'arrow-down'" color="var(--u-type-primary)" size="20" />
            </view>
          </view>
        </view>

        <!-- 目录 -->
        <view class="section">
          <view class="section-header">
            <text class="section-title">目录</text>
            <view class="section-meta">
              <text class="section-sub">已加载{{ chapters.length }}章 / 共{{ chapterTotal || book.totalChapters }}章</text>
            </view>
          </view>
          <view class="chapter-list">
            <view
              v-for="(chapter, idx) in chapters"
              :key="chapter.id"
              class="chapter-item"
              :class="{ 'is-read': chapter.isRead, 'is-latest': chapter.isLatest, 'is-vip': chapter.isVip }"
              @click="readChapter(chapter)"
            >
              <view class="chapter-left">
                <text class="chapter-title">{{ chapter.title }}</text>
                <view v-if="chapter.isLatest" class="new-badge">最新</view>
              </view>
              <view class="chapter-right">
                <view v-if="chapter.isVip" class="vip-badge">VIP</view>
                <text v-if="chapter.isRead" class="read-status">已读</text>
                <u-icon name="arrow-right" color="#c0c4cc" size="20" />
              </view>
            </view>
          </view>
          <!-- 加载更多 -->
          <view v-if="!chapterFinished" class="load-more-bar" @click="loadMoreChapters">
            <text v-if="!chapterLoading" class="load-more-text">加载更多章节</text>
            <text v-else class="load-more-text">加载中...</text>
          </view>
          <view v-else class="load-more-bar finished">
            <text class="load-more-text">已展示全部章节</text>
          </view>
        </view>

        <!-- 作者信息 -->
        <view class="section">
          <view class="section-header">
            <text class="section-title">作者</text>
          </view>
          <view class="author-card" @click="goAuthor">
            <image class="author-avatar" :src="book.authorAvatar" mode="aspectFill" />
            <view class="author-info">
              <text class="author-name">{{ book.author }}</text>
              <text class="author-desc">{{ book.authorDesc }}</text>
              <view class="author-stats">
                <text class="author-books">{{ book.authorBooks }}部作品</text>
                <text class="author-fans">{{ formatNumber(book.authorFans) }}粉丝</text>
              </view>
            </view>
            <u-icon name="arrow-right" color="#c0c4cc" size="24" />
          </view>
        </view>

        <!-- 读者评价 -->
        <view class="section">
          <view class="section-header">
            <text class="section-title">读者评价</text>
            <view class="section-more" @click="viewAllReviews">
              <text>全部{{ reviewCount }}条</text>
              <u-icon name="arrow-right" color="#909399" size="20" />
            </view>
          </view>
          <view class="review-list">
            <view v-for="review in reviews" :key="review.id" class="review-item">
              <view class="review-header">
                <image class="review-avatar" :src="review.avatar" mode="aspectFill" />
                <view class="review-user">
                  <text class="review-name">{{ review.nickname }}</text>
                  <u-rate :count="5" :value="review.rating" :size="18" disabled />
                </view>
                <text class="review-time">{{ review.time }}</text>
              </view>
              <text class="review-content">{{ review.content }}</text>
              <view class="review-footer">
                <view class="review-action" @click="likeReview(review)">
                  <u-icon :name="review.liked ? 'thumb-up-fill' : 'thumb-up'" :color="review.liked ? 'var(--u-type-primary)' : '#909399'" size="20" />
                  <text>{{ review.likes }}</text>
                </view>
              </view>
            </view>
          </view>
          <!-- 写评价按钮 -->
          <view class="write-review-btn" @click="showWriteReview">
            <u-icon name="edit-pen" color="var(--u-type-primary)" size="28" />
            <text>写评价</text>
          </view>
        </view>

        <!-- 评价提交弹窗 -->
        <u-popup :show="showReviewForm" mode="bottom" @close="showReviewForm = false" round="16">
          <view class="review-form">
            <view class="form-header">
              <text class="form-title">写评价</text>
              <u-icon name="close" size="36" color="#606266" @click="showReviewForm = false" />
            </view>
            <view class="form-body">
              <view class="form-item">
                <text class="form-label">评分</text>
                <u-rate :count="5" v-model="reviewRating" :size="36" active-color="#ff8e53" />
              </view>
              <view class="form-item">
                <text class="form-label">评价内容</text>
                <textarea
                  v-model="reviewContent"
                  class="review-textarea"
                  placeholder="说说你对这本书的看法..."
                  placeholder-class="textarea-placeholder"
                  :maxlength="500"
                  :auto-height="true"
                />
                <text class="char-count">{{ reviewContent.length }}/500</text>
              </view>
              <view class="form-submit">
                <u-button
                  type="primary"
                  text="提交评价"
                  :loading="submittingReview"
                  @click="submitReview"
                  :disabled="reviewRating === 0"
                />
              </view>
            </view>
          </view>
        </u-popup>

        <!-- 同类推荐 -->
        <view class="section">
          <view class="section-header">
            <text class="section-title">同类推荐</text>
          </view>
          <scroll-view class="recommend-scroll" scroll-x :show-scrollbar="false">
            <view class="recommend-list">
              <view
                v-for="item in recommendBooks"
                :key="item.id"
                class="recommend-item"
                @click="goDetail(item)"
              >
                <image class="recommend-cover" :src="item.cover" mode="aspectFill" />
                <text class="recommend-title">{{ item.title }}</text>
                <text class="recommend-author">{{ item.author }}</text>
                <view class="recommend-rating">
                  <u-rate :count="5" :value="item.rating" :size="16" disabled />
                  <text>{{ item.rating.toFixed(1) }}</text>
                </view>
              </view>
            </view>
          </scroll-view>
        </view>
      </view>
    </scroll-view>

    <!-- 底部操作栏 -->
    <view class="bottom-bar">
      <view class="bottom-btn" @click="toggleBookshelf">
        <u-icon :name="isInBookshelf ? 'heart-fill' : 'heart'" :color="isInBookshelf ? '#ff4757' : '#606266'" size="36" />
        <text>{{ isInBookshelf ? '已收藏' : '收藏' }}</text>
      </view>
      <view class="bottom-btn primary" @click="startRead">
        <text>免费阅读</text>
      </view>
    </view>
  </layout>
</template>

<script setup lang="ts">
import layout from "@/pages/layout/layout.vue";
import { useReadingStore } from "@/stores/reading";
import { computed, ref } from "vue";
import { useReadingApi } from "@/api/reading";
import { onLoad, onShareAppMessage } from "@dcloudio/uni-app";

interface Chapter {
  id: string;
  title: string;
  isRead: boolean;
  isLatest: boolean;
  isVip: boolean;
}

interface BookItem {
  id: string;
  title: string;
  author: string;
  cover: string;
  category: string;
  style: string;
  ending: string;
  isSerial: boolean;
  views: number;
  desc: string;
  totalChapters: number;
  wordCount: string;
  rating: number;
  authorAvatar: string;
  authorDesc: string;
  authorBooks: number;
  authorFans: number;
}

interface Review {
  id: string;
  nickname: string;
  avatar: string;
  rating: number;
  content: string;
  time: string;
  likes: number;
  liked: boolean;
}

interface RecommendBook {
  id: string;
  title: string;
  author: string;
  cover: string;
  rating: number;
}

const readingStore = useReadingStore();
const readingApi = useReadingApi();
const descExpanded = ref(false);
const bookId = ref("");

const book = ref<BookItem>({
  id: "1",
  title: "斗破苍穹",
  author: "天蚕土豆",
  cover: "/static/reading/covers/book1.svg",
  category: "玄幻",
  style: "热血",
  ending: "逆袭",
  isSerial: false,
  views: 12580000,
  desc: "三十年河东，三十年河西，莫欺少年穷！年仅15岁的萧家废柴，于此地，立下了誓言，从今以后便一步步走向斗气大陆巅峰！这里是属于斗气的世界，没有花俏艳丽的魔法，有的，仅仅是繁衍到巅峰的斗气！萧炎，主人公，萧家历史上空前绝后的斗气修炼天才。4岁就开始修炼斗之气，10岁拥有了九段斗之气，11岁突破十段斗之气，成功凝聚斗之气旋，一跃成为家族百年来最年轻的斗者。然而在12岁那年，他却\"丧失\"了修炼能力，只拥有三段斗之气。直到15岁时，他偶获奇遇——一枚戒指，里面有一位自称药老的灵魂，从此萧炎重新成为家族年轻一辈中的佼佼者，为维护整个家族的荣耀，向着大陆巅峰强者迈进。",
  totalChapters: 1648,
  wordCount: "532万字",
  rating: 4.8,
  authorAvatar: "/static/reading/covers/author1.svg",
  authorDesc: "起点白金作家，网络文学代表性人物之一",
  authorBooks: 6,
  authorFans: 2580000,
});

const ratingCount = ref(12580);
const reviewCount = ref(3256);

const ratingDistribution = ref([
  { percent: 72 },
  { percent: 18 },
  { percent: 6 },
  { percent: 3 },
  { percent: 1 },
]);

const chapters = ref<Chapter[]>([]);
const chapterPage = ref(1);
const chapterPageSize = ref(20);
const chapterTotal = ref(0);
const chapterLoading = ref(false);
const chapterFinished = ref(false);

const reviews = ref<Review[]>([]);
const reviewPage = ref(1);
const reviewTotal = ref(0);
const reviewLoading = ref(false);

// 评论提交表单
const showReviewForm = ref(false);
const reviewRating = ref(0);
const reviewContent = ref("");
const submittingReview = ref(false);

const fetchReviews = async (reset = false) => {
  if (reviewLoading.value) return;
  const page = reset ? 1 : reviewPage.value;
  reviewLoading.value = true;
  try {
    const res = await readingApi.getReviews({ bookId: bookId.value, page, pageSize: 10 });
    const data = res?.data;
    const items = data?.items || [];
    const mapped = items.map((item: any) => ({
      id: String(item.id),
      nickname: item.user?.nickname || "匿名读者",
      avatar: item.user?.avatar || "/static/reading/covers/user1.svg",
      rating: Number(item.rating) || 0,
      content: item.content || "",
      time: item.createdAt?.slice(0, 10) || "",
      likes: 0,
      liked: false,
    }));
    if (reset) {
      reviews.value = mapped;
    } else {
      reviews.value.push(...mapped);
    }
    reviewTotal.value = data?.total || 0;
    reviewPage.value = page + 1;
    reviewCount.value = reviewTotal.value;
  } catch {
    // 使用默认 mock 数据作为后备
    if (reset && reviews.value.length === 0) {
      reviews.value = [
        { id: "1", nickname: "书虫小明", avatar: "/static/reading/covers/user1.svg", rating: 5, content: "经典中的经典！看了三遍还是觉得很好看。", time: "2024-01-15", likes: 1256, liked: false },
        { id: "2", nickname: "玄幻迷", avatar: "/static/reading/covers/user2.svg", rating: 4, content: "整体很不错，就是后期有点拖沓。", time: "2024-01-10", likes: 856, liked: false },
        { id: "3", nickname: "阅读达人", avatar: "/static/reading/covers/user3.svg", rating: 5, content: "斗破苍穹是我入坑的第一本书。", time: "2024-01-05", likes: 654, liked: true },
      ];
    }
  } finally {
    reviewLoading.value = false;
  }
};

const submitReview = async () => {
  if (reviewRating.value === 0) {
    uni.showToast({ title: "请先评分", icon: "none" });
    return;
  }
  submittingReview.value = true;
  try {
    await readingApi.createReview({
      bookId: bookId.value,
      rating: reviewRating.value,
      content: reviewContent.value,
    });
    uni.showToast({ title: "评价提交成功", icon: "success" });
    showReviewForm.value = false;
    reviewRating.value = 0;
    reviewContent.value = "";
    // 重新加载评价列表
    fetchReviews(true);
  } catch {
    uni.showToast({ title: "提交失败，请重试", icon: "none" });
  } finally {
    submittingReview.value = false;
  }
};

const recommendBooks = ref<RecommendBook[]>([
  { id: "2", title: "凡人修仙传", author: "忘语", cover: "/static/reading/covers/book2.svg", rating: 4.7 },
  { id: "3", title: "诡秘之主", author: "爱潜水的乌贼", cover: "/static/reading/covers/book3.svg", rating: 4.9 },
  { id: "4", title: "大奉打更人", author: "卖报小郎君", cover: "/static/reading/covers/book4.svg", rating: 4.6 },
  { id: "5", title: "夜的命名术", author: "会说话的肘子", cover: "/static/reading/covers/book5.svg", rating: 4.5 },
  { id: "6", title: "赘婿", author: "愤怒的香蕉", cover: "/static/reading/covers/book6.svg", rating: 4.4 },
]);

const isInBookshelf = computed(() => readingStore.isInBookshelf(bookId.value));
const savedProgress = computed(() => readingStore.getReadingProgress(bookId.value));

onLoad(async (options) => {
  if (options?.id) {
    bookId.value = options.id;
    await Promise.all([
      fetchBookDetail(options.id),
      fetchChapters(options.id, true),
      fetchReviews(true),
    ]);
  }
});

const fetchChapters = async (id: string, reset = false) => {
  if (chapterLoading.value) return;
  const page = reset ? 1 : chapterPage.value;
  chapterLoading.value = true;
  try {
    const res = await readingApi.getChapters(id, { page, pageSize: chapterPageSize.value });
    const data = res?.data;
    const items = data?.items || [];
    const total = data?.total || 0;
    chapterTotal.value = total;

    const mapped = items.map((item: any) => ({
      id: String(item.id),
      title: item.title,
      isRead: false,
      isLatest: false,
      isVip: !!item.isVip,
    }));
    // 标记最新一章（最后一章）
    if (mapped.length && page === Math.ceil(total / chapterPageSize.value)) {
      mapped[mapped.length - 1].isLatest = true;
    }

    if (reset) {
      chapters.value = mapped;
    } else {
      chapters.value.push(...mapped);
    }
    chapterPage.value = page + 1;
    chapterFinished.value = chapters.value.length >= total;
  } catch (e) {
    console.error("获取章节目录失败", e);
  } finally {
    chapterLoading.value = false;
  }
};

const loadMoreChapters = () => {
  if (!chapterLoading.value && !chapterFinished.value) {
    fetchChapters(bookId.value);
  }
};

const formatWordCount = (count?: number) => {
  if (!count) return "";
  if (count >= 10000) return (count / 10000).toFixed(0) + "万字";
  return count + "字";
};

const fetchBookDetail = async (id: string) => {
  try {
    const res = await readingApi.getBookDetail(id);
    if (res?.code === 200 && res.data) {
      const data = res.data;
      book.value = {
        id: String(data.id),
        title: data.title || "",
        author: data.author || "未知",
        cover: data.cover || "/static/reading/covers/default.svg",
        category: data.category?.name || "其他",
        style: "",
        ending: "",
        isSerial: data.isSerial ?? false,
        views: data.readCount || 0,
        desc: data.desc || "",
        totalChapters: data.chapterCount || 0,
        wordCount: formatWordCount(data.wordCount),
        rating: Number(data.rating) || 0,
        authorAvatar: "/static/reading/covers/author1.svg",
        authorDesc: "",
        authorBooks: 0,
        authorFans: 0,
      };
    }
  } catch (e) {
    console.error("获取书籍详情失败", e);
  }
};

const formatNumber = (num: number) => {
  if (num >= 10000000) return (num / 10000000).toFixed(1) + "千万";
  if (num >= 10000) return (num / 10000).toFixed(1) + "万";
  return num.toString();
};

const toggleBookshelf = async () => {
  if (isInBookshelf.value) {
    readingStore.removeFromBookshelf(bookId.value);
    try {
      await readingApi.removeFromBookshelf(bookId.value);
    } catch { /* ignore */ }
    uni.showToast({ title: "已移出书架", icon: "success" });
  } else {
    readingStore.addToBookshelf({
      id: book.value.id,
      title: book.value.title,
      author: book.value.author,
      cover: book.value.cover,
      progress: savedProgress.value?.progress || 0,
      lastReadChapter: savedProgress.value?.chapterTitle,
      lastReadChapterId: savedProgress.value?.chapterId,
      lastReadTime: savedProgress.value?.lastReadTime,
      totalChapters: book.value.totalChapters,
      category: book.value.category,
    });
    try {
      await readingApi.addToBookshelf(bookId.value);
    } catch { /* ignore */ }
    uni.showToast({ title: "已加入书架", icon: "success" });
  }
};

const startRead = () => {
  const targetChapterId = savedProgress.value?.chapterId || chapters.value[0]?.id || "1";
  uni.navigateTo({
    url: `/pages/reading/reader/index?bookId=${bookId.value}&chapterId=${targetChapterId}`,
  });
};

const downloadBook = () => {
  readingStore.downloadBook(bookId.value, {
    title: book.value.title,
    author: book.value.author,
    cover: book.value.cover,
  });
  uni.showToast({ title: "开始下载", icon: "success" });
};

const shareBook = () => {
  uni.showToast({ title: "请点击右上角分享", icon: "none" });
};

onShareAppMessage(() => {
  return {
    title: book.value?.title || '精彩好书',
    path: `/pages/reading/store/detail?id=${bookId.value}`,
  };
});

const readChapter = (chapter: Chapter) => {
  uni.navigateTo({
    url: `/pages/reading/reader/index?bookId=${bookId.value}&chapterId=${chapter.id}`,
  });
};


const goAuthor = () => {
  uni.showToast({ title: "作者主页开发中", icon: "none" });
};

const viewAllReviews = () => {
  uni.showToast({ title: "全部评价功能开发中", icon: "none" });
};

const showWriteReview = () => {
  showReviewForm.value = true;
};

// 本地模拟点赞（TODO: 接入后端 API）
const likeReview = (review: Review) => {
  if (review.liked) {
    review.liked = false;
    review.likes--;
  } else {
    review.liked = true;
    review.likes++;
  }
};

const goDetail = (item: RecommendBook) => {
  uni.navigateTo({
    url: `/pages/reading/store/detail?id=${item.id}`,
  });
};
</script>

<style scoped lang="scss">
.detail-scroll {
  height: 100%;
}

.detail-page {
  min-height: 100%;
  background:
    radial-gradient(circle at 12% 0%, rgba(var(--u-type-primary-rgb, 82, 64, 254), 0.15), transparent 34%),
    linear-gradient(180deg, var(--app-page-bg-soft, #eef3ff) 0%, var(--app-page-bg, #f6f8fc) 42%);
  padding-bottom: calc(152rpx + env(safe-area-inset-bottom));
}

/* 头部 */
.book-header {
  position: relative;
  padding-bottom: 22rpx;
  overflow: hidden;
}

.header-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 388rpx;
  background:
    radial-gradient(circle at 82% 18%, rgba(255, 255, 255, 0.26), transparent 24%),
    linear-gradient(135deg, var(--u-type-primary-dark) 0%, var(--u-type-primary) 100%);
}

.header-content {
  position: relative;
  z-index: 1;
  display: flex;
  padding: 44rpx 28rpx 38rpx;
}

.book-cover-wrap {
  position: relative;
  width: 200rpx;
  height: 280rpx;
  flex-shrink: 0;
}

.book-cover {
  width: 100%;
  height: 100%;
  border-radius: 16rpx;
  box-shadow: 0 18rpx 36rpx rgba(17, 24, 39, 0.28);
}

.serial-badge,
.finish-badge {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  text-align: center;
  padding: 8rpx 0;
  font-size: 22rpx;
  color: #fff;
  border-radius: 0 0 16rpx 16rpx;
}

.serial-badge {
  background: linear-gradient(90deg, var(--u-type-primary) 0%, var(--u-type-primary-dark) 100%);
}

.finish-badge {
  background: linear-gradient(90deg, #19be6b 0%, #18b566 100%);
}

.book-meta {
  flex: 1;
  margin-left: 24rpx;
  display: flex;
  flex-direction: column;
}

.book-title {
  text-wrap: balance;
  font-size: 36rpx;
  font-weight: 700;
  color: #fff;
  line-height: 1.25;
}

.author-row {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-top: 12rpx;
}

.book-author {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
}

.book-stats {
  display: flex;
  gap: 14rpx;
  margin-top: 20rpx;
  flex-wrap: wrap;
}

.stat {
  display: flex;
  align-items: center;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.86);
  gap: 6rpx;
  padding: 6rpx 12rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.12);
}

.book-tags {
  display: flex;
  gap: 12rpx;
  margin-top: 20rpx;
  flex-wrap: wrap;
}

.tag {
  font-size: 22rpx;
  padding: 6rpx 14rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.9);
}

/* 操作按钮 */
.action-bar {
  display: flex;
  justify-content: space-around;
  background: rgba(255, 255, 255, 0.94);
  padding: 24rpx;
  margin: 0 24rpx 22rpx;
  border: 1rpx solid var(--app-border, #e8edf5);
  border-radius: 24rpx;
  box-shadow: var(--app-shadow-card, 0 8rpx 26rpx rgba(26, 29, 41, 0.06));
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  font-size: 24rpx;
  color: #606266;
  min-width: 112rpx;

  &.primary {
    background: linear-gradient(135deg, var(--u-type-primary-dark) 0%, var(--u-type-primary) 100%);
    color: #fff;
    padding: 16rpx 28rpx;
    border-radius: 999rpx;
    box-shadow: 0 10rpx 22rpx rgba(var(--u-type-primary-rgb, 82, 64, 254), 0.22);
  }

  &.inShelf {
    color: var(--u-type-primary);
  }
}

/* 评分区域 */
.rating-section {
  display: flex;
  background: var(--app-surface, #fff);
  padding: 24rpx;
  margin: 0 24rpx 22rpx;
  border: 1rpx solid var(--app-border, #e8edf5);
  border-radius: 24rpx;
  box-shadow: var(--app-shadow-card, 0 4rpx 20rpx rgba(26, 29, 41, 0.05));
}

.rating-left {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-right: 30rpx;
  border-right: 1rpx solid var(--app-border, #e8edf5);
  margin-right: 24rpx;
}

.rating-score {
  font-size: 48rpx;
  font-weight: 700;
  color: #ff8e53;
}

.rating-count {
  font-size: 22rpx;
  color: #909399;
  margin-top: 8rpx;
}

.rating-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.rating-bar-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.bar-label {
  font-size: 22rpx;
  color: #909399;
  width: 40rpx;
}

.bar-track {
  flex: 1;
  height: 12rpx;
  background: #eef1f6;
  border-radius: 999rpx;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff8e53 0%, #ff6b6b 100%);
  border-radius: 999rpx;
}

.bar-percent {
  font-size: 22rpx;
  color: #909399;
  width: 60rpx;
  text-align: right;
}

/* 通用 section */
.section {
  background: var(--app-surface, #fff);
  margin: 0 24rpx 22rpx;
  border: 1rpx solid var(--app-border, #e8edf5);
  border-radius: 24rpx;
  padding: 24rpx;
  box-shadow: var(--app-shadow-card, 0 4rpx 20rpx rgba(26, 29, 41, 0.05));
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #303133;
  line-height: 1.25;
}

.section-meta {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.section-sub {
  font-size: 24rpx;
  color: #909399;
}

.section-more {
  display: flex;
  align-items: center;
  font-size: 24rpx;
  color: #909399;
}

/* 简介 */
.book-desc {
  font-size: 28rpx;
  color: #606266;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;

  &.expanded {
    -webkit-line-clamp: unset;
  }
}

.expand-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  margin-top: 16rpx;
  font-size: 24rpx;
  color: var(--u-type-primary);
}

/* 目录 */
.chapter-list {
  border-top: 1rpx solid var(--app-border, #e8edf5);
}

.chapter-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid var(--app-border, #e8edf5);

  &:last-child {
    border-bottom: none;
  }

  &.is-read {
    .chapter-title {
      color: #909399;
    }
  }

  &.is-latest {
    .chapter-title {
      color: var(--u-type-primary);
      font-weight: 600;
    }
  }

  &.is-vip {
    .chapter-title {
      color: #ff8e53;
    }
  }
}

.chapter-left {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.chapter-title {
  font-size: 28rpx;
  color: #303133;
}

.new-badge {
  font-size: 20rpx;
  padding: 2rpx 8rpx;
  background: #ff4757;
  color: #fff;
  border-radius: 999rpx;
}

.chapter-right {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.vip-badge {
  font-size: 20rpx;
  padding: 2rpx 8rpx;
  background: linear-gradient(135deg, #f5af19 0%, #f12711 100%);
  color: #fff;
  border-radius: 999rpx;
}

.read-status {
  font-size: 22rpx;
  color: #19be6b;
}

/* 加载更多 */
.load-more-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24rpx 0 8rpx;
  border-top: 1rpx solid #f5f5f5;
  margin-top: 8rpx;

  &.finished {
    opacity: 0.5;
  }
}

.load-more-text {
  font-size: 26rpx;
  color: var(--u-type-primary);
  letter-spacing: 1rpx;
}

/* 作者信息 */
.author-card {
  display: flex;
  align-items: center;
  padding: 18rpx;
  border-radius: 18rpx;
  background: #f7f9fc;
}

.author-avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 22rpx;
  flex-shrink: 0;
}

.author-info {
  flex: 1;
  margin-left: 20rpx;
}

.author-name {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: #303133;
}

.author-desc {
  display: block;
  font-size: 24rpx;
  color: #909399;
  margin-top: 4rpx;
}

.author-stats {
  display: flex;
  gap: 20rpx;
  margin-top: 8rpx;
}

.author-books,
.author-fans {
  font-size: 22rpx;
  color: #606266;
}

/* 读者评价 */
.review-list {
  border-top: 1rpx solid var(--app-border, #e8edf5);
}

.review-item {
  padding: 20rpx 0;
  border-bottom: 1rpx solid var(--app-border, #e8edf5);

  &:last-child {
    border-bottom: none;
  }
}

.review-header {
  display: flex;
  align-items: center;
  margin-bottom: 12rpx;
}

.review-avatar {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  flex-shrink: 0;
}

.review-user {
  flex: 1;
  margin-left: 16rpx;
}

.review-name {
  display: block;
  font-size: 26rpx;
  color: #303133;
}

.review-time {
  font-size: 22rpx;
  color: #c0c4cc;
}

.review-content {
  display: block;
  font-size: 28rpx;
  color: #606266;
  line-height: 1.6;
}

.review-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 12rpx;
}

.review-action {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 24rpx;
  color: #909399;
}

/* 同类推荐 */
.recommend-scroll {
  white-space: nowrap;
}

.recommend-list {
  display: flex;
  gap: 20rpx;
}

.recommend-item {
  width: 180rpx;
  flex-shrink: 0;
}

.recommend-cover {
  width: 180rpx;
  height: 240rpx;
  border-radius: 16rpx;
  box-shadow: 0 8rpx 18rpx rgba(17, 24, 39, 0.12);
}

.recommend-title {
  display: block;
  font-size: 26rpx;
  color: #303133;
  margin-top: 12rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recommend-author {
  display: block;
  font-size: 22rpx;
  color: #909399;
  margin-top: 4rpx;
}

.recommend-rating {
  display: flex;
  align-items: center;
  gap: 6rpx;
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #ff8e53;
}

/* 底部操作栏 */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.96);
  padding: 16rpx 24rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid rgba(232, 237, 245, 0.86);
  box-shadow: 0 -10rpx 30rpx rgba(26, 29, 41, 0.08);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  z-index: 100;
}

.bottom-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  padding: 20rpx 0;
  font-size: 28rpx;
  color: #606266;

  &:first-child {
    width: 200rpx;
    border-right: 1rpx solid var(--app-border, #e8edf5);
  }

  &.primary {
    flex: 1;
    background: linear-gradient(135deg, var(--u-type-primary-dark) 0%, var(--u-type-primary) 100%);
    color: #fff;
    border-radius: 40rpx;
    margin-left: 20rpx;
    font-weight: 600;
  }
}

/* 写评价按钮 */
.write-review-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  padding: 20rpx;
  margin-top: 8rpx;
  border-top: 1rpx solid var(--app-border, #e8edf5);
  font-size: 28rpx;
  color: var(--u-type-primary);
  font-weight: 500;
}

/* 评价提交表单 */
.review-form {
  padding: 30rpx 32rpx calc(40rpx + env(safe-area-inset-bottom));
  background: var(--app-surface, #fff);
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}

.form-title {
  font-size: 34rpx;
  font-weight: 600;
  color: #303133;
}

.form-body {
  display: flex;
  flex-direction: column;
  gap: 30rpx;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.form-label {
  font-size: 28rpx;
  color: #606266;
  font-weight: 500;
}

.review-textarea {
  width: 100%;
  min-height: 200rpx;
  background: #f5f7fb;
  border: 1rpx solid var(--app-border, #e8edf5);
  border-radius: 18rpx;
  padding: 20rpx;
  font-size: 28rpx;
  color: #303133;
  box-sizing: border-box;
}

.textarea-placeholder {
  color: #c0c4cc;
}

.char-count {
  font-size: 22rpx;
  color: #c0c4cc;
  text-align: right;
}

.form-submit {
  padding-top: 10rpx;
}

@media (prefers-color-scheme: dark) {
  .detail-page {
    background: linear-gradient(180deg, #141821 0%, #101217 100%);
  }

  .action-bar,
  .rating-section,
  .section,
  .review-form {
    background: rgba(31, 34, 43, 0.95);
    border-color: rgba(255, 255, 255, 0.06);
    box-shadow: none;
  }

  .bottom-bar {
    background: rgba(22, 24, 31, 0.96);
    border-top-color: rgba(255, 255, 255, 0.06);
  }

  .section-title,
  .chapter-title,
  .author-name,
  .review-name,
  .recommend-title,
  .form-title {
    color: #e5e6eb;
  }

  .book-desc,
  .review-content,
  .author-books,
  .author-fans,
  .form-label {
    color: #b8bcc7;
  }

  .section-sub,
  .section-more,
  .rating-count,
  .bar-label,
  .bar-percent,
  .author-desc,
  .review-time,
  .recommend-author {
    color: #8b8c91;
  }

  .author-card,
  .review-textarea {
    background: rgba(255, 255, 255, 0.04);
  }

  .bar-track {
    background: rgba(255, 255, 255, 0.08);
  }
}
</style>
