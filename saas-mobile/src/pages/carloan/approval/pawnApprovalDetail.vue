<template>
  <app-page nav-title="典当审批详情">
    <view v-if="application" class="detail-page">
      <view class="customer-card">
        <view class="customer-header">
          <view class="avatar">{{ customerInitial }}</view>
          <view class="customer-info">
            <text class="customer-name">{{ application.customerName }}</text>
            <text class="customer-phone">{{ application.phone }}</text>
            <text class="customer-meta">{{ application.plateNumber }} · {{ application.vehicleModel }}</text>
          </view>
          <u-tag
            :text="application.status === 'approved' ? '已放款' : '待审批'"
            :type="application.status === 'approved' ? 'success' : 'warning'"
            size="mini"
            plain
          />
        </view>
        <view class="summary-grid">
          <view class="summary-item">
            <text class="summary-label">放款金额</text>
            <text class="summary-value summary-value--amount">￥{{ formatMoney(application.loanInfo.loanAmount) }}</text>
          </view>
          <view class="summary-item">
            <text class="summary-label">车牌号</text>
            <text class="summary-value">{{ application.plateNumber }}</text>
          </view>
          <view class="summary-item">
            <text class="summary-label">月息</text>
            <text class="summary-value">{{ application.loanInfo.monthlyRate }}%</text>
          </view>
          <view class="summary-item">
            <text class="summary-label">停车费</text>
            <text class="summary-value">￥{{ formatMoney(application.loanInfo.parkingFee) }}</text>
          </view>
        </view>
        <view class="order-row">
          <text class="order-label">订单号</text>
          <text class="order-value">{{ application.id }}</text>
        </view>
      </view>

      <view class="section-title">
        <text>进件资料</text>
      </view>

      <view class="supplement-grid">
        <view
          v-for="item in entryCards"
          :key="item.key"
          class="supplement-card"
          @click="goSection(item.key)"
        >
          <view class="card-icon-box" :class="`card-icon-${item.theme}`">
            <u-icon :name="item.icon" size="48" color="#fff" />
          </view>
          <view class="card-body">
            <text class="card-title">{{ item.title }}</text>
            <text class="card-desc">{{ item.desc }}</text>
          </view>
          <view class="card-status">
            <u-tag :text="item.status.text" :type="item.status.type" size="mini" plain />
          </view>
          <view class="card-arrow">
            <u-icon name="arrow-right" size="28" color="#bfbfbf" />
          </view>
        </view>
      </view>

      <view v-if="application.status === 'approved'" class="section-block">
        <view class="section-title section-title--inner">
          <view class="title-mark" />
          <text>审批信息</text>
        </view>
        <view class="info-card">
          <view v-for="row in approvalRows" :key="row.label" class="info-row">
            <text class="label">{{ row.label }}</text>
            <text class="value">{{ row.value }}</text>
          </view>
        </view>
      </view>

      <view
        v-if="
          application.status === 'approved' && application.repaymentPlan?.length
        "
        class="section-block"
      >
        <view class="section-title section-title--inner">
          <view class="title-mark" />
          <text>还款计划</text>
        </view>
        <view class="plan-card">
          <view
            v-for="plan in application.repaymentPlan"
            :key="plan.period"
            class="plan-row"
          >
            <view>
              <text class="plan-title">第{{ plan.period }}期</text>
              <text class="plan-date">{{ plan.dueDate }}</text>
            </view>
            <text class="plan-amount">￥{{ formatMoney(plan.monthlyPayment) }}</text>
          </view>
        </view>
      </view>

      <view v-if="application.status === 'pending'" class="section-block">
        <view class="section-title section-title--inner">
          <view class="title-mark" />
          <text>审批处理</text>
        </view>
        <view class="approve-tip-card">
          <text class="approve-tip-text">请点击下方按钮填写客户分类、出账方式和审批备注。</text>
        </view>
      </view>

      <view class="footer-btn">
        <u-button
          v-if="application.status === 'pending'"
          type="primary"
          size="large"
          shape="circle"
          @click="approvalPopupVisible = true"
        >
          提交审批并生成还款计划
        </u-button>
        <u-button v-else type="default" size="large" shape="circle" disabled>
          已完成审批
        </u-button>
      </view>
    </view>

    <u-popup v-model="approvalPopupVisible" mode="bottom" :round="24">
      <view class="approval-popup">
        <view class="popup-head">
          <text class="popup-title">审批处理</text>
          <u-icon name="close" size="32" color="#94a3b8" @click="approvalPopupVisible = false" />
        </view>
        <AppForm :modelValue="approvalForm" :items="approvalItems" />
        <u-button type="primary" shape="circle" @click="submitApproval">
          确认提交
        </u-button>
      </view>
    </u-popup>
  </app-page>
</template>

<script setup>
import { computed, reactive, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { $u } from "uview-pro";
import AppForm from "@/components/app-form/app-form.vue";
import {
  createPawnRepaymentPlan,
  formatMoney,
  getDefaultPawnApplications,
  getNowText,
  getPawnApplication,
  upsertPawnApplication,
} from "@/common/pawnMock";
import { APP_ROUTES, buildRoute } from "@/common/navigation";
import { buildEntryRouteQuery } from "@/common/carloan-route-query";

const application = ref(null);
const approvalPopupVisible = ref(false);
const approvalForm = reactive({
  customerType: "",
  paymentMethod: "",
  approvalRemark: "",
});

const approvalItems = [
  {
    key: "customerType",
    label: "客户分类",
    placeholder: "请选择客户分类",
    type: "select",
    required: true,
    options: [
      { label: "内部", value: "内部" },
      { label: "外部", value: "外部" },
    ],
  },
  {
    key: "paymentMethod",
    label: "出账方式",
    placeholder: "请选择出账方式",
    type: "select",
    required: true,
    options: ["锦通公账", "微信", "支付宝", "银行卡", "其他"].map((item) => ({
      label: item,
      value: item,
    })),
  },
  {
    key: "approvalRemark",
    label: "备注",
    placeholder: "请输入备注",
    type: "textarea",
  },
];

const customerInitial = computed(
  () => application.value?.customerName?.charAt(0) || "?",
);

const uploadedMaterialCount = computed(() => {
  if (!application.value) return 0;
  return application.value.materials.filter((item) => item.files.length > 0)
    .length;
});

const requiredMaterialCount = computed(() => {
  if (!application.value) return 0;
  return application.value.materials.filter((item) => item.required).length;
});

const requiredMaterialReady = computed(() => {
  if (!application.value) return false;
  return application.value.materials
    .filter((item) => item.required)
    .every((item) => item.files.length > 0);
});

function doneTag(done) {
  return done
    ? { text: "已补充", type: "success" }
    : { text: "待补充", type: "warning" };
}

const entryCards = computed(() => [
  {
    key: "customer",
    title: "客户资料",
    desc: "查看客户身份、联系方式等",
    icon: "account",
    theme: "blue",
    status: doneTag(true),
  },
  {
    key: "vehicle",
    title: "车辆资料",
    desc: "查看车辆品牌、型号、车牌等",
    icon: "car",
    theme: "green",
    status: doneTag(true),
  },
  {
    key: "materials",
    title: "申请资料",
    desc: `已上传${uploadedMaterialCount.value}项，必传${requiredMaterialCount.value}项`,
    icon: "file-text",
    theme: "purple",
    status: doneTag(requiredMaterialReady.value),
  },
  {
    key: "loan",
    title: "放款信息",
    desc: "查看放款金额、月息、停车费等",
    icon: "order",
    theme: "orange",
    status: doneTag(true),
  },
]);

const approvalRows = computed(() => [
  {
    label: "客户分类",
    value: application.value?.approvalInfo?.customerType || "-",
  },
  {
    label: "出账方式",
    value: application.value?.approvalInfo?.paymentMethod || "-",
  },
  { label: "放款时间", value: application.value?.loanTime || "-" },
  {
    label: "审批备注",
    value: application.value?.approvalInfo?.approvalRemark || "无",
  },
]);

onLoad((options) => {
  const id = options?.id || "";
  application.value =
    getPawnApplication(id) ||
    getDefaultPawnApplications().find((item) => item.id === id) ||
    null;

  if (!application.value) {
    $u.toast("未找到审批任务", "error");
    setTimeout(() => uni.navigateBack(), 800);
  }
});

function goSection(section) {
  const routeMap = {
    customer: buildRoute(APP_ROUTES.carloan.precheck.idInfo, buildEntryRouteQuery({ businessType: "pawn" })),
    vehicle: buildRoute(APP_ROUTES.carloan.precheck.carInfo, buildEntryRouteQuery({ businessType: "pawn" })),
    materials: APP_ROUTES.carloan.approval.pawnMaterials,
    loan: APP_ROUTES.carloan.approval.pawnLoanInfo,
  };
  const url = routeMap[section];
  if (!url) return;
  uni.navigateTo({ url });
}

function submitApproval() {
  if (!approvalForm.customerType) {
    $u.toast("请选择客户分类", "error");
    return;
  }
  if (!approvalForm.paymentMethod) {
    $u.toast("请选择出账方式", "error");
    return;
  }

  application.value = {
    ...application.value,
    status: "approved",
    loanTime: getNowText(),
    approvalInfo: { ...approvalForm },
    repaymentPlan: createPawnRepaymentPlan(application.value.loanInfo),
  };
  upsertPawnApplication(application.value);
  approvalPopupVisible.value = false;

  $u.toast("审批已提交", "success");
}
</script>

<style lang="scss" scoped>
.detail-page {
  min-height: 100%;
  padding: 24rpx 24rpx 80rpx;
  background: linear-gradient(180deg, #f0f4f8 0%, #f8fafc 50%, #f1f5f9 100%);
}

.customer-card {
  padding: 24rpx;
  margin-bottom: 40rpx;
  border-radius: 24rpx;
  background: #fff;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.customer-header {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.avatar {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #fff;
  font-size: 28rpx;
  font-weight: 700;
  background: linear-gradient(135deg, #5da7ff, #3b82f6);
}

.customer-info {
  flex: 1;
  min-width: 0;
}

.customer-name,
.customer-phone {
  display: block;
}

.customer-name {
  font-size: 32rpx;
  font-weight: 700;
  color: #1e293b;
}

.customer-phone {
  margin-top: 4rpx;
  font-size: 24rpx;
  color: #94a3b8;
}

.customer-meta {
  display: block;
  margin-top: 4rpx;
  font-size: 22rpx;
  color: #64748b;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14rpx;
  margin-top: 18rpx;
}

.summary-item {
  padding: 14rpx 16rpx;
  border-radius: 16rpx;
  background: #f8fafc;
}

.summary-label,
.summary-value {
  display: block;
}

.summary-label {
  font-size: 20rpx;
  color: #94a3b8;
}

.summary-value {
  margin-top: 6rpx;
  font-size: 26rpx;
  font-weight: 700;
  color: #1e293b;
}

.summary-value--amount {
  color: #dc2626;
}

.order-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-top: 18rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid #f1f5f9;
}

.order-label {
  font-size: 22rpx;
  color: #94a3b8;
}

.order-value {
  font-size: 22rpx;
  color: #334155;
  font-family: "SF Mono", monospace;
}

.supplement-grid {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.supplement-card {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 28rpx 24rpx;
  border-radius: 20rpx;
  background: #fff;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.03);

  &:active {
    background: #f8fafc;
    transform: scale(0.985);
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

.card-icon-blue {
  background: linear-gradient(135deg, #5da7ff, #3b82f6);
}

.card-icon-green {
  background: linear-gradient(135deg, #10b981, #059669);
}

.card-icon-orange {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.card-icon-purple {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
}

.card-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.card-title,
.card-desc {
  display: block;
}

.card-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #1e293b;
}

.card-desc {
  font-size: 24rpx;
  color: #94a3b8;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-status {
  flex-shrink: 0;
  margin-right: 8rpx;
}

.card-arrow {
  flex-shrink: 0;
}

.section-block {
  margin-top: 32rpx;
}

.approve-tip-card {
  padding: 24rpx;
  border-radius: 20rpx;
  background: #fff;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.03);
}

.approve-tip-text {
  font-size: 25rpx;
  line-height: 1.7;
  color: #64748b;
}

.info-card,
.plan-card {
  padding: 12rpx 24rpx;
  border-radius: 20rpx;
  background: #fff;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.03);
}

.info-row,
.plan-row {
  display: flex;
  justify-content: space-between;
  gap: 24rpx;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #eef2f7;
}

.info-row:last-child,
.plan-row:last-child {
  border-bottom: 0;
}

.label {
  flex-shrink: 0;
  font-size: 26rpx;
  color: #7c8aa5;
}

.value {
  font-size: 26rpx;
  color: #111827;
  text-align: right;
  word-break: break-all;
}

.plan-title,
.plan-date {
  display: block;
}

.plan-title {
  font-size: 27rpx;
  font-weight: 700;
  color: #111827;
}

.plan-date {
  margin-top: 6rpx;
  font-size: 23rpx;
  color: #94a3b8;
}

.plan-amount {
  font-size: 28rpx;
  font-weight: 800;
  color: #2563eb;
}

.approval-popup {
  padding: 28rpx 24rpx calc(32rpx + env(safe-area-inset-bottom));
  background: #fff;
}

.popup-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12rpx;
}

.popup-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #1e293b;
}
</style>