<template>
  <layout :active-tab="0" nav-title="订单" show-tabbar tabbar-scope="carloan">
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
        <view class="filter-card__header">
          <view>
            <text class="filter-card__title">筛选订单</text>
            <text class="filter-card__desc">{{ activeFilterLabel }}</text>
          </view>
          <view class="filter-card__chip">
            <text>{{ loading ? "加载中" : "实时" }}</text>
          </view>
        </view>
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
          <view v-if="!hasMore && orderList.length > 0" class="no-more">
            没有更多了
          </view>
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
      :get-node-label="getBusinessNodeLabel"
    />
  </layout>
</template>

<script setup lang="ts">
import layout from "@/components/layout/layout.vue";
import { computed, ref } from "vue";
import { onLoad, onReachBottom, onShow } from "@dcloudio/uni-app";
import { useCarloanApi } from "@/api/carloan";
import type {
  CreditListItem,
  LoanBusinessNode,
  FlowRecordItem,
} from "@/api/carloan";
import { APP_ROUTES, buildRoute } from "@/common/navigation";
import {
  buildSignRouteQuery,
  buildDetailRouteQuery,
} from "@/common/carloan-route-query";
import { businessNodeText } from "@/common/carloan/applyDetail-flow";
import OrderCard from "@/components/carloan/OrderCard.vue";
import FlowRecordPopup from "@/components/carloan/FlowRecordPopup.vue";
import type {
  FilterOption,
  BusinessNodeFilterValue,
  NodeStatusFilterValue,
  OrderListViewItem,
} from "@/common/carloan/types";

const businessApi = useCarloanApi();
const ORDER_FILTER_STORAGE_KEY = "WORKBENCH_ORDER_FILTER";
const ORDER_FILTER_MAX_AGE = 60 * 1000;

// 筛选值到业务节点代码的映射
const businessNodeFilterMap: Record<string, (string | number)[]> = {
  precheck: [1100, 1200, 1250, "INITIAL_AUDIT", "PRE_AUDIT", "FUNDER_PRE"],
  supplement: [1300, 1350, "SUPPLEMENT_MATERIALS"],
  signing: [1600, 1610, 1660, "SIGN_CONTRACT", "PENDING_SIGN", "SIGNING_PROGRESS"],
  disbursement: [1700, 1800, 1900, "LOAN_REQUEST", "LOAN_DISBURSEMENT", "DISBURSEMENT", "POST_LOAN"],
};

// 有效的筛选值集合
const VALID_NODE_FILTERS = new Set<string>(["all", "precheck", "supplement", "signing", "disbursement"]);

const keyword = ref("");
const lastKeyword = ref("");
const isRefreshing = ref(false);
const isFirstLoadDone = ref(false);
const showBackToTop = ref(false);
const scrollTopValue = ref(0);
const SCROLL_THRESHOLD = 500;

// 业务节点筛选项（从接口动态获取）
const ORDER_NODE_OPTIONS = ref<Array<Omit<FilterOption, "count">>>([]);

// 节点状态映射: cls 1=通过 2=拒绝 3=待处理 4=进行中
const NODE_STATUS_META: Record<string, { label: string; cls: string }> = {
  10: { label: "处理中", cls: "4" },
  20: { label: "已通过", cls: "1" },
  30: { label: "已拒绝", cls: "2" },
  40: { label: "已退回", cls: "2" },
  50: { label: "待补充", cls: "3" },
  90: { label: "已完成", cls: "1" },
};

// 订单状态码 -> { 标签, CSS 类别 }
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

// ---- 计算属性 ----

const businessNodeMap = computed(() =>
  Object.fromEntries(ORDER_NODE_OPTIONS.value.map((item) => [item.value, item.label])),
);

const businessNodeFilterList = computed<FilterOption[]>(() => [
  { label: "全部", value: "all", count: 0 },
  { label: "预审", value: "precheck", count: 0 },
  { label: "补件", value: "supplement", count: 0 },
  { label: "签约", value: "signing", count: 0 },
  { label: "放款", value: "disbursement", count: 0 },
]);

const nodeStatusFilterList = computed<FilterOption[]>(() => [
  { label: "全部状态", value: "all", count: 0 },
  ...Object.entries(NODE_STATUS_META).map(([value, { label }]) => ({
    label,
    value,
    count: 0,
  })),
]);

const activeFilterLabel = computed(() => {
  const nodeLabel =
    businessNodeFilterList.value.find(
      (item) => item.value === currentBusinessNode.value,
    )?.label || "全部";
  const statusLabel =
    nodeStatusFilterList.value.find(
      (item) => item.value === currentNodeStatus.value,
    )?.label || "全部状态";
  return `${nodeLabel} · ${statusLabel}`;
});

// ---- 通用工具函数 ----

/** 返回第一个非空字符串 */
function firstText(...values: unknown[]): string {
  for (const v of values) {
    if (v !== undefined && v !== null && String(v).trim() !== "")
      return String(v).trim();
  }
  return "";
}

/** 返回第一个有效值（排除 null/undefined/空串/NaN/boolean） */
function first<T>(...values: Array<T | undefined | null>): T | undefined {
  for (const v of values) {
    if (v == null || typeof v === "boolean") continue;
    if (typeof v === "string" && v.trim() === "") continue;
    if (typeof v === "number" && Number.isNaN(v)) continue;
    return v;
  }
  return undefined;
}

/** 金额格式化 */
function formatMoney(v: unknown): string {
  if (v == null || String(v).trim() === "") return "";
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n.toFixed(2) : "";
}

/** 日期时间格式化 */
function formatDateTime(v: unknown): string {
  if (!v) return "";
  const d = new Date(String(v));
  if (Number.isNaN(d.getTime())) return String(v);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ---- 业务节点相关 ----

/** 获取业务节点标签 */
function getBusinessNodeLabel(node: unknown): string {
  if (node == null || String(node) === "") return "未知节点";
  const code = String(node);
  return (
    businessNodeMap.value[code] ||
    (code.startsWith("125") ? "资方预审" : "") ||
    businessNodeText(code) ||
    code
  );
}

/** 标准化节点代码（用于路由跳转） */
function normalizeNodeCode(node: unknown): string {
  const code = String(node || "");
  if (!code) return "";
  if (code.startsWith("125")) return "1250";
  return code.length >= 3 ? `${code.slice(0, 2)}00` : code;
}

/** 获取节点状态标签 */
function getNodeStatusLabel(status: unknown): string {
  if (status == null || String(status) === "") return "";
  return NODE_STATUS_META[String(status)]?.label || String(status);
}

/** 解析状态 CSS 类别 */
function resolveStatusClass(status: unknown, nodeStatus: unknown): string {
  const s = String(status || "");
  if (["1", "2", "3", "4"].includes(s)) return s;
  return STATUS_META[s]?.cls || NODE_STATUS_META[String(nodeStatus || "")]?.cls || "4";
}

// ---- 订单路由判断 ----

/** 判断是否在预审之后 */
function isAfterPreAudit(node: unknown): boolean {
  const code = String(node || "");
  if (!code) return false;
  const numericCode = Number(code);
  return Number.isFinite(numericCode) ? numericCode >= 4100 : false;
}

/** 解析签约状态 */
function resolveSignStatus(order: OrderListViewItem): string {
  if (order.isSignContract === 1 || order.currentStatus === "SIGNED")
    return "SIGNED";
  const status = firstText(order.currentStatus, order.nodeStatus, order.status);
  return ["SIGNING_PROGRESS", "PENDING_SIGN"].includes(status)
    ? "CONFIRMING_AMOUNT"
    : status || "CONFIRMING_AMOUNT";
}

/** 判断是否可以签约 */
function canGoSign(order: OrderListViewItem): boolean {
  if (order.isSignContract === 1) return true;
  const node = order?.nodeCode ?? order?.currentNode ?? order?.businessNode;
  const status = String(order.currentStatus || order.status || "");
  return (
    isAfterPreAudit(node) ||
    ["PENDING_SIGN", "SIGNING_PROGRESS", "SIGNED"].includes(status)
  );
}

// ---- 订单跳转 ----

function handleSignButton(order: OrderListViewItem) {
  const creditOrderId =
    order?.creditOrderId || order?.orderNo || order?.applicationNo || order?.id;
  if (!creditOrderId) {
    uni.showToast({ title: "缺少订单编号", icon: "none" });
    return;
  }
  uni.navigateTo({
    url: buildRoute(
      APP_ROUTES.carloan.signing.signCenter,
      buildSignRouteQuery({
        creditOrderId: String(creditOrderId),
        uuid: firstText(order.uuid),
        customerName: order.name || "",
        customerPhone: order.phone || "",
        signStatus: resolveSignStatus(order),
      }),
    ),
  });
}

function handleDetailButton(order: OrderListViewItem) {
  const creditOrderId = firstText(
    order?.creditOrderId,
    order?.orderNo,
    order?.applicationNo,
    order?.id,
  );
  uni.navigateTo({
    url: buildRoute(
      APP_ROUTES.carloan.precheck.applyDetail,
      buildDetailRouteQuery({
        id: firstText(order?.id),
        creditOrderId,
        uuid: firstText(order?.uuid),
        customerName: firstText(order?.name, order?.customerName, order?.personName),
        customerPhone: firstText(order?.phone, order?.telephone),
        nodeCode: normalizeNodeCode(
          order?.nodeCode ?? order?.currentNode ?? order?.businessNode,
        ),
      }),
    ),
  });
}

// ---- 数据标准化 ----

function normalizeOrderItem(order: CreditListItem): OrderListViewItem {
  const node = first(order.currentNode, order.nodeCode, order.businessNode);
  const nodeStatus = first(order.currentStatus, order.nodeStatus);
  const businessNode = firstText(node);
  return {
    ...order,
    id: (order.applicationId ||
      order.id ||
      (order.creditOrderId ? Number(order.creditOrderId) : undefined)) as
      number | undefined,
    name: firstText(order.name, order.customerName, order.personName, "未知客户"),
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
    vehicleDisplay: [order.vehicleBrand, order.vehicleModel]
      .map((item) => firstText(item))
      .filter(Boolean)
      .join(" "),
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

/** 从接口响应中提取列表数据 */
function extractRows(res: unknown): CreditListItem[] {
  const data = (res as Record<string, unknown>)?.data as
    | Record<string, unknown>
    | undefined;
  if (!data) return [];
  return (
    (data.list as CreditListItem[]) ||
    (data.records as CreditListItem[]) ||
    (data.rows as CreditListItem[]) ||
    (Array.isArray(data) ? (data as CreditListItem[]) : [])
  );
}

/** 从接口响应中提取总数 */
function extractTotal(res: unknown, fallback: number): number {
  const data = (res as Record<string, unknown>)?.data as
    | Record<string, unknown>
    | undefined;
  if (!data) return fallback;
  return Number(data.total ?? data.totalCount ?? data.count) || fallback;
}

/** 拉取订单列表 */
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
      const nodeCodes = businessNodeFilterMap[currentBusinessNode.value];
      if (nodeCodes && nodeCodes.length > 0) {
        params.businessNode = nodeCodes;
      }
    }
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

/** 拉取业务节点枚举 */
async function fetchBusinessNodes() {
  try {
    const res = await businessApi.getLoanBusinessNodes();
    if (res?.code === 200 && Array.isArray(res.data)) {
      ORDER_NODE_OPTIONS.value = (res.data as LoanBusinessNode[]).map((item) => ({
        value: item.code,
        label: item.name || item.description || item.code,
      }));
    }
  } catch {
    // 静默失败
  }
}

/** 应用工作台传来的筛选条件 */
function applyWorkbenchFilter(): boolean {
  const filter = uni.getStorageSync(ORDER_FILTER_STORAGE_KEY) || {};
  const nodeCode = String(filter.nodeCode || "");
  const updatedAt = Number(filter.updatedAt || 0);
  if (
    nodeCode &&
    VALID_NODE_FILTERS.has(nodeCode) &&
    Date.now() - updatedAt < ORDER_FILTER_MAX_AGE
  ) {
    currentBusinessNode.value = nodeCode as BusinessNodeFilterValue;
    uni.removeStorageSync(ORDER_FILTER_STORAGE_KEY);
    fetchList(true);
    return true;
  }
  return false;
}

// ---- 事件处理 ----

function handleSearch() {
  const kw = keyword.value.trim();
  if (kw === lastKeyword.value) return;
  lastKeyword.value = kw;
  fetchList(true);
}

function handleBusinessNodeChange(value: string) {
  if (currentBusinessNode.value === value) return;
  currentBusinessNode.value = value as BusinessNodeFilterValue;
  fetchList(true);
}

function handleNodeStatusChange(value: string) {
  if (currentNodeStatus.value === value) return;
  currentNodeStatus.value = value as NodeStatusFilterValue;
  fetchList(true);
}

function onRefresh() {
  isRefreshing.value = true;
  fetchList(true).finally(() => {
    isRefreshing.value = false;
  });
}

function onScroll(e: { detail: { scrollTop: number } }) {
  const top = e.detail.scrollTop || 0;
  showBackToTop.value = top > SCROLL_THRESHOLD;
}

function handleBackToTop() {
  scrollTopValue.value = scrollTopValue.value === 0 ? 1 : 0;
}

// ---- 流程记录弹窗 ----

const flowRecordVisible = ref(false);
const flowRecordLoading = ref(false);
const flowRecordList = ref<FlowRecordItem[]>([]);

async function handleFlowRecord(order: OrderListViewItem) {
  flowRecordVisible.value = true;
  flowRecordLoading.value = true;
  flowRecordList.value = [];
  try {
    const orderId = order.id || order.creditOrderId;
    if (!orderId) return;
    const res = await businessApi.getLifecycle(orderId);
    if (res?.code === 200 && Array.isArray(res.data)) {
      flowRecordList.value = res.data as FlowRecordItem[];
    }
  } catch {
    console.error("获取流程记录失败");
  } finally {
    flowRecordLoading.value = false;
  }
}

// ---- 生命周期 ----

onLoad(() => {
  fetchBusinessNodes();
  if (!applyWorkbenchFilter()) {
    fetchList(true);
  }
});

onShow(() => {
  if (isFirstLoadDone.value) {
    applyWorkbenchFilter();
  }
  isFirstLoadDone.value = true;
});

onReachBottom(() => {
  fetchList(false);
});
</script>

<style lang="scss" scoped>
.order-list-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #f5f6fa;
}

.search-bar {
  padding: 16rpx 24rpx;
  background: #fff;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.filter-card {
  margin: 16rpx 24rpx 0;
  padding: 24rpx;
  background: #fff;
  border-radius: 20rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20rpx;
  }

  &__title {
    font-size: 30rpx;
    font-weight: 600;
    color: #1a1a1a;
  }

  &__desc {
    margin-left: 16rpx;
    font-size: 24rpx;
    color: #999;
  }

  &__chip {
    padding: 6rpx 20rpx;
    font-size: 22rpx;
    color: #4c7bfd;
    background: rgba(76, 123, 253, 0.1);
    border-radius: 20rpx;
  }
}

.filter-scroll {
  white-space: nowrap;

  &--sub {
    margin-top: 16rpx;
  }
}

.filter-tabs {
  display: inline-flex;
  gap: 16rpx;

  &--sub {
    gap: 12rpx;
  }
}

.filter-tab {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 8rpx;
  padding: 12rpx 28rpx;
  font-size: 26rpx;
  color: #666;
  background: #f5f6fa;
  border-radius: 32rpx;
  transition: all 0.2s;

  &--sub {
    padding: 8rpx 20rpx;
    font-size: 24rpx;
  }

  &--on {
    color: #fff;
    background: #4c7bfd;
  }

  &__badge {
    min-width: 32rpx;
    padding: 2rpx 8rpx;
    font-size: 20rpx;
    color: #fff;
    text-align: center;
    background: rgba(255, 255, 255, 0.25);
    border-radius: 16rpx;
  }
}

.order-list-scroll {
  flex: 1;
  height: 0;
}

.list__inner {
  padding: 24rpx;
}

.load-more,
.no-more {
  padding: 32rpx 0;
  font-size: 24rpx;
  color: #bbb;
  text-align: center;
}

.empty-state {
  padding: 120rpx 0;
}

.back-to-top {
  position: fixed;
  right: 32rpx;
  bottom: 160rpx;
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(76, 123, 253, 0.9);
  border-radius: 50%;
  box-shadow: 0 4rpx 16rpx rgba(76, 123, 253, 0.4);
}
</style>
