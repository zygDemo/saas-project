<template>
  <view class="list-page">
    <view class="search-box">
      <u-search
        v-model="keywordModel"
        :placeholder="placeholder"
        shape="round"
        @search="handleSearch"
      />
    </view>

    <scroll-view
      class="list-scroll-view"
      scroll-y
      refresher-enabled
      :refresher-triggered="isRefreshing"
      :lower-threshold="100"
      :scroll-top="scrollTopValue"
      :scroll-with-animation="true"
      @refresherrefresh="onRefresh"
      @scrolltolower="loadMore"
      @scroll="onScroll"
    >
      <view class="list-content">
        <slot></slot>

        <view v-if="!loading && list.length === 0" class="empty-state">
          <u-empty :text="emptyText" mode="list" />
        </view>

        <view v-if="loading && list.length > 0 && !isRefreshing" class="load-more">
          <u-loading mode="circle" />
        </view>
        <view v-if="!hasMore && list.length > 0" class="no-more">
          没有更多了
        </view>
      </view>
    </scroll-view>

    <view v-show="showBackTop" class="back-top-btn" role="button" tabindex="0" @click="backToTop">
      <u-icon name="arrow-up" color="#fff" size="32" />
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  searchForm: any;
  list: any[];
  loading: boolean;
  hasMore: boolean;
  isRefreshing: boolean;
  scrollTopValue: number;
  showBackTop: boolean;
  placeholder?: string;
  emptyText?: string;
}>();

const emit = defineEmits<{
  (e: "update:searchForm", value: any): void;
  (e: "search"): void;
  (e: "refresh"): void;
  (e: "loadMore"): void;
  (e: "scroll", event: any): void;
  (e: "backToTop"): void;
}>();

const keywordModel = computed({
  get: () => props.searchForm.keyword,
  set: (val) => emit("update:searchForm", { ...props.searchForm, keyword: val }),
});

const handleSearch = () => emit("search");
const onRefresh = () => emit("refresh");
const loadMore = () => emit("loadMore");
const onScroll = (event: any) => emit("scroll", event);
const backToTop = () => emit("backToTop");
</script>

<style lang="scss" scoped>
.list-page {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 108rpx 20rpx 20rpx;
  background: linear-gradient(180deg, #f0f4f8 0%, #f8fafc 50%, #f1f5f9 100%);
  display: flex;
  flex-direction: column;
}

.search-box {
  margin-bottom: 20rpx;
  background: rgba(255, 255, 255, 0.85);
  border-radius: 20rpx;
  padding: 12rpx 16rpx;
  box-shadow:
    0 2rpx 12rpx rgba(0, 0, 0, 0.04),
    0 0 0 1rpx rgba(0, 0, 0, 0.02);
  backdrop-filter: blur(12px);
  flex-shrink: 0;
}

.list-scroll-view {
  flex: 1;
  height: 0;
}

.list-content {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  min-height: 100%;
  padding-bottom: 24rpx;
}

.empty-state {
  padding: 200rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.load-more {
  text-align: center;
  padding: 40rpx 0;
}

.no-more {
  text-align: center;
  padding: 40rpx 0;
  font-size: 24rpx;
  color: #cbd5e1;
  font-weight: 500;
  position: relative;

  &::before,
  &::after {
    content: "";
    position: absolute;
    top: 50%;
    width: 80rpx;
    height: 1rpx;
    background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
  }

  &::before {
    right: 50%;
    margin-right: 24rpx;
  }
  &::after {
    left: 50%;
    margin-left: 24rpx;
  }
}

.back-top-btn {
  position: fixed;
  right: 30rpx;
  bottom: 140rpx;
  width: 84rpx;
  height: 84rpx;
  border-radius: 50%;
  background: linear-gradient(
    135deg,
    rgba(var(--u-type-primary-rgb, 82, 64, 254), 0.95),
    rgba(var(--u-type-primary-rgb, 82, 64, 254), 0.95)
  );
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 6rpx 24rpx rgba(var(--u-type-primary-rgb, 82, 64, 254), 0.4),
    0 0 0 2rpx rgba(255, 255, 255, 0.3) inset;
  z-index: 999;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:active {
    transform: scale(0.9);
    box-shadow: 0 4rpx 16rpx rgba(var(--u-type-primary-rgb, 82, 64, 254), 0.35);
  }
}
</style>