<template>
  <layout :nav-title="storeName" show-tabbar tabbar-scope="food">
    <view class="goods-page">
      <!-- 门店信息头部 -->
      <view class="store-header">
        <image class="store-bg" :src="storeInfo.logo" mode="aspectFill" :alt="storeInfo.name" />
        <view class="store-overlay">
          <view class="store-main-info">
            <text class="store-name">{{ storeInfo.name }}</text>
            <view class="store-tags">
              <text class="tag">约{{ storeInfo.deliveryTime }}分钟</text>
              <text class="tag">月售{{ storeInfo.sales }}</text>
              <text class="tag">{{ storeInfo.distance >= 1000 ? (storeInfo.distance / 1000).toFixed(1) + 'km' : storeInfo.distance + 'm' }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 分类 + 商品列表 -->
      <view class="goods-content">
        <!-- 左侧分类 -->
        <scroll-view class="category-sidebar" scroll-y :show-scrollbar="false">
          <view
            v-for="(cat, idx) in goodsCategories"
            :key="cat.id"
            class="sidebar-item"
            :class="{ active: currentCatIndex === idx }"
            role="button"
            tabindex="0"
            @click="switchCategory(idx)"
            @keyup.enter="switchCategory(idx)"
          >
            <view v-if="cat.hot" class="hot-dot" />
            <text class="sidebar-text">{{ cat.name }}</text>
          </view>
        </scroll-view>

        <!-- 右侧商品 -->
        <scroll-view
          class="goods-list-wrap"
          scroll-y
          :scroll-into-view="scrollIntoId"
          :show-scrollbar="false"
        >
          <view
            v-for="cat in goodsCategories"
            :id="'cat-' + cat.id"
            :key="cat.id"
            class="goods-group"
          >
            <view class="group-title">
              <text class="group-name">{{ cat.name }}</text>
              <text class="group-desc">{{ cat.desc }}</text>
            </view>

            <view
              v-for="goods in getGoodsByCategory(cat.id)"
              :key="goods.id"
              class="goods-card"
            >
              <view class="goods-img-wrap">
                <image class="goods-img" :src="goods.image" mode="aspectFill" :alt="goods.name" />
                <view v-if="goods.originalPrice" class="discount-tag">
                  {{ Math.round((goods.price / goods.originalPrice) * 10) }}折
                </view>
              </view>
              <view class="goods-info">
                <text class="goods-name">{{ goods.name }}</text>
                <text v-if="goods.desc" class="goods-desc">{{ goods.desc }}</text>
                <view class="goods-tags" v-if="goods.sales > 100">
                  <text class="hot-tag">🔥 热销</text>
                </view>
                <view class="goods-bottom">
                  <view class="price-wrap">
                    <text class="symbol">¥</text>
                    <text class="price">{{ goods.price.toFixed(2) }}</text>
                    <text v-if="goods.originalPrice" class="original-price">
                      ¥{{ goods.originalPrice.toFixed(2) }}
                    </text>
                  </view>
                  <view class="stepper">
                    <view
                      v-if="getGoodsCount(goods.id) > 0"
                      class="step-btn minus"
                      role="button"
                      tabindex="0"
                      @click.stop="decreaseGoods(goods.id)"
                      @keyup.enter="decreaseGoods(goods.id)"
                    >
                      <u-icon name="minus" size="24" color="#606266" />
                    </view>
                    <text v-if="getGoodsCount(goods.id) > 0" class="step-count">
                      {{ getGoodsCount(goods.id) }}
                    </text>
                    <view class="step-btn plus" role="button" tabindex="0" @click.stop="addGoods(goods)" @keyup.enter="addGoods(goods)">
                      <u-icon name="plus" size="24" color="#fff" />
                    </view>
                  </view>
                </view>
              </view>
            </view>
          </view>

          <!-- 底部占位 -->
          <view class="bottom-placeholder" />
        </scroll-view>
      </view>

      <!-- 底部购物车栏 -->
      <view class="bottom-cart-bar" :class="{ 'has-goods': cartCount > 0 }">
        <view class="cart-icon-area" role="button" tabindex="0" @click="goCart" @keyup.enter="goCart">
          <view class="cart-icon-circle">
            <u-icon name="shopping-cart" :color="cartCount > 0 ? '#fff' : '#909399'" size="40" />
            <view v-if="cartCount > 0" class="cart-badge">{{ cartCount }}</view>
          </view>
        </view>
        <view class="cart-price-area">
          <text class="total-price">¥{{ cartTotalPrice.toFixed(2) }}</text>
          <text class="delivery-hint">另需配送费¥3</text>
        </view>
        <view
          class="submit-btn"
          :class="{ disabled: cartCount === 0 }"
          role="button"
          tabindex="0"
          @click="goSubmit"
          @keyup.enter="goSubmit"
        >
          <text class="submit-text">{{ cartCount > 0 ? '去结算' : '未选购商品' }}</text>
        </view>
      </view>
    </view>
  </layout>
</template>

<script setup lang="ts">
import { APP_ROUTES } from "@/common/navigation";
import layout from "@/pages/layout/layout.vue";
import { useFoodStore, type FoodGoods } from "@/stores/food";
import { computed, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";

interface StoreInfo {
  id: number;
  name: string;
  logo: string;
  deliveryTime: number;
  sales: number;
  distance: number;
}

interface GoodsCategory {
  id: number;
  name: string;
  desc: string;
  hot?: boolean;
}

const storeInfo = ref<StoreInfo>({
  id: 1,
  name: "李家厨房",
  logo: "https://picsum.photos/seed/food1/400/300",
  deliveryTime: 25,
  sales: 328,
  distance: 580,
});

const storeName = computed(() => storeInfo.value.name);

const goodsCategories = ref<GoodsCategory[]>([
  { id: 1, name: "招牌推荐", desc: "必点好菜", hot: true },
  { id: 2, name: "热菜", desc: "现炒现做" },
  { id: 3, name: "凉菜", desc: "清爽开胃" },
  { id: 4, name: "主食饮品", desc: "米饭/汤/饮料" },
]);

const goodsList = ref<(FoodGoods & { categoryId: number })[]>([
  {
    id: 1, storeId: 1, categoryId: 1, name: "宫保鸡丁",
    price: 38, originalPrice: 48,
    image: "https://picsum.photos/seed/dish1/200/200",
    sales: 120, stock: 999, desc: "招牌菜品 · 麻辣鲜香",
  },
  {
    id: 2, storeId: 1, categoryId: 1, name: "鱼香肉丝",
    price: 32,
    image: "https://picsum.photos/seed/dish2/200/200",
    sales: 86, stock: 999, desc: "经典川菜 · 酸甜适口",
  },
  {
    id: 3, storeId: 1, categoryId: 2, name: "麻婆豆腐",
    price: 18,
    image: "https://picsum.photos/seed/dish3/200/200",
    sales: 158, stock: 999, desc: "麻辣开胃 · 下饭神器",
  },
  {
    id: 4, storeId: 1, categoryId: 2, name: "水煮肉片",
    price: 48, originalPrice: 58,
    image: "https://picsum.photos/seed/dish4/200/200",
    sales: 92, stock: 999, desc: "麻辣鲜香 · 肉嫩入味",
  },
  {
    id: 5, storeId: 1, categoryId: 2, name: "回锅肉",
    price: 36,
    image: "https://picsum.photos/seed/dish5/200/200",
    sales: 75, stock: 999, desc: "肥而不腻 · 蒜苗飘香",
  },
  {
    id: 6, storeId: 1, categoryId: 3, name: "凉拌黄瓜",
    price: 12,
    image: "https://picsum.photos/seed/dish6/200/200",
    sales: 203, stock: 999, desc: "清脆爽口 · 开胃必备",
  },
  {
    id: 7, storeId: 1, categoryId: 3, name: "皮蛋豆腐",
    price: 16,
    image: "https://picsum.photos/seed/dish7/200/200",
    sales: 145, stock: 999, desc: "细腻嫩滑 · 经典凉菜",
  },
  {
    id: 8, storeId: 1, categoryId: 4, name: "米饭",
    price: 3,
    image: "https://picsum.photos/seed/dish8/200/200",
    sales: 560, stock: 999, desc: "东北大米 · 粒粒饱满",
  },
  {
    id: 9, storeId: 1, categoryId: 4, name: "酸梅汤",
    price: 8,
    image: "https://picsum.photos/seed/dish9/200/200",
    sales: 189, stock: 999, desc: "冰镇解暑 · 酸甜可口",
  },
]);

const currentCatIndex = ref(0);
const scrollIntoId = ref("");
const foodStore = useFoodStore();

const cartCount = computed(() => foodStore.cartTotalCount);
const cartTotalPrice = computed(() => foodStore.cartTotalPrice);

onLoad((options?: Record<string, string>) => {
  if (options?.storeId) {
    storeInfo.value.id = Number(options.storeId) || storeInfo.value.id;
  }
  if (options?.storeName) {
    storeInfo.value.name = decodeURIComponent(options.storeName);
  }
});

const getGoodsByCategory = (categoryId: number) => {
  return goodsList.value.filter((g) => g.categoryId === categoryId);
};

const getGoodsCount = (goodsId: string | number): number => {
  return foodStore.getGoodsCount(goodsId);
};

const switchCategory = (idx: number) => {
  currentCatIndex.value = idx;
  scrollIntoId.value = `cat-${goodsCategories.value[idx].id}`;
  // 清空 scrollIntoId 以便下次可以再次触发
  setTimeout(() => {
    scrollIntoId.value = "";
  }, 500);
};

const addGoods = (goods: FoodGoods) => {
  foodStore.addToCart(goods);
};

const decreaseGoods = (goodsId: string | number) => {
  foodStore.decreaseCart(goodsId);
};

const goCart = () => {
  uni.navigateTo({ url: APP_ROUTES.food.cart });
};

const goSubmit = () => {
  if (cartCount.value === 0) return;
  uni.navigateTo({ url: APP_ROUTES.food.cart });
};
</script>

<style scoped lang="scss">
.goods-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f6f8;
}

/* 门店头部 */
.store-header {
  position: relative;
  height: 240rpx;
  overflow: hidden;
}

.store-bg {
  width: 100%;
  height: 100%;
}

.store-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(transparent 30%, rgba(0, 0, 0, 0.6));
  display: flex;
  align-items: flex-end;
  padding: 24rpx 30rpx;
}

.store-main-info {
  width: 100%;
}

.store-name {
  text-wrap: balance;
  font-size: 36rpx;
  font-weight: 700;
  color: #fff;
  margin-bottom: 12rpx;
}

.store-tags {
  display: flex;
  gap: 16rpx;
}

.tag {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.2);
  padding: 4rpx 12rpx;
  border-radius: 6rpx;
}

/* 分类 + 商品内容区 */
.goods-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* 左侧分类 */
.category-sidebar {
  width: 180rpx;
  background: #fafafa;
  height: 100%;
}

.sidebar-item {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28rpx 16rpx;
  font-size: 26rpx;
  color: #606266;
  transition: all 0.2s;

  &.active {
    background: #fff;
    color: var(--u-type-primary);
    font-weight: 600;

    &::before {
      content: "";
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 6rpx;
      height: 36rpx;
      background: var(--u-type-primary);
      border-radius: 0 3rpx 3rpx 0;
    }
  }
}

.hot-dot {
  position: absolute;
  top: 16rpx;
  right: 16rpx;
  width: 12rpx;
  height: 12rpx;
  background: var(--u-type-primary);
  border-radius: 50%;
}

.sidebar-text {
  text-align: center;
}

/* 右侧商品列表 */
.goods-list-wrap {
  flex: 1;
  height: 100%;
  padding: 0 16rpx;
}

.goods-group {
  padding-top: 20rpx;
}

.group-title {
  display: flex;
  align-items: baseline;
  gap: 12rpx;
  padding-bottom: 16rpx;
}

.group-name {
  text-wrap: balance;
  font-size: 28rpx;
  font-weight: 600;
  color: #303133;
}

.group-desc {
  font-size: 22rpx;
  color: #999;
}

.goods-card {
  display: flex;
  background: #fff;
  border-radius: 12rpx;
  padding: 20rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.03);
}

.goods-img-wrap {
  position: relative;
  width: 160rpx;
  height: 160rpx;
  border-radius: 10rpx;
  overflow: hidden;
  margin-right: 20rpx;
  flex-shrink: 0;
}

.goods-img {
  width: 100%;
  height: 100%;
}

.discount-tag {
  position: absolute;
  top: 0;
  left: 0;
  background: linear-gradient(135deg, var(--u-type-primary), var(--u-type-primary-dark));
  color: #fff;
  font-size: 18rpx;
  padding: 2rpx 8rpx;
  border-radius: 0 0 10rpx 0;
}

.goods-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.goods-name {
  text-wrap: balance;
  font-size: 28rpx;
  font-weight: 500;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.goods-desc {
  font-size: 22rpx;
  color: #909399;
  margin-top: 6rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.goods-tags {
  margin-top: 8rpx;
}

.hot-tag {
  font-size: 20rpx;
  color: var(--u-type-primary);
  background: rgba(var(--u-type-primary-rgb, 82, 64, 254), 0.1);
  padding: 2rpx 8rpx;
  border-radius: 4rpx;
}

.goods-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 10rpx;
}

.price-wrap {
  display: flex;
  align-items: flex-end;
}

.symbol {
  font-size: 22rpx;
  color: var(--u-type-primary);
  font-weight: 600;
}

.price {
  font-size: 32rpx;
  font-weight: 700;
  color: var(--u-type-primary);
}

.original-price {
  margin-left: 10rpx;
  font-size: 22rpx;
  color: #c0c4cc;
  text-decoration: line-through;
}

/* 步进器 */
.stepper {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

/* 减少动画 */
@media (prefers-reduced-motion: reduce) {
  .step-btn { transition: none !important; }
  .sidebar-item { transition: none !important; }
}

.step-btn {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &.minus {
    background: #f5f5f5;
    border: 1rpx solid #e4e7ed;
  }

  &.plus {
    background: linear-gradient(135deg, var(--u-type-primary), var(--u-type-primary-dark));
    box-shadow: 0 4rpx 12rpx rgba(var(--u-type-primary-rgb, 82, 64, 254), 0.3);
  }

  &:active {
    transform: scale(0.9);
  }
}

.step-count {
  font-size: 28rpx;
  font-weight: 600;
  color: #303133;
  min-width: 40rpx;
  text-align: center;
}

.bottom-placeholder {
  height: 160rpx;
}

/* 底部购物车栏 */
.bottom-cart-bar {
  display: flex;
  align-items: center;
  background: #2c2c2c;
  padding: 16rpx 24rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  min-height: 100rpx;

  &.has-goods {
    background: #3a3a3a;
  }
}

.cart-icon-area {
  margin-top: -40rpx;
}

.cart-icon-circle {
  position: relative;
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  background: #3a3a3a;
  border: 4rpx solid #555;
  display: flex;
  align-items: center;
  justify-content: center;

  .has-goods & {
    background: linear-gradient(135deg, var(--u-type-primary), var(--u-type-primary-dark));
    border-color: transparent;
  }
}

.cart-badge {
  position: absolute;
  top: -8rpx;
  right: -8rpx;
  min-width: 32rpx;
  height: 32rpx;
  padding: 0 8rpx;
  border-radius: 16rpx;
  background: #fff;
  color: var(--u-type-primary);
  font-size: 20rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cart-price-area {
  flex: 1;
  margin-left: 24rpx;
}

.total-price {
  font-size: 36rpx;
  font-weight: 700;
  color: #fff;
}

.delivery-hint {
  font-size: 20rpx;
  color: #909399;
  margin-left: 12rpx;
}

.submit-btn {
  background: #555;
  padding: 16rpx 32rpx;
  border-radius: 40rpx;

  .has-goods & {
    background: linear-gradient(135deg, var(--u-type-primary), var(--u-type-primary-dark));
  }

  &.disabled {
    opacity: 0.6;
  }

  &:active {
    transform: scale(0.95);
  }
}

.submit-text {
  font-size: 28rpx;
  font-weight: 600;
  color: #fff;
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .goods-page { background: #121212; }
  .category-sidebar { background: #1e1e1e; }
  .sidebar-item { color: #b0b3b8; }
  .sidebar-item.active { background: #2a2a2a; color: var(--u-type-primary); }
  .sidebar-item.active::before { background: var(--u-type-primary); }
  .hot-dot { background: var(--u-type-primary); }
  .group-name { color: #e5e6eb; }
  .group-desc { color: #8b8c91; }
  .goods-card { background: #1e1e1e; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.15); }
  .goods-name { color: #e5e6eb; }
  .goods-desc { color: #8b8c91; }
  .step-btn.minus { background: #2a2a2a; border-color: #444; }
  .step-count { color: #e5e6eb; }
  .bottom-cart-bar { background: #1a1a1a; }
  .bottom-cart-bar.has-goods { background: #252525; }
  .cart-icon-circle { background: #2a2a2a; border-color: #444; }
  .has-goods .cart-icon-circle { background: linear-gradient(135deg, var(--u-type-primary), var(--u-type-primary-dark)); border-color: transparent; }
}
</style>
