<template>
  <app-page nav-title="车辆资料">
    <view class="carinfo-supplement-page">
      <!-- 车辆基本信息 -->
      <view class="section-title-row">
        <view class="section-title">
          <u-text text="车辆基本信息" size="32rpx" bold />
        </view>
        <view v-if="!readonly" class="query-buttons">
          <u-button
            type="primary"
            size="mini"
            :loading="modelLoading"
            @click="queryVehicleModel"
          >
            查询车型
          </u-button>
        </view>
      </view>

      <!-- 车牌号、车辆识别代码、车型显示 -->
      <view class="info-display">
        <view class="info-item">
          <text class="info-label">车牌号：</text>
          <text class="info-value">{{ form.plateNumber || "暂无" }}</text>
        </view>
        <view class="info-item">
          <text class="info-label">车辆识别码：</text>
          <text class="info-value">{{ form.vehicleCode || "暂无" }}</text>
        </view>
      </view>

      <AppForm :modelValue="form" :items="readonlyBasicFormItems" />

      <!-- 车辆状况 -->
      <view class="section-title">
        <u-text text="车辆状况" size="32rpx" bold />
      </view>

      <AppForm :modelValue="form" :items="readonlyStatusFormItems" />

      <!-- 车辆评估金额 -->
      <view class="section-title-row">
        <view class="section-title">
          <u-text text="车辆评估金额" size="32rpx" bold />
        </view>
        <view v-if="!readonly" class="query-buttons">
          <u-button
            type="primary"
            size="mini"
            :loading="priceLoading"
            @click="queryVehiclePrice"
          >
            查询车价
          </u-button>
        </view>
      </view>

      <AppForm :modelValue="form" :items="readonlyEvaluationFormItems" />

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

<script setup lang="ts">
import { $u } from "uview-pro";
import { computed, reactive, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { useLocalStore } from "@/stores";
import { useCarloanApi } from "@/api/carloan";
import { isValidMoney, validateRequiredFields } from "@/common/validators";
import { APP_ROUTES, buildRoute } from "@/common/navigation";
import { buildSupplementRouteQuery } from "@/common/carloan-route-query";
// @ts-expect-error - AppForm 缺少类型声明
import AppForm from "@/components/app-form/app-form.vue";
import { useCarloanStore } from "@/stores/carloan";

const localStore = useLocalStore()
const carloanStore = useCarloanStore();
const businessApi = useCarloanApi();

// ========== 状态定义 ==========
const submitLoading = ref(false);
const pageLoading = ref(false);
const priceLoading = ref(false);
const modelLoading = ref(false);
const creditOrderId = ref("");
const readonly = ref(false);

/** 安全转为字符串 */
function toStr(val: unknown): string {
  return val != null ? String(val) : "";
}

/** 评估价格单项结构 */
interface EvalPriceItem {
  condition: string;
  dealer_price: number;
  dealer_buy_price: number;
  individual_price: number;
  dealer_low_buy_price: number;
  dealer_low_sold_price: number;
  dealer_high_sold_price: number;
  individual_low_sold_price: number;
}

/** 从 evalPrices JSON 字符串中提取指定 condition 的元素（默认 "good"） */
function getEvalPriceItem(
  data: Record<string, unknown>,
  condition = "good",
): EvalPriceItem | null {
  const evalPricesStr = data.evalPrices as string | undefined;
  if (!evalPricesStr) return null;
  try {
    const list = JSON.parse(evalPricesStr) as EvalPriceItem[];
    return list.find((item) => item.condition === condition) || null;
  } catch {
    return null;
  }
}

/** 获取车辆评估价格（优先取 good 条件的 dealer_price，兜底 modelPrice） */
function getVehiclePrice(data: Record<string, unknown>): number | string | null {
  const goodItem = getEvalPriceItem(data, "good");
  if (goodItem?.dealer_price != null) {
    return goodItem.dealer_price;
  }
  const modelPrice = data.modelPrice;
  if (modelPrice != null && modelPrice !== "") {
    return Number(modelPrice);
  }
  return null;
}

// ========== 表单数据 ==========
const form = reactive({
  // 基本信息
  plateNumber: "", // 车牌号（只读）
  vehicleCode: "", // 车辆识别代码（只读）
  modelId: "", // 车型ID
  vehicleModel: "", // 车型（可编辑 + 查询填充）
  vehicleBrand: "", // 车辆品牌（可编辑 + 查询填充）
  fuelType: "", // 燃油类型
  mileage: "", // 行驶里程
  carColor: "", // 车辆颜色（可编辑 + 查询填充）
  registerDate: "", // 上牌日期
  // 车辆状况
  isAccident: "",
  isMortgage: "",
  usageType: "",
  // 车辆评估金额
  valuationPrice: "",
});

// ========== 数据加载 ==========

/** 字段映射表：接口字段 → form 字段 + 转换函数 */
const FIELD_MAP: Record<
  string,
  { key: string; transform?: (v: unknown) => string }
> = {
  vehicleBrand: { key: "vehicleBrand" },
  vehicleModel: { key: "vehicleModel" },
  fuelType: { key: "fuelType", transform: toStr },
  mileage: { key: "mileage" },
  vehicleColor: { key: "carColor" },
  isFault: { key: "isAccident", transform: toStr },
  isMortgage: { key: "isMortgage", transform: toStr },
  usageNature: { key: "usageType" },
  valuationPrice: { key: "valuationPrice", transform: toStr },
  registerDate: { key: "registerDate" },
  plateNumber: { key: "plateNumber" },
  vehicleCode: { key: "vehicleCode" },
};

/** 加载车辆信息 */
async function loadData() {
  if (!carloanStore.pageContext.uuid) return;

  pageLoading.value = true;
  try {
    const res = await businessApi.getVehicleInfo(carloanStore.pageContext.uuid);
    if (res?.code === 200 && res.data) {
      const data = res.data as Record<string, unknown>;

      // 通用字段映射加载
      for (const [apiField, { key, transform }] of Object.entries(FIELD_MAP)) {
        const val = data[apiField];
        if (val != null || val !== undefined) {
          (form as any)[key] = transform ? transform(val) : val;
        }
      }
    }
  } catch (e) {
    console.error("加载车辆信息失败", e);
  } finally {
    pageLoading.value = false;
  }
}

// ========== 页面初始化 ==========

onLoad((options) => {
    carloanStore.syncFromRouteQuery(options || {});
    if (!carloanStore.pageContext.uuid && localStore.userInfo?.uuid) {
      carloanStore.pageContext.uuid = localStore.userInfo.uuid;
    }
  creditOrderId.value = options?.creditOrderId || "";
  readonly.value = options?.readonly === "1" || options?.readonly === "true";
  loadData();
});

// ========== 表单配置 ==========

// 车辆基本信息表单配置
const basicFormItems = [
  {
    key: "vehicleModel",
    label: "车型",
    type: "text",
    placeholder: "请输入车型",
    required: true,
  },
  {
    key: "vehicleBrand",
    label: "车辆品牌",
    type: "text",
    placeholder: "请输入车辆品牌",
    required: true,
  },
  {
    key: "fuelType",
    label: "燃油类型",
    type: "select",
    placeholder: "请选择燃油类型",
    required: true,
    options: [
      { label: "油车", value: "1" },
      { label: "纯电", value: "2" },
      { label: "油电混合", value: "3" },
    ],
  },
  {
    key: "carColor",
    label: "车辆颜色",
    type: "text",
    placeholder: "请输入车辆颜色",
    required: true,
  },
  {
    key: "mileage",
    label: "行驶里程(公里)",
    type: "number",
    placeholder: "请输入行驶里程(km)",
    required: true,
  },
];

// 车辆状况表单配置
const statusFormItems = [
  {
    key: "isAccident",
    label: "是否发生过重大事故",
    labelWidth: "280",
    type: "select",
    placeholder: "请选择",
    required: true,
    options: [
      { label: "是", value: "1" },
      { label: "否", value: "2" },
    ],
  },
  {
    key: "isMortgage",
    label: "车辆是否抵押",
    type: "select",
    placeholder: "请选择",
    required: true,
    options: [
      { label: "是", value: "1" },
      { label: "否", value: "2" },
    ],
  },
  {
    key: "usageType",
    label: "车辆使用性质",
    type: "select",
    placeholder: "请选择车辆使用性质",
    required: true,
    options: [
      { label: "非营运", value: "非营运" },
      { label: "营运", value: "营运" },
      { label: "租赁", value: "租赁" },
      { label: "其他", value: "其他" },
    ],
  },
];

// 车辆评估金额表单配置
const evaluationFormItems = [
  {
    key: "valuationPrice",
    label: "评估金额(元)",
    type: "number",
    placeholder: "请输入车辆评估金额(元)",
    required: true,
  },
];

const readonlyBasicFormItems = computed(() =>
  basicFormItems.map((item) => ({
    ...item,
    disabled: readonly.value || Boolean((item as any).disabled),
  })),
);

const readonlyStatusFormItems = computed(() =>
  statusFormItems.map((item) => ({
    ...item,
    disabled: readonly.value || Boolean((item as any).disabled),
  })),
);

const readonlyEvaluationFormItems = computed(() =>
  evaluationFormItems.map((item) => ({
    ...item,
    disabled: readonly.value || Boolean((item as any).disabled),
  })),
);

// ========== 查询接口 ==========

/** 查询车价（通过车辆识别代码） */
async function queryVehiclePrice() {
  if (readonly.value) return;
  console.log(form);
  if (!form.vehicleCode) {
    $u.toast("请先确保车辆识别代码已录入");
    return;
  }

  priceLoading.value = true;
  try {
    const res = await businessApi.getVehiclePriceByVin({
      carNo: form.plateNumber || undefined,
      mile: form.mileage || undefined,
      modelId: form.modelId || undefined,
      regDate: formatRegDate(form.registerDate),
      vin: form.vehicleCode || undefined,
    });
    if (res?.code === 200 && res.data) {
      const data = res.data as Record<string, unknown>;
      const price = getVehiclePrice(data);
      if (price != null && price !== "") {
        form.valuationPrice = String(Math.round(Number(price) * 10000));
        $u.toast("查询成功，已自动填充评估金额", "success");
      } else {
        $u.toast("未查询到价格信息");
      }
    } else {
      $u.toast(res?.msg || "查询车价失败");
    }
  } catch (e: any) {
    console.error("查询车价失败", e);
    $u.toast(e?.msg || "查询失败，请重试");
  } finally {
    priceLoading.value = false;
  }
}

function formatRegDate(value: string) {
  const text = String(value || "").trim();
  if (!text) return undefined;
  const match = text.match(/^(\d{4})[-/.](\d{1,2})/);
  if (!match) return text;
  const [, year, month] = match;
  return `${year}-${String(month).padStart(2, "0")}`;
}

/** 查询车型（通过车辆识别代码） */
async function queryVehicleModel() {
  if (readonly.value) return;

  if (!form.vehicleCode) {
    $u.toast("请先确保车辆识别代码已录入");
    return;
  }

  modelLoading.value = true;
  try {
    const res = await businessApi.requestVehicleModel(form.vehicleCode);
    if (res?.code === 200 && res.data) {
      const data = res.data as Record<string, unknown>;
      const modelInfoStr = data.modelInfo as string | undefined;

      if (!modelInfoStr) {
        $u.toast("未查询到车型信息");
        return;
      }

      try {
        const parsed = JSON.parse(modelInfoStr);
        interface VehicleModelOption {
          modelId?: string | number;
          modelName?: string;
          modelPrice?: number;
          seriesGroupName?: string;
          brandName?: string;
          color?: string;
        }
        const modelList = parsed?.modelInfo as VehicleModelOption[] | undefined;

        if (modelList && modelList.length > 0) {
          const model = modelList[0];
          if (model.modelId != null) form.modelId = String(model.modelId);
          if (model.modelName) form.vehicleModel = model.modelName;
          if (model.brandName) form.vehicleBrand = model.brandName;
          if (model.color) form.carColor = model.color;
          if (model.modelPrice)
            form.valuationPrice = String(Math.round(model.modelPrice * 10000));
          $u.toast("查询成功，已自动填充车型、品牌、颜色和评估金额", "success");
        } else {
          $u.toast("未查询到车型信息");
        }
      } catch {
        $u.toast("车型数据解析失败");
      }
    } else {
      $u.toast(res?.msg || "查询车型失败");
    }
  } catch (e: any) {
    console.error("查询车型失败", e);
    $u.toast(e?.msg || "查询失败，请重试");
  } finally {
    modelLoading.value = false;
  }
}

// ========== 保存 ==========

async function saveVehicleInfo() {
  if (readonly.value) return false;

  if (!carloanStore.pageContext.uuid) {
    $u.toast("缺少客户标识");
    return false;
  }

  // ========== 表单必填校验 ==========
  const requiredFields = [
    { key: "vehicleModel", label: "车型" },
    { key: "vehicleBrand", label: "车辆品牌" },
    { key: "fuelType", label: "燃油类型" },
    { key: "carColor", label: "车辆颜色" },
    { key: "mileage", label: "行驶里程" },
    { key: "isAccident", label: "是否发生事故" },
    { key: "isMortgage", label: "车辆是否抵押" },
    { key: "usageType", label: "车辆使用性质" },
    { key: "valuationPrice", label: "评估金额" },
  ];
  if (!validateRequiredFields(form, requiredFields, (msg) => $u.toast(msg))) {
    return false;
  }

  // 评估金额格式校验（正数，最多两位小数）
  if (form.valuationPrice && !isValidMoney(form.valuationPrice)) {
    $u.toast("评估金额格式不正确，请输入正确金额");
    return false;
  }
  // ========== 校验通过，组装提交数据 ==========

  submitLoading.value = true;
  try {
    const data: Record<string, unknown> = {
      uuid: carloanStore.pageContext.uuid,
      creditOrderId: creditOrderId.value || undefined,
      vehicleBrand: form.vehicleBrand || undefined,
      vehicleModel: form.vehicleModel || undefined,
      vehicleCode: form.vehicleCode || undefined,
      fuelType: form.fuelType ? Number(form.fuelType) : undefined,
      mileage: form.mileage || undefined,
      vehicleColor: form.carColor || undefined,
      isFault: form.isAccident ? Number(form.isAccident) : undefined,
      isMortgage: form.isMortgage ? Number(form.isMortgage) : undefined,
      usageNature: form.usageType || undefined,
      valuationPrice: form.valuationPrice
        ? Number(form.valuationPrice)
        : undefined,
      modelId: form.modelId || undefined,
    };

    const res = await businessApi.addOrUpdateVehicle(data);
    if (res?.code === 200) {
      $u.toast("保存成功", "success");
      return true;
    } else {
      $u.toast(res?.msg || "车辆信息保存失败");
      return false;
    }
  } catch (e: any) {
    console.error("保存车辆信息失败", e);
    $u.toast(e?.msg || "保存失败，请重试");
    return false;
  } finally {
    submitLoading.value = false;
  }
}

async function handleSave() {
  await saveVehicleInfo();
}

async function handleNext() {
  const success = await saveVehicleInfo();
  if (!success) return;

  const supplementRouteQuery = buildSupplementRouteQuery({
    uuid: carloanStore.pageContext.uuid,
    creditOrderId: creditOrderId.value,
    readonly: readonly.value ? 1 : undefined,
  });
  uni.navigateTo({
    url: buildRoute(APP_ROUTES.carloan.supplement.orderInfoSupplement, supplementRouteQuery),
  });
}
</script>

<style lang="scss" scoped>
.carinfo-supplement-page {
  padding: 28rpx 24rpx 140rpx;
  background: linear-gradient(180deg, #f7f8f9 0%, #ffffff 100%);
}

.section-title {
  margin-bottom: 20rpx;
}

// 信息展示卡片
.info-display {
  background: #f8f9fa;
  border-radius: 12rpx;
  padding: 20rpx 24rpx;
  margin-bottom: 28rpx;

  .info-item {
    display: flex;
    align-items: center;
    margin-bottom: 12rpx;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .info-label {
    font-size: 28rpx;
    color: #606266;
    width: 200rpx;
    flex-shrink: 0;
  }

  .info-value {
    font-size: 28rpx;
    color: #303133;
    font-weight: 500;
    word-break: break-all;
  }
}

// 标题行（标题和按钮两端对齐）
.section-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;

  .section-title {
    margin-bottom: 0;
  }

  .query-buttons {
    flex-shrink: 0;
  }
}

// 查询按钮
.query-buttons {
  u-button {
    min-width: 120rpx;
  }
}

// 底部保存按钮
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