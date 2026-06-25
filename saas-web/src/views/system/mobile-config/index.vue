<template>
  <div class="mobile-config-page art-full-height">
    <ElCard class="art-table-card">
      <template #header>
        <div class="card-header">
          <div>
            <h3>移动端模块配置</h3>
            <p>配置当前租户的移动端可用业务模块，勾选后移动端首页将展示对应入口</p>
          </div>
        </div>
      </template>

      <div v-loading="loading" class="config-body">
        <!-- 模块勾选区 -->
        <div class="module-checklist">
          <ElCheckboxGroup v-model="form.mobileModules" @change="onModulesChange">
            <div v-for="mod in available" :key="mod.key" class="module-card" :class="{ active: form.mobileModules.includes(mod.key) }">
              <ElCheckbox :value="mod.key" class="module-checkbox">
                <div class="module-info">
                  <div class="module-icon" :class="`icon-${mod.key}`">
                    <ElIcon :size="28"><component :is="iconMap[mod.key] || 'Box'" /></ElIcon>
                  </div>
                  <div class="module-text">
                    <span class="module-name">{{ mod.name }}</span>
                    <span class="module-desc">{{ mod.desc }}</span>
                  </div>
                </div>
              </ElCheckbox>
            </div>
          </ElCheckboxGroup>
        </div>

        <!-- 默认模块选择（多模块时显示） -->
        <div v-if="form.mobileModules.length > 1" class="default-module-section">
          <ElDivider />
          <ElFormItem label="默认进入模块" label-width="120px">
            <ElSelect v-model="form.defaultMobileModule" placeholder="用户登录后默认进入的模块" clearable style="width: 280px">
              <ElOption
                v-for="key in form.mobileModules"
                :key="key"
                :label="getModuleName(key)"
                :value="key"
              />
            </ElSelect>
            <span class="tip">不设置则展示多模块门户首页</span>
          </ElFormItem>
        </div>

        <!-- 预览提示 -->
        <div class="preview-section">
          <ElDivider />
          <div class="preview-info">
            <ElIcon :size="18"><InfoFilled /></ElIcon>
            <span v-if="form.mobileModules.length === 0" class="preview-text text-warning">未选择任何模块，移动端将无法使用业务功能</span>
            <span v-else-if="form.mobileModules.length === 1" class="preview-text">单模块模式：用户登录后直接进入「{{ getModuleName(form.mobileModules[0]) }}」，不可切换</span>
            <span v-else class="preview-text">多模块模式：用户登录后看到 {{ form.mobileModules.length }} 个业务入口的门户首页</span>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="action-bar">
          <ElButton type="primary" :loading="saving" @click="handleSave">保存配置</ElButton>
          <ElButton @click="loadData">重置</ElButton>
        </div>
      </div>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { InfoFilled, Van, Goods, Document, Reading } from '@element-plus/icons-vue'
import { fetchMobileConfig, fetchUpdateMobileConfig } from '@/api/system-manage'

const loading = ref(false)
const saving = ref(false)
const available = ref<Api.SystemManage.MobileModuleItem[]>([])

const form = reactive({
  mobileModules: [] as string[],
  defaultMobileModule: null as string | null
})

const iconMap: Record<string, any> = {
  carloan: Van,
  food: Goods,
  credit: Document,
  reading: Reading
}

function getModuleName(key: string) {
  return available.value.find((m) => m.key === key)?.name ?? key
}

function onModulesChange(val: string[]) {
  // 取消勾选时，如果默认模块被移除则清空
  if (form.defaultMobileModule && !val.includes(form.defaultMobileModule)) {
    form.defaultMobileModule = null
  }
  // 只剩一个时自动设为默认
  if (val.length === 1) {
    form.defaultMobileModule = val[0]
  }
}

async function loadData() {
  loading.value = true
  try {
    const { data } = await fetchMobileConfig()
    available.value = data.available
    form.mobileModules = [...data.enabled]
    form.defaultMobileModule = data.defaultModule
  } finally {
    loading.value = false
  }
}

async function handleSave() {
  if (form.mobileModules.length === 0) {
    ElMessage.warning('请至少选择一个模块')
    return
  }
  saving.value = true
  try {
    const { data } = await fetchUpdateMobileConfig({
      mobileModules: form.mobileModules,
      defaultMobileModule: form.defaultMobileModule ?? undefined
    })
    form.mobileModules = [...data.enabled]
    form.defaultMobileModule = data.defaultModule
    ElMessage.success('配置已保存')
  } finally {
    saving.value = false
  }
}

onMounted(loadData)
</script>

<style scoped lang="scss">
.config-body {
  max-width: 720px;
}

.card-header {
  h3 { margin: 0 0 4px; font-size: 16px; }
  p { margin: 0; font-size: 13px; color: var(--el-text-color-secondary); }
}

.module-checklist {
  .el-checkbox-group {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
}

.module-card {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  padding: 16px 20px;
  transition: all 0.2s;
  cursor: pointer;

  &:hover { border-color: var(--el-color-primary-light-5); }

  &.active {
    border-color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
  }

  .module-checkbox {
    height: auto;
    width: 100%;

    :deep(.el-checkbox__label) {
      width: 100%;
      padding-left: 12px;
    }
  }

  .module-info {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .module-icon {
    width: 52px;
    height: 52px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    flex-shrink: 0;
  }

  .icon-carloan { background: linear-gradient(135deg, #5b5ce2, #4a3db8); }
  .icon-food    { background: linear-gradient(135deg, #f5576c, #e84575); }
  .icon-credit  { background: linear-gradient(135deg, #409EFF, #337ECC); }
  .icon-reading { background: linear-gradient(135deg, #3dc1d3, #2ba3b3); }

  .module-text {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .module-name { font-size: 15px; font-weight: 600; color: var(--el-text-color-primary); }
  .module-desc { font-size: 12px; color: var(--el-text-color-secondary); }
}

.default-module-section {
  .tip {
    margin-left: 12px;
    font-size: 12px;
    color: var(--el-text-color-placeholder);
  }
}

.preview-section {
  .preview-info {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--el-text-color-secondary);
    font-size: 13px;
  }
  .text-warning { color: var(--el-color-warning); }
}

.action-bar {
  margin-top: 24px;
  display: flex;
  gap: 12px;
}
</style>
