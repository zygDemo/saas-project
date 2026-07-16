<template>
  <layout :active-tab="2" nav-title="我的订单" show-tabbar tabbar-scope="food">
    <view class="order-page">
      <!-- 订单列表 -->
      <view v-if="orderList.length > 0" class="order-list">
        <view v-for="order in orderList" :key="order.id" class="order-card">
          <view class="order-card__header">
            <view class="order-card__no-wrap">
              <u-icon name="list" color="var(--u-type-primary)" size="24" />
              <text class="order-card__no">{{ order.orderNo }}</text>
            </view>
            <text class="order-card__status" :class="getStatusClass(order.status)">{{ getStatusText(order.status) }}</text>
          </view>

          <view class="order-card__goods">
            <view v-for="item in order.items" :key="item.id" class="order-goods-item">
              <view class="order-goods-item__img">
                <u-icon name="gift" color="var(--u-type-primary)" size="28" />
              </view>
              <view class="order-goods-item__info">
                <text class="order-goods-item__name">{{ item.dish?.name }}</text>
                <text class="order-goods-item__price">¥{{ item.price }} x{{ item.quantity }}</text>
              </view>
            </view>
          </view>

          <view class="order-card__footer">
            <text class="order-card__time">{{ formatTime(order.createdAt) }}</text>
            <view class="order-card__total">
              <text class="order-card__total-label">合计</text>
              <text class="order-card__amount">¥{{ order.totalPrice }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-else class="empty-state">
        <view class="empty-icon">
          <u-icon name="list" color="var(--u-type-primary-disabled)" size="80" />
        </view>
        <text class="empty-text">暂无订单</text>
        <text class="empty-desc">快去点些美食吧</text>
        <u-button text="去点餐" type="primary" shape="round" @click="goHome" />
      </view>
    </view>
  </layout>
</template>

<script setup lang="ts">
import layout from "@/components/layout/layout.vue";
import { ref, onMounted } from "vue";
import { useFoodApi, type FoodOrder } from "@/api/food";
import { APP_ROUTES } from "@/common/navigation";

const foodApi = useFoodApi();
const orderList = ref<FoodOrder[]>([]);

const statusMap: Record<number, { text: string; cls: string }> = {
  1: { text: "待接单", cls: "status--pending" },
  2: { text: "制作中", cls: "status--cooking" },
  3: { text: "已完成", cls: "status--done" },
  4: { text: "已取消", cls: "status--cancelled" },
};

const getStatusText = (status: number) => statusMap[status]?.text || "未知";
const getStatusClass = (status: number) => statusMap[status]?.cls || "";

const formatTime = (time: string) => {
  if (!time) return "";
  return time.replace("T", " ").substring(0, 16);
};

const loadOrders = async () => {
  try {
    const res = await foodApi.getMyOrders();
    if (res?.data) {
      orderList.value = res.data;
    }
  } catch (e) {
    console.error("加载订单失败:", e);
  }
};

const goHome = () => uni.switchTab({ url: APP_ROUTES.food.home });

onMounted(loadOrders);
</script>

<style scoped lang="scss">
.order-page {
  min-height: 100%;
  background-color: #f5f7fa;
  padding: 24rpx 30rpx;
}

// 订单列表
.order-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.order-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 20rpx;
    border-bottom: 1rpx solid #f0f0f0;
  }

  &__no-wrap {
    display: flex;
    align-items: center;
    gap: 8rpx;
  }

  &__no {
    font-size: 24rpx;
    color: #909399;
  }

  &__status {
    font-size: 24rpx;
    font-weight: 600;
    padding: 4rpx 16rpx;
    border-radius: 8rpx;

    &.status--done {
      color: var(--u-type-success);
      background: var(--u-type-success-light);
    }

    &.status--pending {
      color: var(--u-type-warning);
      background: var(--u-type-warning-light);
    }

    &.status--cooking {
      color: var(--u-type-primary);
      background: var(--u-type-primary-light);
    }

    &.status--cancelled {
      color: #909399;
      background: #f3f4f6;
    }
  }

  &__goods {
    padding: 16rpx 0;
  }

  &__footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 20rpx;
    border-top: 1rpx solid #f0f0f0;
  }

  &__time {
    font-size: 24rpx;
    color: #c0c4cc;
  }

  &__total {
    display: flex;
    align-items: baseline;
    gap: 8rpx;
  }

  &__total-label {
    font-size: 24rpx;
    color: #909399;
  }

  &__amount {
    font-size: 32rpx;
    font-weight: 700;
    color: var(--u-type-primary);
  }
}

.order-goods-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 12rpx 0;

  &__img {
    width: 80rpx;
    height: 80rpx;
    border-radius: 12rpx;
    background: linear-gradient(135deg, var(--u-type-primary-light), var(--u-type-primary-disabled));
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__info {
    flex: 1;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__name {
    font-size: 28rpx;
    color: #303133;
  }

  &__price {
    font-size: 26rpx;
    color: #909399;
  }
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
</style>
