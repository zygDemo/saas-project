<template>
  <ElDialog
    v-model="visible"
    title="移动端模块配置"
    width="560px"
    align-center
    class="el-dialog-border"
    @close="handleClose"
  >
    <ElScrollbar max-height="60vh">
      <!-- 角色名称 -->
      <div class="mb-4 text-sm text-gray-500">
        角色：<span class="font-medium text-gray-700">{{ roleData?.roleName ?? '—' }}</span>
      </div>

      <!-- 是否支持多业务模块 -->
      <div class="mb-4 flex items-center gap-3">
        <span class="text-sm text-gray-700">多业务模块：</span>
        <ElSwitch v-model="form.mobileMultiModule" @change="onMultiModuleChange" />
        <span class="text-xs text-gray-400">{{ form.mobileMultiModule ? '支持多模块切换' : '单模块模式' }}</span>
      </div>

      <!-- 模块勾选列表 -->
      <div class="mb-2 text-sm text-gray-700 font-medium">选择可用模块：</div>
      <ElCheckboxGroup v-model="selectedModules" class="flex flex-col gap-2">
        <ElCheckbox
          v-for="mod in availableModules"
          :key="mod.key"
          :value="mod.key"
          :disabled="!form.mobileMultiModule && selectedModules.length >= 1 && !selectedModules.includes(mod.key)"
          size="large"
          class="module-checkbox"
        >
          <div class="flex items-center gap-2">
            <span class="font-medium">{{ mod.name }}</span>
            <span class="text-xs text-gray-400">— {{ mod.desc }}</span>
          </div>
        </ElCheckbox>
      </ElCheckboxGroup>
      <p v-if="!form.mobileMultiModule && selectedModules.length > 0" class="mt-2 text-xs text-amber-500">
        单模块模式：仅第一个勾选的模块生效
      </p>

      <!-- 默认模块预览 -->
      <div class="mt-4 p-3 bg-gray-50 rounded-md">
        <div class="text-xs text-gray-500 mb-1">移动端首页预览：</div>
        <div v-if="selectedModules.length === 0" class="text-sm text-gray-400">将展示默认首页</div>
        <div v-else class="text-sm text-blue-600">
          <template v-if="form.mobileMultiModule">
            多模块首页，可切换：[{{ selectedModules.map(k => moduleMap[k]?.name ?? k).join('、') }}]
          </template>
          <template v-else>
            直接进入：{{ moduleMap[defaultModule]?.name ?? defaultModule }}
          </template>
        </div>
      </div>
    </ElScrollbar>

    <template #footer>
      <ElButton @click="resetConfig" :loading="resetting">恢复默认（使用租户配置）</ElButton>
      <ElButton type="primary" @click="save" :loading="saving">保存</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
import {
  fetchGetRoleMobileConfig,
  fetchUpdateRoleMobileConfig,
  fetchResetRoleMobileConfig
} from '@/api/system-manage'

type RoleListItem = Api.SystemManage.RoleListItem
type MobileModuleItem = Api.SystemManage.MobileModuleItem

interface Props {
  modelValue: boolean
  roleData?: RoleListItem
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const saving = ref(false)
const resetting = ref(false)
const availableModules = ref<MobileModuleItem[]>([])
const moduleMap = ref<Record<string, MobileModuleItem>>({})

const form = reactive({
  mobileMultiModule: false
})

const selectedModules = ref<string[]>([])

const defaultModule = computed(() => {
  return selectedModules.value[0] ?? null
})

const onMultiModuleChange = (val: string | number | boolean) => {
  if (!Boolean(val) && selectedModules.value.length > 1) {
    selectedModules.value = [selectedModules.value[0]]
  }
}

const loadConfig = async () => {
  if (!props.roleData?.roleId) return
  try {
    const res = await fetchGetRoleMobileConfig(props.roleData.roleId)
    availableModules.value = res.available
    moduleMap.value = res.available.reduce((map, m) => ({ ...map, [m.key]: m }), {})
    selectedModules.value = res.enabled ?? []
    form.mobileMultiModule = res.mobileMultiModule
  } catch {
    // ignored
  }
}

const save = async () => {
  if (!props.roleData?.roleId) return
  saving.value = true
  try {
    await fetchUpdateRoleMobileConfig(props.roleData.roleId, {
      mobileModules: selectedModules.value,
      mobileMultiModule: form.mobileMultiModule,
      defaultMobileModule: defaultModule.value
    })
    emit('success')
    visible.value = false
  } finally {
    saving.value = false
  }
}

const resetConfig = async () => {
  if (!props.roleData?.roleId) return
  resetting.value = true
  try {
    const res = await fetchResetRoleMobileConfig(props.roleData.roleId)
    selectedModules.value = res.enabled ?? []
    form.mobileMultiModule = res.mobileMultiModule
    emit('success')
  } finally {
    resetting.value = false
  }
}

const handleClose = () => {
  // reset state on close
}

watch(
  () => props.modelValue,
  (val) => {
    if (val) loadConfig()
  }
)
</script>

<style scoped>
.module-checkbox {
  margin: 0;
  padding: 8px 12px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  transition: background 0.2s;
}
.module-checkbox:hover {
  background: var(--el-fill-color-light);
}
</style>
