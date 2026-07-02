<template>
  <layout :active-tab="0" nav-title="点餐" show-tabbar tabbar-scope="food">
    <scroll-view
      class="food-scroll"
      scroll-y
      :refresher-enabled="true"
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <view class="food-index-page">
        <!-- 搜索栏 -->
        <view class="search-bar">
          <view class="search-input-wrap">
            <u-icon name="search" color="#c0c4cc" size="28" />
            <input
              v-model="keyword"
              class="search-input"
              placeholder="搜索门店或美食"
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

        <!-- Banner 轮播 -->
        <view class="banner-section">
          <swiper
            class="banner-swiper"
            :autoplay="true"
            :interval="3000"
            :circular="true"
            indicator-dots
            indicator-color="rgba(255,255,255,0.4)"
            indicator-active-color="#fff"
          >
            <swiper-item v-for="(banner, idx) in bannerList" :key="idx">
              <image
                class="banner-img"
                :src="banner.image"
                mode="aspectFill"
                alt="推广banner"
                @click="onBannerClick(banner)"
              />
            </swiper-item>
          </swiper>
        </view>

        <!-- 分类导航 -->
        <view class="category-section">
          <scroll-view class="category-scroll" scroll-x :show-scrollbar="false">
            <view class="category-list">
              <view
                v-for="(item, index) in categoryList"
                :key="item.id"
                class="category-item"
                :class="{ active: currentCategory === index }"
                role="button"
                tabindex="0"
                @click="selectCategory(index, item.id)"
                @keyup.enter="selectCategory(index, item.id)"
              >
                <view class="category-icon">{{ item.icon }}</view>
                <text class="category-name">{{ item.name }}</text>
              </view>
            </view>
          </scroll-view>
        </view>

        <!-- 推荐门店标题 -->
        <view class="section-header">
          <view class="section-title-wrap">
            <text class="section-title">附近门店</text>
            <text class="section-subtitle">{{ filteredStoreList.length }}家可用</text>
          </view>
          <view class="only-open-switch" role="button" tabindex="0" @click="onlyOpen = !onlyOpen" @keyup.enter="onlyOpen = !onlyOpen">
            <view class="switch-dot" :class="{ active: onlyOpen }" />
            <text>只看营业</text>
          </view>
        </view>

        <view class="sort-bar">
          <view
            v-for="item in sortList"
            :key="item.value"
            class="sort-item"
            :class="{ active: currentSort === item.value }"
            role="button"
            tabindex="0"
            @click="currentSort = item.value"
            @keyup.enter="currentSort = item.value"
          >
            {{ item.label }}
          </view>
        </view>

        <!-- 门店列表 -->
        <view class="store-list">
          <view
            v-for="store in filteredStoreList"
            :key="store.id"
            class="store-card"
            role="button"
            tabindex="0"
            @click="goStoreGoods(store)"
            @keyup.enter="goStoreGoods(store)"
          >
            <view class="store-img-wrap">
              <image class="store-img" :src="store.logo" mode="aspectFill" :alt="store.name" />
              <view v-if="!store.isOpen" class="store-closed-mask">
                <text class="closed-text">休息中</text>
              </view>
              <view v-if="store.tag" class="store-tag">{{ store.tag }}</view>
            </view>
            <view class="store-info">
              <view class="store-name-row">
                <text class="store-name">{{ store.name }}</text>
                <view v-if="store.isNew" class="new-badge">新店</view>
              </view>
              <text class="store-desc">{{ store.desc }}</text>
              <view class="store-rating">
                <u-rate :count="5" :value="store.rating" :size="24" disabled />
                <text class="rating-score">{{ store.rating.toFixed(1) }}</text>
                <text class="monthly-sales">月售{{ store.sales }}</text>
              </view>
              <view class="store-meta">
                <view class="meta-item">
                  <u-icon name="map" color="#909399" size="22" />
                  <text>{{ store.distance >= 1000 ? (store.distance / 1000).toFixed(1) + 'km' : store.distance + 'm' }}</text>
                </view>
                <view class="meta-item">
                  <u-icon name="clock" color="#909399" size="22" />
                  <text>约{{ store.deliveryTime }}分钟</text>
                </view>
                <view v-if="store.minOrder > 0" class="meta-item">
                  <text class="min-order">¥{{ store.minOrder }}起送</text>
                </view>
              </view>
            </view>
          </view>

          <!-- 空状态 -->
          <view v-if="filteredStoreList.length === 0" class="empty-state">
            <u-icon name="search" color="#ddd" size="120" />
            <text class="empty-text">没有找到相关门店</text>
            <u-button
              text="清除筛选"
              type="primary"
              size="small"
              plain
              @click="resetFilter"
            />
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 浮动购物车按钮 -->
    <view class="cart-float-btn" role="button" tabindex="0" @click="goCart" @keyup.enter="goCart">
      <view class="cart-icon-wrap">
        <u-icon name="shopping-cart" color="#fff" size="44" />
        <view v-if="cartCount > 0" class="cart-badge">{{ cartCount > 99 ? '99+' : cartCount }}</view>
      </view>
      <view class="cart-info">
        <text class="cart-price">¥{{ cartTotalPrice.toFixed(2) }}</text>
        <text class="cart-hint">购物车</text>
      </view>
    </view>
  </layout>
</template>

<script setup lang="ts">
import { APP_ROUTES } from "@/common/navigation";
import layout from "@/pages/layout/layout.vue";
import { useFoodStore } from "@/stores/food";
import { computed, ref } from "vue";
import { onLoad, onShow } from "@dcloudio/uni-app";
import { CurrentSystem, useLocalStore } from "@/stores/local";

interface CategoryItem {
  id: number;
  name: string;
  icon: string;
}

interface StoreItem {
  id: number;
  name: string;
  desc: string;
  logo: string;
  distance: number;
  sales: number;
  rating: number;
  deliveryTime: number;
  minOrder: number;
  categoryId: number;
  isOpen: boolean;
  isNew?: boolean;
  tag?: string;
}

const keyword = ref("");
const currentCategory = ref(0);
const selectedCategoryId = ref(0);
const refreshing = ref(false);
const onlyOpen = ref(false);
const currentSort = ref<"distance" | "rating" | "sales">("distance");
const foodStore = useFoodStore();
const localStore = useLocalStore();

const sortList = [
  { label: "距离最近", value: "distance" },
  { label: "评分最高", value: "rating" },
  { label: "销量优先", value: "sales" },
] as const;

const bannerList = ref([
  { image: "https://img.uviewui.com/swiper/swiper1.jpg", link: "" },
  { image: "https://img.uviewui.com/swiper/swiper2.jpg", link: "" },
  { image: "https://img.uviewui.com/swiper/swiper3.jpg", link: "" },
]);

const categoryList = ref<CategoryItem[]>([
  { id: 0, name: "全部", icon: "🍽️" },
  { id: 1, name: "中餐", icon: "🥢" },
  { id: 2, name: "快餐", icon: "🍔" },
  { id: 3, name: "火锅", icon: "🍲" },
  { id: 4, name: "烧烤", icon: "🍖" },
  { id: 5, name: "甜点", icon: "🍰" },
  { id: 6, name: "饮品", icon: "🧋" },
  { id: 7, name: "日料", icon: "🍣" },
]);

const storeList = ref<StoreItem[]>([
  {
    id: 1,
    name: "李家厨房",
    desc: "精品家常菜 · 特色风味",
    logo: "https://picsum.photos/seed/food1/400/300",
    distance: 580,
    sales: 328,
    rating: 4.8,
    deliveryTime: 25,
    minOrder: 20,
    categoryId: 1,
    isOpen: true,
    isNew: true,
    tag: "招牌",
  },
  {
    id: 2,
    name: "快客汉堡",
    desc: "西式快餐 · 干净卫生",
    logo: "https://picsum.photos/seed/food2/400/300",
    distance: 1200,
    sales: 256,
    rating: 4.5,
    deliveryTime: 15,
    minOrder: 15,
    categoryId: 2,
    isOpen: true,
  },
  {
    id: 3,
    name: "老城火锅",
    desc: "重庆火锅 · 地道口味",
    logo: "https://picsum.photos/seed/food3/400/300",
    distance: 2100,
    sales: 189,
    rating: 4.9,
    deliveryTime: 35,
    minOrder: 50,
    categoryId: 3,
    isOpen: true,
    tag: "热卖",
  },
  {
    id: 4,
    name: "茶百道",
    desc: "鲜果茶饮 · 甜蜜时光",
    logo: "https://picsum.photos/seed/food4/400/300",
    distance: 800,
    sales: 512,
    rating: 4.7,
    deliveryTime: 10,
    minOrder: 0,
    categoryId: 6,
    isOpen: true,
  },
  {
    id: 5,
    name: "寿司の屋",
    desc: "新鲜刺身 · 日式料理",
    logo: "https://picsum.photos/seed/food5/400/300",
    distance: 3500,
    sales: 96,
    rating: 4.6,
    deliveryTime: 40,
    minOrder: 30,
    categoryId: 7,
    isOpen: false,
  },
  {
    id: 6,
    name: "甜蜜时光蛋糕",
    desc: "手工烘焙 · 定制蛋糕",
    logo: "https://picsum.photos/seed/food6/400/300",
    distance: 1500,
    sales: 203,
    rating: 4.8,
    deliveryTime: 30,
    minOrder: 25,
    categoryId: 5,
    isOpen: true,
  },
]);

const cartCount = computed(() => foodStore.cartTotalCount);
const cartTotalPrice = computed(() => foodStore.cartTotalPrice);

onLoad(() => {
  localStore.setCurrentSystem(CurrentSystem.FOOD);
});

onShow(() => {
  localStore.setCurrentSystem(CurrentSystem.FOOD);
});

const filteredStoreList = computed(() => {
  const kw = keyword.value.trim().toLowerCase();

  return storeList.value
    .filter((store) => {
      const categoryMatched =
        selectedCategoryId.value === 0 ||
        store.categoryId === selectedCategoryId.value;
      const keywordMatched =
        !kw ||
        store.name.toLowerCase().includes(kw) ||
        store.desc.toLowerCase().includes(kw);
      const openMatched = !onlyOpen.value || store.isOpen;

      return categoryMatched && keywordMatched && openMatched;
    })
    .sort((a, b) => {
      // 营业中的排前面
      if (a.isOpen !== b.isOpen) return a.isOpen ? -1 : 1;
      if (currentSort.value === "rating") return b.rating - a.rating;
      if (currentSort.value === "sales") return b.sales - a.sales;
      return a.distance - b.distance;
    });
});

const onRefresh = () => {
  refreshing.value = true;
  setTimeout(() => {
    refreshing.value = false;
    uni.showToast({ title: "已刷新", icon: "success" });
  }, 1000);
};

const selectCategory = (index: number, id: number) => {
  currentCategory.value = index;
  selectedCategoryId.value = id;
};

const resetFilter = () => {
  keyword.value = "";
  currentCategory.value = 0;
  selectedCategoryId.value = 0;
  onlyOpen.value = false;
  currentSort.value = "distance";
};

const onBannerClick = (banner: { link: string }) => {
  if (banner.link) {
    uni.navigateTo({ url: banner.link });
  }
};

const goStoreGoods = (store: StoreItem) => {
  if (!store.isOpen) {
    uni.showToast({ title: "门店已打烊，明天再来~", icon: "none" });
    return;
  }
  uni.navigateTo({
    url: `/pages/food/goods/list?storeId=${store.id}&storeName=${encodeURIComponent(store.name)}`,
  });
};

const goCart = () => {
  uni.navigateTo({ url: APP_ROUTES.food.cart });
};
</script>

<style scoped lang="scss">
.food-scroll {
  height: 100%;
}

.food-index-page {
  min-height: 100%;
  background-color: #f5f6f8;
  padding-bottom: 160rpx;
}

/* 搜索栏 */
.search-bar {
  padding: 20rpx 24rpx;
  background: linear-gradient(135deg, var(--u-type-primary) 0%, var(--u-type-primary-dark) 100%);
}

.search-input-wrap {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 40rpx;
  padding: 16rpx 24rpx;
  gap: 12rpx;
}

.search-input {
  flex: 1;
  font-size: 28rpx;
  color: #303133;
}

.search-placeholder {
  color: #999;
  font-size: 28rpx;
}

/* Banner */
.banner-section {
  padding: 20rpx 24rpx;
  background: linear-gradient(135deg, var(--u-type-primary) 0%, var(--u-type-primary-dark) 100%);
  padding-bottom: 40rpx;
}

.banner-swiper {
  height: 280rpx;
  border-radius: 16rpx;
  overflow: hidden;
}

.banner-img {
  width: 100%;
  height: 100%;
  border-radius: 16rpx;
}

/* 分类导航 */
.category-section {
  background: #fff;
  padding: 30rpx 0 20rpx;
  margin-bottom: 20rpx;
  border-radius: 0 0 24rpx 24rpx;
  margin-top: -20rpx;
  position: relative;
  z-index: 1;
}

.category-scroll {
  white-space: nowrap;
}

.category-list {
  display: flex;
  padding: 0 16rpx;
}

.category-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16rpx 24rpx;
  min-width: 120rpx;
  border-radius: 16rpx;
  transition: all 0.3s;

  &.active {
    background: rgba(var(--u-type-primary-rgb, 82, 64, 254), 0.1);

    .category-name {
      color: var(--u-type-primary);
      font-weight: 600;
    }
  }
}

.category-icon {
  font-size: 44rpx;
  margin-bottom: 8rpx;
}

.category-name {
  font-size: 24rpx;
  color: #606266;
  white-space: nowrap;
}

/* 分区标题 */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 24rpx 12rpx;
}

.section-title-wrap {
  display: flex;
  align-items: baseline;
  gap: 12rpx;
}

.section-title {
  text-wrap: balance;
  font-size: 32rpx;
  font-weight: 600;
  color: #303133;
}

.section-subtitle {
  font-size: 24rpx;
  color: #909399;
}

.only-open-switch {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 10rpx 16rpx;
  border-radius: 999rpx;
  background: #fff;
  color: #606266;
  font-size: 24rpx;
  box-shadow: 0 4rpx 14rpx rgba(30, 42, 68, 0.05);
}

.switch-dot {
  width: 20rpx;
  height: 20rpx;
  border-radius: 50%;
  border: 2rpx solid #c0c4cc;
  background: #fff;

  &.active {
    border-color: var(--u-type-primary);
    background: var(--u-type-primary);
    box-shadow: 0 0 0 6rpx rgba(var(--u-type-primary-rgb, 82, 64, 254), 0.12);
  }
}

.sort-bar {
  display: flex;
  gap: 12rpx;
  padding: 0 24rpx 18rpx;
}

.sort-item {
  padding: 12rpx 20rpx;
  border-radius: 999rpx;
  background: #fff;
  color: #687182;
  font-size: 24rpx;
  box-shadow: 0 4rpx 14rpx rgba(30, 42, 68, 0.04);

  &.active {
    color: var(--u-type-primary);
    background: rgba(var(--u-type-primary-rgb, 82, 64, 254), 0.1);
    font-weight: 600;
  }
}

/* 门店列表 */
.store-list {
  padding: 0 24rpx;
}

.store-card {
  display: flex;
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.72);
  box-shadow: 0 10rpx 26rpx rgba(30, 42, 68, 0.06);
  transition: transform 0.2s;

  &:active {
    transform: scale(0.98);
  }
}

.store-img-wrap {
  position: relative;
  width: 180rpx;
  height: 180rpx;
  border-radius: 12rpx;
  overflow: hidden;
  margin-right: 24rpx;
  flex-shrink: 0;
}

.store-img {
  width: 100%;
  height: 100%;
}

.store-closed-mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.closed-text {
  color: #fff;
  font-size: 28rpx;
  font-weight: 600;
}

.store-tag {
  position: absolute;
  top: 0;
  left: 0;
  background: linear-gradient(135deg, var(--u-type-primary), var(--u-type-primary-dark));
  color: #fff;
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 0 0 12rpx 0;
}

.store-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-width: 0;
}

.store-name-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.store-name {
  text-wrap: balance;
  font-size: 32rpx;
  font-weight: 600;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.new-badge {
  font-size: 20rpx;
  color: var(--u-type-primary);
  border: 1rpx solid var(--u-type-primary);
  padding: 2rpx 10rpx;
  border-radius: 6rpx;
  flex-shrink: 0;
}

.store-desc {
  font-size: 24rpx;
  color: #909399;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: 8rpx;
}

.store-rating {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-top: 10rpx;
}

.rating-score {
  font-size: 24rpx;
  color: #ff9900;
  font-weight: 600;
}

.monthly-sales {
  font-size: 22rpx;
  color: #c0c4cc;
}

.store-meta {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-top: 10rpx;
  font-size: 22rpx;
  color: #909399;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4rpx;
}

.min-order {
  color: #909399;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 0;
  gap: 24rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #c0c4cc;
}

/* 浮动购物车按钮 */
.cart-float-btn {
  position: fixed;
  right: 32rpx;
  bottom: calc(120rpx + env(safe-area-inset-bottom));
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, var(--u-type-primary) 0%, var(--u-type-primary-dark) 100%);
  border-radius: 48rpx;
  padding: 16rpx 28rpx 16rpx 20rpx;
  box-shadow: 0 8rpx 24rpx rgba(var(--u-type-primary-rgb, 82, 64, 254), 0.4);
  z-index: 100;
  transition: transform 0.2s;

  &:active {
    transform: scale(0.95);
  }
}

.cart-icon-wrap {
  position: relative;
}

.cart-badge {
  position: absolute;
  top: -12rpx;
  right: -16rpx;
  min-width: 32rpx;
  height: 32rpx;
  padding: 0 8rpx;
  border-radius: 16rpx;
  background: #fff;
  color: var(--u-type-primary);
  font-size: 20rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cart-info {
  margin-left: 16rpx;
  display: flex;
  flex-direction: column;
}

/* 减少动画 */
@media (prefers-reduced-motion: reduce) {
  .cart-float-btn { transition: none !important; }
  .store-card { transition: none !important; }
  .category-item { transition: none !important; }
}

.cart-price {
  font-size: 30rpx;
  font-weight: 700;
  color: #fff;
}

.cart-hint {
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.8);
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .food-index-page { background-color: #121212; }
  .search-bar { background: linear-gradient(135deg, rgba(var(--u-type-primary-rgb, 82, 64, 254), 0.3) 0%, rgba(var(--u-type-primary-rgb, 82, 64, 254), 0.15) 100%); }
  .search-input-wrap { background: #2a2a2a; }
  .search-input { color: #e5e6eb; }
  .banner-section { background: linear-gradient(135deg, rgba(var(--u-type-primary-rgb, 82, 64, 254), 0.3) 0%, rgba(var(--u-type-primary-rgb, 82, 64, 254), 0.15) 100%); }
  .category-section { background: #1e1e1e; }
  .category-name { color: #b0b3b8; }
  .category-item.active { background: rgba(var(--u-type-primary-rgb, 82, 64, 254), 0.15); }
  .category-item.active .category-name { color: var(--u-type-primary); }
  .section-title { color: #e5e6eb; }
  .section-subtitle { color: #8b8c91; }
  .only-open-switch,
  .sort-item { background: #1e1e1e; color: #b0b3b8; box-shadow: none; }
  .sort-item.active { background: rgba(var(--u-type-primary-rgb, 82, 64, 254), 0.15); color: var(--u-type-primary); }
  .store-card { background: #1e1e1e; box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.2); }
  .store-name { color: #e5e6eb; }
  .store-desc { color: #8b8c91; }
  .monthly-sales { color: #8b8c91; }
  .store-meta { color: #8b8c91; }
  .meta-item { color: #8b8c91; }
  .min-order { color: #8b8c91; }
  .empty-text { color: #666; }
}
</style>
