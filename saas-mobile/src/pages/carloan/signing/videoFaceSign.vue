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

    <!-- 跳转确认弹窗 -->
    <app-confirm ref="confirmRef" />
  </app-page>
</template>

<script setup>
import { computed, ref, reactive, onUnmounted } from "vue";
import { onLoad, onShow } from "@dcloudio/uni-app";
import { useCarloanApi } from "@/api/carloan";
import { useConfirm } from "@/composables/useConfirm";
import { useSessionStore } from "@/stores";
import { closeBrowser } from "@/composables/useCloseBrowser";
import { APP_ROUTES, buildHashRoute, buildRoute } from "@/common/navigation";
import { buildNavTitleQuery } from "@/common/carloan-route-query";
import { getBaseUrl, getHashQuery, safeDecode } from "./signing-url";

const { confirmRef, confirm } = useConfirm();
const sessionStore = useSessionStore();

// ========== 响应式数据 ==========

const businessApi = useCarloanApi();
const SIGN_PROGRESS_STORAGE_KEY = "SIGN_PROGRESS_MAP";
const ENTRY_PROGRESS_STORAGE_KEY = "ENTRY_PROGRESS_MAP";

const customerInfo = reactive({
  name: "",
  idCard: "",
  phone: "",
  amount: "",
  rawAmount: "",
  uuid: "",
  creditOrderId: "",
});

function saveSignProgress(status) {
  if (!customerInfo.creditOrderId || !status) return;
  const progressMap = uni.getStorageSync(SIGN_PROGRESS_STORAGE_KEY) || {};
  progressMap[customerInfo.creditOrderId] = {
    ...(progressMap[customerInfo.creditOrderId] || {}),
    status,
    uuid: customerInfo.uuid,
    customerName: customerInfo.name,
    customerPhone: customerInfo.phone,
    updatedAt: Date.now(),
  };
  uni.setStorageSync(SIGN_PROGRESS_STORAGE_KEY, progressMap);

  if (status === "SIGNED") {
    const entryProgressMap =
      uni.getStorageSync(ENTRY_PROGRESS_STORAGE_KEY) || {};
    entryProgressMap[customerInfo.creditOrderId] = {
      ...(entryProgressMap[customerInfo.creditOrderId] || {}),
      AUTH_SIGN: 1,
    };
    if (customerInfo.uuid) {
      entryProgressMap[customerInfo.uuid] = {
        ...(entryProgressMap[customerInfo.uuid] || {}),
        AUTH_SIGN: 1,
      };
    }
    uni.setStorageSync(ENTRY_PROGRESS_STORAGE_KEY, entryProgressMap);
  }
}

const isCustomerRole = computed(() => {
  const roleTags = String(sessionStore.transferInfo?.roleTags || "");
  return roleTags === "客户" || roleTags.includes("客户");
});

// 页面标题：区分面签和授信
const pageTitle = ref("授信认证");

// 模式判断：有 creditOrderId 表示授信模式，否则为面签模式
const isCreditMode = ref(false);

const currentStep = ref(0);
const loading = ref(false);
const signingLoading = ref(false);
const authorizeSignLoading = ref(false);
const signRecordId = ref(null);
const backUrl = ref("");

// 签署状态追踪
const authSignDone = ref(false); // 授权签署是否完成
const contractSignDone = ref(false); // 授权书签署是否完成
const contractSignUrl = ref(""); // 三方签署URL（用于重试）

const stepList = reactive([]);

/** 授信模式步骤 */
function setCreditSteps() {
  stepList.length = 0;
  stepList.push(
    { title: "准备授信", desc: "确认客户信息", status: "doing" },
    { title: "人脸识别", desc: "进行人脸核验", status: "wait" },
    { title: "授信完成", desc: "授信结果确认", status: "wait" },
    { title: "签署授权书", desc: "在线签署授权文件", status: "wait" },
  );
}

/** 面签模式步骤 */
function setFaceSignSteps() {
  stepList.length = 0;
  stepList.push(
    { title: "准备签署", desc: "确认客户信息", status: "doing" },
    { title: "人脸识别", desc: "先完成人脸核验", status: "wait" },
    { title: "合同签署", desc: "在线签署合同", status: "wait" },
    { title: "签署结果", desc: "签署结果确认", status: "wait" },
  );
}

const faceResult = reactive({
  show: false,
  status: "checking",
  statusText: "识别中...",
  score: "",
  msg: "",
});

const contractFiles = reactive([]);

// ========== 生命周期 ==========

onLoad(async (options = {}) => {
  // H5 下直接从 hash 解析参数，避免 uni-app onLoad options 解析不全
  const query = { ...getHashQuery(), ...options };

  const uuid = query.uuid || "";
  const name = query.name || "";
  const phone = query.phone || "";
  const amount = query.amount || "";
  const idCard = query.idCard || "";
  const optCreditOrderId = query.creditOrderId || "";
  const orderId = query.orderId || "";
  const type = query.type || "";
  backUrl.value = query.backUrl || "";

  console.warn("[videoFaceSign] query:", {
    uuid,
    type,
    creditOrderId: optCreditOrderId,
    orderId,
    name,
  });

  if (!uuid && !orderId && !optCreditOrderId) {
    uni.showToast({ title: "参数错误，缺少 uuid", icon: "none" });
    setTimeout(() => goBack(), 1500);
    return;
  }

  let detailInfo = {};
  if (orderId || optCreditOrderId) {
    try {
      const detail = orderId
        ? await fetchCreditDetail(orderId)
        : await fetchCreditDetailByOrderId(optCreditOrderId);
      detailInfo = detail || {};
      if (detailInfo.signRecordId) {
        signRecordId.value = detailInfo.signRecordId;
      }
      if (detailInfo.authSignStatus === 1 || detailInfo.isAuthSigned) {
        authSignDone.value = true;
      }
      if (detailInfo.contractSignStatus === 1 || detailInfo.isContractSigned) {
        contractSignDone.value = true;
      }
    } catch (e) {
      console.error("获取授信详情失败:", e);
    }
  }

  const resolvedUuid = uuid || detailInfo.uuid || "";
  if (!resolvedUuid) {
    uni.showToast({ title: "参数错误，缺少 uuid", icon: "none" });
    setTimeout(() => goBack(), 1500);
    return;
  }

  loadCustomerInfo({
    uuid: resolvedUuid,
    name: detailInfo.customerName || detailInfo.name || name,
    phone: detailInfo.phone || detailInfo.telephone || phone,
    amount: detailInfo.amount || detailInfo.loanAmount || amount,
    idCard,
    creditOrderId: optCreditOrderId || detailInfo.creditOrderId || "",
    type,
  });

  if (authSignDone.value && contractSignDone.value) {
    currentStep.value = 4;
    updateStepStatus(4);
  } else if (authSignDone.value || contractSignDone.value) {
    if (isCreditMode.value) {
      currentStep.value = 4;
      updateStepStatus(3);
    }
  }
});

onShow(() => {
  // 处理从人脸识别/合同签署回调返回的结果
  const hashQuery = getHashQuery();
  const hasFaceResult = hashQuery.faceResult || hashQuery.passed || hashQuery.score;

  if (hasFaceResult && currentStep.value <= 1) {
    const passed =
      hashQuery.faceResult === "success" ||
      hashQuery.passed === "true" ||
      hashQuery.passed === "1";
    handleFaceResult({
      passed,
      score: hashQuery.score || "",
      msg: safeDecode(hashQuery.msg || hashQuery.message || "") || "",
    });
    return;
  }

  // 处理从授权书签署回调返回的结果
  const hasContractResult =
    hashQuery.contractResult || hashQuery.signStatus || hashQuery.contractSignStatus;
  if (hasContractResult && isCreditMode.value) {
    const signStatus =
      hashQuery.contractResult === "success" ||
      hashQuery.signStatus === "1" ||
      hashQuery.signStatus === "success";
    if (signStatus) {
      contractSignDone.value = true;
      saveSignProgress("SIGNED");
      currentStep.value = 4;
      updateStepStatus(4);
      refreshSignStatus();
    }
    return;
  }

  // 已在完成步骤时，刷新签署状态
  if (currentStep.value === 4 && isCreditMode.value && customerInfo.creditOrderId) {
    refreshSignStatus();
  }
});

onUnmounted(() => {});

function loadCustomerInfo(params) {
  customerInfo.uuid = params.uuid;
  customerInfo.name = safeDecode(params.name) || "未知客户";
  customerInfo.idCard = params.idCard || "";
  customerInfo.phone = safeDecode(params.phone) || "-";
  customerInfo.rawAmount = safeDecode(params.amount) || "0";
  customerInfo.amount = formatAmount(customerInfo.rawAmount);
  customerInfo.creditOrderId = params.creditOrderId || "";

  if (params.type === "contract") {
    saveSignProgress("SIGNING_CONTRACT");
    pageTitle.value = "合同签署";
    isCreditMode.value = false;
    setFaceSignSteps();
    currentStep.value = 0;
    faceResult.show = false;
    return;
  }

  saveSignProgress("FACE_SIGNING");
  pageTitle.value = "授信认证";
  isCreditMode.value = true;
  setCreditSteps();
  currentStep.value = 0;
  faceResult.show = false;
}

async function fetchCreditDetail(orderId) {
  try {
    const res = await businessApi.getCreditDetail(orderId);
    return (res?.data || res) || {};
  } catch (e) {
    console.error("fetchCreditDetail error:", e);
    return {};
  }
}

async function fetchCreditDetailByOrderId(creditOrderId) {
  try {
    const res = await businessApi.getCreditDetailByOrderId(creditOrderId);
    return (res?.data || res) || {};
  } catch (e) {
    console.error("fetchCreditDetailByOrderId error:", e);
    return {};
  }
}

async function refreshSignStatus() {
  if (!customerInfo.creditOrderId) return;
  try {
    const res = await businessApi.getAuthContractDetail(customerInfo.creditOrderId);
    const data = (res?.data || res) || {};
    const status = Number(data.status || 1);
    if (status === 1) {
      contractSignDone.value = true;
      saveSignProgress("SIGNED");
      const fileList = data.fileList || data.files || [];
      if (fileList.length > 0) {
        contractFiles.length = 0;
        contractFiles.push(
          ...fileList.map((f) => ({
            name: f.fileName || f.name || "授权书.pdf",
            status: "已签署",
            signed: true,
          })),
        );
      }
    }
  } catch (e) {
    console.error("刷新签署状态失败:", e);
  }
}

async function handleStartFaceSign() {
  if (loading.value) return;
  loading.value = true;

  try {
    const redirectUrl = [
      `${getBaseUrl()}${buildHashRoute(
        APP_ROUTES.carloan.signing.faceSignResult,
        buildNavTitleQuery("人脸识别"),
      )}`,
      `uuid=${encodeURIComponent(customerInfo.uuid)}`,
      `creditOrderId=${encodeURIComponent(customerInfo.creditOrderId)}`,
      `mode=${isCreditMode.value ? "credit" : "faceSign"}`,
      `name=${encodeURIComponent(customerInfo.name)}`,
      `phone=${encodeURIComponent(customerInfo.phone)}`,
      `amount=${encodeURIComponent(customerInfo.rawAmount)}`,
      `backUrl=${encodeURIComponent(backUrl.value)}`,
    ].join("&");

    const res = await businessApi.startFaceSign({
      uuid: customerInfo.uuid,
      redirectUrl,
    });

    const raw = res || {};
    const data = raw.data || raw || {};
    const faceUrl = data.signUrl || data.faceUrl || data.url || "";

    if (faceUrl) {
      currentStep.value = 1;
      faceResult.show = true;
      faceResult.status = "checking";
      faceResult.statusText = "识别中...";

      confirm("即将跳转到人脸识别页面，是否继续？", () => {
        // #ifdef H5
        window.location.href = faceUrl;
        // #endif
        // #ifndef H5
        uni.navigateTo({
          url: buildRoute(
            APP_ROUTES.carloan.signing.authSign,
            { authUrl: encodeURIComponent(faceUrl), mode: "sign" },
          ),
        });
        // #endif
      });
    } else {
      uni.showToast({ title: "获取人脸识别链接失败", icon: "none" });
    }
  } catch (err) {
    console.error("人脸识别发起失败:", err);
    uni.showToast({ title: "发起人脸识别失败", icon: "none" });
  } finally {
    loading.value = false;
  }
}

function handleCancel() {
  confirm(
    isCreditMode.value ? "确定取消授信吗？" : "确定取消面签吗？",
    () => {
      currentStep.value = 0;
      faceResult.show = false;
      faceResult.status = "checking";
      faceResult.statusText = "";
      faceResult.score = "";
      faceResult.msg = "";
    },
  );
}

function handleFaceResult(result) {
  faceResult.show = true;
  faceResult.status = result.passed ? "success" : "fail";
  faceResult.statusText = result.passed ? "核验通过" : "核验未通过";
  faceResult.score = result.score || "";
  faceResult.msg = result.msg || "";

  if (result.passed) {
    if (isCreditMode.value) {
      currentStep.value = 4;
      updateStepStatus(2);
      saveSignProgress("FACE_SIGNED");
    } else {
      currentStep.value = 2;
      updateStepStatus(1);
    }
  } else {
    updateStepStatus(0);
  }
}

async function handleAuthorizeSign() {
  if (authorizeSignLoading.value) return;
  if (!signRecordId.value) {
    uni.showToast({ title: "缺少签署记录ID", icon: "none" });
    return;
  }

  authorizeSignLoading.value = true;
  try {
    const res = await businessApi.authorizeSign(signRecordId.value);
    const data = res?.data || res || {};

    if (data.signUrl || data.url) {
      const signUrl = data.signUrl || data.url;
      confirm("即将进行授权签署，是否继续？", () => {
        // #ifdef H5
        window.location.href = signUrl;
        // #endif
        // #ifndef H5
        uni.navigateTo({
          url: buildRoute(APP_ROUTES.carloan.signing.authSign, {
            authUrl: encodeURIComponent(signUrl),
            creditOrderId: customerInfo.creditOrderId,
            uuid: customerInfo.uuid,
            type: "face",
            mode: "sign",
          }),
        });
        // #endif
      });
    } else {
      authSignDone.value = true;
      saveSignProgress("SIGNED");
      uni.showToast({ title: "授权签署成功", icon: "success" });

      if (contractSignDone.value) {
        currentStep.value = 4;
        updateStepStatus(4);
      }
    }
  } catch (err) {
    console.error("授权签署失败:", err);
    uni.showToast({ title: "授权签署失败", icon: "none" });
  } finally {
    authorizeSignLoading.value = false;
  }
}

async function handleSignContract() {
  if (signingLoading.value) return;
  signingLoading.value = true;

  try {
    const redirectUrl = [
      `${getBaseUrl()}${buildHashRoute(
        APP_ROUTES.carloan.signing.faceSignResult,
        buildNavTitleQuery("授权书签署结果"),
      )}`,
      `uuid=${encodeURIComponent(customerInfo.uuid)}`,
      `creditOrderId=${encodeURIComponent(customerInfo.creditOrderId)}`,
      `mode=credit`,
      `name=${encodeURIComponent(customerInfo.name)}`,
      `phone=${encodeURIComponent(customerInfo.phone)}`,
      `amount=${encodeURIComponent(customerInfo.rawAmount)}`,
      `backUrl=${encodeURIComponent(backUrl.value)}`,
    ].join("&");

    const res = await businessApi.startAuthContractSign({
      uuid: customerInfo.uuid,
      creditOrderId: customerInfo.creditOrderId,
      redirectUrl,
    });

    const raw = res || {};
    const data = raw.data || raw || {};
    const signUrl = data.signUrl || data.authUrl || data.url || "";
    const orderId = data.creditOrderId || customerInfo.creditOrderId;

    if (orderId) {
      customerInfo.creditOrderId = String(orderId);
    }

    if (signUrl) {
      contractSignUrl.value = signUrl;
      saveSignProgress("CONTRACT_SIGNING");

      confirm("即将跳转到授权书签署页面，是否继续？", () => {
        // #ifdef H5
        window.location.href = signUrl;
        // #endif
        // #ifndef H5
        uni.navigateTo({
          url: buildRoute(APP_ROUTES.carloan.signing.authSign, {
            authUrl: encodeURIComponent(signUrl),
            creditOrderId: customerInfo.creditOrderId,
            uuid: customerInfo.uuid,
            type: "contract",
            mode: "sign",
          }),
        });
        // #endif
      });
    } else {
      uni.showToast({ title: "获取签署链接失败，请稍后重试", icon: "none" });
    }
  } catch (err) {
    console.error("签署授权书发起失败:", err);
    uni.showToast({ title: "发起签署失败", icon: "none" });
  } finally {
    signingLoading.value = false;
  }
}

async function handleStartContract() {
  if (loading.value) return;
  loading.value = true;

  try {
    const redirectUrl = [
      `${getBaseUrl()}${buildHashRoute(
        APP_ROUTES.carloan.signing.faceSignResult,
        buildNavTitleQuery("合同签署结果"),
      )}`,
      `uuid=${encodeURIComponent(customerInfo.uuid)}`,
      `creditOrderId=${encodeURIComponent(customerInfo.creditOrderId)}`,
      `mode=faceSign`,
      `name=${encodeURIComponent(customerInfo.name)}`,
      `phone=${encodeURIComponent(customerInfo.phone)}`,
      `amount=${encodeURIComponent(customerInfo.rawAmount)}`,
      `backUrl=${encodeURIComponent(backUrl.value)}`,
    ].join("&");

    const res = await businessApi.startContractSign({
      uuid: customerInfo.uuid,
      creditOrderId: customerInfo.creditOrderId,
      redirectUrl,
    });

    const raw = res || {};
    const data = raw.data || raw || {};
    const signUrl = data.signUrl || data.authUrl || data.url || "";

    if (signUrl) {
      currentStep.value = 3;
      updateStepStatus(2);

      confirm("即将跳转到合同签署页面，是否继续？", () => {
        // #ifdef H5
        window.location.href = signUrl;
        // #endif
        // #ifndef H5
        uni.navigateTo({
          url: buildRoute(APP_ROUTES.carloan.signing.authSign, {
            authUrl: encodeURIComponent(signUrl),
            creditOrderId: customerInfo.creditOrderId,
            uuid: customerInfo.uuid,
            type: "contract",
            mode: "sign",
          }),
        });
        // #endif
      });
    } else {
      uni.showToast({ title: "获取合同签署链接失败", icon: "none" });
    }
  } catch (err) {
    console.error("合同签约发起失败:", err);
    uni.showToast({ title: "发起合同签约失败", icon: "none" });
  } finally {
    loading.value = false;
  }
}

function updateStepStatus(finishedStepIndex) {
  for (let i = 0; i < stepList.length; i++) {
    if (i < finishedStepIndex) {
      stepList[i].status = "finish";
    } else if (i === finishedStepIndex) {
      stepList[i].status = "doing";
    } else {
      stepList[i].status = "wait";
    }
  }
  if (finishedStepIndex >= stepList.length - 1) {
    stepList.forEach((s) => {
      s.status = "finish";
    });
  }
}

function getStepClass(status) {
  return `step-${status}`;
}

function formatAmount(val) {
  const num = Number(val);
  if (Number.isNaN(num)) return val;
  if (num >= 10000) return `${(num / 10000).toFixed(1).replace(/\.0$/, "")}万`;
  return num % 1 === 0 ? num.toLocaleString("zh-CN") : num.toFixed(2);
}

function goBack() {
  if (backUrl.value) {
    uni.redirectTo({ url: backUrl.value });
    return;
  }
  uni.navigateBack({ delta: 1 });
}

function goToApplyList() {
  uni.redirectTo({ url: APP_ROUTES.carloan.precheck.orderList });
}

function goToWorkbench() {
  uni.reLaunch({ url: APP_ROUTES.carloan.portal.workbench });
}
</script>

<style lang="scss" scoped>
.video-face-sign-page {
  padding: 24rpx;
  background: linear-gradient(180deg, #f2f4f8 0%, #f8f9fb 100%);
  min-height: 100vh;
}

.customer-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
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
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
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
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
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
  padding: 20rpx;
  background: #f8f9fb;
  border-radius: 16rpx;
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
  margin-bottom: 16rpx;
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
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.3);
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
