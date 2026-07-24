<template>
  <app-page nav-title="GPS安装预约" :back-url="backUrl">
    <view class="gps-page">
      <!-- 安装说明 -->
      <view class="intro-card">
        <u-icon name="car" size="48" color="var(--u-type-primary)" />
        <view class="intro-text">
          <text class="intro-title">GPS设备安装预约</text>
          <text class="intro-desc">
            为保障资金安全，贷款车辆需安装GPS定位设备。请预约安装时间和地点，我们将派专人上门安装。
          </text>
        </view>
      </view>

      <!-- 客户信息 -->
      <view class="customer-card">
        <view class="customer-header">
          <view class="avatar">{{ (customerName || "?").charAt(0) }}</view>
          <view class="customer-meta">
            <text class="customer-name">{{ customerName || "未知客户" }}</text>
            <text class="customer-phone">{{ customerPhone || "-" }}</text>
          </view>
        </view>
      </view>

      <!-- 预约表单 -->
      <view class="form-card">
        <view class="section-title">
          <text class="title-text">预约信息</text>
        </view>
        <AppForm :modelValue="form" :items="formItems" />
      </view>

      <!-- 安装须知 -->
      <view class="notice-card">
        <view class="notice-title">
          <u-icon name="info-circle" size="28" color="var(--u-type-primary)" />
          <text>安装须知</text>
        </view>
        <view class="notice-list">
          <text class="notice-item">1. 请确保车辆在预约时间内可正常启动</text>
          <text class="notice-item">2. 安装过程约30-60分钟，请预留充足时间</text>
          <text class="notice-item">3. 安装完成后请保存好安装凭证照片</text>
          <text class="notice-item">4. 如需改期，请提前24小时联系客服</text>
        </view>
      </view>

      <!-- 底部按钮 -->
      <view class="footer-actions">
        <u-button type="default" size="large" shape="circle" plain @click="goBack">
          上一步
        </u-button>
        <u-button
          type="primary"
          size="large"
          shape="circle"
          :loading="submitting"
          @click="handleSubmit"
        >
          提交预约
        </u-button>
      </view>
    </view>
  </app-page>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { useCarloanApi } from "@/api/carloan";
import { $u } from "uview-pro";
import AppForm from "@/components/app-form/app-form.vue";

const businessApi = useCarloanApi();
const SIGN_PROGRESS_STORAGE_KEY = "SIGN_PROGRESS_MAP";
const SIGN_GPS_STORAGE_KEY = "SIGN_GPS_APPOINTMENT_MAP";

const creditOrderId = ref("");
const uuidVal = ref("");
const customerName = ref("");
const customerPhone = ref("");
const submitting = ref(false);
const backUrl = ref("");
const currentYear = new Date().getFullYear();

const form = reactive({
  appointmentDate: "",
  appointmentTime: "",
  installAddress: "",
  contactName: "",
  contactPhone: "",
  remark: "",
});

function getStorageMap(key) {
  const value = uni.getStorageSync(key);
  return value && typeof value === "object" ? value : {};
}

function saveSignProgress(status) {
  if (!creditOrderId.value || !status) return;
  const progressMap = getStorageMap(SIGN_PROGRESS_STORAGE_KEY);
  progressMap[creditOrderId.value] = {
    ...(progressMap[creditOrderId.value] || {}),
    status,
    uuid: uuidVal.value,
    customerName: customerName.value,
    customerPhone: customerPhone.value,
    updatedAt: Date.now(),
  };
  uni.setStorageSync(SIGN_PROGRESS_STORAGE_KEY, progressMap);
}

function saveLocalAppointment() {
  if (!creditOrderId.value) return;
  const appointmentMap = getStorageMap(SIGN_GPS_STORAGE_KEY);
  appointmentMap[creditOrderId.value] = {
    creditOrderId: creditOrderId.value,
    uuid: uuidVal.value,
    ...form,
    updatedAt: Date.now(),
  };
  uni.setStorageSync(SIGN_GPS_STORAGE_KEY, appointmentMap);
}

const formItems = computed(() => [
  {
    key: "appointmentDate",
    label: "预约日期",
    placeholder: "请选择安装日期",
    type: "date",
    startYear: currentYear,
    endYear: currentYear + 2,
    required: true,
  },
  {
    key: "appointmentTime",
    label: "预约时间",
    placeholder: "请选择安装时间",
    type: "time",
    required: true,
  },
  {
    key: "installAddress",
    label: "安装地址",
    placeholder: "请输入车辆所在地址，例如小区/街道/门牌号",
    type: "textarea",
    required: true,
  },
  {
    key: "contactName",
    label: "联系人",
    placeholder: "请输入联系人姓名",
    required: true,
  },
  {
    key: "contactPhone",
    label: "联系电话",
    placeholder: "请输入联系人手机号",
    type: "number",
    required: true,
    maxlength: 11,
  },
  {
    key: "remark",
    label: "备注",
    placeholder: "选填，如有特殊说明请填写",
    type: "textarea",
    required: false,
  },
]);

onLoad((options) => {
  creditOrderId.value = options?.creditOrderId || "";
  uuidVal.value = options?.uuid || "";
  customerName.value = options?.customerName || "";
  customerPhone.value = options?.customerPhone || "";
  backUrl.value = options?.backUrl || "";
  form.contactName = customerName.value;
  form.contactPhone = customerPhone.value;
});

onMounted(() => {
  loadAppointment();
  loadDetail();
});

async function loadDetail() {
  if (!creditOrderId.value) return;
  try {
    const res = await businessApi.getCreditDetailByOrderId(creditOrderId.value);
    const d = res?.data || res || {};
    customerName.value = customerName.value || d.customerName || d.name || "";
    customerPhone.value =
      customerPhone.value || d.customerPhone || d.phone || d.telephone || "";
    form.contactName = form.contactName || customerName.value;
    form.contactPhone = form.contactPhone || customerPhone.value;
  } catch (e) {
    console.error("获取订单详情失败", e);
  }
}

async function loadAppointment() {
  try {
    const appointmentMap = getStorageMap(SIGN_GPS_STORAGE_KEY);
    const localAppointment = appointmentMap[creditOrderId.value];
    if (localAppointment) {
      Object.assign(form, localAppointment);
    }
  } catch (e) {
    console.error("获取预约信息失败", e);
  }
}

function goBack() {
  if (backUrl.value) {
    uni.redirectTo({ url: backUrl.value });
    return;
  }
  uni.navigateBack();
}

async function handleSubmit() {
  if (!form.appointmentDate) {
    $u.toast("请选择预约日期", "error");
    return;
  }
  if (!form.appointmentTime) {
    $u.toast("请选择预约时间", "error");
    return;
  }
  if (!form.installAddress.trim()) {
    $u.toast("请输入安装地址", "error");
    return;
  }
  if (!form.contactName.trim()) {
    $u.toast("请输入联系人", "error");
    return;
  }
  if (!/^1[3-9]\d{9}$/.test(form.contactPhone)) {
    $u.toast("请输入正确的联系电话", "error");
    return;
  }
  submitting.value = true;
  try {
    saveLocalAppointment();
    saveSignProgress("MORTGAGING");
    $u.toast("预约提交成功", "success");
    setTimeout(() => {
      goBack();
    }, 800);
  } catch {
    $u.toast("预约失败，请重试", "error");
  } finally {
    submitting.value = false;
  }
}
</script>

<style lang="scss" scoped>
.gps-page {
  min-height: 100%;
  padding: 24rpx 24rpx 160rpx;
  background: linear-gradient(180deg, #f2f4f8 0%, #f8f9fb 100%);
}

/* ===== 说明卡片 ===== */
.intro-card {
  display: flex;
  align-items: flex-start;
  gap: 20rpx;
  background: linear-gradient(135deg, #eff6ff, #ecfeff);
  border: 1rpx solid #dbeafe;
  border-radius: 20rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
}

.intro-text {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  flex: 1;
}

.intro-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #1e40af;
  display: block;
}

.intro-desc {
  font-size: 26rpx;
  color: var(--u-type-primary);
  line-height: 1.5;
  display: block;
}

/* ===== 客户卡片 ===== */
.customer-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(15, 23, 42, 0.05);
}

.customer-header {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, var(--u-type-primary), var(--u-type-primary-dark));
  flex-shrink: 0;
}

.customer-meta {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.customer-name {
  font-size: 30rpx;
  font-weight: 700;
  color: #1f2937;
}

.customer-phone {
  font-size: 24rpx;
  color: #6b7280;
}

/* ===== 表单卡片 ===== */
.form-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(15, 23, 42, 0.05);
}

.section-title {
  
}

.title-text {
  font-size: 30rpx;
  font-weight: 700;
  color: #1f2937;
}

/* ===== 须知卡片 ===== */
.notice-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(15, 23, 42, 0.05);
}

.notice-title {
  display: flex;
  align-items: center;
  gap: 12rpx;
  font-size: 28rpx;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 16rpx;
}

.notice-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.notice-item {
  font-size: 26rpx;
  color: #4b5563;
  line-height: 1.5;
}

/* ===== 底部按钮 ===== */
.footer-actions {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  gap: 18rpx;
  padding: 20rpx 32rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 4rpx 20rpx rgba(15, 23, 42, 0.05);

  :deep(.u-btn) {
    flex: 1;
  }
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
