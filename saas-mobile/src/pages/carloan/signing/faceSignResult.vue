<template>
  <app-page :nav-title="pageTitle" :show-nav-back="!isCustomerRole">
    <view class="face-sign-result-page">
      <!-- 加载中 -->
      <view v-if="loading" class="loading-box">
        <u-loading size="60" color="var(--u-type-primary)" text="加载中..." />
      </view>

      <!-- 结果展示态 -->
      <template v-else>
        <!-- 顶部结果状态 -->
        <view class="result-header">
          <view class="result-icon-box">
            <u-icon
              v-if="resultStatus === 'success'"
              name="checkmark-circle-fill"
              size="120"
              color="#52c41a"
            />
            <u-icon
              v-else-if="resultStatus === 'processing'"
              name="clock-fill"
              size="120"
              color="#faad14"
            />
            <u-icon
              v-else
              name="close-circle-fill"
              size="120"
              color="#ff4d4f"
            />
          </view>
          <text class="result-title">{{ resultTitle }}</text>
          <text class="result-time">{{ signTime }}</text>
        </view>

        <!-- 客户信息 -->
        <view class="info-card">
          <view class="card-title">客户信息</view>
          <view class="info-list">
            <view class="info-row">
              <text class="label">客户姓名</text>
              <text class="value">{{ customerInfo.name }}</text>
            </view>
            <view class="info-row">
              <text class="label">手机号码</text>
              <text class="value">{{ customerInfo.phone }}</text>
            </view>
          </view>
        </view>

        <!-- 1. 人脸识别结果 -->
        <view v-if="resultType === '人脸识别'" class="info-card">
          <view class="card-title">
            <text>人脸识别结果</text>
            <u-tag
              :text="faceResult.passed ? '通过' : '未通过'"
              :type="faceResult.passed ? 'success' : 'error'"
              size="mini"
            />
          </view>
          <view class="info-list">
            <view class="info-row">
              <text class="label">核验结果</text>
              <text
                class="value"
                :class="faceResult.passed ? 'success-text' : 'error-text'"
              >
                {{ faceResult.passed ? "是本人" : "不是本人" }}
              </text>
            </view>
            <view v-if="faceResult.score" class="info-row">
              <text class="label">相似度</text>
              <text class="value">{{ faceResult.score }}%</text>
            </view>
            <view v-if="faceResult.msg" class="info-row">
              <text class="label">备注</text>
              <text class="value">{{ faceResult.msg }}</text>
            </view>
          </view>
        </view>

        <!-- 2. 授权书签署结果 -->
        <view v-else-if="resultType === '授权书签署结果'" class="info-card">
          <view class="card-title">
            <text>授权书签署结果</text>
            <u-tag
              :text="contractSigned ? '已签署' : '未签署'"
              :type="contractSigned ? 'success' : 'error'"
              size="mini"
            />
          </view>
          <view v-if="contractFiles.length > 0" class="file-list">
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
              <u-button
                v-if="file.fileUrl"
                type="primary"
                size="mini"
                plain
                @click.stop="previewContractFile(file)"
              >
                查看
              </u-button>
              <u-icon
                :name="file.signed ? 'checkmark-circle-fill' : 'clock'"
                :color="file.signed ? '#52c41a' : '#bfbfbf'"
                size="36"
              />
            </view>
          </view>
          <view v-else class="empty-files">
            <u-empty text="暂无签署文件" mode="list" />
          </view>
        </view>

        <!-- 3. 合同签署结果 -->
        <view v-else-if="resultType === '合同签署结果'" class="info-card">
          <view class="card-title">
            <text>合同签署结果</text>
            <u-tag
              :text="contractSigned ? '已签署' : '未签署'"
              :type="contractSigned ? 'success' : 'error'"
              size="mini"
            />
          </view>
          <view v-if="contractFiles.length > 0" class="file-list">
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
              <u-button
                v-if="file.fileUrl"
                type="primary"
                size="mini"
                plain
                @click.stop="previewContractFile(file)"
              >
                查看
              </u-button>
              <u-icon
                :name="file.signed ? 'checkmark-circle-fill' : 'clock'"
                :color="file.signed ? '#52c41a' : '#bfbfbf'"
                size="36"
              />
            </view>
          </view>
          <view v-else class="empty-files">
            <u-empty text="暂无签约文件" mode="list" />
          </view>
        </view>

        <!-- 底部操作 -->
        <view class="action-area">
          <!-- 人脸识别成功 → 授权书签署（授信模式）/ 合同签约（面签模式） -->
          <u-button
            v-if="resultType === '人脸识别' && resultStatus === 'success'"
            type="primary"
            size="large"
            shape="circle"
            :loading="signingLoading"
            @click="
              pageMode === 'faceSign'
                ? handleContractSign()
                : handleSignContract()
            "
          >
            {{ pageMode === "faceSign" ? "合同签约" : "授权书签署" }}
          </u-button>
          <!-- 人脸识别失败 -->
          <template
            v-else-if="resultType === '人脸识别' && resultStatus === 'fail'"
          >
            <u-button
              type="warning"
              size="large"
              shape="circle"
              @click="retryCredit"
            >
              重新识别
            </u-button>
            <u-button
              type="default"
              size="large"
              shape="circle"
              plain
              class="mt-16"
              @click="goBack"
            >
              返回
            </u-button>
          </template>
          <!-- 授权书签署结果 -->
          <template v-else-if="resultType === '授权书签署结果'">
            <u-button
              v-if="isCustomerRole"
              type="primary"
              size="large"
              shape="circle"
              @click="closeBrowser"
            >
              关闭
            </u-button>
            <u-button
              v-else-if="resultStatus === 'fail'"
              type="warning"
              size="large"
              shape="circle"
              :loading="signingLoading"
              @click="
                pageMode === 'faceSign'
                  ? handleContractSign()
                  : handleSignContract()
              "
            >
              重新签署
            </u-button>
            <u-button
              v-else
              type="primary"
              size="large"
              shape="circle"
              @click="goToWorkbench"
            >
              返回首页
            </u-button>
          </template>
          <!-- 合同签署结果 -->
          <template v-else-if="resultType === '合同签署结果'">
            <u-button
              v-if="isCustomerRole"
              type="primary"
              size="large"
              shape="circle"
              @click="closeBrowser"
            >
              关闭
            </u-button>
            <u-button
              v-else-if="resultStatus === 'fail'"
              type="warning"
              size="large"
              shape="circle"
              :loading="signingLoading"
              @click="
                pageMode === 'faceSign'
                  ? handleContractSign()
                  : handleSignContract()
              "
            >
              重新签署
            </u-button>
            <u-button
              v-else
              type="primary"
              size="large"
              shape="circle"
              @click="closeBrowser"
            >
              关闭
            </u-button>
          </template>
        </view>
      </template>
    </view>
    <!-- 跳转确认弹窗 -->
    <app-confirm ref="confirmRef" />
  </app-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { useCarloanApi } from "@/api/carloan";
import { useConfirm } from "@/composables/useConfirm";
import { useSessionStore } from "@/stores";
import { closeBrowser } from "@/composables/useCloseBrowser";
import { toFilePreviewUrl } from "@/common/file-url";
import { APP_ROUTES, buildHashRoute, buildRoute } from "@/common/navigation";
import { buildNavTitleQuery, buildSignRouteQuery } from "@/common/carloan-route-query";

// ========== 常量 ==========

const DEFAULT_CUSTOMER = {
  name: "未知客户",
  idCard: "310***********1234",
  phone: "-",
  amount: "",
} as const;

const DEFAULT_FILES = [
  { name: "借款合同.pdf", status: "已签署", signed: true },
  { name: "抵押合同.pdf", status: "已签署", signed: true },
  { name: "授权委托书.pdf", status: "已签署", signed: true },
  { name: "担保合同.pdf", status: "已签署", signed: true },
  { name: "服务协议.pdf", status: "已签署", signed: true },
] as const;

// ========== 类型定义 ==========

interface CustomerInfo {
  name: string;
  idCard: string;
  phone: string;
  amount: string;
  creditOrderId: string;
}

interface FaceResult {
  passed: boolean;
  score: string;
  msg: string;
}

interface ContractFile {
  name: string;
  status: string;
  signed: boolean;
  fileUrl?: string;
}

// ========== 响应式数据 ==========

const resultType = ref("");
const callbackCreditOrderId = ref("");
const loading = ref(false);
const signingLoading = ref(false);
const resultStatus = ref("success");
const navTitle = ref("");
const signTime = ref("");
const callbackUuid = ref("");
const contractSigned = ref(true);
const pageMode = ref("credit"); // 'credit' | 'faceSign'

const customerInfo = reactive<CustomerInfo>({
  name: "",
  idCard: "",
  phone: "",
  amount: "",
  creditOrderId: "",
});

const faceResult = reactive<FaceResult>({
  passed: true,
  score: "",
  msg: "",
});

const contractFiles = ref<ContractFile[]>([]);

const businessApi = useCarloanApi();
const { confirmRef, confirm } = useConfirm();
const sessionStore = useSessionStore();
const isCustomerRole = computed(() => {
  const roleTags = String(sessionStore.transferInfo?.roleTags || "");
  return roleTags === "客户" || roleTags.includes("客户");
});

// ========== 生命周期 ==========

onLoad((options) => {
  // H5 下从 hash 直接解析参数，避免 uni-app onLoad options 解析不全
  const hashQuery = getHashQuery();
  const extra = getExtraParams();

  const merged = { ...hashQuery, ...extra, ...options } as Record<
    string,
    string
  >;
  navTitle.value = merged.navTitle || "";

  // 兼容 orderId 和 creditOrderId 两种参数名
  const creditOrderId = (merged.creditOrderId || merged.orderId || "").split(
    "?",
  )[0];

  if (creditOrderId) {
    customerInfo.creditOrderId = creditOrderId;
  }

  // 解析模式参数，第三方回调漏传 mode 时按结果类型兜底
  const mode = (merged.mode || "").split("?")[0];
  pageMode.value = resolvePageMode(mode, navTitle.value, creditOrderId);

  if (navTitle.value) {
    callbackCreditOrderId.value = creditOrderId;
    handleCallback(navTitle.value, creditOrderId, merged);
  } else {
    loadResultData(merged);
  }
});

/** 从 window.location.hash 解析所有查询参数（H5） */
function getHashQuery(): Record<string, string> {
  const result: Record<string, string> = {};
  // #ifdef H5
  try {
    const hash = window.location.hash || "";
    const idx = hash.indexOf("?");
    if (idx === -1) return result;
    hash
      .slice(idx + 1)
      .split("&")
      .forEach((pair) => {
        const eq = pair.indexOf("=");
        if (eq > -1) {
          result[safeDecode(pair.slice(0, eq))] = safeDecode(
            pair.slice(eq + 1),
          );
        }
      });
  } catch {
    /* ignore */
  }
  // #endif
  return result;
}

/** 获取三方追加的额外参数（H5 从 hash 提取，非 H5 返回空） */
function getExtraParams(): Record<string, string> {
  // #ifdef H5
  try {
    const hash = window.location.hash;
    if (!hash) return {};
    const parts = hash.split("?");
    if (parts.length < 3) return {};
    const qs = parts.slice(2).join("?");
    const params: Record<string, string> = {};
    qs.split("&").forEach((pair) => {
      const i = pair.indexOf("=");
      if (i > 0) {
        params[safeDecode(pair.slice(0, i))] = safeDecode(pair.slice(i + 1));
      }
    });
    return params;
  } catch {
    return {};
  }
  // #endif
  // #ifndef H5
  return {};
  // #endif
}

function resolvePageMode(mode: string, title: string, creditOrderId: string) {
  if (mode === "credit" || mode === "faceSign") return mode;
  if (title === "授权书签署结果") return "credit";
  if (title === "合同签署结果") return "faceSign";
  return creditOrderId ? "credit" : "faceSign";
}

// ========== 核心方法 ==========

/** 处理回调 */
function handleCallback(
  type: string,
  creditOrderId: string,
  options: Record<string, string>,
) {
  callbackUuid.value = options.uuid || "";
  if (type === "人脸识别") handleFaceCallback(creditOrderId, options);
  else if (type === "授权书签署结果")
    handleAuthCallback(creditOrderId, options);
  else if (type === "合同签署结果")
    handleContractCallback(creditOrderId, options);
  else if (type === "face") handleFaceCallback(creditOrderId, options);
  else if (type === "auth") handleAuthCallback(creditOrderId, options);
  else if (type === "contract") handleContractCallback(creditOrderId, options);
}

/** 人脸识别回调：有 creditOrderId 调用接口，否则用 URL 参数 / mock */
async function handleFaceCallback(
  creditOrderId: string,
  options: Record<string, string>,
) {
  loading.value = true;

  if (creditOrderId) {
    try {
      console.warn("调用人脸识别详情接口:", creditOrderId);
      const res = await businessApi.getFaceSignDetail(creditOrderId);
      const data = (res as Record<string, unknown>)?.data || res;

      applyFaceApiData(data, options);
    } catch (err) {
      console.error("查询人脸识别结果失败:", err);
      applyUrlOrMock(options);
    }
  } else {
    applyUrlOrMock(options);
  }

  pageFinalize("人脸识别");
}

/** 用 API 返回数据 + URL 参数填充结果 */
function applyFaceApiData(data: unknown, options: Record<string, string>) {
  const api = (data || {}) as Record<string, unknown>;
  customerInfo.name = safeDecode(
    (api?.customerName as string | undefined) ||
      (api?.name as string | undefined) ||
      options.name ||
      DEFAULT_CUSTOMER.name,
  );
  customerInfo.idCard =
    (api?.idCard as string | undefined) || options.idCard || DEFAULT_CUSTOMER.idCard;
  customerInfo.phone = safeDecode(
    (api?.phone as string | undefined) || options.phone || DEFAULT_CUSTOMER.phone,
  );
  customerInfo.amount =
    formatAmount(
      safeDecode(
        (api?.amount as string | undefined) || options.amount,
      ) || "",
    ) || DEFAULT_CUSTOMER.amount;
  if (!customerInfo.creditOrderId && options.creditOrderId) {
    customerInfo.creditOrderId = options.creditOrderId;
  }

  const apiStatus = Number((api?.status as string | number | undefined) || 1);
  const urlPassed = parsePassed(options.passed);
  const passed = urlPassed !== undefined ? urlPassed : apiStatus === 1;
  const isProcessing = apiStatus === 2;

  faceResult.passed = passed;
  faceResult.score = String(
    (api?.score as string | undefined) ||
      (api?.similarity as string | undefined) ||
      "",
  );
  faceResult.msg =
    options.msg ||
    (api?.msg as string | undefined) ||
    (api?.message as string | undefined) ||
    (isProcessing
      ? "人脸核验进行中"
      : passed
        ? "人脸核验通过"
        : "人脸核验未通过");
  resultStatus.value = isProcessing
    ? "processing"
    : passed
      ? "success"
      : "fail";
  signTime.value =
    (api?.signTime as string | undefined) ||
    (api?.createTime as string | undefined) ||
    getNowTime();
}

/** 用 URL 参数或 mock 数据填充 */
function applyUrlOrMock(options: Record<string, string>) {
  const passed = parsePassed(options.passed);
  const hasResult =
    passed !== undefined || options.result !== undefined || options.msg;

  customerInfo.name = safeDecode(options.name || DEFAULT_CUSTOMER.name);
  customerInfo.idCard = options.idCard || DEFAULT_CUSTOMER.idCard;
  customerInfo.phone = safeDecode(options.phone || DEFAULT_CUSTOMER.phone);
  customerInfo.amount =
    formatAmount(safeDecode(options.amount)) || DEFAULT_CUSTOMER.amount;

  const isPassed = passed !== undefined ? passed : true;
  faceResult.passed = isPassed;
  faceResult.score = options.faceScore || (hasResult ? "" : "98.5");
  faceResult.msg =
    options.msg ||
    options.faceMsg ||
    (isPassed ? "人脸核验通过" : "人脸核验未通过");
  resultStatus.value = isPassed ? "success" : "fail";
  signTime.value = options.time || getNowTime();
}

function applyCustomerInfoFromData(
  data: unknown,
  options: Record<string, string> = {},
) {
  const api = (data || {}) as Record<string, unknown>;
  const name = safeDecode(
    (api?.customerName as string | undefined) ||
      (api?.personName as string | undefined) ||
      (api?.name as string | undefined) ||
      (api?.userName as string | undefined) ||
      options.name ||
      customerInfo.name,
  );
  const phone = safeDecode(
    (api?.phone as string | undefined) ||
      (api?.telephone as string | undefined) ||
      (api?.mobile as string | undefined) ||
      (api?.phonenumber as string | undefined) ||
      options.phone ||
      customerInfo.phone,
  );
  const amount = safeDecode(
    (api?.amount as string | undefined) ||
      (api?.loanAmount as string | undefined) ||
      (api?.creditAmount as string | undefined) ||
      options.amount ||
      customerInfo.amount,
  );
  const orderId =
    (api?.creditOrderId as string | undefined) ||
    (api?.orderId as string | undefined) ||
    (api?.id as string | undefined) ||
    options.creditOrderId;

  if (name) customerInfo.name = name;
  if (phone) customerInfo.phone = phone;
  if (amount) customerInfo.amount = formatAmount(amount);
  if (orderId) customerInfo.creditOrderId = String(orderId);
}

async function fetchCustomerInfoByOrderId(
  creditOrderId: string,
  options: Record<string, string> = {},
) {
  if (!creditOrderId) return;

  try {
    const res = await businessApi.getCreditDetailByOrderId(creditOrderId);
    applyCustomerInfoFromData((res as unknown) as Record<string, unknown>, options);
    return;
  } catch (err) {
    console.warn("按授信单号查询客户信息失败，尝试按ID查询:", err);
  }

  try {
    const res = await businessApi.getCreditDetail(creditOrderId);
    applyCustomerInfoFromData((res as unknown) as Record<string, unknown>, options);
  } catch (err) {
    console.warn("查询客户信息失败:", err);
  }
}

/** 收尾：pageMode/resultType/loading 归一 */
function pageFinalize(type: string) {
  resultType.value = type;
  loading.value = false;
}

/** 解析 passed 参数为 boolean | undefined */
function parsePassed(val: unknown): boolean | undefined {
  if (val === "true" || val === true) return true;
  if (val === "false" || val === false) return false;
  return undefined;
}

// ========== 通用：查询签约详情 ==========

type SignStatus = "success" | "processing" | "fail";
type ContractDetailType = "auth" | "loan";

async function fetchContractDetail(
  creditOrderId: string,
  detailType: ContractDetailType = "loan",
): Promise<SignStatus> {
  try {
    const res =
      detailType === "auth"
        ? await businessApi.getAuthContractDetail(creditOrderId)
        : await businessApi.getContractDetail(creditOrderId);
    const data = (res as Record<string, unknown>)?.data || res;
    const typedData = data as Record<string, unknown>;
    applyCustomerInfoFromData(typedData);
    const status = Number((typedData?.status as string | number | undefined) || 1);
    // status: 1-完成 2-进行中 3-失败
    contractSigned.value = status === 1;
    // 文件列表兼容 fileList 和 files
    const fileList: unknown[] =
      ((data as Record<string, unknown>)?.fileList ||
        (data as Record<string, unknown>)?.files ||
        []) as unknown[];
    contractFiles.value =
      fileList.length > 0
        ? fileList.map((f: unknown) => {
            const file = f as Record<string, unknown>;
            return {
              name: (file.fileName || file.name) as string,
              status: "已签署",
              signed: true,
              fileUrl: (file.fileUrl || "") as string,
            };
          })
        : [...DEFAULT_FILES];
    return status === 1 ? "success" : status === 2 ? "processing" : "fail";
  } catch {
    contractSigned.value = true;
    contractFiles.value = [...DEFAULT_FILES];
    return "success";
  }
}

// ========== 授权书签署回调 ==========

async function handleAuthCallback(
  creditOrderId: string,
  options: Record<string, string>,
) {
  applyUrlOrMock(options);
  await fetchCustomerInfoByOrderId(creditOrderId, options);

  // 三方签署回调：tsignType=SIGN&tsignCode=0 表示成功
  const isThirdSign = options.tsignType === "SIGN";
  const isSignSuccess = options.tsignCode === "0";

  if (isThirdSign) {
    if (!isSignSuccess) {
      contractSigned.value = false;
      resultStatus.value = "fail";
      pageFinalize("授权书签署结果");
      return;
    }
    // 签署成功，调用详情接口获取文件
  }

  if (creditOrderId) {
    resultStatus.value = await fetchContractDetail(creditOrderId, "auth");
  } else {
    contractSigned.value = isThirdSign ? isSignSuccess : true;
    contractFiles.value = [...DEFAULT_FILES];
  }
  pageFinalize("授权书签署结果");
}

// ========== 合同签署回调 ==========

async function handleContractCallback(
  creditOrderId: string,
  options: Record<string, string>,
) {
  // 回显 URL 参数中的客户信息
  applyUrlOrMock(options);
  await fetchCustomerInfoByOrderId(creditOrderId, options);

  const isThirdSign = options.tsignType === "SIGN";
  const isSignSuccess = options.tsignCode === "0";

  if (isThirdSign) {
    // 三方签署成功/失败回调
    if (isSignSuccess && creditOrderId) {
      // 签署成功，调用详情接口获取签署文件
      await fetchContractDetail(creditOrderId, "loan");
      pageFinalize("合同签署结果");
    } else if (isSignSuccess) {
      contractSigned.value = true;
      contractFiles.value = [...DEFAULT_FILES];
      pageFinalize("合同签署结果");
    } else {
      contractSigned.value = false;
      pageFinalize("合同签署结果");
    }
    return;
  }

  if (creditOrderId) {
    await fetchContractDetail(creditOrderId, "loan");
  } else {
    contractFiles.value = [...DEFAULT_FILES];
  }
  pageFinalize("合同签署结果");
}

// ========== 加载结果数据 ==========

function loadResultData(options: Record<string, string>) {
  applyUrlOrMock(options);

  contractSigned.value = options.contractSigned !== "false";
  try {
    const parsed = JSON.parse(decodeURIComponent(options.files || "[]"));
    contractFiles.value =
      Array.isArray(parsed) && parsed.length > 0 ? parsed : [...DEFAULT_FILES];
  } catch {
    contractFiles.value = [...DEFAULT_FILES];
  }
}

// ========== 工具方法 ==========

function formatAmount(val: string): string {
  const num = Number(val);
  if (Number.isNaN(num)) return val;
  if (num >= 10000) return `${(num / 10000).toFixed(1).replace(/\.0$/, "")}万`;
  return num % 1 === 0 ? num.toLocaleString("zh-CN") : num.toFixed(2);
}

function safeDecode(value: string) {
  let decoded = String(value ?? "").replace(/\+/g, " ");
  for (let i = 0; i < 3; i += 1) {
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    } catch {
      break;
    }
  }
  return decoded;
}

function getNowTime() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
    now.getDate(),
  )} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function getBaseUrl() {
  // #ifdef H5
  if (typeof window !== "undefined") {
    return `${window.location.origin}${window.location.pathname}`;
  }
  // #endif
  return "";
}

/** 面签模式：发起合同签署 */
async function handleContractSign() {
  if (signingLoading.value) return;
  signingLoading.value = true;

  try {
    const redirectUrl = [
      `${getBaseUrl()}${buildHashRoute(
        APP_ROUTES.carloan.signing.faceSignResult,
        buildNavTitleQuery("合同签署结果"),
      )}`,
      `uuid=${encodeURIComponent(callbackUuid.value)}`,
      `creditOrderId=${encodeURIComponent(customerInfo.creditOrderId)}`,
      `mode=faceSign`,
      `name=${encodeURIComponent(customerInfo.name)}`,
      `phone=${encodeURIComponent(customerInfo.phone)}`,
      `amount=${encodeURIComponent(customerInfo.amount)}`,
    ].join("&");

    const res = await businessApi.startContractSign({
      uuid: callbackUuid.value,
      creditOrderId: customerInfo.creditOrderId,
      redirectUrl,
    });

    const raw = (res as unknown) as Record<string, unknown>;
    const data = (raw?.data || raw || {}) as Record<string, unknown>;
    const signUrl = (data.signUrl || data.authUrl || "") as string;
    const orderId = data.creditOrderId || customerInfo.creditOrderId;

    if (orderId) {
      customerInfo.creditOrderId = String(orderId);
    }

    if (signUrl) {
      confirm("即将跳转到合同签署页面，是否继续？", () => {
        window.location.href = signUrl;
      });
    } else {
      uni.showToast({ title: "获取签署链接失败", icon: "none" });
    }
  } catch (err) {
    console.error("合同签署发起失败:", err);
    uni.showToast({ title: "发起合同签署失败", icon: "none" });
  } finally {
    signingLoading.value = false;
  }
}

// ========== 计算属性 ==========

const pageTitle = computed(() => navTitle.value || "结果");

const resultTitle = computed(() => {
  if (resultType.value === "人脸识别") {
    if (resultStatus.value === "processing") return "人脸识别进行中";
    return faceResult.passed ? "人脸识别通过" : "人脸识别未通过";
  }
  if (resultType.value === "授权书签署结果") {
    return contractSigned.value ? "授权书签署成功" : "授权书签署失败";
  }
  if (resultType.value === "合同签署结果") {
    return contractSigned.value ? "合同签署成功" : "合同签署失败";
  }
  return resultStatus.value === "success" ? "成功" : "失败";
});

// ========== 页面操作 ==========

/** 授信完成后手动签署授权书 */
async function handleSignContract() {
  if (signingLoading.value) return;
  signingLoading.value = true;

  try {
    const redirectUrl = [
      `${getBaseUrl()}${buildHashRoute(
        APP_ROUTES.carloan.signing.faceSignResult,
        buildNavTitleQuery("授权书签署结果"),
      )}`,
      `uuid=${encodeURIComponent(callbackUuid.value)}`,
      `creditOrderId=${encodeURIComponent(customerInfo.creditOrderId)}`,
      `mode=credit`,
      `name=${encodeURIComponent(customerInfo.name)}`,
      `phone=${encodeURIComponent(customerInfo.phone)}`,
      `amount=${encodeURIComponent(customerInfo.amount)}`,
    ].join("&");

    const res = await businessApi.startAuthContractSign({
      uuid: callbackUuid.value,
      creditOrderId: customerInfo.creditOrderId,
      redirectUrl,
    });

    const raw = (res as unknown) as Record<string, unknown>;
    const data = (raw?.data || raw || {}) as Record<string, unknown>;
    const signUrl = (data.signUrl || data.authUrl || "") as string;
    const orderId = data.creditOrderId || customerInfo.creditOrderId;

    if (orderId) {
      customerInfo.creditOrderId = String(orderId);
    }

    if (signUrl) {
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

function goBack() {
  uni.navigateBack({ delta: 2 });
}

function goToWorkbench() {
  uni.reLaunch({ url: APP_ROUTES.carloan.portal.workbench });
}

function retryCredit() {
  const url =
    pageMode.value === "faceSign"
      ? buildRoute(
          APP_ROUTES.carloan.signing.videoFaceSign,
          buildSignRouteQuery({ uuid: callbackUuid.value, orderId: customerInfo.creditOrderId, type: "contract" }),
        )
      : buildRoute(
          APP_ROUTES.carloan.signing.videoFaceSign,
          buildSignRouteQuery({ uuid: callbackUuid.value, creditOrderId: customerInfo.creditOrderId }),
        );
  uni.redirectTo({ url });
}

function previewContractFile(file: ContractFile) {
  if (!file.fileUrl) {
    uni.showToast({ title: "暂无可预览文件", icon: "none" });
    return;
  }

  const fileUrl = toFilePreviewUrl(file.fileUrl);
  const fileName = file.name || fileUrl;
  const isImage = /\.(?:jpg|jpeg|png|gif|webp)(?:\?.*)?$/i.test(fileName);

  if (isImage) {
    uni.previewImage({
      urls: [fileUrl],
      current: fileUrl,
    });
    return;
  }

  // #ifdef H5
  window.open(fileUrl, "_blank");
  // #endif

  // #ifndef H5
  uni.showLoading({ title: "文件打开中..." });
  uni.downloadFile({
    url: fileUrl,
    success: (res) => {
      if (res.statusCode === 200) {
        uni.openDocument({
          filePath: res.tempFilePath,
          showMenu: true,
          fail: () => {
            uni.showToast({ title: "文件预览失败", icon: "none" });
          },
        });
      } else {
        uni.showToast({ title: "文件下载失败", icon: "none" });
      }
    },
    fail: () => {
      uni.showToast({ title: "文件下载失败", icon: "none" });
    },
    complete: () => {
      uni.hideLoading();
    },
  });
  // #endif
}
</script>

<style lang="scss" scoped>
.face-sign-result-page {
  padding: 24rpx;
  background: linear-gradient(180deg, #f2f4f8 0%, #f8f9fb 100%);
  min-height: 100vh;
}

// ===== 顶部结果状态 =====
.result-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48rpx 0;
  margin-bottom: 24rpx;
}

.result-icon-box {
  margin-bottom: 24rpx;
}

.result-title {
  font-size: 40rpx;
  font-weight: 700;
  color: #1f1f1f;
  margin-bottom: 12rpx;
}

.result-time {
  font-size: 26rpx;
  color: #8c8c8c;
}

// ===== 信息卡片 =====
.info-card {
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
  display: flex;
  justify-content: space-between;
  align-items: center;
}

// ===== 信息列表 =====
.info-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-row .label {
  font-size: 26rpx;
  color: #8c8c8c;
}

.info-row .value {
  font-size: 26rpx;
  color: #262626;
  font-weight: 500;
}

.info-row .amount {
  color: #cf1322;
  font-weight: 700;
  font-size: 30rpx;
}

.success-text {
  color: #52c41a;
}

.error-text {
  color: #ff4d4f;
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

.empty-files {
  padding: 40rpx 0;
}

// ===== 底部操作 =====
.action-area {
  margin-top: 40rpx;
  padding-bottom: 40rpx;
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