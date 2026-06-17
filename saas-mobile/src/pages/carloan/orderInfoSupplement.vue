<template>
  <app-page nav-title="订单信息">
    <view class="order-supplement-page">
      <view class="section-title">
        <view class="title-dot" />
        <u-text text="订单信息" size="32rpx" bold />
      </view>

      <AppForm :modelValue="form" :items="readonlyFormItems" @change="onFormChange" />

      <!-- 底部按钮 -->
      <view v-if="!readonly" class="footer-btn">
        <u-button
          type="default"
          shape="circle"
          :loading="submitLoading"
          @click="handleSave"
        >
          保存
        </u-button>
        <u-button
          type="primary"
          shape="circle"
          :loading="submitLoading"
          @click="handleNext"
        >
          下一步
        </u-button>
      </view>
    </view>
  </app-page>
</template>

<script setup>
import { $u } from "uview-pro";
import { reactive, ref, computed } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { useCarloanApi } from "@/api/carloan";
import { isValidMoney, validateRequiredFields } from "@/common/validators";
import AppForm from "@/components/app-form/app-form.vue";

const businessApi = useCarloanApi();

const submitLoading = ref(false);
const productOptions = ref([]);
const productList = ref([]); // 保存完整产品列表数据
const loanPurposeOptions = ref([]);
const loading = ref(false);
const dictLoading = ref(false);
const pageLoading = ref(false);

// 页面参数
const pageUuid = ref("");
const creditId = ref("");
const creditOrderId = ref("");
const readonly = ref(false);

// 表单数据
const form = reactive({
  amount: "", // 申请金额
  loanPurpose: "", // 贷款用途
  productId: "", // 产品ID
  periods: "", // 申请期数
  repaymentMethod: "", // 还款方式
  executeRate: "", // 执行利率（综合年化）
});

/** 加载产品列表 */
async function loadProductList() {
  loading.value = true;
  try {
    const res = await businessApi.getProductList();
    if (res && res.code === 200 && res.data) {
      // 保存完整产品数据
      productList.value = res.data;
      productOptions.value = res.data.map((item) => ({
        label: item.productName || item.name || String(item),
        value: String(item.id || item.productCode || item.productName),
      }));
    }
  } catch (e) {
    console.error("获取产品列表失败", e);
  } finally {
    loading.value = false;
  }
}

/** 表单字段变化处理 */
function onFormChange({ key, value }) {
  if (readonly.value) return;

  // 产品选择变化时，回填相关信息
  if (key === "productId" && value) {
    handleProductChange(value);
  }
}

/** 产品选择变化处理 - 回填产品相关信息 */
function handleProductChange(productId) {
  if (!productId) return;
  // 查找选中的产品
  const selectedProduct = productList.value.find(
    (item) => String(item.id) === String(productId)
  );
  if (selectedProduct) {
    // 回填期次 (term)
    if (selectedProduct.term) {
      form.periods = String(selectedProduct.term);
    }
    // 回填还款方式 (repaymentMethod)
    if (selectedProduct.repaymentMethod) {
      form.repaymentMethod = formatRepaymentMethodToLabel(
        selectedProduct.repaymentMethod
      );
    }
    // 回填执行利率 (executeRate)
    if (selectedProduct.executeRate) {
      // 后端返回的是小数(如0.18)，转换为百分比整数(如18)
      const ratePercent = Math.round(selectedProduct.executeRate * 100);
      form.executeRate = `${ratePercent}%`;
    }
  }
}

onLoad((options) => {
  pageUuid.value = options?.uuid || "";
  readonly.value = options?.readonly === "1" || options?.readonly === "true";
  if (options?.creditOrderId) {
    creditOrderId.value = String(options.creditOrderId);
    loadCreditDetail();
  }
  loadProductList();
  loadDictData();
});

/** 加载授信申请详情 */
async function loadCreditDetail() {
  if (!creditOrderId.value) return;
  pageLoading.value = true;
  try {
    const res = await businessApi.getCreditDetailByOrderId(creditOrderId.value);
    if (res && res.code === 200 && res.data) {
      const data = res.data;
      pageUuid.value = data.uuid || pageUuid.value;
      creditId.value = String(data.id || "");
      // 回填表单数据
      form.amount = data.pushQuota ? String(data.pushQuota) : "";
      form.loanPurpose = data.loanPurpose || "";
      form.productId = data.productId ? String(data.productId) : "";
      form.periods = data.periods ? String(data.periods) : "";
      // 还款方式：后端返回数字，需要转换为中文显示
      form.repaymentMethod = formatRepaymentMethodToLabel(data.repaymentMethod);
      form.executeRate = data.executeRate
        ? `${Number(data.executeRate)}%`
        : "";
    }
  } catch (e) {
    console.error("获取授信详情失败", e);
    $u.toast("获取详情失败", "error");
  } finally {
    pageLoading.value = false;
  }
}

/** 还款方式数字转中文 */
function formatRepaymentMethodToLabel(val) {
  const map = {
    1: "等额本息",
    2: "等额本金",
    3: "先息后本",
    4: "一次性还本付息",
  };
  return map[val] || val || "";
}

/** 还款方式中文转数字 */
function formatRepaymentMethodToValue(label) {
  const map = {
    等额本息: 1,
    等额本金: 2,
    先息后本: 3,
    一次性还本付息: 4,
  };
  return map[label] ?? label;
}

/** 加载字典数据（贷款用途等） */
async function loadDictData() {
  dictLoading.value = true;
  try {
    const res = await businessApi.getDictDataList("loan_purpose");
    if (res && res.code === 200 && res.data) {
      loanPurposeOptions.value = res.data.map((item) => ({
        label: item.dictLabel || item.name || String(item),
        value: item.dictValue || item.value || String(item),
      }));
    }
  } catch (e) {
    console.error("获取贷款用途字典失败", e);
  } finally {
    dictLoading.value = false;
  }
}

const formItems = computed(() => [
  {
    key: "amount",
    label: "申请金额(元)",
    type: "number",
    required: true,
    placeholder: "请输入申请金额",
  },
  {
    key: "loanPurpose",
    label: "贷款用途",
    type: "select",
    placeholder: dictLoading.value ? "加载中..." : "请选择贷款用途",
    required: true,
    options: loanPurposeOptions.value,
  },
  {
    key: "productId",
    label: "产品",
    type: "select",
    placeholder: loading.value ? "加载中..." : "请选择产品",
    required: true,
    options: productOptions.value,
  },
  {
    key: "periods",
    label: "申请期数",
    type: "text",
    disabled: true,
  },
  {
    key: "repaymentMethod",
    label: "还款方式",
    type: "text",
    disabled: true,
  },
  {
    key: "executeRate",
    label: "执行利率",
    type: "text",
    placeholder: "请选择执行利率",
    disabled: true,
  },
]);

const readonlyFormItems = computed(() =>
  formItems.value.map((item) => ({
    ...item,
    disabled: readonly.value || item.disabled,
  })),
);

async function saveOrderInfo() {
  if (readonly.value) return false;

  // ========== 表单必填校验 ==========
  // 申请金额、贷款用途、产品为必填项
  const requiredFields = [
    { key: "amount", label: "申请金额" },
    { key: "loanPurpose", label: "贷款用途" },
    { key: "productId", label: "产品" },
  ];
  if (!validateRequiredFields(form, requiredFields, (msg) => $u.toast(msg, "error"))) {
    return false;
  }

  // 申请金额格式校验（正数，最多两位小数）
  if (form.amount && !isValidMoney(form.amount)) {
    $u.toast("申请金额格式不正确，请输入正确金额", "error");
    return false;
  }
  // ========== 校验通过，组装提交数据 ==========

  submitLoading.value = true;
  try {
    // 组装提交数据
    const submitData = {
      creditOrderId: creditOrderId.value || undefined,
      amount: Number(form.amount),
      loanPurpose: form.loanPurpose,
      productId: Number(form.productId),
      periods: form.periods ? Number(form.periods) : undefined,
      repaymentMethod: form.repaymentMethod
        ? formatRepaymentMethodToValue(form.repaymentMethod)
        : undefined,
      executeRate: form.executeRate
        ? Number(String(form.executeRate).replace("%", ""))
        : undefined,
      id: creditId.value || undefined,
    };

    const res = await businessApi.updateCredit(submitData);
    if (res && res.code === 200) {
      $u.toast("保存成功", "success");
      return true;
    } else {
      $u.toast(res?.msg || "保存失败", "error");
      return false;
    }
  } catch (e) {
    console.error("保存授信申请失败", e);
    $u.toast("保存失败，请重试", "error");
    return false;
  } finally {
    submitLoading.value = false;
  }
}

async function handleSave() {
  await saveOrderInfo();
}

async function handleNext() {
  const success = await saveOrderInfo();
  if (!success) return;

  const params = [
    `uuid=${encodeURIComponent(pageUuid.value)}`,
    `creditOrderId=${encodeURIComponent(creditOrderId.value)}`,
    readonly.value ? "readonly=1" : "",
  ].filter(Boolean).join("&");
  uni.navigateTo({
    url: `/pages/carloan/fileInfoSupplement?${params}`,
  });
}
</script>

<style lang="scss" scoped>
.order-supplement-page {
  padding: 28rpx 24rpx 140rpx;
  background: linear-gradient(180deg, #f7f8f9 0%, #ffffff 100%);
}

.footer-btn {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 24rpx;
  padding: 20rpx 32rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background: #ffffff;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.06);

  :deep(.u-btn) {
    flex: 1;
  }
}
</style>
