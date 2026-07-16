<template>
  <div class="food-category-page">
    <ArtSearchBar
      v-model="searchForm"
      :items="searchItems"
      :span="8"
      :show-expand="false"
      @search="handleSearch"
      @reset="handleReset"
    />

    <ElCard class="art-table-card">
      <ArtTableHeader :loading="isLoading" @refresh="loadData" layout="refresh,size,fullscreen,columns,settings">
        <template #left>
          <ElButton type="primary" @click="openAddDialog" v-auth="'add'">新增分类</ElButton>
        </template>
      </ArtTableHeader>

      <ArtTable :loading="isLoading" :data="tableData" :columns="columns" />

      <div class="flex justify-center mt-4">
        <ElPagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </ElCard>

    <!-- 新增/编辑弹窗 -->
    <ElDialog v-model="showDialog" :title="isEdit ? '编辑分类' : '新增分类'" width="500px">
      <ElForm :model="formData" label-width="100px">
        <ElFormItem label="分类名称" required>
          <ElInput v-model="formData.name" placeholder="请输入分类名称" />
        </ElFormItem>
        <ElFormItem label="图标">
          <ElInput v-model="formData.icon" placeholder="请输入图标名称" />
        </ElFormItem>
        <ElFormItem label="排序">
          <ElInputNumber v-model="formData.sortOrder" :min="0" :max="999" />
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
  import { ref, reactive, onMounted } from 'vue'
  import { getFoodCategories, createFoodCategory, updateFoodCategory, deleteFoodCategory } from '@/api/food'
  import { ElMessage, ElMessageBox } from 'element-plus'

  defineOptions({ name: 'FoodCategory' })

  const isLoading = ref(false)
  const saving = ref(false)
  const showDialog = ref(false)
  const isEdit = ref(false)
  const editId = ref(0)
  const tableData = ref<any[]>([])

  const searchForm = reactive({ keyword: '' })
  const searchItems = [{ label: '关键词', key: 'keyword', type: 'input' as const, placeholder: '分类名称' }]

  const pagination = reactive({ page: 1, pageSize: 10, total: 0 })
  const formData = reactive({ name: '', icon: '', sortOrder: 0 })

  const columns = [
    { prop: 'id', label: 'ID', width: 80 },
    { prop: 'name', label: '分类名称' },
    { prop: 'icon', label: '图标' },
    { prop: '_count.dishes', label: '菜品数量', width: 100 },
    { prop: 'sortOrder', label: '排序', width: 80 },
    { prop: 'isActive', label: '状态', width: 80 },
    { prop: 'actions', label: '操作', width: 150 }
  ]

  const loadData = async () => {
    isLoading.value = true
    try {
      const res = await getFoodCategories({ ...searchForm, page: pagination.page, pageSize: pagination.pageSize })
      tableData.value = res.data?.list || []
      pagination.total = res.data?.total || 0
    } finally {
      isLoading.value = false
    }
  }

  const handleSearch = () => { pagination.page = 1; loadData() }
  const handleReset = () => { searchForm.keyword = ''; handleSearch() }

  const openAddDialog = () => {
    isEdit.value = false
    formData.name = ''
    formData.icon = ''
    formData.sortOrder = 0
    showDialog.value = true
  }

  const handleSave = async () => {
    if (!formData.name) return ElMessage.warning('请输入分类名称')
    saving.value = true
    try {
      if (isEdit.value) {
        await updateFoodCategory(editId.value, formData)
      } else {
        await createFoodCategory(formData)
      }
      showDialog.value = false
      loadData()
    } finally {
      saving.value = false
    }
  }

  onMounted(loadData)
</script>
