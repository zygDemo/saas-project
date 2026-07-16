<template>
  <div class="food-orders-page">
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
          <ElSpace wrap>
            <ElTag v-for="s in statusOptions" :key="s.value" :type="s.type" class="cursor-pointer" @click="filterByStatus(s.value)">
              {{ s.label }}
            </ElTag>
          </ElSpace>
        </template>
      </ArtTableHeader>

      <ArtTable :loading="isLoading" :data="tableData" :columns="columns">
        <template #status="{ row }">
          <ElTag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</ElTag>
        </template>
        <template #totalPrice="{ row }">
          <span class="text-red-500 font-bold">¥{{ row.totalPrice }}</span>
        </template>
        <template #items="{ row }">
          <div v-for="item in row.items" :key="item.id" class="flex items-center gap-2 mb-1">
            <span>{{ item.dish?.name }}</span>
            <span class="text-gray-400">x{{ item.quantity }}</span>
          </div>
        </template>
        <template #actions="{ row }">
          <ElButton v-if="row.status === 1" type="success" link @click="handleUpdateStatus(row, 2)">接单</ElButton>
          <ElButton v-if="row.status === 2" type="primary" link @click="handleUpdateStatus(row, 3)">完成</ElButton>
          <ElButton v-if="row.status === 1" type="danger" link @click="handleUpdateStatus(row, 4)">取消</ElButton>
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
  import { getFoodOrders, updateFoodOrderStatus } from '@/api/food'
  import { ElMessage, ElMessageBox } from 'element-plus'

  defineOptions({ name: 'FoodOrders' })

  const isLoading = ref(false)
  const tableData = ref<any[]>([])

  const statusOptions = [
    { value: 1, label: '待接单', type: 'warning' as const },
    { value: 2, label: '制作中', type: 'primary' as const },
    { value: 3, label: '已完成', type: 'success' as const },
    { value: 4, label: '已取消', type: 'info' as const }
  ]

  const searchForm = reactive({ orderNo: '', status: undefined as number | undefined })
  const searchItems = [
    { label: '订单号', key: 'orderNo', type: 'input' as const, placeholder: '订单号' },
    { label: '状态', key: 'status', type: 'select' as const, options: statusOptions.map(s => ({ label: s.label, value: s.value })) }
  ]

  const pagination = reactive({ page: 1, pageSize: 10, total: 0 })

  const columns = [
    { prop: 'orderNo', label: '订单号', width: 180 },
    { prop: 'user.nickName', label: '下单用户', width: 120 },
    { prop: 'items', label: '菜品', useSlot: true },
    { prop: 'totalPrice', label: '总价', width: 100, useSlot: true },
    { prop: 'status', label: '状态', width: 100, useSlot: true },
    { prop: 'remark', label: '备注', width: 150 },
    { prop: 'createdAt', label: '下单时间', width: 180 },
    { prop: 'actions', label: '操作', width: 150, useSlot: true }
  ]

  const getStatusText = (status: number) => statusOptions.find(s => s.value === status)?.label || '未知'
  const getStatusType = (status: number) => statusOptions.find(s => s.value === status)?.type || 'info'

  const filterByStatus = (status: number) => {
    searchForm.status = searchForm.status === status ? undefined : status
    handleSearch()
  }

  const loadData = async () => {
    isLoading.value = true
    try {
      const res = await getFoodOrders({ ...searchForm, page: pagination.page, pageSize: pagination.pageSize })
      tableData.value = res.data?.list || []
      pagination.total = res.data?.total || 0
    } finally {
      isLoading.value = false
    }
  }

  const handleSearch = () => { pagination.page = 1; loadData() }
  const handleReset = () => { searchForm.orderNo = ''; searchForm.status = undefined; handleSearch() }

  const handleUpdateStatus = async (row: any, status: number) => {
    const action = status === 2 ? '接单' : status === 3 ? '完成' : '取消'
    await ElMessageBox.confirm(`确定${action}订单「${row.orderNo}」吗？`, '提示')
    await updateFoodOrderStatus(row.id, status)
    loadData()
  }

  onMounted(loadData)
</script>
