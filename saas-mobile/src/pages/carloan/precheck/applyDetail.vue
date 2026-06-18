<template>
  <app-page :nav-title="pageTitle">
    <view v-if="detail && isPreAuditDetail" class="pre-audit-detail-page">
      <view class="pre-customer-card">
        <view class="pre-customer-header">
          <view class="pre-avatar">
            {{ (customerDisplayName || "?").charAt(0) }}
          </view>
          <view class="pre-customer-info">
            <text class="pre-customer-name">{{ customerDisplayName || "未命名客户" }}</text>
            <text class="pre-customer-phone">{{ customerDisplayPhone || "-" }}</text>
          </view>
        </view>
        <view v-if="orderNo" class="pre-order-row">
          <text class="pre-order-label">订单号</text>
          <text class="pre-order-value">{{ orderNo }}</text>
        </view>
      </view>

      <view class="pre-section-title">子步骤</view>

      <view class="pre-supplement-list">
        <view
          v-for="item in preAuditEntryItems"
          :key="item.type"
          class="pre-supplement-card"
          :class="{ 'pre-supplement-card--submit': item.code === 'PENDING_PRECHECK' }"
          @click="goPreAuditStep(item)"
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
              :text="getPreAuditStepTag(item).text"
              :type="getPreAuditStepTag(item).type"
              size="mini"
              plain
            />
          </view>
          <view class="pre-card-arrow">
            <u-button
              v-if="item.code === 'PENDING_PRECHECK'"
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

    <view v-else-if="detail" class="apply-detail-page">
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
  </app-page>
</template>

<script setup>
import { computed, ref, onMounted } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { useCarloanApi } from "@/api/carloan";
import { APP_ROUTES, buildRoute } from "@/common/navigation";
import { buildEntryRouteQuery } from "@/common/carloan-route-query";
import { useCarloanStore } from "@/stores/carloan";

const carloanStore = useCarloanStore();
const businessApi = useCarloanApi();

const detail = ref(null);
const loading = ref(true);
const submitting = ref(false);
let detailId = null;
onLoad((query) => {
    carloanStore.syncFromRouteQuery(query);
  detailId = query.id;
  carloanStore.pageContext.creditOrderId = query.creditOrderId || query.orderNo || "";
  carloanStore.pageContext.uuid = query.uuid || "";
  carloanStore.pageContext.nodeCode = query.nodeCode || "";
  carloanStore.pageContext.customerName = query.customerName || query.name || "";
  carloanStore.pageContext.customerPhone = query.customerPhone || query.phone || "";
});

onMounted(() => {
  if (carloanStore.pageContext.creditOrderId || detailId) {
    fetchDetail();
  }
});

async function fetchDetail() {
  loading.value = true;
  try {
    const res = carloanStore.pageContext.creditOrderId
      ? await businessApi.getCreditDetailByOrderId(carloanStore.pageContext.creditOrderId)
      : await businessApi.getCreditDetail(detailId);
    if (res?.code === 200) {
      // 详情接口返回结构可能是 res.data 或 res 本身
      detail.value = res.data || {};
      carloanStore.pageContext.uuid = res.data?.uuid || carloanStore.pageContext.uuid;
    }
  } catch (e) {
    console.error("获取详情失败", e);
    uni.showToast({ title: "获取详情失败", icon: "none" });
  } finally {
    loading.value = false;
  }
}

// 状态映射（与列表页一致：1成功/2失败/3重新推送/4待授信）
const statusMap = {
  1: { text: "授信成功", type: "success" },
  2: { text: "授信失败", type: "error" },
  3: { text: "重新推送", type: "warning" },
  4: { text: "待授信", type: "info" },
};

// 业务节点中文映射
const businessNodeMap = {
  "1100": "预审进件",
  "1200": "风控预审",
  "1300": "资方预审",
  INITIAL_AUDIT: "初审",
  PRE_AUDIT: "预审",
  SUPPLEMENT_MATERIALS: "补充资料",
  SIGN_CONTRACT: "签约",
  FACE_RECOGNITION: "人脸识别",
  FACE_SIGN: "面签",
  LOAN_DISBURSEMENT: "放款",
};

function statusText(val) {
  return (statusMap[val] || {}).text || (val ? `状态${val}` : "未知");
}

function statusType(val) {
  return (statusMap[val] || {}).type || "default";
}

function businessNodeText(val) {
  return businessNodeMap[val] || val || "-";
}

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
  ["1100", "1200", "1300", "PRE_AUDIT", "INITIAL_AUDIT"].includes(
    currentNodeCode.value,
  ),
);

const pageTitle = computed(() => (isPreAuditDetail.value ? "资料补充" : "预审信息"));

const preAuditEntryItems = computed(() => [
  {
    type: "idInfo",
    code: "ID_CARD",
    title: "身份证信息",
    desc: "完善客户身份、证件、联系方式等",
    icon: "account",
    iconClass: "pre-card-icon-customer",
  },
  {
    type: "carInfo",
    code: "VEHICLE",
    title: "车辆信息",
    desc: "完善车辆品牌、型号、年限等",
    icon: "car",
    iconClass: "pre-card-icon-car",
  },
  {
    type: "applyInfo",
    code: "APPLICATION",
    title: "申请信息",
    desc: "完善申请金额、期限、产品等",
    icon: "order",
    iconClass: "pre-card-icon-order",
  },
  {
    type: "authSign",
    code: "AUTH_SIGN",
    title: "签署授权书",
    desc: "签署授权书，授权资方查询征信等",
    icon: "edit-pen",
    iconClass: "pre-card-icon-file",
  },
  {
    type: "submit",
    code: "PENDING_PRECHECK",
    title: "待预审",
    desc: "资料确认完成后提交，进入预审流程",
    icon: "clock",
    iconClass: "pre-card-icon-pending",
  },
]);

function getEntryStepDone(code) {
  if (code === "ID_CARD") {
    return Boolean(carloanStore.pageContext.uuid);
  }
  if (code === "VEHICLE") {
    return Boolean(
      detail.value?.vehicle?.plateNumber ||
        detail.value?.plateNumber ||
        detail.value?.vehicleInfo?.plateNumber,
    );
  }
  if (code === "APPLICATION") {
    return Boolean(detail.value?.periods || detail.value?.pushQuota || detail.value?.amount);
  }
  if (code === "AUTH_SIGN") {
    return detail.value?.isSignContract === 1;
  }
  return false;
}

function getPreAuditStepTag(item) {
  if (item.code === "PENDING_PRECHECK") {
    return {
      text: allPreAuditStepsDone.value ? "待提交" : "待完善",
      type: allPreAuditStepsDone.value ? "info" : "warning",
    };
  }
  return getEntryStepDone(item.code)
    ? { text: "已完成", type: "success" }
    : { text: "待完善", type: "warning" };
}

const allPreAuditStepsDone = computed(() =>
  preAuditEntryItems.value
    .filter((item) => item.code !== "PENDING_PRECHECK")
    .every((item) => getEntryStepDone(item.code)),
);

function goPreAuditStep(item) {
  if (item.code === "PENDING_PRECHECK") {
    handlePreAuditSubmit();
    return;
  }

  const detailRouteQuery = buildEntryRouteQuery({
    uuid: carloanStore.pageContext.uuid,
    creditOrderId: orderNo.value,
    name: customerDisplayName.value,
    phone: customerDisplayPhone.value,
    fromEntry: 1,
  });
  const urlMap = {
    idInfo: buildRoute(APP_ROUTES.carloan.supplement.idInfoSupplement, detailRouteQuery),
    carInfo: buildRoute(APP_ROUTES.carloan.precheck.carInfo, detailRouteQuery),
    applyInfo: buildRoute(APP_ROUTES.carloan.precheck.applyInfo, detailRouteQuery),
    authSign: buildRoute(APP_ROUTES.carloan.signing.videoFaceSign, detailRouteQuery),
  };
  const url = urlMap[item.type];
  if (url) {
    uni.navigateTo({ url });
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
    content: "提交后将进入预审流程，确认提交吗？",
    confirmText: "确认提交",
    cancelText: "再等等",
  });
  if (!confirm) return;

  submitting.value = true;
  try {
    await businessApi.submitInitialAudit(orderNo.value);
    uni.showToast({ title: "提交成功", icon: "success" });
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
function formatQuota(val) {
  if (!val && val !== "0") return "-";
  const num = Number(val);
  if (Number.isNaN(num)) return val;
  return num >= 10000 ? `${(num / 10000).toFixed(2)}万` : `${num.toFixed(2)}元`;
}

// 格式化日期，去除时间部分
function formatDate(val) {
  if (!val) return "";
  return val.split(" ")[0];
}

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
  padding: 32rpx 24rpx 56rpx;
  background: linear-gradient(180deg, #f6f9ff 0%, #f8fbff 48%, #eef8fb 100%);
}

.pre-customer-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 34rpx 32rpx 30rpx;
  box-shadow: 0 14rpx 34rpx rgba(52, 92, 140, 0.08);
  margin-bottom: 40rpx;
}

.pre-customer-header {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.pre-avatar {
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #60a5fa, #3b82f6);
  color: #fff;
  font-size: 38rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pre-customer-info {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  min-width: 0;
}

.pre-customer-name {
  font-size: 36rpx;
  font-weight: 700;
  color: #161b25;
}

.pre-customer-phone {
  font-size: 28rpx;
  color: #9aa3af;
}

.pre-order-row {
  display: flex;
  align-items: center;
  gap: 18rpx;
  margin-top: 28rpx;
  padding-top: 26rpx;
  border-top: 1rpx solid #eef2f7;
}

.pre-order-label {
  font-size: 28rpx;
  color: #a0a8b5;
}

.pre-order-value {
  flex: 1;
  min-width: 0;
  font-size: 28rpx;
  color: #2f3747;
  word-break: break-all;
}

.pre-section-title {
  position: relative;
  margin: 0 0 24rpx;
  padding-left: 16rpx;
  font-size: 32rpx;
  font-weight: 700;
  color: #5d6b7c;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 8rpx;
    width: 6rpx;
    height: 32rpx;
    border-radius: 8rpx;
    background: linear-gradient(180deg, #4aa3ff, #7cc2ff);
  }
}

.pre-supplement-list {
  display: flex;
  flex-direction: column;
  gap: 22rpx;
}

.pre-supplement-card {
  min-height: 126rpx;
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding: 26rpx 24rpx;
  background: #fff;
  border-radius: 20rpx;
  box-shadow: 0 10rpx 28rpx rgba(52, 92, 140, 0.06);

  &:active {
    transform: scale(0.99);
    background: #fbfdff;
  }
}

.pre-card-icon {
  width: 84rpx;
  height: 84rpx;
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pre-card-icon-customer {
  background: linear-gradient(135deg, #60a5fa, #3478f6);
}

.pre-card-icon-car {
  background: linear-gradient(135deg, #21c89a, #08a875);
}

.pre-card-icon-order {
  background: linear-gradient(135deg, #f8a21a, #ed8500);
}

.pre-card-icon-file {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
}

.pre-card-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.pre-card-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #111827;
}

.pre-card-desc {
  font-size: 26rpx;
  color: #9aa3af;
  line-height: 1.35;
}

.pre-card-status {
  flex-shrink: 0;
}

.pre-card-arrow {
  flex-shrink: 0;
  display: flex;
  align-items: center;
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
    background: rgba(var(--u-type-primary-rgb, 41, 121, 255), 0.08);
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
</style>