<template>
  <layout nav-title="商品列表">
    <view class="goods-page">
      <!-- 分类筛选 -->
      <view class="filter-bar">
        <scroll-view scroll-x class="filter-scroll">
          <view class="filter-list">
            <view
              v-for="(item, index) in categories"
              :key="item.id"
              class="filter-item"
              :class="{ 'filter-item--active': currentCategory === index }"
              @click="currentCategory = index"
            >
              <text>{{ item.name }}</text>
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- 商品列表 -->
      <view class="goods-list">
        <view v-for="item in filteredGoods" :key="item.id" class="goods-card">
          <view class="goods-card__img">
            <u-icon :name="getCategoryIcon(item.categoryId) || 'gift'" color="var(--u-type-primary)" size="40" />
          </view>
          <view class="goods-card__info">
            <text class="goods-card__name">{{ item.name }}</text>
            <text class="goods-card__desc">{{ item.description }}</text>
            <view class="goods-card__bottom">
              <text class="goods-card__price">¥{{ item.price }}</text>
              <view class="goods-card__action">
                <view v-if="getCartQuantity(item.id) > 0" class="btn-round btn-minus" @click="minusFromCart(item)">
                  <u-icon name="minus" color="#fff" size="20" />
                </view>
                <text v-if="getCartQuantity(item.id) > 0" class="count-text">{{ getCartQuantity(item.id) }}</text>
                <view class="btn-round btn-plus" @click="addToCart(item)">
                  <u-icon name="plus" color="#fff" size="20" />
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 购物车浮窗 -->
      <view v-if="totalCount > 0" class="cart-float">
        <view class="cart-float__left" @click="goCart">
          <view class="cart-float__icon">
            <u-icon name="shopping-cart-fill" color="#fff" size="32" />
            <view class="cart-float__badge">{{ totalCount }}</view>
          </view>
          <view class="cart-float__price-wrap">
            <text class="cart-float__price">¥{{ totalPrice }}</text>
          </view>
        </view>
        <view class="cart-float__btn" @click="goCart">
          <text>去结算</text>
        </view>
      </view>
    </view>
  </layout>
</template>

<script setup lang="ts">
import layout from "@/components/layout/layout.vue";
import { computed, ref, onMounted } from "vue";
import { useFoodApi, type FoodCategory, type FoodCartItem } from "@/api/food";
import type { FoodDish } from "@/types/api/contract";
import { APP_ROUTES } from "@/common/navigation";

const foodApi = useFoodApi();

const currentCategory = ref(0);
const categories = ref<FoodCategory[]>([]);
const allDishes = ref<FoodDish[]>([]);
const cartItems = ref<FoodCartItem[]>([]);

const getCategoryIcon = (categoryId: number) => {
  const cat = categories.value.find(c => c.id === categoryId);
  return cat?.icon || "gift";
};

const filteredGoods = computed(() => {
  if (currentCategory.value === 0) return allDishes.value;
  const cat = categories.value[currentCategory.value];
  if (!cat) return [];
  return allDishes.value.filter(item => item.categoryId === cat.id);
});

const getCartQuantity = (dishId: number) => {
  const cartItem = cartItems.value.find(item => item.dishId === dishId);
  return cartItem?.quantity || 0;
};

const totalCount = computed(() => cartItems.value.reduce((sum, item) => sum + item.quantity, 0));

const totalPrice = computed(() =>
  cartItems.value.reduce((sum, item) => sum + Number(item.dish.price) * item.quantity, 0).toFixed(2)
);

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

const loadCart = async () => {
  try {
    const res = await foodApi.getCart();
    if (res?.data) {
      cartItems.value = res.data;
    }
  } catch (e) {
    console.error("加载购物车失败:", e);
  }
};

const addToCart = async (item: FoodDish) => {
  try {
    await foodApi.addToCart({ dishId: item.id, quantity: 1 });
    await loadCart();
    uni.showToast({ title: `已添加 ${item.name}`, icon: "success" });
  } catch (e) {
    uni.showToast({ title: "添加失败", icon: "error" });
  }
};

const minusFromCart = async (item: FoodDish) => {
  const currentQty = getCartQuantity(item.id);
  try {
    if (currentQty <= 1) {
      await foodApi.updateCartQuantity(item.id, 0);
    } else {
      await foodApi.updateCartQuantity(item.id, currentQty - 1);
    }
    await loadCart();
  } catch (e) {
    uni.showToast({ title: "操作失败", icon: "error" });
  }
};

const goCart = () => uni.navigateTo({ url: APP_ROUTES.food.cart });

onMounted(() => {
  loadData();
  loadCart();
});
</script>

<style scoped lang="scss">
.goods-page {
  min-height: 100%;
  background-color: #f5f7fa;
  padding-bottom: 140rpx;
}

// 筛选栏
.filter-bar {
  background: #fff;
  padding: 24rpx 0;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.filter-scroll {
  white-space: nowrap;
}

.filter-list {
  display: inline-flex;
  padding: 0 30rpx;
  gap: 16rpx;
}

.filter-item {
  padding: 14rpx 32rpx;
  border-radius: 30rpx;
  background: #f5f7fa;
  transition: all 0.2s;

  text {
    font-size: 26rpx;
    color: #606266;
  }

  &--active {
    background: var(--u-type-primary);

    text {
      color: #fff;
      font-weight: 500;
    }
  }
}

// 商品列表
.goods-list {
  padding: 24rpx 30rpx;
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
    margin-top: 6rpx;
  }

  &__bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__price {
    font-size: 34rpx;
    font-weight: 700;
    color: var(--u-type-primary);
  }

  &__action {
    display: flex;
    align-items: center;
    gap: 16rpx;
  }
}

.btn-round {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-minus {
  background: #c0c4cc;
}

.btn-plus {
  background: var(--u-type-primary);
}

.count-text {
  font-size: 28rpx;
  font-weight: 600;
  color: #303133;
  min-width: 40rpx;
  text-align: center;
}

// 购物车浮窗
.cart-float {
  position: fixed;
  bottom: 30rpx;
  left: 30rpx;
  right: 30rpx;
  height: 100rpx;
  background: #303133;
  border-radius: 50rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12rpx 0 24rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.2);
  z-index: 100;

  &__left {
    display: flex;
    align-items: center;
    gap: 16rpx;
  }

  &__icon {
    position: relative;
    width: 80rpx;
    height: 80rpx;
    background: var(--u-type-primary);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__badge {
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

  &__price-wrap {
    display: flex;
    align-items: baseline;
    gap: 4rpx;
  }

  &__price {
    font-size: 36rpx;
    font-weight: 700;
    color: #fff;
  }

  &__btn {
    height: 72rpx;
    padding: 0 40rpx;
    background: var(--u-type-primary);
    border-radius: 36rpx;
    display: flex;
    align-items: center;
    justify-content: center;

    text {
      font-size: 28rpx;
      font-weight: 600;
      color: #fff;
    }
  }
}
</style>
