<template>
  <layout nav-title="购物车" show-tabbar tabbar-scope="food">
    <view class="cart-page">
      <!-- 有商品 -->
      <template v-if="cartList.length > 0">
        <scroll-view class="cart-scroll" scroll-y>
          <view class="cart-header">
            <text class="cart-count">共{{ cartTotalCount }}件商品</text>
            <text class="clear-btn" role="button" tabindex="0" @click="onClearCart" @keyup.enter="onClearCart">清空购物车</text>
          </view>

          <view class="cart-list">
            <view
              v-for="item in cartList"
              :key="item.goods.id"
              class="cart-item"
            >
              <image class="item-img" :src="item.goods.image" mode="aspectFill" :alt="item.goods.name" />
              <view class="item-info">
                <text class="item-name">{{ item.goods.name }}</text>
                <text v-if="item.goods.desc" class="item-desc">{{ item.goods.desc }}</text>
                <view class="item-bottom">
                  <view class="price-wrap">
                    <text class="symbol">¥</text>
                    <text class="item-price">{{ item.goods.price.toFixed(2) }}</text>
                  </view>
                  <view class="stepper">
                    <view class="step-btn minus" role="button" tabindex="0" @click="decrease(item.goods.id)" @keyup.enter="decrease(item.goods.id)">
                      <u-icon name="minus" size="22" color="#606266" />
                    </view>
                    <text class="step-count">{{ item.count }}</text>
                    <view class="step-btn plus" role="button" tabindex="0" @click="increase(item.goods)" @keyup.enter="increase(item.goods)">
                      <u-icon name="plus" size="22" color="#fff" />
                    </view>
                  </view>
                </view>
              </view>
            </view>
          </view>

          <!-- 备注 -->
          <view class="remark-section">
            <text class="remark-label">订单备注</text>
            <input
              v-model="remark"
              class="remark-input"
              placeholder="请输入备注信息（选填）"
              placeholder-class="remark-placeholder"
            />
          </view>

          <!-- 费用明细 -->
          <view class="fee-section">
            <view class="fee-row">
              <text class="fee-label">商品小计</text>
              <text class="fee-value">¥{{ cartTotalPrice.toFixed(2) }}</text>
            </view>
            <view class="fee-row">
              <text class="fee-label">配送费</text>
              <text class="fee-value">¥{{ deliveryFee.toFixed(2) }}</text>
            </view>
            <view class="fee-row">
              <text class="fee-label">包装费</text>
              <text class="fee-value">¥{{ packageFee.toFixed(2) }}</text>
            </view>
            <view class="fee-divider" />
            <view class="fee-row total">
              <text class="fee-label">合计</text>
              <view class="total-price-wrap">
                <text class="total-symbol">¥</text>
                <text class="total-price">{{ totalPrice.toFixed(2) }}</text>
              </view>
            </view>
          </view>

          <!-- 底部占位 -->
          <view class="bottom-placeholder" />
        </scroll-view>

        <!-- 底部结算栏 -->
        <view class="bottom-bar">
          <view class="total-info">
            <text class="total-label">合计：</text>
            <view class="total-price-wrap">
              <text class="total-symbol">¥</text>
              <text class="total-price">{{ totalPrice.toFixed(2) }}</text>
            </view>
          </view>
          <view class="submit-btn" role="button" tabindex="0" @click="toSubmit" @keyup.enter="toSubmit">
            <text class="submit-text">提交订单</text>
          </view>
        </view>
      </template>

      <!-- 空购物车 -->
      <view v-else class="empty-cart">
        <view class="empty-icon">🛒</view>
        <text class="empty-title">购物车是空的</text>
        <text class="empty-desc">快去挑选心仪的美食吧~</text>
        <u-button
          text="去点餐"
          type="primary"
          shape="circle"
          size="large"
          @click="goIndex"
        />
      </view>
    </view>
  </layout>
</template>

<script setup lang="ts">
import { APP_ROUTES } from "@/common/navigation";
import layout from "@/pages/layout/layout.vue";
import { useFoodStore, type FoodGoods } from "@/stores/food";
import { computed, ref } from "vue";
import { storeToRefs } from "pinia";

const foodStore = useFoodStore();
const { cartList, cartTotalCount, cartTotalPrice } = storeToRefs(foodStore);

const remark = ref("");
const deliveryFee = ref(3);
const packageFee = ref(2);

const totalPrice = computed(() => {
  return cartTotalPrice.value + deliveryFee.value + packageFee.value;
});

const decrease = (id: string | number) => {
  foodStore.decreaseCart(id);
};

const increase = (goods: FoodGoods) => {
  foodStore.addToCart(goods);
};

const onClearCart = () => {
  uni.showModal({
    title: "提示",
    content: "确定清空购物车吗？",
    success: (res) => {
      if (res.confirm) {
        foodStore.clearCart();
      }
    },
  });
};

const goIndex = () => {
  uni.reLaunch({ url: APP_ROUTES.food.home });
};

const toSubmit = () => {
  if (cartTotalCount.value === 0) return;

  uni.showModal({
    title: "确认下单",
    content: `共${cartTotalCount.value}件商品，合计¥${totalPrice.value.toFixed(2)}`,
    success: (res) => {
      if (res.confirm) {
        const order = foodStore.submitOrder("李家厨房");
        uni.showToast({ title: "下单成功", icon: "success" });
        setTimeout(() => {
          uni.redirectTo({ url: APP_ROUTES.food.orders });
        }, 1500);
      }
    },
  });
};
</script>

<style scoped lang="scss">
.cart-page {
  height: 100%;
  background: #f5f6f8;
}

.cart-scroll {
  height: 100%;
}

.cart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 24rpx 16rpx;
}

.cart-count {
  font-size: 26rpx;
  color: #909399;
}

.clear-btn {
  font-size: 26rpx;
  color: var(--u-type-primary);
}

.cart-list {
  padding: 0 24rpx;
}

.cart-item {
  display: flex;
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.03);
}

.item-img {
  width: 160rpx;
  height: 160rpx;
  border-radius: 12rpx;
  margin-right: 20rpx;
  flex-shrink: 0;
}

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.item-name {
  text-wrap: balance;
  font-size: 30rpx;
  font-weight: 500;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-desc {
  font-size: 22rpx;
  color: #909399;
  margin-top: 8rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 12rpx;
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

.item-price {
  font-size: 32rpx;
  font-weight: 700;
  color: var(--u-type-primary);
}

.stepper {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

/* 减少动画 */
@media (prefers-reduced-motion: reduce) {
  .step-btn { transition: none !important; }
  .submit-btn { transition: none !important; }
}

.step-btn {
  width: 44rpx;
  height: 44rpx;
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

/* 备注 */
.remark-section {
  background: #fff;
  margin: 20rpx 24rpx;
  padding: 24rpx;
  border-radius: 16rpx;
}

.remark-label {
  font-size: 28rpx;
  font-weight: 500;
  color: #303133;
  margin-bottom: 16rpx;
}

.remark-input {
  font-size: 28rpx;
  color: #303133;
  padding: 16rpx;
  background: #f5f6f8;
  border-radius: 10rpx;
}

.remark-placeholder {
  color: #999;
}

/* 费用明细 */
.fee-section {
  background: #fff;
  margin: 0 24rpx 20rpx;
  padding: 24rpx;
  border-radius: 16rpx;
}

.fee-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12rpx 0;

  &.total {
    padding-top: 20rpx;
  }
}

.fee-label {
  font-size: 28rpx;
  color: #606266;
}

.fee-value {
  font-size: 28rpx;
  color: #303133;
}

.fee-divider {
  height: 1rpx;
  background: #eee;
  margin: 12rpx 0;
}

.total-price-wrap {
  display: flex;
  align-items: flex-end;
}

.total-symbol {
  font-size: 24rpx;
  color: var(--u-type-primary);
  font-weight: 600;
}

.total-price {
  font-size: 36rpx;
  font-weight: 700;
  color: var(--u-type-primary);
}

.bottom-placeholder {
  height: 160rpx;
}

/* 底部结算栏 */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 24rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.total-info {
  display: flex;
  align-items: flex-end;
}

.total-label {
  font-size: 28rpx;
  color: #303133;
}

.submit-btn {
  background: linear-gradient(135deg, var(--u-type-primary) 0%, var(--u-type-primary-dark) 100%);
  padding: 20rpx 48rpx;
  border-radius: 40rpx;
  box-shadow: 0 4rpx 16rpx rgba(var(--u-type-primary-rgb, 82, 64, 254), 0.3);

  &:active {
    transform: scale(0.95);
  }
}

.submit-text {
  font-size: 30rpx;
  font-weight: 600;
  color: #fff;
}

/* 空购物车 */
.empty-cart {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 240rpx;
}

.empty-icon {
  font-size: 120rpx;
  margin-bottom: 32rpx;
}

.empty-title {
  text-wrap: balance;
  font-size: 32rpx;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12rpx;
}

.empty-desc {
  font-size: 26rpx;
  color: #909399;
  margin-bottom: 48rpx;
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .cart-page { background: #121212; }
  .cart-header { }
  .cart-count { color: #8b8c91; }
  .clear-btn { color: var(--u-type-primary); }
  .cart-item { background: #1e1e1e; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.15); }
  .item-name { color: #e5e6eb; }
  .item-desc { color: #8b8c91; }
  .step-btn.minus { background: #2a2a2a; border-color: #444; }
  .step-count { color: #e5e6eb; }
  .remark-section { background: #1e1e1e; }
  .remark-label { color: #e5e6eb; }
  .remark-input { background: #2a2a2a; color: #e5e6eb; }
  .fee-section { background: #1e1e1e; }
  .fee-label { color: #b0b3b8; }
  .fee-value { color: #e5e6eb; }
  .fee-divider { background: #2a2a2a; }
  .total-label { color: #e5e6eb; }
  .bottom-bar { background: #1e1e1e; box-shadow: 0 -4rpx 16rpx rgba(0,0,0,0.3); }
  .empty-title { color: #e5e6eb; }
  .empty-desc { color: #8b8c91; }
}
</style>
