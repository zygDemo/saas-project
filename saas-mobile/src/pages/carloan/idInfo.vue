<template>
  <app-page :nav-title="pageTitle" :show-nav-back="!isCustomerRole">
    <view class="idinfo-page">
      <view class="section-title">
        <view class="title-dot" />
        <u-text text="请上传身份证照片" size="28rpx" bold />
      </view>
      <u-gap height="16" />

      <view class="upload-grid">
        <view class="upload-item">
          <view class="upload-box" @click="pickImage('front')">
            <u-image
              v-if="frontImage"
              :src="frontImageSrc"
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
              :text="frontImage ? '重拍人像面' : '拍摄人像面'"
              size="26rpx"
              color="primary"
            />
          </view>
        </view>

        <view class="upload-item">
          <view class="upload-box" @click="pickImage('back')">
            <u-image
              v-if="backImage"
              :src="backImageSrc"
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
              :text="backImage ? '重拍国徽面' : '拍摄国徽面'"
              size="26rpx"
              color="primary"
            />
          </view>
        </view>
      </view>

      <u-gap height="20" />

      <view class="section-title">
        <view class="title-dot" />
        <u-text text="请确认身份证信息" size="28rpx" bold />
      </view>

      <AppForm :modelValue="idInfo" :items="formItems" />

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

import { useSessionStore, useLocalStore } from "@/stores";
import { storeToRefs } from "pinia";
import { useBusinessApi } from "@/api/business";
import NationConst, { nationLabelToValue } from "@/enums/nation";
import { recognizeIdCard } from "@/common/ocr";
import { toFilePreviewUrl } from "@/common/file-url";
import { compressImageForOcr } from "@/common/image-compress";

const businessApi = useBusinessApi();

const sessionStore = useSessionStore();
const localStore = useLocalStore();
const { userInfo } = storeToRefs(localStore);

const submitLoading = ref(false);
const isPawnMode = ref(false);
const pageTitle = computed(() => isPawnMode.value ? "典当身份证信息" : "身份证信息");
const isCustomerRole = computed(() => {
  const roleTags = String(sessionStore.transferInfo?.roleTags || "");
  return roleTags === "客户" || roleTags.includes("客户");
});
const currentSalesmanId = computed(() => {
  return userInfo.value?.userId || Number(sessionStore.transferInfo?.salesmanId || 0) || undefined;
});

const frontImage = ref("");
const backImage = ref("");
const frontImageSrc = computed(() => toFilePreviewUrl(frontImage.value));
const backImageSrc = computed(() => toFilePreviewUrl(backImage.value));
const frontImageObjectKey = ref("");
const backImageObjectKey = ref("");
const frontLoading = ref(false);
const backLoading = ref(false);
const idInfo = reactive({
  // 对应接口字段
  personName: "",
  telephone: "",
  personIdcard: "",
  gender: undefined,
  race: "",
  personAddress: "",
  personIssuingAuthority: "",
  personValidDateStart: "",
  personValidDateEnd: "",
});

const editUuid = ref("");
const isEditMode = ref(false);
const fromEntry = ref(false);
const entryCreditOrderId = ref("");
const entryName = ref("");
const entryPhone = ref("");

const fetchUserBasic = async () => {
  try {
    const res = await businessApi.getUserBasic(editUuid.value);
    if (res?.code === 200 && res.data) {
      const data = res.data;
      Object.assign(idInfo, {
        personName: data.personName || "",
        telephone: data.telephone || "",
        personIdcard: data.personIdcard || "",
        gender: data.gender,
        race: nationLabelToValue(data.nation) || data.race || "",
        personAddress: data.personAddress || "",
        personIssuingAuthority: data.personIssuingAuthority || "",
        personValidDateStart: data.personValidDateStart || "",
        personValidDateEnd: data.personValidDateEnd || "",
      });
      frontImage.value = toFilePreviewUrl(data.idcardFront || "");
      backImage.value = toFilePreviewUrl(data.idcardBack || "");
    }
  } catch (e) {
    console.error("获取身份信息失败", e);
  }
};

onLoad((query) => {
  editUuid.value = query.uuid || "";
  isPawnMode.value = query.businessType === "pawn";
  isEditMode.value = !!query.uuid;
  fromEntry.value = query.fromEntry === "1";
  entryCreditOrderId.value = query.creditOrderId || "";
  entryName.value = query.name || "";
  entryPhone.value = query.phone || "";
});

onMounted(() => {
  if (editUuid.value) {
    fetchUserBasic();
  }
});

const formItems = [
  { key: "personName", label: "姓名", placeholder: "请输入姓名", required: true },
  { key: "telephone", label: "手机号", placeholder: "请输入手机号", required: true },
  { key: "personIdcard", label: "身份证号", placeholder: "请输入身份证号", required: true },
  {
    key: "gender",
    label: "性别",
    placeholder: "请选择性别",
    type: "select",
    required: true,
    options: [
      { label: "男", value: 1 },
      { label: "女", value: 2 },
    ],
  },
  {
    key: "race",
    label: "民族",
    placeholder: "请选择民族",
    type: "select",
    required: true,
    options: NationConst,
  },
  { key: "personAddress", label: "户籍地址", placeholder: "请输入户籍地址", required: true },
  {
    key: "personIssuingAuthority",
    label: "签发机关",
    placeholder: "请输入签发机关",
    required: true,
  },
  {
    key: "personValidDateStart",
    label: "有效期起",
    placeholder: "请选择有效期起始日期",
    type: "date",
    required: true,
  },
  {
    key: "personValidDateEnd",
    label: "有效期止",
    placeholder: "请选择有效期截止日期",
    type: "date",
    required: true,
  },
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

function isValidName(value) {
  return /^[\p{Script=Han}A-Za-z·.\s]{2,30}$/u.test(String(value).trim());
}

function isValidPhone(value) {
  return /^1[3-9]\d{9}$/.test(String(value).trim());
}

function isValidIdCard(value) {
  const card = String(value).trim().toUpperCase();
  if (!/^[1-9]\d{5}(?:18|19|20)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3}[\dX]$/.test(card)) {
    return false;
  }

  const birthday = parseDateText(`${card.slice(6, 10)}-${card.slice(10, 12)}-${card.slice(12, 14)}`);
  if (!birthday) return false;

  const factors = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  const checks = ["1", "0", "X", "9", "8", "7", "6", "5", "4", "3", "2"];
  const sum = factors.reduce((total, factor, index) => total + Number(card[index]) * factor, 0);
  return checks[sum % 11] === card[17];
}

function validateIdInfo() {
  if (!frontImage.value) {
    $u.toast("请上传身份证人像面照片", "error");
    return false;
  }
  if (!backImage.value) {
    $u.toast("请上传身份证国徽面照片", "error");
    return false;
  }

  const requiredFields = [
    { key: "personName", label: "姓名" },
    { key: "telephone", label: "手机号" },
    { key: "personIdcard", label: "身份证号" },
    { key: "gender", label: "性别", action: "请选择" },
    { key: "race", label: "民族", action: "请选择" },
    { key: "personAddress", label: "户籍地址" },
    { key: "personIssuingAuthority", label: "签发机关" },
    { key: "personValidDateStart", label: "有效期起", action: "请选择" },
    { key: "personValidDateEnd", label: "有效期止", action: "请选择" },
  ];

  for (const field of requiredFields) {
    if (isBlank(idInfo[field.key])) {
      $u.toast(`${field.action || "请输入"}${field.label}`, "error");
      return false;
    }
  }

  idInfo.personName = idInfo.personName.trim();
  idInfo.telephone = idInfo.telephone.trim();
  idInfo.personIdcard = idInfo.personIdcard.trim().toUpperCase();
  idInfo.personAddress = idInfo.personAddress.trim();
  idInfo.personIssuingAuthority = idInfo.personIssuingAuthority.trim();

  if (!isValidName(idInfo.personName)) {
    $u.toast("请输入正确的姓名", "error");
    return false;
  }
  if (!isValidPhone(idInfo.telephone)) {
    $u.toast("请输入正确的手机号", "error");
    return false;
  }
  if (!isValidIdCard(idInfo.personIdcard)) {
    $u.toast("请输入正确的身份证号", "error");
    return false;
  }

  const startDate = parseDateText(idInfo.personValidDateStart);
  if (!startDate) {
    $u.toast("请选择正确的有效期起始日期", "error");
    return false;
  }
  if (idInfo.personValidDateEnd !== "长期") {
    const endDate = parseDateText(idInfo.personValidDateEnd);
    if (!endDate) {
      $u.toast("请选择正确的有效期截止日期", "error");
      return false;
    }
    if (startDate.getTime() > endDate.getTime()) {
      $u.toast("有效期截止日期不能早于起始日期", "error");
      return false;
    }
  }

  return true;
}

function pickImage(side) {
  const setLoading = side === "front" ? frontLoading : backLoading;
  if (setLoading.value) {
    return;
  }

  uni.chooseImage({
    count: 1,
    sizeType: ["compressed"],
    sourceType: ["camera", "album"],
    success: async (res) => {
      const path = res.tempFilePaths?.[0];
      if (!path) {
        return;
      }
      if (side === "front") {
        frontImage.value = path;
      } else {
        backImage.value = path;
      }
      setLoading.value = true;

      if (path) {
        try {
          const compressedPath = await compressImageForOcr(path);
          const [, uploadRes] = await Promise.all([
            doIdCardOcr(compressedPath, side),
            businessApi.uploadFile(compressedPath),
          ]);
          if (uploadRes?.code !== 200) {
            $u.toast(uploadRes?.msg || "图片上传失败", "error");
            return;
          }
          // 兼容返回结构：data 可能是对象 { url } 或直接是字符串
          const uploadData = uploadRes?.data || uploadRes || {};
          const imageUrl = toFilePreviewUrl(uploadData.previewUrl || uploadRes?.previewUrl || uploadRes?.url);
          const objectKey = uploadData.objectKey || uploadData.fileKey || uploadRes?.objectKey;
          console.log("[idInfo] image src before render:", {
            side,
            raw: uploadData.previewUrl || uploadRes?.previewUrl || uploadRes?.url,
            normalized: imageUrl,
          });

          if (side === "front") {
            frontImage.value = imageUrl;
            frontImageObjectKey.value = objectKey;
          } else {
            backImage.value = imageUrl;
            backImageObjectKey.value = objectKey;
          }
        } catch (e) {
          console.error("OCR/上传异常", e);
        } finally {
          setLoading.value = false;
        }
      }
    },
    fail: () => {},
  });
}

/** 后端 OCR 识别并自动填表 */
async function doIdCardOcr(imagePath, side) {
  try {
    const result = await recognizeIdCard(imagePath, side === "front" ? "front" : "back", { compress: false });
    if (!result) return;

    if (side === "front") {
      const data = result;
      if (data.name) idInfo.personName = data.name;
      if (data.idNum) idInfo.personIdcard = data.idNum;
      if (data.gender === "男") idInfo.gender = 1;
      else if (data.gender === "女") idInfo.gender = 2;
      if (data.race || data.nation) idInfo.race = data.race || nationLabelToValue(data.nation) || data.nation;
      if (data.address) idInfo.personAddress = data.address;
      if (data.birth) {
        // birth 格式: yyyy-MM-dd，暂存到 session 供有效期计算参考
        sessionStore.setOrderInfo({ birth: data.birth });
      }
    } else {
      const data = result;
      if (data.authority) idInfo.personIssuingAuthority = data.authority;
      if (data.validDateStart || data.validDateEnd) {
        if (data.validDateStart) idInfo.personValidDateStart = data.validDateStart;
        if (data.validDateEnd) idInfo.personValidDateEnd = data.validDateEnd;
        $u.toast("已自动识别，请核对修改", "success");
        return;
      }
      if (data.validDate) {
        if (data.validDate.includes("长期")) {
          const startMatch = data.validDate.match(/(\d{4}[.\-\\/]\d{2}[.\-\\/]\d{2})/);
          idInfo.personValidDateStart = startMatch
            ? startMatch[1].replace(/\./g, "-")
            : "";
          idInfo.personValidDateEnd = "长期";
        } else {
          const parts = data.validDate
            .replace(/\//g, "-")
            .split(/[-–—至~]+/)
            .map((s) => s.trim())
            .filter(Boolean);
          if (parts.length >= 2) {
            idInfo.personValidDateStart = parts[0].replace(/\./g, "-");
            idInfo.personValidDateEnd = parts[1].replace(/\./g, "-");
          }
        }
      }
    }
    $u.toast("已自动识别，请核对修改", "success");
  } catch {
    // OCR 失败不阻塞上传
  }
}

const doSubmit = async () => {
  if (!validateIdInfo()) {
    return false;
  }

  // 从身份证号计算年龄
  const calcAge = (idCard) => {
    if (!idCard || idCard.length !== 18) return undefined;
    const birthYear = Number.parseInt(idCard.substring(6, 10), 10);
    const currentYear = new Date().getFullYear();
    return currentYear - birthYear;
  };

  const submitData = {
    ...idInfo,
    uuid: editUuid.value || undefined,
    age: calcAge(idInfo.personIdcard),
    idcardFront: frontImageObjectKey.value || undefined,
    idcardBack: backImageObjectKey.value || undefined,
    salesmanId: currentSalesmanId.value, // 业务员ID
    createOrder: !isEditMode.value,
    businessType: isPawnMode.value ? "pawn" : "CAR_LOAN",
  };

  const cleanData = Object.fromEntries(
    Object.entries(submitData).filter(([, v]) => v !== undefined && v !== "")
  );

  const res = await businessApi.addOrUpdateUserBasic(cleanData);

  if (res?.code === 200) {
  console.log(res);
    sessionStore.setOrderInfo({ idInfo: { ...idInfo } });
    sessionStore.setOrderInfo({ uuid: res?.data?.uuid });
    if (res?.data?.creditOrderId) {
      sessionStore.setOrderInfo({
        creditOrderId: res.data.creditOrderId,
        applicationId: res.data.applicationId,
      });
    }
    if (isPawnMode.value) {
      sessionStore.setOrderInfo({ businessType: "pawn" });
    }
    $u.toast("已保存身份证信息", "success");
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

const handleNext = async () => {
  submitLoading.value = true;
  try {
    const success = await doSubmit();
    if (success) {
      const orderInfo = sessionStore.orderInfo || {};
      const uuid = editUuid.value || orderInfo.uuid || "";
      const query = [
        uuid ? `uuid=${encodeURIComponent(String(uuid))}` : "",
        fromEntry.value ? "fromEntry=1" : "",
        entryCreditOrderId.value ? `creditOrderId=${encodeURIComponent(entryCreditOrderId.value)}` : "",
        entryName.value ? `name=${encodeURIComponent(entryName.value)}` : "",
        entryPhone.value ? `phone=${encodeURIComponent(entryPhone.value)}` : "",
        isPawnMode.value ? "businessType=pawn" : "",
      ].filter(Boolean);
      const nextUrl = isPawnMode.value
        ? `/pages/carloan/carInfo?${query.join("&")}`
        : `/pages/carloan/carInfo${query.length ? `?${query.join("&")}` : ""}`;
      setTimeout(() => {
        uni.redirectTo({
          url: nextUrl,
        });
      }, 800);
    }
  } catch {
    // 错误已由拦截器处理
  } finally {
    submitLoading.value = false;
  }
};
</script>

<style lang="scss" scoped>
.idinfo-page {
  padding: 28rpx 24rpx 140rpx;
  background: linear-gradient(180deg, #f7f8f9 0%, #ffffff 100%);
}

.upload-grid {
  display: flex;
  gap: 24rpx;
  flex-wrap: wrap;
}

.upload-item {
  flex: 1;
  min-width: 300rpx;
}

.upload-box {
  height: 200rpx;
  border: 2rpx dashed rgba(var(--u-type-primary-rgb, 41, 121, 255), 0.35);
  border-radius: 18rpx;
  overflow: hidden;
  background: $u-bg-white;
  transition: all 0.2s ease;
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

.fix-link {
  padding: 8rpx 0;
}

.info-card {
  border-radius: 22rpx;
  background: $u-bg-white;
  margin: 32rpx 0;
  padding: 6rpx 8rpx;
  box-shadow: 0 12rpx 30rpx rgba(0, 0, 0, 0.06);
}

.info-list {
  padding: 8rpx 12rpx;
}

.info-row {
  display: flex;
  border-bottom: 1rpx solid rgba(0, 0, 0, 0.04);
  align-items: center;
  padding: 14rpx 6rpx;

  &:last-child {
    border-bottom: 0;
  }
}

.info-label {
  width: 180rpx;
  color: $u-tips-color;
  font-size: 28rpx;
}

.info-value {
  flex: 1;
  color: $u-main-color;
  font-size: 28rpx;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.multiline {
  display: inline-block;
  text-align: left;
  width: 100%;
  word-break: break-all;
}
</style>
