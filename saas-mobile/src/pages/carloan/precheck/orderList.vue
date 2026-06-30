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
                role="button"
                tabindex="0"
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
                role="button"
                tabindex="0"
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
            :style="{ animationDelay: `${index * 0.05}s` }"
            @click="handleDetailButton(order)"
          >
            <view class="order-main">
              <!-- 头部：姓名 + 金额 -->
              <view class="order-header">
                <view class="order-header__left">
                  <text class="customer-name">{{ order.name }}</text>
                  <view v-if="order.nodeStatusLabel" class="status-tag">
                    <view class="status-tag__dot" />
                    <text class="status-tag__text">{{
                      order.nodeStatusLabel
                    }}</text>
                  </view>
                </view>
                <text v-if="order.pushQuota" class="amount-value">
                  ¥{{ order.pushQuota }}
                </text>
              </view>
              <!-- 手机号 + 业务节点 -->
              <view class="order-subheader">
                <text class="customer-phone">{{ order.phone }}</text>
                <text v-if="order.businessNodeLabel" class="business-node">{{
                  order.businessNodeLabel
                }}</text>
              </view>
              <!-- 车牌 + 产品 -->
              <view
                v-if="
                  order.plateNumber || order.productName || order.vehicleDisplay
                "
                class="order-meta"
              >
                <text v-if="order.plateNumber" class="plate-number">{{
                  order.plateNumber
                }}</text>

                <text v-if="order.productName" class="product-text">{{
                  order.productName
                }}</text>

                <text
                  v-if="!order.plateNumber && order.vehicleDisplay"
                  class="vehicle-text"
                >
                  {{ order.vehicleDisplay }}
                </text>
              </view>
              <!-- 订单操作 -->
              <view class="order-footer">
                <view class="order-tags">
                  <u-tag
                    v-for="tag in getOrderTags(order)"
                    :key="tag.text"
                    :text="tag.text"
                    size="mini"
                    :type="tag.type"
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
                  <u-button
                    size="mini"
                    type="info"
                    @click.stop="handleFlowRecord(order)"
                  >
                    流程
                  </u-button>
                </view>
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
          role="button"
          tabindex="0"
          @click="handleBackToTop"
        >
          <u-icon name="arrow-up" color="#fff" size="40" />
        </view>
      </scroll-view>
    </view>
    <!-- 流程记录弹窗 -->
    <u-popup
      v-model="flowRecordVisible"
      mode="bottom"
      :round="16"
      :closeable="true"
    >
      <view class="flow-record-popup">
        <view class="flow-record-header">
          <view class="flow-record-header__bar" />
          <text class="flow-record-title">流程记录</text>
          <text
            v-if="flowRecordList.length > 0"
            class="flow-record-header__count"
          >
            {{ flowRecordList.length }} 条记录
          </text>
        </view>
        <view v-if="flowRecordLoading" class="flow-record-loading">
          <u-loading mode="circle" />
          <text class="flow-record-loading__text">加载中...</text>
        </view>
        <view v-else-if="flowRecordList.length === 0" class="flow-record-empty">
          <u-empty mode="list" text="暂无流程记录" />
        </view>
        <view v-else class="flow-record-container">
          <view
            v-for="(item, idx) in flowRecordList"
            :key="idx"
            class="flow-record-item"
            :class="{
              'flow-record-item--first': idx === 0,
              'flow-record-item--last': idx === flowRecordList.length - 1,
            }"
          >
            <view class="flow-record__timeline">
              <view class="flow-record__line flow-record__line--before" />
              <view class="flow-record__dot" :class="dotClass(item)" />
              <view class="flow-record__line flow-record__line--after" />
            </view>
            <view class="flow-record__content">
              <view class="flow-record__header">
                <text class="flow-record__node">{{
                  getFlowNodeLabel(item.currentNode)
                }}</text>
                <text class="flow-record__status" :class="statusClass(item)">
                  {{ item.approvalStatus }}
                </text>
              </view>
              <view
                v-if="item.approveName || item.approvalTime"
                class="flow-record__meta"
              >
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
import { http } from "uview-pro";

const businessApi = useCarloanApi();
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

// 业务节点筛选项（从接口动态获取）
const ORDER_NODE_OPTIONS = ref<Array<Omit<FilterOption, "count">>>([]);
const NODE_STATUS_OPTIONS: Array<Omit<FilterOption, "count">> = [
  { label: "待处理", value: "10" },
  { label: "已通过", value: "20" },
  { label: "已拒绝", value: "30" },
  { label: "待补充", value: "50" },
  { label: "已完成", value: "90" },
];

// 状态码 → { 标签, 样式类别 }
// 类别: 1=通过 2=拒绝 3=待处理/警告 4=进行中
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
  ORDER_NODE_OPTIONS.value.reduce<Record<string, string>>((map, item) => {
    map[item.value] = item.label;
    return map;
  }, {}),
);

const businessNodeFilterList = computed<FilterOption[]>(() => [
  { label: "全部", value: "all" as const, count: 0 },
  ...ORDER_NODE_OPTIONS.value.map((item) => ({
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
  // 兼容 web 端子节点编码：1250 属于资方预审（1300）节点组
  if (code.startsWith("125")) {
    return businessNodeMap.value["1300"] || "资方预审";
  }
  // 按节点段归一化：1200/1299 都属于 1200 节点组
  const normalizedCode = code.length >= 3 ? `${code.slice(0, 2)}00` : code;
  return (
    businessNodeMap.value[code] || businessNodeMap.value[normalizedCode] || code
  );
}

// 节点 → 路由（大部分指向 applyDetail，只列出例外）
const NODE_ROUTE_OVERRIDE: Record<string, string> = {
  "1400": APP_ROUTES.carloan.supplement.supplementDetail,
  "1600": APP_ROUTES.carloan.supplement.supplementDetail,
  "4100": APP_ROUTES.carloan.signing.signCenter,
  "5100": APP_ROUTES.carloan.supplement.supplementDetail,
  "6100": APP_ROUTES.carloan.supplement.supplementDetail,
};

function normalizeNodeCode(node: unknown) {
  const code = String(node || "");
  if (!code) return "";
  if (NODE_ROUTE_OVERRIDE[code]) return code;
  // 兼容 1250 → 1300
  if (code.startsWith("125")) return "1300";
  // 按节点段归一化
  const stageCode = code.length >= 3 ? `${code.slice(0, 2)}00` : code;
  return stageCode;
}

function getNodeRoute(nodeCode: string) {
  return (
    NODE_ROUTE_OVERRIDE[nodeCode] || APP_ROUTES.carloan.precheck.applyDetail
  );
}

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

function getNodeStatusLabel(status: unknown) {
  if (status === undefined || status === null || String(status) === "") {
    return "";
  }
  const code = String(status);
  const option = NODE_STATUS_OPTIONS.find((item) => item.value === code);
  return option?.label || code;
}

const businessNodeCodeList = computed(() =>
  ORDER_NODE_OPTIONS.value.map((item) => item.value),
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
  if (order.isSignContract === 1 || order.currentStatus === "SIGNED")
    return "SIGNED";

  const status = firstText(order.currentStatus, order.nodeStatus, order.status);

  if (status === "SIGNING_PROGRESS" || status === "PENDING_SIGN")
    return "CONFIRMING_AMOUNT";

  return status || "CONFIRMING_AMOUNT";
}

function canGoSign(order: OrderListViewItem) {
  const node = order?.nodeCode ?? order?.currentNode ?? order?.businessNode;

  if (order.isSignContract === 1) return true;

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
  const detailRouteQuery = buildOrderQuery(order);

  if (route === APP_ROUTES.carloan.signing.signCenter) {
    handleSignButton(order);

    return;
  }

  uni.navigateTo({
    url: buildRoute(route, detailRouteQuery),
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

function getOrderTags(order: OrderListViewItem) {
  const tags: Array<{ text: string; type: "primary" | "success" | "error" }> =
    [];

  if (order.phaseName) tags.push({ text: order.phaseName, type: "primary" });

  if (order.isSignContract === 1)
    tags.push({ text: "已签约", type: "success" });

  if (order.isFaceRecognition === 2)
    tags.push({ text: "已认证", type: "success" });

  if (order.isFaceRecognition === 3)
    tags.push({ text: "认证失败", type: "error" });

  return tags;
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

  if (STATUS_META[statusText]) {
    return STATUS_META[statusText].cls;
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
  const node = firstValue(
    order.currentNode,

    order.nodeCode,

    order.businessNode,
  );

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

    name: firstText(
      order.name,

      order.customerName,

      order.personName,

      "未知客户",
    ),

    phone: firstText(order.phone, order.telephone, "-"),

    creditOrderId,

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

/** 从接口加载业务节点筛选项 */
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
  } catch (e) {
    console.warn("获取业务节点失败:", e);
  }
}

// 初始加载

onLoad(async () => {
  await loadNodeOptions();
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

const flowRecordVisible = ref(false);

const flowRecordLoading = ref(false);

const flowRecordList = ref<any[]>([]);

async function handleFlowRecord(order: OrderListViewItem) {
  flowRecordLoading.value = true;

  flowRecordList.value = [];

  try {
    const res: any = await http.get(`/application/lifecycle/${order.id}`);

    if (res.code === 200 && Array.isArray(res.data)) {
      flowRecordList.value = res.data;
    }
  } catch (e) {
    uni.showToast({ title: "加载失败", icon: "none" });
  } finally {
    flowRecordLoading.value = false;

    flowRecordVisible.value = true;
  }
}

function dotClass(item: any) {
  if (item.approvalStatus === "待处理") return "dot-pending";

  if (item.approvalStatus.includes("通过") || item.approvalStatus === "完成")
    return "dot-pass";

  if (item.approvalStatus.includes("拒绝")) return "dot-reject";

  return "dot-default";
}

// 流程记录中的节点标签直接复用 businessNodeMap + getBusinessNodeLabel
function getFlowNodeLabel(key: unknown): string {
  return getBusinessNodeLabel(key);
}

function statusClass(item: any) {
  if (item.approvalStatus === "待处理") return "status-pending";

  if (item.approvalStatus.includes("通过") || item.approvalStatus === "完成")
    return "status-pass";

  if (item.approvalStatus.includes("拒绝")) return "status-reject";

  return "status-default";
}
</script>

<style lang="scss" scoped>
/* ===== 变量系统 ===== */

$bg-page: #f2f4f7;

$bg-surface: #ffffff;

$border-subtle: #ebedf2;

$text-main: #1a1d29;

$text-body: #4e5566;

$text-hint: #8b93a7;

$text-light: #b0b8cc;

$primary: #4f7cff;

$primary-light: #eef1ff;

$accent-green: #3dd598;

$accent-red: #ff6b6b;

$accent-orange: #ff9f43;

$accent-blue: #4f7cff;

/* 缓动函数 */

$ease-out: cubic-bezier(0.16, 1, 0.3, 1);

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
  padding: 20rpx 24rpx 16rpx;

  background: $bg-page;
}

/* ===== 筛选区 ===== */

.filter-card {
  margin: 0 24rpx 20rpx;

  padding: 16rpx 0 14rpx;

  background: $bg-surface;

  border-radius: 20rpx;

  box-shadow: 0 1rpx 4rpx rgba(26, 29, 41, 0.04);
}

.filter-title-row {
  display: flex;

  align-items: center;

  justify-content: space-between;

  padding: 0 24rpx 10rpx;
}

.filter-title {
  position: relative;

  padding-left: 16rpx;

  font-size: 28rpx;

  font-weight: 700;

  color: $text-main;

  &::before {
    content: "";

    position: absolute;

    top: 50%;

    left: 0;

    width: 4rpx;

    height: 24rpx;

    background: $primary;

    border-radius: 999rpx;

    transform: translateY(-50%);
  }
}

.filter-subtitle {
  font-size: 22rpx;

  color: $text-light;
}

.filter-bar--status {
  margin-top: 6rpx;

  padding-top: 10rpx;

  border-top: 1rpx dashed rgba($border-subtle, 0.8);
}

.filter-scroll {
  white-space: nowrap;
}

.filter-list {
  display: inline-flex;

  gap: 10rpx;

  padding: 6rpx 24rpx;
}

.filter-item {
  position: relative;

  height: 52rpx;

  padding: 0 22rpx;

  border: 1rpx solid $border-subtle;

  border-radius: 999rpx;

  background: #f7f8fc;

  box-sizing: border-box;

  font-size: 24rpx;

  font-weight: 500;

  line-height: 50rpx;

  color: $text-body;

  white-space: nowrap;

  transition: all 0.2s $ease-out;

  &--active {
    background: $primary;

    border-color: $primary;

    color: #fff;

    box-shadow: 0 2rpx 10rpx rgba(79, 124, 255, 0.3);

    font-weight: 600;
  }

  &:active {
    transform: scale(0.95);
  }
}

.filter-item--status {
  height: 44rpx;

  padding: 0 18rpx;

  font-size: 22rpx;

  line-height: 42rpx;
}

.filter-badge {
  position: absolute;

  top: -6rpx;

  right: -6rpx;

  min-width: 28rpx;

  height: 28rpx;

  padding: 0 6rpx;

  background: $accent-red;

  border-radius: 14rpx;

  font-size: 19rpx;

  font-weight: 600;

  color: #fff;

  text-align: center;

  line-height: 28rpx;
}

/* ===== 列表 ===== */

.order-list {
  padding: 0 24rpx calc(24rpx + env(safe-area-inset-bottom));
}

@keyframes slideUp {
  from {
    opacity: 0;

    transform: translateY(20rpx);
  }

  to {
    opacity: 1;

    transform: translateY(0);
  }
}

.order-card {
  margin-bottom: 16rpx;

  background: $bg-surface;

  border-radius: 20rpx;

  box-shadow: 0 1rpx 6rpx rgba(26, 29, 41, 0.04);

  transition: all 0.2s $ease-out;

  animation: slideUp 0.35s $ease-out both;

  &:active {
    transform: scale(0.985);

    box-shadow: 0 2rpx 12rpx rgba(79, 124, 255, 0.1);
  }
}

.order-main {
  padding: 24rpx;
}

/* 头部：姓名 + 金额 */

.order-header {
  display: flex;

  align-items: flex-start;

  justify-content: space-between;

  gap: 16rpx;
}

.order-header__left {
  display: flex;

  flex-direction: column;

  gap: 8rpx;

  min-width: 0;
}

.customer-name {
  font-size: 32rpx;

  font-weight: 700;

  color: $text-main;
}

.status-tag {
  display: inline-flex;

  align-items: center;

  gap: 8rpx;

  align-self: flex-start;
}

.status-tag__dot {
  width: 10rpx;

  height: 10rpx;

  border-radius: 50%;

  flex-shrink: 0;
}

.status-tag__text {
  font-size: 22rpx;

  font-weight: 500;

  color: $text-hint;
}

.amount-value {
  color: #e8453c;

  font-weight: 700;

  font-size: 32rpx;

  flex-shrink: 0;

  letter-spacing: -0.5rpx;
}

/* 状态色映射（圆点） */

.order-card.status-1 .status-tag__dot {
  background: $accent-green;
}

.order-card.status-2 .status-tag__dot {
  background: $accent-red;
}

.order-card.status-3 .status-tag__dot {
  background: $accent-orange;
}

.order-card.status-4 .status-tag__dot {
  background: $accent-blue;
}

/* 次头部：手机号 + 业务节点 */

.order-subheader {
  display: flex;

  align-items: center;

  gap: 16rpx;

  margin-top: 10rpx;
}

.customer-phone {
  font-size: 24rpx;

  color: $text-hint;
}

.business-node {
  font-size: 22rpx;

  font-weight: 500;

  color: $primary;

  background: $primary-light;

  padding: 2rpx 12rpx;

  border-radius: 8rpx;
}

/* 中间信息：车牌 + 产品 */

.order-meta {
  display: flex;

  align-items: center;

  gap: 12rpx;

  margin-top: 16rpx;

  min-width: 0;
}

.plate-number {
  flex-shrink: 0;

  padding: 4rpx 12rpx;

  background: $text-main;

  border-radius: 6rpx;

  color: #fff;

  font-size: 22rpx;

  font-weight: 700;

  line-height: 1.4;

  letter-spacing: 1rpx;
}

.product-text,
.vehicle-text {
  overflow: hidden;

  font-size: 24rpx;

  color: $text-body;

  text-overflow: ellipsis;

  white-space: nowrap;

  font-weight: 500;
}

/* 底部：时间 + 按钮 */

.order-footer {
  display: flex;

  align-items: center;

  justify-content: space-between;

  gap: 16rpx;

  margin-top: 16rpx;

  padding-top: 16rpx;

  border-top: 1rpx solid #f4f5f9;
}

.order-time {
  font-size: 22rpx;

  color: $text-light;

  flex-shrink: 0;
}

.order-actions {
  display: flex;

  align-items: center;

  gap: 12rpx;

  flex-shrink: 0;
}

/* ===== 空状态 / 加载 ===== */

.empty-state {
  margin: 40rpx 24rpx;

  padding: 100rpx 40rpx;

  background: $bg-surface;

  border-radius: 24rpx;

  box-shadow: 0 1rpx 6rpx rgba(26, 29, 41, 0.04);

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

  gap: 12rpx;

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

  background: linear-gradient(135deg, var(--u-type-primary-dark), #14b8a6);

  display: flex;

  align-items: center;

  justify-content: center;

  box-shadow: 0 8rpx 24rpx rgba(var(--u-type-primary-rgb, 82, 64, 254), 0.35);

  z-index: 999;

  transition:
    opacity 0.3s ease,
    transform 0.3s ease;

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

.flow-record-container {
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

.flow-record-loading {
  display: flex;

  align-items: center;

  justify-content: center;

  padding: 40rpx 0;

  color: #86909c;
}

.flow-record-empty {
  text-align: center;

  padding: 40rpx 0;

  color: #86909c;

  font-size: 26rpx;
}
</style>
