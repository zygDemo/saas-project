<template>
  <app-page :nav-title="pageTitle">
    <view v-if="detail" class="pre-audit-detail-page">
      <view class="pre-customer-card">
        <view class="pre-customer-header">
          <view class="pre-avatar">
            {{ (customerDisplayName || "?").charAt(0) }}
          </view>
          <view class="pre-customer-info">
            <text class="pre-customer-name">{{ customerDisplayName || "未命名客户" }}</text>
            <text class="pre-customer-phone">{{ customerDisplayPhone || "-" }}</text>
          </view>
          <view class="pre-progress-btn" @click="handleProgress">
            <u-icon name="map" size="28" color="var(--u-type-primary)" />
            <text class="pre-progress-text">查看进展</text>
            <u-icon name="arrow-right" size="24" color="#c4c7cc" />
          </view>
        </view>
        <view v-if="orderNo" class="pre-order-row">
          <text class="pre-order-label">订单号</text>
          <text class="pre-order-value">{{ orderNo }}</text>
        </view>
      </view>

      <scroll-view scroll-x class="pre-flow-scroll" :show-scrollbar="false">
        <view class="pre-flow-tabs">
          <view
            v-for="tab in flowTabList"
            :key="tab.value"
            class="pre-flow-tab"
            :class="{ 'pre-flow-tab--active': activeFlowTab === tab.value }"
            @click="activeFlowTab = tab.value"
          >
            <text class="pre-flow-tab__label">{{ tab.label }}</text>
            <view v-if="activeFlowTab === tab.value" class="pre-flow-tab__indicator" />
          </view>
        </view>
      </scroll-view>

      <view class="pre-section-title">{{ activeStageTitle }}事项</view>

      <view class="pre-supplement-list">
        <view
          v-for="item in stageEntryItems"
          :key="item.type"
          class="pre-supplement-card"
          :class="{ 'pre-supplement-card--submit': ['PENDING_PRECHECK', 'PENDING_SUPPLEMENT'].includes(item.code) }"
          @click="goStageStep(item)"
        >
          <view class="pre-card-icon" :class="item.iconClass">
            <u-icon :name="item.icon" size="44" color="#fff" />
          </view>
          <view class="pre-card-body">
            <text class="pre-card-title">{{ item.title }}</text>
            <text class="pre-card-desc">{{ item.desc }}</text>
          </view>
          <view class="pre-card-status">
            <u-tag
              :text="getStageStepTag(item).text"
              :type="getStageStepTag(item).type"
              size="mini"
              plain
            />
          </view>
          <view class="pre-card-arrow">
            <u-button
              v-if="['PENDING_PRECHECK', 'PENDING_SUPPLEMENT'].includes(item.code)"
              type="primary"
              size="mini"
              :loading="submitting"
              @click.stop="handlePreAuditSubmit"
            >
              提交
            </u-button>
            <u-icon v-else name="arrow-right" size="32" color="#c4c7cc" />
          </view>
        </view>
      </view>
    </view>

    <view v-if="false" class="apply-detail-page">
      <!-- 顶部状态卡片 -->
      <view
        class="status-header"
        :class="`status-${statusType(detail.status)}`"
      >
        <view class="status-avatar">
          {{ (detail.name || "?").charAt(0) }}
        </view>
        <view class="status-info">
          <text class="status-name">{{ detail.name || "-" }}</text>
          <!-- <view class="status-tags">
            <u-tag
              :text="statusText(detail.status)"
              :type="statusType(detail.status)"
              size="mini"
            />
            <u-tag
              v-if="detail.supplementNode === 1"
              text="需补件"
              type="warning"
              size="mini"
            />
          </view> -->
        </view>
      </view>

      <!-- 客户信息 -->
      <view class="section-card">
        <view class="section-header">
          <text class="section-title">客户信息</text>
          <!-- <text class="edit-btn" @click="goEdit('客户信息')">修改</text> -->
        </view>
        <view class="info-list">
          <view class="info-item">
            <view class="info-icon">
              <u-icon name="account" size="24" color="#8c8c8c" />
            </view>
            <text class="label">姓名</text>
            <text class="value">{{ detail.name || "-" }}</text>
          </view>
          <view class="info-item">
            <view class="info-icon">
              <u-icon name="phone" size="24" color="#8c8c8c" />
            </view>
            <text class="label">手机号</text>
            <text class="value">{{ detail.phone || "-" }}</text>
          </view>
        </view>
      </view>

      <!-- 车辆信息 -->
      <view class="section-card">
        <view class="section-header">
          <text class="section-title">车辆信息</text>
          <!-- <text class="edit-btn" @click="goEdit('车辆信息')">修改</text> -->
        </view>
        <view class="info-list">
          <view class="info-item">
            <view class="info-icon">
              <u-icon name="grid" size="24" color="#8c8c8c" />
            </view>
            <text class="label">车牌号</text>
            <text class="value">{{ detail.vehicle?.plateNumber || "-" }}</text>
          </view>
          <view class="info-item">
            <view class="info-icon">
              <u-icon name="car" size="24" color="#8c8c8c" />
            </view>
            <text class="label">车辆型号</text>
            <text class="value">{{ detail.vehicle?.vehicleModel || "-" }}</text>
          </view>
          <view class="info-item">
            <view class="info-icon">
              <u-icon name="account" size="24" color="#8c8c8c" />
            </view>
            <text class="label">所属人</text>
            <text class="value">{{ detail.vehicle?.vehicleOwner || "-" }}</text>
          </view>
          <view class="info-item">
            <view class="info-icon">
              <u-icon name="tags" size="24" color="#8c8c8c" />
            </view>
            <text class="label">使用性质</text>
            <text class="value">{{ detail.vehicle?.usageNature || "-" }}</text>
          </view>
          <view class="info-item">
            <view class="info-icon">
              <u-icon name="calendar" size="24" color="#8c8c8c" />
            </view>
            <text class="label">注册日期</text>
            <text class="value">{{
              formatDate(detail.vehicle?.registerDate) || "-"
            }}</text>
          </view>
          <view class="info-item">
            <view class="info-icon">
              <u-icon name="clock" size="24" color="#8c8c8c" />
            </view>
            <text class="label">行驶里程</text>
            <text class="value">{{
              detail.vehicle?.mileage ? `${detail.vehicle.mileage}km` : "-"
            }}</text>
          </view>
        </view>
      </view>

      <!-- 产品与额度 -->
      <view class="section-card">
        <view class="section-header">
          <text class="section-title">申请信息</text>
        </view>
        <view class="info-list">
          <view class="info-item">
            <view class="info-icon">
              <u-icon name="calendar" size="24" color="#8c8c8c" />
            </view>
            <text class="label">贷款期数</text>
            <text class="value">{{
              detail.periods ? `${detail.periods}期` : "-"
            }}</text>
          </view>
          <view class="info-item quota-row">
            <view class="info-icon">
              <u-icon name="rmb-circle" size="24" color="#cf1322" />
            </view>
            <text class="label">申请金额</text>
            <text class="value highlight">{{
              formatQuota(detail.pushQuota)
            }}</text>
          </view>
          <view
            v-if="detail.passQuota && detail.passQuota !== '0'"
            class="info-item"
          >
            <view class="info-icon">
              <u-icon name="checkmark-circle" size="24" color="#52c41a" />
            </view>
            <text class="label">通过额度</text>
            <text class="value success-text">{{
              formatQuota(detail.passQuota)
            }}</text>
          </view>
          <view
            v-if="detail.usedAmt && detail.usedAmt !== '0'"
            class="info-item"
          >
            <view class="info-icon">
              <u-icon name="minus-circle" size="24" color="#faad14" />
            </view>
            <text class="label">已用额度</text>
            <text class="value">{{ formatQuota(detail.usedAmt) }}</text>
          </view>
          <view
            v-if="detail.validAmt && detail.validAmt !== '0'"
            class="info-item"
          >
            <view class="info-icon">
              <u-icon name="plus-circle" size="24" color="#4096ff" />
            </view>
            <text class="label">可用额度</text>
            <text class="value">{{ formatQuota(detail.validAmt) }}</text>
          </view>
        </view>
      </view>

      <!-- 订单信息 -->
      <view class="section-card" v-if="false">
        <view class="section-header">
          <text class="section-title">订单信息</text>
        </view>
        <view class="info-list">
          <view v-if="detail.creditOrderId" class="info-item">
            <view class="info-icon">
              <u-icon name="order" size="24" color="#8c8c8c" />
            </view>
            <text class="label">订单号</text>
            <text
              class="value order-no"
              @click="copyText(detail.creditOrderId)"
            >
              {{ detail.creditOrderId }}
            </text>
          </view>
          <view v-if="detail.contractNo" class="info-item">
            <view class="info-icon">
              <u-icon name="file-text" size="24" color="#8c8c8c" />
            </view>
            <text class="label">合同号</text>
            <text class="value order-no" @click="copyText(detail.contractNo)">
              {{ detail.contractNo }}
            </text>
          </view>
          <view v-if="detail.businessNode" class="info-item">
            <view class="info-icon">
              <u-icon name="map" size="24" color="#8c8c8c" />
            </view>
            <text class="label">业务节点</text>
            <text class="value node-text">{{ businessNodeText(detail.businessNode) }}</text>
          </view>
          <view class="info-item">
            <view class="info-icon">
              <u-icon name="tags" size="24" color="#8c8c8c" />
            </view>
            <text class="label">申请状态</text>
            <text class="value">
              <u-tag
                :text="statusText(detail.status)"
                :type="statusType(detail.status)"
                size="mini"
              />
            </text>
          </view>
        </view>
      </view>

      <!-- 时间信息 -->
      <view class="section-card">
        <view class="section-header">
          <text class="section-title">时间信息</text>
        </view>
        <view class="info-list">
          <view v-if="detail.createTime" class="info-item">
            <view class="info-icon">
              <u-icon name="plus" size="24" color="#8c8c8c" />
            </view>
            <text class="label">创建时间</text>
            <text class="value time-text">{{ detail.createTime }}</text>
          </view>
          <view v-if="detail.updateTime" class="info-item">
            <view class="info-icon">
              <u-icon name="reload" size="24" color="#8c8c8c" />
            </view>
            <text class="label">更新时间</text>
            <text class="value time-text">{{ detail.updateTime }}</text>
          </view>
          <view v-if="detail.beginDate" class="info-item">
            <view class="info-icon">
              <u-icon name="play-circle" size="24" color="#8c8c8c" />
            </view>
            <text class="label">开始日期</text>
            <text class="value time-text">{{ detail.beginDate }}</text>
          </view>
          <view v-if="detail.endDate" class="info-item">
            <view class="info-icon">
              <u-icon name="pause-circle" size="24" color="#8c8c8c" />
            </view>
            <text class="label">结束日期</text>
            <text class="value time-text">{{ detail.endDate }}</text>
          </view>
        </view>
      </view>

      <!-- 备注信息（如有） -->
      <view v-if="detail.remark" class="section-card remark-card">
        <view class="section-header">
          <u-icon
            name="edit-pen"
            size="28"
            color="#8c8c8c"
            class="section-icon"
          />
          <text class="section-title">备注信息</text>
        </view>
        <view class="remark-box">
          <text class="remark-value">{{ detail.remark }}</text>
        </view>
      </view>
    </view>

    <!-- 加载中 -->
    <view v-if="loading && !detail" class="loading-wrap">
      <u-loading mode="circle" size="48" />
    </view>

    <!-- 空状态 -->
    <view v-if="!loading && !detail" class="empty-wrap">
      <u-empty text="暂无数据" mode="data" />
    </view>
    <FlowRecordPopup
      v-model:visible="flowRecordVisible"
      :loading="flowRecordLoading"
      :records="flowRecordList"
      :get-node-label="businessNodeText"
    />
  </app-page>
</template>

<script setup>
import { computed, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { useCarloanApi } from "@/api/carloan";
import { APP_ROUTES, buildRoute } from "@/common/navigation";
import { buildEntryRouteQuery, buildSignRouteQuery } from "@/common/carloan-route-query";
import { useCarloanStore } from "@/stores/carloan";
import FlowRecordPopup from "./components/FlowRecordPopup.vue";
import {
  approvalEntryItems,
  businessNodeText,
  disbursementEntryItems,
  flowTabList,
  formatDate,
  formatQuota,
  loanRequestEntryItems,
  precheckEntryItems,
  resolveFlowTabByNode,
  resolvePageTitle,
  signingEntryItems,
  statusText,
  statusType,
  supplementEntryItems,
} from "./applyDetail-flow";

const carloanStore = useCarloanStore();
const businessApi = useCarloanApi();

const detail = ref(null);
const loading = ref(true);
const submitting = ref(false);
const flowRecordVisible = ref(false);
const flowRecordLoading = ref(false);
const flowRecordList = ref([]);
const activeFlowTab = ref("precheck");
let detailId = "";

function safeDecode(value) {
  let result = String(value || "").replace(/\+/g, " ");
  for (let i = 0; i < 2; i += 1) {
    try {
      const decoded = decodeURIComponent(result);
      if (decoded === result) break;
      result = decoded;
    } catch {
      break;
    }
  }
  return result;
}

function normalizeRouteQuery(options = {}) {
  return Object.entries(options).reduce((query, [key, value]) => {
    query[key] = safeDecode(value);
    return query;
  }, {});
}

function buildRouteFallbackDetail() {
  return {
    id: detailId,
    creditOrderId: carloanStore.pageContext.creditOrderId,
    orderNo: carloanStore.pageContext.creditOrderId,
    name: carloanStore.pageContext.customerName,
    customerName: carloanStore.pageContext.customerName,
    phone: carloanStore.pageContext.customerPhone,
    telephone: carloanStore.pageContext.customerPhone,
    nodeCode: carloanStore.pageContext.nodeCode,
  };
}

function hasDetailPayload(payload) {
  return Boolean(
    payload &&
      (payload.id ||
        payload.uuid ||
        payload.customerUuid ||
        payload.userUuid ||
        payload.creditOrderId ||
        payload.orderNo ||
        payload.applicationNo ||
        payload.name ||
        payload.customerName),
  );
}

function pickDetailUuid(payload = {}) {
  return String(
    payload.uuid ||
      payload.customerUuid ||
      payload.userUuid ||
      payload.user?.uuid ||
      payload.customer?.uuid ||
      "",
  );
}

function normalizeDetailPayload(payload = {}) {
  const fallback = buildRouteFallbackDetail();
  const uuid = pickDetailUuid(payload) || carloanStore.pageContext.uuid;
  return {
    ...fallback,
    ...payload,
    uuid,
    id: payload.id || fallback.id,
    creditOrderId:
      payload.creditOrderId || payload.orderNo || payload.applicationNo || fallback.creditOrderId,
    orderNo: payload.orderNo || payload.creditOrderId || payload.applicationNo || fallback.orderNo,
    name: payload.name || payload.customerName || payload.personName || fallback.name,
    customerName: payload.customerName || payload.name || payload.personName || fallback.customerName,
    phone: payload.phone || payload.telephone || payload.mobile || fallback.phone,
    telephone: payload.telephone || payload.phone || payload.mobile || fallback.telephone,
    nodeCode: payload.nodeCode || payload.currentNode || payload.businessNode || fallback.nodeCode,
  };
}

async function loadDetail() {
  const creditOrderId = carloanStore.pageContext.creditOrderId;
  const fallback = buildRouteFallbackDetail();

  if (!creditOrderId && !detailId) {
    detail.value = hasDetailPayload(fallback) ? fallback : null;
    loading.value = false;
    return;
  }

  loading.value = true;
  try {
    let res = null;
    if (creditOrderId) {
      res = await businessApi.getCreditDetailByOrderId(creditOrderId);
    } else if (detailId) {
      res = await businessApi.getCreditDetail(detailId);
    }

    const data = res?.data || res || {};
    detail.value = normalizeDetailPayload(hasDetailPayload(data) ? data : fallback);
    if (detail.value?.uuid && !carloanStore.pageContext.uuid) {
      carloanStore.pageContext.uuid = String(detail.value.uuid);
    }
  } catch (err) {
    console.warn("获取订单详情失败:", err);
    detail.value = hasDetailPayload(fallback) ? fallback : null;
    uni.showToast({ title: "获取详情失败，已显示基础信息", icon: "none" });
  } finally {
    loading.value = false;
  }
}

onLoad((options = {}) => {
  const query = normalizeRouteQuery(options);
  detailId = query.id || "";
  carloanStore.syncFromRouteQuery(query);
  activeFlowTab.value = resolveFlowTabByNode(carloanStore.pageContext.nodeCode);
  loadDetail();
});

const customerDisplayName = computed(() =>
  detail.value?.name ||
  detail.value?.customerName ||
  detail.value?.personName ||
  carloanStore.pageContext.customerName ||
  "",
);

const customerDisplayPhone = computed(() =>
  detail.value?.phone ||
  detail.value?.telephone ||
  detail.value?.mobile ||
  carloanStore.pageContext.customerPhone ||
  "",
);

const orderNo = computed(() =>
  detail.value?.creditOrderId ||
  detail.value?.orderNo ||
  detail.value?.applicationNo ||
  carloanStore.pageContext.creditOrderId ||
  "",
);

const detailUuid = computed(() =>
  carloanStore.pageContext.uuid ||
    pickDetailUuid(detail.value || {}) ||
    "",
);

const entryProgress = computed(() => {
  try {
    const progressMap = uni.getStorageSync("ENTRY_PROGRESS_MAP") || {};
    return progressMap[orderNo.value] || progressMap[detailUuid.value] || {};
  } catch {
    return {};
  }
});

const signProgress = computed(() => {
  try {
    const progressMap = uni.getStorageSync("SIGN_PROGRESS_MAP") || {};
    return progressMap[orderNo.value] || progressMap[detailUuid.value] || {};
  } catch {
    return {};
  }
});

const currentNodeCode = computed(() =>
  String(
    carloanStore.pageContext.nodeCode ||
      detail.value?.nodeCode ||
      detail.value?.currentNode ||
      detail.value?.businessNode ||
      "",
  ),
);

const isPreAuditDetail = computed(() =>
  ["1100", "1200", "PRE_AUDIT", "INITIAL_AUDIT"].includes(
    currentNodeCode.value,
  ),
);

const isSupplementDetail = computed(() =>
  ["1300", "1310", "1320", "1330", "1340", "SUPPLEMENT_MATERIALS"].includes(
    currentNodeCode.value,
  ),
);

const isSigningDetail = computed(() => {
  const code = currentNodeCode.value;
  const numericCode = Number(code);
  return (
    (Number.isFinite(numericCode) && numericCode >= 1600 && numericCode <= 1660) ||
    ["SIGN_CONTRACT", "PENDING_SIGN", "SIGNING_PROGRESS"].includes(code)
  );
});

const isLoanRequestDetail = computed(() => {
  const code = currentNodeCode.value;
  const numericCode = Number(code);
  return (
    (Number.isFinite(numericCode) && numericCode >= 1700 && numericCode <= 1799) ||
    ["LOAN_REQUEST", "PENDING_LOAN_REQUEST"].includes(code)
  );
});

/** 根据节点状态获取页面标题 */
const pageTitle = computed(() =>
  resolvePageTitle(currentNodeCode.value, isPreAuditDetail.value ? "预审阶段" : "订单详情"),
);

const activeStageTitle = computed(
  () => flowTabList.find((tab) => tab.value === activeFlowTab.value)?.label || "阶段",
);

const stageEntryItems = computed(() => {
  if (activeFlowTab.value === "supplement") return supplementEntryItems;
  if (activeFlowTab.value === "approval") return approvalEntryItems;
  if (activeFlowTab.value === "signing") return signingEntryItems;
  if (activeFlowTab.value === "loanRequest") return loanRequestEntryItems;
  if (activeFlowTab.value === "disbursement") return disbursementEntryItems;
  return precheckEntryItems;
});

function getEntryStepDone(code) {
  if (code === "ID_CARD" || code === "CUSTOMER_SUPPLEMENT") {
    return Boolean(
      entryProgress.value?.ID_CARD === 1 ||
        detailUuid.value ||
        detail.value?.personName ||
        detail.value?.personIdcard ||
        detail.value?.idCard ||
        detail.value?.idcard ||
        detail.value?.personIdCard ||
        detail.value?.customer?.personIdcard ||
        detail.value?.user?.personIdcard,
    );
  }
  if (code === "VEHICLE" || code === "VEHICLE_SUPPLEMENT") {
    return Boolean(
      detail.value?.vehicle?.plateNumber ||
        detail.value?.plateNumber ||
        detail.value?.vehicleInfo?.plateNumber,
    );
  }
  if (code === "APPLICATION" || code === "ORDER_SUPPLEMENT") {
    return Boolean(detail.value?.periods || detail.value?.pushQuota || detail.value?.amount);
  }
  if (code === "AUTH_SIGN") {
    return Boolean(
      entryProgress.value?.AUTH_SIGN === 1 ||
        signProgress.value?.status === "SIGNED" ||
        detail.value?.isSignContract === 1 ||
        detail.value?.signStatus === "SIGNED" ||
        detail.value?.authSignStatus === "SIGNED" ||
        detail.value?.authContractStatus === "SIGNED" ||
        detail.value?.authStatus === "SIGNED",
    );
  }
  if (code === "FILE_SUPPLEMENT") {
    return Boolean(
      detail.value?.fileCount ||
        detail.value?.attachmentCount ||
        detail.value?.materialCount ||
        detail.value?.uploadCount,
    );
  }
  // 签约子步骤状态判断 - 基于 currentNodeCode 范围
  // 签约阶段的子步骤都显示为"待办理"，用户点击后跳转到对应页面操作
  if (["CONFIRM_AMOUNT", "BIND_CARD", "SIGN_CONTRACT", "GPS_APPOINTMENT", "MORTGAGE"].includes(code)) {
    return false;
  }
  return false;
}

function getStageStepTag(item) {
  if (["PENDING_PRECHECK", "PENDING_SUPPLEMENT"].includes(item.code)) {
    return {
      text: allPreAuditStepsDone.value ? "待提交" : "待完善",
      type: allPreAuditStepsDone.value ? "info" : "warning",
    };
  }
  if (["APPROVAL_PROGRESS", "APPROVAL_LIST", "LOAN_REQUEST_PROGRESS", "DISBURSEMENT_PROGRESS", "REPAYMENT_PLAN"].includes(item.code)) {
    return { text: "查看", type: "info" };
  }
  if (item.code === "LOAN_CONFIRM") {
    return { text: isLoanRequestDetail.value ? "待确认" : "办理", type: "info" };
  }
  // 签约子步骤显示"待办理"
  if (["CONFIRM_AMOUNT", "BIND_CARD", "SIGN_CONTRACT", "GPS_APPOINTMENT", "MORTGAGE"].includes(item.code)) {
    return getEntryStepDone(item.code)
      ? { text: "已完成", type: "success" }
      : { text: "待办理", type: "info" };
  }
  return getEntryStepDone(item.code)
    ? { text: "已完成", type: "success" }
    : { text: "待完善", type: "warning" };
}

const allPreAuditStepsDone = computed(() =>
  stageEntryItems.value
    .filter((item) => !["PENDING_PRECHECK", "PENDING_SUPPLEMENT"].includes(item.code))
    .every((item) => getEntryStepDone(item.code)),
);

function goStageStep(item) {
  if (["PENDING_PRECHECK", "PENDING_SUPPLEMENT"].includes(item.code)) {
    handlePreAuditSubmit();
    return;
  }
  if (["approvalProgress", "loanRequestProgress", "disbursementProgress"].includes(item.type)) {
    handleProgress();
    return;
  }

  const detailRouteQuery = buildEntryRouteQuery({
    uuid: detailUuid.value,
    creditOrderId: orderNo.value,
    name: customerDisplayName.value,
    phone: customerDisplayPhone.value,
    amount: detail.value?.pushQuota || detail.value?.amount || "",
    pushQuota: detail.value?.pushQuota || "",
    periods: detail.value?.periods || "",
    fromEntry: 1,
  });
  const signRouteQuery = buildSignRouteQuery({
    creditOrderId: orderNo.value,
    uuid: detailUuid.value,
    customerName: customerDisplayName.value,
    customerPhone: customerDisplayPhone.value,
  });
  const urlMap = {
    idInfo: buildRoute(APP_ROUTES.carloan.precheck.idInfo, detailRouteQuery),
    carInfo: buildRoute(APP_ROUTES.carloan.precheck.carInfo, detailRouteQuery),
    applyInfo: buildRoute(APP_ROUTES.carloan.precheck.applyInfo, detailRouteQuery),
    authSign: buildRoute(APP_ROUTES.carloan.signing.videoFaceSign, detailRouteQuery),
    idInfoSupplement: buildRoute(APP_ROUTES.carloan.supplement.idInfoSupplement, detailRouteQuery),
    carInfoSupplement: buildRoute(APP_ROUTES.carloan.supplement.carInfoSupplement, detailRouteQuery),
    orderInfoSupplement: buildRoute(APP_ROUTES.carloan.supplement.orderInfoSupplement, detailRouteQuery),
    fileInfoSupplement: buildRoute(APP_ROUTES.carloan.supplement.fileInfoSupplement, detailRouteQuery),
    signConfirmAmount: buildRoute(APP_ROUTES.carloan.signing.signConfirmAmount, signRouteQuery),
    signBindCard: buildRoute(APP_ROUTES.carloan.signing.signBindCard, signRouteQuery),
    videoFaceSign: buildRoute(APP_ROUTES.carloan.signing.videoFaceSign, signRouteQuery),
    signGpsAppointment: buildRoute(APP_ROUTES.carloan.signing.signGpsAppointment, signRouteQuery),
    signMortgage: buildRoute(APP_ROUTES.carloan.signing.signMortgage, signRouteQuery),
    approvalProgress: buildRoute(APP_ROUTES.carloan.precheck.applyProgress, {
      id: detailId || detail.value?.id || "",
      creditOrderId: orderNo.value,
      uuid: detailUuid.value,
      customerName: customerDisplayName.value,
      customerPhone: customerDisplayPhone.value,
      nodeCode: currentNodeCode.value,
    }),
    approvalList: buildRoute(APP_ROUTES.carloan.approval.approvalList, detailRouteQuery),
    loanConfirm: buildRoute(APP_ROUTES.carloan.postloan.loanConfirm, {
      applicationId: detailId || detail.value?.id || "",
      applicationNo: orderNo.value,
      creditOrderId: orderNo.value,
      uuid: detailUuid.value,
      customerName: customerDisplayName.value,
      customerPhone: customerDisplayPhone.value,
    }),
    loanRequestProgress: buildRoute(APP_ROUTES.carloan.precheck.applyProgress, {
      id: detailId || detail.value?.id || "",
      creditOrderId: orderNo.value,
      uuid: detailUuid.value,
      customerName: customerDisplayName.value,
      customerPhone: customerDisplayPhone.value,
      nodeCode: currentNodeCode.value,
    }),
    disbursementProgress: buildRoute(APP_ROUTES.carloan.precheck.applyProgress, {
      id: detailId || detail.value?.id || "",
      creditOrderId: orderNo.value,
      uuid: detailUuid.value,
      customerName: customerDisplayName.value,
      customerPhone: customerDisplayPhone.value,
      nodeCode: currentNodeCode.value,
    }),
    repaymentPlan: buildRoute(APP_ROUTES.carloan.postloan.repaymentPlan, {
      applicationId: detailId || detail.value?.id || "",
      applicationNo: orderNo.value,
      creditOrderId: orderNo.value,
      uuid: detailUuid.value,
      customerName: customerDisplayName.value,
      customerPhone: customerDisplayPhone.value,
    }),
  };
  const url = urlMap[item.type];
  if (url) {
    uni.navigateTo({ url });
    return;
  }
  uni.showToast({ title: "当前阶段请查看进展", icon: "none" });
}

async function handleProgress() {
  const lifecycleId = detailId || detail.value?.id || detail.value?.applicationId || orderNo.value;
  if (!lifecycleId) {
    uni.showToast({ title: "缺少订单编号", icon: "none" });
    return;
  }
  flowRecordVisible.value = true;
  flowRecordLoading.value = true;
  flowRecordList.value = [];
  try {
    const res = await businessApi.getLifecycle(String(lifecycleId));
    if (res?.code === 200 && Array.isArray(res.data)) {
      flowRecordList.value = res.data;
      return;
    }
    throw new Error("接口返回异常");
  } catch (err) {
    console.warn("获取流程进展失败:", err);
    uni.showToast({ title: "加载进展失败", icon: "none" });
  } finally {
    flowRecordLoading.value = false;
  }
}

async function handlePreAuditSubmit() {
  if (!allPreAuditStepsDone.value) return;
  if (!orderNo.value) {
    uni.showToast({ title: "缺少订单编号", icon: "none" });
    return;
  }

  const { confirm } = await uni.showModal({
    title: "确认提交",
    content: isSupplementDetail.value ? "提交后将进入下一处理环节，确认提交吗？" : "提交后将进入预审流程，确认提交吗？",
    confirmText: "确认提交",
    cancelText: "再等等",
  });
  if (!confirm) return;

  submitting.value = true;
  try {
    await businessApi.submitInitialAudit(orderNo.value);
    uni.showToast({ title: isSupplementDetail.value ? "补件提交成功" : "提交成功", icon: "success" });
    setTimeout(() => {
      uni.navigateBack();
    }, 1200);
  } catch (err) {
    console.error("提交预审失败:", err);
    uni.showToast({ title: "提交失败，请重试", icon: "none" });
  } finally {
    submitting.value = false;
  }
}

// 格式化额度（字符串类型，单位元）
const goEdit = (type) => {
  const editPath = {
    客户信息: APP_ROUTES.carloan.precheck.idInfo,
    车辆信息: APP_ROUTES.carloan.precheck.carInfo,
  };

  uni.$u.route({
    url: editPath[type],
    type: "navigateTo",
    params: { uuid: carloanStore.pageContext.uuid, id: detailId },
  });
};

// 复制文本到剪贴板
const copyText = (text) => {
  uni.setClipboardData({
    data: text,
    success: () => {
      uni.showToast({ title: "已复制", icon: "success" });
    },
  });
};
</script>

<style lang="scss" scoped>
.pre-audit-detail-page {
  min-height: 100vh;
  padding: 28rpx 24rpx 64rpx;
  background:
    linear-gradient(180deg, rgba(232, 244, 255, 0.9) 0%, rgba(248, 250, 252, 0.96) 34%, #f6f8fb 100%),
    linear-gradient(135deg, rgba(38, 166, 154, 0.12), rgba(52, 120, 246, 0.1));
}

.pre-customer-card {
  position: relative;
  overflow: hidden;
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 252, 255, 0.96) 100%);
  border: 1rpx solid rgba(223, 232, 242, 0.9);
  border-radius: 20rpx;
  padding: 32rpx 30rpx 28rpx;
  box-shadow: 0 12rpx 30rpx rgba(31, 45, 61, 0.06);
  margin-bottom: 30rpx;
}

.pre-customer-header {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 22rpx;
}

.pre-progress-btn {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 14rpx 18rpx;
  background: rgba(64, 150, 255, 0.08);
  border-radius: 999rpx;
  border: 1rpx solid rgba(64, 150, 255, 0.16);
  flex-shrink: 0;
  transition: transform 0.16s ease, background-color 0.16s ease;

  &:active {
    transform: scale(0.98);
    background: rgba(64, 150, 255, 0.14);
  }
}

.pre-progress-text {
  font-size: 25rpx;
  font-weight: 600;
  color: var(--u-type-primary);
}

.pre-avatar {
  width: 92rpx;
  height: 92rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #2f8cff 0%, #26a69a 100%);
  color: #fff;
  font-size: 38rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 12rpx 24rpx rgba(47, 140, 255, 0.18);
}

.pre-customer-info {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  min-width: 0;
  flex: 1;
}

.pre-customer-name {
  font-size: 38rpx;
  font-weight: 700;
  color: #172033;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pre-customer-phone {
  font-size: 27rpx;
  color: #687387;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pre-order-row {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-top: 26rpx;
  padding: 20rpx 22rpx;
  background: rgba(245, 248, 252, 0.86);
  border-radius: 14rpx;
}

.pre-order-label {
  font-size: 25rpx;
  color: #8290a3;
  flex-shrink: 0;
}

.pre-order-value {
  flex: 1;
  min-width: 0;
  font-size: 25rpx;
  color: #2b3445;
  word-break: break-all;
  line-height: 1.35;
}

.pre-flow-scroll {
  width: 100%;
  margin: 0 -24rpx 24rpx;
  padding: 0 24rpx;
  background: rgba(246, 248, 251, 0.96);
  border-top: 1rpx solid rgba(229, 235, 244, 0.9);
  border-bottom: 1rpx solid rgba(229, 235, 244, 0.9);
  white-space: nowrap;
}

.pre-flow-tabs {
  display: inline-flex;
  align-items: center;
  padding: 0;
  min-width: 100%;
}

.pre-flow-tab {
  position: relative;
  flex: 0 0 auto;
  display: flex;
  justify-content: center;
  min-width: 140rpx;
  padding: 24rpx 14rpx 22rpx;
}

.pre-flow-tab__label {
  font-size: 29rpx;
  font-weight: 600;
  color: #647084;
  line-height: 1.2;
}

.pre-flow-tab--active .pre-flow-tab__label {
  color: #1f6feb;
}

.pre-flow-tab__indicator {
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 44rpx;
  height: 6rpx;
  border-radius: 8rpx;
  background: linear-gradient(90deg, #1f6feb, #26a69a);
  transform: translateX(-50%);
}

.pre-section-title {
  position: relative;
  margin: 0 0 20rpx;
  padding-left: 18rpx;
  font-size: 31rpx;
  font-weight: 700;
  color: #253247;
  line-height: 1.25;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 5rpx;
    width: 6rpx;
    height: 34rpx;
    border-radius: 8rpx;
    background: linear-gradient(180deg, #1f6feb, #26a69a);
  }
}

.pre-supplement-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.pre-supplement-card {
  position: relative;
  min-height: 120rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 24rpx 22rpx;
  background: rgba(255, 255, 255, 0.96);
  border: 1rpx solid rgba(226, 233, 242, 0.9);
  border-radius: 16rpx;
  box-shadow: 0 8rpx 20rpx rgba(31, 45, 61, 0.045);
  transition: transform 0.16s ease, background-color 0.16s ease, border-color 0.16s ease;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 28rpx;
    bottom: 28rpx;
    width: 5rpx;
    border-radius: 0 8rpx 8rpx 0;
    background: rgba(64, 150, 255, 0.18);
  }

  &:active {
    transform: translateY(2rpx);
    background: #fbfdff;
    border-color: rgba(64, 150, 255, 0.28);
  }
}

.pre-card-icon {
  width: 76rpx;
  height: 76rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pre-card-icon-customer {
  background: linear-gradient(135deg, #4f9cff, #1f6feb);
}

.pre-card-icon-car {
  background: linear-gradient(135deg, #2dd4bf, #0f9f84);
}

.pre-card-icon-order {
  background: linear-gradient(135deg, #f6b64b, #e88622);
}

.pre-card-icon-file {
  background: linear-gradient(135deg, #6772e5, #8b5cf6);
}

.pre-card-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 7rpx;
}

.pre-card-title {
  font-size: 31rpx;
  font-weight: 700;
  color: #172033;
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pre-card-desc {
  font-size: 25rpx;
  color: #7b8797;
  line-height: 1.42;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pre-card-status {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  align-self: center;
  min-height: 76rpx;

  :deep(.u-tag) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 42rpx;
    line-height: 42rpx;
    padding: 0 14rpx;
    border-radius: 999rpx;
    font-weight: 600;
  }

  :deep(.u-tag__text) {
    line-height: 1;
  }
}

.pre-card-arrow {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  align-self: center;
  min-height: 76rpx;
}

.pre-supplement-card--submit {
  align-items: center;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(240, 248, 255, 0.98));
  border-color: rgba(64, 150, 255, 0.18);
}

.pre-supplement-card--submit .pre-card-icon {
  opacity: 1;
  pointer-events: auto;
}

.pre-supplement-card--submit .pre-card-body {
  padding-top: 0;
}

.pre-supplement-card--submit .pre-card-arrow {
  align-items: center;
  gap: 16rpx;

  :deep(.u-btn) {
    height: 56rpx;
    line-height: 56rpx;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 12rpx;
  }
}

.pre-card-icon-pending {
  background: linear-gradient(135deg, #60a5fa, #26a69a);
}

.pre-action-area {
  margin-top: 42rpx;
  padding-bottom: 28rpx;

  :deep(.u-btn--disabled) {
    background: #9dccf8 !important;
    border-color: #9dccf8 !important;
    color: #fff !important;
  }
}

.apply-detail-page {
  padding: 24rpx;
  background: linear-gradient(180deg, #f2f4f8 0%, #f8f9fb 100%);
}

// ===== 顶部状态卡片 =====
.status-header {
  display: flex;
  align-items: center;
  gap: 24rpx;
  background: #fff;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 28rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.06);
  position: relative;
  overflow: hidden;

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

  &.status-warning::before {
    background: linear-gradient(180deg, #faad14, #ffc53d);
  }
  &.status-info::before {
    background: linear-gradient(180deg, #4096ff, #69b1ff);
  }
  &.status-success::before {
    background: linear-gradient(180deg, #52c41a, #73d13d);
  }
  &.status-error::before {
    background: linear-gradient(180deg, #ff4d4f, #ff7875);
  }
}

.status-avatar {
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
  background: linear-gradient(135deg, #8c8c8c, #bfbfbf);

  .status-warning & {
    background: linear-gradient(135deg, #faad14, #ffc53d);
  }
  .status-info & {
    background: linear-gradient(135deg, #4096ff, #69b1ff);
  }
  .status-success & {
    background: linear-gradient(135deg, #52c41a, #73d13d);
  }
  .status-error & {
    background: linear-gradient(135deg, #ff4d4f, #ff7875);
  }
}

.status-info {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  flex: 1;
  min-width: 0;
}

.status-name {
  font-size: 36rpx;
  font-weight: 700;
  color: #1f1f1f;
  letter-spacing: 0.5rpx;
}

.status-tags {
  display: flex;
  gap: 12rpx;
  flex-wrap: wrap;
}

// ===== 信息卡片 =====
.section-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 20rpx;
}

.edit-btn {
  margin-left: auto;
  font-size: 26rpx;
  color: var(--u-type-primary);
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
  transition: all 0.2s ease;

  &:active {
    background: rgba(var(--u-type-primary-rgb, 82, 64, 254), 0.08);
  }
}

.section-icon {
  flex-shrink: 0;
}

.section-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #262626;
  letter-spacing: 1rpx;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.info-item {
  display: flex;
  align-items: center;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
  gap: 12rpx;
}

.info-item:last-child {
  border-bottom: none;
}

.info-icon {
  width: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.label {
  color: #8c8c8c;
  font-size: 26rpx;
  width: 140rpx;
  flex-shrink: 0;
}

.value {
  color: #262626;
  font-size: 26rpx;
  text-align: right;
  flex: 1;
  font-weight: 500;
}

.value.highlight {
  color: #cf1322;
  font-weight: 700;
  font-size: 30rpx;
}

.value.success-text {
  color: #52c41a;
  font-weight: 600;
}

.value.order-no {
  color: #262626;
  font-size: 26rpx;
  font-weight: 500;
}

.value.time-text {
  color: #8c8c8c;
  font-size: 26rpx;
}

.value.node-text {
  color: #262626;
  font-size: 26rpx;
  font-weight: 500;
}

.quota-row .label {
  color: #cf1322;
  font-weight: 500;
}

// ===== 备注卡片 =====
.remark-card {
  background: linear-gradient(135deg, #fffbe6 0%, #fff 100%);
}

.remark-box {
  margin-top: 4rpx;
  padding: 20rpx;
  background: #fff7e6;
  border-radius: 12rpx;
  border-left: 4rpx solid #faad14;
}

.remark-value {
  color: #595959;
  font-size: 26rpx;
  line-height: 1.6;
}

// ===== 加载 & 空状态 =====
.loading-wrap,
.empty-wrap {
  display: flex;
  justify-content: center;
  padding: 160rpx 0;
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .page-container { background-color: #121212; }
  .card { background-color: #1e1e1e; }
  .card-item { background-color: #1e1e1e; }
  .list-item { background-color: #1e1e1e; }
  .section { background-color: #1e1e1e; }
  .form-item { background-color: #1e1e1e; border-color: #2a2a2a; }
  .title { color: #e5e6eb; }
  .subtitle { color: #8b8c91; }
  .desc { color: #8b8c91; }
  .label { color: #b0b3b8; }
  .value { color: #e5e6eb; }
  .name { color: #e5e6eb; }
  .info { color: #b0b3b8; }
  .text { color: #e5e6eb; }
  .tip { color: #8b8c91; }
  .divider { background-color: #2a2a2a; }
  .border { border-color: #2a2a2a; }
  .input { background-color: #2a2a2a; color: #e5e6eb; }
  .textarea { background-color: #2a2a2a; color: #e5e6eb; }
  .picker { background-color: #2a2a2a; color: #e5e6eb; }
  .footer { background-color: #1e1e1e; }
}
</style>
