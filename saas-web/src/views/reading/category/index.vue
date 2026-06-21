<template>
  <div class="page-content !mb-5">
    <div class="flex items-center justify-between mb-5">
      <h1 class="text-2xl font-medium">{{ $t('menus.reading.category') }}</h1>
      <ElButton type="primary" @click="openAddDialog" v-auth="'add'">新增分类</ElButton>
    </div>

    <ElTable :data="categoryList" stripe border>
      <ElTableColumn type="index" label="序号" width="60" align="center" />
      <ElTableColumn prop="name" label="分类名称" min-width="200" />
      <ElTableColumn prop="description" label="描述" min-width="300" />
      <ElTableColumn prop="sort" label="排序" width="100" align="center" />
      <ElTableColumn prop="bookCount" label="图书数量" width="120" align="center" />
      <ElTableColumn prop="createTime" label="创建时间" width="180" />
      <ElTableColumn label="操作" width="200" fixed="right" align="center">
        <template #default="{ row }">
          <ElButton size="small" type="primary" link @click="handleEdit(row)" v-auth="'edit'">编辑</ElButton>
          <ElButton size="small" type="danger" link @click="handleDelete(row)" v-auth="'delete'">删除</ElButton>
        </template>
      </ElTableColumn>
    </ElTable>

    <div class="flex justify-center mt-5">
      <ElEmpty v-if="categoryList.length === 0" description="暂无分类数据" />
    </div>

    <!-- 新增/编辑分类弹窗 -->
    <ElDialog v-model="showDialog" :title="isEdit ? '编辑分类' : '新增分类'" width="500px">
      <ElForm :model="formData" label-width="100px">
        <ElFormItem label="分类名称" required>
          <ElInput v-model="formData.name" placeholder="请输入分类名称" />
        </ElFormItem>
        <ElFormItem label="描述">
          <ElInput v-model="formData.description" type="textarea" :rows="3" placeholder="请输入分类描述" />
        </ElFormItem>
        <ElFormItem label="排序">
          <ElInputNumber v-model="formData.sort" :min="0" :max="999" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="showDialog = false">取消</ElButton>
        <ElButton type="primary" @click="handleSave">保存</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'ReadingCategory' })

interface CategoryItem {
  id: number
  name: string
  description: string
  sort: number
  bookCount: number
  createTime: string
}

const showDialog = ref(false)
const isEdit = ref(false)
const editId = ref<number | null>(null)

const categoryList = ref<CategoryItem[]>([
  { id: 1, name: '文学', description: '中外文学经典作品', sort: 1, bookCount: 12, createTime: '2025-01-15 10:00' },
  { id: 2, name: '科技', description: '科技前沿与技术科普', sort: 2, bookCount: 8, createTime: '2025-02-20 14:30' },
  { id: 3, name: '历史', description: '历史人文与社科', sort: 3, bookCount: 15, createTime: '2025-03-10 09:20' },
  { id: 4, name: '经济', description: '经济管理类书籍', sort: 4, bookCount: 6, createTime: '2025-04-05 16:45' }
])

const formData = reactive({
  name: '',
  description: '',
  sort: 0
})

const openAddDialog = () => {
  isEdit.value = false
  editId.value = null
  formData.name = ''
  formData.description = ''
  formData.sort = 0
  showDialog.value = true
}

const handleEdit = (row: CategoryItem) => {
  isEdit.value = true
  editId.value = row.id
  formData.name = row.name
  formData.description = row.description
  formData.sort = row.sort
  showDialog.value = true
}

const handleDelete = (row: CategoryItem) => {
  ElMessageBox.confirm(`确定删除分类"${row.name}"吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    categoryList.value = categoryList.value.filter(item => item.id !== row.id)
    ElMessage.success('删除成功')
  }).catch(() => {})
}

const handleSave = () => {
  showDialog.value = false
  ElMessage.success(isEdit.value ? '编辑成功' : '新增成功')
}
</script>