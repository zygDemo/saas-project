<template>
  <div class="page-content !mb-5">
    <div class="flex items-center justify-between mb-5">
      <h1 class="text-2xl font-medium">阅读笔记</h1>
    </div>

    <!-- 搜索栏 -->
    <ElRow :gutter="10" class="mb-5">
      <ElCol :lg="6" :md="8" :sm="12" :xs="24">
        <ElInput
          v-model="searchBookId"
          clearable
          placeholder="书籍ID筛选"
          @keyup.enter="fetchNotes"
        />
      </ElCol>
      <ElCol :lg="4" :md="6" :sm="8" :xs="24">
        <ElButton type="primary" @click="fetchNotes">查询</ElButton>
      </ElCol>
    </ElRow>

    <!-- 笔记列表 -->
    <ElTable :data="notes" border stripe v-loading="loading">
      <ElTableColumn prop="id" label="ID" width="80" />
      <ElTableColumn label="书籍" min-width="150">
        <template #default="{ row }">
          <div class="flex items-center gap-2">
            <img v-if="row.book?.cover" :src="row.book.cover" class="w-8 h-10 object-cover rounded" />
            <span>{{ row.book?.title || '-' }}</span>
          </div>
        </template>
      </ElTableColumn>
      <ElTableColumn label="章节" width="150">
        <template #default="{ row }">{{ row.chapter?.title || '-' }}</template>
      </ElTableColumn>
      <ElTableColumn label="高亮文本" min-width="200">
        <template #default="{ row }">
          <span v-if="row.highlight" class="text-sm" :style="{ backgroundColor: row.color + '40', padding: '2px 4px', borderRadius: '2px' }">
            {{ row.highlight.length > 100 ? row.highlight.slice(0, 100) + '...' : row.highlight }}
          </span>
          <span v-else class="text-gray-400">-</span>
        </template>
      </ElTableColumn>
      <ElTableColumn label="笔记内容" min-width="200">
        <template #default="{ row }">
          <span v-if="row.note">{{ row.note.length > 100 ? row.note.slice(0, 100) + '...' : row.note }}</span>
          <span v-else class="text-gray-400">-</span>
        </template>
      </ElTableColumn>
      <ElTableColumn label="颜色" width="80">
        <template #default="{ row }">
          <div :style="{ width: '24px', height: '24px', backgroundColor: row.color, borderRadius: '4px', border: '1px solid #eee' }" />
        </template>
      </ElTableColumn>
      <ElTableColumn prop="createdAt" label="创建时间" width="170" />
      <ElTableColumn label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <ElButton type="danger" link @click="handleDelete(row)">删除</ElButton>
        </template>
      </ElTableColumn>
    </ElTable>

    <!-- 分页 -->
    <div class="mt-4 flex justify-end">
      <ElPagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        @size-change="fetchNotes"
        @current-change="fetchNotes"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessageBox } from 'element-plus'
import { getReadingNotes, deleteReadingNote } from '@/api/reading'

const notes = ref<any[]>([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const searchBookId = ref('')

async function fetchNotes() {
  loading.value = true
  try {
    const res = await getReadingNotes({
      bookId: searchBookId.value ? Number(searchBookId.value) : undefined,
      page: page.value,
      pageSize: pageSize.value,
    })
    notes.value = res.data?.items || []
    total.value = res.data?.total || 0
  } finally {
    loading.value = false
  }
}

async function handleDelete(row: any) {
  await ElMessageBox.confirm('确定删除该笔记？', '提示', { type: 'warning' })
  await deleteReadingNote(row.id)
  fetchNotes()
}

onMounted(fetchNotes)
</script>
