<template>
  <app-page nav-title="资料补充" no-body-scroll>
    <view class="supplement-list-page">
      <!-- 搜索框 -->
      <view class="search-box">
        <u-search
          v-model="searchForm.keyword"
          placeholder="输入客户姓名/手机号"
          shape="round"
          @search="handleSearch"
        />
      </view>

      <!-- 列表容器 -->
      <scroll-view
        class="list-scroll-view"
        scroll-y
        refresher-enabled
        :refresher-triggered="isRefreshing"
        @refresherrefresh="onRefresh"
        @scrolltolower="loadMore"
        @scroll="onScroll"
        :lower-threshold="100"
        :scroll-top="scrollTopValue"
        :scroll-with-animation="true"
      >
        <!-- 列表 -->
        <view class="list-content">
          <view
            v-for="(item, index) in list"
            :key="item.id || index"
            class="list-card"
            :style="{ animationDelay: `${index * 0.06}s` }"
            @click="handleDetail(item)"
          >
            <!-- 状态角标 -->
            <view class="status-badge">
              <text class="status-text">待补充</text>
            </view>

            <view class="list-header">
              <view class="header-left">
                <view class="avatar">
                  {{ (item.name || "?").charAt(0) }}
                </view>
                <view class="title-block">
                  <text class="name">{{ item.name || `客户${index + 1}` }}</text>
                  <text class="sub-info">{{ item.phone || '-' }}</text>
                </view>
              </view>
            </view>
            <view class="list-body">
              <view v-if="item.supplementType" class="info-row">
                <view class="info-icon">
                  <u-icon name="file-text" size="22" color="#a0aec0" />
                </view>
                <text class="label">补充类型</text>
                <text class="value">{{ item.supplementType }}</text>
              </view>
              <view v-if="item.pushQuota" class="info-row">
                <view class="info-icon">
                  <u-icon name="red-packet" size="22" color="#a0aec0" />
                </view>
                <text class="label">申请金额</text>
                <text class="value amount-value">￥{{ item.pushQuota }}</text>
              </view>
              <view v-if="item.supplementRemark" class="info-row">
                <view class="info-icon">
                  <u-icon name="edit-pen" size="22" color="#a0aec0" />
                </view>
                <text class="label">补充说明</text>
                <text class="value remark-text">{{ item.supplementRemark }}</text>
              </view>
              <view v-if="item.creditOrderId" class="info-row">
                <view class="info-icon">
                  <u-icon name="order" size="22" color="#a0aec0" />
                </view>
                <text class="label">订单号</text>
                <text class="value order-no">{{ item.creditOrderId }}</text>
              </view>
              <view v-if="item.createTime" class="info-row">
                <view class="info-icon">
                  <u-icon name="clock" size="22" color="#a0aec0" />
                </view>
                <text class="label">创建时间</text>
                <text class="value time-text">{{ item.createTime }}</text>
              </view>
            </view>
            <view class="list-footer">
              <view class="footer-left">
                <u-tag
                  text="待补充"
                  type="warning"
                  size="mini"
                  plain
                  class="status-tag"
                />
              </view>
              <view class="footer-right">
                <text class="detail-text">去补充</text>
                <u-icon name="arrow-right" color="#5da7ff" size="24" />
              </view>
            </view>
          </view>

          <!-- 空状态 -->
          <view v-if="!loading && list.length === 0" class="empty-state">
            <u-empty text="暂无待补充资料" mode="list" />
          </view>

          <!-- 加载状态 -->
          <view v-if="loading && list.length > 0 && !isRefreshing" class="load-more">
            <u-loading mode="circle" />
          </view>
          <view v-if="!hasMore && list.length > 0" class="no-more">
            没有更多了
          </view>
        </view>
      </scroll-view>

      <!-- 回到顶部按钮 -->
      <view
        v-show="showBackTop"
        class="back-top-btn"
        @click="backToTop"
      >
        <u-icon name="arrow-up" color="#fff" size="32" />
      </view>
    </view>
  </app-page>
</template>

<script setup>
import { reactive, ref } from "vue";
import { useCarloanApi } from "@/api/carloan";
import { useSessionStore } from "@/stores";

const sessionStore = useSessionStore();

const businessApi = useCarloanApi();

// 搜索条件
const searchForm = reactive({
  keyword: "",
});

// 列表数据
const list = ref([]);
const loading = ref(false);
const pageNum = ref(1);
const pageSize = 10;
const hasMore = ref(true);

// 下拉刷新状态
const isRefreshing = ref(false);

// 回到顶部相关
const scrollTop = ref(0);
const showBackTop = ref(false);
const scrollTopValue = ref(0);

// 获取列表
async function fetchList(isRefresh = false) {
  if (loading.value) return;
  if (!isRefresh && !hasMore.value) return;

  loading.value = true;
  if (isRefresh) {
    pageNum.value = 1;
    hasMore.value = true;
  }

  try {
    const params = {
      pageNum: pageNum.value,
      pageSize,
      supplementNode: 2,
    };
    const kw = searchForm.keyword.trim();
    if (kw) {
      if (/^\d{7,}$/.test(kw)) {
        params.phone = kw;
      } else {
        params.name = kw;
      }
    }

    const res = await businessApi.getSupplementList(params);

    if (res?.code === 200) {
      const rows = res.data || [];
      if (isRefresh) {
        list.value = rows;
      } else {
        list.value.push(...rows);
      }
      hasMore.value = list.value.length < (res.total || 0);
      pageNum.value++;
    }
  } catch (e) {
    console.error("获取待补充资料列表失败", e);
  } finally {
    loading.value = false;
    if (isRefreshing.value) {
      isRefreshing.value = false;
    }
  }
}

// 搜索
function handleSearch() {
  fetchList(true);
}

/** 跳转到补充详情页 */
function handleDetail(item) {
  const uuid = item.uuid || "";
  const creditOrderId = item.creditOrderId || "";
  const name = item.name || "";
  const phone = item.phone || "";
  const remark = item.supplementRemark || "";

  // 保存订单ID到sessionStore
  sessionStore.setOrderInfo({
    orderId: item.id,
  });

  uni.navigateTo({
    url: `/pages/carloan/supplementDetail?uuid=${uuid}&creditOrderId=${creditOrderId}&id=${item.id}&name=${encodeURIComponent(name)}&phone=${phone}&remark=${encodeURIComponent(remark)}&isSupplementCustomer=${item.isSupplementCustomer || ""}&isSupplementVehicle=${item.isSupplementVehicle || ""}&isSupplementOrder=${item.isSupplementOrder || ""}&isSupplementFile=${item.isSupplementFile || ""}`,
  });
}

// 下拉刷新
async function onRefresh() {
  isRefreshing.value = true;
  try {
    await fetchList(true);
  } finally {
    isRefreshing.value = false;
  }
}

// 上拉加载
function loadMore() {
  fetchList(false);
}

// 滚动事件
function onScroll(e) {
  scrollTop.value = e.detail.scrollTop;
  showBackTop.value = e.detail.scrollTop > 400;
}

// 回到顶部
function backToTop() {
  // 先设一个不同于当前位的值强制触发变更，再归零
  scrollTopValue.value = scrollTop.value + 1;
  uni.$u?.nextTick?.(() => {
    scrollTopValue.value = 0;
  });
}

// 初始加载
fetchList(true);
</script>

<style lang="scss" scoped>
// ===== 页面基础 =====
.supplement-list-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 24rpx 20rpx 20rpx;
  background: linear-gradient(180deg, #f0f4f8 0%, #f8fafc 50%, #f1f5f9 100%);
  box-sizing: border-box;
  overflow: hidden;
}

// ===== 搜索框 =====
.search-box {
  flex-shrink: 0;
  margin-bottom: 20rpx;
  background: rgba(255, 255, 255, 0.85);
  border-radius: 20rpx;
  padding: 12rpx 16rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
  backdrop-filter: blur(12px);
}

// ===== 列表滚动区域 =====
.list-scroll-view {
  flex: 1;
  overflow-y: auto;
}

// ===== 列表区域 =====
.list-content {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  min-height: 100%;
  padding-bottom: 24rpx;
}

// ===== 列表卡片 =====
.list-card {
  position: relative;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 24rpx;
  padding: 0;
  box-shadow:
    0 2rpx 8rpx rgba(0, 0, 0, 0.04),
    0 8rpx 24rpx rgba(0, 0, 0, 0.03),
    0 0 0 1rpx rgba(0, 0, 0, 0.02);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  animation: slideUp 0.5s ease-out both;

  // 左侧状态色带
  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 6rpx;
    border-radius: 24rpx 0 0 24rpx;
    background: linear-gradient(180deg, #f59e0b, #fbbf24);
    transition: all 0.3s ease;
  }

  &:active {
    transform: scale(0.985) translateY(2rpx);
    box-shadow:
      0 1rpx 4rpx rgba(0, 0, 0, 0.05),
      0 4rpx 12rpx rgba(0, 0, 0, 0.03);
  }
}

// 状态角标
.status-badge {
  position: absolute;
  top: 0;
  right: 0;
  padding: 8rpx 20rpx;
  border-radius: 0 24rpx 0 24rpx;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  z-index: 2;

  .status-text {
    font-size: 22rpx;
    font-weight: 600;
    color: #b45309;
  }
}

// ===== 卡片头部 =====
.list-header {
  display: flex;
  align-items: center;
  padding: 20rpx 28rpx 16rpx 32rpx;
  border-bottom: 1rpx solid #f1f5f9;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
  flex: 1;
  min-width: 0;
}

.avatar {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.12);
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
}

.title-block {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  min-width: 0;
}

.name {
  font-size: 30rpx;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: 0.5rpx;
  line-height: 1.3;
}

.sub-info {
  font-size: 24rpx;
  color: #94a3b8;
  font-weight: 500;
}

// ===== 卡片内容区 =====
.list-body {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  padding: 12rpx 28rpx 12rpx 32rpx;
}

// ===== 信息行 =====
.info-row {
  display: flex;
  align-items: center;
  font-size: 26rpx;
  line-height: 1.5;
  padding: 4rpx 0;
}

.info-icon {
  width: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-right: 10rpx;
}

.label {
  color: #94a3b8;
  width: 140rpx;
  flex-shrink: 0;
  font-size: 25rpx;
  font-weight: 500;
}

.value {
  color: #334155;
  flex: 1;
  font-weight: 500;
  font-size: 26rpx;
}

.value.remark-text {
  color: #b45309;
}

.amount-value {
  color: #cf1322;
  font-weight: 700;
  font-size: 28rpx;
}

.value.order-no {
  font-size: 22rpx;
  color: #94a3b8;
  font-family: 'SF Mono', 'Helvetica Neue', sans-serif;
  letter-spacing: 0.5rpx;
}

.time-text {
  color: #94a3b8;
  font-size: 24rpx;
  font-weight: 500;
}

// ===== 卡片底部 =====
.list-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12rpx 28rpx 16rpx 32rpx;
  border-top: 1rpx solid #f1f5f9;
  margin-top: 4rpx;
}

.footer-left {
  display: flex;
  align-items: center;
}

.footer-right {
  display: flex;
  align-items: center;
  gap: 6rpx;
  padding: 8rpx 16rpx;
  border-radius: 24rpx;
  background: rgba(93, 167, 255, 0.08);
  transition: all 0.2s ease;

  &:active {
    background: rgba(93, 167, 255, 0.15);
  }
}

.detail-text {
  font-size: 24rpx;
  color: #5da7ff;
  font-weight: 600;
}

// ===== 空状态 & 加载 =====
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
}

// ===== 回到顶部按钮 =====
.back-top-btn {
  position: fixed;
  right: 30rpx;
  bottom: 140rpx;
  width: 84rpx;
  height: 84rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(93, 167, 255, 0.95), rgba(59, 130, 246, 0.95));
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6rpx 24rpx rgba(93, 167, 255, 0.4), 0 0 0 2rpx rgba(255, 255, 255, 0.3) inset;
  z-index: 999;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:active {
    transform: scale(0.9);
    box-shadow: 0 4rpx 16rpx rgba(93, 167, 255, 0.35);
  }
}

// ===== 入场动画 =====
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30rpx) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
