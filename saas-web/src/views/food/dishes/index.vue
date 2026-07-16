<template>
  <div class="food-dishes-page">
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
          <ElButton type="primary" @click="openAddDialog" v-auth="'add'">新增菜品</ElButton>
        </template>
      </ArtTableHeader>

      <ArtTable :loading="isLoading" :data="tableData" :columns="columns">
        <template #imageUrl="{ row }">
          <ElImage v-if="row.imageUrl" :src="row.imageUrl" style="width: 60px; height: 60px; border-radius: 8px" fit="cover" />
          <span v-else class="text-gray-400">暂无图片</span>
        </template>
        <template #price="{ row }">
          <span class="text-red-500 font-bold">¥{{ row.price }}</span>
          <span v-if="row.originalPrice" class="text-gray-400 line-through ml-2">¥{{ row.originalPrice }}</span>
        </template>
        <template #isActive="{ row }">
          <ElTag :type="row.isActive ? 'success' : 'info'">{{ row.isActive ? '上架' : '下架' }}</ElTag>
        </template>
        <template #actions="{ row }">
          <ElButton type="primary" link @click="openEditDialog(row)">编辑</ElButton>
          <ElButton type="danger" link @click="handleDelete(row)">删除</ElButton>
        </template>
      </ArtTable>

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
    <ElDialog v-model="showDialog" :title="isEdit ? '编辑菜品' : '新增菜品'" width="600px">
      <ElForm :model="formData" label-width="100px">
        <ElFormItem label="菜品名称" required>
          <ElInput v-model="formData.name" placeholder="请输入菜品名称" />
        </ElFormItem>
        <ElFormItem label="分类" required>
          <ElSelect v-model="formData.categoryId" placeholder="请选择分类" class="w-full">
            <ElOption v-for="cat in categoryOptions" :key="cat.id" :label="cat.name" :value="cat.id" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="价格" required>
          <ElInputNumber v-model="formData.price" :min="0" :precision="2" />
        </ElFormItem>
        <ElFormItem label="原价">
          <ElInputNumber v-model="formData.originalPrice" :min="0" :precision="2" />
        </ElFormItem>
        <ElFormItem label="描述">
          <ElInput v-model="formData.description" type="textarea" :rows="3" placeholder="请输入菜品描述" />
        </ElFormItem>
        <ElFormItem label="图片URL">
          <ElInput v-model="formData.imageUrl" placeholder="请输入图片URL" />
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
  import { getFoodDishes, createFoodDish, updateFoodDish, deleteFoodDish, getFoodCategories } from '@/api/food'
  import { ElMessage, ElMessageBox } from 'element-plus'

  defineOptions({ name: 'FoodDishes' })

  const isLoading = ref(false)
  const saving = ref(false)
  const showDialog = ref(false)
  const isEdit = ref(false)
  const editId = ref(0)
  const tableData = ref<any[]>([])
  const categoryOptions = ref<any[]>([])

  const searchForm = reactive({ keyword: '', categoryId: undefined as number | undefined })
  const searchItems = [
    { label: '关键词', key: 'keyword', type: 'input' as const, placeholder: '菜品名称' },
    { label: '分类', key: 'categoryId', type: 'select' as const, options: [] as any[] }
  ]

  const pagination = reactive({ page: 1, pageSize: 10, total: 0 })
  const formData = reactive({
    name: '',
    description: '',
    price: 0,
    originalPrice: undefined as number | undefined,
    imageUrl: '',
    categoryId: undefined as number | undefined,
    sortOrder: 0
  })

  const columns = [
    { prop: 'id', label: 'ID', width: 80 },
    { prop: 'imageUrl', label: '图片', width: 80, useSlot: true },
    { prop: 'name', label: '菜品名称' },
    { prop: 'category.name', label: '分类', width: 100 },
    { prop: 'price', label: '价格', width: 120, useSlot: true },
    { prop: 'salesCount', label: '销量', width: 80 },
    { prop: 'isActive', label: '状态', width: 80, useSlot: true },
    { prop: 'sortOrder', label: '排序', width: 80 },
    { prop: 'actions', label: '操作', width: 150, useSlot: true }
  ]

  const loadCategories = async () => {
    const res = await getFoodCategories({ pageSize: 100 })
    categoryOptions.value = res.data?.list || []
    searchItems[1].options = categoryOptions.value.map((c: any) => ({ label: c.name, value: c.id }))
  }

  const loadData = async () => {
    isLoading.value = true
    try {
      const res = await getFoodDishes({ ...searchForm, page: pagination.page, pageSize: pagination.pageSize })
      tableData.value = res.data?.list || []
      pagination.total = res.data?.total || 0
    } finally {
      isLoading.value = false
    }
  }

  const handleSearch = () => { pagination.page = 1; loadData() }
  const handleReset = () => { searchForm.keyword = ''; searchForm.categoryId = undefined; handleSearch() }

  const openAddDialog = () => {
    isEdit.value = false
    Object.assign(formData, { name: '', description: '', price: 0, originalPrice: undefined, imageUrl: '', categoryId: undefined, sortOrder: 0 })
    showDialog.value = true
  }

  const openEditDialog = (row: any) => {
    isEdit.value = true
    editId.value = row.id
    Object.assign(formData, {
      name: row.name,
      description: row.description,
      price: Number(row.price),
      originalPrice: row.originalPrice ? Number(row.originalPrice) : undefined,
      imageUrl: row.imageUrl,
      categoryId: row.categoryId,
      sortOrder: row.sortOrder
    })
    showDialog.value = true
  }

  const handleSave = async () => {
    if (!formData.name) return ElMessage.warning('请输入菜品名称')
    if (!formData.categoryId) return ElMessage.warning('请选择分类')
    if (!formData.price) return ElMessage.warning('请输入价格')
    saving.value = true
    try {
      if (isEdit.value) {
        await updateFoodDish(editId.value, formData)
      } else {
        await createFoodDish(formData as any)
      }
      showDialog.value = false
      loadData()
    } finally {
      saving.value = false
    }
  }

  const handleDelete = async (row: any) => {
    await ElMessageBox.confirm(`确定删除菜品「${row.name}」吗？`, '提示')
    await deleteFoodDish(row.id)
    loadData()
  }

  onMounted(() => { loadCategories(); loadData() })
</script>
