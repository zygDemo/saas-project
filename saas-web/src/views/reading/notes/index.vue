<template>
  <ReadingPageShell
    title="阅读笔记"
    description="管理用户在阅读过程中的高亮、批注和章节笔记。"
    icon="ri:sticky-note-line"
  >
    <ArtSearchBar
      v-model="searchForm"
      :items="searchItems"
      :span="8"
      :show-expand="false"
      @search="handleSearch"
      @reset="handleReset"
    />

    <ElCard class="art-table-card">
      <ArtTableHeader
        :loading="loading"
        @refresh="fetchNotes"
        layout="refresh,size,fullscreen,columns,settings"
      />

      <ArtTable
        :loading="loading"
        :data="notes"
        :columns="columns"
        :pagination="pagination"
        :pagination-options="paginationOptions"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      />
    </ElCard>
  </ReadingPageShell>
</template>

<script setup lang="ts">
  import { h } from 'vue'
  import { ElButton, ElImage, ElMessageBox } from 'element-plus'
  import { getReadingNotes, deleteReadingNote } from '@/api/reading'
  import ReadingPageShell from '../components/ReadingPageShell.vue'

  defineOptions({ name: 'ReadingNotes' })

  interface ReadingNoteItem {
    id: number
    highlight?: string
    note?: string
    color?: string
    createdAt?: string
    book?: { title?: string; cover?: string }
    chapter?: { title?: string }
  }

  const notes = ref<ReadingNoteItem[]>([])
  const loading = ref(false)
  const page = ref(1)
  const pageSize = ref(20)
  const total = ref(0)
  const searchForm = reactive({ bookId: '' })

  const searchItems = computed(() => [
    {
      label: '书籍 ID',
      key: 'bookId',
      type: 'input',
      placeholder: '输入书籍 ID 筛选',
      clearable: true
    }
  ])

  const pagination = computed(() => ({
    total: total.value,
    current: page.value,
    size: pageSize.value
  }))

  const paginationOptions = {
    pageSizes: [20, 50, 100]
  }

  const previewText = (value?: string) => {
    if (!value) return '-'
    return value.length > 100 ? `${value.slice(0, 100)}...` : value
  }

  const columns = computed(() => [
    { type: 'index' as const, width: 60, label: '序号', align: 'center' as const },
    {
      prop: 'book',
      label: '书籍',
      minWidth: 180,
      formatter: (row: ReadingNoteItem) =>
        h('div', { class: 'reading-note-book' }, [
          row.book?.cover
            ? h(ElImage, {
                src: row.book.cover,
                class: 'reading-note-cover',
                previewSrcList: [row.book.cover],
                previewTeleported: true
              })
            : h('div', { class: 'reading-note-cover reading-note-cover--empty' }, '无'),
          h('span', { class: 'reading-note-title' }, row.book?.title || '-')
        ])
    },
    {
      prop: 'chapter',
      label: '章节',
      width: 160,
      formatter: (row: ReadingNoteItem) => row.chapter?.title || '-'
    },
    {
      prop: 'highlight',
      label: '高亮文本',
      minWidth: 240,
      showOverflowTooltip: true,
      formatter: (row: ReadingNoteItem) =>
        row.highlight
          ? h('span', { class: 'reading-note-highlight' }, previewText(row.highlight))
          : h('span', { class: 'text-gray-400' }, '-')
    },
    {
      prop: 'note',
      label: '笔记内容',
      minWidth: 240,
      showOverflowTooltip: true,
      formatter: (row: ReadingNoteItem) => previewText(row.note)
    },
    {
      prop: 'color',
      label: '颜色',
      width: 80,
      align: 'center' as const,
      formatter: (row: ReadingNoteItem) =>
        h('span', {
          class: 'reading-note-color',
          style: { backgroundColor: row.color || 'var(--el-color-warning-light-8)' }
        })
    },
    { prop: 'createdAt', label: '创建时间', width: 180 },
    {
      prop: 'operation',
      label: '操作',
      width: 100,
      fixed: 'right' as const,
      align: 'center' as const,
      formatter: (row: ReadingNoteItem) =>
        h(ElButton, { type: 'danger', link: true, onClick: () => handleDelete(row) }, () => '删除')
    }
  ])

  async function fetchNotes() {
    loading.value = true
    try {
      const res = await getReadingNotes({
        bookId: searchForm.bookId ? Number(searchForm.bookId) : undefined,
        page: page.value,
        pageSize: pageSize.value
      })
      notes.value = res.data?.items || []
      total.value = res.data?.total || 0
    } finally {
      loading.value = false
    }
  }

  function handleSearch() {
    page.value = 1
    fetchNotes()
  }

  function handleReset() {
    searchForm.bookId = ''
    page.value = 1
    fetchNotes()
  }

  function handleSizeChange(val: number) {
    pageSize.value = val
    page.value = 1
    fetchNotes()
  }

  function handleCurrentChange(val: number) {
    page.value = val
    fetchNotes()
  }

  async function handleDelete(row: ReadingNoteItem) {
    await ElMessageBox.confirm('确定删除该笔记？', '提示', { type: 'warning' })
    await deleteReadingNote(row.id)
    fetchNotes()
  }

  onMounted(fetchNotes)
</script>

<style scoped>
  :deep(.reading-note-book) {
    display: flex;
    gap: 10px;
    align-items: center;
    min-width: 0;
  }

  :deep(.reading-note-cover) {
    flex: 0 0 34px;
    width: 34px;
    height: 46px;
    overflow: hidden;
    object-fit: cover;
    background: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 5px;
  }

  :deep(.reading-note-cover--empty) {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    color: var(--el-text-color-secondary);
  }

  :deep(.reading-note-title) {
    overflow: hidden;
    color: var(--el-text-color-primary);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  :deep(.reading-note-highlight) {
    display: inline-block;
    max-width: 100%;
    padding: 2px 6px;
    color: var(--el-text-color-primary);
    background: var(--el-color-warning-light-9);
    border: 1px solid var(--el-color-warning-light-7);
    border-radius: 4px;
  }

  :deep(.reading-note-color) {
    display: inline-block;
    width: 24px;
    height: 24px;
    border: 1px solid var(--el-border-color);
    border-radius: 6px;
  }
</style>
