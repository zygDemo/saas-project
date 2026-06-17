<template>
  <app-page nav-title="签约列表">
    <view class="face-sign-page">
      <!-- 筛选栏 -->
      <view class="filter-box">
        <u-tabs
          :list="tabList"
          :current="currentTab"
          @click="onTabClick"
          line-height="6rpx"
          :bar-style="{ background: '#5da7ff' }"
        />
      </view>

      <!-- 面签列表 -->
      <view class="face-sign-list">
        <view
          v-for="(item, index) in list"
          :key="item.creditOrderId || item.uuid || item.id || index"
          class="face-sign-card"
          :class="`status-${getStatusType(item.status)}`"
          :style="{ animationDelay: `${index * 0.06}s` }"
          @click="goToDetail(item)"
        >
          <view class="face-sign-header">
            <view class="face-sign-name">
              <view class="avatar" :class="`avatar--${getStatusType(item.status)}`">
                {{ item.customerName?.charAt(0) || "?" }}
              </view>
              <view class="title-block">
                <text class="name">{{ item.customerName }}</text>
                <u-tag
                  :text="item.status"
                  :type="getStatusType(item.status)"
                  size="mini"
                  plain
                />
              </view>
            </view>
            <text class="face-sign-time">{{ item.appointmentTime }}</text>
          </view>

          <view class="face-sign-info">
            <view class="info-row">
              <view class="info-icon"><u-icon name="order" size="24" color="#8c8c8c" /></view>
              <text class="label">授信单号</text>
              <text class="value">{{ item.creditOrderId || item.id || "-" }}</text>
            </view>
            <view class="info-row">
              <view class="info-icon"><u-icon name="phone" size="24" color="#8c8c8c" /></view>
              <text class="label">联系电话</text>
              <text class="value">{{ item.customerPhone || "-" }}</text>
            </view>
            <view class="info-row">
              <view class="info-icon"><u-icon name="coupon" size="24" color="#8c8c8c" /></view>
              <text class="label">签约金额</text>
              <text class="value amount-value">￥{{ item.amount }}</text>
            </view>
            <view class="info-row">
              <view class="info-icon"><u-icon name="clock" size="24" color="#8c8c8c" /></view>
              <text class="label">更新时间</text>
              <text class="value">{{ item.appointmentTime }}</text>
            </view>
          </view>

          <view class="face-sign-footer">
            <text class="sales">{{ item.officerName }}</text>
            <u-button
              type="primary"
              size="mini"
              shape="circle"
              plain
              @click.stop="handleFaceSign(item)"
            >
              {{ item.status === "已完成" ? "查看签约" : "继续签约" }}
            </u-button>
          </view>
        </view>
      </view>

      <view v-if="loading" class="loading-state">
        <u-loading mode="circle" />
        <text>加载中...</text>
      </view>

      <!-- 空状态 -->
      <u-empty
        v-if="list.length === 0 && !loading"
        text="暂无签约记录"
        mode="list"
      />
    </view>
  </app-page>
</template>

<script setup>
import { ref } from "vue";
import { onLoad, onPullDownRefresh } from "@dcloudio/uni-app";
import { useCarloanApi } from "@/api/carloan";

const businessApi = useCarloanApi();
const currentTab = ref(0);
const loading = ref(false);
const allList = ref([]);
const list = ref([]);

const SIGN_PROGRESS_STORAGE_KEY = "SIGN_PROGRESS_MAP";
const SIGN_STATUS_LABEL_MAP = {
  CONFIRMING_AMOUNT: "待签约",
  BINDING_CARD: "待签约",
  SIGNING_CONTRACT: "待签约",
  GPS_APPOINTING: "待签约",
  MORTGAGING: "待签约",
  SIGNED: "已完成",
  CANCELLED: "已取消",
};

const tabList = [{ name: "待签约" }, { name: "已完成" }, { name: "已取消" }];

onLoad(() => {
  fetchList(true);
});

onPullDownRefresh(async () => {
  await fetchList(true);
  uni.stopPullDownRefresh();
});

function firstText(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return "";
}

function firstValue(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }
  return undefined;
}

function getProgressMap() {
  const value = uni.getStorageSync(SIGN_PROGRESS_STORAGE_KEY);
  return value && typeof value === "object" ? value : {};
}

function resolveSignStatus(row) {
  const orderId = firstText(row.creditOrderId, row.orderNo, row.applicationNo, row.id);
  const localStatus = getProgressMap()[orderId]?.status;
  if (localStatus) return localStatus;
  if (row.isSignContract === 1 || row.signStatus === "SIGNED") return "SIGNED";
  return row.signStatus || row.currentStatus || row.nodeStatus || "CONFIRMING_AMOUNT";
}

function resolveStatusLabel(signStatus) {
  return SIGN_STATUS_LABEL_MAP[signStatus] || "待签约";
}

function formatMoney(value) {
  const num = Number(value || 0);
  if (!Number.isFinite(num) || num <= 0) return "-";
  return num.toLocaleString("zh-CN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function extractRows(res) {
  const data = res?.data || {};
  if (Array.isArray(data.records)) return data.records;
  if (Array.isArray(data.rows)) return data.rows;
  if (Array.isArray(data.list)) return data.list;
  if (Array.isArray(data)) return data;
  if (Array.isArray(res?.rows)) return res.rows;
  if (Array.isArray(res?.records)) return res.records;
  return [];
}

function normalizeItem(row, index) {
  const creditOrderId = firstText(row.creditOrderId, row.orderNo, row.applicationNo, row.id);
  const signStatus = resolveSignStatus(row);
  return {
    id: row.id || creditOrderId || index,
    uuid: firstText(row.uuid, row.userUuid, row.customerUuid),
    creditOrderId,
    customerName: firstText(row.customerName, row.personName, row.name, "未知客户"),
    customerPhone: firstText(row.phone, row.telephone, row.mobile),
    amount: formatMoney(firstValue(row.approvedAmount, row.pushQuota, row.amount, row.loanAmount)),
    status: resolveStatusLabel(signStatus),
    signStatus,
    appointmentTime: firstText(row.updateTime, row.updatedAt, row.createTime, row.createdAt, "-"),
    officerName: firstText(row.officerName, row.salesmanName, row.funderName, "签约中心"),
    raw: row,
  };
}

function isSignRelated(row) {
  const node = String(row.nodeCode ?? row.currentNode ?? row.businessNode ?? "");
  const status = resolveSignStatus(row);
  if (status === "SIGNED") return true;
  if (["CONFIRMING_AMOUNT", "BINDING_CARD", "SIGNING_CONTRACT", "GPS_APPOINTING", "MORTGAGING"].includes(status)) return true;
  const numericNode = Number(node);
  return Number.isFinite(numericNode) && numericNode >= 4100;
}

function buildLocalMockList() {
  const progressMap = getProgressMap();
  return Object.keys(progressMap).map((creditOrderId, index) => {
    const item = progressMap[creditOrderId] || {};
    return normalizeItem({
      id: creditOrderId,
      creditOrderId,
      uuid: item.uuid,
      customerName: item.customerName || "本地签约客户",
      phone: item.customerPhone,
      signStatus: item.status,
      updatedAt: item.updatedAt ? new Date(item.updatedAt).toLocaleString("zh-CN") : "-",
    }, index);
  });
}

async function fetchList(isRefresh = false) {
  if (loading.value) return;
  loading.value = true;
  try {
    const params = {
      pageNum: 1,
      pageSize: 50,
    };
    const res = await businessApi.getOrderList(params);
    const rows = extractRows(res).filter(isSignRelated).map(normalizeItem);
    const localRows = buildLocalMockList();
    const mergedMap = new Map();
    [...rows, ...localRows].forEach((item) => {
      const key = item.creditOrderId || item.uuid || String(item.id);
      if (key) mergedMap.set(key, { ...(mergedMap.get(key) || {}), ...item });
    });
    allList.value = Array.from(mergedMap.values());
    applyFilter();
  } catch (e) {
    console.error("获取签约列表失败，使用本地mock兜底", e);
    allList.value = buildLocalMockList();
    applyFilter();
  } finally {
    loading.value = false;
  }
}

function getStatusType(status) {
  const typeMap = {
    待签约: "warning",
    已完成: "success",
    已取消: "error",
  };
  return typeMap[status] || "info";
}

function applyFilter() {
  const status = tabList[currentTab.value]?.name || "待签约";
  list.value = allList.value.filter((item) => item.status === status);
}

function onTabClick(item) {
  currentTab.value = typeof item === "number" ? item : item?.index || 0;
  applyFilter();
}

function buildSignCenterUrl(item) {
  const query = [
    `creditOrderId=${encodeURIComponent(item.creditOrderId || item.id || "")}`,
    `uuid=${encodeURIComponent(item.uuid || "")}`,
    `customerName=${encodeURIComponent(item.customerName || "")}`,
    `customerPhone=${encodeURIComponent(item.customerPhone || "")}`,
    `signStatus=${encodeURIComponent(item.signStatus || "CONFIRMING_AMOUNT")}`,
  ];
  return `/pages/carloan/signCenter?${query.join("&")}`;
}

function goToDetail(item) {
  handleFaceSign(item);
}

function handleFaceSign(item) {
  uni.navigateTo({
    url: buildSignCenterUrl(item),
  });
}
</script>

<style lang="scss" scoped>
// ===== 页面基础 =====
.face-sign-page {
  padding: 24rpx;
  background: linear-gradient(180deg, #f2f4f8 0%, #f8f9fb 100%);

}

.filter-box {
  margin-bottom: 24rpx;
  background: #fff;
  border-radius: 24rpx;
  padding: 8rpx 16rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

// ===== 列表区域 =====
.face-sign-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12rpx;
  padding: 40rpx 0;
  color: #8c8c8c;
  font-size: 26rpx;
}

// ===== 卡片 - 统一风格 =====
.face-sign-card {
  position: relative;
  background: #fff;
  border-radius: 24rpx;
  padding: 28rpx 28rpx 28rpx 36rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
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
    transition: background 0.3s ease;
  }

  // 不同状态对应不同色条
  &.status-warning::before { background: linear-gradient(180deg, #faad14, #ffc53d); }
  &.status-success::before { background: linear-gradient(180deg, #52c41a, #73d13d); }
  &.status-error::before { background: linear-gradient(180deg, #ff4d4f, #ff7875); }

  &:active {
    transform: scale(0.98);
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
  }
}

// ===== 卡片头部 =====
.face-sign-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.face-sign-name {
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

  &--warning { background: linear-gradient(135deg, #faad14, #ffc53d); }
  &--success { background: linear-gradient(135deg, #52c41a, #73d13d); }
  &--error { background: linear-gradient(135deg, #ff4d4f, #ff7875); }
  &--info { background: linear-gradient(135deg, #8c8c8c, #bfbfbf); }
}

.title-block {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex-wrap: wrap;
  min-width: 0;
}

.name {
  font-size: 32rpx;
  font-weight: 700;
  color: #1f1f1f;
  letter-spacing: 0.5rpx;
}

.face-sign-time {
  font-size: 24rpx;
  color: #8c8c8c;
  flex-shrink: 0;
  margin-left: 16rpx;
}

// ===== 信息区 =====
.face-sign-info {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
  margin-bottom: 20rpx;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  font-size: 26rpx;
  line-height: 1.5;
}

.info-icon {
  width: 36rpx;
  display: flex;
  justify-content: center;
  flex-shrink: 0;
}

.label {
  color: #8c8c8c;
  min-width: 120rpx;
}

.value {
  color: #262626;
  flex: 1;
  font-weight: 500;
  word-break: break-all;
}

.amount-value {
  color: #fa541c;
  font-weight: 700;
}

// ===== 底部 =====
.face-sign-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 20rpx;
  border-top: 1rpx solid #f0f0f0;
}

.sales {
  font-size: 24rpx;
  color: #8c8c8c;
}
</style>
