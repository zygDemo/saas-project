<template>
  <layout :active-tab="1" nav-title="购物车" show-tabbar tabbar-scope="food">
    <view class="cart-page">
      <!-- 空状态 -->
      <view v-if="cartList.length === 0" class="empty-state">
        <view class="empty-icon">
          <u-icon name="shopping-cart" color="var(--u-type-primary-disabled)" size="80" />
        </view>
        <text class="empty-text">购物车空空如也</text>
        <text class="empty-desc">快去挑选美食吧</text>
        <u-button text="去点餐" type="primary" shape="round" @click="goHome" />
      </view>

      <!-- 购物车列表 -->
      <view v-else class="cart-list">
        <view class="cart-header">
          <text class="cart-header__title">已选 {{ totalCount }} 件商品</text>
          <text class="cart-header__clear" @click="handleClear">清空</text>
        </view>

        <view v-for="item in cartList" :key="item.id" class="cart-card">
          <view class="cart-card__img">
            <u-icon name="gift" color="var(--u-type-primary)" size="36" />
          </view>
          <view class="cart-card__info">
            <text class="cart-card__name">{{ item.dish.name }}</text>
            <view class="cart-card__bottom">
              <text class="cart-card__price">¥{{ item.dish.price }}</text>
              <view class="cart-card__action">
                <view class="btn-round btn-minus" @click="minusCount(item)">
                  <u-icon name="minus" color="#fff" size="20" />
                </view>
                <text class="count-text">{{ item.quantity }}</text>
                <view class="btn-round btn-plus" @click="addCount(item)">
                  <u-icon name="plus" color="#fff" size="20" />
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 底部结算栏 -->
      <view v-if="cartList.length > 0" class="checkout-bar">
        <view class="checkout-bar__left">
          <text class="checkout-bar__label">合计</text>
          <text class="checkout-bar__price">¥{{ totalPrice }}</text>
        </view>
        <view class="checkout-bar__btn" @click="checkout">
          <text>去结算</text>
        </view>
      </view>
    </view>
  </layout>
</template>

<script setup lang="ts">
import layout from "@/components/layout/layout.vue";
import { computed, ref, onMounted } from "vue";
import { useFoodApi, type FoodCartItem } from "@/api/food";
import { APP_ROUTES } from "@/common/navigation";

const foodApi = useFoodApi();
const cartList = ref<FoodCartItem[]>([]);

const totalCount = computed(() => cartList.value.reduce((sum, item) => sum + item.quantity, 0));

const totalPrice = computed(() =>
  cartList.value.reduce((sum, item) => sum + Number(item.dish.price) * item.quantity, 0).toFixed(2)
);

const loadCart = async () => {
  try {
    const res = await foodApi.getCart();
    if (res?.data) {
      cartList.value = res.data;
    }
  } catch (e) {
    console.error("加载购物车失败:", e);
  }
};

const addCount = async (item: FoodCartItem) => {
  try {
    await foodApi.updateCartQuantity(item.dishId, item.quantity + 1);
    await loadCart();
  } catch (e) {
    uni.showToast({ title: "操作失败", icon: "error" });
  }
};

const minusCount = async (item: FoodCartItem) => {
  try {
    if (item.quantity <= 1) {
      await foodApi.updateCartQuantity(item.dishId, 0);
    } else {
      await foodApi.updateCartQuantity(item.dishId, item.quantity - 1);
    }
    await loadCart();
  } catch (e) {
    uni.showToast({ title: "操作失败", icon: "error" });
  }
};

const handleClear = () => {
  uni.showModal({
    title: "提示",
    content: "确定清空购物车吗？",
    success: async (res) => {
      if (res.confirm) {
        try {
          await foodApi.clearCart();
          cartList.value = [];
        } catch (e) {
          uni.showToast({ title: "操作失败", icon: "error" });
        }
      }
    },
  });
};

const goHome = () => uni.switchTab({ url: APP_ROUTES.food.home });

const checkout = async () => {
  try {
    await foodApi.createOrder();
    uni.showToast({ title: "下单成功", icon: "success" });
    setTimeout(() => {
      uni.navigateTo({ url: APP_ROUTES.food.orders });
    }, 1500);
  } catch (e) {
    uni.showToast({ title: "下单失败", icon: "error" });
  }
};

onMounted(loadCart);
</script>

<style scoped lang="scss">
.cart-page {
  min-height: 100%;
  background-color: #f5f7fa;
  padding-bottom: 140rpx;
}

// 空状态
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 200rpx;
  gap: 20rpx;
}

.empty-icon {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  background: var(--u-type-primary-light);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10rpx;
}

.empty-text {
  font-size: 32rpx;
  font-weight: 600;
  color: #303133;
}

.empty-desc {
  font-size: 26rpx;
  color: #909399;
  margin-bottom: 30rpx;
}

// 购物车列表
.cart-list {
  padding: 24rpx 30rpx;
}

.cart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;

  &__title {
    font-size: 28rpx;
    color: #606266;
  }

  &__clear {
    font-size: 26rpx;
    color: var(--u-type-primary);
  }
}

.cart-card {
  display: flex;
  gap: 24rpx;
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);

  &__img {
    width: 150rpx;
    height: 150rpx;
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

// 底部结算栏
.checkout-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 120rpx;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30rpx;
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.04);
  z-index: 100;

  &__left {
    display: flex;
    align-items: baseline;
    gap: 8rpx;
  }

  &__label {
    font-size: 28rpx;
    color: #606266;
  }

  &__price {
    font-size: 40rpx;
    font-weight: 700;
    color: var(--u-type-primary);
  }

  &__btn {
    height: 80rpx;
    padding: 0 60rpx;
    background: var(--u-type-primary);
    border-radius: 40rpx;
    display: flex;
    align-items: center;
    justify-content: center;

    text {
      font-size: 30rpx;
      font-weight: 600;
      color: #fff;
    }
  }
}
</style>
