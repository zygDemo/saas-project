<template>
  <app-page nav-title="绑定银行卡">
    <view class="bind-card-page">
      <!-- 卡片展示 -->
      <view v-if="savedCards.length > 0" class="card-list">
        <view
          v-for="(card, index) in savedCards"
          :key="index"
          class="bank-card"
          :class="{ selected: selectedCardIndex === index }"
          @click="selectCard(index)"
        >
          <view class="card-header">
            <text class="bank-name">{{ card.bankName || "未知银行" }}</text>
            <u-icon
              v-if="selectedCardIndex === index"
              name="checkbox-mark"
              size="36"
              color="#fff"
            />
          </view>
          <view class="card-number">
            <text class="dots">**** **** **** </text>
            <text class="tail">{{ card.cardNo?.slice(-4) || "****" }}</text>
          </view>
          <view class="card-holder">
            <text>{{ card.cardHolder || customerName || "待填" }}</text>
          </view>
        </view>
      </view>

      <!-- 新增卡片 -->
      <view class="add-card-section">
        <view class="section-title">
          <text class="title-text">{{ savedCards.length > 0 ? "添加新卡" : "绑定银行卡" }}</text>
          <text class="title-sub">请填写客户本人银行卡信息</text>
        </view>

        <AppForm :modelValue="form" :items="formItems" />
      </view>

      <!-- 底部按钮 -->
      <view class="footer-actions">
        <u-button
          type="primary"
          size="large"
          shape="circle"
          :loading="submitting"
          @click="handleSave"
        >
          保存并继续
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

function saveSignProgress(status) {
  if (!creditOrderId.value || !status) return;
  const progressMap = uni.getStorageSync(SIGN_PROGRESS_STORAGE_KEY) || {};
  progressMap[creditOrderId.value] = {
    status,
    updatedAt: Date.now(),
  };
  uni.setStorageSync(SIGN_PROGRESS_STORAGE_KEY, progressMap);
}

const creditOrderId = ref("");
const uuidVal = ref("");
const customerName = ref("");
const submitting = ref(false);
const selectedCardIndex = ref(-1);
const savedCards = ref([]);

const form = reactive({
  cardHolder: "",
  bankName: "",
  cardNo: "",
  phone: "",
  idCard: "",
  isDefault: false,
});

const bankOptions = [
  { label: "中国工商银行", value: "中国工商银行" },
  { label: "中国建设银行", value: "中国建设银行" },
  { label: "中国银行", value: "中国银行" },
  { label: "中国农业银行", value: "中国农业银行" },
  { label: "招商银行", value: "招商银行" },
  { label: "平安银行", value: "平安银行" },
  { label: "交通银行", value: "交通银行" },
  { label: "浦发银行", value: "浦发银行" },
  { label: "其他", value: "其他" },
];

const formItems = computed(() => [
  {
    key: "cardHolder",
    label: "开户姓名",
    placeholder: "请输入开户姓名",
    required: true,
  },
  {
    key: "bankName",
    label: "开户银行",
    placeholder: "请选择开户银行",
    type: "select",
    required: true,
    options: bankOptions,
  },
  {
    key: "cardNo",
    label: "银行卡号",
    placeholder: "请输入银行卡号",
    type: "number",
    required: true,
    maxlength: 19,
  },
  {
    key: "phone",
    label: "预留手机号",
    placeholder: "请输入预留手机号",
    type: "number",
    required: true,
    maxlength: 11,
  },
  {
    key: "idCard",
    label: "身份证号",
    placeholder: "请输入开户身份证号",
    required: true,
    maxlength: 18,
  },
  {
    key: "isDefault",
    label: "设为默认收款卡",
    type: "checkbox",
    required: false,
  },
]);

onLoad((options) => {
  creditOrderId.value = options?.creditOrderId || "";
  uuidVal.value = options?.uuid || "";
  customerName.value = options?.customerName || "";
  form.cardHolder = customerName.value;
});

onMounted(() => {
  loadCards();
});

async function loadCards() {
  try {
    // TODO: 等待后端提供银行卡列表接口
    // const res = await businessApi.getBankCards({ uuid: uuidVal.value });
    // if (res?.code === 200) {
    //   savedCards.value = res.data || [];
    // }
  } catch (e) {
    console.error("获取银行卡失败", e);
  }
}

function selectCard(index) {
  selectedCardIndex.value = index;
}

function validateCardNo(no) {
  const s = String(no || "").replace(/\s/g, "");
  if (!/^\d{16,19}$/.test(s)) return false;
  let sum = 0;
  let alternate = false;
  for (let i = s.length - 1; i >= 0; i--) {
    let n = parseInt(s.substring(i, i + 1), 10);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

async function handleSave() {
  if (!form.cardHolder.trim()) {
    $u.toast("请输入开户姓名", "error");
    return;
  }
  if (!form.bankName) {
    $u.toast("请选择开户银行", "error");
    return;
  }
  if (!form.cardNo.trim()) {
    $u.toast("请输入银行卡号", "error");
    return;
  }
  if (!validateCardNo(form.cardNo)) {
    $u.toast("银行卡号格式不正确", "error");
    return;
  }
  if (!/^1[3-9]\d{9}$/.test(form.phone)) {
    $u.toast("请输入正确的手机号", "error");
    return;
  }
  if (!form.idCard.trim()) {
    $u.toast("请输入身份证号", "error");
    return;
  }

  submitting.value = true;
  try {
    // TODO: 等待后端提供绑卡接口
    // await businessApi.bindBankCard({
    //   creditOrderId: creditOrderId.value,
    //   uuid: uuidVal.value,
    //   ...form,
    //   cardNo: String(form.cardNo).replace(/\s/g, ""),
    // });

    saveSignProgress("SIGNING_CONTRACT");
    $u.toast("绑卡成功", "success");
    setTimeout(() => {
      uni.navigateBack();
    }, 800);
  } catch (e) {
    $u.toast("绑卡失败，请重试", "error");
  } finally {
    submitting.value = false;
  }
}
</script>

<style lang="scss" scoped>
.bind-card-page {
  min-height: 100%;
  padding: 24rpx 24rpx 160rpx;
  background: linear-gradient(180deg, #f2f4f8 0%, #f8f9fb 100%);
}

/* ===== 银行卡列表 ===== */
.card-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  margin-bottom: 24rpx;
}

.bank-card {
  background: linear-gradient(135deg, #1e3a8a, var(--u-type-primary));
  border-radius: 20rpx;
  padding: 32rpx;
  color: #fff;
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
  border: 2rpx solid transparent;

  &.selected {
    border-color: #10b981;
    box-shadow: 0 0 0 4rpx rgba(16, 185, 129, 0.2);
  }

  &:active {
    transform: scale(0.98);
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.bank-name {
  font-size: 32rpx;
  font-weight: 700;
}

.card-number {
  display: flex;
  align-items: center;
  font-size: 40rpx;
  font-weight: 600;
  letter-spacing: 2rpx;
  margin-bottom: 20rpx;
}

.dots {
  opacity: 0.9;
}

.tail {
  font-weight: 700;
}

.card-holder {
  font-size: 26rpx;
  opacity: 0.85;
}

/* ===== 添加卡片 ===== */
.add-card-section {
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx;
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