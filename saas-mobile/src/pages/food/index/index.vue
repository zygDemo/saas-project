<template>
  <view class="food-index-page">
    <view class="search-bar">
      <u-search v-model="keyword" placeholder="搜索门店/商品" @change="onSearch"></u-search>
    </view>

    <view class="banner-section">
      <u-swiper :list="bannerList" :autoplay="true" :interval="3000" @click="bannerClick"></u-swiper>
    </view>

    <view class="category-section">
      <scroll-view class="category-scroll" scroll-x>
        <view class="category-list">
          <view
            v-for="(item, index) in categoryList"
            :key="item.id"
            class="category-item"
            :class="{ active: currentCategory === index }"
            @click="selectCategory(index, item.id)"
          >
            {{ item.name }}
          </view>
        </view>
      </scroll-view>
    </view>

    <view class="store-list">
      <view
        v-for="store in filteredStoreList"
        :key="store.id"
        class="store-card"
        @click="goStoreGoods(store)"
      >
        <image class="store-img" :src="store.logo" mode="aspectFill"></image>
        <view class="store-info">
          <view class="store-name">{{ store.name }}</view>
          <view class="store-desc">{{ store.desc }}</view>
          <view class="store-meta">
            <text class="distance">{{ store.distance }}m</text>
            <text class="sales">月售{{ store.sales }}</text>
          </view>
        </view>
        <u-icon name="right-arrow" color="#c0c4cc" size="26"></u-icon>
      </view>
    </view>

    <view class="cart-btn" @click="goCart">
      <u-icon name="cart" color="#fff" size="40"></u-icon>
      <view v-if="cartCount > 0" class="badge">{{ cartCount }}</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onLoad, onShow } from "@dcloudio/uni-app";
import { useFoodStore } from "@/stores/food";

interface CategoryItem {
  id: number;
  name: string;
}

interface StoreItem {
  id: number;
  name: string;
  desc: string;
  logo: string;
  distance: number;
  sales: number;
  categoryId: number;
}

const keyword = ref("");
const currentCategory = ref(0);
const selectedCategoryId = ref(0);
const foodStore = useFoodStore();

const bannerList = ref([
  { image: "https://img.uviewui.com/swiper/swiper1.jpg" },
  { image: "https://img.uviewui.com/swiper/swiper2.jpg" },
  { image: "https://img.uviewui.com/swiper/swiper3.jpg" },
]);

const categoryList = ref<CategoryItem[]>([
  { id: 0, name: "全部" },
  { id: 1, name: "中餐" },
  { id: 2, name: "快餐" },
  { id: 3, name: "火锅" },
  { id: 4, name: "烧烤" },
  { id: 5, name: "奶茶甜点" },
]);

const storeList = ref<StoreItem[]>([
  {
    id: 1,
    name: "李家厨房",
    desc: "精品家常菜 · 特色风味",
    logo: "https://via.placeholder.com/160x160/FF6B6B/ffffff?text=餐馆",
    distance: 580,
    sales: 328,
    categoryId: 1,
  },
  {
    id: 2,
    name: "快客汉堡",
    desc: "西式快餐 · 干净卫生",
    logo: "https://via.placeholder.com/160x160/4ECDC4/ffffff?text=汉堡",
    distance: 1200,
    sales: 256,
    categoryId: 2,
  },
  {
    id: 3,
    name: "老城火锅",
    desc: "重庆火锅 · 地道口味",
    logo: "https://via.placeholder.com/160x160/FFA62B/ffffff?text=火锅",
    distance: 2100,
    sales: 189,
    categoryId: 3,
  },
]);

const cartCount = computed(() => foodStore.cartTotalCount);

const filteredStoreList = computed(() => {
  const kw = keyword.value.trim().toLowerCase();

  return storeList.value.filter((store) => {
    const categoryMatched = selectedCategoryId.value === 0 || store.categoryId === selectedCategoryId.value;
    const keywordMatched =
      !kw ||
      store.name.toLowerCase().includes(kw) ||
      store.desc.toLowerCase().includes(kw);

    return categoryMatched && keywordMatched;
  });
});

onLoad(() => {});
onShow(() => {});

const onSearch = (value: string) => {
  keyword.value = value;
};

const selectCategory = (index: number, id: number) => {
  currentCategory.value = index;
  selectedCategoryId.value = id;
};

const bannerClick = (item: unknown) => {
  console.log("click banner", item);
};

const goStoreGoods = (store: StoreItem) => {
  uni.navigateTo({ url: `/pages/food/goods/list?storeId=${store.id}` });
};

const goCart = () => {
  uni.navigateTo({ url: "/pages/food/order/cart" });
};
</script>

<style scoped lang="scss">
.food-index-page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 100rpx;
}

.search-bar {
  padding: 20rpx;
  background: #fff;
}

.banner-section {
  padding: 20rpx;
  background: #fff;
  margin-bottom: 20rpx;
}

.category-section {
  background: #fff;
  padding: 20rpx 0;
  margin-bottom: 20rpx;
}

.category-scroll {
  white-space: nowrap;
}

.category-list {
  display: flex;
  padding: 0 20rpx;
}

.category-item {
  padding: 12rpx 24rpx;
  font-size: 28rpx;
  color: #606266;
  margin-right: 16rpx;
  border-radius: 30rpx;
  white-space: nowrap;
  transition: all 0.3s;

  &.active {
    background-color: #f5576c;
    color: #fff;
  }
}

.store-list {
  padding: 0 20rpx;
}

.store-card {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 12rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
}

.store-img {
  width: 160rpx;
  height: 160rpx;
  border-radius: 8rpx;
  margin-right: 20rpx;
}

.store-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 160rpx;
}

.store-name {
  font-size: 32rpx;
  font-weight: 600;
  color: #303133;
}

.store-desc {
  font-size: 26rpx;
  color: #909399;
}

.store-meta {
  display: flex;
  align-items: center;
  gap: 20rpx;
  font-size: 24rpx;
  color: #c0c4cc;
}

.cart-btn {
  position: fixed;
  right: 32rpx;
  bottom: 120rpx;
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff7a45 0%, #f5576c 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10rpx 24rpx rgba(245, 87, 108, 0.28);
}

.badge {
  position: absolute;
  top: -8rpx;
  right: -6rpx;
  min-width: 34rpx;
  height: 34rpx;
  padding: 0 8rpx;
  border-radius: 17rpx;
  background: #ff3b30;
  color: #fff;
  font-size: 22rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
