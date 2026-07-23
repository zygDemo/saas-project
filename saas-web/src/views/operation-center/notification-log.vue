<template>
  <div class="notification-log-page">
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
          <span class="text-sm text-gray-500">通知发送记录（全租户）</span>
        </template>
      </ArtTableHeader>

      <ArtTable :loading="isLoading" :data="tableData" :columns="columns">
        <template #type="{ row }">
          <ElTag :type="getTypeTag(row.type)">{{ getTypeText(row.type) }}</ElTag>
        </template>
        <template #user="{ row }">
          <span v-if="row.user">{{ row.user.nickName || row.user.userName }}</span>
          <ElTag v-else type="info" size="small">全员</ElTag>
        </template>
        <template #readAt="{ row }">
          <ElTag v-if="row.readAt" type="success" size="small">已读</ElTag>
          <ElTag v-else type="warning" size="small">未读</ElTag>
        </template>
        <template #content="{ row }">
          <ElTooltip :content="row.content" placement="top" :show-after="300">
            <span class="truncate inline-block max-w-[280px] align-bottom">{{ row.content }}</span>
          </ElTooltip>
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
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, onMounted } from 'vue'
  import { getNotificationLogs } from '@/api/notification'

  defineOptions({ name: 'NotificationLog' })

  const isLoading = ref(false)
  const tableData = ref<any[]>([])

  const typeOptions = [
    { value: 'announcement', label: '公告' },
    { value: 'approval', label: '审批' },
    { value: 'supplement', label: '补件' },
    { value: 'signing', label: '签约' },
    { value: 'loan', label: '放款' },
    { value: 'order', label: '订单' },
    { value: 'system', label: '系统' }
  ]

  const typeMap = new Map(typeOptions.map((t) => [t.value, t]))
  const getTypeText = (type: string) => typeMap.get(type)?.label || type
  const getTypeTag = (type: string) => {
    const tagTypes: Record<string, 'primary' | 'success' | 'warning' | 'info' | 'danger'> = {
      announcement: 'primary',
      approval: 'success',
      supplement: 'warning',
      signing: 'primary',
      loan: 'success',
      order: 'warning',
      system: 'info'
    }
    return tagTypes[type] || 'info'
  }

  const searchForm = reactive({
    type: undefined as string | undefined,
    userId: undefined as number | undefined
  })
  const searchItems = [
    {
      label: '类型',
      key: 'type',
      type: 'select' as const,
      options: typeOptions.map((t) => ({ label: t.label, value: t.value }))
    },
    { label: '用户ID', key: 'userId', type: 'input' as const, placeholder: '接收用户ID' }
  ]

  const pagination = reactive({ page: 1, pageSize: 20, total: 0 })

  const columns = [
    { prop: 'id', label: 'ID', width: 80 },
    { prop: 'type', label: '类型', width: 100, useSlot: true },
    { prop: 'title', label: '标题', minWidth: 160 },
    { prop: 'content', label: '内容', minWidth: 200, useSlot: true },
    { prop: 'user', label: '接收用户', width: 120, useSlot: true },
    { prop: 'readAt', label: '状态', width: 90, useSlot: true },
    { prop: 'createdAt', label: '发送时间', width: 180 }
  ]

  const loadData = async () => {
    isLoading.value = true
    try {
      const res = await getNotificationLogs({
        ...searchForm,
        current: pagination.page,
        size: pagination.pageSize
      })
      tableData.value = res.data?.list || []
      pagination.total = res.data?.meta?.total || res.data?.total || 0
    } finally {
      isLoading.value = false
    }
  }

  const handleSearch = () => {
    pagination.page = 1
    loadData()
  }
  const handleReset = () => {
    searchForm.type = undefined
    searchForm.userId = undefined
    handleSearch()
  }

  onMounted(loadData)
</script>

<style scoped>
  .notification-log-page {
    :deep(.art-table-card .el-card__body) {
      display: flex;
      flex-direction: column;
      min-height: 0;
    }

    :deep(.art-table-card .art-table) {
      flex: 1;
      min-height: 0;
    }
  }
</style>
