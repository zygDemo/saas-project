<template>
  <layout :active-tab="1" nav-title="订单" show-tabbar tabbar-scope="carloan">
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

      <!-- 筛选区 -->
      <view class="filter-card">
        <!-- 业务节点 tabs -->
        <scroll-view scroll-x class="filter-scroll" :show-scrollbar="false">
          <view class="filter-tabs">
            <view
              v-for="(node, index) in businessNodeFilterList"
              :key="index"
              class="filter-tab"
              :class="{ 'filter-tab--on': currentBusinessNode === node.value }"
              @click="handleBusinessNodeChange(node.value)"
            >
              <text class="filter-tab__label">{{ node.label }}</text>
              <text v-if="node.count > 0" class="filter-tab__badge">{{
                node.count
              }}</text>
            </view>
          </view>
        </scroll-view>
        <!-- 节点状态 tabs -->
        <scroll-view
          scroll-x
          class="filter-scroll filter-scroll--sub"
          :show-scrollbar="false"
        >
          <view class="filter-tabs filter-tabs--sub">
            <view
              v-for="(status, index) in nodeStatusFilterList"
              :key="index"
              class="filter-tab filter-tab--sub"
              :class="{ 'filter-tab--on': currentNodeStatus === status.value }"
              @click="handleNodeStatusChange(status.value)"
            >
              <text class="filter-tab__label">{{ status.label }}</text>
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- 订单列表 -->
      <scroll-view
        scroll-y
        class="order-list-scroll"
        :scroll-top="scrollTopValue"
        :refresher-enabled="true"
        :refresher-triggered="isRefreshing"
        @refresherrefresh="onRefresh"
        @scroll="onScroll"
      >
        <view class="list__inner">
          <OrderCard
            v-for="order in orderList"
            :key="order.id"
            :order="order"
            :can-go-sign="canGoSign(order)"
            @detail="handleDetailButton"
            @sign="handleSignButton"
            @flow-record="handleFlowRecord"
          />
          <view v-if="loading && orderList.length > 0" class="load-more">
            <u-loading mode="circle" />
          </view>
          <view v-if="!hasMore && orderList.length > 0" class="no-more"
            >没有更多了</view
          >
          <view v-if="!loading && orderList.length === 0" class="empty-state">
            <u-empty mode="list" text="暂无订单数据" />
          </view>
          <view
            v-if="showBackToTop"
            class="back-to-top"
            @click="handleBackToTop"
          >
            <u-icon name="arrow-up" color="#fff" size="40" />
          </view>
        </view>
      </scroll-view>
    </view>
    <FlowRecordPopup
      v-model:visible="flowRecordVisible"
      :loading="flowRecordLoading"
      :records="flowRecordList"
      :get-node-label="getFlowNodeLabel"
    />
  </layout>
</template>

<script setup lang="ts">
import layout from "@/pages/layout/layout.vue";
import { computed, ref } from "vue";
import { onLoad, onReachBottom, onShow } from "@dcloudio/uni-app";
import { useCarloanApi } from "@/api/carloan";
import type {
  CreditListItem,
  LoanBusinessNode,
  PageResult,
} from "@/api/carloan";
import { APP_ROUTES, buildRoute } from "@/common/navigation";
import {
  buildSignRouteQuery,
  buildDetailRouteQuery,
} from "@/common/carloan-route-query";
import OrderCard from "./components/OrderCard.vue";
import FlowRecordPopup from "./components/FlowRecordPopup.vue";
import type {
  FilterOption,
  BusinessNodeFilterValue,
  NodeStatusFilterValue,
  OrderListViewItem,
} from "./types";

const businessApi = useCarloanApi();
const ORDER_FILTER_STORAGE_KEY = "WORKBENCH_ORDER_FILTER";
const ORDER_FILTER_MAX_AGE = 60 * 1000;

const keyword = ref("");
const lastKeyword = ref("");
const isRefreshing = ref(false);
const isFirstLoadDone = ref(false);
const showBackToTop = ref(false);
const scrollTopValue = ref(0);
const SCROLL_THRESHOLD = 500;

// 业务节点筛选项（从接口动态获取）
const ORDER_NODE_OPTIONS = ref<Array<Omit<FilterOption, "count">>>([]);

// 节点状态统一映射 — { 标签, CSS 类别 } 代替原来的 NODE_STATUS_OPTIONS + NODE_STATUS_CLASS
// cls: 1=通过 2=拒绝 3=待处理/警告 4=进行中
const NODE_STATUS_META: Record<string, { label: string; cls: string }> = {
  10: { label: "处理中", cls: "4" },
  20: { label: "已通过", cls: "1" },
  30: { label: "已拒绝", cls: "2" },
  40: { label: "已退回", cls: "2" },
  50: { label: "待补充", cls: "3" },
  90: { label: "已完成", cls: "1" },
};

// 订单状态码 → { 标签, CSS 类别 }
const STATUS_META: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: "草稿", cls: "3" },
  SUBMITTED: { label: "已提交", cls: "4" },
  PENDING_RISK_PRE: { label: "预审中", cls: "4" },
  RISK_PRE_PASSED: { label: "预审通过", cls: "1" },
  RISK_PRE_REJECTED: { label: "预审拒绝", cls: "2" },
  PENDING_FUNDER_PRE: { label: "预审中", cls: "4" },
  FUNDER_PRE_PASSED: { label: "预审通过", cls: "1" },
  FUNDER_PRE_REJECTED: { label: "预审拒绝", cls: "2" },
  PENDING_FIRST_REVIEW: { label: "审核中", cls: "4" },
  FIRST_REVIEW_PASSED: { label: "审核通过", cls: "1" },
  FIRST_REVIEW_REJECTED: { label: "审核拒绝", cls: "2" },
  PENDING_SUPPLEMENT: { label: "待补件", cls: "3" },
  PENDING_FINAL_REVIEW: { label: "审核中", cls: "4" },
  FINAL_REVIEW_PASSED: { label: "审核通过", cls: "1" },
  FINAL_REVIEW_REJECTED: { label: "审核拒绝", cls: "2" },
  PENDING_FUNDER_REVIEW: { label: "资方审核中", cls: "4" },
  FUNDER_REVIEW_PASSED: { label: "资方通过", cls: "1" },
  FUNDER_REVIEW_REJECTED: { label: "资方拒绝", cls: "2" },
  PENDING_SIGN: { label: "待签约", cls: "4" },
  SIGNING_PROGRESS: { label: "签约中", cls: "4" },
  SIGNED: { label: "已签约", cls: "1" },
  PENDING_LOAN_REQUEST: { label: "待请款", cls: "4" },
  LOAN_REQUEST_REVIEWING: { label: "请款中", cls: "4" },
  LOAN_REQUEST_APPROVED: { label: "请款通过", cls: "1" },
  LOAN_REQUEST_REJECTED: { label: "请款拒绝", cls: "2" },
  PENDING_DISBURSEMENT: { label: "待放款", cls: "4" },
  DISBURSED: { label: "已放款", cls: "1" },
  CANCELLED: { label: "已取消", cls: "2" },
};

const currentBusinessNode = ref<BusinessNodeFilterValue>("all");
const currentNodeStatus = ref<NodeStatusFilterValue>("all");

const orderList = ref<OrderListViewItem[]>([]);
const loading = ref(false);
const pageNum = ref(1);
const pageSize = 10;
const hasMore = ref(true);
const total = ref(0);

const businessNodeMap = computed(() =>
  ORDER_NODE_OPTIONS.value.reduce<Record<string, string>>((map, item) => {
    map[item.value] = item.label;
    return map;
  }, {}),
);
const businessNodeFilterList = computed<FilterOption[]>(() => [
  { label: "全部", value: "all" as const, count: 0 },
  ...ORDER_NODE_OPTIONS.value.map((item) => ({ ...item, count: 0 })),
]);
const nodeStatusFilterList = computed<FilterOption[]>(() => [
  { label: "全部状态", value: "all" as const, count: 0 },
  ...Object.entries(NODE_STATUS_META).map(([value, { label }]) => ({
    label,
    value,
    count: 0,
  })),
]);
const businessNodeCodeList = computed(() =>
  ORDER_NODE_OPTIONS.value.map((item) => item.value),
);

// ---- 通用工具函数 ----

/** 返回第一个非空字符串 */
function firstText(...values: unknown[]): string {
  for (const v of values) {
    if (v !== undefined && v !== null && String(v).trim() !== "")
      return String(v).trim();
  }
  return "";
}

/** 返回第一个非空值 */
function first<T>(...values: Array<T | undefined | null>): T | undefined {
  for (const v of values) {
    if (v === undefined || v === null) continue;
    // 过滤掉 boolean（false 通常不是预期的有效数据值）
    if (typeof v === "boolean") continue;
    const num = Number(v);
    if (Number.isNaN(num)) continue;
    if (typeof v === "string" && v.trim() === "") continue;
    return v;
  }
  return undefined;
}

/** 金额格式化（仅在 normalizeOrderItem 内使用） */
const formatMoney = (v: unknown): string => {
  if (v === undefined || v === null || String(v).trim() === "") return "";
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v);
  return n > 0 ? n.toFixed(2) : "";
};

/** 日期时间格式化（仅在 normalizeOrderItem 内使用） */
const formatDateTime = (v: unknown): string => {
  if (!v) return "";
  const text = String(v);
  const d = new Date(text);
  if (Number.isNaN(d.getTime())) return text;
  const pad = (num: number) => String(num).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// ---- 业务节点相关 ----

function getBusinessNodeLabel(node: unknown) {
  if (node === undefined || node === null || String(node) === "")
    return "未知节点";
  const code = String(node);
  if (code.startsWith("125"))
    return businessNodeMap.value["1300"] || "资方预审";
  const normalizedCode = code.length >= 3 ? `${code.slice(0, 2)}00` : code;
  return (
    businessNodeMap.value[code] || businessNodeMap.value[normalizedCode] || code
  );
}

function getFlowNodeLabel(key: unknown): string {
  return getBusinessNodeLabel(key);
}

// 节点 → 路由（大部分指向 applyDetail，只列出例外）
const NODE_ROUTE_OVERRIDE: Record<string, string> = {
  1400: APP_ROUTES.carloan.supplement.supplementDetail,
  1600: APP_ROUTES.carloan.supplement.supplementDetail,
  4100: APP_ROUTES.carloan.signing.signCenter,
  5100: APP_ROUTES.carloan.supplement.supplementDetail,
};

function normalizeNodeCode(node: unknown) {
  const code = String(node || "");
  if (!code) return "";
  if (NODE_ROUTE_OVERRIDE[code]) return code;
  if (code.startsWith("125")) return "1300";
  return code.length >= 3 ? `${code.slice(0, 2)}00` : code;
}

function getNodeRoute(nodeCode: string) {
  return (
    NODE_ROUTE_OVERRIDE[nodeCode] || APP_ROUTES.carloan.precheck.applyDetail
  );
}

function getNodeStatusLabel(status: unknown) {
  if (status === undefined || status === null || String(status) === "")
    return "";
  return NODE_STATUS_META[String(status)]?.label || String(status);
}

// ---- 订单筛选/路由 ----

function buildOrderQuery(order: OrderListViewItem) {
  const creditOrderId = firstText(
    order?.creditOrderId,
    order?.orderNo,
    order?.applicationNo,
    order?.id,
  );
  return buildDetailRouteQuery({
    id: firstText(order?.id),
    creditOrderId,
    uuid: firstText(order?.uuid),
    customerName: firstText(
      order?.name,
      order?.customerName,
      order?.personName,
    ),
    customerPhone: firstText(order?.phone, order?.telephone),
    nodeCode: normalizeNodeCode(
      order?.nodeCode ?? order?.currentNode ?? order?.businessNode,
    ),
  });
}

function isAfterPreAudit(node: unknown) {
  const code = String(node || "");
  if (!code) return false;
  const numericCode = Number(code);
  if (Number.isFinite(numericCode)) return numericCode >= 4100;
  const codeList = businessNodeCodeList.value;
  const preAuditIndex = codeList.indexOf("PRE_AUDIT");
  const currentIndex = codeList.indexOf(code);
  if (preAuditIndex >= 0 && currentIndex >= 0)
    return currentIndex > preAuditIndex;
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
  if (order.isSignContract === 1 || order.currentStatus === "SIGNED")
    return "SIGNED";
  const status = firstText(order.currentStatus, order.nodeStatus, order.status);
  if (status === "SIGNING_PROGRESS" || status === "PENDING_SIGN")
    return "CONFIRMING_AMOUNT";
  return status || "CONFIRMING_AMOUNT";
}

function canGoSign(order: OrderListViewItem) {
  if (order.isSignContract === 1) return true;
  const node = order?.nodeCode ?? order?.currentNode ?? order?.businessNode;
  const status = String(order.currentStatus || order.status || "");
  return (
    isAfterPreAudit(node) ||
    ["PENDING_SIGN", "SIGNING_PROGRESS", "SIGNED"].includes(status)
  );
}

function handleSignButton(order: OrderListViewItem) {
  const creditOrderId =
    order?.creditOrderId || order?.orderNo || order?.applicationNo || order?.id;
  if (!creditOrderId) {
    uni.showToast({ title: "缺少订单编号", icon: "none" });
    return;
  }
  const signRouteQuery = buildSignRouteQuery({
    creditOrderId: String(creditOrderId),
    uuid: firstText(order.uuid),
    customerName: order.name || "",
    customerPhone: order.phone || "",
    signStatus: resolveSignStatus(order),
  });
  uni.navigateTo({
    url: buildRoute(APP_ROUTES.carloan.signing.signCenter, signRouteQuery),
  });
}

function handleDetailButton(order: OrderListViewItem) {
  const nodeCode = normalizeNodeCode(
    order?.nodeCode ?? order?.currentNode ?? order?.businessNode,
  );
  const route = getNodeRoute(nodeCode);
  if (route === APP_ROUTES.carloan.signing.signCenter) {
    handleSignButton(order);
    return;
  }
  uni.navigateTo({ url: buildRoute(route, buildOrderQuery(order)) });
}

// ---- 数据标准化 ----

function resolveStatusClass(status: unknown, nodeStatus: unknown) {
  const statusText = String(status || "");
  if (["1", "2", "3", "4"].includes(statusText)) return statusText;
  if (STATUS_META[statusText]) return STATUS_META[statusText].cls;
  return NODE_STATUS_META[String(nodeStatus || "")]?.cls || "4";
}

function buildVehicleDisplay(order: CreditListItem) {
  return [order.vehicleBrand, order.vehicleModel]
    .map((item) => firstText(item))
    .filter(Boolean)
    .join(" ");
}

function normalizeOrderItem(order: CreditListItem): OrderListViewItem {
  const node = first(order.currentNode, order.nodeCode, order.businessNode);
  const nodeStatus = first(order.currentStatus, order.nodeStatus);
  const businessNode = firstText(node);
  return {
    ...order,
    // 确保 id 一定有值：优先 applicationId，其次 creditOrderId，最后 order.id
    id:
      (order.applicationId ||
        order.id ||
        (order.creditOrderId ? Number(order.creditOrderId) : undefined)) as
      number | undefined,
    name: firstText(
      order.name,
      order.customerName,
      order.personName,
      "未知客户",
    ),
    phone: firstText(order.phone, order.telephone, "-"),
    creditOrderId: firstText(
      order.creditOrderId,
      order.orderNo,
      order.applicationNo,
      order.id,
    ),
    businessNode,
    businessNodeLabel: firstText(
      order.currentNodeName,
      order.nodeName,
      getBusinessNodeLabel(businessNode),
    ),
    nodeStatusLabel: firstText(
      STATUS_META[order.status || ""]?.label,
      order.currentStatusName,
      order.nodeStatusName,
      getNodeStatusLabel(nodeStatus),
    ),
    statusClass: resolveStatusClass(order.status, nodeStatus),
    vehicleDisplay: buildVehicleDisplay(order),
    pushQuota: formatMoney(first(order.pushQuota, order.amount)),
    periods: first(order.periods, order.term, order.approvedTerm),
    createTime: firstText(
      order.createTime,
      formatDateTime(order.createdAt),
      formatDateTime(order.updatedAt),
    ),
  };
}

// ---- 列表请求 ----

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
  const numericTotal = Number(first(pageData.total, res?.total));
  return Number.isFinite(numericTotal) ? numericTotal : rowsLength;
}

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
    if (currentBusinessNode.value !== "all")
      params.nodeCode = Number(currentBusinessNode.value);
    if (currentNodeStatus.value !== "all")
      params.nodeStatus = Number(currentNodeStatus.value);
    const kw = keyword.value.trim();
    if (kw) params.keyword = kw;
    const res = await businessApi.getOrderList(params);
    if (res?.code === 200) {
      const rows = extractRows(res).map(normalizeOrderItem);
      orderList.value = isRefresh ? rows : [...orderList.value, ...rows];
      total.value = extractTotal(res, rows.length);
      hasMore.value = orderList.value.length < total.value;
      pageNum.value++;
    }
  } catch {
    console.error("获取订单列表失败");
  } finally {
    loading.value = false;
  }
}

// ---- 搜索/筛选 ----

function handleSearch() {
  if (keyword.value.trim() === lastKeyword.value.trim()) return;
  lastKeyword.value = keyword.value.trim();
  fetchList(true);
}

function handleBusinessNodeChange(node: BusinessNodeFilterValue) {
  if (currentBusinessNode.value === node) return;
  currentBusinessNode.value = node;
  fetchList(true);
}

function handleNodeStatusChange(status: NodeStatusFilterValue) {
  if (currentNodeStatus.value === status) return;
  currentNodeStatus.value = status;
  fetchList(true);
}

function applyWorkbenchFilter() {
  const filter = uni.getStorageSync(ORDER_FILTER_STORAGE_KEY) || {};
  const nodeCode = String(filter.nodeCode || "");
  const updatedAt = Number(filter.updatedAt || 0);
  if (
    nodeCode &&
    ORDER_NODE_OPTIONS.value.some((item) => item.value === nodeCode) &&
    Date.now() - updatedAt < ORDER_FILTER_MAX_AGE
  ) {
    currentBusinessNode.value = nodeCode;
    uni.removeStorageSync(ORDER_FILTER_STORAGE_KEY);
    fetchList(true);
    return true;
  }
  return false;
}

async function loadNodeOptions() {
  try {
    const res = await businessApi.getLoanBusinessNodes();
    const nodes = (res?.data || res || []) as LoanBusinessNode[];
    if (Array.isArray(nodes) && nodes.length > 0) {
      ORDER_NODE_OPTIONS.value = nodes.map((n) => ({
        label: n.name,
        value: n.code,
      }));
    }
  } catch {
    console.warn("获取业务节点失败");
  }
}

// ---- 生命周期 ----

onLoad(async () => {
  await loadNodeOptions();
  if (!applyWorkbenchFilter()) fetchList(true);
  isFirstLoadDone.value = true;
});

onShow(() => {
  // 首次加载完成后的每次 onShow 都刷新列表，确保从详情页返回后数据是最新的
  if (isFirstLoadDone.value) {
    fetchList(true);
  }
});
onReachBottom(() => {
  fetchList();
});

async function onRefresh() {
  isRefreshing.value = true;
  await fetchList(true);
  isRefreshing.value = false;
}

function onScroll(e: any) {
  showBackToTop.value = e.detail.scrollTop > SCROLL_THRESHOLD;
}

function handleBackToTop() {
  scrollTopValue.value = 0;
}

// ---- 流程记录弹窗 ----

const flowRecordVisible = ref(false);
const flowRecordLoading = ref(false);
const flowRecordList = ref<any[]>([]);

async function handleFlowRecord(order: OrderListViewItem) {
  flowRecordLoading.value = true;
  flowRecordList.value = [];
  try {
    const res = await businessApi.getLifecycle(String(order.id));
    if (res.code === 200 && Array.isArray(res.data)) {
      flowRecordList.value = res.data;
      flowRecordVisible.value = true;
    } else {
      throw new Error("接口返回异常");
    }
  } catch {
    uni.showToast({ title: "加载失败", icon: "none" });
  } finally {
    flowRecordLoading.value = false;
  }
}
</script>

<style lang="scss" scoped>
$bg-page: #f5f7fa;
$bg-surface: #ffffff;
$border-subtle: #ebedf2;
$text-main: #1a1d29;
$text-body: #4e5566;
$text-hint: #8b93a7;
$text-light: #b0b8cc;
$primary: #437cff;
$primary-light: #eef1ff;
$accent-red: #ff6b6b;
$ease-out: cubic-bezier(0.16, 1, 0.3, 1);

.order-list-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, var(--app-page-bg-soft, #f0f3ff) 0%, $bg-page 30%, #f8fafc 100%);
}

.order-list-scroll {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.list__inner {
  padding: 24rpx 24rpx calc(32rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
  width: 100%;
}

/* ===== 搜索栏 ===== */
.search-bar {
  padding: 18rpx 24rpx 12rpx;
  background: transparent;

  :deep(.u-search) {
    box-shadow: 0 4rpx 18rpx rgba(26, 29, 41, 0.04);
    border-radius: 18rpx;
  }
}

/* ===== 筛选区 ===== */
.filter-card {
  margin: 0 24rpx 20rpx;
  padding: 0;
  background: $bg-surface;
  border: 1rpx solid var(--app-border, #e8edf5);
  border-radius: 22rpx;
  box-shadow: var(--app-shadow-card, 0 4rpx 20rpx rgba(26, 29, 41, 0.05));
  overflow: hidden;
}

.filter-scroll {
  white-space: nowrap;

  &--sub {
    border-top: 1rpx solid rgba($border-subtle, 0.6);
  }
}

.filter-tabs {
  display: inline-flex;
  padding: 18rpx 20rpx;
  gap: 10rpx;

  &--sub {
    padding: 14rpx 20rpx 16rpx;
  }
}

.filter-tab {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6rpx;
  height: 56rpx;
  padding: 0 22rpx;
  border-radius: 16rpx;
  background: #f6f8fb;
  border: 1rpx solid transparent;
  transition: all 0.2s $ease-out;

  &__label {
    font-size: 26rpx;
    font-weight: 500;
    color: $text-body;
    white-space: nowrap;
  }

  &__badge {
    min-width: 28rpx;
    height: 28rpx;
    padding: 0 8rpx;
    border-radius: 14rpx;
    background: rgba($primary, 0.15);
    font-size: 20rpx;
    font-weight: 600;
    color: $primary;
    text-align: center;
    line-height: 28rpx;
  }

  &--on {
    background: #eef3ff;
    border-color: rgba($primary, 0.16);

    .filter-tab__label {
      color: $primary;
      font-weight: 700;
    }
    .filter-tab__badge {
      background: rgba($primary, 0.14);
      color: $primary;
    }
  }

  &--sub {
    height: 48rpx;
    padding: 0 20rpx;

    .filter-tab__label {
      font-size: 24rpx;
    }
  }

  &:active {
    transform: scale(0.95);
  }
}

/* ===== 空状态 / 加载 ===== */
.empty-state {
  margin: 40rpx 0;
  padding: 100rpx 40rpx;
  background: $bg-surface;
  border: 1rpx solid var(--app-border, #e8edf5);
  border-radius: 22rpx;
  box-shadow: var(--app-shadow-card, 0 4rpx 20rpx rgba(26, 29, 41, 0.05));

  :deep(.u-empty__text) {
    color: $text-hint !important;
    font-size: 26rpx !important;
  }
}

.load-more {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40rpx 0;
}

.no-more {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40rpx 0;
  font-size: 24rpx;
  color: $text-light;
  font-weight: 500;
}

.back-to-top {
  position: fixed;
  right: 30rpx;
  bottom: 200rpx;
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #4f7cff, #6366f1);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(67, 124, 255, 0.35);
  z-index: 999;

  &:active {
    transform: scale(0.92);
    opacity: 0.9;
  }
}
</style>
