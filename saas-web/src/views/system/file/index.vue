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
            <ElButton
              type="danger"
              plain
              :disabled="selectedRows.length === 0"
              @click="batchDeleteFiles"
            >
              批量删除<span v-if="selectedRows.length">({{ selectedRows.length }})</span>
            </ElButton>
            <ElButton v-if="selectedRows.length" @click="clearSelection">取消选择</ElButton>
            <ElButton :loading="loading" @click="loadData">刷新</ElButton>
          </ElSpace>
        </div>
      </template>

      <ElTable
        ref="tableRef"
        v-loading="loading"
        :data="list"
        row-key="id"
        border
        stripe
        @selection-change="handleSelectionChange"
      >
        <ElTableColumn type="selection" width="48" reserve-selection />
        <ElTableColumn label="预览" width="88" align="center">
          <template #default="{ row }">
            <ElImage
              v-if="isImageFile(row)"
              class="file-thumb"
              :src="resolveFileUrl(row.fileUrl)"
              :preview-src-list="[resolveFileUrl(row.fileUrl)]"
              preview-teleported
              fit="cover"
            />
            <span v-else class="file-empty">-</span>
          </template>
        </ElTableColumn>
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
        <ElFormItem label="上传图片">
          <ElUpload
            class="image-uploader"
            :action="uploadImageUrl"
            :headers="uploadHeaders"
            :show-file-list="false"
            accept="image/*"
            :before-upload="beforeImageUpload"
            :on-success="handleImageUploadSuccess"
            :on-error="handleImageUploadError"
          >
            <img v-if="form.fileUrl && isImageFile(form)" :src="resolveFileUrl(form.fileUrl)" class="upload-preview" />
            <div v-else class="upload-placeholder">
              <ArtSvgIcon icon="ri:image-add-line" class="upload-icon" />
              <span>点击上传图片</span>
            </div>
          </ElUpload>
        </ElFormItem>
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
        <ElFormItem v-if="form.id" label="扩展信息">
          <div class="file-binding">
            <ElInput v-model="form.mimeType" placeholder="MIME 类型" />
            <ElInput v-model="form.fileExt" placeholder="扩展名" />
            <ElInputNumber v-model="form.fileSize" :min="0" controls-position="right" placeholder="字节" />
          </div>
        </ElFormItem>
        <ElFormItem v-if="form.id" label="存储类型">
          <ElSelect v-model="form.storageType" style="width: 100%">
            <ElOption label="本地" value="LOCAL" />
            <ElOption label="OSS" value="OSS" />
            <ElOption label="COS" value="COS" />
            <ElOption label="S3" value="S3" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem v-if="form.id" label="对象Key">
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
    fetchBatchDeleteFileAssets,
    fetchCreateFileAsset,
    fetchDeleteFileAsset,
    fetchGetFileAssetList,
    fetchUpdateFileAsset
  } from '@/api/system-manage'
  import { useUserStore } from '@/store/modules/user'
  import { API_BASE_URL } from '@/utils/http'
  import { ElMessage, ElMessageBox } from 'element-plus'

  defineOptions({ name: 'FileManage' })

  type FileAssetItem = Api.SystemManage.FileAssetItem
  type UploadImageResponse = {
    code: number
    msg: string
    data: Api.SystemManage.UploadImageResult
  }

  const MAX_IMAGE_SIZE = 10
  const FILE_FORM_FIELDS = [
    'id',
    'orgId',
    'businessType',
    'businessId',
    'categoryCode',
    'categoryName',
    'fileName',
    'fileUrl',
    'objectKey',
    'mimeType',
    'fileExt',
    'fileSize',
    'storageType',
    'status',
    'remark'
  ] as const
  const FILE_SAVE_FIELDS = [
    'orgId',
    'businessType',
    'businessId',
    'categoryCode',
    'categoryName',
    'fileName',
    'fileUrl',
    'objectKey',
    'mimeType',
    'fileExt',
    'fileSize',
    'storageType',
    'status',
    'remark'
  ] as const
  const userStore = useUserStore()
  const uploadImageUrl = `${API_BASE_URL}/file/upload/image`
  const uploadHeaders = computed(() => ({
    Authorization: userStore.accessToken,
    'x-tenant-id': import.meta.env.VITE_TENANT_ID || '1'
  }))
  const businessTypeOptions = [
    { label: '进件', value: 'APPLICATION' },
    { label: '签约', value: 'SIGNING' },
    { label: '放款', value: 'DISBURSEMENT' },
    { label: '还款', value: 'REPAYMENT' },
    { label: '客户', value: 'CUSTOMER' },
    { label: '线索', value: 'LEAD' }
  ]
  const categoryOptions = [
    { label: '图片', value: 'IMAGE' },
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
  const selectedRows = ref<FileAssetItem[]>([])
  const tableRef = ref()
  const pagination = reactive({ current: 1, size: 20, total: 0 })
  const search = reactive<Api.SystemManage.FileAssetSearchParams>({
    current: 1,
    size: 20,
    status: ''
  })
  const form = reactive<Partial<FileAssetItem>>({
    categoryCode: 'IMAGE',
    categoryName: '图片',
    storageType: 'LOCAL',
    status: 'ACTIVE'
  })

  onMounted(loadData)

  async function loadData() {
    loading.value = true
    try {
      const result = await fetchGetFileAssetList(cleanSearchParams({
        ...search,
        current: pagination.current,
        size: pagination.size
      }))
      list.value = result.records || []
      pagination.total = result.total || 0
      clearSelection()
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
      categoryCode: 'IMAGE',
      categoryName: '图片',
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
    if (row) Object.assign(form, pickFields(row, FILE_FORM_FIELDS))
    dialogVisible.value = true
  }

  function syncCategoryName(value: string) {
    form.categoryName =
      categoryOptions.find((item) => item.value === value)?.label || form.categoryName || value
  }

  function beforeImageUpload(file: File) {
    const isImage = file.type.startsWith('image/')
    const isLtLimit = file.size / 1024 / 1024 <= MAX_IMAGE_SIZE

    if (!isImage) {
      ElMessage.warning('只能上传图片文件')
      return false
    }

    if (!isLtLimit) {
      ElMessage.warning(`图片大小不能超过 ${MAX_IMAGE_SIZE}MB`)
      return false
    }

    return true
  }

  function handleImageUploadSuccess(response: UploadImageResponse) {
    if (response?.code !== 200 || !response.data) {
      ElMessage.error(response?.msg || '图片上传失败')
      return
    }

    applyUploadedImage(response.data)
    ElMessage.success('图片上传成功')
  }

  function handleImageUploadError() {
    ElMessage.error('图片上传失败')
  }

  function applyUploadedImage(file: Api.SystemManage.UploadImageResult) {
    Object.assign(form, {
      fileName: file.fileName,
      fileUrl: file.url,
      objectKey: file.objectKey,
      mimeType: file.mimeType,
      fileExt: file.fileExt,
      fileSize: file.fileSize,
      storageType: file.storageType,
      uploadedBy: file.uploadedBy,
      categoryCode: form.categoryCode || 'IMAGE',
      categoryName: form.categoryName || '图片',
      status: form.status || 'ACTIVE'
    })
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

  function handleSelectionChange(rows: FileAssetItem[]) {
    selectedRows.value = rows
  }

  function clearSelection() {
    selectedRows.value = []
    tableRef.value?.clearSelection?.()
  }

  async function batchDeleteFiles() {
    const ids = selectedRows.value.map((row) => row.id)
    if (!ids.length) {
      ElMessage.warning('请先选择要删除的文件')
      return
    }

    await ElMessageBox.confirm(`确认删除选中的 ${ids.length} 个文件？`, '批量删除确认', {
      type: 'warning'
    })
    const result = await fetchBatchDeleteFileAssets(ids)
    ElMessage.success(`已删除 ${result.count} 个文件`)
    await loadData()
  }

  function openFile(row: FileAssetItem) {
    if (!row.fileUrl) {
      ElMessage.warning('文件地址为空')
      return
    }
    window.open(resolveFileUrl(row.fileUrl), '_blank')
  }

  function cleanPayload(source: Partial<FileAssetItem>) {
    const payload: Record<string, unknown> = {}
    for (const key of FILE_SAVE_FIELDS) {
      const value = source[key]
      if (value === undefined || value === null || value === '') continue
      payload[key] = value
    }

    if (!payload.businessType || !payload.businessId) {
      delete payload.businessType
      delete payload.businessId
    }

    return payload
  }

  function pickFields<T extends object, K extends readonly string[]>(source: T, fields: K) {
    const result: Record<string, unknown> = {}
    for (const key of fields) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        result[key] = (source as Record<string, unknown>)[key]
      }
    }
    return result
  }

  function cleanSearchParams(source: Api.SystemManage.FileAssetSearchParams) {
    const params: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(source)) {
      if (value === undefined || value === null || value === '') continue
      params[key] = value
    }
    return params as Api.SystemManage.FileAssetSearchParams
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

  function isImageFile(row: Partial<FileAssetItem>) {
    const mimeType = row.mimeType || ''
    const ext = (row.fileExt || row.fileName?.split('.').pop() || '').toLowerCase()
    return mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)
  }

  function resolveFileUrl(fileUrl?: string) {
    if (!fileUrl) return ''
    if (/^(https?:)?\/\//.test(fileUrl) || fileUrl.startsWith('data:') || fileUrl.startsWith('blob:')) {
      return fileUrl
    }
    return fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`
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

    .file-thumb {
      width: 44px;
      height: 44px;
      border-radius: 4px;
      vertical-align: middle;
      cursor: zoom-in;
    }

    .file-empty {
      color: var(--el-text-color-placeholder);
    }

    .image-uploader {
      :deep(.el-upload) {
        width: 160px;
        height: 112px;
        overflow: hidden;
        border: 1px dashed var(--el-border-color);
        border-radius: 6px;
        background: var(--el-fill-color-lighter);
      }
    }

    .upload-preview,
    .upload-placeholder {
      width: 160px;
      height: 112px;
    }

    .upload-preview {
      display: block;
      object-fit: cover;
    }

    .upload-placeholder {
      display: flex;
      flex-direction: column;
      gap: 8px;
      align-items: center;
      justify-content: center;
      color: var(--el-text-color-secondary);
      font-size: 13px;
    }

    .upload-icon {
      font-size: 28px;
      color: var(--el-color-primary);
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
