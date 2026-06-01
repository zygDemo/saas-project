<template>
  <app-page nav-title="文件信息">
    <view class="file-supplement-page">
      <view v-if="!fileGroups.length" class="empty-wrap">
        <u-empty mode="list" text="暂无文件配置" />
      </view>
      <template v-else>
        <view
          v-for="group in fileGroups"
          :key="group.key"
          class="file-section"
        >
          <view class="section-title">
            <text class="section-title-text">{{ group.label }}</text>
          </view>
          <view class="file-grid">
            <FileCard
              v-for="item in group.children"
              :key="item.key"
              :label="item.label"
              :files="getCardFiles(item.key)"
              :max-count="maxFiles[item.key]"
              :readonly="readonly"
              :required="item.required"
              @click="openUpload(item)"
            />
          </view>
        </view>
      </template>

      <view v-if="!readonly" class="footer-btn">
        <u-button type="primary" shape="circle" @click="handleSubmit">
          提交
        </u-button>
      </view>
    </view>

    <u-popup
      v-model="showUploadPopup"
      mode="bottom"
      :round="24"
      @close="closeUploadPopup"
    >
      <view class="upload-popup">
        <view class="popup-title">{{ currentFileLabel }}</view>
        <view v-if="currentAcceptType" class="popup-tip">
          支持格式：{{ currentAcceptType }}
        </view>

        <u-upload
          ref="uploadRef"
          v-model="currentUploadList"
          :action="uploadAction"
          :header="uploadHeader"
          :form-data="uploadFormData"
          :accept="currentAccept"
          :mode="currentUploadMode"
          :max-count="currentMaxCount"
          :max-size="uploadMaxSize"
          :limit-type="currentLimitTypes"
          :extension="currentExtensions"
          :show-tips="false"
          :show-confirm="false"
          :show-file-name="true"
          :show-file-size="true"
          :preview-file="true"
          :deletable="!readonly"
          :custom-choose="useCustomChoose"
          :before-remove="beforeRemoveFile"
          @on-choose="handleCustomChoose"
          @on-success="handleUploadSuccess"
          @on-error="handleUploadError"
        />
      </view>
    </u-popup>
  </app-page>
</template>

<script setup>
import { computed, reactive, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { $u } from "uview-pro";
import { API_BASE_URL, TENANT_ID, UPLOAD_MAX_SIZE } from "@/common/env";
import { tokenUtil } from "@/common/token";
import { useBusinessApi } from "@/api/business";
import { useLocalStore } from "@/stores/local";
import { useSessionStore } from "@/stores/session";
import FileCard from "./components/FileCard.vue";

const businessApi = useBusinessApi();
const localStore = useLocalStore();
const sessionStore = useSessionStore();

const pageUuid = ref("");
const creditOrderId = ref("");
const readonly = ref(false);
const showUploadPopup = ref(false);
const currentFileType = ref("");
const currentFileCode = ref("");
const currentFileLabel = ref("");
const currentAcceptType = ref("");
const currentMaxCount = ref(0);
const currentUploadList = ref([]);
const loading = ref(false);
const uploadRef = ref(null);
const files = reactive({});
const maxFiles = reactive({});
const fileIdMap = reactive({});
const fileGroups = ref([]);
const fileList = ref([]);
const IMAGE_TYPES = ["jpg", "jpeg", "png", "gif", "webp", "bmp"];
const VIDEO_TYPES = ["mp4", "mov", "avi", "mkv", "wmv", "m4v"];

const uploadAction = `${API_BASE_URL}/m/file/upload`;
const uploadMaxSize = UPLOAD_MAX_SIZE * 1024 * 1024;

const uploadHeader = computed(() => {
  const roleTags = String(sessionStore.transferInfo?.roleTags || "").trim();
  const token = roleTags === "客户" || roleTags.includes("客户")
    ? sessionStore.transferToken || ""
    : localStore.token || "";

  return {
    Authorization: tokenUtil.buildAuthorization(token),
    "X-Tenant-ID": TENANT_ID,
  };
});

const uploadFormData = computed(() => ({
  uuid: pageUuid.value,
  creditOrderId: creditOrderId.value,
  fileCode: currentFileCode.value,
}));

const currentLimitTypes = computed(() => parseAcceptTypes(currentAcceptType.value));
const currentExtensions = computed(() =>
  currentLimitTypes.value.map((item) => `.${item}`),
);

const currentAccept = computed(() => {
  const types = currentLimitTypes.value;
  if (types.length === 0) return "image";
  if (types.every((item) => IMAGE_TYPES.includes(item))) return "image";
  if (types.every((item) => VIDEO_TYPES.includes(item))) return "video";
  return "file";
});

const currentUploadMode = computed(() =>
  currentAccept.value === "image" ? "grid" : "list",
);

const useCustomChoose = computed(
  () => readonly.value || currentAccept.value === "file",
);

const defaultFileGroups = [
  {
    id: 1,
    fileName: "个人资料相关",
    children: [
      { fileCode: "PFL001", fileName: "身份证人像面", fileSort: 1 },
      { fileCode: "PFL002", fileName: "身份证国徽面", fileSort: 2 },
      // { fileCode: "PFL003", fileName: "本地常住证明", fileSort: 3 },
      // { fileCode: "PFL012", fileName: "户籍证明", fileSort: 12 },
      // { fileCode: "PFL013", fileName: "婚姻证明", fileSort: 13 },
      // { fileCode: "PFL014", fileName: "婚育证明", fileSort: 14 },
      // { fileCode: "PFL015", fileName: "居住证明", fileSort: 15 },
    ],
  },
  // {
  //   id: 2,
  //   fileName: "工作和收入证明",
  //   children: [
  //     { fileCode: "PFL004", fileName: "流水", fileSort: 4 },
  //     { fileCode: "PFL011", fileName: "银行卡", fileSort: 11 },
  //     { fileCode: "PFL016", fileName: "收入证明", fileSort: 16 },
  //     { fileCode: "PFL017", fileName: "公积金证明", fileSort: 17 },
  //     { fileCode: "PFL018", fileName: "社保证明", fileSort: 18 },
  //     { fileCode: "PFL019", fileName: "房产证明", fileSort: 19 },
  //     { fileCode: "PFL020", fileName: "资产证明", fileSort: 20 },
  //     { fileCode: "PFL021", fileName: "营业执照", fileSort: 21 },
  //   ],
  // },
  // {
  //   id: 3,
  //   fileName: "车辆证明资料",
  //   children: [
  //     { fileCode: "PFL005", fileName: "驾照", fileSort: 5 },
  //     { fileCode: "PFL006", fileName: "行驶证", fileSort: 6 },
  //     { fileCode: "PFL007", fileName: "车辆登记证", fileSort: 7 },
  //     { fileCode: "PFL008", fileName: "车辆照片", fileSort: 8 },
  //     { fileCode: "PFL009", fileName: "交强险保单", fileSort: 9 },
  //     { fileCode: "PFL010", fileName: "人车合照", fileSort: 10 },
  //     { fileCode: "PFL022", fileName: "评估结果截图", fileSort: 22 },
  //     { fileCode: "PFL023", fileName: "商业险保单", fileSort: 23 },
  //   ],
  // },
  // {
  //   id: 4,
  //   fileName: "其他资料",
  //   children: [{ fileCode: "PFL024", fileName: "其他资料", fileSort: 24 }],
  // },
];

function getListFromResponse(res) {
  const data = res?.data ?? res?.rows ?? res;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.records)) return data.records;
  if (Array.isArray(data?.list)) return data.list;
  if (Array.isArray(data?.rows)) return data.rows;
  return [];
}

function getFirstValue(item, keys) {
  for (const key of keys) {
    if (
      item?.[key] !== undefined &&
      item?.[key] !== null &&
      item?.[key] !== ""
    ) {
      return item[key];
    }
  }
  return "";
}

function parseAcceptTypes(acceptType) {
  return String(acceptType || "")
    .split("|")
    .map((item) => item.trim().toLowerCase().replace(/^\./, ""))
    .filter(Boolean);
}

function getSortValue(item, fallback = 0) {
  const sort = Number(getFirstValue(item, ["fileSort", "sort", "orderNum", "id"]));
  return Number.isFinite(sort) ? sort : fallback;
}

function isIdCardFile(code) {
  return code === "10" || code === "11" || code === "PFL001" || code === "PFL002";
}

/** 判断文件是否为必传（后端返回 requireFlag 字段：1-必填，2-非必填） */
function isRequiredFile(item) {
  // 优先取后端返回的 requireFlag 字段
  const requireFlag = item?.requireFlag;
  if (requireFlag !== undefined && requireFlag !== null) {
    return String(requireFlag) === "1";
  }
  // 兼容旧字段 required
  const required = item?.required;
  if (required !== undefined && required !== null) {
    return String(required) === "1" || String(required) === "true";
  }
  // 默认：身份证文件必传，其他非必传
  return isIdCardFile(item?.fileCode) || isIdCardFile(item?.fileType);
}

function isImageUrl(url) {
  if (!url) return false;
  const ext = getFileExtension(url);
  return IMAGE_TYPES.includes(ext);
}

function getFileExtension(fileName) {
  const cleanName = String(fileName || "").split("?")[0].split("#")[0];
  const ext = cleanName.includes(".") ? cleanName.split(".").pop() : "";
  return ext ? ext.toLowerCase() : "";
}

function getPreviewValue(file) {
  return file?.thumb || file?.url || file?.path || "";
}

function normalizeProductFile(item, index) {
  const fileCode = String(
    getFirstValue(item, ["fileCode", "code", "dictValue", "value", "id"]),
  );
  const fileType = String(
    getFirstValue(item, ["fileType", "type", "fileTypeCode"]) || fileCode || index,
  );
  const defaultLabel = `文件${index + 1}`;
  const label = String(
    getFirstValue(item, ["fileName", "fileTypeName", "name", "label", "title"]) ||
    defaultLabel,
  );
  const rawMaxCount = getFirstValue(item, ["maxCount", "fileCount", "limit", "num"]);
  const maxCount = rawMaxCount !== "" ? Number(rawMaxCount) : Number.NaN;

  return {
    ...item,
    key: fileCode || fileType,
    fileCode: fileCode || fileType,
    label,
    acceptType: getFirstValue(item, [
      "fileAcceptType",
      "acceptType",
      "fileFormat",
      "format",
    ]),
    sort: getSortValue(item, index),
    maxCount: Number.isFinite(maxCount) && maxCount > 0
      ? maxCount
      : isIdCardFile(fileCode) || isIdCardFile(fileType) ? 1 : 1,
    required: isRequiredFile({ ...item, fileCode, fileType }),
  };
}

function normalizeProductGroup(group, index) {
  const children = Array.isArray(group?.children) ? group.children : [];
  const normalizedChildren = children
    .map(normalizeProductFile)
    .sort((a, b) => a.sort - b.sort);

  return {
    ...group,
    key: String(
      getFirstValue(group, ["id", "fileCode", "code", "fileName"]) || index,
    ),
    label: String(
      getFirstValue(group, ["fileName", "name", "label", "title"]) || `资料${index + 1}`,
    ),
    sort: getSortValue(group, index),
    children: normalizedChildren,
  };
}

function normalizeProductGroups(list) {
  const groups = list
    .filter((item) => Array.isArray(item?.children) && item.children.length > 0)
    .map(normalizeProductGroup)
    .filter((group) => group.children.length > 0)
    .sort((a, b) => a.sort - b.sort);

  if (groups.length) return groups;

  const flatList = list.map(normalizeProductFile).sort((a, b) => a.sort - b.sort);
  if (!flatList.length) return [];

  return [{ key: "default", label: "上传文件清单", children: flatList }];
}

function setProductGroups(groups) {
  fileGroups.value = groups;
  fileList.value = groups.flatMap((group) => group.children);
}

function getFileKeyFromRecord(file) {
  return String(
    getFirstValue(file, ["fileCode", "fileType", "fileName", "type"]) || "",
  );
}

function mapServerFileToUploadItem(file) {
  const url = file.fileUrl || file.url || "";
  const name = file.fileName || url.split("/").pop() || "文件";
  const fileType = isImageUrl(url) ? "image" : "file";

  return {
    url,
    name,
    size: file.fileSize || 0,
    progress: 100,
    error: false,
    fileType,
    response: file,
    __saved: true,
  };
}

function getCardFiles(key) {
  return (files[key] || []).map((item) => getPreviewValue(item)).filter(Boolean);
}

async function loadProductFileList() {
  try {
    const res = await businessApi.getProductFileList({
      uuid: pageUuid.value,
      creditOrderId: creditOrderId.value,
    });
    const groups = normalizeProductGroups(getListFromResponse(res));
    setProductGroups(
      groups.length ? groups : normalizeProductGroups(defaultFileGroups),
    );
  } catch (e) {
    console.error("加载产品文件配置失败:", e);
    setProductGroups(normalizeProductGroups(defaultFileGroups));
  }
}

function initFiles() {
  fileList.value.forEach((item) => {
    if (!files[item.key]) files[item.key] = [];
    maxFiles[item.key] =
      item.maxCount ||
      (isIdCardFile(item.key) ? 1 : maxFiles[item.key] || 1);
  });
}

onLoad(async (options) => {
  pageUuid.value = options?.uuid || "";
  creditOrderId.value = options?.creditOrderId || "";
  readonly.value = options?.readonly === "1" || options?.readonly === "true";
  if (creditOrderId.value) {
    await loadCreditReadonlyStatus();
  }
  await loadProductFileList();
  initFiles();
  if (pageUuid.value && creditOrderId.value) {
    await loadFileList();
  }
});

async function loadCreditReadonlyStatus() {
  try {
    const res = await businessApi.getCreditDetailByOrderId(creditOrderId.value);
    const businessNode = res?.data?.businessNode || "";
    if (businessNode && businessNode !== "SUPPLEMENT_MATERIALS") {
      readonly.value = true;
    }
  } catch (e) {
    console.error("加载授信节点失败:", e);
  }
}

async function loadFileList() {
  if (!pageUuid.value || !creditOrderId.value) return;
  loading.value = true;

  fileList.value.forEach((item) => {
    files[item.key] = [];
  });
  Object.keys(fileIdMap).forEach((key) => delete fileIdMap[key]);

  try {
    const res = await businessApi.getCreditFileList({
      uuid: pageUuid.value,
      creditOrderId: creditOrderId.value,
    });
    if (res?.code === 200 && Array.isArray(res.data)) {
      res.data.forEach((file) => {
        const key = getFileKeyFromRecord(file);
        const url = file.fileUrl || "";
        if (key && files[key]) {
          files[key].push(mapServerFileToUploadItem(file));
          if (file.id && url) {
            fileIdMap[url] = file.id;
          }
        }
      });
    }
  } catch (e) {
    console.error("加载文件列表失败:", e);
  } finally {
    loading.value = false;
  }
}

function openUpload(item) {
  currentFileType.value = item.key;
  currentFileCode.value = item.fileCode || item.key;
  currentFileLabel.value = item.label;
  currentAcceptType.value = item.acceptType || "";
  currentMaxCount.value = maxFiles[item.key] || 1;
  currentUploadList.value = (files[item.key] || []).map((file) => ({ ...file }));
  if (readonly.value && currentUploadList.value.length === 0) {
    $u.toast("暂无文件");
    return;
  }
  showUploadPopup.value = true;
}

function closeUploadPopup() {
  showUploadPopup.value = false;
  currentUploadList.value = [];
}

function handleCustomChoose() {
  if (readonly.value) return;

  if (currentAccept.value === "image" || currentAccept.value === "video") {
    uploadRef.value?.selectFile?.();
    return;
  }

  // #ifdef H5 || MP-WEIXIN
  uni.chooseFile({
    count: Math.max(currentMaxCount.value - currentUploadList.value.length, 1),
    extension: currentExtensions.value,
    success: (res) => {
      const tempFiles = Array.isArray(res.tempFiles) ? res.tempFiles : [];
      const filesToAdd = tempFiles.map((file) => ({
        path: file.path,
        name: file.name,
        size: file.size,
        fileType: "file",
      })).filter((file) => file.path);

      if (filesToAdd.length) {
        uploadRef.value?.addFiles?.(filesToAdd);
      }
    },
    fail: () => {
      $u.toast("取消选择文件", "error");
    },
  });
  // #endif

  // #ifndef H5 || MP-WEIXIN
  uni.chooseImage({
    count: Math.max(currentMaxCount.value - currentUploadList.value.length, 1),
    sizeType: ["compressed"],
    sourceType: ["camera", "album"],
    success: (res) => {
      const filesToAdd = (res.tempFilePaths || []).map((path) => ({
        path,
        name: path.split("/").pop() || "文件",
        fileType: "image",
      }));
      if (filesToAdd.length) {
        uploadRef.value?.addFiles?.(filesToAdd);
      }
    },
    fail: () => {
      $u.toast("文件选择失败", "error");
    },
  });
  // #endif
}

async function handleUploadSuccess(data, index, lists) {
  if (readonly.value) return;

  const uploadItem = lists[index];
  const responseData = data?.data || data || {};
  const objectKey = responseData.objectKey || responseData.fileKey || "";
  const fileUrl = responseData.fileUrl || responseData.url || uploadItem?.url || "";
  const fileName = responseData.fileName || responseData.name || uploadItem?.name || "";
  const fileSize = responseData.fileSize || responseData.size || uploadItem?.size || 0;

  if (!objectKey && !fileUrl) {
    $u.toast("上传结果异常，请重试", "error");
    return;
  }

  try {
    const uploadFileType = getFileExtension(fileName);
    const saveRes = await businessApi.saveFiles({
      uuid: pageUuid.value,
      fileType: uploadFileType || currentFileType.value,
      creditOrderId: creditOrderId.value,
      files: [{
        objectKey,
        fileName: fileName || undefined,
        fileSize: fileSize || undefined,
        fileCode: currentFileCode.value,
        fileUrl: fileUrl || undefined,
      }],
    });

    const savedFile = Array.isArray(saveRes?.data)
      ? saveRes.data[0]
      : Array.isArray(saveRes?.data?.files) ? saveRes.data.files[0] : saveRes?.data;

    if (fileUrl) {
      fileIdMap[fileUrl] = savedFile?.id || savedFile?.fileId || Date.now();
    }

    if (uploadItem) {
      uploadItem.url = fileUrl || uploadItem.url;
      uploadItem.name = fileName || uploadItem.name;
      uploadItem.size = fileSize || uploadItem.size;
      uploadItem.fileType = isImageUrl(fileUrl || fileName) ? "image" : "file";
      uploadItem.response = savedFile || responseData;
      uploadItem.__saved = true;
    }

    syncCurrentFilesToStore();
  } catch (e) {
    console.error("保存文件记录失败:", e);
    $u.toast("文件记录保存失败", "error");
  }
}

function handleUploadError() {
  if (readonly.value) return;

  $u.toast("上传失败，请重试", "error");
}

function syncCurrentFilesToStore() {
  if (readonly.value) return;

  files[currentFileType.value] = currentUploadList.value
    .filter((item) => item && item.progress === 100)
    .map((item) => ({ ...item }));
}

async function beforeRemoveFile(index, lists) {
  if (readonly.value) return false;

  const item = lists[index];
  const url = item?.url || item?.response?.fileUrl || "";
  const id = fileIdMap[url] || item?.response?.id || item?.response?.fileId;

  if (!id) {
    return true;
  }

  try {
    await businessApi.deleteFile(id);
    if (url) {
      delete fileIdMap[url];
    }
    setTimeout(() => {
      syncCurrentFilesToStore();
    }, 0);
    return true;
  } catch (e) {
    console.error("删除文件失败:", e);
    $u.toast("删除失败", "error");
    return false;
  }
}

async function handleSubmit() {
  if (readonly.value) return;

  // ========== 提交前置校验 ==========
  // 1. 文件信息提交前需确保授信申请编号存在
  if (!creditOrderId.value) {
    $u.toast("缺少授信申请编号", "error");
    return;
  }

  // 2. 校验必传文件类型是否已上传至少一个文件
  for (const item of fileList.value) {
    if (!item.required) continue; // 非必传文件跳过校验
    const uploadedFiles = files[item.key] || [];
    if (uploadedFiles.length === 0) {
      $u.toast(`请上传${item.label}`);
      return;
    }
  }
  // ========== 校验通过，执行提交 ==========

  try {
    loading.value = true;
    await businessApi.completeFileSupplement(creditOrderId.value);
    $u.toast("提交成功", "success");
    setTimeout(() => {
      uni.redirectTo({
        url: `/pages/business/supplementDetail?creditOrderId=${creditOrderId.value}`,
      });
    }, 1500);
  } catch (e) {
    console.error("提交失败:", e);
    $u.toast(e?.data?.msg || "提交失败", "error");
  } finally {
    loading.value = false;
  }
}
</script>

<style lang="scss" scoped>
.file-supplement-page {
  padding: 28rpx 24rpx 140rpx;
  background: linear-gradient(180deg, #f7f8f9 0%, #ffffff 100%);
}

.file-section {
  margin-bottom: 28rpx;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 20rpx;
}

.section-title-text {
  font-size: 32rpx;
  font-weight: 700;
  color: #1f2d3d;
}

.file-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20rpx;
}

.empty-wrap {
  padding: 80rpx 0;
}

.upload-popup {
  padding: 32rpx 24rpx calc(32rpx + env(safe-area-inset-bottom));
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
}

.popup-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #333;
  text-align: center;
  margin-bottom: 16rpx;
}

.popup-tip {
  font-size: 24rpx;
  color: #999;
  text-align: center;
  margin-bottom: 24rpx;
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
