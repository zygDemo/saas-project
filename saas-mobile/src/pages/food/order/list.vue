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
          role="button" tabindex="0" @click="switchTab(idx)" @keyup.enter="switchTab(idx)"
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
            role="button" tabindex="0" @click="goOrderDetail(order)" @keyup.enter="goOrderDetail(order)"
          >
            <view class="order-header">
              <view class="store-info">
                <u-icon name="home" color="var(--u-type-primary)" size="28" />
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
                <image :src="item.goods.image" class="item-img" mode="aspectFill" :alt="item.goods.name" />
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

            <view v-if="order.remark" class="order-remark">
              <u-icon name="edit-pen" color="#909399" size="22" />
              <text>{{ order.remark }}</text>
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
                v-if="order.status === 1"
                text="确认收餐"
                type="primary"
                size="small"
                shape="circle"
                @click.stop="finishOrder(order)"
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
            role="button" tabindex="0" @click="goHome" @keyup.enter="goHome"
          />
        </view>

        <view class="bottom-tip" v-if="filteredOrders.length > 0">
          <text class="tip-text">— 没有更多了 —</text>
        </view>
      </scroll-view>

      <u-popup :show="detailVisible" mode="bottom" round="18" @close="detailVisible = false">
        <view v-if="selectedOrder" class="order-detail-panel">
          <view class="detail-header">
            <view>
              <text class="detail-title">订单详情</text>
              <text class="detail-no">订单号 {{ selectedOrder.no }}</text>
            </view>
            <view class="detail-close" role="button" tabindex="0" @click="detailVisible = false" @keyup.enter="detailVisible = false">
              <u-icon name="close" size="26" color="#909399" />
            </view>
          </view>

          <view class="detail-status" :class="`status-bg-${selectedOrder.status}`">
            <text>{{ statusText[selectedOrder.status] }}</text>
            <text>{{ selectedOrder.status === 0 ? "请尽快完成支付" : selectedOrder.status === 1 ? "商家正在为你制作" : "期待下次光临" }}</text>
          </view>

          <view class="detail-section">
            <text class="detail-section-title">{{ selectedOrder.storeName }}</text>
            <view v-for="item in selectedOrder.items" :key="item.goods.id" class="detail-item">
              <text class="detail-item-name">{{ item.goods.name }} x{{ item.count }}</text>
              <text class="detail-item-price">¥{{ (item.goods.price * item.count).toFixed(2) }}</text>
            </view>
          </view>

          <view class="detail-section">
            <view class="detail-row">
              <text>商品小计</text>
              <text>¥{{ selectedOrder.goodsTotal.toFixed(2) }}</text>
            </view>
            <view class="detail-row">
              <text>配送费</text>
              <text>¥{{ selectedOrder.deliveryFee.toFixed(2) }}</text>
            </view>
            <view class="detail-row">
              <text>包装费</text>
              <text>¥{{ selectedOrder.packageFee.toFixed(2) }}</text>
            </view>
            <view v-if="selectedOrder.remark" class="detail-row">
              <text>备注</text>
              <text class="detail-remark-text">{{ selectedOrder.remark }}</text>
            </view>
            <view class="detail-row total">
              <text>实付</text>
              <text>¥{{ selectedOrder.total.toFixed(2) }}</text>
            </view>
          </view>
        </view>
      </u-popup>
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
  { name: "已完成", count: orders.value.filter((o) => o.status === 2).length },
]);

const currentTab = ref(0);
const detailVisible = ref(false);
const selectedOrder = ref<FoodOrder | null>(null);

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
  selectedOrder.value = order;
  detailVisible.value = true;
};

const payOrder = (order: FoodOrder) => {
  uni.showModal({
    title: "确认支付",
    content: `订单金额 ¥${order.total.toFixed(2)}`,
    success: (res) => {
      if (res.confirm) {
        foodStore.payOrder(order.id);
        uni.showToast({ title: "支付成功", icon: "success" });
      }
    },
  });
};

const urgeOrder = (order: FoodOrder) => {
  uni.showToast({ title: "已催单，商家正在加急制作中", icon: "none" });
};

const finishOrder = (order: FoodOrder) => {
  foodStore.finishOrder(order.id);
  uni.showToast({ title: "已完成订单", icon: "success" });
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
      color: var(--u-type-primary);
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
      background: var(--u-type-primary);
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
  background: var(--u-type-primary);
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

/* 减少动画 */
@media (prefers-reduced-motion: reduce) {
  .order-card { transition: none !important; }
  .tab-item { transition: none !important; }
}

.order-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.72);
  box-shadow: 0 10rpx 26rpx rgba(30, 42, 68, 0.06);
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

.order-remark {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-bottom: 16rpx;
  padding: 14rpx 18rpx;
  border-radius: 14rpx;
  background: #f7f9fd;
  color: #687182;
  font-size: 24rpx;
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
  color: #999;
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
  color: var(--u-type-primary);
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
  text-wrap: balance;
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
  color: #999;
}

.order-detail-panel {
  padding: 28rpx;
  padding-bottom: calc(30rpx + env(safe-area-inset-bottom));
  background: #f5f6f8;
}

.detail-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
  margin-bottom: 20rpx;
}

.detail-title {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
  color: #202124;
}

.detail-no {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #8a94a6;
}

.detail-close {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.detail-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22rpx 24rpx;
  border-radius: 18rpx;
  margin-bottom: 20rpx;

  text:first-child {
    font-size: 30rpx;
    font-weight: 700;
  }

  text:last-child {
    font-size: 24rpx;
  }
}

.status-bg-0 {
  color: #b56b00;
  background: #fff5df;
}

.status-bg-1 {
  color: #1b64c8;
  background: #eaf3ff;
}

.status-bg-2 {
  color: #12834a;
  background: #e9f8ef;
}

.detail-section {
  background: #fff;
  border-radius: 18rpx;
  padding: 24rpx;
  margin-bottom: 18rpx;
  box-shadow: 0 8rpx 20rpx rgba(30, 42, 68, 0.05);
}

.detail-section-title {
  display: block;
  margin-bottom: 14rpx;
  font-size: 30rpx;
  font-weight: 700;
  color: #303133;
}

.detail-item,
.detail-row {
  display: flex;
  justify-content: space-between;
  gap: 20rpx;
  padding: 12rpx 0;
  font-size: 26rpx;
  color: #606266;
}

.detail-item-name,
.detail-remark-text {
  flex: 1;
  min-width: 0;
  color: #606266;
}

.detail-item-price {
  color: #303133;
  font-weight: 600;
}

.detail-row.total {
  margin-top: 10rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #eef0f5;
  color: #303133;
  font-weight: 700;

  text:last-child {
    color: var(--u-type-primary);
    font-size: 32rpx;
  }
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .order-page { background: #121212; }
  .tab-bar { background: #1e1e1e; border-bottom-color: #2a2a2a; }
  .tab-item { color: #b0b3b8; }
  .tab-item.active { color: var(--u-type-primary); border-color: var(--u-type-primary); }
  .order-card { background: #1e1e1e; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.15); }
  .order-remark { background: #2a2a2a; color: #b0b3b8; }
  .order-title { color: #e5e6eb; }
  .order-no { color: #8b8c91; }
  .order-status { color: var(--u-type-primary); }
  .item-name { color: #e5e6eb; }
  .item-desc { color: #8b8c91; }
  .order-total { color: #e5e6eb; }
  .empty-title { color: #e5e6eb; }
  .empty-desc { color: #8b8c91; }
  .order-detail-panel { background: #121212; }
  .detail-title { color: #e5e6eb; }
  .detail-close,
  .detail-section { background: #1e1e1e; }
  .detail-section-title,
  .detail-item-price,
  .detail-row.total { color: #e5e6eb; }
  .detail-item,
  .detail-row,
  .detail-item-name,
  .detail-remark-text { color: #b0b3b8; }
  .detail-row.total { border-top-color: #2a2a2a; }
}
</style>
