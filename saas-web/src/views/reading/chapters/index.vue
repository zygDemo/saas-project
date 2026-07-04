<template>
  <div class="chapters-page art-full-height">
    <!-- 书籍信息 -->
    <div v-if="bookInfo" class="book-info-bar bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3 flex-shrink-0">
      <div class="flex items-center gap-4">
        <img
          v-if="bookInfo.cover"
          :src="bookInfo.cover"
          class="w-12 h-16 object-cover rounded bg-gray-100"
          @error="handleImageError"
          alt="封面"
        />
        <div>
          <div class="text-lg font-medium">{{ bookInfo.title }}</div>
          <div class="text-gray-500 text-sm">
            {{ bookInfo.author }} · {{ bookInfo.chapterCount }} 章 ·
            {{ bookInfo.wordCount?.toLocaleString() }} 字
          </div>
        </div>
      </div>
    </div>

    <ElCard class="art-table-card">
      <!-- 表格头部 -->
      <ArtTableHeader :loading="loading" @refresh="loadChapters">
        <template #left>
          <ElButton @click="$router.back()" icon="ri:arrow-left-line">返回书籍</ElButton>
        </template>
        <template #right>
          <ElButton
            v-if="selectedIds.length > 0"
            type="danger"
            @click="handleBatchDelete"
          >
            批量删除 ({{ selectedIds.length }})
          </ElButton>
          <ElButton type="primary" @click="openAddDialog">新增章节</ElButton>
          <ElInput
            v-model="searchKeyword"
            placeholder="搜索章节标题"
            clearable
            style="width: 240px"
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          >
            <template #append>
              <ElButton @click="handleSearch" icon="ri:search-line" />
            </template>
          </ElInput>
        </template>
      </ArtTableHeader>

      <!-- 表格 -->
      <ArtTable
        :loading="loading"
        :data="chapterList"
        :columns="columns"
        :pagination="pagination"
        :pagination-options="paginationOptions"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
        @selection-change="handleSelectionChange"
      />

      <!-- 查看内容弹窗 -->
      <ElDialog v-model="showContentDialog" :title="viewChapter?.title || '章节内容'" width="800px" @open="resetContentScroll">
        <div ref="contentRef" class="chapter-content max-h-96 overflow-y-auto whitespace-pre-wrap leading-7 text-sm">
          {{ viewChapter?.content || '暂无内容' }}
        </div>
      </ElDialog>

      <!-- 编辑弹窗 -->
      <ElDialog v-model="showEditDialog" :title="isEdit ? '编辑章节' : '新增章节'" width="900px">
        <ElForm :model="formData" label-width="80px">
          <ElFormItem label="章节标题" required>
            <ElInput v-model="formData.title" placeholder="请输入章节标题" />
          </ElFormItem>
          <ElFormItem label="序号">
            <ElInputNumber v-model="formData.sort" :min="0" />
          </ElFormItem>
          <ElFormItem label="VIP">
            <ElSwitch v-model="formData.isVip" />
          </ElFormItem>
          <ElFormItem label="价格" v-if="formData.isVip">
            <ElInputNumber v-model="formData.price" :min="0" :precision="2" />
          </ElFormItem>
          <ElFormItem label="内容">
            <ArtWangEditor v-model="formData.content" height="300px" />
          </ElFormItem>
        </ElForm>
        <template #footer>
          <ElButton @click="showEditDialog = false">取消</ElButton>
          <ElButton type="primary" @click="handleSave" :loading="saving">保存</ElButton>
        </template>
      </ElDialog>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { h } from 'vue'
  import {
    getBookById,
    getChapters,
    getChapterById,
    createChapter,
    updateChapter,
    deleteChapter
  } from '@/api/reading'
  import { ElMessage, ElMessageBox, ElTag, ElButton } from 'element-plus'
  import { useRoute } from 'vue-router'
  import ArtWangEditor from '@/components/core/forms/art-wang-editor/index.vue'

  defineOptions({ name: 'ReadingChapters' })

  // 类型定义
  interface BookInfo {
    id: number
    title: string
    author: string
    cover?: string
    wordCount: number
    chapterCount: number
    reviewCount: number
    _count?: {
      chapters: number
      reviews: number
    }
  }

  interface Chapter {
    id: number
    bookId: number
    title: string
    content?: string
    wordCount: number
    sort: number
    isVip: boolean
    price: number
    createdAt: string
    updatedAt: string
  }

  interface ChapterListResponse {
    items: Chapter[]
    total: number
    page: number
    pageSize: number
  }

  interface ChapterQueryParams {
    bookId: number
    keyword?: string
    page: number
    pageSize: number
  }

  const route = useRoute()
  const bookId = computed(() => Number(route.params.bookId) || 0)

  const loading = ref(false)
  const saving = ref(false)
  const searchKeyword = ref('')
  const currentPage = ref(1)
  const pageSize = ref(20)
  const total = ref(0)

  const bookInfo = ref<BookInfo | null>(null)
  const chapterList = ref<Chapter[]>([])

  const showContentDialog = ref(false)
  const viewChapter = ref<Chapter | null>(null)
  const contentRef = ref<HTMLDivElement>()

  const resetContentScroll = () => {
    if (contentRef.value) {
      contentRef.value.scrollTop = 0
    }
  }
  const showEditDialog = ref(false)
  const isEdit = ref(false)
  const editId = ref<number>(0)

  const formData = reactive({
    title: '',
    sort: 0,
    isVip: false,
    price: 0,
    content: ''
  })

  const pagination = computed(() => ({
    total: total.value,
    current: currentPage.value,
    size: pageSize.value
  }))

  const selectedIds = ref<number[]>([])
  const handleSelectionChange = (rows: Chapter[]) => {
    selectedIds.value = rows.map((r) => r.id)
  }

  const handleBatchDelete = () => {
    if (selectedIds.value.length === 0) {
      ElMessage.warning('请选择要删除的章节')
      return
    }
    ElMessageBox.confirm(
      `确定删除选中的 ${selectedIds.value.length} 章吗？此操作不可撤销。`,
      '批量删除',
      { confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'warning' }
    )
      .then(async () => {
        let successCount = 0
        for (const id of selectedIds.value) {
          try {
            await deleteChapter(id)
            successCount++
          } catch { /* 单个失败继续 */ }
        }
        ElMessage.success(`成功删除 ${successCount} 章`)
        selectedIds.value = []
        loadChapters()
      })
      .catch(() => {})
  }

  const paginationOptions = {
    pageSizes: [20, 50, 100, 200]
  }

  const columns = computed(() => [
    { type: 'selection' as const, width: 45, align: 'center' as const },
    { type: 'index' as const, width: 70, label: '序号', align: 'center' as const },
    { prop: 'title', label: '章节标题', minWidth: 300 },
    {
      prop: 'wordCount',
      label: '字数',
      width: 100,
      align: 'center' as const,
      formatter: (row: Chapter) => row.wordCount?.toLocaleString() || 0
    },
    {
      prop: 'isVip',
      label: 'VIP',
      width: 80,
      align: 'center' as const,
      formatter: (row: Chapter) =>
        h(ElTag, { type: row.isVip ? 'warning' : 'info', effect: 'plain' }, () =>
          row.isVip ? 'VIP' : '免费'
        )
    },
    {
      prop: 'price',
      label: '价格',
      width: 80,
      align: 'center' as const,
      formatter: (row: Chapter) => row.price || 0
    },
    {
      prop: 'operation',
      label: '操作',
      width: 200,
      fixed: 'right' as const,
      align: 'center' as const,
      formatter: (row: Chapter) =>
        h('div', [
          h(
            ElButton,
            { size: 'small', type: 'primary', link: true, onClick: () => handleView(row) },
            () => '查看'
          ),
          h(
            ElButton,
            { size: 'small', type: 'success', link: true, onClick: () => handleEdit(row) },
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

  const handleSizeChange = (val: number) => {
    pageSize.value = val
    currentPage.value = 1
    loadChapters()
  }

  const handleCurrentChange = (val: number) => {
    currentPage.value = val
    loadChapters()
  }

  const handleImageError = (e: Event) => {
    const target = e.target as HTMLImageElement
    if (target) {
      target.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 48 64%22%3E%3Crect fill=%22%23e5e7eb%22 width=%2248%22 height=%2264%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%239ca3af%22 font-size=%2210%22%3E无图%3C/text%3E%3C/svg%3E'
      target.onerror = null
    }
  }

  const loadBookInfo = async () => {
    if (!bookId.value) return
    try {
      const res = await getBookById(bookId.value) as BookInfo
      if (res) {
        if (res._count?.chapters !== undefined) {
          res.chapterCount = res._count.chapters
        }
        if (res._count?.reviews !== undefined) {
          res.reviewCount = res._count.reviews
        }
      }
      bookInfo.value = res
    } catch {
      console.error('加载书籍信息失败')
    }
  }

  const loadChapters = async () => {
    if (!bookId.value) return
    loading.value = true
    try {
      const params: ChapterQueryParams = {
        bookId: bookId.value,
        page: currentPage.value,
        pageSize: pageSize.value
      }
      if (searchKeyword.value) params.keyword = searchKeyword.value
      const res = await getChapters(params) as ChapterListResponse
      const list = Array.isArray(res?.items) ? res.items : []
      chapterList.value = list
      total.value = res?.total || list.length
    } catch (error) {
      console.error('加载章节失败', error)
    } finally {
      loading.value = false
    }
  }

  const handleSearch = () => {
    currentPage.value = 1
    loadChapters()
  }

  const handleView = async (row: Chapter) => {
    try {
      const res = await getChapterById(row.id) as Chapter
      viewChapter.value = res
      showContentDialog.value = true
    } catch {
      ElMessage.error('获取章节内容失败')
    }
  }

  const openAddDialog = () => {
    isEdit.value = false
    editId.value = 0
    formData.title = ''
    formData.sort = 0
    formData.isVip = false
    formData.price = 0
    formData.content = ''
    showEditDialog.value = true
  }

  const handleEdit = async (row: Chapter) => {
    isEdit.value = true
    editId.value = row.id
    formData.title = row.title || ''
    formData.sort = row.sort || 0
    formData.isVip = row.isVip || false
    formData.price = row.price || 0
    formData.content = ''
    // 先加载完整章节内容，再打开对话框避免闪烁
    try {
      const res = await getChapterById(row.id) as Chapter
      formData.content = res?.content || ''
    } catch {
      // 加载内容失败不影响编辑其他字段
    }
    showEditDialog.value = true
  }

  const handleSave = async () => {
    if (!formData.title) {
      ElMessage.warning('请填写章节标题')
      return
    }
    saving.value = true
    try {
      if (isEdit.value) {
        const data: { title: string; sort: number; isVip: boolean; price: number; content?: string } = {
          title: formData.title,
          sort: formData.sort,
          isVip: formData.isVip,
          price: formData.isVip ? formData.price : 0
        }
        if (formData.content) data.content = formData.content
        await updateChapter(editId.value, data)
        ElMessage.success('编辑成功')
      } else {
        await createChapter({
          bookId: bookId.value,
          title: formData.title,
          content: formData.content,
          sort: formData.sort,
          isVip: formData.isVip,
          price: formData.isVip ? formData.price : 0
        })
        ElMessage.success('新增成功')
      }
      showEditDialog.value = false
      loadChapters()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : (isEdit.value ? '编辑失败' : '新增失败')
      ElMessage.error(message)
    } finally {
      saving.value = false
    }
  }

  const handleDelete = (row: Chapter) => {
    ElMessageBox.confirm(`确定删除章节"${row.title}"吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        try {
          await deleteChapter(row.id)
          ElMessage.success('删除成功')
          loadChapters()
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : '删除失败'
          ElMessage.error(message)
        }
      })
      .catch(() => {
        // 取消操作
      })
  }

  onMounted(() => {
    if (bookId.value) {
      loadBookInfo()
      loadChapters()
    }
  })
</script>

<style scoped>
  .chapters-page {
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .chapters-page :deep(.art-table-card) {
    flex: 1;
    min-height: 0;
  }
</style>
