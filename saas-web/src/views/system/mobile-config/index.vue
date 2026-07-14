<template>
  <div class="mobile-config-page art-full-height">
    <div class="page-hero">
      <div class="page-hero__icon">
        <i class="ri-smartphone-line"></i>
      </div>
      <div class="page-hero__content">
        <div class="page-hero__eyebrow">Mobile Configuration</div>
        <h2>移动端模块配置</h2>
        <p>管理移动端 App 中显示的业务模块，支持租户/角色/用户三级配置</p>
      </div>
    </div>

    <ElTabs v-model="activeTab" class="mt-3" @tab-change="handleTabChange">
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
        class="mb-4"
      />
      <ElCard class="art-card-xs">
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
            <ElButton type="primary" @click="saveTenantConfig" :loading="tenantSaving"
              >保存配置</ElButton
            >
          </ElFormItem>
        </ElForm>
      </ElCard>
    </div>

    <!-- 角色级配置 -->
    <div v-if="activeTab === 'role'">
      <ElAlert
        title="角色级配置会覆盖租户级默认配置，为不同角色设置不同的移动端模块"
        type="info"
        :closable="false"
        show-icon
        class="mb-4"
      />
      <ElCard class="art-table-card">
        <ArtTableHeader :loading="roleLoading" @refresh="loadRoles">
          <template #left>
            <div class="table-title">
              <span>角色列表</span>
              <ElTag effect="plain" size="small">共 {{ roleTotal }} 条</ElTag>
            </div>
          </template>
        </ArtTableHeader>
        <ArtTable
          :loading="roleLoading"
          :data="roleList"
          :columns="roleColumns"
          :pagination="{ current: rolePage, size: rolePageSize, total: roleTotal }"
          @pagination:size-change="
            (v: number) => {
              rolePageSize = v
              loadRoles()
            }
          "
          @pagination:current-change="
            (v: number) => {
              rolePage = v
              loadRoles()
            }
          "
        >
          <template #operation="{ row }">
            <ElButton size="small" type="primary" link @click="openRoleConfig(row)"
              >配置模块</ElButton
            >
          </template>
        </ArtTable>
      </ElCard>
    </div>

    <!-- 用户级配置 -->
    <div v-if="activeTab === 'user'">
      <ElAlert
        title="用户级配置优先级最高，会覆盖角色和租户级的设置"
        type="info"
        :closable="false"
        show-icon
        class="mb-4"
      />
      <ArtSearchBar
        v-model="userSearchModel"
        :items="userSearchItems"
        :show-expand="false"
        @search="loadUsers"
        @reset="resetUserSearch"
      />
      <ElCard class="art-table-card mt-3">
        <ArtTableHeader :loading="userLoading" @refresh="loadUsers">
          <template #left>
            <div class="table-title">
              <span>用户列表</span>
              <ElTag effect="plain" size="small">共 {{ userTotal }} 条</ElTag>
            </div>
          </template>
        </ArtTableHeader>
        <ArtTable
          :loading="userLoading"
          :data="userList"
          :columns="userColumns"
          :pagination="{ current: userPage, size: userPageSize, total: userTotal }"
          @pagination:size-change="
            (v: number) => {
              userPageSize = v
              loadUsers()
            }
          "
          @pagination:current-change="
            (v: number) => {
              userPage = v
              loadUsers()
            }
          "
        >
          <template #operation="{ row }">
            <ElButton size="small" type="primary" link @click="openUserConfig(row)"
              >配置模块</ElButton
            >
          </template>
        </ArtTable>
      </ElCard>
    </div>

    <!-- 角色/用户配置弹窗 -->
    <ElDialog
      v-model="showRoleDialog"
      :title="dialogTitle"
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
  import type { ColumnOption } from '@/types/component'
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

  interface RoleItem {
    id: number
    name: string
    code: string
    description?: string
  }

  interface UserItem {
    id: number
    username: string
    nickname?: string
    email?: string
  }

  interface RoleListResponse {
    items: RoleItem[]
    total: number
  }

  interface UserListResponse {
    items: UserItem[]
    total: number
  }

  interface UserListParams {
    page: number
    pageSize: number
    keyword?: string
  }

  interface ResetConfigData {
    enabled?: string[]
    mobileMultiModule?: boolean
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
  const roleList = ref<RoleItem[]>([])
  const roleLoading = ref(false)
  const rolePage = ref(1)
  const rolePageSize = ref(20)
  const roleTotal = ref(0)

  const roleColumns: ColumnOption[] = [
    { type: 'index', label: '序号', width: 60, align: 'center' },
    { prop: 'name', label: '角色名称', minWidth: 150 },
    { prop: 'code', label: '角色编码', width: 150 },
    { prop: 'description', label: '描述', minWidth: 200, showOverflowTooltip: true },
    {
      prop: 'operation',
      label: '操作',
      width: 150,
      fixed: 'right',
      align: 'center',
      useSlot: true
    }
  ]

  const loadRoles = async () => {
    roleLoading.value = true
    try {
      const res = (await fetchGetRoleList({
        current: rolePage.value,
        size: rolePageSize.value
      })) as unknown as RoleListResponse
      roleList.value = res?.items || []
      roleTotal.value = res?.total || 0
    } catch {
      // 错误已由拦截器处理
    } finally {
      roleLoading.value = false
    }
  }

  // ─── 用户列表 ───
  const userList = ref<UserItem[]>([])
  const userLoading = ref(false)
  const userSearchModel = reactive({ keyword: '' })
  const userPage = ref(1)
  const userPageSize = ref(20)
  const userTotal = ref(0)

  const userSearchItems = [
    {
      key: 'keyword',
      label: '关键字',
      type: 'input' as const,
      props: { placeholder: '搜索用户名/昵称', clearable: true }
    }
  ]

  const userColumns: ColumnOption[] = [
    { type: 'index', label: '序号', width: 60, align: 'center' },
    { prop: 'username', label: '用户名', width: 120 },
    { prop: 'nickname', label: '昵称', minWidth: 120 },
    { prop: 'email', label: '邮箱', minWidth: 180, showOverflowTooltip: true },
    {
      prop: 'operation',
      label: '操作',
      width: 150,
      fixed: 'right',
      align: 'center',
      useSlot: true
    }
  ]

  const loadUsers = async () => {
    userLoading.value = true
    userPage.value = 1
    try {
      const params: UserListParams = { page: userPage.value, pageSize: userPageSize.value }
      if (userSearchModel.keyword) params.keyword = userSearchModel.keyword
      const res = (await fetchGetUserList(params)) as unknown as UserListResponse
      userList.value = res?.items || []
      userTotal.value = res?.total || 0
    } catch {
      // 错误已由拦截器处理
    } finally {
      userLoading.value = false
    }
  }

  const resetUserSearch = () => {
    userSearchModel.keyword = ''
    loadUsers()
  }

  // ─── 角色/用户配置弹窗 ───
  const showRoleDialog = ref(false)
  const currentRole = ref<RoleItem | null>(null)
  const currentUser = ref<UserItem | null>(null)
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

  const dialogTitle = computed(() => {
    if (currentRole.value) return `角色配置 - ${currentRole.value.name || ''}`
    if (currentUser.value)
      return `用户配置 - ${currentUser.value.nickname || currentUser.value.username || ''}`
    return '配置模块'
  })

  const openRoleConfig = async (row: RoleItem) => {
    currentRole.value = row
    currentUser.value = null
    await loadEntityConfig('role', row.id)
    showRoleDialog.value = true
  }

  const openUserConfig = async (row: UserItem) => {
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
        const data = res as ResetConfigData
        entitySelectedModules.value = data?.enabled || []
        entityMultiModule.value = data?.mobileMultiModule ?? false
        ElMessage.success('已恢复为默认配置')
      } else if (currentUser.value) {
        const res = await fetchResetUserMobileConfig(currentUser.value.id)
        const data = res as ResetConfigData
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

<style scoped>
  .mobile-config-page {
    display: flex;
    flex-direction: column;
  }

  .page-hero {
    display: flex;
    gap: 14px;
    align-items: center;
    padding: 18px 20px;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 12px;
    box-shadow: var(--el-box-shadow-lighter);
  }

  .page-hero__icon {
    display: flex;
    flex: 0 0 46px;
    align-items: center;
    justify-content: center;
    width: 46px;
    height: 46px;
    font-size: 24px;
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    border-radius: 12px;
  }

  .page-hero__content {
    flex: 1;
    min-width: 0;
  }

  .page-hero__eyebrow {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .page-hero__content h2 {
    margin: 4px 0 2px;
    font-size: 18px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .page-hero__content p {
    margin: 0;
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }

  .table-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 15px;
    font-weight: 500;
    color: var(--el-text-color-primary);
  }
</style>
