<template>
  <view class="cart-page">
    <view class="cart-list" v-if="cartList.length > 0">
      <view class="cart-item" v-for="item in cartList" :key="item.goods.id">
        <image class="item-img" :src="item.goods.image" mode="aspectFill"></image>
        <view class="item-info">
          <view class="item-name">{{ item.goods.name }}</view>
          <view class="item-price">¥{{ item.goods.price.toFixed(2) }}</view>
        </view>
        <view class="item-count">
          <u-button text="-" size="small" @click="decrease(item.goods.id)"></u-button>
          <text class="count">{{ item.count }}</text>
          <u-button text="+" size="small" @click="increase(item.goods)"></u-button>
        </view>
      </view>
    </view>

    <view class="empty-cart" v-else>
      <image src="https://via.placeholder.com/300x300/EEEEEE/CCCCCC?text=购物车为空" mode="aspectFit"></image>
      <text class="empty-text">购物车还是空的</text>
      <u-button text="去点餐" type="primary" @click="goIndex"></u-button>
    </view>

    <view class="bottom-bar" v-if="cartList.length > 0">
      <view class="total-info">
        <text class="total-label">合计：</text>
        <text class="total-price">¥{{ cartTotalPrice.toFixed(2) }}</text>
      </view>
      <u-button text="去结算" type="primary" @click="toSubmit"></u-button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { APP_ROUTES } from "@/common/navigation";
import { useFoodStore } from '@/stores/food'
import { storeToRefs } from 'pinia'

const foodStore = useFoodStore()
const { cartList, cartTotalPrice } = storeToRefs(foodStore)

const decrease = (id: string | number) => {
  foodStore.decreaseCart(id)
}

const increase = (goods: any) => {
  foodStore.addToCart(goods)
}

const goIndex = () => {
  uni.switchTab({
    url: APP_ROUTES.food.home
  })
}

const toSubmit = () => {
  uni.showToast({ title: '提交订单功能开发中', icon: 'none' })
}
</script>

<style scoped lang="scss">
.cart-page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 120rpx;
}

.cart-list {
  padding: 20rpx;
}

.cart-item {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 12rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;

  .item-img {
    width: 120rpx;
    height: 120rpx;
    border-radius: 8rpx;
    margin-right: 20rpx;
  }

  .item-info {
    flex: 1;

    .item-name {
      font-size: 32rpx;
      font-weight: 500;
      color: #303133;
      margin-bottom: 16rpx;
    }

    .item-price {
      font-size: 30rpx;
      color: #f5576c;
      font-weight: 600;
    }
  }

  .item-count {
    display: flex;
    align-items: center;
    gap: 16rpx;

    .count {
      font-size: 28rpx;
      font-weight: 500;
      min-width: 40rpx;
      text-align: center;
    }
  }
}

.empty-cart {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 200rpx;

  image {
    width: 300rpx;
    height: 300rpx;
    margin-bottom: 40rpx;
    border-radius: 50%;
  }

  .empty-text {
    font-size: 28rpx;
    color: #909399;
    margin-bottom: 40rpx;
  }

  u-button {
    width: 200rpx;
  }
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 30rpx;
  box-shadow: 0 -2rpx 12rpx rgba(0, 0, 0, 0.05);

  .total-info {
    display: flex;
    align-items: flex-end;

    .total-label {
      font-size: 28rpx;
      color: #303133;
    }

    .total-price {
      font-size: 36rpx;
      font-weight: bold;
      color: #f5576c;
    }
  }

  u-button {
    width: 200rpx;
  }
}
</style>
