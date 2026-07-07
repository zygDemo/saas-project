<template>
  <ElDialog
    :model-value="modelValue"
    :title="activeAction?.label || '业务动作'"
    width="560px"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <ElForm label-width="120px" class="business-form">
      <ElFormItem
        v-for="field in actionFields"
        :key="field.prop"
        :label="field.label"
        :required="field.required"
      >
        <ElInputNumber
          v-if="field.type === 'number'"
          :model-value="actionModel[field.prop] as number"
          :min="0"
          :precision="field.precision"
          controls-position="right"
          style="width: 100%"
          @update:model-value="updateField(field.prop, $event)"
        />
        <ElDatePicker
          v-else-if="field.type === 'date'"
          :model-value="actionModel[field.prop] as string | number | Date | string[] | undefined"
          type="datetime"
          value-format="YYYY-MM-DDTHH:mm:ss.SSSZ"
          style="width: 100%"
          @update:model-value="updateField(field.prop, $event)"
        />
        <ElInput
          v-else
          :model-value="actionModel[field.prop] as string"
          clearable
          :type="field.type === 'textarea' ? 'textarea' : 'text'"
          @update:model-value="updateField(field.prop, $event)"
        />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton @click="$emit('update:modelValue', false)">取消</ElButton>
      <ElButton type="primary" :loading="submitting" @click="$emit('submit')">确认执行</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import type { PropType } from 'vue'
  import type { ActionConfig, FieldConfig } from './types'

  const props = defineProps({
    modelValue: {
      type: Boolean,
      required: true
    },
    activeAction: {
      type: Object as PropType<ActionConfig | null>,
      default: null
    },
    actionFields: {
      type: Array as PropType<FieldConfig[]>,
      default: () => []
    },
    actionModel: {
      type: Object as PropType<Record<string, unknown>>,
      required: true
    },
    submitting: {
      type: Boolean,
      default: false
    }
  })

  const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    'update:actionModel': [value: Record<string, unknown>]
    submit: []
  }>()

  function updateField(prop: string, value: unknown) {
    emit('update:actionModel', {
      ...props.actionModel,
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
</style>
