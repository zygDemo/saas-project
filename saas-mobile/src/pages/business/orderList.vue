<template>
  <layout :active-tab="1" nav-title="订单" show-tabbar>
    <view class="order-list-page">
      <!-- 搜索栏 -->
      <view class="search-bar">
        <u-search
          v-model="keyword"
          placeholder="搜索客户姓名"
          :show-action="false"
          @search="handleSearch"
          @custom="handleSearch"
        />
      </view>

      <!-- 业务节点筛选 -->
      <view class="filter-bar">
        <scroll-view scroll-x class="filter-scroll">
          <view class="filter-list">
            <view
              v-for="(node, index) in businessNodeFilterList"
              :key="index"
              class="filter-item"
              :class="{
                'filter-item--active': currentBusinessNode === node.value,
              }"
              @click="handleBusinessNodeChange(node.value)"
            >
              {{ node.label }}
              <view v-if="node.count > 0" class="filter-badge">
                {{ node.count }}
              </view>
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- 订单列表 -->
      <view class="order-list">
        <view
          v-for="(order, index) in orderList"
          :key="order.id"
          class="order-card"
          :class="`status-${order.status}`"
          :style="{ animationDelay: `${index * 0.06}s` }"
          @click="handleOrderDetail(order)"
        >
          <!-- 订单头部 -->
          <view class="order-header">
            <view class="header-left">
              <view class="avatar" :class="`avatar--${order.status}`">
                {{ order.name?.charAt(0) || "?" }}
              </view>
              <view class="title-block">
                <text class="customer-name">{{ order.name }}</text>
                <view class="order-status order-status--business-node">
                  {{ getBusinessNodeLabel(order.businessNode) }}
                </view>
              </view>
            </view>
            <text class="order-time-text">{{ order.createTime }}</text>
          </view>

          <!-- 订单内容 -->
          <view class="order-body">
            <view class="info-row">
              <view class="info-icon">
                <u-icon name="order" size="24" color="#8c8c8c" />
              </view>
              <text class="label">订单号</text>
              <text class="value order-no">{{
                order.creditOrderId || order.id
              }}</text>
            </view>
            <view class="info-row">
              <view class="info-icon">
                <u-icon name="phone" size="24" color="#8c8c8c" />
              </view>
              <text class="label">联系电话</text>
              <text class="value">{{ order.phone }}</text>
            </view>
            <view v-if="order.pushQuota" class="info-row">
              <view class="info-icon">
                <u-icon name="red-packet" size="24" color="#8c8c8c" />
              </view>
              <text class="label">申请金额</text>
              <text class="value amount-value">¥{{ order.pushQuota }}</text>
            </view>
            <view v-if="order.productName" class="info-row">
              <view class="info-icon">
                <u-icon name="grid" size="24" color="#8c8c8c" />
              </view>
              <text class="label">产品名称</text>
              <text class="value">{{ order.productName }}</text>
            </view>
            <view v-if="order.periods" class="info-row">
              <view class="info-icon">
                <u-icon name="calendar" size="24" color="#8c8c8c" />
              </view>
              <text class="label">期数</text>
              <text class="value">{{ order.periods }}期</text>
            </view>
          </view>

          <!-- 订单操作 -->
          <view class="order-footer">
            <view class="order-tags">
              <u-tag
                v-if="order.isSignContract === 1"
                text="已签约"
                size="mini"
                type="success"
                plain
              />
              <u-tag
                v-if="order.isSignContract === 2"
                text="未签约"
                size="mini"
                type="warning"
                plain
              />
              <u-tag
                v-if="order.isFaceRecognition === 2"
                text="人脸认证通过"
                size="mini"
                type="success"
                plain
              />
              <u-tag
                v-if="order.isFaceRecognition === 3"
                text="人脸认证失败"
                size="mini"
                type="error"
                plain
              />
            </view>
            <view class="order-actions">
              <u-button
                v-if="order.status === 4"
                size="mini"
                type="primary"
                @click.stop="handleDetailButton(order)"
              >
                详情
              </u-button>
              <!-- <u-button
                size="mini"
                type="info"
                plain
                @click.stop="handleOrderDetail(order)"
              >
                处理
              </u-button> -->
            </view>
          </view>
        </view>
      </view>

      <!-- 加载状态 -->
      <view v-if="loading && orderList.length > 0" class="load-more">
        <u-loading mode="circle" />
      </view>
      <view v-if="!hasMore && orderList.length > 0" class="no-more">
        没有更多了
      </view>

      <!-- 空状态 -->
      <view v-if="!loading && orderList.length === 0" class="empty-state">
        <u-empty mode="list" text="暂无订单数据" />
      </view>
    </view>
  </layout>
</template>

<script setup lang="ts">
import layout from "@/pages/layout/layout.vue";
import { computed, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { useBusinessApi } from "@/api/business";
import { useSessionStore } from "@/stores";

const businessApi = useBusinessApi();
const sessionStore = useSessionStore();

// 搜索关键词
const keyword = ref("");
const lastKeyword = ref("");

type BusinessNodeFilterValue = "all" | string;

// 当前业务节点筛选
const currentBusinessNode = ref<BusinessNodeFilterValue>("all");

// 列表数据
const orderList = ref<any[]>([]);
const loading = ref(false);
const pageNum = ref(1);
const pageSize = 10;
const hasMore = ref(true);
const total = ref(0);

const businessNodeMap = computed(() => {
  return sessionStore.loanBusinessNodes.reduce<Record<string, string>>(
    (map, item) => {
      map[String(item.code)] =
        item.name || item.description || String(item.code);
      return map;
    },
    {},
  );
});

const businessNodeFilterList = computed(() => [
  { label: "全部", value: "all" as const, count: 0 },
  ...sessionStore.loanBusinessNodes.map((item) => ({
    label: item.name || item.description || String(item.code),
    value: String(item.code),
    count: 0,
  })),
]);

function getBusinessNodeLabel(node: unknown) {
  if (node === undefined || node === null || String(node) === "") {
    return "未知节点";
  }
  const code = String(node);
  return businessNodeMap.value[code] || code;
}

const businessNodeCodeList = computed(() =>
  sessionStore.loanBusinessNodes.map((item) => String(item.code)),
);

function isAfterPreAudit(node: unknown) {
  const code = String(node || "");
  if (!code) return false;

  const codeList = businessNodeCodeList.value;
  const preAuditIndex = codeList.indexOf("PRE_AUDIT");
  const currentIndex = codeList.indexOf(code);
  if (preAuditIndex >= 0 && currentIndex >= 0) {
    return currentIndex > preAuditIndex;
  }

  const fallbackOrder = [
    "INITIAL_AUDIT",
    "PRE_AUDIT",
    "SUPPLEMENT_MATERIALS",
    "SIGN_CONTRACT",
    "FACE_RECOGNITION",
    "FACE_SIGN",
    "LOAN_DISBURSEMENT",
  ];
  return fallbackOrder.indexOf(code) > fallbackOrder.indexOf("PRE_AUDIT");
}

function handleDetailButton(order: any) {
  if (isAfterPreAudit(order?.businessNode)) {
    const creditOrderId = order?.creditOrderId || order?.id;
    if (!creditOrderId) {
      uni.showToast({ title: "缺少订单编号", icon: "none" });
      return;
    }

    uni.navigateTo({
      url: `/pages/business/supplementDetail?creditOrderId=${encodeURIComponent(
        String(creditOrderId),
      )}`,
    });
    return;
  }

  handleApprove(order);
}

/** 获取列表 */
async function fetchList(isRefresh = false) {
  if (loading.value) return;
  if (!isRefresh && !hasMore.value) return;

  loading.value = true;
  if (isRefresh) {
    pageNum.value = 1;
    hasMore.value = true;
  }

  try {
    const params: Record<string, unknown> = {
      pageNum: pageNum.value,
      pageSize,
    };

    if (currentBusinessNode.value !== "all") {
      params.businessNode = currentBusinessNode.value;
    }

    const kw = keyword.value.trim();
    if (kw) {
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
        orderList.value = rows;
      } else {
        orderList.value.push(...rows);
      }
      total.value = res.total || 0;
      hasMore.value = orderList.value.length < total.value;
      pageNum.value++;
    }
  } catch (e) {
    console.error("获取订单列表失败:", e);
  } finally {
    loading.value = false;
  }
}

/** 获取贷款业务节点枚举并存入会话存储 */
async function fetchLoanBusinessNodes() {
  try {
    const res = await businessApi.getLoanBusinessNodes();
    if (res?.code === 200 && Array.isArray(res.data)) {
      sessionStore.setLoanBusinessNodes(res.data);
    }
  } catch (e) {
    console.error("获取贷款业务节点枚举失败:", e);
  }
}

// 搜索订单
function handleSearch() {
  if (keyword.value.trim() === lastKeyword.value.trim()) return;
  lastKeyword.value = keyword.value.trim();
  fetchList(true);
}

// 切换业务节点筛选
function handleBusinessNodeChange(node: BusinessNodeFilterValue) {
  if (currentBusinessNode.value === node) return;
  currentBusinessNode.value = node;
  fetchList(true);
}

// 查看订单详情
function handleOrderDetail(order: any) {
  uni.navigateTo({
    url: `/pages/business/orderDetail?id=${order.id}`,
  });
}

// 处理订单（待授信状态可处理）
function handleApprove(order: any) {
  uni.navigateTo({
    url: `/pages/business/applyDetail?id=${order.id}`,
  });
}

// 初始加载
onLoad(() => {
  fetchLoanBusinessNodes();
  fetchList(true);
});
</script>

<style lang="scss" scoped>
.order-list-page {
  min-height: 100vh;
  background: #f5f6f7;
}

.search-bar {
  padding: 20rpx 24rpx;
  background: #fff;
}

.filter-bar {
  background: #fff;
  border-bottom: 1rpx solid #eee;
}

.filter-scroll {
  white-space: nowrap;
}

.filter-list {
  display: inline-flex;
  padding: 20rpx 24rpx;
  gap: 20rpx;
}

.filter-item {
  position: relative;
  padding: 12rpx 24rpx;
  border-radius: 32rpx;
  background: #f5f6f7;
  font-size: 26rpx;
  color: #666;
  white-space: nowrap;
  transition: all 0.3s ease;

  &--active {
    background: var(--u-type-primary);
    color: #fff;
    font-weight: 600;
  }

  &:active {
    opacity: 0.8;
    transform: scale(0.95);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.filter-badge {
  position: absolute;
  top: -8rpx;
  right: -8rpx;
  min-width: 32rpx;
  height: 32rpx;
  padding: 0 8rpx;
  background: #f56c6c;
  border-radius: 16rpx;
  font-size: 20rpx;
  color: #fff;
  text-align: center;
  line-height: 32rpx;
}

.order-list {
  padding: 24rpx;
}

.order-card {
  position: relative;
  margin-bottom: 24rpx;
  background: #fff;
  border-radius: 24rpx;
  padding: 28rpx 28rpx 28rpx 36rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  animation: slideUp 0.4s ease-out both;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 24rpx;
    bottom: 24rpx;
    width: 6rpx;
    border-radius: 0 6rpx 6rpx 0;
    background: #d9d9d9;
  }

  // 状态色条映射
  &.status-1::before {
    background: linear-gradient(180deg, #52c41a, #73d13d);
  }
  &.status-2::before {
    background: linear-gradient(180deg, #ff4d4f, #ff7875);
  }
  &.status-3::before {
    background: linear-gradient(180deg, #faad14, #ffc53d);
  }
  &.status-4::before {
    background: linear-gradient(180deg, #4096ff, #69b1ff);
  }

  &:active {
    transform: scale(0.98);
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
  }
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.header-left {
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

  &--1 {
    background: linear-gradient(135deg, #52c41a, #73d13d);
  }
  &--2 {
    background: linear-gradient(135deg, #ff4d4f, #ff7875);
  }
  &--3 {
    background: linear-gradient(135deg, #faad14, #ffc53d);
  }
  &--4 {
    background: linear-gradient(135deg, #4096ff, #69b1ff);
  }
}

.title-block {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex-wrap: wrap;
  min-width: 0;
}

.customer-name {
  font-size: 32rpx;
  font-weight: 700;
  color: #1f1f1f;
  letter-spacing: 0.5rpx;
}

.order-time-text {
  font-size: 22rpx;
  color: #bfbfbf;
  flex-shrink: 0;
}

.order-status {
  padding: 8rpx 20rpx;
  border-radius: 24rpx;
  font-size: 24rpx;
  font-weight: 500;

  &--1 {
    background: #f6ffed;
    color: #52c41a;
  }

  &--2 {
    background: #fff1f0;
    color: #f5222d;
  }

  &--3 {
    background: #fff7e6;
    color: #fa8c16;
  }

  &--4 {
    background: #e6f7ff;
    color: #1890ff;
  }

  &--business-node {
    background: #e6f7ff;
    color: #1890ff;
  }
}

.order-body {
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

.order-no {
  font-size: 24rpx;
  color: #8c8c8c;
  font-family: monospace;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 24rpx;
  background: #fafafa;
  border-top: 1rpx solid #f0f0f0;
}

.order-tags {
  display: flex;
  gap: 12rpx;
  flex-wrap: wrap;
  flex: 1;
}

.order-actions {
  display: flex;
  gap: 16rpx;
}

.empty-state {
  padding: 120rpx 0;
  background: #fff;
  margin-top: 24rpx;
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
</style>
