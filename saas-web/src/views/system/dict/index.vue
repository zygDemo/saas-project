<template>
  <div class="dict-page art-full-height">
    <ElRow :gutter="12" class="dict-layout">
      <ElCol :xs="24" :lg="10" class="dict-layout__col">
        <ElCard class="art-table-card dict-panel">
          <template #header>
            <div class="dict-panel__header">
              <div>
                <h3>字典类型</h3>
                <p>维护业务枚举分类</p>
              </div>
              <ElButton type="primary" @click="openTypeDialog()">新增类型</ElButton>
            </div>
          </template>

          <ElForm :model="typeSearch" class="dict-search" inline>
            <ElFormItem label="名称">
              <ElInput v-model="typeSearch.name" clearable placeholder="字典名称" />
            </ElFormItem>
            <ElFormItem label="编码">
              <ElInput v-model="typeSearch.code" clearable placeholder="字典编码" />
            </ElFormItem>
            <ElFormItem>
              <ElButton type="primary" @click="loadTypes">查询</ElButton>
              <ElButton @click="resetTypeSearch">重置</ElButton>
            </ElFormItem>
          </ElForm>

          <ArtTable
            :loading="typeLoading"
            :data="typeList"
            :columns="typeColumns"
            :pagination="typePagination"
            highlight-current-row
            @row-click="selectType"
            @pagination:current-change="handleTypePageChange"
          />
        </ElCard>
      </ElCol>

      <ElCol :xs="24" :lg="14" class="dict-layout__col">
        <ElCard class="art-table-card dict-panel">
          <template #header>
            <div class="dict-panel__header">
              <div>
                <h3>字典项</h3>
                <p>{{ selectedType ? `${selectedType.name}（${selectedType.code}）` : '请选择字典类型' }}</p>
              </div>
              <ElButton type="primary" :disabled="!selectedType" @click="openDataDialog()">新增字典项</ElButton>
            </div>
          </template>

          <ElForm :model="dataSearch" class="dict-search" inline>
            <ElFormItem label="标签">
              <ElInput v-model="dataSearch.label" clearable placeholder="字典标签" :disabled="!selectedType" />
            </ElFormItem>
            <ElFormItem label="值">
              <ElInput v-model="dataSearch.value" clearable placeholder="字典值" :disabled="!selectedType" />
            </ElFormItem>
            <ElFormItem>
              <ElButton type="primary" :disabled="!selectedType" @click="loadData">查询</ElButton>
              <ElButton :disabled="!selectedType" @click="resetDataSearch">重置</ElButton>
            </ElFormItem>
          </ElForm>

          <ArtTable
            :loading="dataLoading"
            :data="dataList"
            :columns="dataColumns"
            :pagination="dataPagination"
            empty-text="请选择左侧字典类型"
            @pagination:current-change="handleDataPageChange"
          />
        </ElCard>
      </ElCol>
    </ElRow>

    <ElDialog v-model="typeDialogVisible" :title="typeForm.id ? '编辑字典类型' : '新增字典类型'" width="520px">
      <ElForm label-width="90px" :model="typeForm">
        <ElFormItem label="名称" required>
          <ElInput v-model="typeForm.name" placeholder="请输入字典名称" />
        </ElFormItem>
        <ElFormItem label="编码" required>
          <ElInput v-model="typeForm.code" placeholder="如：lead_source" />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSelect v-model="typeForm.status" style="width: 100%">
            <ElOption v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="备注">
          <ElInput v-model="typeForm.remark" type="textarea" :rows="3" placeholder="可选" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="typeDialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="submitting" @click="submitType">保存</ElButton>
      </template>
    </ElDialog>

    <ElDialog v-model="dataDialogVisible" :title="dataForm.id ? '编辑字典项' : '新增字典项'" width="520px">
      <ElForm label-width="90px" :model="dataForm">
        <ElFormItem label="所属类型">
          <ElInput :model-value="selectedType?.name || ''" disabled />
        </ElFormItem>
        <ElFormItem label="标签" required>
          <ElInput v-model="dataForm.label" placeholder="请输入字典标签" />
        </ElFormItem>
        <ElFormItem label="值" required>
          <ElInput v-model="dataForm.value" placeholder="请输入字典值" />
        </ElFormItem>
        <ElFormItem label="排序">
          <ElInputNumber v-model="dataForm.sort" :min="0" controls-position="right" style="width: 100%" />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSelect v-model="dataForm.status" style="width: 100%">
            <ElOption v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="备注">
          <ElInput v-model="dataForm.remark" type="textarea" :rows="3" placeholder="可选" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="dataDialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="submitting" @click="submitData">保存</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import {
    fetchCreateDictData,
    fetchCreateDictType,
    fetchDeleteDictData,
    fetchDeleteDictType,
    fetchGetDictDataList,
    fetchGetDictTypeList,
    fetchUpdateDictData,
    fetchUpdateDictType
  } from '@/api/system-manage'
  import { ElMessage, ElMessageBox, ElTag, ElButton } from 'element-plus'

  defineOptions({ name: 'DictMgmt' })

  type DictTypeItem = Api.SystemManage.DictTypeItem
  type DictDataItem = Api.SystemManage.DictDataItem

  const statusOptions = [
    { label: '启用', value: 'ACTIVE' },
    { label: '停用', value: 'INACTIVE' }
  ]

  const typeLoading = ref(false)
  const dataLoading = ref(false)
  const submitting = ref(false)
  const typeList = ref<DictTypeItem[]>([])
  const dataList = ref<DictDataItem[]>([])
  const selectedType = ref<DictTypeItem | null>(null)

  const typeSearch = reactive({ name: '', code: '' })
  const dataSearch = reactive({ label: '', value: '' })
  const typePagination = reactive({ current: 1, size: 20, total: 0 })
  const dataPagination = reactive({ current: 1, size: 20, total: 0 })

  const statusLabel = (status: string) => status === 'ACTIVE' ? '启用' : '停用'

  // 字典类型表格列配置
  const typeColumns = computed(() => [
    { prop: 'name', label: '名称', minWidth: 120, showOverflowTooltip: true },
    { prop: 'code', label: '编码', minWidth: 130, showOverflowTooltip: true },
    { prop: 'itemCount', label: '项', width: 60 },
    {
      prop: 'status',
      label: '状态',
      width: 80,
      formatter: (row: DictTypeItem) =>
        h(ElTag, { type: row.status === 'ACTIVE' ? 'success' : 'info' }, () => statusLabel(row.status))
    },
    {
      prop: 'operation',
      label: '操作',
      width: 120,
      fixed: 'right',
      formatter: (row: DictTypeItem) =>
        h('div', [
          h(ElButton, { link: true, type: 'primary', onClick: () => openTypeDialog(row) }, () => '编辑'),
          h(ElButton, { link: true, type: 'danger', onClick: () => deleteType(row) }, () => '删除')
        ])
    }
  ])

  // 字典项表格列配置
  const dataColumns = computed(() => [
    { prop: 'label', label: '标签', minWidth: 130, showOverflowTooltip: true },
    { prop: 'value', label: '值', minWidth: 130, showOverflowTooltip: true },
    { prop: 'sort', label: '排序', width: 80 },
    {
      prop: 'status',
      label: '状态',
      width: 90,
      formatter: (row: DictDataItem) =>
        h(ElTag, { type: row.status === 'ACTIVE' ? 'success' : 'info' }, () => statusLabel(row.status))
    },
    { prop: 'remark', label: '备注', minWidth: 150, showOverflowTooltip: true },
    {
      prop: 'operation',
      label: '操作',
      width: 120,
      fixed: 'right',
      formatter: (row: DictDataItem) =>
        h('div', [
          h(ElButton, { link: true, type: 'primary', onClick: () => openDataDialog(row) }, () => '编辑'),
          h(ElButton, { link: true, type: 'danger', onClick: () => deleteData(row) }, () => '删除')
        ])
    }
  ])

  // 字典类型弹窗
  const typeDialogVisible = ref(false)
  const typeForm = reactive({ id: 0, name: '', code: '', status: 'ACTIVE', remark: '' })

  // 字典项弹窗
  const dataDialogVisible = ref(false)
  const dataForm = reactive({ id: 0, label: '', value: '', sort: 0, status: 'ACTIVE', remark: '' })

  const handleTypePageChange = (page: number) => {
    typePagination.current = page
    loadTypes()
  }

  const handleDataPageChange = (page: number) => {
    dataPagination.current = page
    loadData()
  }

  async function loadTypes() {
    typeLoading.value = true
    try {
      const res = await fetchGetDictTypeList({
        current: typePagination.current,
        size: typePagination.size,
        ...typeSearch
      })
      typeList.value = res.records || []
      typePagination.total = res.total || 0
    } finally {
      typeLoading.value = false
    }
  }

  async function loadData() {
    if (!selectedType.value) return
    dataLoading.value = true
    try {
      const res = await fetchGetDictDataList({
        current: dataPagination.current,
        size: dataPagination.size,
        typeId: selectedType.value.id,
        ...dataSearch
      })
      dataList.value = res.records || []
      dataPagination.total = res.total || 0
    } finally {
      dataLoading.value = false
    }
  }

  function selectType(row: DictTypeItem) {
    selectedType.value = row
    dataPagination.current = 1
    loadData()
  }

  function resetTypeSearch() {
    typeSearch.name = ''
    typeSearch.code = ''
    typePagination.current = 1
    loadTypes()
  }

  function resetDataSearch() {
    dataSearch.label = ''
    dataSearch.value = ''
    dataPagination.current = 1
    loadData()
  }

  function openTypeDialog(row?: DictTypeItem) {
    if (row) {
      Object.assign(typeForm, row)
    } else {
      Object.assign(typeForm, { id: 0, name: '', code: '', status: 'ACTIVE', remark: '' })
    }
    typeDialogVisible.value = true
  }

  function openDataDialog(row?: DictDataItem) {
    if (row) {
      Object.assign(dataForm, row)
    } else {
      Object.assign(dataForm, { id: 0, label: '', value: '', sort: 0, status: 'ACTIVE', remark: '' })
    }
    dataDialogVisible.value = true
  }

  async function submitType() {
    submitting.value = true
    try {
      if (typeForm.id) {
        await fetchUpdateDictType(typeForm.id, typeForm)
        ElMessage.success('更新成功')
      } else {
        await fetchCreateDictType(typeForm)
        ElMessage.success('创建成功')
      }
      typeDialogVisible.value = false
      loadTypes()
    } finally {
      submitting.value = false
    }
  }

  async function submitData() {
    submitting.value = true
    try {
      if (dataForm.id) {
        await fetchUpdateDictData(dataForm.id, dataForm)
        ElMessage.success('更新成功')
      } else {
        await fetchCreateDictData(dataForm)
        ElMessage.success('创建成功')
      }
      dataDialogVisible.value = false
      loadData()
    } finally {
      submitting.value = false
    }
  }

  async function deleteType(row: DictTypeItem) {
    await ElMessageBox.confirm(`确定删除字典类型"${row.name}"吗？`, '删除确认', { type: 'warning' })
    await fetchDeleteDictType(row.id)
    ElMessage.success('删除成功')
    if (selectedType.value?.id === row.id) {
      selectedType.value = null
      dataList.value = []
    }
    loadTypes()
  }

  async function deleteData(row: DictDataItem) {
    await ElMessageBox.confirm(`确定删除字典项"${row.label}"吗？`, '删除确认', { type: 'warning' })
    await fetchDeleteDictData(row.id)
    ElMessage.success('删除成功')
    loadData()
  }

  onMounted(() => {
    loadTypes()
  })
</script>

<style scoped lang="scss">
  .dict-page {
    .dict-layout,
    .dict-layout__col {
      height: 100%;
    }

    .dict-panel {
      height: 100%;
    }

    .dict-panel__header {
      display: flex;
      gap: 12px;
      align-items: center;
      justify-content: space-between;

      h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
      }

      p {
        margin: 4px 0 0;
        font-size: 13px;
        color: var(--el-text-color-secondary);
      }
    }

    .dict-search {
      margin-bottom: 12px;

      :deep(.el-form-item) {
        margin-bottom: 0;
      }
    }

    .dict-pagination {
      display: flex;
      justify-content: flex-end;
      margin-top: 12px;
    }
  }
</style>
