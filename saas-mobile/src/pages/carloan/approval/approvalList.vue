<template>
  <app-page nav-title="审批列表">
    <view class="approval-list-page">
      <!-- 筛选栏 -->
      <view class="filter-box">
        <u-tabs
          :list="tabList"
          :current="currentTab"
          @click="onTabClick"
          line-height="6rpx"
          :bar-style="{ background: '#5da7ff' }"
        />
      </view>

      <!-- 审批列表 -->
      <view class="approval-list">
        <view
          v-for="(item, index) in list"
          :key="index"
          class="approval-card"
          :class="`status-${getStageType(item.stage)}`"
          :style="{ animationDelay: `${index * 0.06}s` }"
          @click="goToDetail(item)"
        >
          <view class="approval-header">
            <view class="approval-name">
              <view class="avatar" :class="`avatar--${getStageType(item.stage)}`">
                {{ item.customerName?.charAt(0) || '?' }}
              </view>
              <view class="title-block">
                <text class="name">{{ item.customerName }}</text>
                <u-tag
                  :text="item.stage"
                  :type="getStageType(item.stage)"
                  size="mini"
                  plain
                />
              </view>
            </view>
            <text class="approval-time">{{ item.createTime }}</text>
          </view>

          <view class="approval-info">
            <view class="info-row">
              <view class="info-icon"><u-icon name="coupon" size="24" color="#8c8c8c" /></view>
              <text class="label">申请金额</text>
              <text class="value amount-value">￥{{ item.amount }}</text>
            </view>
            <view class="info-row">
              <view class="info-icon"><u-icon name="grid" size="24" color="#8c8c8c" /></view>
              <text class="label">申请产品</text>
              <text class="value">{{ item.product }}</text>
            </view>
            <view class="info-row">
              <view class="info-icon"><u-icon name="clock" size="24" color="#8c8c8c" /></view>
              <text class="label">当前阶段</text>
              <text class="value">{{ item.currentStage }}</text>
            </view>
          </view>

          <view class="approval-footer">
            <text class="sales">业务员：{{ item.salesName }}</text>
            <u-button
              type="primary"
              size="mini"
              shape="circle"
              plain
              @click.stop="handleAudit(item)"
            >
              审批
            </u-button>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <u-empty
        v-if="list.length === 0 && !loading"
        text="暂无审批件"
        mode="list"
      />

      <!-- 加载状态 -->
      <u-loadmore v-if="loading" :status="loading ? 'loading' : 'loadmore'" />
    </view>
  </app-page>
</template>

<script setup>
import { ref } from "vue";
import { APP_ROUTES, buildDetailRouteQuery, buildRoute } from "@/common/navigation";

const currentTab = ref(0);
const loading = ref(false);

const tabList = [{ name: "待初审" }, { name: "待终审" }, { name: "已审批" }];

const list = ref([
  {
    id: 1,
    customerName: "张三",
    amount: "150,000",
    product: "车贷 A 产品",
    stage: "待初审",
    currentStage: "初审",
    salesName: "李销售",
    createTime: "2026-04-08 10:30",
  },
  {
    id: 2,
    customerName: "李四",
    amount: "200,000",
    product: "车贷 B 产品",
    stage: "待终审",
    currentStage: "终审",
    salesName: "王销售",
    createTime: "2026-04-08 09:15",
  },
]);

function getStageType(stage) {
  const typeMap = {
    待初审: "warning",
    待终审: "primary",
    已审批: "success",
    已拒绝: "error",
  };
  return typeMap[stage] || "info";
}

function onTabClick(index) {
  currentTab.value = index;
  loading.value = true;
  setTimeout(() => {
    loading.value = false;
  }, 500);
}

function goToDetail(item) {
  uni.navigateTo({
    url: buildRoute(APP_ROUTES.carloan.precheck.applyDetail, buildDetailRouteQuery({ id: item.id })),
  });
}

function handleAudit(item) {
  uni.navigateTo({
    url: buildRoute(APP_ROUTES.carloan.precheck.applyDetail, buildDetailRouteQuery({ id: item.id })),
  });
}
</script>

<style lang="scss" scoped>
.approval-list-page {
  padding: 24rpx;
  background: linear-gradient(180deg, #f2f4f8 0%, #f8f9fb 100%);

}

.filter-box {
  margin-bottom: 24rpx;
  background: #fff;
  border-radius: 24rpx;
  padding: 8rpx 16rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.approval-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.approval-card {
  position: relative;
  background: #fff;
  border-radius: 24rpx;
  padding: 28rpx 28rpx 28rpx 36rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 24rpx;
    bottom: 24rpx;
    width: 6rpx;
    border-radius: 0 6rpx 6rpx 0;
    background: #d9d9d9;
    transition: background 0.3s ease;
  }

  &.status-warning::before {
    background: linear-gradient(180deg, #faad14, #ffc53d);
  }
  &.status-primary::before {
    background: linear-gradient(180deg, #4096ff, #69b1ff);
  }
  &.status-success::before {
    background: linear-gradient(180deg, #52c41a, #73d13d);
  }
  &.status-error::before {
    background: linear-gradient(180deg, #ff4d4f, #ff7875);
  }

  &:active {
    transform: scale(0.98);
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
  }
}

.approval-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
  padding-bottom: 24rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.approval-name {
  display: flex;
  align-items: center;
  gap: 16rpx;
  flex: 1;
  min-width: 0;
}

.avatar {
  width: 68rpx;
  height: 68rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);

  &--warning { background: linear-gradient(135deg, #faad14, #ffc53d); }
  &--primary { background: linear-gradient(135deg, #4096ff, #69b1ff); }
  &--success { background: linear-gradient(135deg, #52c41a, #73d13d); }
  &--error { background: linear-gradient(135deg, #ff4d4f, #ff7875); }
  &--info { background: linear-gradient(135deg, #8c8c8c, #bfbfbf); }
}

.title-block {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex-wrap: wrap;
  min-width: 0;
}

.name {
  font-size: 32rpx;
  font-weight: 700;
  color: #1f1f1f;
  letter-spacing: 0.5rpx;
}

.approval-time {
  font-size: 22rpx;
  color: #bfbfbf;
  flex-shrink: 0;
}

.approval-info {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.info-row {
  display: flex;
  align-items: center;
  font-size: 26rpx;
  line-height: 1.6;
}

.info-icon {
  width: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-right: 4rpx;
}

.label {
  color: #8c8c8c;
  width: 140rpx;
  flex-shrink: 0;
  font-size: 26rpx;
}

.value {
  flex: 1;
  color: #262626;
  font-weight: 500;
  font-size: 26rpx;
}

.amount-value {
  color: #cf1322;
  font-weight: 700;
  font-size: 28rpx;
}

.approval-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 20rpx;
  border-top: 1rpx solid #f5f5f5;
}

.sales {
  font-size: 24rpx;
  color: #8c8c8c;
  font-weight: 500;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(30rpx); }
  to { opacity: 1; transform: translateY(0); }
}

.approval-card {
  animation: slideUp 0.4s ease-out both;
}
</style>