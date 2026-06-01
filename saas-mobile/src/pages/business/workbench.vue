<template>
  <layout :active-tab="0" navTitle="首页" show-tabbar>
    <view class="workbench">
      <view class="quick-actions">
        <view
          class="quick-card quick-card--lead"
          @click="goTo('/pages/business/leadAdd')"
        >
          <view class="quick-left">
            <view class="quick-title-row">
              <u-icon name="plus-circle" size="44" color="#fff" />
              <text class="quick-text">新增线索</text>
            </view>
            <text class="quick-sub">快速获客，扫码录入</text>
          </view>
          <view class="qr-icon" @click.stop="showQr('lead')">
            <u-icon
              name="erweima"
              custom-prefix="custom-icon"
              size="65"
              color="#fff"
            />
          </view>
        </view>

        <view class="quick-card" @click="goTo('/pages/business/idInfo')">
          <view class="quick-left">
            <view class="quick-title-row">
              <u-icon name="plus-circle" size="44" color="#fff" />
              <text class="quick-text">进件</text>
            </view>
            <text class="quick-sub">快速发起贷款申请</text>
          </view>
          <view class="qr-icon" @click.stop="showQr('credit')">
            <u-icon
              name="erweima"
              custom-prefix="custom-icon"
              size="65"
              color="#fff"
            />
          </view>
        </view>

        <view
          class="quick-card quick-card--pawn"
          @click="goTo('/pages/business/idInfo?businessType=pawn')"
        >
          <view class="quick-left">
            <view class="quick-title-row">
              <u-icon name="car" size="44" color="#fff" />
              <text class="quick-text">车辆典当</text>
            </view>
            <text class="quick-sub">扫码进件，资料审批</text>
          </view>
          <view class="qr-icon" @click.stop="showQr('pawn')">
            <u-icon
              name="erweima"
              custom-prefix="custom-icon"
              size="65"
              color="#fff"
            />
          </view>
        </view>
      </view>

      <view class="overview-panel">
        <view class="overview-head">
          <text class="overview-title">今日概览</text>
          <text class="overview-sub">SaaS业务看板</text>
        </view>
        <view class="overview-grid">
          <view
            v-for="item in overviewItems"
            :key="item.key"
            class="overview-item"
          >
            <text class="overview-value">{{ item.value }}</text>
            <text class="overview-label">{{ item.label }}</text>
          </view>
        </view>
      </view>

      <view class="todo-panel">
        <view class="overview-head">
          <text class="overview-title">待办中心</text>
          <text class="overview-sub">优先处理高时效任务</text>
        </view>
        <view class="todo-list">
          <view
            v-for="item in todoItems"
            :key="item.key"
            class="todo-item"
            @click="goTo(item.path)"
          >
            <view class="todo-left">
              <u-icon :name="item.icon" size="34" :color="item.color" />
              <text class="todo-title">{{ item.label }}</text>
            </view>
            <view class="todo-right">
              <text class="todo-count">{{ item.count }}</text>
              <u-icon name="arrow-right" size="24" color="#999" />
            </view>
          </view>
        </view>
      </view>

      <u-popup
        v-model="qrShow"
        mode="center"
        border-radius="16"
        :closeable="true"
        width="560rpx"
        @close="qrShow = false"
      >
        <view class="qr-popup">
          <text class="qr-title">{{ qrTitle }}</text>
          <u-image
            class="qr-img"
            :src="qrImgUrl"
            width="400rpx"
            height="400rpx"
            mode="aspectFit"
            border-radius="12"
          >
            <template #loading>
              <view class="qr-loading">
                <u-loading mode="circle" size="48" color="#5da7ff" />
                <text class="qr-loading-text">二维码生成中</text>
              </view>
            </template>
            <template #error>
              <view class="qr-error">
                <u-icon name="error-circle" size="48" color="#999" />
                <text class="qr-error-text">二维码生成失败</text>
              </view>
            </template>
          </u-image>
          <text class="qr-tip">{{ qrTipText }}</text>
        </view>
      </u-popup>

      <view
        v-for="(group, gi) in sections"
        :key="gi"
        class="section"
        :style="{ animationDelay: `${gi * 0.08}s` }"
      >
        <view class="section-title">{{ group.title }}</view>
        <view class="grid">
          <view
            v-for="(item, idx) in group.items"
            :key="idx"
            class="grid-item"
            :style="{ animationDelay: `${gi * 0.08 + idx * 0.04}s` }"
            @click="handleItem(item)"
          >
            <view class="icon-wrap">
              <u-icon :name="iconOf(item.icon)" size="40" :color="themeColor" />
              <u-badge v-if="item.badge" :value="item.badge" type="error" />
            </view>
            <text class="grid-text">{{ item.text }}</text>
          </view>
        </view>
      </view>
    </view>
  </layout>
</template>

<script setup>
import layout from "@/pages/layout/layout.vue";
import { $u, useTheme } from "uview-pro";
import { useBusinessApi } from "@/api/business";
import { useLocalStore } from "@/stores";
import { computed, onMounted, ref } from "vue";
import { isDev } from "@/common/env";

const { currentTheme } = useTheme();
const themeColor = computed(() => {
  return currentTheme.value?.color?.primary || "#409EFF";
});

const localStore = useLocalStore();
const businessApi = useBusinessApi();

const overview = ref({
  todayLeads: 0,
  todayApplications: 0,
  pendingSupplement: 0,
  pendingSigning: 0,
  pendingApproval: 0,
  monthLoanAmount: 0,
  approvalRate: "-",
});

const formatAmount = (amount) => {
  const value = Number(amount || 0);
  if (!value) return "0";
  return value >= 10000 ? `${(value / 10000).toFixed(1)}万` : String(value);
};

const overviewItems = computed(() => [
  { key: "todayLeads", label: "今日线索", value: overview.value.todayLeads || 0 },
  { key: "todayApplications", label: "今日进件", value: overview.value.todayApplications || 0 },
  { key: "pendingSupplement", label: "待补件", value: overview.value.pendingSupplement || 0 },
  { key: "pendingSigning", label: "待签约", value: overview.value.pendingSigning || 0 },
  {
    key: "monthLoanAmount",
    label: "本月放款",
    value: formatAmount(overview.value.monthLoanAmount),
  },
  { key: "approvalRate", label: "审批通过率", value: overview.value.approvalRate || "-" },
]);

const todoItems = computed(() => [
  {
    key: "supplement",
    label: "待补件",
    count: overview.value.pendingSupplement || 0,
    icon: "file-text",
    color: "#f59e0b",
    path: "/pages/business/supplementList",
  },
  {
    key: "signing",
    label: "待签约",
    count: overview.value.pendingSigning || 0,
    icon: "edit",
    color: "#22c55e",
    path: "/pages/business/faceSignList",
  },
  {
    key: "approval",
    label: "待审批",
    count: overview.value.pendingApproval || 0,
    icon: "time",
    color: "#409EFF",
    path: "/pages/business/approvalList",
  },
]);

const normalizeOverview = (data) => {
  const source = data?.data || data || {};
  overview.value = {
    ...overview.value,
    todayLeads: source.todayLeads || source.leadCountToday || source.leadsToday || 0,
    todayApplications:
      source.todayApplications || source.applicationCountToday || source.creditCountToday || 0,
    pendingSupplement: source.pendingSupplement || source.supplementCount || 0,
    pendingSigning: source.pendingSigning || source.signingCount || 0,
    pendingApproval: source.pendingApproval || source.approvalCount || 0,
    monthLoanAmount: source.monthLoanAmount || source.loanAmountMonth || 0,
    approvalRate: source.approvalRate || source.passRate || "-",
  };
};

const loadOverview = async () => {
  if (!localStore.token) return;
  try {
    const res = await businessApi.getStatisticsOverview();
    if (res?.code === 200) {
      normalizeOverview(res);
    }
  } catch (error) {
    console.warn("获取工作台统计失败", error);
  }
};

onMounted(loadOverview);

const checkAuth = () => {
  if (!localStore.token) {
    uni.showModal({
      title: "提示",
      content: "您尚未登录，是否前往登录？",
      success: (res) => {
        if (res.confirm) {
          uni.reLaunch({ url: "/pages/auth/login" });
        }
      },
    });
    return false;
  }
  return true;
};

const goTo = (url) => {
  if (!checkAuth()) return;
  uni.navigateTo({ url });
};

const handleItem = (item) => {
  if (!checkAuth()) return;
  if (item.path) {
    uni.navigateTo({ url: item.path });
    return;
  }
  $u.toast("功能开发中");
};

const FALLBACK_ICON = "question-circle";
const VALID_ICONS = new Set([
  "account",
  "arrow-right",
  "bag",
  "camera",
  "car",
  "chart",
  "chat",
  "chat-fill",
  "checkmark-circle",
  "edit",
  "file",
  "file-text",
  "folder",
  "grid",
  "handshake",
  "hourglass",
  "hourglass-half-fill",
  "info",
  "list",
  "location",
  "money-circle",
  "plus-circle",
  "question-circle",
  "return",
  "search",
  "send",
  "setting",
  "shopping-cart",
  "star",
  "time",
  "upload",
  "user",
  "warning",
]);

const iconOf = (name) => {
  return VALID_ICONS.has(name) ? name : FALLBACK_ICON;
};

const qrShow = ref(false);
const qrTitle = ref("");
const qrImgUrl = ref("");
const qrExpireAt = ref(0);

const QR_VALID_MS = 60 * 60 * 24 * 7 * 1000;
const QR_CONFIG = {
  lead: { title: "新增线索", path: "leadAdd" },
  credit: { title: "进件", path: "idInfo" },
  pawn: { title: "车辆典当进件", path: "idInfo", businessType: "pawn" },
};

const formatExpireTime = (timestamp) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${month}月${day}日 ${hours}:${minutes}`;
};

const qrTipText = computed(() => {
  const deadlineText = formatExpireTime(qrExpireAt.value);
  return deadlineText
    ? `该二维码7天内(${deadlineText})有效`
    : "客户扫码后可继续办理业务";
});

const showQr = (type) => {
  const config = QR_CONFIG[type] || QR_CONFIG.credit;
  qrTitle.value = config.title;
  const baseUrl =
    typeof window !== "undefined" && window.location
      ? window.location.origin
      : "";
  const salesmanId = localStore.userInfo?.userId;

  if (!salesmanId) {
    uni.showToast({
      title: "缺少业务员ID，无法生成二维码",
      icon: "none",
    });
    return;
  }

  qrExpireAt.value = Date.now() + QR_VALID_MS;
  const transferInfo = encodeURIComponent(
    JSON.stringify({
      path: config.path,
      businessType: config.businessType,
      salesmanId: String(salesmanId),
      roleTags: "客户",
    }),
  );

  const fullPath = `${baseUrl}/#/pages/auth/transfer?transferInfo=${transferInfo}`;
  qrImgUrl.value = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    fullPath,
  )}`;
  qrShow.value = true;
};

const DEV_ONLY_PATHS = new Set([
  "/pages/business/idInfo",
  "/pages/business/carInfo",
  "/pages/business/applyInfo",
  "/pages/business/applyResult",
  "/pages/business/idInfoSupplement",
  "/pages/business/carInfoSupplement",
  "/pages/business/orderInfoSupplement",
  "/pages/business/fileInfoSupplement",
  "/pages/business/entryList",
  "/pages/business/applyListPage",
]);

const sectionsRaw = [
  {
    title: "线索",
    items: [
      {
        text: "线索查询",
        icon: "search",
        path: "/pages/business/leadList",
      },
    ],
  },
  {
    title: "预审",
    items: [
      {
        text: "身份证信息",
        icon: "account",
        path: "/pages/business/idInfo",
      },
      {
        text: "车辆信息",
        icon: "car",
        path: "/pages/business/carInfo",
      },
      {
        text: "申请信息",
        icon: "file-text",
        path: "/pages/business/applyInfo",
      },
      {
        text: "申请结果",
        icon: "checkmark-circle",
        path: "/pages/business/applyResult",
      },
      {
        text: "进件列表",
        icon: "list",
        path: "/pages/business/entryList",
      },
      {
        text: "预审列表",
        icon: "file-text",
        path: "/pages/business/applyListPage",
      },
    ],
  },
  {
    title: "资料补充",
    items: [
      {
        text: "客户资料",
        icon: "account",
        path: "/pages/business/idInfoSupplement",
      },
      {
        text: "车辆资料",
        icon: "car",
        path: "/pages/business/carInfoSupplement",
      },
      {
        text: "订单信息",
        icon: "file-text",
        path: "/pages/business/orderInfoSupplement",
      },
      {
        text: "文件信息",
        icon: "file-text",
        path: "/pages/business/fileInfoSupplement",
      },
      {
        text: "补充列表",
        icon: "list",
        path: "/pages/business/supplementList",
      },
    ],
  },
  {
    title: "典当",
    items: [
      {
        text: "身份证信息",
        icon: "file-text",
        path: "/pages/business/idInfo?businessType=pawn",
      },
      {
        text: "车辆信息",
        icon: "car",
        path: "/pages/business/carInfo?businessType=pawn",
      },
      {
        text: "放款申请",
        icon: "money-circle",
        path: "/pages/business/pawnLoanInfo",
      },
      {
        text: "资料补充",
        icon: "file-text",
        path: "/pages/business/pawnMaterials",
      },
      {
        text: "审批池",
        icon: "list",
        path: "/pages/business/pawnApprovalList",
      },
    ],
  },
];

const sections = computed(() => {
  if (isDev) return sectionsRaw;

  return sectionsRaw
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !DEV_ONLY_PATHS.has(item.path)),
    }))
    .filter((group) => group.items.length > 0);
});
</script>

<style lang="scss" scoped>
.workbench {
  padding: 24rpx;
  background: linear-gradient(180deg, #f7f8f9 0%, #ffffff 100%);
}

.overview-panel,
.todo-panel {
  margin-bottom: 24rpx;
  padding: 28rpx;
  background: #fff;
  border-radius: 24rpx;
  box-shadow: 0 10rpx 30rpx rgba(15, 23, 42, 0.06);
}

.overview-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 22rpx;
}

.overview-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #1f2937;
}

.overview-sub {
  font-size: 22rpx;
  color: #8c8c8c;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
}

.overview-item {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  padding: 20rpx 14rpx;
  border-radius: 18rpx;
  background: linear-gradient(180deg, #f8fbff 0%, #f3f7ff 100%);
  text-align: center;
}

.overview-value {
  font-size: 32rpx;
  font-weight: 800;
  color: var(--u-type-primary);
}

.overview-label {
  font-size: 22rpx;
  color: #6b7280;
}

.todo-list {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.todo-item,
.todo-left,
.todo-right {
  display: flex;
  align-items: center;
}

.todo-item {
  justify-content: space-between;
  padding: 20rpx;
  border-radius: 16rpx;
  background: #f8fafc;
}

.todo-left {
  gap: 12rpx;
}

.todo-title {
  font-size: 26rpx;
  color: #1f2937;
}

.todo-right {
  gap: 8rpx;
}

.todo-count {
  font-size: 30rpx;
  font-weight: 800;
  color: #111827;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
  width: 100%;
  margin-bottom: 24rpx;
}

.quick-card {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  min-height: 140rpx;
  padding: 24rpx;
  border-radius: 20rpx;
  color: #fff;
  background: linear-gradient(135deg, #5da7ff, #6bd3ff);
  box-shadow: 0 12rpx 32rpx rgba(93, 167, 255, 0.3);
  position: relative;

  &--lead {
    background: linear-gradient(135deg, #52c41a, #73d13d);
    box-shadow: 0 12rpx 32rpx rgba(82, 196, 26, 0.3);
  }

  &--pawn {
    background: linear-gradient(135deg, #f97316, #facc15);
    box-shadow: 0 12rpx 32rpx rgba(249, 115, 22, 0.24);
  }
}

.quick-left {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  min-width: 0;
}

.quick-title-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.quick-text {
  font-size: 30rpx;
  font-weight: 700;
}

.quick-sub {
  font-size: 22rpx;
  opacity: 0.85;
}

.qr-icon {
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12rpx;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(4px);
  transition: all 0.2s ease;
  flex-shrink: 0;

  &:active {
    background: rgba(255, 255, 255, 0.35);
    transform: scale(0.92);
  }
}

.qr-popup {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48rpx 32rpx;
  gap: 24rpx;
}

.qr-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #1f1f1f;
}

.qr-loading,
.qr-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
}

.qr-loading-text,
.qr-error-text,
.qr-tip {
  font-size: 24rpx;
  color: #999;
}

.qr-img {
  width: 400rpx;
  height: 400rpx;
  border-radius: 12rpx;
}

.section {
  margin-top: 36rpx;
}

.section-title {
  margin-bottom: 20rpx;
  font-size: 30rpx;
  font-weight: 700;
  color: #1f2937;
}

.grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20rpx 16rpx;
}

.grid-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  padding: 18rpx 12rpx;
  border-radius: 12rpx;
  background: #fff;
  box-shadow: 0 6rpx 16rpx rgba(0, 0, 0, 0.04);
  animation: slideUp 0.4s ease-out both;
  transition: all 0.3s ease;

  &:active {
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

.icon-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.grid-text {
  font-size: 26rpx;
  color: $u-main-color;
}
</style>
