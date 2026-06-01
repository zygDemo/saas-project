<template>
  <app-page nav-title="面签列表">
    <view class="face-sign-page">
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

      <!-- 面签列表 -->
      <view class="face-sign-list">
        <view
          v-for="(item, index) in list"
          :key="index"
          class="face-sign-card"
          :class="`status-${getStatusType(item.status)}`"
          :style="{ animationDelay: `${index * 0.06}s` }"
          @click="goToDetail(item)"
        >
          <view class="face-sign-header">
            <view class="face-sign-name">
              <view class="avatar" :class="`avatar--${getStatusType(item.status)}`">
                {{ item.customerName?.charAt(0) || '?' }}
              </view>
              <view class="title-block">
                <text class="name">{{ item.customerName }}</text>
                <u-tag
                  :text="item.status"
                  :type="getStatusType(item.status)"
                  size="mini"
                  plain
                />
              </view>
            </view>
            <text class="face-sign-time">{{ item.appointmentTime }}</text>
          </view>

          <view class="face-sign-info">
            <view class="info-row">
              <view class="info-icon"><u-icon name="chat" size="24" color="#8c8c8c" /></view>
              <text class="label">面签方式</text>
              <text class="value">{{ item.type }}</text>
            </view>
            <view class="info-row">
              <view class="info-icon"><u-icon name="coupon" size="24" color="#8c8c8c" /></view>
              <text class="label">面签金额</text>
              <text class="value amount-value">￥{{ item.amount }}</text>
            </view>
            <view class="info-row">
              <view class="info-icon"><u-icon name="clock" size="24" color="#8c8c8c" /></view>
              <text class="label">面签时间</text>
              <text class="value">{{ item.appointmentTime }}</text>
            </view>
          </view>

          <view class="face-sign-footer">
            <text class="sales">面签官：{{ item.officerName }}</text>
            <u-button
              v-if="item.status === '待面签'"
              type="primary"
              size="mini"
              shape="circle"
              plain
              @click.stop="handleFaceSign(item)"
            >
              开始面签
            </u-button>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <u-empty
        v-if="list.length === 0 && !loading"
        text="暂无面签记录"
        mode="list"
      />
    </view>
  </app-page>
</template>

<script setup>
import { ref } from "vue";

const currentTab = ref(0);
const loading = ref(false);

const tabList = [{ name: "待面签" }, { name: "已完成" }, { name: "已取消" }];

const list = ref([
  {
    id: 1,
    customerName: "张三",
    amount: "150,000",
    status: "待面签",
    type: "视频面签",
    appointmentTime: "2026-04-09 14:00",
    officerName: "王面签",
  },
  {
    id: 2,
    customerName: "李四",
    amount: "200,000",
    status: "已完成",
    type: "AI 面签",
    appointmentTime: "2026-04-08 10:00",
    officerName: "AI 助手",
  },
]);

function getStatusType(status) {
  const typeMap = {
    待面签: "warning",
    已完成: "success",
    已取消: "error",
  };
  return typeMap[status] || "info";
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
    url: `/pages/business/faceSignDetail?id=${item.id}`,
  });
}

function handleFaceSign(item) {
  if (item.type === "视频面签") {
    item.uuid = item.uuid || 'a6da46d2681c4037b1d5bbe1dbe4df47';
    uni.navigateTo({
      url: `/pages/business/videoFaceSign?uuid=${item.uuid}`,
    });
  } else {
    uni.navigateTo({
      url: `/pages/business/aiFaceSign?id=${item.id}`,
    });
  }
}
</script>

<style lang="scss" scoped>
// ===== 页面基础 =====
.face-sign-page {
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

// ===== 列表区域 =====
.face-sign-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

// ===== 卡片 - 统一风格 =====
.face-sign-card {
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

  // 不同状态对应不同色条
  &.status-warning::before { background: linear-gradient(180deg, #faad14, #ffc53d); }
  &.status-success::before { background: linear-gradient(180deg, #52c41a, #73d13d); }
  &.status-error::before { background: linear-gradient(180deg, #ff4d4f, #ff7875); }

  &:active {
    transform: scale(0.98);
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
  }
}

// ===== 卡片头部 =====
.face-sign-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.face-sign-name {
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

.face-sign-time {
  font-size: 22rpx;
  color: #bfbfbf;
  flex-shrink: 0;
}

// ===== 卡片内容区 =====
.face-sign-info {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
  margin-bottom: 20rpx;
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

// ===== 卡片底部 =====
.face-sign-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 20rpx;
  border-top: 1rpx solid #f0f0f0;
}

.sales {
  font-size: 26rpx;
  color: #8c8c8c;
  font-weight: 500;
}

// ===== 入场动画 =====
@keyframes slideUp {
  from { opacity: 0; transform: translateY(30rpx); }
  to { opacity: 1; transform: translateY(0); }
}

.face-sign-card {
  animation: slideUp 0.4s ease-out both;
}
</style>
