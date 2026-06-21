<template>
  <div class="page-content !mb-5">
    <div class="flex items-center justify-between mb-5">
      <h1 class="text-2xl font-medium">{{ $t('menus.reading.category') }}</h1>
      <ElButton type="primary" @click="openAddDialog" v-auth="'add'">新增分类</ElButton>
    </div>

    <ElTable :data="categoryList" stripe border v-loading="isLoading">
      <ElTableColumn type="index" label="序号" width="60" align="center" />
      <ElTableColumn prop="name" label="分类名称" min-width="200" />
      <ElTableColumn prop="sort" label="排序" width="100" align="center" />
      <ElTableColumn prop="status" label="状态" width="100" align="center">
        <template #default="{ row }">
          <ElTag :type="row.status === 1 ? 'success' : 'info'">
            {{ row.status === 1 ? '启用' : '禁用' }}
          </ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn prop="createdAt" label="创建时间" width="180">
        <template #default="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="操作" width="200" fixed="right" align="center">
        <template #default="{ row }">
          <ElButton size="small" type="primary" link @click="handleEdit(row)" v-auth="'edit'">编辑</ElButton>
          <ElButton size="small" type="danger" link @click="handleDelete(row)" v-auth="'delete'">删除</ElButton>
        </template>
      </ElTableColumn>
    </ElTable>

    <div class="flex justify-center mt-5">
      <ElEmpty v-if="categoryList.length === 0 && !isLoading" description="暂无分类数据" />
    </div>

    <!-- 新增/编辑分类弹窗 -->
    <ElDialog v-model="showDialog" :title="isEdit ? '编辑分类' : '新增分类'" width="500px">
      <ElForm :model="formData" label-width="100px">
        <ElFormItem label="分类名称" required>
          <ElInput v-model="formData.name" placeholder="请输入分类名称" />
        </ElFormItem>
        <ElFormItem label="父分类">
          <ElSelect v-model="formData.parentId" placeholder="请选择父分类（可选）" clearable class="w-full">
            <ElOption v-for="cat in categoryList" :key="cat.id" :label="cat.name" :value="cat.id" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="排序">
          <ElInputNumber v-model="formData.sort" :min="0" :max="999" />
        </ElFormItem>
        <ElFormItem label="状态" v-if="isEdit">
          <ElRadioGroup v-model="formData.status">
            <ElRadio :value="1">启用</ElRadio>
            <ElRadio :value="0">禁用</ElRadio>
          </ElRadioGroup>
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="showDialog = false">取消</ElButton>
        <ElButton type="primary" @click="handleSave" :loading="saving">保存</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
import { getBookCategories, createBookCategory, updateBookCategory, deleteBookCategory } from '@/api/reading'
import { ElMessage, ElMessageBox } from 'element-plus'

defineOptions({ name: 'ReadingCategory' })

const showDialog = ref(false)
const isEdit = ref(false)
const editId = ref<number | null>(null)
const isLoading = ref(false)
const saving = ref(false)

const categoryList = ref<any[]>([])

const formData = reactive({
  name: '',
  parentId: null as number | null,
  sort: 0,
  status: 1
})

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN')
}

// 加载分类列表
const loadCategories = async () => {
  isLoading.value = true
  try {
    const res = await getBookCategories()
    categoryList.value = res.data || []
  } catch (error) {
    console.error('加载分类失败', error)
  } finally {
    isLoading.value = false
  }
}

const openAddDialog = () => {
  isEdit.value = false
  editId.value = null
  Object.assign(formData, {
    name: '',
    parentId: null,
    sort: 0,
    status: 1
  })
  showDialog.value = true
}

const handleEdit = (row: any) => {
  isEdit.value = true
  editId.value = row.id
  Object.assign(formData, {
    name: row.name,
    parentId: row.parentId || null,
    sort: row.sort || 0,
    status: row.status ?? 1
  })
  showDialog.value = true
}

const handleDelete = (row: any) => {
  ElMessageBox.confirm(`确定删除分类"${row.name}"吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deleteBookCategory(row.id)
      ElMessage.success('删除成功')
      loadCategories()
    } catch (error: any) {
      ElMessage.error(error?.response?.data?.message || '删除失败')
    }
  }).catch(() => {})
}

const handleSave = async () => {
  if (!formData.name) {
    ElMessage.warning('请填写分类名称')
    return
  }

  saving.value = true
  try {
    if (isEdit.value && editId.value) {
      await updateBookCategory(editId.value, formData)
      ElMessage.success('编辑成功')
    } else {
      await createBookCategory(formData)
      ElMessage.success('新增成功')
    }
    showDialog.value = false
    loadCategories()
  } catch (error) {
    ElMessage.error(isEdit.value ? '编辑失败' : '新增失败')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadCategories()
})
</script>
