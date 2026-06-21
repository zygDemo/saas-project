<template>
  <layout nav-title="书城" :back="true">
    <scroll-view
      class="store-scroll"
      scroll-y
      :refresher-enabled="true"
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <view class="store-page">
        <!-- 搜索栏 -->
        <view class="search-section">
          <view class="search-bar">
            <view class="search-input-wrap">
              <u-icon name="search" color="#c0c4cc" size="28" />
              <input
                v-model="keyword"
                class="search-input"
                placeholder="搜索书名、作者或关键词"
                placeholder-class="search-placeholder"
                confirm-type="search"
                @confirm="onSearch"
              />
              <u-button
                v-if="keyword"
                text="搜索"
                type="primary"
                size="mini"
                @click="onSearch"
              />
            </view>
          </view>
        </view>

        <!-- 分类标签 -->
        <view class="category-tabs">
          <view
            v-for="(tab, idx) in mainTabs"
            :key="tab.id"
            class="tab-item"
            :class="{ active: currentMainTab === idx }"
            @click="switchMainTab(idx)"
          >
            <text class="tab-text">{{ tab.name }}</text>
            <view v-if="currentMainTab === idx" class="tab-indicator" />
          </view>
        </view>

        <!-- 子分类 -->
        <scroll-view class="sub-category-scroll" scroll-x :show-scrollbar="false">
          <view class="sub-category-list">
            <view
              v-for="(sub, idx) in currentSubTabs"
              :key="sub.id"
              class="sub-category-item"
              :class="{ active: currentSubTab === idx }"
              @click="switchSubTab(idx)"
            >
              <text>{{ sub.name }}</text>
            </view>
          </view>
        </scroll-view>

        <!-- Banner 轮播 -->
        <view v-if="!keyword" class="banner-section">
          <swiper
            class="banner-swiper"
            :autoplay="true"
            :interval="4000"
            :circular="true"
            indicator-dots
            indicator-color="rgba(255,255,255,0.4)"
            indicator-active-color="#fff"
          >
            <swiper-item v-for="(banner, idx) in bannerList" :key="idx">
              <view class="banner-item" @click="onBannerClick(banner)">
                <image class="banner-img" :src="banner.image" mode="aspectFill" />
                <view class="banner-overlay">
                  <text class="banner-title">{{ banner.title }}</text>
                  <text class="banner-desc">{{ banner.desc }}</text>
                </view>
              </view>
            </swiper-item>
          </swiper>
        </view>

        <!-- 功能入口 -->
        <view v-if="!keyword" class="function-grid">
          <view class="function-item" @click="goRanking">
            <view class="function-icon" style="background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%)">
              <u-icon name="list" color="#fff" size="36" />
            </view>
            <text class="function-text">排行榜</text>
          </view>
          <view class="function-item" @click="goFreeBooks">
            <view class="function-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
              <u-icon name="gift" color="#fff" size="36" />
            </view>
            <text class="function-text">限免</text>
          </view>
          <view class="function-item" @click="goBookList">
            <view class="function-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)">
              <u-icon name="star" color="#fff" size="36" />
            </view>
            <text class="function-text">书单</text>
          </view>
          <view class="function-item" @click="goFinish">
            <view class="function-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)">
              <u-icon name="checkmark-circle" color="#fff" size="36" />
            </view>
            <text class="function-text">完结</text>
          </view>
          <view class="function-item" @click="goAuthor">
            <view class="function-icon" style="background: linear-gradient(135deg, #a8e6cf 0%, #3dc1d3 100%)">
              <u-icon name="account" color="#fff" size="36" />
            </view>
            <text class="function-text">作者</text>
          </view>
        </view>

        <!-- 热门推荐 -->
        <view v-if="!keyword" class="section">
          <view class="section-header">
            <text class="section-title">🔥 热门推荐</text>
            <view class="section-more" @click="viewMore('hot')">
              <text>更多</text>
              <u-icon name="arrow-right" color="#909399" size="20" />
            </view>
          </view>
          <scroll-view class="hot-scroll" scroll-x :show-scrollbar="false">
            <view class="hot-list">
              <view
                v-for="book in hotBooks"
                :key="book.id"
                class="hot-item"
                @click="goDetail(book)"
              >
                <view class="hot-cover-wrap">
                  <image class="hot-cover" :src="book.cover" mode="aspectFill" />
                  <view v-if="book.isHot" class="hot-badge">HOT</view>
                </view>
                <text class="hot-title">{{ book.title }}</text>
                <text class="hot-author">{{ book.author }}</text>
                <view class="hot-stats">
                  <u-icon name="eye" color="#909399" size="16" />
                  <text>{{ formatNumber(book.views) }}</text>
                </view>
              </view>
            </view>
          </scroll-view>
        </view>

        <!-- 限免专区 -->
        <view v-if="!keyword" class="section">
          <view class="section-header">
            <view class="section-title-wrap">
              <text class="section-title">🎁 限时免费</text>
              <view class="countdown-wrap">
                <text class="countdown-label">距结束</text>
                <view class="countdown-item">{{ countdown.hours }}</view>
                <text class="countdown-sep">:</text>
                <view class="countdown-item">{{ countdown.minutes }}</view>
                <text class="countdown-sep">:</text>
                <view class="countdown-item">{{ countdown.seconds }}</view>
              </view>
            </view>
            <view class="section-more" @click="goFreeBooks">
              <text>更多</text>
              <u-icon name="arrow-right" color="#909399" size="20" />
            </view>
          </view>
          <scroll-view class="free-scroll" scroll-x :show-scrollbar="false">
            <view class="free-list">
              <view
                v-for="book in freeBooks"
                :key="book.id"
                class="free-item"
                @click="goDetail(book)"
              >
                <image class="free-cover" :src="book.cover" mode="aspectFill" />
                <text class="free-title">{{ book.title }}</text>
                <view class="free-original">原价 ¥{{ book.originalPrice }}</view>
                <view class="free-price">免费</view>
              </view>
            </view>
          </scroll-view>
        </view>

        <!-- 排行榜 -->
        <view v-if="!keyword" class="section">
          <view class="section-header">
            <text class="section-title">📊 排行榜</text>
            <view class="rank-tabs">
              <view
                v-for="(tab, idx) in rankTabs"
                :key="tab.id"
                class="rank-tab"
                :class="{ active: currentRankTab === idx }"
                @click="switchRankTab(idx)"
              >
                <text>{{ tab.name }}</text>
              </view>
            </view>
          </view>
          <view class="rank-list">
            <view
              v-for="(book, idx) in rankBooks"
              :key="book.id"
              class="rank-item"
              @click="goDetail(book)"
            >
              <view class="rank-index" :class="{ 'top-3': idx < 3 }">
                <text>{{ idx + 1 }}</text>
              </view>
              <image class="rank-cover" :src="book.cover" mode="aspectFill" />
              <view class="rank-info">
                <text class="rank-title">{{ book.title }}</text>
                <text class="rank-author">{{ book.author }}</text>
                <view class="rank-meta">
                  <view class="rank-tag" :class="book.isSerial ? 'serial' : 'finish'">
                    {{ book.isSerial ? '连载' : '完结' }}
                  </view>
                  <text class="rank-category">{{ book.category }}</text>
                  <text class="rank-views">{{ formatNumber(book.views) }}人在读</text>
                </view>
              </view>
            </view>
          </view>
        </view>

        <!-- 精选书单 -->
        <view v-if="!keyword" class="section">
          <view class="section-header">
            <text class="section-title">📚 精选书单</text>
            <view class="section-more" @click="goBookList">
              <text>更多</text>
              <u-icon name="arrow-right" color="#909399" size="20" />
            </view>
          </view>
          <scroll-view class="booklist-scroll" scroll-x :show-scrollbar="false">
            <view class="booklist-list">
              <view
                v-for="list in bookLists"
                :key="list.id"
                class="booklist-item"
                @click="goBookListDetail(list)"
              >
                <view class="booklist-cover-wrap">
                  <image class="booklist-cover" :src="list.covers[0]" mode="aspectFill" />
                  <image class="booklist-cover booklist-cover-2" :src="list.covers[1]" mode="aspectFill" />
                  <image class="booklist-cover booklist-cover-3" :src="list.covers[2]" mode="aspectFill" />
                </view>
                <view class="booklist-info">
                  <text class="booklist-title">{{ list.title }}</text>
                  <text class="booklist-desc">{{ list.desc }}</text>
                  <text class="booklist-count">{{ list.bookCount }}本</text>
                </view>
              </view>
            </view>
          </scroll-view>
        </view>

        <!-- 搜索结果 / 全部书籍 -->
        <view class="section">
          <view class="section-header">
            <text class="section-title">{{ keyword ? '搜索结果' : '精选好书' }}</text>
            <view v-if="!keyword" class="filter-wrap">
              <view
                v-for="filter in filters"
                :key="filter.id"
                class="filter-item"
                :class="{ active: currentFilter === filter.id }"
                @click="currentFilter = filter.id"
              >
                <text>{{ filter.name }}</text>
              </view>
            </view>
          </view>
          <view class="book-list">
            <view
              v-for="book in filteredBooks"
              :key="book.id"
              class="book-card"
              @click="goDetail(book)"
            >
              <image class="book-cover" :src="book.cover" mode="aspectFill" />
              <view class="book-info">
                <text class="book-title">{{ book.title }}</text>
                <text class="book-author">{{ book.author }}</text>
                <view class="book-tags">
                  <text class="tag" :class="book.isSerial ? 'serial' : 'finish'">
                    {{ book.isSerial ? '连载' : '完结' }}
                  </text>
                  <text class="tag category">{{ book.category }}</text>
                  <text class="tag word-count">{{ book.wordCount }}</text>
                </view>
                <view class="book-rating">
                  <u-rate :count="5" :value="book.rating" :size="20" disabled />
                  <text class="rating-score">{{ book.rating.toFixed(1) }}</text>
                </view>
                <text class="book-desc">{{ book.desc }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
  </layout>
</template>

<script setup lang="ts">
import layout from "@/pages/layout/layout.vue";
import { computed, ref, onMounted, onUnmounted } from "vue";

interface BookItem {
  id: string;
  title: string;
  author: string;
  cover: string;
  category: string;
  isSerial: boolean;
  isHot?: boolean;
  views: number;
  desc: string;
  totalChapters: number;
  wordCount: string;
  rating: number;
  originalPrice?: number;
}

interface BannerItem {
  id: string;
  image: string;
  title: string;
  desc: string;
  link?: string;
}

interface BookList {
  id: string;
  title: string;
  desc: string;
  bookCount: number;
  covers: string[];
}

const keyword = ref("");
const currentMainTab = ref(0);
const currentSubTab = ref(0);
const currentRankTab = ref(0);
const currentFilter = ref("hot");
const refreshing = ref(false);
let countdownTimer: ReturnType<typeof setInterval> | null = null;

const mainTabs = [
  { id: 0, name: "男生" },
  { id: 1, name: "女生" },
  { id: 2, name: "出版" },
];

const subTabs = [
  [
    { id: 0, name: "全部" },
    { id: 1, name: "玄幻" },
    { id: 2, name: "仙侠" },
    { id: 3, name: "都市" },
    { id: 4, name: "历史" },
    { id: 5, name: "科幻" },
    { id: 6, name: "游戏" },
    { id: 7, name: "悬疑" },
    { id: 8, name: "武侠" },
    { id: 9, name: "奇幻" },
  ],
  [
    { id: 0, name: "全部" },
    { id: 1, name: "现代言情" },
    { id: 2, name: "古代言情" },
    { id: 3, name: "仙侠奇缘" },
    { id: 4, name: "浪漫青春" },
    { id: 5, name: "悬疑推理" },
    { id: 6, name: "科幻空间" },
    { id: 7, name: "宫斗宅斗" },
    { id: 8, name: "经商种田" },
  ],
  [
    { id: 0, name: "全部" },
    { id: 1, name: "文学" },
    { id: 2, name: "小说" },
    { id: 3, name: "传记" },
    { id: 4, name: "历史" },
    { id: 5, name: "哲学" },
    { id: 6, name: "经济" },
    { id: 7, name: "科技" },
    { id: 8, name: "艺术" },
  ],
];

const currentSubTabs = computed(() => subTabs[currentMainTab.value] || subTabs[0]);

const rankTabs = [
  { id: 0, name: "畅销榜" },
  { id: 1, name: "热搜榜" },
  { id: 2, name: "完结榜" },
  { id: 3, name: "新书榜" },
];

const filters = [
  { id: "hot", name: "最热" },
  { id: "new", name: "最新" },
  { id: "finish", name: "完结" },
  { id: "serial", name: "连载" },
];

const countdown = ref({ hours: "05", minutes: "23", seconds: "45" });

const bannerList = ref<BannerItem[]>([
  {
    id: "1",
    image: "https://picsum.photos/seed/banner1/750/300",
    title: "新书推荐",
    desc: "《诡秘之主》作者新书上线",
    link: "",
  },
  {
    id: "2",
    image: "https://picsum.photos/seed/banner2/750/300",
    title: "限时免费",
    desc: "精选100本好书限时畅读",
    link: "",
  },
  {
    id: "3",
    image: "https://picsum.photos/seed/banner3/750/300",
    title: "完本推荐",
    desc: "经典完本，一口气看完",
    link: "",
  },
]);

const bookList = ref<BookItem[]>([
  {
    id: "1",
    title: "斗破苍穹",
    author: "天蚕土豆",
    cover: "https://picsum.photos/seed/book1/200/280",
    category: "玄幻",
    isSerial: false,
    isHot: true,
    views: 12580000,
    desc: "三十年河东，三十年河西，莫欺少年穷！",
    totalChapters: 1648,
    wordCount: "532万字",
    rating: 4.8,
  },
  {
    id: "2",
    title: "凡人修仙传",
    author: "忘语",
    cover: "https://picsum.photos/seed/book2/200/280",
    category: "仙侠",
    isSerial: false,
    isHot: true,
    views: 9870000,
    desc: "凡人流鼻祖之作",
    totalChapters: 2446,
    wordCount: "746万字",
    rating: 4.7,
  },
  {
    id: "3",
    title: "诡秘之主",
    author: "爱潜水的乌贼",
    cover: "https://picsum.photos/seed/book3/200/280",
    category: "玄幻",
    isSerial: false,
    isHot: true,
    views: 8650000,
    desc: "蒸汽与机械的世界",
    totalChapters: 1432,
    wordCount: "428万字",
    rating: 4.9,
  },
  {
    id: "4",
    title: "大奉打更人",
    author: "卖报小郎君",
    cover: "https://picsum.photos/seed/book4/200/280",
    category: "仙侠",
    isSerial: true,
    views: 7890000,
    desc: "这个世界有儒释道三教",
    totalChapters: 986,
    wordCount: "356万字",
    rating: 4.6,
  },
  {
    id: "5",
    title: "夜的命名术",
    author: "会说话的肘子",
    cover: "https://picsum.photos/seed/book5/200/280",
    category: "都市",
    isSerial: true,
    views: 6540000,
    desc: "黑夜给了我黑色的眼睛",
    totalChapters: 756,
    wordCount: "268万字",
    rating: 4.5,
  },
  {
    id: "6",
    title: "赘婿",
    author: "愤怒的香蕉",
    cover: "https://picsum.photos/seed/book6/200/280",
    category: "历史",
    isSerial: true,
    views: 5430000,
    desc: "一个现代金融巨头穿越成赘婿",
    totalChapters: 1123,
    wordCount: "412万字",
    rating: 4.4,
  },
  {
    id: "7",
    title: "庆余年",
    author: "猫腻",
    cover: "https://picsum.photos/seed/book7/200/280",
    category: "历史",
    isSerial: false,
    views: 4320000,
    desc: "积善之家，必有余庆",
    totalChapters: 746,
    wordCount: "378万字",
    rating: 4.8,
  },
  {
    id: "8",
    title: "超神机械师",
    author: "齐佩甲",
    cover: "https://picsum.photos/seed/book8/200/280",
    category: "科幻",
    isSerial: false,
    views: 3210000,
    desc: "机械与星际的史诗",
    totalChapters: 1463,
    wordCount: "516万字",
    rating: 4.6,
  },
  {
    id: "9",
    title: "全球高武",
    author: "老鹰吃小鸡",
    cover: "https://picsum.photos/seed/book9/200/280",
    category: "都市",
    isSerial: false,
    views: 2980000,
    desc: "武道巅峰，全球争锋",
    totalChapters: 1256,
    wordCount: "452万字",
    rating: 4.3,
  },
  {
    id: "10",
    title: "十方武圣",
    author: "莫默",
    cover: "https://picsum.photos/seed/book10/200/280",
    category: "玄幻",
    isSerial: true,
    views: 2150000,
    desc: "武道极致，十方无敌",
    totalChapters: 534,
    wordCount: "156万字",
    rating: 4.2,
  },
]);

const freeBooks = ref<BookItem[]>([
  { ...bookList.value[6], originalPrice: 25 },
  { ...bookList.value[7], originalPrice: 30 },
  { ...bookList.value[8], originalPrice: 20 },
  { ...bookList.value[9], originalPrice: 15 },
]);

const bookLists = ref<BookList[]>([
  {
    id: "1",
    title: "玄幻必读经典",
    desc: "不可错过的玄幻巨作",
    bookCount: 50,
    covers: [
      "https://picsum.photos/seed/list1a/200/280",
      "https://picsum.photos/seed/list1b/200/280",
      "https://picsum.photos/seed/list1c/200/280",
    ],
  },
  {
    id: "2",
    title: "仙侠修真精选",
    desc: "修仙问道，逍遥天地",
    bookCount: 35,
    covers: [
      "https://picsum.photos/seed/list2a/200/280",
      "https://picsum.photos/seed/list2b/200/280",
      "https://picsum.photos/seed/list2c/200/280",
    ],
  },
  {
    id: "3",
    title: "都市爽文合集",
    desc: "都市逆袭，爽快阅读",
    bookCount: 42,
    covers: [
      "https://picsum.photos/seed/list3a/200/280",
      "https://picsum.photos/seed/list3b/200/280",
      "https://picsum.photos/seed/list3c/200/280",
    ],
  },
]);

const hotBooks = computed(() => bookList.value.filter((b) => b.isHot).slice(0, 5));
const rankBooks = computed(() => bookList.value.slice(0, 8));

const filteredBooks = computed(() => {
  const kw = keyword.value.trim().toLowerCase();
  const catId = currentSubTab.value;

  return bookList.value
    .filter((book) => {
      const categoryMatched =
        catId === 0 || book.category === currentSubTabs.value[catId]?.name;
      const keywordMatched =
        !kw ||
        book.title.toLowerCase().includes(kw) ||
        book.author.toLowerCase().includes(kw) ||
        book.desc.toLowerCase().includes(kw);
      return categoryMatched && keywordMatched;
    })
    .sort((a, b) => {
      if (currentFilter.value === "hot") return b.views - a.views;
      if (currentFilter.value === "new") return 0;
      if (currentFilter.value === "finish") return a.isSerial === b.isSerial ? 0 : a.isSerial ? 1 : -1;
      if (currentFilter.value === "serial") return a.isSerial === b.isSerial ? 0 : a.isSerial ? -1 : 1;
      return 0;
    });
});

const formatNumber = (num: number) => {
  if (num >= 10000000) return (num / 10000000).toFixed(1) + "千万";
  if (num >= 10000) return (num / 10000).toFixed(1) + "万";
  return num.toString();
};

const updateCountdown = () => {
  let total = 5 * 3600 + 23 * 60 + 45;
  countdownTimer = setInterval(() => {
    total--;
    if (total <= 0) {
      clearInterval(countdownTimer!);
      return;
    }
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    countdown.value = {
      hours: hours.toString().padStart(2, "0"),
      minutes: minutes.toString().padStart(2, "0"),
      seconds: seconds.toString().padStart(2, "0"),
    };
  }, 1000);
};

onMounted(() => {
  updateCountdown();
});

onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer);
  }
});

const onRefresh = () => {
  refreshing.value = true;
  setTimeout(() => {
    refreshing.value = false;
    uni.showToast({ title: "已刷新", icon: "success" });
  }, 1000);
};

const switchMainTab = (idx: number) => {
  currentMainTab.value = idx;
  currentSubTab.value = 0;
};

const switchSubTab = (idx: number) => {
  currentSubTab.value = idx;
};

const switchRankTab = (idx: number) => {
  currentRankTab.value = idx;
};

const onSearch = () => {
  // 触发搜索
};

const onBannerClick = (banner: BannerItem) => {
  if (banner.link) {
    uni.navigateTo({ url: banner.link });
  }
};

const goDetail = (book: BookItem) => {
  uni.navigateTo({
    url: `/pages/reading/store/detail?id=${book.id}`,
  });
};

const goRanking = () => {
  uni.showToast({ title: "排行榜功能开发中", icon: "none" });
};

const goFreeBooks = () => {
  uni.showToast({ title: "限免专区开发中", icon: "none" });
};

const goBookList = () => {
  uni.showToast({ title: "书单功能开发中", icon: "none" });
};

const goFinish = () => {
  currentFilter.value = "finish";
};

const goAuthor = () => {
  uni.showToast({ title: "作者专区开发中", icon: "none" });
};

const goBookListDetail = (list: BookList) => {
  uni.showToast({ title: `查看书单：${list.title}`, icon: "none" });
};

const viewMore = (type: string) => {
  uni.showToast({ title: "更多功能开发中", icon: "none" });
};
</script>

<style scoped lang="scss">
.store-scroll {
  height: 100%;
}

.store-page {
  min-height: 100%;
  background-color: #f5f6f8;
  padding-bottom: 40rpx;
}

/* 搜索栏 */
.search-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20rpx 24rpx 30rpx;
}

.search-bar {
  display: flex;
  align-items: center;
}

.search-input-wrap {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 40rpx;
  padding: 16rpx 24rpx;
  gap: 12rpx;
  flex: 1;
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

/* 分类标签 */
.category-tabs {
  display: flex;
  background: #fff;
  padding: 0 24rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.tab-item {
  position: relative;
  padding: 24rpx 32rpx;
  margin-right: 20rpx;
}

.tab-text {
  font-size: 30rpx;
  color: #606266;

  .active & {
    color: #303133;
    font-weight: 600;
  }
}

.tab-indicator {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 48rpx;
  height: 6rpx;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 3rpx;
}

/* 子分类 */
.sub-category-scroll {
  background: #fff;
  white-space: nowrap;
  border-bottom: 1rpx solid #f5f5f5;
}

.sub-category-list {
  display: flex;
  padding: 16rpx 24rpx;
}

.sub-category-item {
  padding: 10rpx 24rpx;
  margin-right: 16rpx;
  border-radius: 28rpx;
  background: #f5f6f8;
  font-size: 26rpx;
  color: #606266;

  &.active {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
  }
}

/* Banner */
.banner-section {
  padding: 20rpx 24rpx;
}

.banner-swiper {
  height: 240rpx;
  border-radius: 16rpx;
  overflow: hidden;
}

.banner-item {
  position: relative;
  width: 100%;
  height: 100%;
}

.banner-img {
  width: 100%;
  height: 100%;
}

.banner-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx 24rpx;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
}

.banner-title {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #fff;
}

.banner-desc {
  display: block;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 4rpx;
}

/* 功能入口 */
.function-grid {
  display: flex;
  justify-content: space-around;
  background: #fff;
  padding: 30rpx 24rpx;
  margin: 0 24rpx 20rpx;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
}

.function-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
}

.function-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.function-text {
  font-size: 24rpx;
  color: #606266;
}

/* 分区标题 */
.section {
  margin-bottom: 20rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 24rpx 16rpx;
}

.section-title-wrap {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #303133;
}

.section-more {
  display: flex;
  align-items: center;
  font-size: 24rpx;
  color: #909399;
}

/* 倒计时 */
.countdown-wrap {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.countdown-label {
  font-size: 22rpx;
  color: #909399;
}

.countdown-item {
  background: #ff4757;
  color: #fff;
  font-size: 22rpx;
  padding: 4rpx 8rpx;
  border-radius: 4rpx;
  min-width: 36rpx;
  text-align: center;
}

.countdown-sep {
  color: #ff4757;
  font-weight: 600;
}

/* 排行榜标签 */
.rank-tabs {
  display: flex;
  gap: 16rpx;
}

.rank-tab {
  font-size: 24rpx;
  color: #909399;
  padding: 4rpx 12rpx;
  border-radius: 4rpx;

  &.active {
    color: #667eea;
    background: rgba(102, 126, 234, 0.1);
  }
}

/* 筛选 */
.filter-wrap {
  display: flex;
  gap: 16rpx;
}

.filter-item {
  font-size: 24rpx;
  color: #909399;
  padding: 4rpx 12rpx;
  border-radius: 4rpx;

  &.active {
    color: #667eea;
    background: rgba(102, 126, 234, 0.1);
  }
}

/* 热门推荐 */
.hot-scroll {
  white-space: nowrap;
}

.hot-list {
  display: flex;
  padding: 0 24rpx;
}

.hot-item {
  width: 200rpx;
  margin-right: 24rpx;
  flex-shrink: 0;
}

.hot-cover-wrap {
  position: relative;
}

.hot-cover {
  width: 200rpx;
  height: 280rpx;
  border-radius: 12rpx;
}

.hot-badge {
  position: absolute;
  top: 8rpx;
  right: 8rpx;
  background: #ff4757;
  color: #fff;
  font-size: 20rpx;
  padding: 2rpx 8rpx;
  border-radius: 4rpx;
}

.hot-title {
  display: block;
  font-size: 26rpx;
  color: #303133;
  margin-top: 12rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hot-author {
  display: block;
  font-size: 22rpx;
  color: #909399;
  margin-top: 4rpx;
}

.hot-stats {
  display: flex;
  align-items: center;
  gap: 4rpx;
  margin-top: 8rpx;
  font-size: 20rpx;
  color: #909399;
}

/* 限免专区 */
.free-scroll {
  white-space: nowrap;
}

.free-list {
  display: flex;
  padding: 0 24rpx;
}

.free-item {
  width: 180rpx;
  margin-right: 20rpx;
  flex-shrink: 0;
}

.free-cover {
  width: 180rpx;
  height: 240rpx;
  border-radius: 12rpx;
}

.free-title {
  display: block;
  font-size: 26rpx;
  color: #303133;
  margin-top: 12rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.free-original {
  font-size: 22rpx;
  color: #909399;
  text-decoration: line-through;
  margin-top: 4rpx;
}

.free-price {
  font-size: 24rpx;
  color: #ff4757;
  font-weight: 600;
}

/* 排行榜 */
.rank-list {
  padding: 0 24rpx;
  background: #fff;
  margin: 0 24rpx;
  border-radius: 16rpx;
}

.rank-item {
  display: flex;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f5f5f5;

  &:last-child {
    border-bottom: none;
  }
}

.rank-index {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  font-weight: 700;
  color: #909399;

  &.top-3 {
    color: #ff4757;
  }
}

.rank-cover {
  width: 80rpx;
  height: 110rpx;
  border-radius: 8rpx;
  margin: 0 20rpx;
}

.rank-info {
  flex: 1;
  overflow: hidden;
}

.rank-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-author {
  display: block;
  font-size: 24rpx;
  color: #909399;
  margin-top: 8rpx;
}

.rank-meta {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-top: 8rpx;
}

.rank-tag {
  font-size: 20rpx;
  padding: 2rpx 8rpx;
  border-radius: 4rpx;

  &.serial {
    color: #667eea;
    background: rgba(102, 126, 234, 0.1);
  }

  &.finish {
    color: #19be6b;
    background: rgba(25, 190, 107, 0.1);
  }
}

.rank-category {
  font-size: 22rpx;
  color: #909399;
}

.rank-views {
  font-size: 22rpx;
  color: #909399;
}

/* 书单 */
.booklist-scroll {
  white-space: nowrap;
}

.booklist-list {
  display: flex;
  padding: 0 24rpx;
}

.booklist-item {
  width: 320rpx;
  margin-right: 20rpx;
  flex-shrink: 0;
  background: #fff;
  border-radius: 12rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
}

.booklist-cover-wrap {
  position: relative;
  height: 160rpx;
  background: #f5f6f8;
  padding: 16rpx;
}

.booklist-cover {
  position: absolute;
  width: 100rpx;
  height: 140rpx;
  border-radius: 8rpx;
  box-shadow: 0 4rpx 8rpx rgba(0, 0, 0, 0.1);

  &:nth-child(1) {
    left: 30rpx;
    top: 10rpx;
    z-index: 3;
  }

  &:nth-child(2) {
    left: 80rpx;
    top: 16rpx;
    z-index: 2;
  }

  &:nth-child(3) {
    left: 130rpx;
    top: 22rpx;
    z-index: 1;
  }
}

.booklist-info {
  padding: 16rpx;
}

.booklist-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.booklist-desc {
  display: block;
  font-size: 22rpx;
  color: #909399;
  margin-top: 4rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.booklist-count {
  display: block;
  font-size: 22rpx;
  color: #667eea;
  margin-top: 8rpx;
}

/* 书籍列表 */
.book-list {
  padding: 0 24rpx;
}

.book-card {
  display: flex;
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
}

.book-cover {
  width: 160rpx;
  height: 220rpx;
  border-radius: 10rpx;
  flex-shrink: 0;
}

.book-info {
  flex: 1;
  margin-left: 24rpx;
  overflow: hidden;
}

.book-title {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.book-author {
  display: block;
  font-size: 26rpx;
  color: #909399;
  margin-top: 8rpx;
}

.book-tags {
  display: flex;
  gap: 12rpx;
  margin-top: 12rpx;
  flex-wrap: wrap;
}

.tag {
  font-size: 22rpx;
  padding: 4rpx 12rpx;
  border-radius: 4rpx;

  &.serial {
    color: #667eea;
    background: rgba(102, 126, 234, 0.1);
  }

  &.finish {
    color: #19be6b;
    background: rgba(25, 190, 107, 0.1);
  }

  &.category {
    color: #909399;
    background: #f5f6f8;
  }

  &.word-count {
    color: #ff8e53;
    background: rgba(255, 142, 83, 0.1);
  }
}

.book-rating {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-top: 12rpx;
}

.rating-score {
  font-size: 24rpx;
  color: #ff8e53;
  font-weight: 600;
}

.book-desc {
  display: block;
  font-size: 24rpx;
  color: #606266;
  line-height: 1.5;
  margin-top: 12rpx;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
