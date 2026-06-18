<template>
  <div class="work-order-container">
    <!-- 搜索栏 -->
    <el-card class="search-card" shadow="never">
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
    </el-card>

    <!-- 操作栏 -->
    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>工单列表</span>
          <el-button v-auth="'add'" type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新建工单
          </el-button>
        </div>
      </template>

      <!-- 表格 -->
      <el-table :data="tableData" border stripe v-loading="loading">
        <el-table-column prop="id" label="工单编号" width="100" />
        <el-table-column prop="title" label="工单标题" min-width="200" show-overflow-tooltip />
        <el-table-column prop="type" label="工单类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getTypeTag(row.type)">{{ getTypeLabel(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="priority" label="优先级" width="80">
          <template #default="{ row }">
            <el-tag :type="getPriorityTag(row.priority)" size="small">
              {{ getPriorityLabel(row.priority) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="assignee" label="指派人" width="100" />
        <el-table-column prop="creator" label="创建人" width="100" />
        <el-table-column prop="createdAt" label="创建时间" width="170" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button v-auth="'assign'" type="primary" link @click="handleAssign(row)">
              指派
            </el-button>
            <el-button v-auth="'process'" type="success" link @click="handleProcess(row)">
              处理
            </el-button>
            <el-button type="info" link @click="handleView(row)">
              详情
            </el-button>
            <el-button v-auth="'delete'" type="danger" link @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        class="pagination"
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </el-card>

    <!-- 新建/编辑工单弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
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
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

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

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 10,
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

// 表单验证规则
const formRules = {
  title: [{ required: true, message: '请输入工单标题', trigger: 'blur' }],
  type: [{ required: true, message: '请选择工单类型', trigger: 'change' }],
  priority: [{ required: true, message: '请选择优先级', trigger: 'change' }],
  description: [{ required: true, message: '请输入工单描述', trigger: 'blur' }]
}

// 工单类型标签
const getTypeTag = (type: string) => {
  const map: Record<string, string> = {
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
  const map: Record<string, string> = {
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
  const map: Record<string, string> = {
    low: 'info',
    medium: '',
    high: 'warning',
    urgent: 'danger'
  }
  return map[priority] || ''
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
const handleAssign = (row: any) => {
  assignDialogVisible.value = true
}

// 处理
const handleProcess = (row: any) => {
  ElMessage.success('处理工单: ' + row.title)
}

// 查看详情
const handleView = (row: any) => {
  ElMessage.info('查看工单详情: ' + row.id)
}

// 删除
const handleDelete = (row: any) => {
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
const handleUploadSuccess = (response: any) => {
  ElMessage.success('上传成功')
}

// 分页
const handleSizeChange = (val: number) => {
  pagination.pageSize = val
  handleSearch()
}

const handleCurrentChange = (val: number) => {
  pagination.page = val
  handleSearch()
}

onMounted(() => {
  handleSearch()
})
</script>

<style scoped>
.work-order-container {
  padding: 20px;
}

.search-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
