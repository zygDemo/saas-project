<template>
  <app-page nav-title="预审列表" no-body-scroll>
    <view class="apply-list-page">
      <!-- 搜索框 -->
      <view class="search-box">
        <u-search
          v-model="searchForm.keyword"
          placeholder="输入客户姓名/手机号"
          shape="round"
          @search="handleSearch"
        />
      </view>

      <!-- 列表容器 - 使用 scroll-view 实现下拉刷新、上拉加载、回到顶部 -->
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
        <!-- 列表 -->
        <view class="list-content">
          <view
            v-for="(item, index) in list"
            :key="item.id || index"
            class="list-card"
            :class="`status-${statusType(item.status)}`"
            :style="{ animationDelay: `${index * 0.06}s` }"
            @click="handleDetail(item)"
          >
            <!-- 状态角标 -->
            <view class="status-badge">
              <text class="status-text">{{ statusText(item.status) }}</text>
            </view>

            <view class="list-header">
              <view class="header-left">
                <view
                  class="avatar"
                  :class="`avatar--${statusType(item.status)}`"
                >
                  {{ (item.name || "?").charAt(0) }}
                </view>
                <view class="title-block">
                  <text class="name">{{
                    item.name || `客户${index + 1}`
                  }}</text>
                  <text class="sub-info">{{ item.phone || "-" }}</text>
                </view>
              </view>
            </view>
            <view class="list-body">
              <view
                v-if="item.pushQuota || item.pushQuota === '0'"
                class="quota-row"
              >
                <view class="quota-icon">
                  <u-icon name="rmb-circle" size="22" color="#5da7ff" />
                </view>
                <text class="label">授信额度</text>
                <text class="quota-value">{{
                  formatQuota(item.pushQuota)
                }}</text>
              </view>
              <view v-if="item.productName" class="info-row">
                <view class="info-icon">
                  <u-icon name="grid" size="22" color="#a0aec0" />
                </view>
                <text class="label">产品</text>
                <text class="value product-name">{{ item.productName }}</text>
              </view>
              <view v-if="item.periods" class="info-row">
                <view class="info-icon">
                  <u-icon name="calendar" size="22" color="#a0aec0" />
                </view>
                <text class="label">期数</text>
                <text class="value">{{ item.periods }}期</text>
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
                <text class="label">申请时间</text>
                <text class="value time-text">{{ item.createTime }}</text>
              </view>
            </view>
            <view class="list-footer">
              <view class="footer-left">
                <u-tag
                  :text="statusText(item.status)"
                  :type="statusType(item.status)"
                  size="mini"
                  plain
                  class="status-tag"
                />
              </view>
              <view class="footer-actions">
                <!-- 待授信：去授信按钮 -->
                <view
                  v-if="item.status === 4"
                  class="credit-btn"
                  @click.stop="handleGoCredit(item)"
                >
                  <u-icon name="edit-pen" size="28" color="#fff" />
                  <text class="credit-btn-text">去授信</text>
                </view>
                <view class="footer-right">
                  <text class="detail-text">查看详情</text>
                  <u-icon name="arrow-right" color="#5da7ff" size="24" />
                </view>
              </view>
            </view>
          </view>

          <!-- 空状态 -->
          <view v-if="!loading && list.length === 0" class="empty-state">
            <u-empty text="暂无数据" mode="list" />
          </view>

          <!-- 加载状态 -->
          <view
            v-if="loading && list.length > 0 && !isRefreshing"
            class="load-more"
          >
            <u-loading mode="circle" />
          </view>
          <view v-if="!hasMore && list.length > 0" class="no-more">
            没有更多了
          </view>
        </view>
      </scroll-view>

      <!-- 回到顶部按钮 -->
      <view v-show="showBackTop" class="back-top-btn" @click="backToTop">
        <u-icon name="arrow-up" color="#fff" size="32" />
      </view>
    </view>
  </app-page>
</template>

<script setup>
import { reactive, ref } from "vue";
import { useCarloanApi } from "@/api/carloan";
import { APP_ROUTES, buildRoute } from "@/common/navigation";
import { buildSignRouteQuery, buildDetailRouteQuery } from "@/common/carloan-route-query";

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

// 授信状态映射
const statusMap = {
  1: { text: "成功", type: "success" },
  2: { text: "失败", type: "error" },
  3: { text: "重新推送", type: "info" },
  4: { text: "待授信", type: "warning" },
};

function statusText(val) {
  return (statusMap[val] || {}).text || (val ? `状态${val}` : "未知");
}

function statusType(val) {
  return (statusMap[val] || {}).type || "default";
}

// 格式化额度（字符串类型，单位元）
function formatQuota(val) {
  if (!val && val !== "0") return "-";
  const num = Number(val);
  if (Number.isNaN(num)) return val;
  return num >= 10000 ? `${(num / 10000).toFixed(2)}万` : `${num.toFixed(2)}元`;
}

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
      status: 4,
      pageNum: pageNum.value,
      pageSize,
    };
    const kw = searchForm.keyword.trim();
    if (kw) {
      // 支持姓名或手机号搜索
      if (/^\d{7,}$/.test(kw)) {
        params.phone = kw;
      } else {
        params.name = kw;
      }
    }

    const res = await businessApi.getCreditList(params);

    if (res?.code === 200) {
      const rows = res.rows || [];
      if (isRefresh) {
        list.value = rows;
      } else {
        list.value.push(...rows);
      }
      // 判断是否还有更多
      hasMore.value = list.value.length < (res.total || 0);
      pageNum.value++;
    }
  } catch (e) {
    console.error("获取预审列表失败", e);
  } finally {
    loading.value = false;
    // 关闭下拉刷新
    if (isRefreshing.value) {
      isRefreshing.value = false;
    }
  }
}

// 搜索
function handleSearch() {
  fetchList(true);
}

// 跳转详情
function handleDetail(item) {
  uni.navigateTo({
    url: buildRoute(
      APP_ROUTES.carloan.precheck.applyDetail,
      buildDetailRouteQuery({ id: item.id || item.creditOrderId || item.uuid }),
    ),
  });
}

// 去授信 — 跳转人脸识别授信页面
function handleGoCredit(item) {
  const signRouteQuery = buildSignRouteQuery({
    uuid: item.uuid || "",
    name: item.name || "",
    phone: item.phone || "",
    amount: item.pushQuota || "",
    creditOrderId: item.creditOrderId || "",
  });
  uni.navigateTo({
    url: buildRoute(APP_ROUTES.carloan.signing.videoFaceSign, signRouteQuery),
  });
}

// 下拉刷新触发
async function onRefresh() {
  isRefreshing.value = true;
  try {
    await fetchList(true);
  } finally {
    isRefreshing.value = false;
  }
}

// 上拉加载更多触发
function loadMore() {
  fetchList(false);
}

// 滚动事件 - 用于回到顶部按钮的显示/隐藏
function onScroll(e) {
  scrollTop.value = e.detail.scrollTop;
  showBackTop.value = e.detail.scrollTop > 400;
}

// 回到顶部
function backToTop() {
  scrollTopValue.value = scrollTop.value > 0 ? -1 : 0;
  requestAnimationFrame(() => {
    scrollTopValue.value = 0;
  });
}

// 初始加载
fetchList(true);
</script>

<style lang="scss" scoped>
// ===== 页面基础 =====
.apply-list-page {
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

// ===== 搜索框 =====
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

// ===== 列表滚动区域 =====
.list-scroll-view {
  flex: 1;
  height: 0;
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
    background: #cbd5e1;
    transition: all 0.3s ease;
  }

  &.status-warning::before {
    background: linear-gradient(180deg, #f59e0b, #fbbf24);
  }
  &.status-info::before {
    background: linear-gradient(180deg, #3b82f6, #60a5fa);
  }
  &.status-success::before {
    background: linear-gradient(180deg, #10b981, #34d399);
  }
  &.status-error::before {
    background: linear-gradient(180deg, #ef4444, #f87171);
  }
  &.status-primary::before {
    background: linear-gradient(180deg, #2979ff, #5da7ff);
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
  background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
  z-index: 2;

  .status-text {
    font-size: 22rpx;
    font-weight: 600;
    color: #64748b;
  }
}

.list-card.status-warning .status-badge {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  .status-text {
    color: #b45309;
  }
}
.list-card.status-info .status-badge {
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  .status-text {
    color: #1d4ed8;
  }
}
.list-card.status-success .status-badge {
  background: linear-gradient(135deg, #d1fae5, #a7f3d0);
  .status-text {
    color: #047857;
  }
}
.list-card.status-error .status-badge {
  background: linear-gradient(135deg, #fee2e2, #fecaca);
  .status-text {
    color: #b91c1c;
  }
}
.list-card.status-primary .status-badge {
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  .status-text {
    color: #1e40af;
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
  position: relative;

  &::after {
    content: "";
    position: absolute;
    inset: -3rpx;
    border-radius: 50%;
    border: 2rpx solid rgba(255, 255, 255, 0.5);
  }

  &--warning {
    background: linear-gradient(135deg, #f59e0b, #fbbf24);
    box-shadow: 0 4rpx 16rpx rgba(245, 158, 11, 0.35);
  }
  &--info {
    background: linear-gradient(135deg, #3b82f6, #60a5fa);
    box-shadow: 0 4rpx 16rpx rgba(59, 130, 246, 0.35);
  }
  &--success {
    background: linear-gradient(135deg, #10b981, #34d399);
    box-shadow: 0 4rpx 16rpx rgba(16, 185, 129, 0.35);
  }
  &--error {
    background: linear-gradient(135deg, #ef4444, #f87171);
    box-shadow: 0 4rpx 16rpx rgba(239, 68, 68, 0.35);
  }
  &--primary {
    background: linear-gradient(135deg, #2979ff, #5da7ff);
    box-shadow: 0 4rpx 16rpx rgba(41, 121, 255, 0.35);
  }
  &--default {
    background: linear-gradient(135deg, #94a3b8, #cbd5e1);
    box-shadow: 0 4rpx 16rpx rgba(148, 163, 184, 0.3);
  }
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
  font-family: "Helvetica Neue", sans-serif;
}

// ===== 卡片内容区 =====
.list-body {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  padding: 12rpx 28rpx 12rpx 32rpx;
}

// 授信额度行
.quota-row {
  display: flex;
  align-items: center;
  font-size: 26rpx;
  line-height: 1.5;
  padding: 4rpx 0;

  .quota-icon {
    width: 32rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-right: 10rpx;
  }

  .quota-value {
    flex: 1;
    font-size: 30rpx;
    font-weight: 800;
    color: #5da7ff;
    font-family: "DIN Alternate", "Helvetica Neue", sans-serif;
    letter-spacing: -0.5rpx;
  }
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
  width: 120rpx;
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

.value.product-name {
  color: #1e293b;
  font-weight: 600;
}

.value.order-no {
  font-size: 22rpx;
  color: #94a3b8;
  font-family: "SF Mono", "Helvetica Neue", sans-serif;
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

.footer-actions {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

// 去授信按钮
.credit-btn {
  display: flex;
  align-items: center;
  gap: 6rpx;
  padding: 8rpx 20rpx;
  border-radius: 32rpx;
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
  box-shadow: 0 4rpx 12rpx rgba(245, 158, 11, 0.35);
  transition: all 0.2s ease;

  .credit-btn-text {
    font-size: 24rpx;
    font-weight: 600;
    color: #fff;
    letter-spacing: 0.5rpx;
  }

  &:active {
    transform: scale(0.95);
    box-shadow: 0 2rpx 8rpx rgba(245, 158, 11, 0.3);
  }
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

// ===== 回到顶部按钮 =====
.back-top-btn {
  position: fixed;
  right: 30rpx;
  bottom: 140rpx;
  width: 84rpx;
  height: 84rpx;
  border-radius: 50%;
  background: linear-gradient(
    135deg,
    rgba(93, 167, 255, 0.95),
    rgba(59, 130, 246, 0.95)
  );
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 6rpx 24rpx rgba(93, 167, 255, 0.4),
    0 0 0 2rpx rgba(255, 255, 255, 0.3) inset;
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