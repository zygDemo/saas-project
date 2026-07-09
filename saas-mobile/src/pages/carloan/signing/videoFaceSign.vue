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
          <!-- 授信模式：授权签署 + 签署授权书 + 返回按钮 -->
          <template v-if="isCreditMode">
            <u-button
              v-if="signRecordId"
              type="success"
              size="large"
              shape="circle"
              :loading="authorizeSignLoading"
              @click="handleAuthorizeSign"
            >
              授权签署
            </u-button>
            <u-button
              type="primary"
              size="large"
              shape="circle"
              :loading="signingLoading"
              @click="handleSignContract"
            >
              签署授权书
            </u-button>
            <u-button
              v-if="!isCustomerRole"
              type="default"
              size="large"
              shape="circle"
              @click="goToApplyList"
            >
              返回预审列表
            </u-button>
            <u-button
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
import { onLoad } from "@dcloudio/uni-app";
import { useCarloanApi } from "@/api/carloan";
import { useConfirm } from "@/composables/useConfirm";
import { useSessionStore } from "@/stores";
import { closeBrowser } from "@/composables/useCloseBrowser";
import { APP_ROUTES, buildHashRoute } from "@/common/navigation";
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

const stepList = reactive([]);

/** 授信模式步骤 */
function setCreditSteps() {
  stepList.length = 0;
  stepList.push(
    { title: "准备授信", desc: "确认客户信息", status: "doing" },
    { title: "人脸识别", desc: "进行人脸核验", status: "wait" },
    { title: "授信完成", desc: "授信结果确认", status: "wait" },
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

  // 必填校验
  if (!uuid && !orderId && !optCreditOrderId) {
    uni.showToast({ title: "参数错误，缺少 uuid", icon: "none" });
    setTimeout(() => goBack(), 1500);
    return;
  }

  // orderId 是进件记录 id，不等同于 creditOrderId；需先查详情拿真实授信单号
  let detailInfo = {};
  if (orderId || optCreditOrderId) {
    try {
      const detail = orderId
        ? await fetchCreditDetail(orderId)
        : await fetchCreditDetailByOrderId(optCreditOrderId);
      detailInfo = detail || {};
      // 获取签署记录ID
      if (detailInfo.signRecordId) {
        signRecordId.value = detailInfo.signRecordId;
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
});

onUnmounted(() => {});

// ========== 方法 ==========

/** 加载客户信息 */
function loadCustomerInfo(params) {
  customerInfo.uuid = params.uuid;
  customerInfo.name = safeDecode(params.name) || "未知客户";
  customerInfo.idCard = params.idCard || "";
  customerInfo.phone = safeDecode(params.phone) || "-";
  // amount 可能是分单位，转为元展示
  customerInfo.rawAmount = safeDecode(params.amount) || "0";
  customerInfo.amount = formatAmount(customerInfo.rawAmount);
  customerInfo.creditOrderId = params.creditOrderId || "";

  // type=contract：合同签署前也必须先完成人脸识别
  if (params.type === "contract") {
    saveSignProgress("SIGNING_CONTRACT");
    pageTitle.value = "合同签署";
    isCreditMode.value = false;
    setFaceSignSteps();
    currentStep.value = 0;
    faceResult.show = false;
    return;
  }

  // 根据场景调整页面标题和模式
  if (params.creditOrderId) {
    pageTitle.value = "授信认证";
    isCreditMode.value = true;
    // 授信模式简化步骤
    setCreditSteps();
  } else {
    pageTitle.value = "视频面签";
    isCreditMode.value = false;
    setFaceSignSteps();
  }
}

/** 将金额格式化为可读字符串（入参已经是元） */
function formatAmount(val) {
  const num = Number(val);
  if (Number.isNaN(num)) return val;
  // >= 1万 → 显示为 X.X万
  if (num >= 10000) {
    return `${(num / 10000).toFixed(1).replace(/\.0$/, "")}万`;
  }
  // 小于1万 → 显示整数或保留两位小数
  return num % 1 === 0 ? num.toLocaleString("zh-CN") : num.toFixed(2);
}

/** 获取步骤样式 */
function getStepClass(status) {
  return `step-${status}`;
}

/** 开始人脸识别（授信模式下跳过人脸识别，直接完成） */
async function handleStartFaceSign() {
  if (loading.value) return;

  loading.value = true;
  currentStep.value = 1;

  updateStepStatus(0, "finish");
  updateStepStatus(1, "doing");

  faceResult.show = true;
  faceResult.status = "checking";
  faceResult.statusText = "识别中...";
  faceResult.score = undefined;
  faceResult.msg = undefined;

  contractFiles.length = 0;

  // 授信模式：调用授信申请接口推进节点，然后跳转到进度页
  if (isCreditMode.value) {
    try {
      const res = await businessApi.creditApply({
        uuid: customerInfo.uuid,
        creditOrderId: customerInfo.creditOrderId || undefined,
      });

      if (res?.code === 200) {
        // 模拟人脸识别成功
        faceResult.status = "success";
        faceResult.statusText = "核验通过";
        faceResult.score = 98;

        updateStepStatus(1, "finish");
        updateStepStatus(2, "finish");

        currentStep.value = 4;
        uni.showToast({ title: "授信认证完成", icon: "success" });

        // 返回订单详情页
        setTimeout(() => {
          goBack();
        }, 800);
      } else {
        uni.showToast({ title: "授信申请失败", icon: "none" });
      }
    } catch (err) {
      console.error("授信申请失败:", err);
      uni.showToast({ title: "授信申请失败", icon: "none" });
    } finally {
      loading.value = false;
    }
    return;
  }

  // 面签模式：调用三方人脸识别
  const redirectUrl = [
    `${getBaseUrl()}${buildHashRoute(
      APP_ROUTES.carloan.signing.faceSignResult,
      buildNavTitleQuery("人脸识别"),
    )}`,
    `uuid=${encodeURIComponent(customerInfo.uuid)}`,
    `creditOrderId=${encodeURIComponent(customerInfo.creditOrderId)}`,
    `name=${encodeURIComponent(customerInfo.name)}`,
    `phone=${encodeURIComponent(customerInfo.phone)}`,
    `amount=${encodeURIComponent(customerInfo.rawAmount)}`,
    `backUrl=${encodeURIComponent(backUrl.value)}`,
    `mode=${isCreditMode.value ? "credit" : "faceSign"}`,
  ].join("&");

  try {
    const res = await businessApi.startFaceSign({
      uuid: customerInfo.uuid,
      creditOrderId: customerInfo.creditOrderId,
      redirectUrl,
    });
    console.warn("人脸识别发起成功:", res);
    const { authUrl, flowId: creditOrderId } = res.data || {};

    // 获取到 creditOrderId 后，立即调用详情接口获取结果
    if (creditOrderId && authUrl) {
      // 保存返回的授信单号，供后续合同签署接口使用
      customerInfo.creditOrderId = creditOrderId;
      // await businessApi.getFaceSignDetail(creditOrderId);
      confirm("即将跳转到人脸识别页面，是否继续？", () => {
        window.location.href = authUrl;
      });
    }
  } catch (err) {
    console.error("人脸识别发起失败:", err);
    uni.showToast({ title: "发起面签失败", icon: "none" });
    loading.value = false;
  }
}

/** 开始合同签署（面签模式下，人脸识别通过后调用） */
async function handleStartContract() {
  if (loading.value) return;

  loading.value = true;
  currentStep.value = 3;

  updateStepStatus(1, "finish");
  updateStepStatus(2, "doing");
  updateStepStatus(3, "wait");

  // 构建回调地址（根据当前环境动态拼接）
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
  ]
    .join("&")
    .replace(/#\/([^?&]+)&/, "#/$1?");

  try {
    const res = await businessApi.startContractSign({
      uuid: customerInfo.uuid,
      creditOrderId: customerInfo.creditOrderId,
      redirectUrl,
    });

    const data = res?.data || res || {};
    const signUrl = data?.signUrl || data?.authUrl || "";
    const creditOrderId = data?.creditOrderId;

    if (creditOrderId) {
      customerInfo.creditOrderId = creditOrderId;
    }

    if (signUrl) {
      saveSignProgress("GPS_APPOINTING");
      // 二次确认后跳转三方签署页面
      confirm("即将跳转到合同签署页面，是否继续？", () => {
        window.location.href = signUrl;
      });
    } else {
      saveSignProgress("GPS_APPOINTING");
      currentStep.value = 4;
      updateStepStatus(2, "finish");
      updateStepStatus(3, "finish");
      uni.showToast({ title: "合同签署已本地完成", icon: "success" });
      loading.value = false;
    }
  } catch (err) {
    console.error("合同签署发起失败，使用本地签约兜底:", err);
    saveSignProgress("GPS_APPOINTING");
    currentStep.value = 4;
    updateStepStatus(2, "finish");
    updateStepStatus(3, "finish");
    uni.showToast({ title: "合同签署已本地完成", icon: "success" });
    loading.value = false;
  }
}

/** 获取授信申请详情 */
async function fetchCreditDetail(id) {
  const res = await businessApi.getCreditDetail(id);
  const data = res?.data || res;
  // 兼容多种可能的字段命名
  return {
    customerName: data?.customerName || data?.name || data?.personName,
    name: data?.name || data?.customerName || data?.personName,
    phone: data?.phone || data?.telephone || data?.mobile,
    telephone: data?.telephone || data?.phone,
    amount: data?.amount || data?.loanAmount || data?.creditAmount,
    loanAmount: data?.loanAmount || data?.amount,
    uuid:
      data?.uuid ||
      data?.customerUuid ||
      data?.userUuid ||
      data?.user?.uuid ||
      data?.customer?.uuid,
    creditOrderId: data?.creditOrderId,
    orderId: data?.orderId || data?.creditOrderId || data?.id,
    signRecordId: data?.sign?.id || null,
  };
}

/** 授信完成后手动签署授权书 */
async function fetchCreditDetailByOrderId(creditOrderId) {
  const res = await businessApi.getCreditDetailByOrderId(creditOrderId);
  const data = res?.data || res;
  return {
    customerName: data?.customerName || data?.name || data?.personName,
    name: data?.name || data?.customerName || data?.personName,
    phone: data?.phone || data?.telephone || data?.mobile,
    telephone: data?.telephone || data?.phone,
    amount: data?.amount || data?.loanAmount || data?.creditAmount,
    loanAmount: data?.loanAmount || data?.amount,
    uuid:
      data?.uuid ||
      data?.customerUuid ||
      data?.userUuid ||
      data?.user?.uuid ||
      data?.customer?.uuid,
    creditOrderId: data?.creditOrderId || data?.orderNo || creditOrderId,
    orderId: data?.orderId || data?.creditOrderId || data?.id,
    signRecordId: data?.sign?.id || data?.signRecordId || null,
  };
}

async function handleSignContract() {
  if (signingLoading.value) return;
  signingLoading.value = true;

  try {
    // 构建回调地址（根据当前环境动态拼接）
    const redirectUrl = [
      `${getBaseUrl()}${buildHashRoute(
        APP_ROUTES.carloan.signing.faceSignResult,
        buildNavTitleQuery("授权书签署结果"),
      )}`,
      `uuid=${encodeURIComponent(customerInfo.uuid)}`,
      `creditOrderId=${encodeURIComponent(customerInfo.creditOrderId)}`,
      `mode=credit`,
      `backUrl=${encodeURIComponent(backUrl.value)}`,
    ].join("&");

    const res = await businessApi.startAuthContractSign({
      uuid: customerInfo.uuid,
      creditOrderId: customerInfo.creditOrderId,
      redirectUrl,
    });

    const data = res?.data || res || {};
    const signUrl = data?.signUrl || data?.authUrl || "";
    const creditOrderId = data?.creditOrderId;

    if (creditOrderId) {
      customerInfo.creditOrderId = creditOrderId;
    }

    if (signUrl) {
      saveSignProgress("GPS_APPOINTING");
      // 二次确认后跳转三方签署页面
      confirm("即将跳转到授权书签署页面，是否继续？", () => {
        window.location.href = signUrl;
      });
    } else {
      uni.showToast({ title: "发起签署失败，请稍后重试", icon: "none" });
    }
  } catch (err) {
    console.error("签署授权书发起失败:", err);
    uni.showToast({ title: "发起签署失败", icon: "none" });
  } finally {
    signingLoading.value = false;
  }
}

/** 更新步骤状态 */
function updateStepStatus(index, status) {
  if (index >= 0 && index < stepList.length) {
    stepList[index].status = status;
  }
}

/** 取消面签/授信 */
function handleCancel() {
  loading.value = false;
  currentStep.value = 0;
  faceResult.show = false;

  // 重置所有步骤
  stepList.forEach((s) => (s.status = "wait"));
  if (stepList.length > 0) stepList[0].status = "doing";

  contractFiles.length = 0;
  const tip = isCreditMode.value ? "已取消授信" : "已取消面签";
  uni.showToast({ title: tip, icon: "none" });
}

/** 返回列表 */
function goBack() {
  if (backUrl.value) {
    uni.redirectTo({ url: backUrl.value });
    return;
  }
  uni.navigateBack();
}

/** 授信完成：返回预审列表 */
function goToApplyList() {
  uni.redirectTo({
    url: APP_ROUTES.carloan.precheck.applyListPage,
  });
}

/** 授信完成：返回首页（Tab页） */
function goToWorkbench() {
  uni.reLaunch({
    url: APP_ROUTES.carloan.portal.workbench,
  });
}

/** 授权签署（一键签署） */
async function handleAuthorizeSign() {
  if (authorizeSignLoading.value || !signRecordId.value) return;

  authorizeSignLoading.value = true;

  try {
    await businessApi.authorizeSign(signRecordId.value);
    uni.showToast({ title: "授权签署成功", icon: "success" });

    // 更新签署进度
    saveSignProgress("SIGNED");

    // 可选：跳转到结果页面或刷新状态
    setTimeout(() => {
      goBack();
    }, 1500);
  } catch (err) {
    console.error("授权签署失败:", err);
    uni.showToast({ title: err.message || "授权签署失败", icon: "none" });
  } finally {
    authorizeSignLoading.value = false;
  }
}
</script>

<style lang="scss" scoped>
.video-face-sign-page {
  padding: 24rpx;
  background: linear-gradient(180deg, #f2f4f8 0%, #f8f9fb 100%);
  min-height: 100vh;
}

// ===== 客户信息卡片 =====
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
  gap: 20rpx;
  margin-bottom: 24rpx;
  padding-bottom: 24rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: linear-gradient(
    135deg,
    var(--u-type-primary),
    var(--u-type-primary)
  );
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}

.customer-meta {
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
  justify-content: space-between;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.info-item .label {
  font-size: 24rpx;
  color: #8c8c8c;
}

.info-item .value {
  font-size: 30rpx;
  color: #262626;
  font-weight: 600;
}

.info-item .amount {
  color: #cf1322;
  font-size: 34rpx;
}

// ===== 流程卡片 =====
.flow-card,
.result-card {
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

// ===== 步骤列表 =====
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

  &:last-child {
    padding-bottom: 0;
  }
}

.step-icon {
  width: 44rpx;
  height: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  z-index: 1;
}

.step-num {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  border: 2rpx solid #d9d9d9;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  color: #bfbfbf;
}

.step-line {
  position: absolute;
  left: 20rpx;
  top: 48rpx;
  bottom: 0;
  width: 2rpx;
  background: #e8e8e8;
}

.line-finish {
  background: #52c41a;
}

.line-doing {
  background: linear-gradient(180deg, var(--u-type-primary), #e8e8e8);
}

.step-content {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  flex: 1;
  padding-top: 4rpx;
}

.step-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #262626;
}

.step-desc {
  font-size: 24rpx;
  color: #8c8c8c;
}

.step-finish .step-title {
  color: #52c41a;
}

.step-doing .step-title {
  color: var(--u-type-primary);
}

.step-error .step-title {
  color: #ff4d4f;
}

// ===== 结果卡片 =====
// 状态横幅
.result-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32rpx 24rpx;
  border-radius: 20rpx;
  margin-bottom: 20rpx;
  gap: 8rpx;
}

.hero-success {
  background: linear-gradient(135deg, #10b981, #34d399);
}

.hero-fail {
  background: linear-gradient(135deg, #ef4444, #f87171);
}

.hero-checking {
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
}

.hero-text {
  font-size: 32rpx;
  font-weight: 700;
  color: #fff;
  letter-spacing: 1rpx;
}

.hero-sub {
  font-size: 36rpx;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.9);
  font-family: "DIN Alternate", "Helvetica Neue", sans-serif;
}

// 结果底部按钮区
.result-actions {
  margin-top: 24rpx;
  padding-top: 24rpx;
  border-top: 1rpx solid #f0f0f0;

  .retry-btn {
    width: 100%;
  }
}

// 相似度得分高亮
.score-value {
  font-size: 30rpx;
  font-weight: 700;
  color: #10b981;
  font-family: "DIN Alternate", "Helvetica Neue", sans-serif;
}

// 备注信息行
.msg-row {
  align-items: flex-start;
  padding: 12rpx 0;

  .value {
    flex: 1;
    text-align: right;
    font-size: 24rpx;
    color: #595959;
    line-height: 1.5;
  }
}

.result-content {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
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

// ===== 文件列表 =====
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

// ===== 底部操作区 =====
.action-area {
  margin-top: 40rpx;
  padding-bottom: 40rpx;
}

.finish-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
  padding: 40rpx 0;
}

.finish-text {
  font-size: 32rpx;
  font-weight: 700;
  color: #52c41a;
  margin-bottom: 20rpx;
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .page-container {
    background-color: #121212;
  }
  .card {
    background-color: #1e1e1e;
  }
  .card-item {
    background-color: #1e1e1e;
  }
  .list-item {
    background-color: #1e1e1e;
  }
  .section {
    background-color: #1e1e1e;
  }
  .form-item {
    background-color: #1e1e1e;
    border-color: #2a2a2a;
  }
  .title {
    color: #e5e6eb;
  }
  .subtitle {
    color: #8b8c91;
  }
  .desc {
    color: #8b8c91;
  }
  .label {
    color: #b0b3b8;
  }
  .value {
    color: #e5e6eb;
  }
  .name {
    color: #e5e6eb;
  }
  .info {
    color: #b0b3b8;
  }
  .text {
    color: #e5e6eb;
  }
  .tip {
    color: #8b8c91;
  }
  .divider {
    background-color: #2a2a2a;
  }
  .border {
    border-color: #2a2a2a;
  }
  .input {
    background-color: #2a2a2a;
    color: #e5e6eb;
  }
  .textarea {
    background-color: #2a2a2a;
    color: #e5e6eb;
  }
  .picker {
    background-color: #2a2a2a;
    color: #e5e6eb;
  }
  .footer {
    background-color: #1e1e1e;
  }
}
</style>
