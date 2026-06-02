<template>
  <div class="file-page art-full-height">
    <ElCard class="art-card-xs mb-4">
      <ElForm :model="search" class="file-search" inline>
        <ElFormItem label="文件名">
          <ElInput v-model="search.fileName" clearable placeholder="文件名" />
        </ElFormItem>
        <ElFormItem label="业务类型">
          <ElSelect v-model="search.businessType" clearable placeholder="全部" style="width: 150px">
            <ElOption v-for="item in businessTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="业务ID">
          <ElInputNumber v-model="search.businessId" :min="1" controls-position="right" placeholder="订单/业务ID" />
        </ElFormItem>
        <ElFormItem label="分类">
          <ElSelect v-model="search.categoryCode" clearable filterable placeholder="全部" style="width: 150px">
            <ElOption v-for="item in categoryOptions" :key="item.value" :label="item.label" :value="item.value" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSelect v-model="search.status" clearable placeholder="全部" style="width: 120px">
            <ElOption v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem>
          <ElButton type="primary" @click="loadData">查询</ElButton>
          <ElButton @click="resetSearch">重置</ElButton>
        </ElFormItem>
      </ElForm>
    </ElCard>

    <ElCard class="art-table-card">
      <template #header>
        <div class="file-header">
          <div>
            <h3>文件管理</h3>
            <p>统一维护系统文件、业务附件和订单资料分类。</p>
          </div>
          <ElSpace>
            <ElButton type="primary" @click="openDialog()">新增文件</ElButton>
            <ElButton :loading="loading" @click="loadData">刷新</ElButton>
          </ElSpace>
        </div>
      </template>

      <ElTable v-loading="loading" :data="list" row-key="id" border stripe>
        <ElTableColumn prop="fileName" label="文件名" min-width="220" show-overflow-tooltip />
        <ElTableColumn prop="categoryName" label="分类" min-width="130" show-overflow-tooltip />
        <ElTableColumn prop="businessType" label="业务类型" width="120">
          <template #default="{ row }">{{ businessTypeLabel(row.businessType) }}</template>
        </ElTableColumn>
        <ElTableColumn prop="businessId" label="业务ID" width="100" />
        <ElTableColumn prop="storageType" label="存储" width="90" />
        <ElTableColumn prop="fileSize" label="大小" width="110">
          <template #default="{ row }">{{ formatSize(row.fileSize) }}</template>
        </ElTableColumn>
        <ElTableColumn prop="status" label="状态" width="90">
          <template #default="{ row }">
            <ElTag :type="row.status === 'ACTIVE' ? 'success' : 'info'">{{ statusLabel(row.status) }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="createdAt" label="上传时间" width="180" />
        <ElTableColumn label="操作" width="190" fixed="right">
          <template #default="{ row }">
            <ElButton link type="primary" @click="openFile(row)">打开</ElButton>
            <ElButton link type="primary" @click="openDialog(row)">编辑</ElButton>
            <ElButton link type="danger" @click="deleteFile(row)">删除</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>

      <div class="file-pagination">
        <ElPagination
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.size"
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </ElCard>

    <ElDialog v-model="dialogVisible" :title="form.id ? '编辑文件' : '新增文件'" width="680px">
      <ElForm :model="form" label-width="110px">
        <ElFormItem label="文件名" required>
          <ElInput v-model="form.fileName" placeholder="请输入文件名" />
        </ElFormItem>
        <ElFormItem label="文件地址" required>
          <ElInput v-model="form.fileUrl" placeholder="请输入文件 URL" />
        </ElFormItem>
        <ElFormItem label="分类" required>
          <ElSelect v-model="form.categoryCode" filterable placeholder="请选择分类" style="width: 100%" @change="syncCategoryName">
            <ElOption v-for="item in categoryOptions" :key="item.value" :label="item.label" :value="item.value" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="分类名称">
          <ElInput v-model="form.categoryName" placeholder="可自定义分类名称" />
        </ElFormItem>
        <ElFormItem label="业务绑定">
          <div class="file-binding">
            <ElSelect v-model="form.businessType" clearable placeholder="业务类型">
              <ElOption v-for="item in businessTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
            </ElSelect>
            <ElInputNumber v-model="form.businessId" :min="1" controls-position="right" placeholder="业务ID" />
          </div>
        </ElFormItem>
        <ElFormItem label="机构ID">
          <ElInputNumber v-model="form.orgId" :min="1" controls-position="right" style="width: 100%" />
        </ElFormItem>
        <ElFormItem label="扩展信息">
          <div class="file-binding">
            <ElInput v-model="form.mimeType" placeholder="MIME 类型" />
            <ElInput v-model="form.fileExt" placeholder="扩展名" />
            <ElInputNumber v-model="form.fileSize" :min="0" controls-position="right" placeholder="字节" />
          </div>
        </ElFormItem>
        <ElFormItem label="存储类型">
          <ElSelect v-model="form.storageType" style="width: 100%">
            <ElOption label="本地" value="LOCAL" />
            <ElOption label="OSS" value="OSS" />
            <ElOption label="COS" value="COS" />
            <ElOption label="S3" value="S3" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="对象Key">
          <ElInput v-model="form.objectKey" placeholder="对象存储 Key，可选" />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSelect v-model="form.status" style="width: 100%">
            <ElOption v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="备注">
          <ElInput v-model="form.remark" type="textarea" :rows="3" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="submitting" @click="submitForm">保存</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import {
    fetchCreateFileAsset,
    fetchDeleteFileAsset,
    fetchGetFileAssetList,
    fetchUpdateFileAsset
  } from '@/api/system-manage'
  import { ElMessage, ElMessageBox } from 'element-plus'

  defineOptions({ name: 'FileManage' })

  type FileAssetItem = Api.SystemManage.FileAssetItem

  const businessTypeOptions = [
    { label: '进件', value: 'APPLICATION' },
    { label: '签约', value: 'SIGNING' },
    { label: '放款', value: 'DISBURSEMENT' },
    { label: '还款', value: 'REPAYMENT' },
    { label: '客户', value: 'CUSTOMER' },
    { label: '线索', value: 'LEAD' }
  ]
  const categoryOptions = [
    { label: '身份证', value: 'ID_CARD' },
    { label: '行驶证', value: 'VEHICLE_LICENSE' },
    { label: '登记证', value: 'VEHICLE_REGISTER' },
    { label: '银行卡', value: 'BANK_CARD' },
    { label: '收入证明', value: 'INCOME_PROOF' },
    { label: '合同文件', value: 'CONTRACT' },
    { label: '放款凭证', value: 'DISBURSEMENT_VOUCHER' },
    { label: '抵押回执', value: 'MORTGAGE_RECEIPT' },
    { label: '其他', value: 'OTHER' }
  ]
  const statusOptions = [
    { label: '启用', value: 'ACTIVE' },
    { label: '停用', value: 'INACTIVE' }
  ]

  const loading = ref(false)
  const submitting = ref(false)
  const dialogVisible = ref(false)
  const list = ref<FileAssetItem[]>([])
  const pagination = reactive({ current: 1, size: 20, total: 0 })
  const search = reactive<Api.SystemManage.FileAssetSearchParams>({
    current: 1,
    size: 20,
    status: ''
  })
  const form = reactive<Partial<FileAssetItem>>({
    categoryCode: 'OTHER',
    categoryName: '其他',
    storageType: 'LOCAL',
    status: 'ACTIVE'
  })

  onMounted(loadData)

  async function loadData() {
    loading.value = true
    try {
      const result = await fetchGetFileAssetList({
        ...search,
        current: pagination.current,
        size: pagination.size
      })
      list.value = result.records || []
      pagination.total = result.total || 0
    } finally {
      loading.value = false
    }
  }

  function resetSearch() {
    Object.assign(search, {
      fileName: '',
      businessType: '',
      businessId: undefined,
      categoryCode: '',
      status: ''
    })
    pagination.current = 1
    loadData()
  }

  function openDialog(row?: FileAssetItem) {
    Object.assign(form, {
      id: undefined,
      orgId: undefined,
      businessType: '',
      businessId: undefined,
      categoryCode: 'OTHER',
      categoryName: '其他',
      fileName: '',
      fileUrl: '',
      objectKey: '',
      mimeType: '',
      fileExt: '',
      fileSize: undefined,
      storageType: 'LOCAL',
      status: 'ACTIVE',
      uploadedBy: undefined,
      remark: ''
    })
    if (row) Object.assign(form, row)
    dialogVisible.value = true
  }

  function syncCategoryName(value: string) {
    form.categoryName =
      categoryOptions.find((item) => item.value === value)?.label || form.categoryName || value
  }

  async function submitForm() {
    if (!form.fileName || !form.fileUrl || !form.categoryCode || !form.categoryName) {
      ElMessage.warning('请完善文件名、文件地址和分类')
      return
    }
    submitting.value = true
    try {
      const payload = cleanPayload(form)
      if (form.id) await fetchUpdateFileAsset(form.id, payload)
      else await fetchCreateFileAsset(payload)
      dialogVisible.value = false
      await loadData()
    } finally {
      submitting.value = false
    }
  }

  async function deleteFile(row: FileAssetItem) {
    await ElMessageBox.confirm(`确认删除文件「${row.fileName}」？`, '删除确认', { type: 'warning' })
    await fetchDeleteFileAsset(row.id)
    await loadData()
  }

  function openFile(row: FileAssetItem) {
    if (!row.fileUrl) {
      ElMessage.warning('文件地址为空')
      return
    }
    window.open(row.fileUrl, '_blank')
  }

  function cleanPayload(source: Partial<FileAssetItem>) {
    const payload: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(source)) {
      if (key === 'id' || key === 'createdAt' || key === 'updatedAt') continue
      if (value === undefined || value === null || value === '') continue
      payload[key] = value
    }
    return payload
  }

  function businessTypeLabel(value?: string) {
    if (!value) return '-'
    return businessTypeOptions.find((item) => item.value === value)?.label || value
  }

  function statusLabel(value: string) {
    return statusOptions.find((item) => item.value === value)?.label || value
  }

  function formatSize(size?: number) {
    if (!size) return '-'
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    return `${(size / 1024 / 1024).toFixed(1)} MB`
  }
</script>

<style scoped lang="scss">
  .file-page {
    .file-search {
      :deep(.el-form-item) {
        margin-bottom: 0;
      }
    }

    .file-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;

      h3 {
        margin: 0;
      }

      p {
        margin: 4px 0 0;
        color: var(--el-text-color-secondary);
        font-size: 13px;
      }
    }

    .file-pagination {
      display: flex;
      justify-content: flex-end;
      margin-top: 16px;
    }

    .file-binding {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
      width: 100%;

      > :deep(.el-input-number),
      > :deep(.el-select),
      > :deep(.el-input) {
        width: 100%;
      }
    }
  }
</style>
