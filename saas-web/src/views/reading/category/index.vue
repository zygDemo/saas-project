<template>
  <div class="page-content !mb-5">
    <div class="flex items-center justify-between mb-5">
      <h1 class="text-2xl font-medium">{{ $t('menus.reading.category') }}</h1>
      <div class="flex gap-2">
        <ElButton
          type="success"
          @click="toggleTree"
          :icon="isTree ? 'ri:list-check' : 'ri:git-branch-line'"
        >
          {{ isTree ? '列表视图' : '树形视图' }}
        </ElButton>
        <ElButton v-if="selectedIds.length > 0" type="warning" @click="handleBatchStatus(1)">
          批量启用 ({{ selectedIds.length }})
        </ElButton>
        <ElButton v-if="selectedIds.length > 0" type="info" @click="handleBatchStatus(0)">
          批量禁用 ({{ selectedIds.length }})
        </ElButton>
        <ElButton type="primary" @click="openAddDialog" v-auth="'add'">新增分类</ElButton>
      </div>
    </div>

    <!-- 搜索 -->
    <div class="mb-4">
      <ElInput
        v-model="searchKeyword"
        placeholder="搜索分类名称"
        clearable
        style="width: 300px"
        @clear="handleSearch"
        @keyup.enter="handleSearch"
      >
        <template #append>
          <ElButton @click="handleSearch" icon="ri:search-line" />
        </template>
      </ElInput>
    </div>

    <!-- 表格 -->
    <ElTable
      :data="displayList"
      stripe
      border
      v-loading="isLoading"
      row-key="id"
      :default-expand-all="isTree"
      :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
      @selection-change="handleSelectionChange"
    >
      <ElTableColumn type="selection" width="50" align="center" />
      <ElTableColumn prop="name" label="分类名称" min-width="200" />
      <ElTableColumn prop="sort" label="排序" width="100" align="center" />
      <ElTableColumn label="书籍数量" width="100" align="center">
        <template #default="{ row }">
          <ElTag type="primary" effect="plain">{{ row._count?.books ?? 0 }}</ElTag>
        </template>
      </ElTableColumn>
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
          <ElButton size="small" type="primary" link @click="handleEdit(row)" v-auth="'edit'"
            >编辑</ElButton
          >
          <ElButton size="small" type="danger" link @click="handleDelete(row)" v-auth="'delete'"
            >删除</ElButton
          >
        </template>
      </ElTableColumn>
    </ElTable>

    <div class="flex justify-center mt-5">
      <ElEmpty v-if="displayList.length === 0 && !isLoading" description="暂无分类数据" />
    </div>

    <!-- 新增/编辑分类弹窗 -->
    <ElDialog v-model="showDialog" :title="isEdit ? '编辑分类' : '新增分类'" width="500px">
      <ElForm :model="formData" label-width="100px">
        <ElFormItem label="分类名称" required>
          <ElInput v-model="formData.name" placeholder="请输入分类名称" />
        </ElFormItem>
        <ElFormItem label="父分类">
          <ElTreeSelect
            v-model="formData.parentId"
            :data="treeSelectData"
            :props="{ label: 'name', value: 'id', children: 'children' }"
            placeholder="请选择父分类（可选）"
            clearable
            check-strictly
            class="w-full"
          />
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
  import {
    getBookCategories,
    createBookCategory,
    updateBookCategory,
    deleteBookCategory,
    batchUpdateCategoryStatus
  } from '@/api/reading'
  import { ElMessage, ElMessageBox } from 'element-plus'

  defineOptions({ name: 'ReadingCategory' })

  const showDialog = ref(false)
  const isEdit = ref(false)
  const editId = ref<number | null>(null)
  const isLoading = ref(false)
  const saving = ref(false)
  const isTree = ref(false)
  const searchKeyword = ref('')
  const selectedIds = ref<number[]>([])

  const categoryList = ref<any[]>([])
  const displayList = ref<any[]>([])

  const formData = reactive({
    name: '',
    parentId: null as number | null,
    sort: 0,
    status: 1
  })

  // 树形选择数据（排除当前编辑项的子节点）
  const treeSelectData = computed(() => {
    if (!isEdit.value) return categoryList.value
    return filterTreeNodes(categoryList.value, editId.value!)
  })

  const filterTreeNodes = (nodes: any[], excludeId: number): any[] => {
    return nodes
      .filter((n) => n.id !== excludeId)
      .map((n) => ({
        ...n,
        children: n.children ? filterTreeNodes(n.children, excludeId) : []
      }))
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString('zh-CN')
  }

  // 加载分类列表
  const loadCategories = async () => {
    isLoading.value = true
    try {
      const res = (await getBookCategories({
        tree: isTree.value,
        keyword: searchKeyword.value || undefined
      })) as any
      const data = res || []
      categoryList.value = data
      displayList.value = data
    } catch (error) {
      console.error('加载分类失败', error)
    } finally {
      isLoading.value = false
    }
  }

  const toggleTree = () => {
    isTree.value = !isTree.value
    loadCategories()
  }

  const handleSearch = () => {
    loadCategories()
  }

  const handleSelectionChange = (rows: any[]) => {
    selectedIds.value = rows.map((r) => r.id)
  }

  const handleBatchStatus = async (status: number) => {
    try {
      await ElMessageBox.confirm(
        `确定${status === 1 ? '启用' : '禁用'}选中的 ${selectedIds.value.length} 个分类吗？`,
        '提示',
        { type: 'warning' }
      )
      await batchUpdateCategoryStatus({ ids: selectedIds.value, status })
      ElMessage.success(`${status === 1 ? '启用' : '禁用'}成功`)
      selectedIds.value = []
      loadCategories()
    } catch (error: any) {
      if (error !== 'cancel') {
        ElMessage.error(error?.response?.data?.message || '操作失败')
      }
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
    })
      .then(async () => {
        try {
          await deleteBookCategory(row.id)
          ElMessage.success('删除成功')
          loadCategories()
        } catch (error: any) {
          ElMessage.error(error?.response?.data?.message || '删除失败')
        }
      })
      .catch(() => {})
  }

  const handleSave = async () => {
    if (!formData.name) {
      ElMessage.warning('请填写分类名称')
      return
    }

    saving.value = true
    try {
    if (isEdit.value && editId.value) {
      await updateBookCategory(editId.value, {
        ...formData,
        parentId: formData.parentId ?? undefined
      })
      ElMessage.success('编辑成功')
    } else {
      await createBookCategory({
        name: formData.name,
        parentId: formData.parentId ?? undefined,
        sort: formData.sort
      })
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
