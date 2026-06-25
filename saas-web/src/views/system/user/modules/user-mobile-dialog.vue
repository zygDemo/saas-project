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
      <!-- 用户信息 -->
      <div class="mb-4 text-sm text-gray-500">
        用户：<span class="font-medium text-gray-700">{{ userData?.userName ?? '—' }}</span>
        <template v-if="configData.roles?.length">
          ｜ 角色：
          <ElTag
            v-for="r in configData.roles"
            :key="r.roleId"
            size="small"
            class="ml-1"
          >
            {{ r.roleName }}
          </ElTag>
        </template>
      </div>

      <!-- 是否支持多业务模块 -->
      <div class="mb-4 flex items-center gap-3">
        <span class="text-sm text-gray-700">多业务模块：</span>
        <ElSwitch v-model="form.mobileMultiModule" @change="onMultiModuleChange" />
        <span class="text-xs text-gray-400">{{ form.mobileMultiModule ? '支持多模块切换' : '单模块模式' }}</span>
      </div>

      <!-- 模块勾选列表 -->
      <div class="mb-2 text-sm text-gray-700 font-medium">选择可用模块：</div>
      <div class="flex flex-col gap-2">
        <ElCheckbox
          v-for="mod in availableModules"
          :key="mod.key"
          v-model="selectedModules"
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
      </div>
      <p v-if="!form.mobileMultiModule && selectedModules.length > 0" class="mt-2 text-xs text-amber-500">
        单模块模式：仅第一个勾选的模块生效
      </p>

      <!-- 提示：用户级覆盖 -->
      <ElAlert
        v-if="selectedModules.length > 0"
        type="info"
        :closable="false"
        show-icon
        class="mt-3"
      >
        <template #title>
          <span class="text-xs">用户级配置会覆盖角色和租户的默认设置</span>
        </template>
      </ElAlert>

      <!-- 默认模块预览 -->
      <div class="mt-3 p-3 bg-gray-50 rounded-md">
        <div class="text-xs text-gray-500 mb-1">移动端首页预览：</div>
        <div v-if="selectedModules.length === 0" class="text-sm text-gray-400">
          将按角色/租户级配置展示
        </div>
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
      <ElButton @click="resetConfig" :loading="resetting">恢复默认（跟随角色/租户）</ElButton>
      <ElButton type="primary" @click="save" :loading="saving">保存</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
import {
  fetchGetUserMobileConfig,
  fetchUpdateUserMobileConfig,
  fetchResetUserMobileConfig
} from '@/api/system-manage'

type UserListItem = Api.SystemManage.UserListItem
type MobileModuleItem = Api.SystemManage.MobileModuleItem
type EntityMobileConfigData = Api.SystemManage.EntityMobileConfigData

interface Props {
  modelValue: boolean
  userData?: Partial<UserListItem>
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

const configData = reactive<Partial<EntityMobileConfigData>>({
  roles: []
})

const form = reactive({
  mobileMultiModule: false
})

const selectedModules = ref<string[]>([])

const defaultModule = computed(() => {
  return selectedModules.value[0] ?? null
})

const onMultiModuleChange = (val: boolean) => {
  if (!val && selectedModules.value.length > 1) {
    selectedModules.value = [selectedModules.value[0]]
  }
}

const loadConfig = async () => {
  if (!props.userData?.id) return
  try {
    const res = await fetchGetUserMobileConfig(props.userData.id)
    availableModules.value = res.available
    moduleMap.value = res.available.reduce((map, m) => ({ ...map, [m.key]: m }), {})
    selectedModules.value = res.enabled ?? []
    form.mobileMultiModule = res.mobileMultiModule
    configData.roles = res.roles ?? []
  } catch {
    // ignored
  }
}

const save = async () => {
  if (!props.userData?.id) return
  saving.value = true
  try {
    await fetchUpdateUserMobileConfig(props.userData.id, {
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
  if (!props.userData?.id) return
  resetting.value = true
  try {
    const res = await fetchResetUserMobileConfig(props.userData.id)
    selectedModules.value = res.enabled ?? []
    form.mobileMultiModule = res.mobileMultiModule
    configData.roles = res.roles ?? []
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
