<template>
  <ElDialog
    :model-value="modelValue"
    :title="formMode === 'create' ? `新增${displayTitle}` : `编辑${displayTitle}`"
    width="680px"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <ElForm label-width="130px" class="business-form">
      <template v-for="(field, index) in formFields" :key="field.prop">
        <div v-if="shouldShowFieldGroup(field, index)" class="business-form__section">{{
          field.group
        }}</div>
        <ElFormItem :label="field.label" :required="field.required">
          <ElInputNumber
            v-if="field.type === 'number'"
            :model-value="formModel[field.prop] as number"
            :min="0"
            :precision="field.precision"
            controls-position="right"
            style="width: 100%"
            @update:model-value="updateField(field.prop, $event)"
          >
            <template v-if="field.unit" #suffix>{{ field.unit }}</template>
          </ElInputNumber>
          <ElSelect
            v-else-if="field.type === 'select'"
            :model-value="formModel[field.prop]"
            clearable
            filterable
            :placeholder="field.placeholder || `请选择${field.label}`"
            :loading="Boolean(selectLoading[field.prop])"
            style="width: 100%"
            @update:model-value="updateField(field.prop, $event)"
            @change="(value) => $emit('field-change', field, value)"
          >
            <ElOption
              v-for="option in fieldOptions(field)"
              :key="String(option.value)"
              :label="option.label"
              :value="option.value"
            />
          </ElSelect>
          <ElSwitch
            v-else-if="field.type === 'switch'"
            :model-value="formModel[field.prop] as boolean"
            @update:model-value="updateField(field.prop, $event)"
          />
          <ElDatePicker
            v-else-if="field.type === 'date'"
            :model-value="formModel[field.prop]"
            type="datetime"
            value-format="YYYY-MM-DDTHH:mm:ss.SSSZ"
            :placeholder="field.placeholder || `请选择${field.label}`"
            style="width: 100%"
            @update:model-value="updateField(field.prop, $event)"
          />
          <ElInput
            v-else
            :model-value="formModel[field.prop] as string"
            clearable
            :autosize="
              field.type === 'json' || field.type === 'textarea'
                ? { minRows: 3, maxRows: 8 }
                : undefined
            "
            :placeholder="field.placeholder || `请输入${field.label}`"
            :type="field.type === 'textarea' || field.type === 'json' ? 'textarea' : 'text'"
            @update:model-value="updateField(field.prop, $event)"
          />
        </ElFormItem>
      </template>
    </ElForm>
    <template #footer>
      <ElButton @click="$emit('update:modelValue', false)">取消</ElButton>
      <ElButton type="primary" :loading="submitting" @click="$emit('submit')">保存</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import type { PropType } from 'vue'
  import type { FieldConfig, OptionConfig } from './types'

  const props = defineProps({
    modelValue: {
      type: Boolean,
      required: true
    },
    formMode: {
      type: String as PropType<'create' | 'edit'>,
      required: true
    },
    displayTitle: {
      type: String,
      required: true
    },
    formFields: {
      type: Array as PropType<FieldConfig[]>,
      default: () => []
    },
    formModel: {
      type: Object as PropType<Record<string, unknown>>,
      required: true
    },
    selectLoading: {
      type: Object as PropType<Record<string, boolean>>,
      default: () => ({})
    },
    submitting: {
      type: Boolean,
      default: false
    },
    shouldShowFieldGroup: {
      type: Function as PropType<(field: FieldConfig, index: number) => boolean>,
      required: true
    },
    fieldOptions: {
      type: Function as PropType<(field: FieldConfig) => OptionConfig[]>,
      required: true
    }
  })

  const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    'update:formModel': [value: Record<string, unknown>]
    'field-change': [field: FieldConfig, value: unknown]
    submit: []
  }>()

  function updateField(prop: string, value: unknown) {
    emit('update:formModel', {
      ...props.formModel,
      [prop]: value
    })
  }
</script>

<style scoped>
  .business-form {
    max-height: 62vh;
    padding-right: 10px;
    overflow: auto;
  }

  .business-form__section {
    padding: 12px 0 10px;
    margin-bottom: 16px;
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    border-bottom: 1px solid var(--el-border-color-lighter);
  }
</style>
