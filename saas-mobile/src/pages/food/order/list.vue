<template>
  <layout :active-tab="1" nav-title="订单" show-tabbar tabbar-scope="food">
    <view class="order-list-page">
      <u-tabs :list="tabs" :current="current" @change="handleChange" />

      <view v-if="filteredOrders.length > 0" class="order-list">
        <view
          v-for="order in filteredOrders"
          :key="order.id"
          class="order-card"
        >
          <view class="order-header">
            <text class="order-no">订单号 {{ order.no }}</text>
            <text class="order-status" :class="`status-${order.status}`">
              {{ statusText[order.status] }}
            </text>
          </view>

          <view class="order-items">
            <view
              v-for="item in order.items"
              :key="item.goods.id"
              class="order-item"
            >
              <image :src="item.goods.image" class="item-img" />
              <view class="item-info">
                <text class="item-name">{{ item.goods.name }}</text>
                <text class="item-price">
                  ￥{{ item.goods.price }} x {{ item.count }}
                </text>
              </view>
              <text class="item-total">
                ￥{{ (item.goods.price * item.count).toFixed(2) }}
              </text>
            </view>
          </view>

          <view class="order-footer">
            <text class="order-total">合计: ￥{{ order.total.toFixed(2) }}</text>
            <view class="order-actions">
              <u-button
                v-if="order.status === 0"
                text="去支付"
                size="small"
                type="primary"
              />
              <u-button
                text="再来一单"
                size="small"
                plain
                @click="reorder(order)"
              />
            </view>
          </view>
        </view>
      </view>

      <view v-else class="empty">
        <text>暂无订单</text>
      </view>
    </view>
  </layout>
</template>

<script setup lang="ts">
import { APP_ROUTES } from "@/common/navigation";
import layout from "@/pages/layout/layout.vue";
import { computed, ref } from "vue";

interface OrderItem {
  goods: {
    id: number;
    name: string;
    price: number;
    image: string;
  };
  count: number;
}

interface FoodOrder {
  id: number;
  no: string;
  status: 0 | 1;
  total: number;
  items: OrderItem[];
}

const tabs = [
  { name: "全部", count: 0 },
  { name: "待支付", count: 0 },
  { name: "已完成", count: 0 },
];

const current = ref(0);

const orders = ref<FoodOrder[]>([
  {
    id: 1,
    no: "2026061612345",
    status: 1,
    total: 88,
    items: [
      {
        goods: {
          id: 1,
          name: "宫保鸡丁",
          price: 38,
          image: "https://via.placeholder.com/160x160/FF6B6B/ffffff?text=%E5%AE%AB%E4%BF%9D%E9%B8%A1%E4%B8%81",
        },
        count: 2,
      },
      {
        goods: {
          id: 3,
          name: "麻婆豆腐",
          price: 12,
          image: "https://via.placeholder.com/160x160/FFA62B/ffffff?text=%E9%BA%BB%E5%A9%86%E8%B1%86%E8%85%90",
        },
        count: 1,
      },
    ],
  },
]);

const statusText: Record<FoodOrder["status"], string> = {
  0: "待支付",
  1: "已完成",
};

const filteredOrders = computed(() => {
  if (current.value === 0) return orders.value;
  if (current.value === 1) return orders.value.filter((order) => order.status === 0);
  if (current.value === 2) return orders.value.filter((order) => order.status === 1);
  return [];
});

const handleChange = (index: number) => {
  current.value = index;
};

const reorder = (_order: FoodOrder) => {
  uni.switchTab({ url: APP_ROUTES.food.home });
};
</script>

<style scoped lang="scss">
.order-list-page {
  min-height: 100%;
  background-color: #f5f5f5;
}

.order-list {
  padding: 20rpx;
}

.order-card {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #eee;
}

.order-no {
  font-size: 28rpx;
  color: #606266;
}

.order-status {
  font-size: 26rpx;
}

.status-0 {
  color: #f9ae2d;
}

.status-1 {
  color: #52c41a;
}

.order-items {
  margin-bottom: 20rpx;
}

.order-item {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
}

.item-img {
  width: 100rpx;
  height: 100rpx;
  border-radius: 8rpx;
  margin-right: 20rpx;
}

.item-info {
  flex: 1;
}

.item-name {
  font-size: 30rpx;
  color: #303133;
  margin-bottom: 8rpx;
}

.item-price {
  font-size: 26rpx;
  color: #f5576c;
}

.item-total {
  font-size: 30rpx;
  font-weight: 600;
  color: #303133;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 20rpx;
  border-top: 1rpx solid #eee;
}

.order-total {
  font-size: 32rpx;
  font-weight: 600;
  color: #303133;
}

.order-actions {
  display: flex;
  gap: 12rpx;
}

.empty {
  display: flex;
  justify-content: center;
  align-items: center;
  padding-top: 300rpx;
  font-size: 28rpx;
  color: #909399;
}
</style>
