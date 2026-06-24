<template>
  <app-page nav-title="客户资料">
    <view class="idinfo-supplement-page">
      <!-- 客户信息 -->
      <view class="section-title">
        <u-text text="客户信息" size="32rpx" bold />
      </view>

      <AppForm :modelValue="form" :items="readonlyCustomerFormItems" />

      <!-- 联系人信息 -->
      <view class="section-title">
        <view class="title-left">
          <u-text text="联系人信息" size="32rpx" bold />
        </view>
        <view class="title-right">
          <u-button
            v-if="!readonly"
            type="primary"
            size="mini"
            :custom-style="addBtnStyle"
            @click="handleAddContact"
          >
            + 添加联系人
          </u-button>
        </view>
      </view>

      <!-- 联系人列表 -->
      <view v-if="contactList.length > 0" class="contact-list">
        <view
          v-for="(contact, index) in contactList"
          :key="contact.id || index"
          class="contact-card"
        >
          <view class="contact-card-header">
            <u-text
              :text="
                contactTypeMap[contact.contactType] || `联系人${index + 1}`
              "
              size="30rpx"
              bold
            />
            <view v-if="!readonly" class="contact-card-actions">
              <u-button
                type="warning"
                size="mini"
                text="编辑"
                @click="handleEditContact(contact)"
              />
              <u-button
                type="error"
                size="mini"
                text="删除"
                @click="handleDeleteContact(contact)"
              />
            </view>
          </view>
          <view class="contact-card-body">
            <view class="contact-info-row">
              <u-text text="姓名：" size="28rpx" color="#999" />
              <u-text :text="contact.contactName || '-'" size="28rpx" />
            </view>
            <view class="contact-info-row">
              <u-text text="电话：" size="28rpx" color="#999" />
              <u-text :text="contact.contactTelephone || '-'" size="28rpx" />
            </view>
            <view class="contact-info-row">
              <u-text text="身份证：" size="28rpx" color="#999" />
              <u-text :text="contact.contactIdcard || '-'" size="28rpx" />
            </view>
            <view class="contact-info-row">
              <u-text text="关系：" size="28rpx" color="#999" />
              <u-text
                :text="relationshipMap[contact.contactRelationship] || '-'"
                size="28rpx"
              />
            </view>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-else class="contact-empty">
        <u-text text="暂无联系人信息" size="28rpx" color="#c0c4cc" />
      </view>

      <!-- 联系人编辑弹窗 -->
      <u-popup
        v-model="showContactForm"
        mode="bottom"
        border-radius="32rpx"
        closeable
      >
        <view class="contact-form-popup">
          <view class="popup-title">
            <u-text
              :text="editingContactId != null ? '编辑联系人' : '添加联系人'"
              size="36rpx"
              bold
            />
          </view>
          <AppForm :modelValue="contactForm" :items="readonlyContactFormItems" />
          <view class="popup-footer">
            <u-button
              text="取消"
              size="medium"
              @click="showContactForm = false"
            />
            <u-button
              type="primary"
              :loading="contactSaveLoading"
              size="medium"
              text="确定"
              @click="handleSubmitContact"
            />
          </view>
        </view>
      </u-popup>

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
import { computed, reactive, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { useLocalStore } from "@/stores";
import { useCarloanApi } from "@/api/carloan";
import AppForm from "@/components/app-form/app-form.vue";
import { isMobilePhone, isSimpleIdCard, validateRequiredFields } from "@/common/validators";
import { APP_ROUTES, buildRoute } from "@/common/navigation";
import { buildSupplementRouteQuery } from "@/common/carloan-route-query";
import { useCarloanStore } from "@/stores/carloan";

const localStore = useLocalStore()
const carloanStore = useCarloanStore();
const businessApi = useCarloanApi();

/** 添加联系人按钮自定义样式 */
const addBtnStyle = {
  padding: "0 20rpx",
  height: "56rpx",
  fontSize: "26rpx",
};

const submitLoading = ref(false);
const readonly = ref(false);
const loading = ref(false);

const form = reactive({
  // 客户信息
  dwellingCondition: "", // 居住状况
  liveAddress: "", // 居住省市区
  liveDetailedAddress: "", // 居住详细地址
  permanentAddress: "", // 常驻地址
  marriage: "", // 婚姻状况
  personIncome: "", // 月收入(分)
  childrenNum: "", // 供养子女数
  education: "", // 学历
  degree: "", // 学位
  race: "", // 民族
  personOccupation: "", // 职业
  workingName: "", // 公司单位名称
  workingAddress: "", // 公司省市区
  workingDetailedAddress: "", // 公司详细地址
  workingTelephone: "", // 公司电话
});

// ========== 联系人列表管理 ==========
const contactList = ref([]);
const showContactForm = ref(false);
const editingContactId = ref(null);
const contactSaveLoading = ref(false);

const contactForm = reactive({
  contactType: "", // 联系人类型
  contactName: "", // 联系人姓名
  contactTelephone: "", // 联系电话
  contactIdcard: "", // 身份证号码
  contactRelationship: "", // 与客户关系
});

// 联系人类型映射
const contactTypeMap = {
  1: "共借人",
  2: "配偶",
  3: "配偶且共借人",
  4: "担保人",
};

// 关系映射
const relationshipMap = {
  1: "配偶",
  2: "父母",
  3: "子女",
  4: "朋友",
  5: "兄弟姐妹",
  6: "亲戚",
  7: "同事",
  8: "其他",
};

// ========== 数据加载 ==========

/** 加载客户信息和联系人列表 */
async function loadData() {
  if (!carloanStore.pageContext.uuid) return;

  loading.value = true;
  try {
    if (carloanStore.pageContext.creditOrderId) {
      await loadCreditReadonlyStatus();
    }

    // 加载客户信息
    const res = await businessApi.getUserBasic(carloanStore.pageContext.uuid);
    if (res && res.code === 200 && res.data) {
      const data = res.data;
      Object.keys(form).forEach((key) => {
        if (data[key] !== undefined && data[key] !== null) {
          form[key] = String(data[key]);
        }
      });
    }

    // 加载联系人列表
    await loadContacts();
  } catch (e) {
    console.error("加载客户信息失败", e);
  } finally {
    loading.value = false;
  }
}

/** 加载联系人列表 */
async function loadCreditReadonlyStatus() {
  try {
    const res = await businessApi.getCreditDetailByOrderId(carloanStore.pageContext.creditOrderId);
    const businessNode = res?.data?.businessNode || "";
    if (businessNode && businessNode !== "SUPPLEMENT_MATERIALS") {
      readonly.value = true;
    }
  } catch (e) {
    console.error("加载授信节点失败", e);
  }
}

async function loadContacts() {
  if (!carloanStore.pageContext.uuid) return;
  try {
    const res = await businessApi.getContacts(carloanStore.pageContext.uuid);
    if (res && res.code === 200 && res.data) {
      contactList.value = Array.isArray(res.data) ? res.data : [];
    }
  } catch (e) {
    console.error("加载联系人列表失败", e);
  }
}

// ========== 联系人操作 ==========

/** 新增联系人 */
function handleAddContact() {
  if (readonly.value) return;
  editingContactId.value = null;
  resetContactForm();
  showContactForm.value = true;
}

/** 编辑联系人 */
function handleEditContact(contact) {
  if (readonly.value) return;
  editingContactId.value = contact.id || null;
  contactForm.contactType =
    contact.contactType != null ? String(contact.contactType) : "";
  contactForm.contactName = contact.contactName || "";
  contactForm.contactTelephone = contact.contactTelephone || "";
  contactForm.contactIdcard = contact.contactIdcard || "";
  contactForm.contactRelationship =
    contact.contactRelationship != null
      ? String(contact.contactRelationship)
      : "";
  showContactForm.value = true;
}

/** 重置联系人表单 */
function resetContactForm() {
  contactForm.contactType = "";
  contactForm.contactName = "";
  contactForm.contactTelephone = "";
  contactForm.contactIdcard = "";
  contactForm.contactRelationship = "";
}

/** 删除联系人 */
async function handleDeleteContact(contact) {
  if (readonly.value) return;
  if (!contact.id) {
    $u.toast("联系人数据异常");
    return;
  }

  const confirmed = await new Promise((resolve) => {
    uni.showModal({
      title: "确认删除",
      content: `确定要删除联系人"${contact.contactName}"吗？`,
      success: (res) => resolve(res.confirm),
      fail: () => resolve(false),
    });
  });

  if (!confirmed) return;

  try {
    const res = await businessApi.deleteContact(contact.id);
    if (res && res.code === 200) {
      $u.toast("删除成功", "success");
      await loadContacts();
    } else {
      $u.toast((res && res.msg) || "删除失败");
    }
  } catch (e) {
    console.error("删除联系人失败", e);
    $u.toast((e && e.msg) || "删除失败，请重试");
  }
}

/** 提交联系人表单（新增/编辑） */
async function handleSubmitContact() {
  // ========== 表单必填校验 ==========
  // 联系人弹窗必填字段：联系人类型、联系人姓名、联系电话、与客户关系
  const requiredFields = [
    { key: "contactType", label: "联系人类型" },
    { key: "contactName", label: "联系人姓名" },
    { key: "contactTelephone", label: "联系电话" },
    { key: "contactRelationship", label: "与客户关系" },
  ];
  if (!validateRequiredFields(contactForm, requiredFields, (msg) => $u.toast(msg))) {
    return;
  }
  // 3. 联系方式格式校验（有值时校验）
  if (contactForm.contactTelephone && !isMobilePhone(contactForm.contactTelephone)) {
    $u.toast("请输入正确的手机号码");
    return;
  }

  // 4. 身份证格式校验（有值时校验）
  if (contactForm.contactIdcard && !isSimpleIdCard(contactForm.contactIdcard)) {
    $u.toast("请输入正确的身份证号码");
    return;
  }
  // ========== 校验通过，提交数据 ==========

  contactSaveLoading.value = true;
  try {
    const data = {
      userUuid: carloanStore.pageContext.uuid,
      contactType: Number(contactForm.contactType),
      contactName: contactForm.contactName,
      contactTelephone: contactForm.contactTelephone,
      contactIdcard: contactForm.contactIdcard || undefined,
      contactRelationship: Number(contactForm.contactRelationship),
    };

    // 编辑时带上 id
    if (editingContactId.value != null) {
      data.id = editingContactId.value;
    }

    const res = await businessApi.addOrUpdateContact(data);
    if (res && res.code === 200) {
      const msg = editingContactId.value != null ? "编辑成功" : "添加成功";
      $u.toast(msg, "success");
      showContactForm.value = false;
      resetContactForm();
      await loadContacts();
    } else {
      $u.toast((res && res.msg) || "保存失败");
    }
  } catch (e) {
    console.error("保存联系人失败", e);
    $u.toast((e && e.msg) || "保存失败，请重试");
  } finally {
    contactSaveLoading.value = false;
  }
}

// ========== 页面初始化 ==========

onLoad((options) => {
    carloanStore.syncFromRouteQuery(options || {});
  carloanStore.pageContext.uuid = (options && options.uuid) || localStore.userInfo?.uuid || "";
  carloanStore.pageContext.creditOrderId = (options && options.creditOrderId) || "";
  readonly.value = options?.readonly === "1" || options?.readonly === "true";
  loadData();
});

// ========== 表单配置 ==========

// 客户信息表单配置
const customerFormItems = [
  {
    key: "dwellingCondition",
    label: "居住状况",
    type: "select",
    placeholder: "请选择居住状况",
    required: true,
    options: [
      { label: "自有住房", value: "自有住房" },
      { label: "租赁住房", value: "租赁住房" },
      { label: "与父母同住", value: "与父母同住" },
      { label: "其他", value: "其他" },
    ],
  },
  {
    key: "liveAddress",
    label: "居住省市区",
    type: "region",
    placeholder: "请选择居住地址",
    required: true,
  },
  {
    key: "liveDetailedAddress",
    label: "居住详细地址",
    type: "text",
    placeholder: "请输入居住详细地址",
    required: true,
  },
  {
    key: "marriage",
    label: "婚姻状况",
    type: "select",
    placeholder: "请选择婚姻状况",
    required: true,
    options: [
      { label: "未婚", value: "未婚" },
      { label: "已婚", value: "已婚" },
      { label: "离异", value: "离异" },
      { label: "丧偶", value: "丧偶" },
    ],
  },
  {
    key: "personIncome",
    label: "月收入",
    type: "number",
    required: true,
  },
  {
    key: "childrenNum",
    label: "供养子女数",
    type: "select",
    placeholder: "请选择供养子女数",
    options: [
      { label: "0", value: "0" },
      { label: "1", value: "1" },
      { label: "2", value: "2" },
      { label: "3", value: "3" },
      { label: "4", value: "4" },
      { label: "5", value: "5" },
    ],
  },
  {
    key: "education",
    label: "学历",
    type: "select",
    placeholder: "请选择学历",
    options: [
      { label: "小学", value: "小学" },
      { label: "初中", value: "初中" },
      { label: "高中", value: "高中" },
      { label: "大专", value: "大专" },
      { label: "本科", value: "本科" },
      { label: "硕士", value: "硕士" },
      { label: "博士", value: "博士" },
    ],
  },
  {
    key: "degree",
    label: "学位",
    type: "select",
    placeholder: "请选择学位",
    options: [
      { label: "名誉博士", value: "1" },
      { label: "博士", value: "2" },
      { label: "硕士", value: "3" },
      { label: "学士", value: "4" },
      { label: "无", value: "5" },
      { label: "未知", value: "9" },
    ],
  },
  {
    key: "personOccupation",
    label: "职业",
    type: "select",
    placeholder: "请选择职业",
    options: [
      { label: "企业职员", value: "企业职员" },
      { label: "公务员", value: "公务员" },
      { label: "事业单位", value: "事业单位" },
      { label: "个体经营", value: "个体经营" },
      { label: "自由职业", value: "自由职业" },
      { label: "务农", value: "务农" },
      { label: "退休", value: "退休" },
      { label: "学生", value: "学生" },
      { label: "其他", value: "其他" },
    ],
  },
  {
    key: "workingName",
    label: "单位名称",
    type: "text",
    placeholder: "请输入单位名称",
  },
  {
    key: "workingAddress",
    label: "单位省市区",
    type: "region",
    placeholder: "请选择单位地址",
  },
  {
    key: "workingDetailedAddress",
    label: "单位详细地址",
    type: "text",
    placeholder: "请输入单位详细地址",
  },
  {
    key: "workingTelephone",
    label: "公司电话",
    type: "text",
    placeholder: "请输入公司电话",
  },
];

// 联系人信息表单配置
const contactFormItems = [
  {
    key: "contactType",
    label: "联系人类型",
    type: "select",
    placeholder: "请选择类型",
    required: true,
    options: [
      { label: "共借人", value: "1" },
      { label: "配偶", value: "2" },
      { label: "配偶且共借人", value: "3" },
      { label: "担保人", value: "4" },
    ],
  },
  {
    key: "contactName",
    label: "联系人姓名",
    type: "text",
    placeholder: "请输入联系人姓名",
    required: true,
  },
  {
    key: "contactTelephone",
    label: "联系电话",
    type: "number",
    placeholder: "请输入联系人电话",
    required: true,
  },
  {
    key: "contactIdcard",
    label: "联系人身份证",
    type: "text",
    placeholder: "请输入联系人身份证",
  },
  {
    key: "contactRelationship",
    label: "与客户关系",
    type: "select",
    placeholder: "请选择关系",
    required: true,
    options: [
      { label: "配偶", value: "1" },
      { label: "父母", value: "2" },
      { label: "子女", value: "3" },
      { label: "朋友", value: "4" },
      { label: "兄弟姐妹", value: "5" },
      { label: "亲戚", value: "6" },
      { label: "同事", value: "7" },
      { label: "其他", value: "8" },
    ],
  },
];

// ========== 保存客户信息 ==========

async function saveCustomerInfo() {
  if (readonly.value) return false;

  if (!carloanStore.pageContext.uuid) {
    $u.toast("缺少客户标识");
    return false;
  }

  // ========== 表单必填校验 ==========
  // 1. 校验客户信息必填字段（基于表单配置 required: true 的字段）
  const requiredCustomerFields = customerFormItems
    .filter((item) => item.required)
    .map((item) => ({ key: item.key, label: item.label }));
  if (!validateRequiredFields(form, requiredCustomerFields, (msg) => $u.toast(msg))) {
    return false;
  }

  // 2. 校验联系人信息：至少添加一个联系人
  if (contactList.value.length === 0) {
    $u.toast("请至少添加一个联系人");
    return false;
  }
  // ========== 校验通过，组装提交数据 ==========

  submitLoading.value = true;
  try {
    // 1. 保存客户信息
    const customerData = { uuid: carloanStore.pageContext.uuid };
    if (carloanStore.pageContext.creditOrderId) {
      customerData.creditOrderId = carloanStore.pageContext.creditOrderId;
    }
    const numberKeys = ["personIncome", "childrenNum", "degree"];

    for (const item of customerFormItems) {
      const val = form[item.key];
      if (val !== "" && val !== undefined) {
        customerData[item.key] = numberKeys.includes(item.key)
          ? Number(val)
          : val;
      }
    }

    // 拆分省市区地址，删除原始组合字段
    if (form.liveAddress) {
      const parts = form.liveAddress.split("/");
      customerData.liveProvince = parts[0] || "";
      customerData.liveCity = parts[1] || "";
      customerData.liveDistrict = parts[2] || "";
      delete customerData.liveAddress;
    }
    if (form.workingAddress) {
      const parts = form.workingAddress.split("/");
      customerData.workingProvince = parts[0] || "";
      customerData.workingCity = parts[1] || "";
      customerData.workingDistrict = parts[2] || "";
      delete customerData.workingAddress;
    }

    const customerRes = await businessApi.addOrUpdateUserBasic(customerData);
    if (!customerRes || customerRes.code !== 200) {
      $u.toast((customerRes && customerRes.msg) || "客户信息保存失败");
      return false;
    }

    // 2. 联系人已通过弹窗表单单独保存，此处无需额外处理

    $u.toast("保存成功", "success");
    return true;
  } catch (e) {
    console.error("保存失败", e);
    $u.toast((e && e.msg) || "保存失败，请重试");
    return false;
  } finally {
    submitLoading.value = false;
  }
}

async function handleSave() {
  await saveCustomerInfo();
}

async function handleNext() {
  const success = await saveCustomerInfo();
  if (!success) return;

  const supplementRouteQuery = buildSupplementRouteQuery({
    uuid: carloanStore.pageContext.uuid,
    creditOrderId: carloanStore.pageContext.creditOrderId,
    readonly: readonly.value ? 1 : undefined,
  });
  uni.navigateTo({
    url: buildRoute(APP_ROUTES.carloan.supplement.carInfoSupplement, supplementRouteQuery),
  });
}

const readonlyCustomerFormItems = computed(() =>
  customerFormItems.map((item) => ({ ...item, disabled: readonly.value || item.disabled })),
);

const readonlyContactFormItems = computed(() =>
  contactFormItems.map((item) => ({ ...item, disabled: readonly.value || item.disabled })),
);
</script>

<style lang="scss" scoped>
.idinfo-supplement-page {
  padding: 28rpx 24rpx 140rpx;
  background: linear-gradient(180deg, #f7f8f9 0%, #ffffff 100%);
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;

  .title-left {
    display: flex;
    align-items: center;
    gap: 12rpx;
  }

  .title-dot {
    width: 10rpx;
    height: 32rpx;
    border-radius: 5rpx;
    background: linear-gradient(180deg, var(--u-type-primary) 0%, #5b9fff 100%);
  }

  .title-right {
    flex-shrink: 0;
  }
}

// ========== 联系人列表 ==========
.contact-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  margin-bottom: 24rpx;
}

.contact-card {
  border-radius: 22rpx;
  background: #ffffff;
  padding: 24rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.06);

  &-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20rpx;
    padding-bottom: 16rpx;
    border-bottom: 1rpx solid #f0f0f0;
  }

  &-body {
    display: flex;
    flex-direction: column;
    gap: 12rpx;
  }

  &-actions {
    display: flex;
    gap: 12rpx;
  }
}

.contact-info-row {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.contact-empty {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60rpx 0;
  border-radius: 22rpx;
  background: #ffffff;
  margin-bottom: 24rpx;
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

// ========== 联系人弹窗 ==========
.contact-form-popup {
  padding: 32rpx 24rpx;
  padding-bottom: calc(32rpx + env(safe-area-inset-bottom));
  max-height: 80vh;
  overflow-y: auto;

  .popup-title {
    text-align: center;
    margin-bottom: 24rpx;
  }

  .popup-footer {
    display: flex;
    gap: 24rpx;
    margin-top: 40rpx;
    padding-top: 24rpx;
    border-top: 1rpx solid #f0f0f0;
  }
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