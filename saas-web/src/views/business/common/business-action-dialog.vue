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
          :model-value="actionModel[field.prop]"
          type="datetime"
          value-format="YYYY-MM-DDTHH:mm:ss.SSSZ"
          style="width: 100%"
          @update:model-value="updateField(field.prop, $event)"
        />
        <ElSelect
          v-else-if="field.type === 'select'"
          :model-value="actionModel[field.prop]"
          placeholder="请选择"
          clearable
          style="width: 100%"
          @update:model-value="updateField(field.prop, $event)"
        >
          <ElOption
            v-for="opt in field.options || []"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </ElSelect>
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
    const newModel = { ...props.actionModel, [prop]: value }
    // 部分结清：修改还款总额时按比例重算本金/利息
    if (prop === 'amount' && newModel.repayType === 'PARTIAL') {
      const row = props.activeAction?._actionRow as Record<string, unknown> | undefined
      const origP = Number(row?.__earlyRepayOrigPrincipal || 0)
      const origI = Number(row?.__earlyRepayOrigInterest || 0)
      const origTotal = origP + origI
      if (origTotal > 0) {
        const ratio = Number(value) / origTotal
        newModel.principal = Math.round(origP * ratio * 100) / 100
        newModel.interest = Math.round(origI * ratio * 100) / 100
      }
    }
    // 切换还款类型时重置金额
    if (prop === 'repayType') {
      const row = props.activeAction?._actionRow as Record<string, unknown> | undefined
      if (row) {
        const origP = Number(row.__earlyRepayOrigPrincipal || 0)
        const origI = Number(row.__earlyRepayOrigInterest || 0)
        const origTotal = Math.round((origP + origI) * 100) / 100
        if (value === 'FULL') {
          newModel.amount = origTotal
          newModel.principal = Math.round(origP * 100) / 100
          newModel.interest = Math.round(origI * 100) / 100
        } else {
          // PARTIAL: 取第一个未还清计划的金额
          const plans = (row.repayments || []) as Record<string, unknown>[]
          const firstUnpaid = plans.find((p: Record<string, unknown>) => {
            const s = String(p.status)
            return s !== 'PAID' && s !== 'SETTLED'
          })
          if (firstUnpaid) {
            newModel.amount = Number(firstUnpaid.totalAmount || 0)
            newModel.principal = Number(firstUnpaid.principal || 0)
            newModel.interest = Number(firstUnpaid.interest || 0)
          }
        }
      }
    }
    emit('update:actionModel', newModel)
  }
</script>

<style scoped>
  .business-form {
    max-height: 62vh;
    padding-right: 10px;
    overflow: auto;
  }
</style>
