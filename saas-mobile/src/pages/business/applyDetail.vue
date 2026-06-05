<template>
  <app-page nav-title="预审信息">
    <view v-if="detail" class="apply-detail-page">
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
import { ref, onMounted } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { useBusinessApi } from "@/api/business";

const businessApi = useBusinessApi();

const detail = ref(null);
const loading = ref(true);
let detailId = null;
const detailCreditOrderId = ref("");
const uuid = ref("");

onLoad((query) => {
  detailId = query.id;
  detailCreditOrderId.value = query.creditOrderId || query.orderNo || "";
});

onMounted(() => {
  if (detailCreditOrderId.value || detailId) {
    fetchDetail();
  }
});

async function fetchDetail() {
  loading.value = true;
  try {
    const res = detailCreditOrderId.value
      ? await businessApi.getCreditDetailByOrderId(detailCreditOrderId.value)
      : await businessApi.getCreditDetail(detailId);
    if (res?.code === 200) {
      // 详情接口返回结构可能是 res.data 或 res 本身
      detail.value = res.data || {};
      uuid.value = res.data?.uuid;
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
    客户信息: "/pages/business/idInfo",
    车辆信息: "/pages/business/carInfo",
  };

  uni.$u.route({
    url: editPath[type],
    type: "navigateTo",
    params: { uuid: uuid.value, id: detailId },
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
