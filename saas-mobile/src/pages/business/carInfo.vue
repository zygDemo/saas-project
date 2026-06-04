<template>
  <app-page :nav-title="pageTitle">
    <view class="carinfo-page">
      <view class="section-title">
        <view class="title-dot" />
        <u-text text="请上传行驶证主页正面照片" size="28rpx" bold />
      </view>
      <u-gap height="12" />
      <view class="upload-item">
        <view class="upload-box" @click="pickImage()">
          <u-image
            v-if="mainImage"
            :src="mainImageSrc"
            width="100%"
            height="200rpx"
            mode="aspectFill"
          />
          <view v-else class="upload-placeholder">
            <u-icon name="plus" size="42" color="var(--u-type-primary)" />
          </view>
        </view>
        <u-gap height="8" />
        <view class="upload-caption">
          <u-text
            :text="mainImage ? '重拍行驶证主页正面' : '拍摄行驶证主页正面'"
            size="26rpx"
            color="primary"
          />
        </view>
      </view>

      <u-gap height="16" />

      <view class="section-title">
        <view class="title-dot" />
        <u-text text="请确认行驶证信息" size="28rpx" bold />
      </view>

      <AppForm v-model="carInfo" :items="formItems" />

      <view class="footer-btn" :class="{ 'edit-mode': isEditMode }">
        <u-button
          v-if="isEditMode"
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
import { computed, reactive, ref, onMounted } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import AppForm from "@/components/app-form/app-form.vue";
import { useSessionStore } from "@/stores";
import { useBusinessApi } from "@/api/business";
import { recognizeVehicle } from "@/common/ocr";
import { toFilePreviewUrl } from "@/common/file-url";
import { compressVehicleLicenseForOcr } from "@/common/image-compress";

const sessionStore = useSessionStore();
const businessApi = useBusinessApi();

const submitLoading = ref(false);
const isPawnMode = ref(false);
const pageTitle = computed(() => isPawnMode.value ? "典当车辆信息" : "车辆信息");
const mainImage = ref("");
const mainImageSrc = computed(() => toFilePreviewUrl(mainImage.value));
const vehicleImgUrlObjectKey = ref("");
const mainLoading = ref(false);
const editUuid = ref("");
const isEditMode = ref(false);

// 车辆信息字段与接口 VehicleInfo 对齐
const carInfo = reactive({
  // 行驶证相关
  plateNumber: "",
  vehicleBrand: "",
  vehicleModel: "",
  vehicleOwner: "",
  address: "",
  usageNature: "",
  sealInfo: "",
  engineNumber: "",
  registerDate: "",
  vehicleCode: "",
  mileage: "",
  // 扩展信息
  purchaseType: undefined,
  purchaseDate: "",
  purchasePrice: undefined,
  loanAmount: undefined,
  loanTerm: undefined,
  monthlyPayment: undefined,
  fuelType: undefined,
  vehicleColor: "",
  isFault: undefined,
  isMortgage: undefined,
  isInsurance: undefined,
  insuranceExpirationDate: "",
});

const fetchVehicleInfo = async () => {
  try {
    const res = await businessApi.getVehicleInfo(editUuid.value);
    if (res?.code === 200 && res.data) {
      const data = res.data;
      Object.assign(carInfo, {
        plateNumber: data.plateNumber || "",
        vehicleBrand: data.vehicleBrand || "",
        vehicleModel: data.vehicleModel || "",
        vehicleOwner: data.vehicleOwner || "",
        address: data.address || "",
        usageNature: data.usageNature || "",
        sealInfo: data.sealInfo || "",
        engineNumber: data.engineNumber || "",
        registerDate: data.registerDate
          ? data.registerDate.split(" ")[0].replace(/[./]/g, "-")
          : "",
        vehicleCode: data.vehicleCode || "",
        mileage: data.mileage || "",
        purchaseType: data.purchaseType,
        purchaseDate: data.purchaseDate || "",
        purchasePrice: data.purchasePrice
          ? data.purchasePrice / 100
          : undefined,
        loanAmount: data.loanAmount ? data.loanAmount / 100 : undefined,
        loanTerm: data.loanTerm,
        monthlyPayment: data.monthlyPayment
          ? data.monthlyPayment / 100
          : undefined,
        fuelType: data.fuelType,
        vehicleColor: data.vehicleColor || "",
        isFault: data.isFault,
        isMortgage: data.isMortgage,
        isInsurance: data.isInsurance,
        insuranceExpirationDate: data.insuranceExpirationDate || "",
      });
      mainImage.value = toFilePreviewUrl(data.vehicleImgUrl || "");
    }
  } catch (e) {
    console.error("获取车辆信息失败", e);
  }
};

onLoad((query) => {
  editUuid.value = query.uuid || "";
  isPawnMode.value = query.businessType === "pawn";
  isEditMode.value = !!query.uuid;
});

onMounted(() => {
  if (editUuid.value) {
    fetchVehicleInfo();
  }
});

const formItems = [
  { key: "plateNumber", label: "车牌号码", placeholder: "请输入车牌号码", required: true },
  // { key: "vehicleBrand", label: "车辆品牌", placeholder: "请输入车辆品牌" },
  { key: "vehicleModel", label: "车型", placeholder: "请输入车型", required: true },
  { key: "vehicleOwner", label: "所属人姓名", placeholder: "请输入所属人姓名", required: true },
  { key: "address", label: "住址", placeholder: "请输入住址", required: true },
  { key: "usageNature", label: "使用性质", placeholder: "请输入使用性质", required: true },
  { key: "sealInfo", label: "印章信息", placeholder: "请输入印章信息", required: true },
  { key: "engineNumber", label: "发动机号", placeholder: "请输入发动机号", required: true },
  {
    key: "registerDate",
    label: "注册日期",
    placeholder: "请选择注册日期",
    type: "date",
    required: true,
  },
  {
    key: "vehicleCode",
    label: "车辆识别代码",
    placeholder: "请输入车辆识别代码",
    required: true,
  },
  { key: "mileage", label: "行驶里程(公里)", placeholder: "请输入行驶里程", required: true },
  // {
  //   key: "purchaseType",
  //   label: "购买方式",
  //   placeholder: "请选择购买方式",
  //   type: "select",
  //   options: [
  //     { label: "全款", value: 1 },
  //     { label: "按揭", value: 2 },
  //   ],
  // },
  // {
  //   key: "purchaseDate",
  //   label: "购买日期",
  //   placeholder: "请选择购买日期",
  //   type: "date",
  // },
  // {
  //   key: "purchasePrice",
  //   label: "购买金额(元)",
  //   placeholder: "请输入购买金额",
  //   type: "number",
  // },
  // {
  //   key: "loanAmount",
  //   label: "贷款金额(元)",
  //   placeholder: "请输入贷款金额",
  //   type: "number",
  // },
  // {
  //   key: "loanTerm",
  //   label: "贷款期限(年)",
  //   placeholder: "请输入贷款期限",
  //   type: "number",
  // },
  // {
  //   key: "monthlyPayment",
  //   label: "月还款金额(元)",
  //   placeholder: "请输入月还款金额",
  //   type: "number",
  // },
  // {
  //   key: "fuelType",
  //   label: "燃油类型",
  //   placeholder: "请选择燃油类型",
  //   type: "select",
  //   options: [
  //     { label: "油车", value: 1 },
  //     { label: "纯电", value: 2 },
  //     { label: "油电混合", value: 3 },
  //   ],
  // },
  // { key: "vehicleColor", label: "车辆颜色", placeholder: "请输入车辆颜色" },
  // {
  //   key: "isFault",
  //   label: "是否发生故障",
  //   placeholder: "请选择",
  //   type: "select",
  //   options: [
  //     { label: "是", value: 1 },
  //     { label: "否", value: 2 },
  //   ],
  // },
  // {
  //   key: "isMortgage",
  //   label: "是否进行抵押",
  //   placeholder: "请选择",
  //   type: "select",
  //   options: [
  //     { label: "是", value: 1 },
  //     { label: "否", value: 2 },
  //   ],
  // },
  // {
  //   key: "isInsurance",
  //   label: "是否购买商业保险",
  //   placeholder: "请选择",
  //   type: "select",
  //   options: [
  //     { label: "是", value: 1 },
  //     { label: "否", value: 2 },
  //   ],
  // },
  // {
  //   key: "insuranceExpirationDate",
  //   label: "保险到期日",
  //   placeholder: "请选择保险到期日",
  //   type: "date",
  // },
];

function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === "";
}

function parseDateText(value) {
  const match = String(value || "").trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!match) return null;
  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (
    date.getFullYear() !== Number(year) ||
    date.getMonth() + 1 !== Number(month) ||
    date.getDate() !== Number(day)
  ) {
    return null;
  }
  return date;
}

function isValidPlateNumber(value) {
  const plate = String(value).trim().toUpperCase();
  return /^[\u4E00-\u9FA5][A-Z][A-Z0-9挂学警港澳]{5,6}$/.test(plate);
}

function isValidVehicleCode(value) {
  return /^[A-HJ-NPR-Z0-9]{17}$/i.test(String(value).trim());
}

function isValidEngineNumber(value) {
  return /^[A-Z0-9-]{5,30}$/i.test(String(value).trim());
}

function isPositiveNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0;
}

function validateCarInfo() {
  if (!mainImage.value) {
    $u.toast("请上传行驶证主页正面照片", "error");
    return false;
  }

  const requiredFields = [
    { key: "plateNumber", label: "车牌号码" },
    { key: "vehicleModel", label: "车型" },
    { key: "vehicleOwner", label: "所属人姓名" },
    { key: "address", label: "住址" },
    { key: "usageNature", label: "使用性质" },
    { key: "sealInfo", label: "印章信息" },
    { key: "engineNumber", label: "发动机号" },
    { key: "registerDate", label: "注册日期", action: "请选择" },
    { key: "vehicleCode", label: "车辆识别代码" },
    { key: "mileage", label: "行驶里程" },
  ];

  for (const field of requiredFields) {
    if (isBlank(carInfo[field.key])) {
      $u.toast(`${field.action || "请输入"}${field.label}`, "error");
      return false;
    }
  }

  carInfo.plateNumber = carInfo.plateNumber.trim().toUpperCase();
  carInfo.vehicleModel = carInfo.vehicleModel.trim();
  carInfo.vehicleOwner = carInfo.vehicleOwner.trim();
  carInfo.address = carInfo.address.trim();
  carInfo.usageNature = carInfo.usageNature.trim();
  carInfo.sealInfo = carInfo.sealInfo.trim();
  carInfo.engineNumber = carInfo.engineNumber.trim().toUpperCase();
  carInfo.vehicleCode = carInfo.vehicleCode.trim().toUpperCase();
  carInfo.mileage = String(carInfo.mileage).trim();

  if (!isValidPlateNumber(carInfo.plateNumber)) {
    $u.toast("请输入正确的车牌号码", "error");
    return false;
  }
  if (!/^[\p{Script=Han}A-Za-z·.\s]{2,30}$/u.test(carInfo.vehicleOwner)) {
    $u.toast("请输入正确的所属人姓名", "error");
    return false;
  }
  if (!isValidEngineNumber(carInfo.engineNumber)) {
    $u.toast("请输入正确的发动机号", "error");
    return false;
  }
  if (!isValidVehicleCode(carInfo.vehicleCode)) {
    $u.toast("请输入正确的车辆识别代码", "error");
    return false;
  }
  const registerDate = parseDateText(carInfo.registerDate);
  if (!registerDate) {
    $u.toast("请选择正确的注册日期", "error");
    return false;
  }
  if (registerDate.getTime() > Date.now()) {
    $u.toast("注册日期不能晚于今天", "error");
    return false;
  }
  if (!isPositiveNumber(carInfo.mileage)) {
    $u.toast("请输入正确的行驶里程", "error");
    return false;
  }

  return true;
}

function pickImage() {
  if (mainLoading.value) return;
  uni.chooseImage({
    count: 1,
    sizeType: ["compressed"],
    sourceType: ["camera", "album"],
    success: async (res) => {
      const path = res.tempFilePaths?.[0];
      if (!path) return;
      mainImage.value = path;
      mainLoading.value = true;

      try {
        const compressedPath = await compressVehicleLicenseForOcr(path);
        const [, uploadRes] = await Promise.all([
          doVehicleOcr(compressedPath),
          businessApi.uploadFile(compressedPath),
        ]);
        if (uploadRes?.code !== 200) {
          $u.toast(uploadRes?.msg || "图片上传失败", "error");
          return;
        }
        const uploadData = uploadRes?.data || uploadRes || {};
        const imageUrl = toFilePreviewUrl(uploadData.previewUrl || uploadRes?.previewUrl || uploadRes?.url);
        if (imageUrl) {
          console.log("[carInfo] image src before render:", {
            raw: uploadData.previewUrl || uploadRes?.previewUrl || uploadRes?.url,
            normalized: imageUrl,
          });
          mainImage.value = imageUrl;
          vehicleImgUrlObjectKey.value = uploadData.objectKey || uploadData.fileKey || uploadRes.objectKey;
        }
      } catch (e) {
        console.error("行驶证OCR/上传异常", e);
      } finally {
        mainLoading.value = false;
      }
    },
  });
}

/** 后端行驶证 OCR 识别并自动填表 */
async function doVehicleOcr(imagePath) {
  try {
    const data = await recognizeVehicle(imagePath, { compress: false });
    if (!data) return;

    if (data.plateNumber) carInfo.plateNumber = data.plateNumber;
    if (data.vehicleType) carInfo.vehicleBrand = data.vehicleType;
    if (data.model) carInfo.vehicleModel = data.model;
    if (data.owner) carInfo.vehicleOwner = data.owner;
    if (data.address) carInfo.address = data.address;
    if (data.useCharacter) carInfo.usageNature = data.useCharacter;
    if (data.sealInfo) carInfo.sealInfo = data.sealInfo;
    if (data.engineNumber) carInfo.engineNumber = data.engineNumber.toUpperCase();
    if (data.vin) carInfo.vehicleCode = data.vin.toUpperCase();
    if (data.registerDate) carInfo.registerDate = data.registerDate;

    $u.toast("已自动识别，请核对修改", "success");
  } catch {
    // OCR 失败不阻塞上传
  }
}

const doSubmit = async () => {
  const orderInfo = sessionStore.orderInfo || {};
  const uuid =
    editUuid.value ||
    (Object.hasOwn(orderInfo, "uuid") ? String(orderInfo.uuid) : "");
  if (!uuid) {
    $u.toast("客户订单信息缺失，请重新进件", "error");
    return false;
  }

  if (!validateCarInfo()) {
    return false;
  }

  const submitData = {
    ...carInfo,
    uuid,
    vehicleImgUrl: vehicleImgUrlObjectKey.value || undefined,
    purchasePrice: carInfo.purchasePrice
      ? carInfo.purchasePrice * 100
      : undefined,
    loanAmount: carInfo.loanAmount ? carInfo.loanAmount * 100 : undefined,
    monthlyPayment: carInfo.monthlyPayment
      ? carInfo.monthlyPayment * 100
      : undefined,
    registerDate: carInfo.registerDate
      ? $u.timeFormat(new Date(carInfo.registerDate), "yyyy-mm-dd hh:MM:ss")
      : undefined,
  };

  const cleanData = Object.fromEntries(
    Object.entries(submitData).filter(([, v]) => v !== undefined && v !== ""),
  );
  const res = await businessApi.addOrUpdateVehicle(cleanData);
  if (res?.code === 200) {
    sessionStore.setOrderInfo({ carInfo: { ...carInfo } });
    if (isPawnMode.value) {
      sessionStore.setOrderInfo({ businessType: "pawn" });
    }
    $u.toast("已保存车辆信息", "success");
    return true;
  }
  return false;
};

const handleSave = async () => {
  submitLoading.value = true;
  try {
    const success = await doSubmit();
    if (success) {
      setTimeout(() => {
        uni.navigateBack();
      }, 800);
    }
  } catch {
    // 错误已由拦截器处理
  } finally {
    submitLoading.value = false;
  }
};

async function handleNext() {
  submitLoading.value = true;
  try {
    const success = await doSubmit();
    if (success) {
      const orderInfo = sessionStore.orderInfo || {};
      const uuid = editUuid.value || orderInfo.uuid || "";
      const nextUrl = isPawnMode.value
        ? `/pages/business/pawnLoanInfo?uuid=${encodeURIComponent(String(uuid))}`
        : "/pages/business/applyInfo";
      setTimeout(() => {
        uni.$u.route({
          url: nextUrl,
          type: "navigateTo",
        });
      }, 800);
    }
  } catch {
    // 错误已由拦截器处理
  } finally {
    submitLoading.value = false;
  }
}
</script>

<style lang="scss" scoped>
.carinfo-page {
  padding: 28rpx 24rpx 140rpx;
  background: linear-gradient(180deg, #f7f8f9 0%, #ffffff 100%);
}

.upload-item {
  flex: 1;
}

.upload-box {
  height: 200rpx;
  border: 2rpx dashed rgba(var(--u-type-primary-rgb, 41, 121, 255), 0.35);
  border-radius: 18rpx;
  overflow: hidden;
  background: $u-bg-white;
}

.upload-placeholder {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-caption {
  text-align: center;
  color: $u-type-primary;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8rpx;
}

.footer-btn {
  margin-top: 32rpx;
  display: flex;
  justify-content: center;

  &.edit-mode {
    gap: 24rpx;
    padding: 0 24rpx;

    :deep(.u-btn) {
      flex: 1;
    }
  }
}
</style>
