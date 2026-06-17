<template>
  <app-page nav-title="放款申请">
    <view class="loan-page">
      <view class="calc-band">
        <view>
          <text class="calc-label">预计月供</text>
          <text class="calc-desc">申请金额 × 月息 + 停车费</text>
        </view>
        <text class="calc-value">￥{{ monthlyPaymentText }}</text>
      </view>

      <AppForm :modelValue="loanInfo" :items="formItems" />

      <view class="footer-btn">
        <u-button
          type="primary"
          shape="circle"
          :loading="submitLoading"
          @click="handleSubmit"
        >
          提交进件
        </u-button>
      </view>
    </view>
  </app-page>
</template>

<script setup>
import { computed, reactive, ref } from "vue";
import { $u } from "uview-pro";
import { onLoad } from "@dcloudio/uni-app";
import AppForm from "@/components/app-form/app-form.vue";
import { useSessionStore } from "@/stores";
import { useCarloanApi } from "@/api/carloan";
import { formatMoney } from "@/common/pawnMock";
import { APP_ROUTES, buildRoute } from "@/common/navigation";
import { buildSupplementRouteQuery } from "@/common/carloan-route-query";

const sessionStore = useSessionStore();
const businessApi = useCarloanApi();

const submitLoading = ref(false);
const pageUuid = ref("");

const loanInfo = reactive({
  amount: "",
  periods: "",
  monthlyRate: "",
  parkingFee: "",
  vehicleStatus: "",
  garage: "",
  storeName: "",
  ownerName: "",
  deposit: 2000,
  remark: "",
});

const formItems = [
  {
    key: "amount",
    label: "申请金额",
    placeholder: "请输入申请金额",
    inputType: "number",
    required: true,
  },
  {
    key: "periods",
    label: "期次",
    placeholder: "请输入期次",
    inputType: "number",
    required: true,
  },
  {
    key: "monthlyRate",
    label: "月息(%)",
    placeholder: "请输入月息",
    inputType: "digit",
    required: false,
  },
  {
    key: "parkingFee",
    label: "停车费",
    placeholder: "请输入停车费",
    inputType: "number",
    required: false,
  },
  {
    key: "vehicleStatus",
    label: "车辆状态",
    placeholder: "请选择车辆状态",
    type: "select",
    required: false,
    options: [
      { label: "按揭", value: "按揭" },
      { label: "抵押", value: "抵押" },
      { label: "全款", value: "全款" },
    ],
  },
  {
    key: "garage",
    label: "车库",
    placeholder: "请选择车库",
    type: "select",
    required: false,
    options: ["义乌", "嘉兴", "台州", "温州", "宁波", "成都"].map((item) => ({
      label: item,
      value: item,
    })),
  },
  {
    key: "storeName",
    label: "门店",
    placeholder: "请输入门店",
    required: false,
  },
  {
    key: "ownerName",
    label: "负责人",
    placeholder: "请输入负责人",
    required: false,
  },
  {
    key: "deposit",
    label: "押金",
    placeholder: "请输入押金",
    inputType: "number",
    required: false,
  },
  {
    key: "remark",
    label: "备注",
    placeholder: "请输入备注",
    type: "textarea",
    required: false,
  },
];

const monthlyPayment = computed(() => {
  const amount = Number(loanInfo.amount || 0);
  const rate = Number(loanInfo.monthlyRate || 0);
  const parkingFee = Number(loanInfo.parkingFee || 0);
  if (
    !Number.isFinite(amount) ||
    !Number.isFinite(rate) ||
    !Number.isFinite(parkingFee)
  ) {
    return 0;
  }
  return (amount * rate) / 100 + parkingFee;
});

const monthlyPaymentText = computed(() => formatMoney(monthlyPayment.value));

function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === "";
}

function validateLoanInfo() {
  // 核心必填：uuid、amount、periods（uuid 在 handleSubmit 中校验）
  if (isBlank(loanInfo.amount)) {
    $u.toast("请填写申请金额", "error");
    return false;
  }
  if (isBlank(loanInfo.periods)) {
    $u.toast("请填写期次", "error");
    return false;
  }

  const amountValue = Number(loanInfo.amount);
  if (!Number.isFinite(amountValue) || amountValue <= 0) {
    $u.toast("申请金额需为大于0的有效数字", "error");
    return false;
  }

  const periodsValue = Number(loanInfo.periods);
  if (!Number.isFinite(periodsValue) || periodsValue <= 0) {
    $u.toast("期次需为大于0的有效数字", "error");
    return false;
  }

  return true;
}

onLoad((options) => {
  pageUuid.value = options?.uuid || "";
});

async function handleSubmit() {
  if (!validateLoanInfo()) return;

  const uuid = pageUuid.value;
  if (!uuid) {
    $u.toast("缺少客户标识，请重新进入页面", "error");
    return;
  }

  submitLoading.value = true;
  try {
    const res = await businessApi.creditApply({
      uuid,
      amount: Number(loanInfo.amount),
      periods: Number(loanInfo.periods),
      // 典当特有字段（后端支持扩展参数）
      orderType: "1",
      parkingFee: loanInfo.parkingFee ? Number(loanInfo.parkingFee) : undefined,
      vehicleStatus: loanInfo.vehicleStatus || undefined,
      garage: loanInfo.garage || undefined,
      storeName: loanInfo.storeName || undefined,
      ownerName: loanInfo.ownerName || undefined,
      deposit: loanInfo.deposit ? Number(loanInfo.deposit) : undefined,
      remark: loanInfo.remark || undefined,
    });

    if (res?.code === 200) {
      const creditOrderId = res.data?.creditOrderId || "";
      sessionStore.setOrderInfo({
        businessType: "pawn",
        pawnLoanInfo: { ...loanInfo },
        creditOrderId,
      });
      $u.toast("典当进件已提交", "success");
      setTimeout(() => {
        uni.redirectTo({
          url: buildRoute(APP_ROUTES.carloan.supplement.supplementList, buildSupplementRouteQuery({ creditOrderId })),
        });
      }, 800);
    } else {
      $u.toast(res?.msg || "提交失败，请重试", "error");
    }
  } catch (e) {
    console.error("典当进件提交失败", e);
    $u.toast("提交失败，请重试", "error");
  } finally {
    submitLoading.value = false;
  }
}
</script>

<style lang="scss" scoped>
.loan-page {
  min-height: 100%;
  padding: 28rpx 24rpx 140rpx;
  background: linear-gradient(180deg, #f7f8f9 0%, #ffffff 100%);
}

.calc-band {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24rpx;
  padding: 28rpx;
  border-radius: 12rpx;
  background: #fff7ed;
  border: 1rpx solid #fed7aa;
}

.calc-label,
.calc-desc {
  display: block;
}

.calc-label {
  font-size: 30rpx;
  font-weight: 700;
  color: #111827;
}

.calc-desc {
  margin-top: 8rpx;
  font-size: 23rpx;
  color: #9a3412;
}

.calc-value {
  flex-shrink: 0;
  font-size: 40rpx;
  font-weight: 800;
  color: #ea580c;
}

.footer-btn {
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