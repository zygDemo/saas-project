<template>
  <layout :active-tab="1" nav-title="我的订单" show-tabbar tabbar-scope="food">
    <view class="order-page">
      <!-- Tab 切换 -->
      <view class="tabs-bar">
        <view
          v-for="(tab, idx) in tabs"
          :key="idx"
          class="tab-item"
          :class="{ active: currentTab === idx }"
          @click="switchTab(idx)"
        >
          <text class="tab-text">{{ tab.name }}</text>
          <view v-if="tab.count > 0" class="tab-badge">{{ tab.count }}</view>
        </view>
      </view>

      <!-- 订单列表 -->
      <scroll-view class="order-scroll" scroll-y>
        <view v-if="filteredOrders.length > 0" class="order-list">
          <view
            v-for="order in filteredOrders"
            :key="order.id"
            class="order-card"
            @click="goOrderDetail(order)"
          >
            <view class="order-header">
              <view class="store-info">
                <u-icon name="home" color="#ff6b6b" size="28" />
                <text class="store-name">{{ order.storeName }}</text>
              </view>
              <text class="order-status" :class="`status-${order.status}`">
                {{ statusText[order.status] }}
              </text>
            </view>

            <view class="order-items">
              <view
                v-for="item in order.items.slice(0, 3)"
                :key="item.goods.id"
                class="order-item"
              >
                <image :src="item.goods.image" class="item-img" mode="aspectFill" />
                <view class="item-info">
                  <text class="item-name">{{ item.goods.name }}</text>
                  <text class="item-spec">x{{ item.count }}</text>
                </view>
                <text class="item-total">¥{{ (item.goods.price * item.count).toFixed(2) }}</text>
              </view>
              <view v-if="order.items.length > 3" class="more-items">
                <text class="more-text">等{{ order.items.length }}件商品</text>
              </view>
            </view>

            <view class="order-footer">
              <view class="order-time">
                <text class="time-text">{{ order.createdAt }}</text>
              </view>
              <view class="order-right">
                <text class="order-total-label">合计：</text>
                <text class="order-total">¥{{ order.total.toFixed(2) }}</text>
              </view>
            </view>

            <view class="order-actions">
              <u-button
                v-if="order.status === 0"
                text="去支付"
                type="primary"
                size="small"
                shape="circle"
                @click.stop="payOrder(order)"
              />
              <u-button
                v-if="order.status === 2"
                text="再来一单"
                size="small"
                shape="circle"
                plain
                @click.stop="reorder(order)"
              />
              <u-button
                v-if="order.status === 1"
                text="催单"
                size="small"
                shape="circle"
                plain
                @click.stop="urgeOrder(order)"
              />
            </view>
          </view>
        </view>

        <!-- 空状态 -->
        <view v-else class="empty-state">
          <view class="empty-icon">📋</view>
          <text class="empty-title">暂无{{ tabs[currentTab].name }}订单</text>
          <text class="empty-desc">快去点些好吃的吧~</text>
          <u-button
            text="去点餐"
            type="primary"
            shape="circle"
            size="small"
            @click="goHome"
          />
        </view>

        <view class="bottom-tip" v-if="filteredOrders.length > 0">
          <text class="tip-text">— 没有更多了 —</text>
        </view>
      </scroll-view>
    </view>
  </layout>
</template>

<script setup lang="ts">
import { APP_ROUTES } from "@/common/navigation";
import layout from "@/pages/layout/layout.vue";
import { useFoodStore, type FoodOrder } from "@/stores/food";
import { computed, ref } from "vue";
import { storeToRefs } from "pinia";
import { onShow } from "@dcloudio/uni-app";
import { CurrentSystem, useLocalStore } from "@/stores/local";

const foodStore = useFoodStore();
const { orders } = storeToRefs(foodStore);
const localStore = useLocalStore();

const tabs = computed(() => [
  { name: "全部", count: 0 },
  { name: "待支付", count: orders.value.filter((o) => o.status === 0).length },
  { name: "制作中", count: orders.value.filter((o) => o.status === 1).length },
  { name: "已完成", count: 0 },
]);

const currentTab = ref(0);

const statusText: Record<number, string> = {
  0: "待支付",
  1: "制作中",
  2: "已完成",
};

onShow(() => {
  localStore.setCurrentSystem(CurrentSystem.FOOD);
});

const filteredOrders = computed(() => {
  if (currentTab.value === 0) return orders.value;
  return orders.value.filter((order) => order.status === currentTab.value - 1);
});

const switchTab = (idx: number) => {
  currentTab.value = idx;
};

const goOrderDetail = (order: FoodOrder) => {
  // 暂时只显示提示
  uni.showToast({ title: "订单详情开发中", icon: "none" });
};

const payOrder = (order: FoodOrder) => {
  uni.showModal({
    title: "确认支付",
    content: `订单金额 ¥${order.total.toFixed(2)}`,
    success: (res) => {
      if (res.confirm) {
        foodStore.updateOrderStatus(order.id, 1);
        uni.showToast({ title: "支付成功", icon: "success" });
      }
    },
  });
};

const urgeOrder = (order: FoodOrder) => {
  uni.showToast({ title: "已催单，商家正在加急制作中", icon: "none" });
};

const reorder = (order: FoodOrder) => {
  // 将订单商品重新加入购物车
  order.items.forEach((item) => {
    for (let i = 0; i < item.count; i++) {
      foodStore.addToCart(item.goods);
    }
  });
  uni.showToast({ title: "已加入购物车", icon: "success" });
  setTimeout(() => {
    uni.navigateTo({ url: APP_ROUTES.food.cart });
  }, 1000);
};

const goHome = () => {
  uni.reLaunch({ url: APP_ROUTES.food.home });
};
</script>

<style scoped lang="scss">
.order-page {
  height: 100%;
  background: #f5f6f8;
  display: flex;
  flex-direction: column;
}

/* Tab 栏 */
.tabs-bar {
  display: flex;
  background: #fff;
  padding: 0 12rpx;
  border-bottom: 1rpx solid #f0f0f0;
  flex-shrink: 0;
}

.tab-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24rpx 0;
  position: relative;
  transition: all 0.3s;

  &.active {
    .tab-text {
      color: #ff6b6b;
      font-weight: 600;
    }

    &::after {
      content: "";
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 48rpx;
      height: 6rpx;
      background: #ff6b6b;
      border-radius: 3rpx;
    }
  }
}

.tab-text {
  font-size: 28rpx;
  color: #606266;
}

.tab-badge {
  position: absolute;
  top: 12rpx;
  right: 20rpx;
  min-width: 28rpx;
  height: 28rpx;
  padding: 0 6rpx;
  border-radius: 14rpx;
  background: #ff6b6b;
  color: #fff;
  font-size: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 订单列表 */
.order-scroll {
  flex: 1;
}

.order-list {
  padding: 20rpx 24rpx;
}

.order-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.store-info {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.store-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #303133;
}

.order-status {
  font-size: 26rpx;
  font-weight: 500;
}

.status-0 {
  color: #ff9900;
}

.status-1 {
  color: #2979ff;
}

.status-2 {
  color: #19be6b;
}

.order-items {
  margin-bottom: 20rpx;
}

.order-item {
  display: flex;
  align-items: center;
  padding: 10rpx 0;
}

.item-img {
  width: 100rpx;
  height: 100rpx;
  border-radius: 10rpx;
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
  font-size: 28rpx;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-spec {
  font-size: 24rpx;
  color: #909399;
  margin-top: 6rpx;
}

.item-total {
  font-size: 28rpx;
  font-weight: 500;
  color: #303133;
  flex-shrink: 0;
}

.more-items {
  padding: 10rpx 0;
}

.more-text {
  font-size: 24rpx;
  color: #909399;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16rpx;
  border-top: 1rpx solid #f5f5f5;
}

.time-text {
  font-size: 24rpx;
  color: #c0c4cc;
}

.order-right {
  display: flex;
  align-items: flex-end;
}

.order-total-label {
  font-size: 26rpx;
  color: #606266;
}

.order-total {
  font-size: 32rpx;
  font-weight: 700;
  color: #ff6b6b;
}

.order-actions {
  display: flex;
  justify-content: flex-end;
  gap: 16rpx;
  margin-top: 20rpx;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 200rpx;
  gap: 16rpx;
}

.empty-icon {
  font-size: 100rpx;
  margin-bottom: 16rpx;
}

.empty-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #303133;
}

.empty-desc {
  font-size: 26rpx;
  color: #909399;
  margin-bottom: 32rpx;
}

.bottom-tip {
  text-align: center;
  padding: 32rpx 0 48rpx;
}

.tip-text {
  font-size: 24rpx;
  color: #c0c4cc;
}
</style>
