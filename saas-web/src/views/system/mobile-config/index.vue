<template>
  <div class="page-content !mb-5">
    <div class="mb-5">
      <h1 class="text-2xl font-medium">移动端模块配置</h1>
      <p class="text-gray-400 text-sm mt-1">管理移动端 App 中显示的业务模块，支持租户/角色/用户三级配置</p>
    </div>

    <ElTabs v-model="activeTab" @tab-change="handleTabChange">
      <ElTabPane label="租户配置" name="tenant" />
      <ElTabPane label="角色配置" name="role" />
      <ElTabPane label="用户配置" name="user" />
    </ElTabs>

    <!-- 租户级配置 -->
    <div v-if="activeTab === 'tenant'" v-loading="tenantLoading">
      <ElAlert
        title="租户级配置为全局默认配置，所有未单独设置的角色和用户将遵循此配置"
        type="info"
        :closable="false"
        show-icon
        class="mb-5"
      />
      <ElForm label-width="120px">
        <ElFormItem label="多业务模块">
          <ElSwitch
            :model-value="tenantConfig.isMultiModule"
            @update:model-value="onTenantMultiModuleChange"
          />
          <span class="text-gray-400 text-xs ml-2">开启后，移动端可选择多个业务模块</span>
        </ElFormItem>
        <ElFormItem label="可用模块">
          <ElCheckboxGroup v-model="tenantSelectedModules" class="flex flex-wrap gap-3">
            <ElCheckbox
              v-for="m in tenantAvailableModules"
              :key="m.key"
              :value="m.key"
              :border="true"
              class="!mr-0"
            >
              <div class="flex items-center gap-2 px-1">
                <span class="text-lg">{{ m.icon }}</span>
                <div>
                  <div class="text-sm font-medium">{{ m.name }}</div>
                  <div class="text-xs text-gray-400">{{ m.desc }}</div>
                </div>
              </div>
            </ElCheckbox>
          </ElCheckboxGroup>
          <div v-if="tenantAvailableModules.length === 0" class="text-gray-400 text-sm">
            暂无可用模块
          </div>
        </ElFormItem>
        <ElFormItem>
          <ElButton type="primary" @click="saveTenantConfig" :loading="tenantSaving">保存配置</ElButton>
        </ElFormItem>
      </ElForm>
    </div>

    <!-- 角色级配置 -->
    <div v-if="activeTab === 'role'">
      <ElAlert
        title="角色级配置会覆盖租户级默认配置，为不同角色设置不同的移动端模块"
        type="info"
        :closable="false"
        show-icon
        class="mb-5"
      />
      <ElTable :data="roleList" border stripe v-loading="roleLoading" element-loading-text="加载中...">
        <ElTableColumn type="index" label="序号" width="60" align="center" />
        <ElTableColumn prop="name" label="角色名称" min-width="150" />
        <ElTableColumn prop="code" label="角色编码" width="150" />
        <ElTableColumn prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <ElTableColumn label="操作" width="150" fixed="right" align="center">
          <template #default="{ row }">
            <ElButton size="small" type="primary" link @click="openRoleConfig(row)">配置模块</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
      <div class="flex justify-center mt-5">
        <ElPagination
          v-model:current-page="rolePage"
          v-model:page-size="rolePageSize"
          :total="roleTotal"
          background
          layout="prev, pager, next"
          @current-change="loadRoles"
        />
      </div>
    </div>

    <!-- 用户级配置 -->
    <div v-if="activeTab === 'user'">
      <ElAlert
        title="用户级配置优先级最高，会覆盖角色和租户级的设置"
        type="info"
        :closable="false"
        show-icon
        class="mb-5"
      />
      <ElRow :gutter="10" class="mb-4">
        <ElCol :span="8">
          <ElInput v-model="userSearch" placeholder="搜索用户名/昵称" clearable @keyup.enter="loadUsers" />
        </ElCol>
        <ElCol :span="4">
          <ElButton type="primary" @click="loadUsers">搜索</ElButton>
        </ElCol>
      </ElRow>
      <ElTable :data="userList" border stripe v-loading="userLoading" element-loading-text="加载中...">
        <ElTableColumn type="index" label="序号" width="60" align="center" />
        <ElTableColumn prop="username" label="用户名" width="120" />
        <ElTableColumn prop="nickname" label="昵称" min-width="120" />
        <ElTableColumn prop="email" label="邮箱" min-width="180" show-overflow-tooltip />
        <ElTableColumn label="操作" width="150" fixed="right" align="center">
          <template #default="{ row }">
            <ElButton size="small" type="primary" link @click="openUserConfig(row)">配置模块</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
      <div class="flex justify-center mt-5">
        <ElPagination
          v-model:current-page="userPage"
          v-model:page-size="userPageSize"
          :total="userTotal"
          background
          layout="prev, pager, next"
          @current-change="loadUsers"
        />
      </div>
    </div>

    <!-- 角色配置弹窗 -->
    <ElDialog
      v-model="showRoleDialog"
      :title="`角色配置 - ${currentRole?.name || ''}`"
      width="650px"
      :close-on-click-modal="false"
    >
      <div v-loading="entityConfigLoading">
        <ElAlert
          v-if="entityConfigData.roles && entityConfigData.roles.length > 0"
          title="注意：该用户同时拥有以下角色，保存后将覆盖所有相关角色的移动端配置"
          type="warning"
          :closable="false"
          show-icon
          class="mb-4"
        />
        <ElForm label-width="110px">
          <ElFormItem label="多业务模块">
            <ElSwitch v-model="entityMultiModule" />
            <span class="text-gray-400 text-xs ml-2">开启后，可同时查看多个业务模块</span>
          </ElFormItem>
          <ElFormItem label="可选模块">
            <ElCheckboxGroup v-model="entitySelectedModules" class="flex flex-wrap gap-3">
              <ElCheckbox
                v-for="m in entityAvailableModules"
                :key="m.key"
                :value="m.key"
                :border="true"
                class="!mr-0"
              >
                <div class="flex items-center gap-2 px-1">
                  <span class="text-lg">{{ m.icon }}</span>
                  <div>
                    <div class="text-sm font-medium">{{ m.name }}</div>
                    <div class="text-xs text-gray-400">{{ m.desc }}</div>
                  </div>
                </div>
              </ElCheckbox>
            </ElCheckboxGroup>
          </ElFormItem>
        </ElForm>
      </div>
      <template #footer>
        <ElButton @click="resetEntityConfig" :loading="entityResetLoading" type="warning" plain>
          {{ activeTab === 'role' ? '恢复默认' : '恢复默认（跟随角色/租户）' }}
        </ElButton>
        <ElButton @click="showRoleDialog = false">取消</ElButton>
        <ElButton type="primary" @click="saveEntityConfig" :loading="entitySaving">保存</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import type { TabPaneName } from 'element-plus'
import {
  fetchGetMobileConfig,
  fetchUpdateMobileConfig,
  fetchGetRoleMobileConfig,
  fetchUpdateRoleMobileConfig,
  fetchResetRoleMobileConfig,
  fetchGetUserMobileConfig,
  fetchUpdateUserMobileConfig,
  fetchResetUserMobileConfig,
  fetchGetRoleList,
  fetchGetUserList
} from '@/api/system-manage'

defineOptions({ name: 'MobileConfig' })

interface MobileModule {
  key: string
  name: string
  icon: string
  desc: string
}

interface EntityConfig {
  available: MobileModule[]
  enabled: string[]
  defaultModule: string | null
  mobileMultiModule: boolean
  isMultiModule: boolean
  roles?: { roleId: number; roleName: string }[]
}

// ─── Tabs ───
const activeTab = ref('tenant')

const handleTabChange = (tab: TabPaneName) => {
  const tabName = String(tab)
  if (tabName === 'tenant') loadTenantConfig()
  else if (tabName === 'role') loadRoles()
  else if (tabName === 'user') loadUsers()
}

// ─── 租户级配置 ───
const tenantLoading = ref(false)
const tenantSaving = ref(false)
const tenantAvailableModules = ref<MobileModule[]>([])
const tenantSelectedModules = ref<string[]>([])
const tenantConfig = reactive({
  isMultiModule: false,
  defaultModule: null as string | null
})

const loadTenantConfig = async () => {
  tenantLoading.value = true
  try {
    const res = await fetchGetMobileConfig()
    tenantAvailableModules.value = res.available || []
    tenantSelectedModules.value = res.enabled || []
    tenantConfig.isMultiModule = res.isMultiModule
    tenantConfig.defaultModule = res.defaultModule
  } catch {
    // 错误已由拦截器处理
  } finally {
    tenantLoading.value = false
  }
}

const onTenantMultiModuleChange = (val: string | number | boolean) => {
  const enabled = Boolean(val)
  tenantConfig.isMultiModule = enabled
  if (!enabled && tenantSelectedModules.value.length > 1) {
    tenantSelectedModules.value = [tenantSelectedModules.value[0]]
  }
}

const saveTenantConfig = async () => {
  tenantSaving.value = true
  try {
    await fetchUpdateMobileConfig({
      mobileModules: tenantSelectedModules.value,
      defaultMobileModule: tenantSelectedModules.value[0] || undefined
    })
    ElMessage.success('租户配置保存成功')
  } catch {
    // 错误已由拦截器处理
  } finally {
    tenantSaving.value = false
  }
}

// ─── 角色列表 ───
const roleList = ref<any[]>([])
const roleLoading = ref(false)
const rolePage = ref(1)
const rolePageSize = ref(20)
const roleTotal = ref(0)

const loadRoles = async () => {
  roleLoading.value = true
  try {
    const res = (await fetchGetRoleList({ current: rolePage.value, size: rolePageSize.value })) as any
    roleList.value = res?.items || []
    roleTotal.value = res?.total || 0
  } catch {
    // 错误已由拦截器处理
  } finally {
    roleLoading.value = false
  }
}

// ─── 用户列表 ───
const userList = ref<any[]>([])
const userLoading = ref(false)
const userSearch = ref('')
const userPage = ref(1)
const userPageSize = ref(20)
const userTotal = ref(0)

const loadUsers = async () => {
  userLoading.value = true
  userPage.value = 1
  try {
    const params: any = { page: userPage.value, pageSize: userPageSize.value }
    if (userSearch.value) params.keyword = userSearch.value
    const res = (await fetchGetUserList(params)) as any
    userList.value = res?.items || []
    userTotal.value = res?.total || 0
  } catch {
    // 错误已由拦截器处理
  } finally {
    userLoading.value = false
  }
}

// ─── 角色/用户配置弹窗 ───
const showRoleDialog = ref(false)
const currentRole = ref<any>(null)
const currentUser = ref<any>(null)
const entityConfigData = ref<EntityConfig>({
  available: [],
  enabled: [],
  defaultModule: null,
  mobileMultiModule: false,
  isMultiModule: false
})
const entityAvailableModules = ref<MobileModule[]>([])
const entitySelectedModules = ref<string[]>([])
const entityMultiModule = ref(false)
const entityConfigLoading = ref(false)
const entitySaving = ref(false)
const entityResetLoading = ref(false)

const openRoleConfig = async (row: any) => {
  currentRole.value = row
  currentUser.value = null
  await loadEntityConfig('role', row.id)
  showRoleDialog.value = true
}

const openUserConfig = async (row: any) => {
  currentUser.value = row
  currentRole.value = null
  await loadEntityConfig('user', row.id)
  showRoleDialog.value = true
}

const loadEntityConfig = async (type: 'role' | 'user', id: number) => {
  entityConfigLoading.value = true
  try {
    const fetchFn = type === 'role' ? fetchGetRoleMobileConfig : fetchGetUserMobileConfig
    const res = await fetchFn(id)
    entityConfigData.value = res as EntityConfig
    entityAvailableModules.value = res.available || []
    entitySelectedModules.value = res.enabled || []
    entityMultiModule.value = res.mobileMultiModule
  } catch {
    // 错误已由拦截器处理
  } finally {
    entityConfigLoading.value = false
  }
}

const saveEntityConfig = async () => {
  entitySaving.value = true
  try {
    const params = {
      mobileModules: entitySelectedModules.value,
      mobileMultiModule: entityMultiModule.value,
      defaultMobileModule: entitySelectedModules.value[0] || undefined
    }
    if (currentRole.value) {
      await fetchUpdateRoleMobileConfig(currentRole.value.id, params)
    } else if (currentUser.value) {
      await fetchUpdateUserMobileConfig(currentUser.value.id, params)
    }
    ElMessage.success('配置保存成功')
    showRoleDialog.value = false
  } catch {
    // 错误已由拦截器处理
  } finally {
    entitySaving.value = false
  }
}

const resetEntityConfig = async () => {
  entityResetLoading.value = true
  try {
    if (currentRole.value) {
      const res = await fetchResetRoleMobileConfig(currentRole.value.id)
      const data = res as any
      entitySelectedModules.value = data?.enabled || []
      entityMultiModule.value = data?.mobileMultiModule ?? false
      ElMessage.success('已恢复为默认配置')
    } else if (currentUser.value) {
      const res = await fetchResetUserMobileConfig(currentUser.value.id)
      const data = res as any
      entitySelectedModules.value = data?.enabled || []
      entityMultiModule.value = data?.mobileMultiModule ?? false
      ElMessage.success('已恢复为默认配置（跟随角色/租户）')
    }
  } catch {
    // 错误已由拦截器处理
  } finally {
    entityResetLoading.value = false
  }
}

onMounted(() => {
  loadTenantConfig()
})
</script>
