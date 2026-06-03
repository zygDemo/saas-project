<template>
  <layout :active-tab="1" nav-title="订单" show-tabbar>
    <view class="order-list-page">
      <!-- 搜索栏 -->
      <view class="search-bar">
        <u-search
          v-model="keyword"
          placeholder="姓名/手机号/车牌号/订单号"
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

      <!-- 节点状态筛选 -->
      <view class="filter-bar filter-bar--status">
        <scroll-view scroll-x class="filter-scroll">
          <view class="filter-list">
            <view
              v-for="(status, index) in nodeStatusFilterList"
              :key="index"
              class="filter-item filter-item--status"
              :class="{
                'filter-item--active': currentNodeStatus === status.value,
              }"
              @click="handleNodeStatusChange(status.value)"
            >
              {{ status.label }}
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
          :class="`status-${order.statusClass}`"
          :style="{ animationDelay: `${index * 0.06}s` }"
          @click="handleDetailButton(order)"
        >
          <!-- 订单头部 -->
          <view class="order-header">
            <view class="header-left">
              <view class="avatar" :class="`avatar--${order.statusClass}`">
                {{ order.name?.charAt(0) || "?" }}
              </view>
              <view class="title-block">
                <text class="customer-name">{{ order.name }}</text>
                <view class="order-status order-status--business-node">
                  {{ order.businessNodeLabel }}
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
            <view v-if="order.plateNumber" class="info-row">
              <view class="info-icon">
                <u-icon name="car" size="24" color="#8c8c8c" />
              </view>
              <text class="label">车牌号</text>
              <text class="value">{{ order.plateNumber }}</text>
            </view>
            <view v-if="order.vehicleDisplay" class="info-row">
              <view class="info-icon">
                <u-icon name="grid" size="24" color="#8c8c8c" />
              </view>
              <text class="label">车辆信息</text>
              <text class="value">{{ order.vehicleDisplay }}</text>
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
                v-if="order.phaseName"
                :text="order.phaseName"
                size="mini"
                type="primary"
                plain
              />
              <u-tag
                v-if="order.nodeStatusLabel"
                :text="order.nodeStatusLabel"
                size="mini"
                type="info"
                plain
              />
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
                size="mini"
                type="primary"
                @click.stop="handleDetailButton(order)"
              >
                详情
              </u-button>
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
import { onLoad, onReachBottom, onShow } from "@dcloudio/uni-app";
import { useBusinessApi } from "@/api/business";
import type { CreditListItem, PageResult } from "@/api/business";

const businessApi = useBusinessApi();

const ORDER_FILTER_STORAGE_KEY = "WORKBENCH_ORDER_FILTER";
const ORDER_FILTER_MAX_AGE = 60 * 1000;

// 搜索关键词
const keyword = ref("");
const lastKeyword = ref("");

type BusinessNodeFilterValue = "all" | string;
type NodeStatusFilterValue = "all" | string;

interface FilterOption {
  label: string;
  value: string;
  count: number;
}

interface OrderListViewItem extends CreditListItem {
  name: string;
  phone: string;
  statusClass: string;
  businessNode: string;
  businessNodeLabel: string;
  nodeStatusLabel: string;
  vehicleDisplay: string;
  createTime: string;
  creditOrderId?: string;
  pushQuota?: string;
  periods?: string | number;
}

const ORDER_NODE_OPTIONS: Array<Omit<FilterOption, "count">> = [
  { label: "身份证信息", value: "1100" },
  { label: "车辆信息", value: "1200" },
  { label: "申请信息", value: "1300" },
  { label: "签署授权书", value: "1400" },
  { label: "风控模型预审", value: "2000" },
  { label: "资方预审", value: "3000" },
  { label: "资料补充", value: "4000" },
  { label: "客户资料", value: "4100" },
  { label: "车辆资料", value: "4200" },
  { label: "订单信息", value: "4300" },
  { label: "文件信息", value: "4400" },
  { label: "风控初审", value: "5000" },
  { label: "风控终审", value: "6000" },
  { label: "请款资料", value: "7000" },
  { label: "资方终审", value: "8000" },
  { label: "资方放款", value: "9000" },
];

const NODE_STATUS_OPTIONS: Array<Omit<FilterOption, "count">> = [
  { label: "待处理", value: "10" },
  { label: "已通过", value: "20" },
  { label: "已拒绝", value: "30" },
  { label: "待补充", value: "50" },
  { label: "已完成", value: "90" },
];

const APPLICATION_STATUS_CLASS: Record<string, string> = {
  DRAFT: "3",
  SUBMITTED: "4",
  PENDING_RISK_PRE: "4",
  RISK_PRE_PASSED: "1",
  RISK_PRE_REJECTED: "2",
  PENDING_FUNDER_PRE: "4",
  FUNDER_PRE_PASSED: "1",
  FUNDER_PRE_REJECTED: "2",
  PENDING_FIRST_REVIEW: "4",
  FIRST_REVIEW_PASSED: "1",
  FIRST_REVIEW_REJECTED: "2",
  PENDING_SUPPLEMENT: "3",
  PENDING_FINAL_REVIEW: "4",
  FINAL_REVIEW_PASSED: "1",
  FINAL_REVIEW_REJECTED: "2",
  PENDING_FUNDER_REVIEW: "4",
  FUNDER_REVIEW_PASSED: "1",
  FUNDER_REVIEW_REJECTED: "2",
  PENDING_SIGN: "4",
  SIGNING_PROGRESS: "4",
  SIGNED: "1",
  PENDING_LOAN_REQUEST: "4",
  LOAN_REQUEST_REVIEWING: "4",
  LOAN_REQUEST_APPROVED: "1",
  LOAN_REQUEST_REJECTED: "2",
  PENDING_DISBURSEMENT: "4",
  DISBURSED: "1",
  CANCELLED: "2",
};

const NODE_STATUS_CLASS: Record<string, string> = {
  "10": "4",
  "20": "1",
  "30": "2",
  "50": "3",
  "90": "1",
};

// 当前业务节点筛选
const currentBusinessNode = ref<BusinessNodeFilterValue>("all");
const currentNodeStatus = ref<NodeStatusFilterValue>("all");

// 列表数据
const orderList = ref<OrderListViewItem[]>([]);
const loading = ref(false);
const pageNum = ref(1);
const pageSize = 10;
const hasMore = ref(true);
const total = ref(0);

const businessNodeMap = computed(() =>
  ORDER_NODE_OPTIONS.reduce<Record<string, string>>((map, item) => {
    map[item.value] = item.label;
    return map;
  }, {}),
);

const businessNodeFilterList = computed<FilterOption[]>(() => [
  { label: "全部", value: "all" as const, count: 0 },
  ...ORDER_NODE_OPTIONS.map((item) => ({
    ...item,
    count: 0,
  })),
]);

const nodeStatusFilterList = computed<FilterOption[]>(() => [
  { label: "全部状态", value: "all" as const, count: 0 },
  ...NODE_STATUS_OPTIONS.map((item) => ({
    ...item,
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

function getNodeStatusLabel(status: unknown) {
  if (status === undefined || status === null || String(status) === "") {
    return "";
  }
  const code = String(status);
  const option = NODE_STATUS_OPTIONS.find((item) => item.value === code);
  return option?.label || code;
}

const businessNodeCodeList = computed(() =>
  ORDER_NODE_OPTIONS.map((item) => item.value),
);

function isAfterPreAudit(node: unknown) {
  const code = String(node || "");
  if (!code) return false;

  const numericCode = Number(code);
  if (Number.isFinite(numericCode)) {
    return numericCode >= 4000;
  }

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

function handleDetailButton(order: OrderListViewItem) {
  const node = order?.nodeCode ?? order?.currentNode ?? order?.businessNode;
  if (isAfterPreAudit(node)) {
    const creditOrderId =
      order?.creditOrderId || order?.orderNo || order?.applicationNo || order?.id;
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

function firstText(...values: unknown[]) {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return "";
}

function firstValue<T>(...values: Array<T | undefined | null>) {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }
  return undefined;
}

function formatMoney(value: unknown) {
  if (value === undefined || value === null || String(value).trim() === "") {
    return "";
  }
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return String(value);
  }
  if (numericValue <= 0) {
    return "";
  }
  return numericValue.toFixed(2);
}

function formatDateTime(value: unknown) {
  if (!value) return "";
  const text = String(value);
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) {
    return text;
  }
  const pad = (num: number) => String(num).padStart(2, "0");
  return [
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  ].join(" ");
}

function resolveStatusClass(status: unknown, nodeStatus: unknown) {
  const statusText = String(status || "");
  if (["1", "2", "3", "4"].includes(statusText)) {
    return statusText;
  }
  if (APPLICATION_STATUS_CLASS[statusText]) {
    return APPLICATION_STATUS_CLASS[statusText];
  }
  const nodeStatusText = String(nodeStatus || "");
  return NODE_STATUS_CLASS[nodeStatusText] || "4";
}

function buildVehicleDisplay(order: CreditListItem) {
  return [order.vehicleBrand, order.vehicleModel]
    .map((item) => firstText(item))
    .filter(Boolean)
    .join(" ");
}

function normalizeOrderItem(order: CreditListItem): OrderListViewItem {
  const node = firstValue(order.currentNode, order.nodeCode, order.businessNode);
  const nodeStatus = firstValue(order.currentStatus, order.nodeStatus);
  const businessNode = firstText(node);
  const creditOrderId = firstText(
    order.creditOrderId,
    order.orderNo,
    order.applicationNo,
    order.id,
  );

  return {
    ...order,
    name: firstText(order.name, order.customerName, order.personName, "未知客户"),
    phone: firstText(order.phone, order.telephone, "-"),
    creditOrderId,
    businessNode,
    businessNodeLabel: firstText(
      order.currentNodeName,
      order.nodeName,
      getBusinessNodeLabel(businessNode),
    ),
    nodeStatusLabel: firstText(
      order.currentStatusName,
      order.nodeStatusName,
      getNodeStatusLabel(nodeStatus),
    ),
    statusClass: resolveStatusClass(order.status, nodeStatus),
    vehicleDisplay: buildVehicleDisplay(order),
    pushQuota: formatMoney(firstValue(order.pushQuota, order.amount)),
    periods: firstValue(order.periods, order.term, order.approvedTerm),
    createTime: firstText(
      order.createTime,
      formatDateTime(order.createdAt),
      formatDateTime(order.updatedAt),
    ),
  };
}

function extractRows(res: any) {
  const pageData = (res?.data || {}) as PageResult<CreditListItem>;
  if (Array.isArray(pageData.records)) return pageData.records;
  if (Array.isArray(pageData.rows)) return pageData.rows;
  if (Array.isArray(res?.records)) return res.records as CreditListItem[];
  if (Array.isArray(res?.rows)) return res.rows as CreditListItem[];
  return [];
}

function extractTotal(res: any, rowsLength: number) {
  const pageData = (res?.data || {}) as PageResult<CreditListItem>;
  const totalValue = firstValue(pageData.total, res?.total);
  const numericTotal = Number(totalValue);
  return Number.isFinite(numericTotal) ? numericTotal : rowsLength;
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
      params.nodeCode = Number(currentBusinessNode.value);
    }

    if (currentNodeStatus.value !== "all") {
      params.nodeStatus = Number(currentNodeStatus.value);
    }

    const kw = keyword.value.trim();
    if (kw) {
      params.keyword = kw;
    }

    const res = await businessApi.getOrderList(params);
    if (res?.code === 200) {
      const rows = extractRows(res).map(normalizeOrderItem);
      if (isRefresh) {
        orderList.value = rows;
      } else {
        orderList.value.push(...rows);
      }
      total.value = extractTotal(res, rows.length);
      hasMore.value = orderList.value.length < total.value;
      pageNum.value++;
    }
  } catch (e) {
    console.error("获取订单列表失败:", e);
  } finally {
    loading.value = false;
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

// 切换节点状态筛选
function handleNodeStatusChange(status: NodeStatusFilterValue) {
  if (currentNodeStatus.value === status) return;
  currentNodeStatus.value = status;
  fetchList(true);
}

// 处理订单（待授信状态可处理）
function handleApprove(order: OrderListViewItem) {
  uni.navigateTo({
    url: `/pages/business/applyDetail?id=${order.id}`,
  });
}

function applyWorkbenchFilter() {
  const filter = uni.getStorageSync(ORDER_FILTER_STORAGE_KEY) || {};
  const nodeCode = String(filter.nodeCode || "");
  const updatedAt = Number(filter.updatedAt || 0);
  if (
    nodeCode &&
    ORDER_NODE_OPTIONS.some((item) => item.value === nodeCode) &&
    Date.now() - updatedAt < ORDER_FILTER_MAX_AGE
  ) {
    currentBusinessNode.value = nodeCode;
    uni.removeStorageSync(ORDER_FILTER_STORAGE_KEY);
    fetchList(true);
    return true;
  }
  return false;
}

// 初始加载
onLoad(() => {
  if (!applyWorkbenchFilter()) {
    fetchList(true);
  }
});

onShow(() => {
  applyWorkbenchFilter();
});

onReachBottom(() => {
  fetchList();
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
