<template>
  <u-popup :value="visible" mode="bottom" :round="16" :closeable="true" @input="onInput">
    <view class="flow-record-popup">
      <view class="flow-record-header">
        <view class="flow-record-header__bar" />
        <text class="flow-record-title">流程记录</text>
        <text v-if="records.length > 0" class="flow-record-header__count">
          {{ records.length }} 条记录
        </text>
      </view>
      <view v-if="loading" class="flow-record-loading">
        <u-loading mode="circle" />
        <text class="flow-record-loading__text">加载中...</text>
      </view>
      <view v-else-if="records.length === 0" class="flow-record-empty">
        <u-empty mode="list" text="暂无流程记录" />
      </view>
      <view v-else class="flow-record__container">
        <view
          v-for="(item, idx) in records"
          :key="idx"
          class="flow-record-item"
          :class="{
            'flow-record-item--first': idx === 0,
            'flow-record-item--last': idx === records.length - 1,
          }"
        >
          <view class="flow-record__dot" :class="dotClass(item)" />
          <view class="flow-record__content">
            <view class="flow-record__header">
              <text class="flow-record__node">{{ getNodeLabel(item.currentNode) }}</text>
              <text class="flow-record__status" :class="statusClass(item)">
                {{ item.approvalStatus }}
              </text>
            </view>
            <view v-if="item.approveName || item.approvalTime" class="flow-record__meta">
              <text v-if="item.approveName" class="flow-record__approver">
                {{ item.approveName }}
              </text>
              <text v-if="item.approvalTime" class="flow-record__time">
                {{ item.approvalTime }}
              </text>
            </view>
            <text v-if="item.approvalReason" class="flow-record__reason">
              {{ item.approvalReason }}
            </text>
          </view>
        </view>
      </view>
    </view>
  </u-popup>
</template>

<script setup lang="ts">
defineProps<{
  visible: boolean;
  loading: boolean;
  records: any[];
  getNodeLabel: (key: unknown) => string;
}>();

const emit = defineEmits<{
  (e: "update:visible", value: boolean): void;
}>();

function onInput(val: boolean) {
  emit("update:visible", val);
}

function dotClass(item: any) {
  if (item.approvalStatus === "待处理") return "dot-pending";
  if (item.approvalStatus.includes("通过") || item.approvalStatus === "完成") return "dot-pass";
  if (item.approvalStatus.includes("拒绝")) return "dot-reject";
  return "dot-default";
}

function statusClass(item: any) {
  if (item.approvalStatus === "待处理") return "status-pending";
  if (item.approvalStatus.includes("通过") || item.approvalStatus === "完成") return "status-pass";
  if (item.approvalStatus.includes("拒绝")) return "status-reject";
  return "status-default";
}
</script>

<style lang="scss" scoped>
.flow-record-popup {
  padding: 24rpx 0;
}

.flow-record-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 0 24rpx 20rpx;
}

.flow-record-header__bar {
  width: 8rpx;
  height: 28rpx;
  background: #4f7cff;
  border-radius: 4rpx;
}

.flow-record-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #1a1d29;
}

.flow-record-header__count {
  font-size: 24rpx;
  color: #8b93a7;
  margin-left: auto;
}

.flow-record-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  padding: 40rpx 0;
  color: #86909c;
}

.flow-record-loading__text {
  font-size: 26rpx;
  color: #86909c;
}

.flow-record-empty {
  text-align: center;
  padding: 40rpx 0;
  color: #86909c;
  font-size: 26rpx;
}

.flow-record__container {
  padding: 0 24rpx 40rpx;
  max-height: 80vh;
  overflow-y: auto;
}

.flow-record-item {
  display: flex;
  gap: 20rpx;
  padding: 24rpx 0;
  position: relative;

  &:not(:last-child)::after {
    content: "";
    position: absolute;
    left: 16rpx;
    top: 56rpx;
    bottom: 0;
    width: 2rpx;
    background-color: #f0f0f0;
  }
}

.flow-record__dot {
  width: 32rpx;
  height: 32rpx;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 8rpx;

  &.dot-pending {
    background-color: #e5e6eb;
    border: 4rpx solid #c9cdd1;
  }
  &.dot-pass {
    background-color: #00b42a;
    border: 4rpx solid #86e8ab;
  }
  &.dot-reject {
    background-color: #f53f3f;
    border: 4rpx solid #ffb3b3;
  }
  &.dot-default {
    background-color: #168cff;
    border: 4rpx solid #b1d4ff;
  }
}

.flow-record__content {
  flex: 1;
  min-width: 0;
}

.flow-record__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 8rpx;
}

.flow-record__node {
  font-size: 30rpx;
  font-weight: 600;
  color: #1d2129;
}

.flow-record__status {
  font-size: 24rpx;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;

  &.status-pending {
    background-color: #f7f8fa;
    color: #86909c;
  }
  &.status-pass {
    background-color: #f2fcf4;
    color: #00b42a;
  }
  &.status-reject {
    background-color: #fff1f0;
    color: #f53f3f;
  }
  &.status-default {
    background-color: #f2f3ff;
    color: #168cff;
  }
}

.flow-record__meta {
  display: flex;
  justify-content: space-between;
  gap: 16rpx;
  margin-bottom: 8rpx;
}

.flow-record__approver,
.flow-record__time {
  font-size: 24rpx;
  color: #86909c;
}

.flow-record__reason {
  font-size: 26rpx;
  color: #4e5969;
  line-height: 1.5;
  padding: 12rpx;
  background-color: #f7f8fa;
  border-radius: 8rpx;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
