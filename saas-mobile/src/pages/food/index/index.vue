<template>
  <layout :active-tab="0" nav-title="点餐" show-tabbar tabbar-scope="food">
    <view class="food-page">
      <!-- 渐变头部 -->
      <view class="hero">
        <view class="hero-bg" />
        <view class="hero-content">
          <view class="hero-left">
            <text class="hero-greeting">予艺美食</text>
            <text class="hero-slogan">精选好味，即刻送达</text>
          </view>
          <view class="hero-avatar" @click="goCart">
            <u-icon name="shopping-cart" color="#fff" size="40" />
            <view v-if="cartCount > 0" class="hero-badge">{{ cartCount }}</view>
          </view>
        </view>
      </view>

      <!-- 搜索栏 -->
      <view class="search-wrap">
        <u-search
          v-model="keyword"
          placeholder="搜索美食、饮品"
          :show-action="false"
          shape="round"
          bg-color="#f5f7fa"
        />
      </view>

      <!-- 分类导航 -->
      <view class="category-section">
        <scroll-view scroll-x class="category-scroll">
          <view class="category-list">
            <view
              v-for="(item, index) in categories"
              :key="item.id"
              class="category-item"
              :class="{ 'category-item--active': currentCategory === index }"
              @click="currentCategory = index"
            >
              <view class="category-icon">
                <u-icon :name="item.icon || 'grid'" :color="currentCategory === index ? '#fff' : 'var(--u-type-primary)'" size="32" />
              </view>
              <text class="category-name">{{ item.name }}</text>
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- 热门推荐 -->
      <view v-if="hotItems.length > 0" class="section">
        <view class="section-header">
          <view class="section-label">
            <view class="section-mark" />
            <text class="section-title">热门推荐</text>
          </view>
        </view>
        <scroll-view scroll-x class="hot-scroll">
          <view class="hot-list">
            <view v-for="item in hotItems" :key="item.id" class="hot-card" @click="addToCart(item)">
              <view class="hot-card__img">
                <u-icon :name="getCategoryIcon(item.categoryId) || 'gift'" color="var(--u-type-primary)" size="44" />
              </view>
              <view class="hot-card__info">
                <text class="hot-card__name">{{ item.name }}</text>
                <view class="hot-card__bottom">
                  <text class="hot-card__price">¥{{ item.price }}</text>
                  <view class="hot-card__tag">热销</view>
                </view>
              </view>
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- 菜品列表 -->
      <view class="section">
        <view class="section-header">
          <view class="section-label">
            <view class="section-mark" />
            <text class="section-title">全部菜品</text>
          </view>
          <text class="section-count">共{{ filteredGoods.length }}款</text>
        </view>
        <view class="goods-list">
          <view v-for="item in filteredGoods" :key="item.id" class="goods-card">
            <view class="goods-card__img">
              <u-icon :name="getCategoryIcon(item.categoryId) || 'gift'" color="var(--u-type-primary)" size="40" />
            </view>
            <view class="goods-card__info">
              <text class="goods-card__name">{{ item.name }}</text>
              <text class="goods-card__desc">{{ item.description }}</text>
              <view class="goods-card__bottom">
                <view class="goods-card__price-wrap">
                  <text class="goods-card__price">¥{{ item.price }}</text>
                  <text v-if="item.originalPrice" class="goods-card__original">¥{{ item.originalPrice }}</text>
                </view>
                <view class="goods-card__action" @click="addToCart(item)">
                  <u-icon name="plus-circle-fill" color="var(--u-type-primary)" size="40" />
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 底部安全区 -->
      <view class="safe-bottom" />
    </view>
  </layout>
</template>

<script setup lang="ts">
import layout from "@/components/layout/layout.vue";
import { computed, ref, onMounted } from "vue";
import { useFoodApi, type FoodCategory } from "@/api/food";
import type { FoodDish } from "@/types/api/contract";
import { APP_ROUTES } from "@/common/navigation";

const foodApi = useFoodApi();

const keyword = ref("");
const currentCategory = ref(0);
const cartCount = ref(0);
const categories = ref<FoodCategory[]>([]);
const allDishes = ref<FoodDish[]>([]);

// 分类对应的图标映射
const iconMap: Record<string, string> = {
  "推荐": "star",
  "主食": "gift",
  "小吃": "thumb-up",
  "饮品": "heart",
  "甜点": "star",
};

const getCategoryIcon = (categoryId: number) => {
  const cat = categories.value.find(c => c.id === categoryId);
  return cat?.icon || iconMap[cat?.name || ""] || "gift";
};

// 热门推荐（销量前4）
const hotItems = computed(() => {
  return [...allDishes.value].sort((a, b) => b.salesCount - a.salesCount).slice(0, 4);
});

// 当前分类的菜品
const filteredGoods = computed(() => {
  if (currentCategory.value === 0) return allDishes.value;
  const cat = categories.value[currentCategory.value];
  if (!cat) return [];
  return allDishes.value.filter(item => item.categoryId === cat.id);
});

const loadData = async () => {
  try {
    const res = await foodApi.getMenuList();
    if (res?.data) {
      categories.value = res.data;
      allDishes.value = res.data.flatMap((cat: FoodCategory) => cat.dishes || []);
    }
  } catch (e) {
    console.error("加载菜单失败:", e);
  }
};

const loadCartCount = async () => {
  try {
    const res = await foodApi.getCart();
    if (res?.data) {
      cartCount.value = res.data.reduce((sum: number, item: any) => sum + item.quantity, 0);
    }
  } catch (e) {
    console.error("加载购物车失败:", e);
  }
};

const addToCart = async (item: FoodDish) => {
  try {
    await foodApi.addToCart({ dishId: item.id, quantity: 1 });
    cartCount.value++;
    uni.showToast({ title: `已添加 ${item.name}`, icon: "success" });
  } catch (e) {
    uni.showToast({ title: "添加失败", icon: "error" });
  }
};

const goCart = () => {
  uni.navigateTo({ url: APP_ROUTES.food.cart });
};

onMounted(() => {
  loadData();
  loadCartCount();
});
</script>

<style scoped lang="scss">
.food-page {
  min-height: 100%;
  background-color: #f5f7fa;
  padding-bottom: 30rpx;
}

// 渐变头部
.hero {
  position: relative;
  padding: 40rpx 30rpx 50rpx;
  overflow: hidden;

  .hero-bg {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: linear-gradient(135deg, var(--u-type-primary-dark), var(--u-type-primary-disabled));
    border-radius: 0 0 32rpx 32rpx;
  }

  .hero-content {
    position: relative;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .hero-left {
    display: flex;
    flex-direction: column;
    gap: 8rpx;
  }

  .hero-greeting {
    font-size: 40rpx;
    font-weight: 700;
    color: #fff;
    letter-spacing: 2rpx;
  }

  .hero-slogan {
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.8);
  }

  .hero-avatar {
    position: relative;
    width: 80rpx;
    height: 80rpx;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .hero-badge {
    position: absolute;
    top: -8rpx;
    right: -8rpx;
    min-width: 32rpx;
    height: 32rpx;
    background: #fff;
    color: var(--u-type-primary);
    border-radius: 16rpx;
    font-size: 20rpx;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 8rpx;
  }
}

// 搜索栏
.search-wrap {
  margin: -30rpx 30rpx 20rpx;
  position: relative;
  z-index: 1;
}

// 分类导航
.category-section {
  margin-bottom: 10rpx;
}

.category-scroll {
  white-space: nowrap;
}

.category-list {
  display: inline-flex;
  padding: 20rpx 30rpx;
  gap: 24rpx;
}

.category-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  transition: all 0.2s;

  &--active {
    .category-icon {
      background: var(--u-type-primary);
      box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.1);
    }
    .category-name {
      color: var(--u-type-primary);
      font-weight: 600;
    }
  }
}

.category-icon {
  width: 88rpx;
  height: 88rpx;
  border-radius: 24rpx;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 20rpx rgba(15, 23, 42, 0.05);
  transition: all 0.2s;
}

.category-name {
  font-size: 24rpx;
  color: #606266;
}

// 通用 section
.section {
  margin: 0 30rpx 30rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.section-label {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.section-mark {
  width: 8rpx;
  height: 28rpx;
  border-radius: 4rpx;
  background: var(--u-type-primary);
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #303133;
}

.section-count {
  font-size: 24rpx;
  color: #909399;
}

// 热门推荐
.hot-scroll {
  white-space: nowrap;
}

.hot-list {
  display: inline-flex;
  gap: 20rpx;
}

.hot-card {
  width: 220rpx;
  background: #fff;
  border-radius: 20rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 20rpx rgba(15, 23, 42, 0.05);

  &__img {
    height: 140rpx;
    background: linear-gradient(135deg, var(--u-type-primary-light), var(--u-type-primary-disabled));
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__info {
    padding: 16rpx 20rpx;
  }

  &__name {
    display: block;
    font-size: 26rpx;
    color: #303133;
    font-weight: 500;
    margin-bottom: 8rpx;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__price {
    font-size: 28rpx;
    color: var(--u-type-primary);
    font-weight: 600;
  }

  &__tag {
    font-size: 18rpx;
    color: #fff;
    background: var(--u-type-primary);
    padding: 2rpx 10rpx;
    border-radius: 6rpx;
  }
}

// 菜品列表
.goods-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.goods-card {
  display: flex;
  gap: 24rpx;
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);

  &__img {
    width: 170rpx;
    height: 170rpx;
    border-radius: 16rpx;
    background: linear-gradient(135deg, var(--u-type-primary-light), var(--u-type-primary-disabled));
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__info {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-width: 0;
  }

  &__name {
    font-size: 30rpx;
    font-weight: 600;
    color: #303133;
  }

  &__desc {
    font-size: 24rpx;
    color: #909399;
    margin-top: 8rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 12rpx;
  }

  &__price-wrap {
    display: flex;
    align-items: baseline;
    gap: 8rpx;
  }

  &__price {
    font-size: 34rpx;
    font-weight: 700;
    color: var(--u-type-primary);
  }

  &__original {
    font-size: 22rpx;
    color: #c0c4cc;
    text-decoration: line-through;
  }

  &__action {
    padding: 8rpx;
  }
}

.safe-bottom {
  height: 20rpx;
}
</style>
