<template>
  <ReadingPageShell
    title="分类管理"
    description="维护图书分类树，支持树形/列表视图切换与批量状态处理。"
    icon="ri:folder-2-line"
  >
    <template #actions>
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
    </template>

    <ArtSearchBar
      v-model="searchForm"
      :items="searchItems"
      :span="8"
      :show-expand="false"
      @search="handleSearch"
      @reset="handleReset"
    />

    <ElCard class="art-table-card">
      <ArtTableHeader :loading="isLoading" @refresh="loadCategories" layout="refresh,size,fullscreen,columns,settings">
        <template #left>
          <ElSpace wrap>
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
          </ElSpace>
        </template>
      </ArtTableHeader>

      <ArtTable
        :loading="isLoading"
        :data="displayList"
        :columns="columns"
        row-key="id"
        :default-expand-all="isTree"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        @selection-change="handleSelectionChange"
      />
    </ElCard>

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
</ReadingPageShell>
</template>

<script setup lang="ts">
  import ReadingPageShell from '../components/ReadingPageShell.vue'
  import { h } from 'vue'
  import {
    getBookCategories,
    createBookCategory,
    updateBookCategory,
    deleteBookCategory,
    batchUpdateCategoryStatus
  } from '@/api/reading'
  import { ElMessage, ElMessageBox, ElTag, ElButton } from 'element-plus'

  defineOptions({ name: 'ReadingCategory' })

  // 类型定义
  interface BookCategory {
    id: number
    name: string
    parentId?: number | null
    sort: number
    status: number
    createdAt: string
    updatedAt: string
    children?: BookCategory[]
    _count?: { books: number }
  }

  interface CategoryQueryParams {
    tree?: boolean
    keyword?: string
  }

  const showDialog = ref(false)
  const isEdit = ref(false)
  const editId = ref<number | null>(null)
  const isLoading = ref(false)
  const saving = ref(false)
  const isTree = ref(false)
  const searchForm = reactive({ keyword: '' })
  const selectedIds = ref<number[]>([])

  const categoryList = ref<BookCategory[]>([])
  const displayList = ref<BookCategory[]>([])

  const formData = reactive({
    name: '',
    parentId: null as number | null,
    sort: 0,
    status: 1
  })

  // ArtTable 列配置
  const columns = computed(() => [
    { type: 'selection' as const, width: 50, align: 'center' as const },
    { prop: 'name', label: '分类名称', minWidth: 200 },
    { prop: 'sort', label: '排序', width: 100, align: 'center' as const },
    {
      prop: '_count.books',
      label: '书籍数量',
      width: 100,
      align: 'center' as const,
      formatter: (row: BookCategory) =>
        h(ElTag, { type: 'primary', effect: 'plain' }, () => row._count?.books ?? 0)
    },
    {
      prop: 'status',
      label: '状态',
      width: 100,
      align: 'center' as const,
      formatter: (row: BookCategory) =>
        h(ElTag, { type: row.status === 1 ? 'success' : 'info' }, () =>
          row.status === 1 ? '启用' : '禁用'
        )
    },
    {
      prop: 'createdAt',
      label: '创建时间',
      width: 180,
      formatter: (row: BookCategory) => formatDate(row.createdAt)
    },
    {
      prop: 'operation',
      label: '操作',
      width: 200,
      fixed: 'right' as const,
      align: 'center' as const,
      formatter: (row: BookCategory) =>
        h('div', [
          h(
            ElButton,
            { size: 'small', type: 'primary', link: true, onClick: () => handleEdit(row) },
            () => '编辑'
          ),
          h(
            ElButton,
            { size: 'small', type: 'danger', link: true, onClick: () => handleDelete(row) },
            () => '删除'
          )
        ])
    }
  ])

  // 树形选择数据（排除当前编辑项的子节点）
  const treeSelectData = computed(() => {
    if (!isEdit.value) return categoryList.value
    return filterTreeNodes(categoryList.value, editId.value!)
  })

  const filterTreeNodes = (nodes: BookCategory[], excludeId: number): BookCategory[] => {
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
      const params: CategoryQueryParams = {
        tree: isTree.value,
        keyword: searchForm.keyword.value || undefined
      }
      const res = await getBookCategories(params) as BookCategory[]
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

  const searchItems = computed(() => [
    {
      label: '分类名称',
      key: 'keyword',
      type: 'input',
      placeholder: '搜索分类名称',
      clearable: true
    }
  ])

  const handleSearch = () => {
    loadCategories()
  }

  const handleReset = () => {
    searchForm.keyword = ''
    loadCategories()
  }

  const handleSelectionChange = (rows: BookCategory[]) => {
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
    } catch (error: unknown) {
      if (error !== 'cancel') {
        const message = error instanceof Error ? error.message : '操作失败'
        ElMessage.error(message)
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

  const handleEdit = (row: BookCategory) => {
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

  const handleDelete = (row: BookCategory) => {
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
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : '删除失败'
          ElMessage.error(message)
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
