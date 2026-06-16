<template>
  <app-page nav-title="抵押办理">
    <view class="mortgage-page">
      <!-- 说明卡片 -->
      <view class="intro-card">
        <u-icon name="file-text" size="48" color="#8b5cf6" />
        <view class="intro-text">
          <text class="intro-title">车辆抵押登记</text>
          <text class="intro-desc">
            为保障资金安全，贷款期间车辆需办理抵押登记。您可以选择自行前往车管所办理，或预约我们的协助服务。
          </text>
        </view>
      </view>

      <!-- 办理方式 -->
      <view class="type-card">
        <view class="section-title">
          <text class="title-text">选择办理方式</text>
        </view>
        <view class="type-list">
          <view
            v-for="(item, index) in typeOptions"
            :key="index"
            class="type-item"
            :class="{ selected: form.mortgageType === item.value }"
            @click="form.mortgageType = item.value"
          >
            <view class="type-icon-wrap" :class="`type-${item.value}`">
              <u-icon :name="item.icon" size="40" color="#fff" />
            </view>
            <view class="type-info">
              <text class="type-name">{{ item.label }}</text>
              <text class="type-desc">{{ item.desc }}</text>
            </view>
            <view class="type-check">
              <u-icon
                v-if="form.mortgageType === item.value"
                name="checkbox-mark"
                size="36"
                color="#8b5cf6"
              />
              <view v-else class="check-circle" />
            </view>
          </view>
        </view>
      </view>

      <!-- 预约/登记表单 -->
      <view class="form-card">
        <view class="section-title">
          <text class="title-text">办理信息</text>
        </view>
        <AppForm :modelValue="form" :items="formItems" />
      </view>

      <!-- 抵押回执上传 -->
      <view class="upload-card">
        <view class="section-title">
          <text class="title-text">抵押回执上传</text>
          <text class="title-sub">已办理的用户请上传抵押登记证明</text>
        </view>
        <view class="upload-grid">
          <view class="upload-item" @click="uploadImage('mortgageCert')">
            <view class="upload-box">
              <u-image
                v-if="files.mortgageCert"
                :src="files.mortgageCert"
                width="100%"
                height="200rpx"
                mode="aspectFill"
              />
              <view v-else class="upload-placeholder">
                <u-icon name="plus" size="42" color="#8b5cf6" />
                <text class="upload-text">抵押回执</text>
              </view>
            </view>
          </view>
          <view class="upload-item" @click="uploadImage('registerCert')">
            <view class="upload-box">
              <u-image
                v-if="files.registerCert"
                :src="files.registerCert"
                width="100%"
                height="200rpx"
                mode="aspectFill"
              />
              <view v-else class="upload-placeholder">
                <u-icon name="plus" size="42" color="#8b5cf6" />
                <text class="upload-text">登记证明</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 底部按钮 -->
      <view class="footer-actions">
        <u-button
          type="primary"
          size="large"
          shape="circle"
          :loading="submitting"
          @click="handleSubmit"
        >
          提交办理信息
        </u-button>
      </view>
    </view>
  </app-page>
</template>

<script setup>
import { ref, reactive, computed } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { useBusinessApi } from "@/api/business";
import { $u } from "uview-pro";
import AppForm from "@/components/app-form/app-form.vue";

const businessApi = useBusinessApi();
const SIGN_PROGRESS_STORAGE_KEY = "SIGN_PROGRESS_MAP";
const SIGN_MORTGAGE_STORAGE_KEY = "SIGN_MORTGAGE_MAP";

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
    customerName: form.contactName,
    customerPhone: form.contactPhone,
    updatedAt: Date.now(),
  };
  uni.setStorageSync(SIGN_PROGRESS_STORAGE_KEY, progressMap);
}

function saveLocalMortgage() {
  if (!creditOrderId.value) return;
  const mortgageMap = getStorageMap(SIGN_MORTGAGE_STORAGE_KEY);
  mortgageMap[creditOrderId.value] = {
    creditOrderId: creditOrderId.value,
    uuid: uuidVal.value,
    ...form,
    files: { ...files },
    updatedAt: Date.now(),
  };
  uni.setStorageSync(SIGN_MORTGAGE_STORAGE_KEY, mortgageMap);
}

function loadLocalMortgage() {
  if (!creditOrderId.value) return;
  const mortgageMap = getStorageMap(SIGN_MORTGAGE_STORAGE_KEY);
  const localMortgage = mortgageMap[creditOrderId.value];
  if (!localMortgage) return;
  Object.assign(form, localMortgage);
  if (localMortgage.files) Object.assign(files, localMortgage.files);
}

const creditOrderId = ref("");
const uuidVal = ref("");
const submitting = ref(false);

const form = reactive({
  mortgageType: "SELF",
  appointmentDate: "",
  appointmentTime: "",
  mortgageAddress: "",
  contactName: "",
  contactPhone: "",
  registerNo: "",
  remark: "",
});

const files = reactive({
  mortgageCert: "",
  registerCert: "",
});

const typeOptions = [
  {
    label: "自行前往车管所",
    value: "SELF",
    icon: "car",
    desc: "您自行到当地车管所办理抵押登记，完成后上传回执",
  },
  {
    label: "预约协助办理",
    value: "ASSIST",
    icon: "account",
    desc: "我们将派人协助您完成抵押登记手续",
  },
];

const formItems = computed(() => [
  {
    key: "appointmentDate",
    label: "办理/预约日期",
    placeholder: "请选择日期",
    type: "date",
    required: true,
  },
  {
    key: "appointmentTime",
    label: "办理/预约时间",
    placeholder: "请选择时间",
    type: "time",
    required: true,
  },
  {
    key: "mortgageAddress",
    label: "办理地点",
    placeholder: "请输入车管所或办理地点地址",
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
    key: "registerNo",
    label: "抵押登记号",
    placeholder: "已办理的请填写登记号，未办理可空",
    required: false,
  },
  {
    key: "remark",
    label: "备注",
    placeholder: "选填",
    type: "textarea",
    required: false,
  },
]);

onLoad((options) => {
  creditOrderId.value = options?.creditOrderId || "";
  uuidVal.value = options?.uuid || "";
  form.contactName = options?.customerName || "";
  form.contactPhone = options?.customerPhone || "";
  loadLocalMortgage();
});

function uploadImage(key) {
  uni.chooseImage({
    count: 1,
    sizeType: ["compressed"],
    sourceType: ["camera", "album"],
    success: (res) => {
      const path = res.tempFilePaths?.[0];
      if (path) {
        files[key] = path;
        $u.toast("上传成功", "success");
      }
    },
  });
}

async function handleSubmit() {
  if (!form.mortgageType) {
    $u.toast("请选择办理方式", "error");
    return;
  }
  if (!form.appointmentDate) {
    $u.toast("请选择日期", "error");
    return;
  }
  if (!form.appointmentTime) {
    $u.toast("请选择时间", "error");
    return;
  }
  if (!form.mortgageAddress.trim()) {
    $u.toast("请输入办理地点", "error");
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
    // TODO: 等待后端提供抵押办理提交接口
    // await businessApi.submitMortgage({
    //   creditOrderId: creditOrderId.value,
    //   uuid: uuidVal.value,
    //   ...form,
    //   files,
    // });

    saveLocalMortgage();
    saveSignProgress("SIGNED");
    $u.toast("提交成功", "success");
    setTimeout(() => {
      uni.navigateBack();
    }, 800);
  } catch (e) {
    $u.toast("提交失败，请重试", "error");
  } finally {
    submitting.value = false;
  }
}
</script>

<style lang="scss" scoped>
.mortgage-page {
  min-height: 100%;
  padding: 24rpx 24rpx 160rpx;
  background: linear-gradient(180deg, #f2f4f8 0%, #f8f9fb 100%);
}

/* ===== 说明卡片 ===== */
.intro-card {
  display: flex;
  align-items: flex-start;
  gap: 20rpx;
  background: linear-gradient(135deg, #ede9fe, #f3e8ff);
  border: 1rpx solid #d8b4fe;
  border-radius: 20rpx;
  padding: 28rpx;
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
  color: #5b21b6;
  display: block;
}

.intro-desc {
  font-size: 26rpx;
  color: #7c3aed;
  line-height: 1.5;
  display: block;
}

/* ===== 类型选择 ===== */
.type-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
}

.section-title {
  margin-bottom: 20rpx;
}

.title-text {
  font-size: 30rpx;
  font-weight: 700;
  color: #1f2937;
  display: block;
}

.title-sub {
  font-size: 24rpx;
  color: #6b7280;
  margin-top: 4rpx;
  display: block;
}

.type-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.type-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 24rpx;
  border-radius: 16rpx;
  border: 2rpx solid #e5e7eb;
  transition: all 0.25s;

  &.selected {
    border-color: #8b5cf6;
    background: #f5f3ff;
  }

  &:active {
    transform: scale(0.99);
  }
}

.type-icon-wrap {
  width: 72rpx;
  height: 72rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &.type-SELF {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
  }
  &.type-ASSIST {
    background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  }
}

.type-info {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  flex: 1;
  min-width: 0;
}

.type-name {
  font-size: 28rpx;
  font-weight: 700;
  color: #1f2937;
}

.type-desc {
  font-size: 24rpx;
  color: #6b7280;
  line-height: 1.4;
}

.type-check {
  flex-shrink: 0;
}

.check-circle {
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  border: 2rpx solid #d1d5db;
}

/* ===== 表单卡片 ===== */
.form-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
}

/* ===== 上传卡片 ===== */
.upload-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
}

.upload-grid {
  display: flex;
  gap: 20rpx;
}

.upload-item {
  flex: 1;
}

.upload-box {
  height: 200rpx;
  border: 2rpx dashed rgba(139, 92, 246, 0.35);
  border-radius: 18rpx;
  overflow: hidden;
  background: #f8f9fa;
}

.upload-placeholder {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
}

.upload-text {
  font-size: 24rpx;
  color: #8b5cf6;
}

/* ===== 底部按钮 ===== */
.footer-actions {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 20rpx 32rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.06);
}
</style>
