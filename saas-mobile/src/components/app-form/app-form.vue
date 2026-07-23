<template>
  <view class="form-card">
    <u-form
      ref="uFormRef"
      :model="formState"
      :validate-trigger="validateTrigger"
    >
      <!-- 遍历所有表单项，提前过滤掉隐藏的字段 -->
      <u-form-item
        v-for="(item, index) in visibleItems"
        :key="index"
        :label="item.label"
        :required="
          item._actualRequired ||
          (item.rules && item.rules.some((r) => r.required))
        "
        :label-width="item.labelWidth || 180"
        :disabled="item.disabled"
        :rules="
          item.rules ||
          (item._actualRequired
            ? [{ required: true, message: `请输入${item.label}` }]
            : [])
        "
        :prop="item.key"
        :custom-style="item.disabled ? { opacity: '0.7' } : {}"
      >
        <!-- 输入框/文本域类型 -->
        <u-input
          v-if="
            item.type === 'text' ||
            !item.type ||
            item.type === 'number' ||
            item.type === 'textarea' ||
            item.type === 'password'
          "
          v-model="formState[item.key]"
          :placeholder="item.placeholder || `请输入${item.label}`"
          :type="
            item.type === 'password' ? 'password' : item.inputType || 'text'
          "
          :border="false"
          :disabled="item.disabled"
          :readonly="item.readonly"
          :clearable="item.clearable ?? true"
          @input="onInput(item.key, $event)"
        />

        <!-- 日期选择类型 -->
        <u-input
          v-else-if="item.type === 'date'"
          v-model="pickerDisplayValue[item.key]"
          :placeholder="item.placeholder || `请选择${item.label}`"
          type="select"
          :disabled="item.disabled"
          @click="openDatePicker(item)"
        />

        <!-- 时间选择类型 -->
        <u-input
          v-else-if="item.type === 'time'"
          v-model="pickerDisplayValue[item.key]"
          :placeholder="item.placeholder || `请选择${item.label}`"
          type="select"
          :disabled="item.disabled"
          @click="openDatePicker(item)"
        />

        <!-- 地区选择类型 -->
        <u-input
          v-else-if="item.type === 'region'"
          v-model="pickerDisplayValue[item.key]"
          :placeholder="item.placeholder || `请选择${item.label}`"
          type="select"
          :disabled="item.disabled"
          @click="openRegionPicker(item)"
        />

        <!-- 省市选择（仅省市两级联动） -->
        <u-input
          v-else-if="item.type === 'city'"
          v-model="pickerDisplayValue[item.key]"
          :placeholder="item.placeholder || `请选择${item.label}`"
          type="select"
          :disabled="item.disabled"
          @click="openRegionPicker(item)"
        />

        <!-- 选择框类型 -->
        <u-input
          v-else-if="item.type === 'select' && item.options"
          v-model="selectedLabels[item.key]"
          :placeholder="item.placeholder || `请选择${item.label}`"
          type="select"
          :disabled="item.disabled"
          :clearable="item.disabled ? false : (item.clearable ?? false)"
          @click="openSelect(item)"
        />

        <!-- 复选框组类型 -->
        <template v-else-if="item.type === 'checkbox'">
          <u-checkbox-group>
            <u-checkbox
              v-for="(option, optIndex) in item.options"
              :key="optIndex"
              v-model="option.checked"
              :name="option.name"
              :disabled="option.disabled"
              @change="onCheckboxChange(item.key, item.options)"
            >
              {{ option.name }}
            </u-checkbox>
          </u-checkbox-group>
        </template>

        <!-- 单选框组类型 -->
        <template v-else-if="item.type === 'radio'">
          <u-radio-group v-model="formState[item.key]">
            <u-radio
              v-for="(option, optIndex) in item.options"
              :key="optIndex"
              :name="option.name"
              :disabled="option.disabled"
            >
              {{ option.name }}
            </u-radio>
          </u-radio-group>
        </template>

        <!-- 开关类型 -->
        <template v-else-if="item.type === 'switch'">
          <u-switch v-model="formState[item.key]"></u-switch>
        </template>
      </u-form-item>
    </u-form>

    <!-- 单个选择器，复用（单列 / 多列联动） -->
    <u-select
      ref="selectRef"
      v-model="showSelect"
      :mode="selectMode"
      :list="selectList"
      :value-name="valueName"
      :label-name="labelName"
      :child-name="childName"
      :default-value="defaultIndex"
      @confirm="onSelectConfirm"
      @cancel="showSelect = false"
    />

    <!-- Picker 单例 - 支持日期/地区/时间选择 -->
    <u-picker
      ref="pickerRef"
      v-model="showPicker"
      :mode="currentPickerConfig.mode || 'date'"
      :default-time="currentPickerConfig.defaultTime"
      :default-region="currentPickerConfig.defaultRegion"
      :area-code="currentPickerConfig.areaCode"
      :start-year="currentPickerConfig.startYear || 1950"
      :end-year="currentPickerConfig.endYear || 2050"
      :show-time-tag="currentPickerConfig.showTimeTag !== false"
      :mask-close-able="currentPickerConfig.maskCloseAble !== false"
      :safe-area-inset-bottom="currentPickerConfig.safeAreaInsetBottom === true"
      :cancel-color="currentPickerConfig.cancelColor || '#606266'"
      :confirm-color="currentPickerConfig.confirmColor || '#2979ff'"
      :formatter="currentPickerConfig.formatter"
      :params="currentPickerConfig.params"
      :range="currentPickerConfig.range"
      :range-key="currentPickerConfig.rangeKey"
      :title="currentPickerConfig.title"
      @confirm="onPickerConfirm"
      @cancel="showPicker = false"
    />
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import provinceData from "uview-pro/libs/util/province";
import cityData from "uview-pro/libs/util/city";

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({}),
  },
  items: {
    type: Array,
    default: () => [],
  },
  validateTrigger: {
    type: String,
    default: "blur",
  },
});

const emit = defineEmits(["change"]);

const uFormRef = ref();
const showSelect = ref(false);
const selectList = ref([]);
const selectMode = ref("single-column");
const labelName = ref("label");
const valueName = ref("value");
const childName = ref("children");
const currentSelectKey = ref("");
const defaultIndex = ref([]);
const selectRef = ref(null);

// 单例模式 - Picker
const showPicker = ref(false);
const currentPickerKey = ref("");
const currentPickerConfig = ref({});
const pickerRef = ref(null);

// 使用本地响应式对象作为单一数据源
const formState = reactive({ ...props.modelValue });

// 监听 props.modelValue 变化，同步到本地状态
watch(
  () => props.modelValue,
  (newVal) => {
    Object.keys(formState).forEach((key) => delete formState[key]);
    Object.assign(formState, newVal);
  },
  { deep: true }
);

// 统一的字段更新方法
function updateField(key, value) {
  formState[key] = value;
  // 直接修改父组件传入的对象属性，保持响应式
  // eslint-disable-next-line vue/no-mutating-props
  props.modelValue[key] = value;
  emit("change", { key, value, formState: { ...formState } });
}

// 创建动态规则处理
const applyDynamicRules = () => {
  props.items.forEach((item) => {
    if (typeof item.hidden === "function") {
      item._actualHidden = item.hidden(formState, props.items);
    } else {
      item._actualHidden = item.hidden || false;
    }

    if (typeof item.disabled === "function") {
      item.disabled = item.disabled(formState, props.items);
    } else {
      item.disabled = item.disabled || false;
    }

    if (typeof item.required === "function") {
      item._actualRequired = item.required(formState, props.items);
    } else {
      item._actualRequired = item.required || false;
    }
  });
};

// 监听表单数据变化
watch(
  () => props.modelValue,
  () => {
    applyDynamicRules();
    executeFieldLinkages();
  },
  { deep: true }
);

// 监听 items 变化
watch(
  () => props.items,
  () => {
    applyDynamicRules();
  },
  { deep: true, immediate: true }
);

// 过滤掉隐藏的字段
const visibleItems = computed(() =>
  props.items.filter((item) => !item._actualHidden)
);

// 字段联动配置
const fieldLinkages = computed(() => {
  const linkages = [];
  props.items.forEach((item) => {
    if (item.linkage) {
      linkages.push({
        key: item.key,
        linkage: item.linkage,
      });
    }
  });
  return linkages;
});

// 执行字段联动操作
function executeFieldLinkages() {
  fieldLinkages.value.forEach(({ key, linkage }) => {
    const currentValue = formState[key];
    const rules = linkage.rules || [];

    for (const rule of rules) {
      const condition = rule.condition;
      const actions = rule.actions;
      const isConditionMet = condition(currentValue, formState);

      if (isConditionMet) {
        actions.forEach((action) => action(formState, props.items, emit));
      }
    }
  });
}

// 输入处理
function onInput(key, value) {
  updateField(key, value);
}

// 选择框显示文本
const selectedLabels = computed(() => {
  const labels = {};
  if (!formState || !props.items) {
    return labels;
  }
  props.items.forEach((item) => {
    if (item.type !== "select" || !item.options) {
      return;
    }
    const value = formState[item.key];
    if (!value) {
      labels[item.key] = "";
      return;
    }
    const option = item.options.find(
      (opt) => String(opt.value) === String(value)
    );
    labels[item.key] = option ? option.label : "";
  });
  return labels;
});

// 日期/地区选择器的显示值
const pickerDisplayValue = computed(() => {
  const display = {};
  if (!formState || !props.items) {
    return display;
  }
  props.items.forEach((item) => {
    if (item.type === "date" || item.type === "time" || item.type === "region" || item.type === "city") {
      display[item.key] = formState[item.key] || "";
    }
  });
  return display;
});

// 打开选择器
const openSelect = (item) => {
  if (item.disabled) return;
  selectMode.value = "single-column";
  selectList.value = item.options;
  labelName.value = item.labelKey || "label";
  valueName.value = item.valueKey || "value";
  currentSelectKey.value = item.key;
  const currentValue = formState[item.key];
  const index = item.options.findIndex(
    (opt) =>
      opt[valueName.value] === currentValue ||
      String(opt[valueName.value]) === String(currentValue)
  );
  defaultIndex.value = index >= 0 ? [index] : [];
  showSelect.value = true;
};

// 选择器确认
function onSelectConfirm(e) {
  if (selectMode.value === "mutil-column-auto") {
    // 多列联动：e 为 [省信息, 市信息]
    const provinceLabel = e[0]?.[labelName.value] || "";
    const cityLabel = e[1]?.[labelName.value] || "";
    const newValue = `${provinceLabel}/${cityLabel}`;
    updateField(currentSelectKey.value, newValue);

    // 同步存储额外字段
    const item = props.items.find((it) => it.key === currentSelectKey.value);
    if (item?.extraKeys) {
      if (item.extraKeys.province) updateField(item.extraKeys.province, provinceLabel);
      if (item.extraKeys.city) updateField(item.extraKeys.city, cityLabel);
    }

    // 恢复单列模式
    selectMode.value = "single-column";
  } else {
    // 单列模式
    const selectedOption = e[0];
    const selectedValue = selectedOption[valueName.value];
    updateField(currentSelectKey.value, selectedValue);
  }
  showSelect.value = false;
}

// 打开日期选择器
function openDatePicker(item) {
  currentPickerKey.value = item.key;
  const pickerMode = item.mode || "time";
  currentPickerConfig.value = {
    mode: pickerMode,
    valueType: item.type,
    defaultTime: buildDefaultTime(item),
    startYear: item.startYear || 1950,
    endYear: item.endYear || 2050,
    params: item.params || (item.type === "time"
      ? { hour: true, minute: true }
      : { year: true, month: true, day: true }),
    formatter: item.formatter,
    showTimeTag: item.showTimeTag,
    maskCloseAble: item.maskCloseAble,
    safeAreaInsetBottom: item.safeAreaInsetBottom,
    cancelColor: item.cancelColor,
    confirmColor: item.confirmColor,
  };
  showPicker.value = true;
}

// 打开地区选择器
function openRegionPicker(item) {
  if (item.type === "city") {
    // 省市两级联动：使用 u-select mutil-column-auto 模式
    const buildCityList = () =>
      provinceData.map((p, pi) => ({
        value: p.value,
        label: p.label,
        children: (cityData[pi] || []).map((c) => ({
          value: c.value,
          label: c.label,
        })),
      }));

    currentSelectKey.value = item.key;
    selectMode.value = "mutil-column-auto";
    selectList.value = buildCityList();
    labelName.value = "label";
    valueName.value = "value";
    childName.value = "children";
    defaultIndex.value = [0];
    showSelect.value = true;
  } else {
    currentPickerKey.value = item.key;
    currentPickerConfig.value = {
      mode: "region",
      defaultRegion: item.defaultRegion,
      areaCode: item.areaCode,
      maskCloseAble: item.maskCloseAble,
      safeAreaInsetBottom: item.safeAreaInsetBottom,
      cancelColor: item.cancelColor,
      confirmColor: item.confirmColor,
      title: item.title,
      params: item.params,
      extraKeys: item.extraKeys,
    };
    showPicker.value = true;
  }
}

// Picker 统一确认处理
function padDatePart(value) {
  return String(value ?? "").padStart(2, "0");
}

function getTodayText() {
  const now = new Date();
  return `${now.getFullYear()}-${padDatePart(now.getMonth() + 1)}-${padDatePart(now.getDate())}`;
}

function getCurrentTimeText() {
  const now = new Date();
  return `${padDatePart(now.getHours())}:${padDatePart(now.getMinutes())}`;
}

function buildDefaultTime(item) {
  const currentValue = formState[item.key];
  if (item.type === "time") {
    return `${getTodayText()} ${currentValue || item.defaultTime || getCurrentTimeText()}`;
  }
  return currentValue || item.defaultTime || getTodayText();
}

function onPickerConfirm(e) {
  const mode = currentPickerConfig.value.mode;
  const valueType = currentPickerConfig.value.valueType;
  let newValue = "";

  if (mode === "region") {
    if (e && e.province && e.city && e.area) {
      newValue = `${e.province.label}/${e.city.label}/${e.area.label}`;

      // 同步存储省市区 code 到额外字段
      const extraKeys = currentPickerConfig.value.extraKeys;
      if (extraKeys) {
        if (extraKeys.province) updateField(extraKeys.province, e.province.value);
        if (extraKeys.city) updateField(extraKeys.city, e.city.value);
        if (extraKeys.area) updateField(extraKeys.area, e.area.value);
      }
    } else if (e && e.label) {
      newValue = e.label;
    } else {
      newValue = "";
    }
  } else if (mode === "time" && valueType === "time") {
    const { hour, minute } = e || {};
    newValue = `${padDatePart(hour)}:${padDatePart(minute)}`;
  } else if (mode === "time" && valueType === "date") {
    const { year, month, day } = e || {};
    newValue = `${year}-${padDatePart(month)}-${padDatePart(day)}`;
  } else if (mode === "date") {
    const { year, month, day } = e || {};
    newValue = `${year}-${padDatePart(month)}-${padDatePart(day)}`;
  } else {
    newValue = e.format || e.value;
  }

  updateField(currentPickerKey.value, newValue);
  showPicker.value = false;
}

// 复选框变化处理
function onCheckboxChange(key, options) {
  const checkedValues = options
    .filter((opt) => opt.checked)
    .map((opt) => opt.value);
  updateField(key, checkedValues);
}

// 表单验证方法
function validate() {
  return new Promise((resolve, reject) => {
    if (!uFormRef.value) {
      resolve(true);
      return;
    }
    uFormRef.value.validate((res) => {
      if (res) {
        resolve(res);
      } else {
        reject(res);
      }
    });
  });
}

function validateFields(keys) {
  return new Promise((resolve, reject) => {
    if (!uFormRef.value) {
      resolve(true);
      return;
    }
    uFormRef.value.validateFields(keys, (res) => {
      if (res) {
        resolve(res);
      } else {
        reject(res);
      }
    });
  });
}

function clearValidate(keys) {
  if (uFormRef.value) {
    uFormRef.value.clearValidate(keys);
  }
}

function resetFields() {
  const initialData = {};
  props.items.forEach((item) => {
    initialData[item.key] = item.defaultValue ?? "";
  });
  // 重置 formState
  Object.keys(formState).forEach((key) => delete formState[key]);
  Object.assign(formState, initialData);
  // 同步到父组件
  Object.keys(formState).forEach((key) => {
    // eslint-disable-next-line vue/no-mutating-props
    props.modelValue[key] = formState[key];
  });
  if (uFormRef.value) {
    uFormRef.value.clearValidate();
  }
}

function getFormData() {
  return { ...formState };
}

function setFormData(data) {
  Object.assign(formState, data);
  // 同步到父组件
  Object.keys(formState).forEach((key) => {
    // eslint-disable-next-line vue/no-mutating-props
    props.modelValue[key] = formState[key];
  });
}

// 暴露方法给父组件调用
defineExpose({
  validate,
  validateFields,
  clearValidate,
  resetFields,
  getFormData,
  setFormData,
  uFormRef,
});
</script>

<style lang="scss" scoped>
.form-card {
  border-radius: 22rpx;
  background: $u-bg-white;
  margin: 32rpx 0;
  padding: 20rpx 32rpx;
  box-shadow: 0 12rpx 30rpx rgba(0, 0, 0, 0.06);
}

.form-list {
  padding: 0rpx 0rpx;
}

:deep(.u-form-item) {
  padding: 10rpx 0;
  min-height: 48rpx;
}

.form-row:last-child {
  border-bottom: none;
}

.form-row.required .form-label {
  font-weight: 500;
}

.form-label {
  color: #666;
  font-size: 28rpx;
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.required-mark {
  color: #ff4d4f;
  margin-right: 4rpx;
  font-size: 28rpx;
}

.form-value {
  display: flex;
  align-items: center;
  gap: 8rpx;
  flex-shrink: 0;
  min-height: 48rpx;
}

.value-text {
  color: #1a1a1a;
  font-size: 28rpx;
  font-weight: 500;
  line-height: 1.5;
}

.placeholder-text {
  color: #c0c4cc;
}

.picker-row {
  cursor: pointer;
}
</style>
