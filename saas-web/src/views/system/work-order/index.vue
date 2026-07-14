<template>
  <div class="work-order-page art-full-height">
    <!-- 数据库运维 -->
    <ElCard class="art-card-xs mb-4">
      <template #header>
        <div class="card-header">
          <div class="flex items-center">
            <el-icon class="text-xl text-blue-500 mr-2"><i class="ri-database-2-line"></i></el-icon>
            <span class="font-medium">数据库运维</span>
          </div>
          <el-button
            @click="loadDbStatus"
            :loading="statusLoading"
            icon="ri-refresh-line"
            size="small"
          >
            刷新状态
          </el-button>
        </div>
      </template>

      <!-- 数据库状态概览 -->
      <div class="grid grid-cols-2 gap-4 md:grid-cols-3 mb-5">
        <div class="bg-gray-50 p-3 rounded text-center">
          <div class="text-gray-500 text-sm">用户</div>
          <div class="text-xl font-medium text-purple-600">{{ dbStatus.users ?? '-' }}</div>
        </div>
        <div class="bg-gray-50 p-3 rounded text-center">
          <div class="text-gray-500 text-sm">角色</div>
          <div class="text-xl font-medium text-orange-600">{{ dbStatus.roles ?? '-' }}</div>
        </div>
        <div class="bg-gray-50 p-3 rounded text-center">
          <div class="text-gray-500 text-sm">菜单</div>
          <div class="text-xl font-medium text-cyan-600">{{ dbStatus.menus ?? '-' }}</div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="flex flex-wrap gap-3">
        <el-button
          type="warning"
          icon="ri-arrow-go-forward-line"
          :loading="opLoading === 'migrate'"
          :disabled="!!opLoading"
          @click="handleMigrate"
        >
          数据库迁移
        </el-button>
        <el-button
          type="success"
          icon="ri-seedling-line"
          :loading="opLoading === 'seed'"
          :disabled="!!opLoading"
          @click="handleSeed"
        >
          初始化种子数据
        </el-button>
        <el-button
          type="primary"
          icon="ri-shield-user-line"
          :loading="opLoading === 'sync-roles'"
          :disabled="!!opLoading"
          @click="handleSyncRoles"
        >
          同步角色菜单权限
        </el-button>
        <el-button
          type="danger"
          icon="ri-flashlight-line"
          :loading="opLoading === 'run-all'"
          :disabled="!!opLoading"
          @click="handleRunAll"
        >
          一键全部执行
        </el-button>
      </div>

      <!-- 执行结果 -->
      <div v-if="opResult" class="mt-4">
        <el-alert
          :type="opResult.success ? 'success' : 'error'"
          :title="opResult.message"
          :closable="true"
          show-icon
        />
        <div
          v-if="opResult.output"
          class="mt-2 bg-gray-900 rounded p-3 text-xs text-gray-300 font-mono max-h-[200px] overflow-auto whitespace-pre-wrap"
        >
          {{ opResult.output }}
        </div>
      </div>
    </ElCard>

    <!-- 搜索栏 -->
    <ElCard class="art-card-xs mb-4">
      <el-form :model="searchForm" inline>
        <el-form-item label="工单类型">
          <el-select v-model="searchForm.type" placeholder="请选择工单类型" clearable>
            <el-option label="系统维护工单" value="system_maintenance" />
            <el-option label="数据修正工单" value="data_correction" />
            <el-option label="客户问题工单" value="customer_issue" />
          </el-select>
        </el-form-item>
        <el-form-item label="工单状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="待处理" value="pending" />
            <el-option label="处理中" value="processing" />
            <el-option label="已完成" value="completed" />
            <el-option label="已关闭" value="closed" />
          </el-select>
        </el-form-item>
        <el-form-item label="创建时间">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </ElCard>

    <!-- 表格区域 -->
    <ElCard class="art-table-card">
      <ArtTableHeader :loading="loading" @refresh="handleSearch">
        <template #left>
          <ElSpace wrap>
            <ElButton v-auth="'add'" type="primary" @click="handleAdd">
              <ElIcon><Plus /></ElIcon>
              新建工单
            </ElButton>
          </ElSpace>
        </template>
      </ArtTableHeader>

      <ArtTable
        :loading="loading"
        :data="tableData"
        :columns="tableColumns"
        :pagination="pagination"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      />
    </ElCard>

    <!-- 新建/编辑工单弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="工单标题" prop="title">
          <el-input v-model="formData.title" placeholder="请输入工单标题" />
        </el-form-item>
        <el-form-item label="工单类型" prop="type">
          <el-select v-model="formData.type" placeholder="请选择工单类型">
            <el-option label="系统维护工单" value="system_maintenance" />
            <el-option label="数据修正工单" value="data_correction" />
            <el-option label="客户问题工单" value="customer_issue" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-radio-group v-model="formData.priority">
            <el-radio label="low">低</el-radio>
            <el-radio label="medium">中</el-radio>
            <el-radio label="high">高</el-radio>
            <el-radio label="urgent">紧急</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="工单描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="4"
            placeholder="请输入工单描述"
          />
        </el-form-item>
        <el-form-item label="附件">
          <el-upload
            action="/api/upload"
            :on-success="handleUploadSuccess"
            :file-list="formData.attachments"
          >
            <el-button type="primary">上传附件</el-button>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 指派弹窗 -->
    <el-dialog v-model="assignDialogVisible" title="指派工单" width="400px">
      <el-form :model="assignForm" label-width="80px">
        <el-form-item label="指派人">
          <el-select v-model="assignForm.assigneeId" placeholder="请选择指派人">
            <el-option
              v-for="user in userList"
              :key="user.id"
              :label="user.name"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="assignForm.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="assignDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAssignSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, onMounted, computed, h } from 'vue'
  import { ElMessage, ElMessageBox, ElTag, ElButton, ElSpace } from 'element-plus'
  import { Plus } from '@element-plus/icons-vue'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import {
    getDbOpsStatus,
    runDbMigrate,
    runDbSeed,
    runDbSyncRoles,
    runDbOpsAll
  } from '@/api/db-ops'

  // ==================== 数据库运维 ====================

  // 数据库运维类型定义
  interface DbOpsResponse {
    message: string
    output?: string
    results?: Record<string, unknown>
  }

  interface DbStatusInfo {
    users: { count: number; status: string } | null
    roles: { count: number; status: string } | null
    menus: { count: number; status: string } | null
  }

  interface OpResult {
    success: boolean
    message: string
    output: string
  }

  const statusLoading = ref(false)
  const opLoading = ref('')
  const opResult = ref<OpResult | null>(null)
  const dbStatus = reactive<DbStatusInfo>({
    users: null,
    roles: null,
    menus: null
  })

  const loadDbStatus = async () => {
    statusLoading.value = true
    try {
      const res = (await getDbOpsStatus()) as DbStatusInfo
      Object.assign(dbStatus, res)
    } catch (e) {
      console.error('获取数据库状态失败', e)
    } finally {
      statusLoading.value = false
    }
  }

  const handleMigrate = async () => {
    await ElMessageBox.confirm('确定执行数据库迁移？此操作将应用所有待执行的迁移。', '确认', {
      type: 'warning'
    })
    opLoading.value = 'migrate'
    opResult.value = null
    try {
      const res = (await runDbMigrate()) as DbOpsResponse
      opResult.value = { success: true, message: res.message, output: res.output }
      ElMessage.success(res.message)
      loadDbStatus()
    } catch (e: unknown) {
      opResult.value = {
        success: false,
        message: '操作失败',
        output: e?.response?.data?.message || e.message
      }
      ElMessage.error('迁移失败')
    } finally {
      opLoading.value = ''
    }
  }

  const handleSeed = async () => {
    await ElMessageBox.confirm('确定初始化种子数据？此操作将写入默认基础数据。', '确认', {
      type: 'warning'
    })
    opLoading.value = 'seed'
    opResult.value = null
    try {
      const res = (await runDbSeed()) as DbOpsResponse
      opResult.value = { success: true, message: res.message, output: res.output }
      ElMessage.success(res.message)
      loadDbStatus()
    } catch (e: unknown) {
      opResult.value = {
        success: false,
        message: '操作失败',
        output: e?.response?.data?.message || e.message
      }
      ElMessage.error('种子数据执行失败')
    } finally {
      opLoading.value = ''
    }
  }

  const handleSyncRoles = async () => {
    await ElMessageBox.confirm(
      '确定同步角色菜单权限？此操作将更新所有角色的菜单和按钮权限。',
      '确认',
      {
        type: 'warning'
      }
    )
    opLoading.value = 'sync-roles'
    opResult.value = null
    try {
      const res = (await runDbSyncRoles()) as DbOpsResponse
      opResult.value = { success: true, message: res.message, output: res.output }
      ElMessage.success(res.message)
      loadDbStatus()
    } catch (e: unknown) {
      opResult.value = {
        success: false,
        message: '操作失败',
        output: e?.response?.data?.message || e.message
      }
      ElMessage.error('角色菜单同步失败')
    } finally {
      opLoading.value = ''
    }
  }

  const handleRunAll = async () => {
    await ElMessageBox.confirm(
      '确定一键执行全部操作？将依次执行：数据库迁移 → 种子数据 → 角色菜单同步。',
      '确认',
      { type: 'warning' }
    )
    opLoading.value = 'run-all'
    opResult.value = null
    try {
      const res = (await runDbOpsAll()) as DbOpsResponse
      opResult.value = {
        success: true,
        message: res.message,
        output: JSON.stringify(res.results, null, 2)
      }
      ElMessage.success(res.message)
      loadDbStatus()
    } catch (e: unknown) {
      opResult.value = {
        success: false,
        message: '操作失败',
        output: e?.response?.data?.message || e.message
      }
      ElMessage.error('全部执行失败')
    } finally {
      opLoading.value = ''
    }
  }

  // ==================== 工单管理 ====================

  // 工单类型定义
  interface WorkOrder {
    id: string
    title: string
    type: string
    status: 'pending' | 'processing' | 'completed'
    priority: 'low' | 'medium' | 'high' | 'urgent'
    assignee: string
    creator: string
    createdAt: string
  }

  interface UploadResponse {
    url?: string
    data?: { url?: string }
  }

  // 搜索表单
  const searchForm = reactive({
    type: '',
    status: '',
    dateRange: []
  })

  // 表格数据
  const tableData = ref([
    {
      id: 'WO20260618001',
      title: '系统数据库优化',
      type: 'system_maintenance',
      status: 'pending',
      priority: 'high',
      assignee: '张三',
      creator: '管理员',
      createdAt: '2026-06-18 10:00:00'
    },
    {
      id: 'WO20260618002',
      title: '客户信息修正',
      type: 'data_correction',
      status: 'processing',
      priority: 'medium',
      assignee: '李四',
      creator: '管理员',
      createdAt: '2026-06-18 09:30:00'
    },
    {
      id: 'WO20260618003',
      title: '客户投诉处理',
      type: 'customer_issue',
      status: 'completed',
      priority: 'urgent',
      assignee: '王五',
      creator: '管理员',
      createdAt: '2026-06-17 15:00:00'
    }
  ])

  const loading = ref(false)

  // 分页（ArtTable 标准格式）
  const pagination = reactive({
    current: 1,
    size: 10,
    total: 3
  })

  // 弹窗控制
  const dialogVisible = ref(false)
  const dialogTitle = ref('新建工单')
  const assignDialogVisible = ref(false)

  // 表单数据
  const formData = reactive({
    title: '',
    type: '',
    priority: 'medium',
    description: '',
    attachments: []
  })

  // 指派表单
  const assignForm = reactive({
    assigneeId: '',
    remark: ''
  })

  // 用户列表（模拟数据）
  const userList = ref([
    { id: 1, name: '张三' },
    { id: 2, name: '李四' },
    { id: 3, name: '王五' }
  ])

  // 表格列配置
  const tableColumns = computed(() => [
    { prop: 'id', label: '工单编号', width: 130 },
    { prop: 'title', label: '工单标题', minWidth: 200, showOverflowTooltip: true },
    {
      prop: 'type',
      label: '工单类型',
      width: 120,
      formatter: (row: WorkOrder) =>
        h(ElTag, { type: getTypeTag(row.type) }, () => getTypeLabel(row.type))
    },
    {
      prop: 'status',
      label: '状态',
      width: 100,
      formatter: (row: WorkOrder) =>
        h(ElTag, { type: getStatusTag(row.status) }, () => getStatusLabel(row.status))
    },
    {
      prop: 'priority',
      label: '优先级',
      width: 80,
      formatter: (row: WorkOrder) =>
        h(ElTag, { type: getPriorityTag(row.priority) }, () => getPriorityLabel(row.priority))
    },
    { prop: 'assignee', label: '指派人', width: 100 },
    { prop: 'creator', label: '创建人', width: 100 },
    { prop: 'createdAt', label: '创建时间', width: 170 },
    {
      prop: 'operation',
      label: '操作',
      width: 170,
      fixed: 'right' as const,
      formatter: (row: WorkOrder) =>
        h('div', [
          h(ArtButtonTable, {
            type: 'more' as const,
            label: '指派',
            icon: 'ri:user-shared-line',
            onClick: () => handleAssign(row)
          }),
          h(ArtButtonTable, {
            type: 'edit' as const,
            onClick: () => handleView(row)
          }),
          h(ArtButtonTable, {
            type: 'delete' as const,
            onClick: () => handleDelete(row)
          })
        ])
    }
  ])

  // 表单验证规则
  const formRules = {
    title: [{ required: true, message: '请输入工单标题', trigger: 'blur' }],
    type: [{ required: true, message: '请选择工单类型', trigger: 'change' }],
    priority: [{ required: true, message: '请选择优先级', trigger: 'change' }],
    description: [{ required: true, message: '请输入工单描述', trigger: 'blur' }]
  }

  // 工单类型标签
  type TagType = 'primary' | 'success' | 'warning' | 'info' | 'danger'

  const getTypeTag = (type: string): TagType => {
    const map: Record<string, TagType> = {
      system_maintenance: 'warning',
      data_correction: 'info',
      customer_issue: 'danger'
    }
    return map[type] || 'info'
  }

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      system_maintenance: '系统维护',
      data_correction: '数据修正',
      customer_issue: '客户问题'
    }
    return map[type] || type
  }

  // 状态标签
  const getStatusTag = (status: string) => {
    const map: Record<string, TagType> = {
      pending: 'info',
      processing: 'warning',
      completed: 'success',
      closed: 'info'
    }
    return map[status] || 'info'
  }

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      pending: '待处理',
      processing: '处理中',
      completed: '已完成',
      closed: '已关闭'
    }
    return map[status] || status
  }

  // 优先级标签
  const getPriorityTag = (priority: string) => {
    const map: Record<string, TagType> = {
      low: 'info',
      medium: 'primary',
      high: 'warning',
      urgent: 'danger'
    }
    return map[priority] || 'info'
  }

  const getPriorityLabel = (priority: string) => {
    const map: Record<string, string> = {
      low: '低',
      medium: '中',
      high: '高',
      urgent: '紧急'
    }
    return map[priority] || priority
  }

  // 搜索
  const handleSearch = () => {
    loading.value = true
    // TODO: 调用API获取数据
    setTimeout(() => {
      loading.value = false
    }, 500)
  }

  // 重置
  const handleReset = () => {
    searchForm.type = ''
    searchForm.status = ''
    searchForm.dateRange = []
    handleSearch()
  }

  // 新建工单
  const handleAdd = () => {
    dialogTitle.value = '新建工单'
    dialogVisible.value = true
  }

  // 指派
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleAssign = (row: WorkOrder) => {
    assignDialogVisible.value = true
  }

  // 处理
  const handleProcess = (row: WorkOrder) => {
    ElMessage.success('处理工单: ' + row.title)
  }

  // 查看详情
  const handleView = (row: WorkOrder) => {
    ElMessage.info('查看工单详情: ' + row.id)
  }

  // 删除
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDelete = (row: WorkOrder) => {
    ElMessageBox.confirm('确定要删除该工单吗？', '提示', {
      type: 'warning'
    }).then(() => {
      ElMessage.success('删除成功')
    })
  }

  // 提交表单
  const handleSubmit = () => {
    dialogVisible.value = false
    ElMessage.success('创建成功')
  }

  // 指派提交
  const handleAssignSubmit = () => {
    assignDialogVisible.value = false
    ElMessage.success('指派成功')
  }

  // 上传成功
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleUploadSuccess = (response: UploadResponse) => {
    ElMessage.success('上传成功')
  }

  // 分页
  const handleSizeChange = (val: number) => {
    pagination.size = val
    pagination.current = 1
    handleSearch()
  }

  const handleCurrentChange = (val: number) => {
    pagination.current = val
    handleSearch()
  }

  onMounted(() => {
    loadDbStatus()
    handleSearch()
  })
</script>

<style scoped>
  .work-order-page {
    padding: 20px;
  }

  .search-card {
    margin-bottom: 20px;
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
</style>
