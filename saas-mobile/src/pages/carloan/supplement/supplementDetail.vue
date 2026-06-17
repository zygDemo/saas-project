<template>
  <app-page nav-title="资料补充">
    <view class="supplement-detail-page">
      <!-- 客户信息卡片 -->
      <view class="customer-card">
        <view class="customer-header">
          <view class="avatar">
            {{ (customerName || "?").charAt(0) }}
          </view>
          <view class="customer-info">
            <text class="customer-name">{{
              customerName || "未命名客户"
            }}</text>
            <text class="customer-phone">{{ customerPhone || "-" }}</text>
          </view>
        </view>
        <view v-if="orderNo" class="order-row">
          <text class="order-label">订单号</text>
          <text class="order-value">{{ orderNo }}</text>
        </view>
      </view>

      <!-- 补充说明（来自接口备注） -->
      <view v-if="supplementRemark" class="remark-card">
        <view class="remark-label">
          <u-icon name="edit-pen" size="28" color="#f59e0b" />
          <text>补充说明</text>
        </view>
        <text class="remark-content">{{ supplementRemark }}</text>
      </view>

      <!-- 补充模块入口 -->
      <view class="section-title">需要补充的资料</view>

      <view class="supplement-grid">
        <view
          v-for="item in supplementItems"
          :key="item.type"
          class="supplement-card"
          :class="{ 'supplement-card--disabled': !canEditSupplement }"
          @click="goSupplement(item)"
        >
          <view class="card-icon-box" :class="item.iconClass">
            <u-icon :name="item.icon" size="44" color="#fff" />
          </view>
          <view class="card-body">
            <text class="card-title">{{ item.title }}</text>
            <text class="card-desc">{{ item.desc }}</text>
          </view>
          <view class="card-status">
            <u-tag
              :text="getStatusTag(suppStatus[item.key]).text"
              :type="getStatusTag(suppStatus[item.key]).type"
              size="mini"
              plain
            />
          </view>
          <view class="card-arrow">
            <u-icon name="arrow-right" size="28" color="#bfbfbf" />
          </view>
        </view>
      </view>

      <!-- 提交审批按钮 -->
      <view class="action-area">
        <u-button
          v-if="canEditSupplement"
          type="primary"
          size="large"
          shape="circle"
          :disabled="!allSupplied"
          :loading="submitting"
          @click="handleSubmitAudit"
        >
          {{ allSupplied ? "提交审批" : "请完善所有资料后提交" }}
        </u-button>
        <u-button
          v-else
          type="default"
          size="large"
          shape="circle"
          disabled
        >
          已提交审批
        </u-button>
      </view>
    </view>
  </app-page>
</template>

<script setup>
import { ref, computed } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { useCarloanApi } from "@/api/carloan";
import { $u } from "uview-pro";
import { APP_ROUTES, buildRoute, buildSupplementRouteQuery } from "@/common/navigation";

// 页面参数
const businessApi = useCarloanApi();

const customerName = ref("");
const customerPhone = ref("");
const orderNo = ref("");
const creditOrderId = ref("");
const uuidVal = ref("");
const supplementRemark = ref("");
const submitting = ref(false);
const pageLoading = ref(false);
const businessNode = ref("");
const canEditSupplement = computed(
  () => businessNode.value === "SUPPLEMENT_MATERIALS",
);

// 各模块补充状态: 1-已补充  2-待补充  其他-未知
const suppStatus = ref({
  customer: 0,
  vehicle: 0,
  order: 0,
  file: 0,
});

onLoad((options) => {
  creditOrderId.value = options?.creditOrderId || "";
  uuidVal.value = options?.uuid || "";
  if (creditOrderId.value) {
    loadCreditDetail();
  }
});

async function loadCreditDetail() {
  pageLoading.value = true;
  try {
    const res = await businessApi.getCreditDetailByOrderId(creditOrderId.value);
    if (res?.code === 200 && res.data) {
      const data = res.data;
      customerName.value = data.name || "";
      customerPhone.value = data.phone || "";
      orderNo.value = data.creditOrderId || "";
      uuidVal.value = data.uuid || uuidVal.value;
      supplementRemark.value = data.remark || "";
      suppStatus.value.customer = data.isSupplementCustomer || 0;
      suppStatus.value.vehicle = data.isSupplementVehicle || 0;
      suppStatus.value.order = data.isSupplementOrder || 0;
      suppStatus.value.file = data.isSupplementFile || 0;
      businessNode.value = data.businessNode || "";
    }
  } catch (e) {
    console.error("获取授信详情失败:", e);
    $u.toast("获取详情失败", "error");
  } finally {
    pageLoading.value = false;
  }
}

/** 根据状态值返回 tag 配置 */
function getStatusTag(val) {
  if (val === 1) return { text: "已补充", type: "success" };
  if (val === 2) return { text: "待补充", type: "warning" };
  return { text: "未知", type: "info" };
}

/** 补充模块列表 */
const supplementItems = computed(() => [
  {
    type: "idInfo",
    key: "customer",
    title: "客户资料",
    desc: "补充客户基本信息、联系方式等",
    icon: "account",
    iconClass: "card-icon-customer",
  },
  {
    type: "carInfo",
    key: "vehicle",
    title: "车辆资料",
    desc: "补充车辆品牌、型号、年限等",
    icon: "car",
    iconClass: "card-icon-car",
  },
  {
    type: "orderInfo",
    key: "order",
    title: "订单信息",
    desc: "补充申请金额、期限、产品等",
    icon: "order",
    iconClass: "card-icon-order",
  },
  {
    type: "fileInfo",
    key: "file",
    title: "文件信息",
    desc: "上传身份证、行驶证等材料",
    icon: "file-text",
    iconClass: "card-icon-file",
  },
]);

/** 是否全部已补充（4个模块都为 1 才可提交） */
const allSupplied = computed(() => {
  const s = suppStatus.value;
  return s.customer === 1 && s.vehicle === 1 && s.order === 1 && s.file === 1;
});

/** 提交审批（二次确认） */
async function handleSubmitAudit() {
  // if (!allSupplied.value || submitting.value) return;
  if (!creditOrderId.value) {
    uni.showToast({ title: "缺少订单编号", icon: "none" });
    return;
  }

  const { confirm } = await uni.showModal({
    title: "确认提交",
    content: "提交后将进入审批流程，确认提交吗？",
    confirmText: "确认提交",
    cancelText: "再等等",
  });
  if (!confirm) return;

  submitting.value = true;
  try {
    await businessApi.submitInitialAudit(creditOrderId.value);
    uni.showToast({ title: "提交成功", icon: "success" });
    setTimeout(() => {
      uni.redirectTo({ url: APP_ROUTES.carloan.supplement.supplementList });
    }, 1500);
  } catch (err) {
    console.error("提交审批失败:", err);
    uni.showToast({
      title: err?.data?.msg || "提交失败，请重试",
      icon: "none",
    });
  } finally {
    submitting.value = false;
  }
}

/** 跳转到对应的补充页面 */
function goSupplement(item) {
  const supplementRouteQuery = buildSupplementRouteQuery({
    uuid: uuidVal.value,
    creditOrderId: creditOrderId.value,
    readonly: !canEditSupplement.value ? 1 : undefined,
  });
  const urlMap = {
    idInfo: buildRoute(APP_ROUTES.carloan.supplement.idInfoSupplement, supplementRouteQuery),
    carInfo: buildRoute(APP_ROUTES.carloan.supplement.carInfoSupplement, supplementRouteQuery),
    orderInfo: buildRoute(APP_ROUTES.carloan.supplement.orderInfoSupplement, supplementRouteQuery),
    fileInfo: buildRoute(APP_ROUTES.carloan.supplement.fileInfoSupplement, supplementRouteQuery),
  };
  const url = urlMap[item.type];
  if (url) {
    uni.navigateTo({ url });
  }
}
</script>

<style lang="scss" scoped>
.supplement-detail-page {
  padding: 24rpx;
  background: linear-gradient(180deg, #f0f4f8 0%, #f8fafc 50%, #f1f5f9 100%);
  min-height: 100vh;
}

// ===== 客户信息卡片 =====
.customer-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.customer-header {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #5da7ff, #3b82f6);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}

.customer-info {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.customer-name {
  font-size: 34rpx;
  font-weight: 700;
  color: #1e293b;
}

.customer-phone {
  font-size: 26rpx;
  color: #94a3b8;
}

.order-row {
  display: flex;
  align-items: center;
  margin-top: 24rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #f1f5f9;
  gap: 12rpx;
}

.order-label {
  font-size: 24rpx;
  color: #94a3b8;
}

.order-value {
  font-size: 24rpx;
  color: #334155;
  font-family: "SF Mono", monospace;
}

// ===== 补充说明卡片 =====
.remark-card {
  background: #fffbeb;
  border: 1rpx solid #fde68a;
  border-radius: 16rpx;
  padding: 20rpx 24rpx;
  margin-bottom: 24rpx;
}

.remark-label {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 24rpx;
  color: #b45309;
  font-weight: 600;
  margin-bottom: 8rpx;
}

.remark-content {
  font-size: 26rpx;
  color: #92400e;
  line-height: 1.6;
}

// ===== 区域标题 =====
.section-title {
  position: relative;
  font-size: 30rpx;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 20rpx;
  padding-left: 22rpx;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 50%;
    width: 7rpx;
    height: 30rpx;
    border-radius: 8rpx;
    background: linear-gradient(180deg, #5da7ff, #3b82f6);
    transform: translateY(-50%);
  }
}

// ===== 补充模块网格 =====
.supplement-grid {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

// ===== 补充模块卡片 =====
.supplement-card {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.03);
  transition: all 0.2s ease;
  gap: 20rpx;

  &:active {
    background: #f8fafc;
    transform: scale(0.985);
  }
}

.supplement-card--disabled {
  opacity: 0.72;

  &:active {
    background: #fff;
    transform: none;
  }
}

.card-icon-box {
  width: 84rpx;
  height: 84rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-icon-customer {
  background: linear-gradient(135deg, #5da7ff, #3b82f6);
}

.card-icon-car {
  background: linear-gradient(135deg, #10b981, #059669);
}

.card-icon-order {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.card-icon-file {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
}

.card-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  min-width: 0;
}

.card-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #1e293b;
}

.card-desc {
  font-size: 24rpx;
  color: #94a3b8;
}

.card-status {
  flex-shrink: 0;
  margin-right: 8rpx;
}

.card-arrow {
  flex-shrink: 0;
}

// ===== 底部按钮 =====
.action-area {
  margin-top: 40rpx;
  padding-bottom: 40rpx;
}
</style>