<script setup lang="ts">
import { onUnmounted } from "vue";
import { onLoad, onShow } from "@dcloudio/uni-app";
import { useCarloanApi } from "@/api/carloan";
import { useSessionStore } from "@/stores";
import { closeBrowser } from "@/composables/useCloseBrowser";
import { APP_ROUTES, buildRoute } from "@/common/navigation";
import { getBaseUrl, getHashQuery, safeDecode } from "./signing-url";
import { useSignSteps } from "@/composables/carloan/useSignSteps";
import { showConfirmDialog, showSuccessToast, showFailToast } from '@/composables/useGlobalLoadingToast'

const sessionStore = useSessionStore();
const businessApi = useCarloanApi();

const {
  customerInfo, isCreditMode, currentStep, loading, signingLoading,
  authorizeSignLoading, signRecordId, backUrl, authSignDone, contractSignDone,
  contractSignUrl, faceResult, contractFiles, stepList,
  saveSignProgress, saveEntryProgress, setCreditSteps, setFaceSignSteps,
  loadCustomerInfo, fetchCreditDetail, fetchCreditDetailByOrderId,
  refreshSignStatus, updateStepStatus, getStepClass, formatAmount,
} = useSignSteps();

const pageTitle = isCreditMode ? "授信认证" : "合同签署";

// ---- 人脸认证 ----
async function handleStartFaceSign() {
  if (!customerInfo.creditOrderId) { showFailToast("缺少订单编号"); return; }
  const ok = await showConfirmDialog({ title: '开始人脸认证', message: '请确认是本人操作' });
  if (!ok) return;
  signingLoading.value = true;
  try {
    const res = await businessApi.startFaceSign(customerInfo.creditOrderId);
    if (res?.code === 200 && res.data?.faceUrl) {
      // #ifdef H5
      window.location.href = res.data.faceUrl;
      // #endif
      // #ifdef APP-PLUS
      uni.navigateTo({ url: `/pages/common/webview?url=${encodeURIComponent(res.data.faceUrl)}` });
      // #endif
    } else {
      showFailToast("发起人脸失败");
    }
  } catch (err) {
    console.error("startFaceSign error:", err);
    showFailToast("发起人脸失败");
  } finally {
    signingLoading.value = false;
  }
}

async function handleCancel() {
  const ok = await showConfirmDialog({ title: '取消认证', message: '确定取消本次认证？' });
  if (ok) uni.navigateBack();
}

async function handleFaceResult() {
  updateStepStatus("face", "finish");
  saveSignProgress("AUTH_SIGNING");
  authSignDone.value = true;
  setFaceSignSteps("CONFIRMING_AMOUNT");
}

// ---- 签约授权 ----
async function handleAuthorizeSign() {
  if (!customerInfo.creditOrderId) { showFailToast("缺少订单编号"); return; }
  authorizeSignLoading.value = true;
  try {
    const res = await businessApi.authorizeSign(customerInfo.creditOrderId);
    if (res?.code === 200) {
      updateStepStatus("auth", "finish");
      authSignDone.value = true;
      saveSignProgress("SIGNING_PROGRESS");
      saveEntryProgress("AUTH_SIGN");
      setFaceSignSteps("BINDING_CARD");
      showSuccessToast("授权成功");
    } else {
      showFailToast(res?.msg || "授权失败");
    }
  } catch (err) {
    console.error("authorizeSign error:", err);
    showFailToast("授权失败");
  } finally {
    authorizeSignLoading.value = false;
  }
}

// ---- 合同签署 ----
async function handleSignContract() {
  if (!customerInfo.creditOrderId) { showFailToast("缺少订单编号"); return; }
  signingLoading.value = true;
  try {
    const res = await businessApi.signContract(customerInfo.creditOrderId);
    if (res?.code === 200 && res.data?.signUrl) {
      contractSignUrl.value = res.data.signUrl;
      updateStepStatus("contract", "doing");
      // #ifdef H5
      window.location.href = res.data.signUrl;
      // #endif
      // #ifdef APP-PLUS
      uni.navigateTo({ url: `/pages/common/webview?url=${encodeURIComponent(res.data.signUrl)}` });
      // #endif
    } else {
      showFailToast("签署发起失败");
    }
  } catch (err) {
    console.error("signContract error:", err);
    showFailToast("签署失败");
  } finally {
    signingLoading.value = false;
  }
}

async function handleStartContract() { await handleSignContract(); }

// ---- 导航 ----
function goBack() { closeBrowser(); uni.navigateBack(); }
function goToApplyList() { uni.reLaunch({ url: buildRoute(APP_ROUTES.carloan.precheck.orderList) }); }
function goToWorkbench() { uni.reLaunch({ url: buildRoute(APP_ROUTES.carloan.workbench) }); }

// ---- 生命周期 ----
onLoad((options: any = {}) => {
  const q = getHashQuery() || {};
  const merged = { ...options, ...q };
  if (merged.creditOrderId) customerInfo.creditOrderId = safeDecode(String(merged.creditOrderId));
  if (merged.uuid) customerInfo.uuid = safeDecode(String(merged.uuid));
  if (merged.customerName) customerInfo.name = safeDecode(String(merged.customerName));
  if (merged.customerPhone) customerInfo.phone = safeDecode(String(merged.customerPhone));
  if (merged.amount) customerInfo.amount = safeDecode(String(merged.amount));
  if (merged.backUrl) backUrl.value = safeDecode(String(merged.backUrl));
  isCreditMode.value = Boolean(merged.creditMode);
  if (customerInfo.creditOrderId) {
    loadCustomerInfo(customerInfo.creditOrderId);
    refreshSignStatus();
  } else if (customerInfo.uuid) {
    fetchCreditDetail(customerInfo.uuid).then((data: any) => {
      if (data) {
        customerInfo.name = data.customerName || data.name || "";
        customerInfo.creditOrderId = data.creditOrderId || "";
        loadCustomerInfo(customerInfo.creditOrderId);
        refreshSignStatus();
      }
    });
  }
});

onShow(() => { if (customerInfo.creditOrderId) refreshSignStatus(); });
onUnmounted(() => { closeBrowser(); });
</script>

<template>
  <app-page :nav-title="pageTitle" :show-nav-back="!isCustomerRole" :back-url="backUrl">
    <view class="video-face-sign-page">
      <!-- 客户信息卡片 -->
      <view class="customer-card">
        <view class="customer-header">
          <view class="avatar">{{ customerInfo.name?.charAt(0) || "?" }}</view>
          <view class="customer-meta">
            <text class="customer-name">{{ customerInfo.name }}</text>

            <text class="customer-id">
              授信单号：{{ customerInfo.creditOrderId }}
            </text>
          </view>
        </view>
        <view class="customer-info">
          <view class="info-item">
            <text class="label">手机号码</text>
            <text class="value">{{ customerInfo.phone }}</text>
          </view>
        </view>
      </view>

      <!-- 流程步骤 -->
      <view class="flow-card">
        <view class="card-title">{{
          isCreditMode ? "授信流程" : "合同签署流程"
        }}</view>
        <view class="step-list">
          <view
            v-for="(step, index) in stepList"
            :key="index"
            class="step-item"
            :class="getStepClass(step.status)"
          >
            <view class="step-icon">
              <u-icon
                v-if="step.status === 'finish'"
                name="checkmark-circle-fill"
                size="40"
                color="#52c41a"
              />
              <u-icon
                v-else-if="step.status === 'error'"
                name="close-circle-fill"
                size="40"
                color="#ff4d4f"
              />
              <u-icon
                v-else-if="step.status === 'doing'"
                name="checkmark-circle"
                size="40"
                color="var(--u-type-primary)"
              />
              <text v-else class="step-num">{{ index + 1 }}</text>
            </view>
            <view class="step-content">
              <text class="step-title">{{ step.title }}</text>
              <text class="step-desc">{{ step.desc }}</text>
            </view>
            <view
              v-if="index < stepList.length - 1"
              class="step-line"
              :class="`line-${step.status}`"
            />
          </view>
        </view>
      </view>

      <!-- 人脸识别结果 / 授信结果 -->
      <view v-if="faceResult.show" class="result-card">
        <view class="card-title">{{
          isCreditMode ? "授信结果" : "人脸识别结果"
        }}</view>

        <!-- 状态横幅 -->
        <view
          class="result-hero"
          :class="
            faceResult.status === 'success'
              ? 'hero-success'
              : faceResult.status === 'fail'
                ? 'hero-fail'
                : 'hero-checking'
          "
        >
          <u-icon
            v-if="faceResult.status === 'success'"
            name="checkmark-circle-fill"
            size="72"
            color="#fff"
          />
          <u-icon
            v-else-if="faceResult.status === 'fail'"
            name="close-circle-fill"
            size="72"
            color="#fff"
          />
          <u-icon v-else name="clock" size="72" color="#fff" />
          <text class="hero-text">{{ faceResult.statusText }}</text>
          <text v-if="faceResult.score" class="hero-sub">
            {{ faceResult.score }}%
          </text>
        </view>

        <!-- 结果详情 -->
        <view class="result-content">
          <view v-if="faceResult.score" class="result-row">
            <text class="label">相似度得分</text>
            <text class="value score-value">{{ faceResult.score }}%</text>
          </view>
          <view v-if="faceResult.msg" class="result-row msg-row">
            <text class="label">备注信息</text>
            <text class="value">{{ faceResult.msg }}</text>
          </view>
        </view>

        <!-- 失败时：重新识别按钮放在结果卡片内 -->
        <view
          v-if="currentStep === 1 && faceResult.status === 'fail'"
          class="result-actions"
        >
          <u-button
            type="warning"
            size="large"
            shape="circle"
            :loading="loading"
            class="retry-btn"
            @click="handleStartFaceSign"
          >
            重新识别
          </u-button>
        </view>
      </view>

      <!-- 签约文件列表 -->
      <view v-if="contractFiles.length > 0" class="result-card">
        <view class="card-title">签约文件</view>
        <view class="file-list">
          <view
            v-for="(file, index) in contractFiles"
            :key="index"
            class="file-item"
          >
            <u-icon name="file-text" size="36" color="var(--u-type-primary)" />
            <view class="file-info">
              <text class="file-name">{{ file.name }}</text>
              <text class="file-status">{{ file.status }}</text>
            </view>
            <u-tag
              :text="file.signed ? '已签署' : '待签署'"
              :type="file.signed ? 'success' : 'info'"
              size="mini"
            />
          </view>
        </view>
      </view>

      <!-- 底部操作区 -->
      <view class="action-area">
        <!-- 初始状态（授信模式直接显示授权签署按钮） -->
        <template v-if="currentStep === 0">
          <u-button
            v-if="isCreditMode && signRecordId"
            type="success"
            size="large"
            shape="circle"
            :loading="authorizeSignLoading"
            @click="handleAuthorizeSign"
          >
            授权签署
          </u-button>
          <u-button
            v-else
            type="primary"
            size="large"
            shape="circle"
            :loading="loading"
            @click="handleStartFaceSign"
          >
            {{ isCreditMode ? "开始授信" : "开始人脸识别" }}
          </u-button>
        </template>

        <!-- 人脸识别中 -->
        <u-button
          v-else-if="currentStep === 1 && faceResult.status === 'checking'"
          type="error"
          size="large"
          shape="circle"
          plain
          @click="handleCancel"
        >
          {{ isCreditMode ? "取消授信" : "取消面签" }}
        </u-button>

        <!-- 人脸识别通过：显示合同签约按钮（仅面签模式） -->
        <u-button
          v-else-if="currentStep === 2 && !isCreditMode"
          type="primary"
          size="large"
          shape="circle"
          :loading="loading"
          @click="handleStartContract"
        >
          合同签约
        </u-button>

        <!-- 合同签署中 -->
        <u-button
          v-else-if="currentStep === 3 && !isCreditMode"
          type="primary"
          size="large"
          shape="circle"
          disabled
          loading
        >
          合同签署中...
        </u-button>

        <!-- 全部完成 -->
        <view v-else-if="currentStep === 4" class="finish-box">
          <u-icon name="checkmark-circle-fill" size="80" color="#52c41a" />
          <text class="finish-text">{{
            isCreditMode ? "授信完成" : "面签完成"
          }}</text>

          <!-- 授信模式：签署状态展示 + 条件按钮 -->
          <template v-if="isCreditMode">
            <!-- 签署状态提示 -->
            <view
              v-if="authSignDone || contractSignDone"
              class="sign-status-bar"
            >
              <view v-if="authSignDone" class="status-tag done">
                <u-icon name="checkmark-circle-fill" size="28" color="#52c41a" />
                <text>授权签署已完成</text>
              </view>
              <view v-if="contractSignDone" class="status-tag done">
                <u-icon name="checkmark-circle-fill" size="28" color="#52c41a" />
                <text>授权书签署已完成</text>
              </view>
            </view>

            <u-button
              v-if="signRecordId && !authSignDone"
              type="success"
              size="large"
              shape="circle"
              :loading="authorizeSignLoading"
              @click="handleAuthorizeSign"
            >
              授权签署
            </u-button>
            <u-button
              v-if="!contractSignDone"
              type="primary"
              size="large"
              shape="circle"
              :loading="signingLoading"
              @click="handleSignContract"
            >
              {{ contractSignUrl ? "重新签署授权书" : "签署授权书" }}
            </u-button>
            <u-button
              v-if="contractSignDone"
              type="success"
              size="large"
              shape="circle"
              @click="isCustomerRole ? closeBrowser() : goToApplyList()"
            >
              {{ isCustomerRole ? "完成，关闭" : "完成，返回列表" }}
            </u-button>
            <u-button
              v-if="!contractSignDone"
              type="default"
              size="large"
              shape="circle"
              plain
              @click="isCustomerRole ? closeBrowser() : goToWorkbench()"
            >
              {{ isCustomerRole ? "关闭" : "返回首页" }}
            </u-button>
          </template>

          <!-- 面签模式：单按钮 -->
          <u-button
            v-else
            type="primary"
            size="large"
            shape="circle"
            @click="isCustomerRole ? closeBrowser() : goBack()"
          >
            {{ isCustomerRole ? "关闭" : "返回列表" }}
          </u-button>
        </view>
      </view>
    </view>

  </app-page>
</template>

<style lang="scss" scoped>
.video-face-sign-page {
  padding: 24rpx;
  background: linear-gradient(180deg, #f2f4f8 0%, #f8f9fb 100%);
  min-height: 100vh;
}

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
  gap: 24rpx;
  margin-bottom: 24rpx;
}

.avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  color: #fff;
  font-size: 36rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.customer-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.customer-name {
  font-size: 32rpx;
  font-weight: 700;
  color: #1f1f1f;
}

.customer-id {
  font-size: 24rpx;
  color: #8c8c8c;
}

.customer-info {
  display: flex;
  gap: 32rpx;
  flex-wrap: wrap;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.info-item .label {
  font-size: 22rpx;
  color: #8c8c8c;
}

.info-item .value {
  font-size: 26rpx;
  color: #262626;
  font-weight: 500;
}

/* ===== 流程步骤卡片 ===== */
.flow-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(15, 23, 42, 0.05);
}

.card-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #1f1f1f;
  margin-bottom: 24rpx;
}

.step-list {
  display: flex;
  flex-direction: column;
}

.step-item {
  display: flex;
  align-items: flex-start;
  gap: 20rpx;
  position: relative;
  padding-bottom: 32rpx;
}

.step-item:last-child {
  padding-bottom: 0;
}

.step-icon {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

.step-num {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  background: #f0f0f0;
  color: #8c8c8c;
  font-size: 24rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.step-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  padding-top: 4rpx;
}

.step-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #262626;
}

.step-desc {
  font-size: 22rpx;
  color: #8c8c8c;
}

.step-line {
  position: absolute;
  left: 24rpx;
  top: 48rpx;
  width: 2rpx;
  height: calc(100% - 48rpx);
  background: #e8e8e8;
}

.step-line.line-finish {
  background: #52c41a;
}

.step-line.line-doing {
  background: #1890ff;
}

.step-line.line-error {
  background: #ff4d4f;
}

/* ===== 结果卡片 ===== */
.result-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(15, 23, 42, 0.05);
}

.result-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
  padding: 48rpx 24rpx;
  border-radius: 16rpx;
  margin-bottom: 24rpx;
}

.hero-success {
  background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%);
}

.hero-fail {
  background: linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%);
}

.hero-checking {
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
}

.hero-text {
  font-size: 36rpx;
  font-weight: 700;
  color: #fff;
}

.hero-sub {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.85);
}

.result-content {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.result-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.result-row .label {
  font-size: 26rpx;
  color: #8c8c8c;
}

.result-row .value {
  font-size: 26rpx;
  color: #262626;
  font-weight: 500;
}

.score-value {
  color: #52c41a;
  font-weight: 700;
  font-size: 30rpx;
}

.msg-row .value {
  max-width: 400rpx;
  text-align: right;
}

.result-actions {
  margin-top: 24rpx;
}

.retry-btn {
  width: 100%;
}

/* ===== 文件列表 ===== */
.file-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 24rpx;
  background: #f8f9fb;
  border-radius: 20rpx;
}

.file-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.file-name {
  font-size: 26rpx;
  color: #262626;
  font-weight: 500;
}

.file-status {
  font-size: 22rpx;
  color: #8c8c8c;
}

/* ===== 底部操作 ===== */
.action-area {
  margin-top: 40rpx;
  padding-bottom: 40rpx;
}

.finish-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24rpx;
  padding: 48rpx 0;
}

.finish-text {
  font-size: 36rpx;
  font-weight: 700;
  color: #1f1f1f;
}

.sign-status-bar {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  width: 100%;
  margin-bottom: 24rpx;
}

.status-tag {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 16rpx 24rpx;
  border-radius: 12rpx;
  font-size: 26rpx;
}

.status-tag.done {
  background: rgba(82, 196, 26, 0.08);
  color: #52c41a;
}

/* ===== 深色模式适配 ===== */
@media (prefers-color-scheme: dark) {
  .video-face-sign-page {
    background: linear-gradient(180deg, #121212 0%, #1a1a1a 100%);
  }
  .customer-card,
  .flow-card,
  .result-card {
    background: #1e1e1e;
    box-shadow: 0 4rpx 20rpx rgba(15, 23, 42, 0.05);
  }
  .customer-name,
  .card-title,
  .step-title,
  .finish-text {
    color: #e5e6eb;
  }
  .customer-id,
  .step-desc,
  .file-status,
  .info-item .label,
  .result-row .label {
    color: #8b8c91;
  }
  .info-item .value,
  .result-row .value,
  .file-name {
    color: #e5e6eb;
  }
  .step-num {
    background: #2a2a2a;
    color: #8b8c91;
  }
  .step-line {
    background: #2a2a2a;
  }
  .file-item {
    background: #2a2a2a;
  }
  .status-tag.done {
    background: rgba(82, 196, 26, 0.12);
  }
}
</style>
