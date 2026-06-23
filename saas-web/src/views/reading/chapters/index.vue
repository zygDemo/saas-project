<template>
  <div class="chapters-page art-full-height">
    <!-- 书籍信息 -->
    <div v-if="bookInfo" class="book-info-bar bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3 flex-shrink-0">
      <div class="flex items-center gap-4">
        <img
          v-if="bookInfo.cover"
          :src="bookInfo.cover"
          class="w-12 h-16 object-cover rounded"
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
      />

      <!-- 查看内容弹窗 -->
      <ElDialog v-model="showContentDialog" :title="viewChapter?.title || '章节内容'" width="800px" @open="resetContentScroll">
        <div ref="contentRef" class="chapter-content max-h-96 overflow-y-auto whitespace-pre-wrap leading-7 text-sm">
          {{ viewChapter?.content || '暂无内容' }}
        </div>
      </ElDialog>

      <!-- 编辑弹窗 -->
      <ElDialog v-model="showEditDialog" :title="isEdit ? '编辑章节' : '新增章节'" width="600px">
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
            <ElInput v-model="formData.content" type="textarea" :rows="10" placeholder="章节内容" />
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
    updateChapter,
    deleteChapter
  } from '@/api/reading'
  import { ElMessage, ElMessageBox, ElTag, ElButton } from 'element-plus'
  import { useRoute } from 'vue-router'

  defineOptions({ name: 'ReadingChapters' })

  const route = useRoute()
  const bookId = computed(() => Number(route.params.bookId) || 0)

  const loading = ref(false)
  const saving = ref(false)
  const searchKeyword = ref('')
  const currentPage = ref(1)
  const pageSize = ref(20)
  const total = ref(0)

  const bookInfo = ref<any>(null)
  const chapterList = ref<any[]>([])

  const showContentDialog = ref(false)
  const viewChapter = ref<any>(null)
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

  const paginationOptions = {
    pageSizes: [20, 50, 100, 200]
  }

  const columns = computed(() => [
    { type: 'index' as const, width: 70, label: '序号', align: 'center' as const },
    { prop: 'title', label: '章节标题', minWidth: 300 },
    {
      prop: 'wordCount',
      label: '字数',
      width: 100,
      align: 'center' as const,
      formatter: (row: any) => row.wordCount?.toLocaleString() || 0
    },
    {
      prop: 'isVip',
      label: 'VIP',
      width: 80,
      align: 'center' as const,
      formatter: (row: any) =>
        h(ElTag, { type: row.isVip ? 'warning' : 'info', effect: 'plain' }, () =>
          row.isVip ? 'VIP' : '免费'
        )
    },
    {
      prop: 'price',
      label: '价格',
      width: 80,
      align: 'center' as const,
      formatter: (row: any) => row.price || 0
    },
    {
      prop: 'operation',
      label: '操作',
      width: 200,
      fixed: 'right' as const,
      align: 'center' as const,
      formatter: (row: any) =>
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

  const loadBookInfo = async () => {
    if (!bookId.value) return
    try {
      const res = (await getBookById(bookId.value)) as any
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
      const res = (await getChapters({
        bookId: bookId.value,
        page: currentPage.value,
        pageSize: pageSize.value
      })) as any
      const data = res?.items || res?.list || res?.data || res || []
      const list = Array.isArray(data) ? data : []
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

  const handleView = async (row: any) => {
    try {
      const res = (await getChapterById(row.id)) as any
      viewChapter.value = res
      showContentDialog.value = true
    } catch {
      ElMessage.error('获取章节内容失败')
    }
  }

  const handleEdit = (row: any) => {
    isEdit.value = true
    editId.value = row.id
    Object.assign(formData, {
      title: row.title,
      sort: row.sort || 0,
      isVip: row.isVip || false,
      price: row.price || 0,
      content: ''
    })
    showEditDialog.value = true
  }

  const handleSave = async () => {
    if (!formData.title) {
      ElMessage.warning('请填写章节标题')
      return
    }
    saving.value = true
    try {
      const data: any = {
        title: formData.title,
        sort: formData.sort,
        isVip: formData.isVip,
        price: formData.isVip ? formData.price : 0
      }
      if (formData.content) data.content = formData.content
      await updateChapter(editId.value, data)
      ElMessage.success('编辑成功')
      showEditDialog.value = false
      loadChapters()
    } catch (error: any) {
      ElMessage.error(error?.response?.data?.message || '编辑失败')
    } finally {
      saving.value = false
    }
  }

  const handleDelete = (row: any) => {
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
        } catch (error: any) {
          ElMessage.error(error?.response?.data?.message || '删除失败')
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
