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
      <view class="filter-card">
        <view class="filter-title-row">
          <text class="filter-title">业务节点</text>
          <text class="filter-subtitle">按流程节点快速定位订单</text>
        </view>
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
            <view class="filter-list filter-list--status">
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
      </view>

      <!-- 订单列表（带下拉刷新） -->
      <scroll-view
        scroll-y
        class="order-list-scroll"
        :scroll-top="scrollTopValue"
        :refresher-enabled="true"
        :refresher-triggered="isRefreshing"
        @refresherrefresh="onRefresh"
        @scroll="onScroll"
      >

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
              v-if="canGoSign(order)"
              size="mini"
              type="success"
              @click.stop="handleSignButton(order)"
            >
              签约
            </u-button>
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

      <!-- 返回顶部按钮 -->
      <view
        v-if="showBackToTop"
        class="back-to-top"
        @click="handleBackToTop"
      >
        <u-icon name="arrow-up" color="#fff" size="40" />
      </view>
    </scroll-view>
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

// 下拉刷新相关
const isRefreshing = ref(false);

// 返回顶部相关
const showBackToTop = ref(false);
const scrollTopValue = ref(0);
const SCROLL_THRESHOLD = 500; // 滚动超过500rpx显示返回顶部按钮

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
  { label: "预审进件", value: "1100" },
  { label: "风控预审", value: "1200" },
  { label: "资方预审", value: "1300" },
  { label: "资料补充", value: "1400" },
  { label: "风控初审", value: "2100" },
  { label: "风控终审", value: "2200" },
  { label: "资方终审", value: "3100" },
  { label: "客户签约", value: "4100" },
  { label: "请款资料", value: "5100" },
  { label: "资方放款", value: "6100" },
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
  const normalizedCode = code.endsWith("00") ? code : `${code.charAt(0)}000`;
  return businessNodeMap.value[code] || businessNodeMap.value[normalizedCode] || code;
}

const NODE_DETAIL_ROUTE_MAP: Record<string, string> = {
  "1100": "/pages/business/applyDetail",
  "1200": "/pages/business/applyDetail",
  "1300": "/pages/business/applyDetail",
  "1400": "/pages/business/supplementDetail",
  "2100": "/pages/business/applyDetail",
  "2200": "/pages/business/applyDetail",
  "3100": "/pages/business/applyDetail",
  "4100": "/pages/business/signCenter",
  "5100": "/pages/business/supplementDetail",
  "6100": "/pages/business/supplementDetail",
};

function normalizeNodeCode(node: unknown) {
  const code = String(node || "");
  if (!code) return "";
  if (NODE_DETAIL_ROUTE_MAP[code]) return code;
  const stageCode = `${code.charAt(0)}000`;
  return NODE_DETAIL_ROUTE_MAP[stageCode] ? stageCode : code;
}

function buildOrderQuery(order: OrderListViewItem) {
  const creditOrderId = firstText(
    order?.creditOrderId,
    order?.orderNo,
    order?.applicationNo,
    order?.id,
  );
  const query = [
    `id=${encodeURIComponent(firstText(order?.id))}`,
    `creditOrderId=${encodeURIComponent(creditOrderId)}`,
    `uuid=${encodeURIComponent(firstText(order?.uuid))}`,
    `customerName=${encodeURIComponent(firstText(order?.name, order?.customerName, order?.personName))}`,
    `customerPhone=${encodeURIComponent(firstText(order?.phone, order?.telephone))}`,
    `nodeCode=${encodeURIComponent(normalizeNodeCode(order?.nodeCode ?? order?.currentNode ?? order?.businessNode))}`,
  ];
  return query.join("&");
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
    return numericCode >= 4100;
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

function resolveSignStatus(order: OrderListViewItem) {
  if (order.isSignContract === 1 || order.currentStatus === "SIGNED") return "SIGNED";
  const status = firstText(order.currentStatus, order.nodeStatus, order.status);
  if (status === "SIGNING_PROGRESS" || status === "PENDING_SIGN") return "CONFIRMING_AMOUNT";
  return status || "CONFIRMING_AMOUNT";
}

function canGoSign(order: OrderListViewItem) {
  const node = order?.nodeCode ?? order?.currentNode ?? order?.businessNode;
  if (order.isSignContract === 1) return true;
  const status = String(order.currentStatus || order.status || "");
  return isAfterPreAudit(node) || ["PENDING_SIGN", "SIGNING_PROGRESS", "SIGNED"].includes(status);
}

function handleSignButton(order: OrderListViewItem) {
  const creditOrderId = order?.creditOrderId || order?.orderNo || order?.applicationNo || order?.id;
  if (!creditOrderId) {
    uni.showToast({ title: "缺少订单编号", icon: "none" });
    return;
  }
  const query = [
    `creditOrderId=${encodeURIComponent(String(creditOrderId))}`,
    `uuid=${encodeURIComponent(firstText(order.uuid))}`,
    `customerName=${encodeURIComponent(order.name || "")}`,
    `customerPhone=${encodeURIComponent(order.phone || "")}`,
    `signStatus=${encodeURIComponent(resolveSignStatus(order))}`,
  ];
  uni.navigateTo({
    url: `/pages/business/signCenter?${query.join("&")}`,
  });
}

function handleDetailButton(order: OrderListViewItem) {
  const nodeCode = normalizeNodeCode(order?.nodeCode ?? order?.currentNode ?? order?.businessNode);
  const route = NODE_DETAIL_ROUTE_MAP[nodeCode] || "/pages/business/applyDetail";
  const query = buildOrderQuery(order);

  if (route === "/pages/business/signCenter") {
    handleSignButton(order);
    return;
  }

  uni.navigateTo({
    url: `${route}?${query}`,
  });
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

// 处理订单（统一订单详情入口兜底）
function handleApprove(order: OrderListViewItem) {
  const query = buildOrderQuery(order);
  uni.navigateTo({
    url: `/pages/business/applyDetail?${query}`,
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

// 下拉刷新处理
async function onRefresh() {
  isRefreshing.value = true;
  await fetchList(true);
  isRefreshing.value = false;
}

// 滚动事件处理
function onScroll(e: any) {
  const scrollTop = e.detail.scrollTop;
  showBackToTop.value = scrollTop > SCROLL_THRESHOLD;
}

// 返回顶部
function handleBackToTop() {
  // scroll-view 需要通过 scroll-top 属性来控制滚动位置
  scrollTopValue.value = 0;
}
</script>

<style lang="scss" scoped>
.order-list-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #eef4ff 0%, #f6f8fb 260rpx, #f6f8fb 100%);
}

.order-list-scroll {
  flex: 1;
  min-height: 0;
}

.search-bar {
  padding: 22rpx 24rpx 16rpx;
  background: transparent;
}

.filter-card {
  margin: 0 24rpx 8rpx;
  padding: 22rpx 0 18rpx;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.92);
  border: 1rpx solid #e5edf7;
  border-radius: 22rpx;
  box-shadow: 0 12rpx 32rpx rgba(15, 23, 42, 0.055);
}

.filter-title-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16rpx;
  padding: 0 24rpx 14rpx;
}

.filter-title {
  position: relative;
  padding-left: 18rpx;
  font-size: 30rpx;
  font-weight: 800;
  color: #172033;

  &::before {
    content: "";
    position: absolute;
    top: 50%;
    left: 0;
    width: 6rpx;
    height: 28rpx;
    background: linear-gradient(180deg, #2563eb, #14b8a6);
    border-radius: 999rpx;
    transform: translateY(-50%);
  }
}

.filter-subtitle {
  font-size: 22rpx;
  color: #94a3b8;
}

.filter-bar {
  background: transparent;
}

.filter-bar--status {
  margin-top: 6rpx;
  border-top: 1rpx dashed #e5edf7;
}

.filter-scroll {
  white-space: nowrap;
}

.filter-list {
  display: inline-flex;
  gap: 16rpx;
  padding: 12rpx 24rpx;
}

.filter-list--status {
  padding-bottom: 0;
}

.filter-item {
  position: relative;
  min-height: 56rpx;
  padding: 0 24rpx;
  border: 1rpx solid #e2e8f0;
  border-radius: 999rpx;
  background: #f8fafc;
  box-sizing: border-box;
  font-size: 25rpx;
  font-weight: 600;
  line-height: 54rpx;
  color: #475569;
  white-space: nowrap;
  transition: transform 0.18s ease, background 0.18s ease, color 0.18s ease;

  &--active {
    background: linear-gradient(135deg, #2563eb, #14b8a6);
    border-color: transparent;
    color: #fff;
    box-shadow: 0 8rpx 18rpx rgba(37, 99, 235, 0.16);
  }

  &:active {
    transform: scale(0.96);
  }
}

.filter-item--status {
  min-height: 50rpx;
  padding: 0 22rpx;
  font-size: 24rpx;
  line-height: 48rpx;
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
  padding: 18rpx 24rpx 28rpx;
}

.order-card {
  position: relative;
  margin-bottom: 22rpx;
  overflow: hidden;
  background: #fff;
  border: 1rpx solid #e7edf6;
  border-radius: 22rpx;
  box-shadow: 0 12rpx 32rpx rgba(15, 23, 42, 0.055);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
  animation: slideUp 0.4s ease-out both;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 8rpx;
    background: #cbd5e1;
  }

  // 状态色条映射
  &.status-1::before {
    background: linear-gradient(180deg, #22c55e, #16a34a);
  }
  &.status-2::before {
    background: linear-gradient(180deg, #ef4444, #f97316);
  }
  &.status-3::before {
    background: linear-gradient(180deg, #f59e0b, #facc15);
  }
  &.status-4::before {
    background: linear-gradient(180deg, #2563eb, #14b8a6);
  }

  &:active {
    box-shadow: 0 6rpx 18rpx rgba(37, 99, 235, 0.1);
    transform: scale(0.99);
  }
}

.order-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
  padding: 26rpx 26rpx 20rpx 34rpx;
  background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
  border-bottom: 1rpx solid #edf2f7;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
  flex: 1;
  min-width: 0;
}

.avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72rpx;
  height: 72rpx;
  border-radius: 18rpx;
  color: #fff;
  font-size: 30rpx;
  font-weight: 800;
  flex-shrink: 0;
  box-shadow: 0 8rpx 18rpx rgba(15, 23, 42, 0.12);

  &--1 {
    background: linear-gradient(135deg, #16a34a, #22c55e);
  }
  &--2 {
    background: linear-gradient(135deg, #ef4444, #f97316);
  }
  &--3 {
    background: linear-gradient(135deg, #f59e0b, #facc15);
  }
  &--4 {
    background: linear-gradient(135deg, #2563eb, #14b8a6);
  }
}

.title-block {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10rpx;
  min-width: 0;
}

.customer-name {
  font-size: 34rpx;
  font-weight: 800;
  line-height: 1.15;
  color: #111827;
}

.order-time-text {
  max-width: 180rpx;
  font-size: 22rpx;
  line-height: 1.3;
  color: #94a3b8;
  text-align: right;
  flex-shrink: 0;
}

.order-status {
  padding: 7rpx 16rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
  font-weight: 700;
  line-height: 1.2;

  &--1 {
    background: #ecfdf3;
    color: #16a34a;
  }

  &--2 {
    background: #fff1f2;
    color: #e11d48;
  }

  &--3 {
    background: #fffbeb;
    color: #d97706;
  }

  &--4 {
    background: #eff6ff;
    color: #2563eb;
  }

  &--business-node {
    background: #eff6ff;
    color: #2563eb;
    border: 1rpx solid #dbeafe;
  }
}

.order-body {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  padding: 22rpx 26rpx 20rpx 34rpx;
}

.info-row {
  display: flex;
  align-items: flex-start;
  min-height: 42rpx;
  font-size: 26rpx;
  line-height: 1.55;
}

.info-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42rpx;
  padding-top: 3rpx;
  flex-shrink: 0;
  margin-right: 4rpx;
}

.label {
  width: 132rpx;
  color: #94a3b8;
  flex-shrink: 0;
  font-size: 25rpx;
}

.value {
  flex: 1;
  min-width: 0;
  color: #334155;
  font-weight: 600;
  font-size: 26rpx;
  word-break: break-all;
}

.amount-value {
  color: #dc2626;
  font-weight: 800;
  font-size: 30rpx;
}

.order-no {
  font-size: 24rpx;
  color: #64748b;
  font-family: DINAlternate-Bold, Arial, sans-serif;
}

.order-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  padding: 18rpx 26rpx 22rpx 34rpx;
  background: #f8fafc;
  border-top: 1rpx solid #edf2f7;
}

.order-tags {
  display: flex;
  gap: 10rpx;
  flex-wrap: wrap;
  flex: 1;
  min-width: 0;
}

.order-actions {
  display: flex;
  align-items: center;
  gap: 14rpx;
  flex-shrink: 0;
}

.empty-state {
  margin: 24rpx;
  padding: 120rpx 0;
  background: #fff;
  border: 1rpx solid #e7edf6;
  border-radius: 22rpx;
  box-shadow: 0 10rpx 28rpx rgba(15, 23, 42, 0.04);
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

.back-to-top {
  position: fixed;
  right: 30rpx;
  bottom: 200rpx;
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #2563eb, #14b8a6);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(37, 99, 235, 0.35);
  z-index: 999;
  transition: opacity 0.3s ease, transform 0.3s ease;
  animation: fadeInScale 0.3s ease-out;

  &:active {
    transform: scale(0.92);
    opacity: 0.9;
  }
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.6);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
