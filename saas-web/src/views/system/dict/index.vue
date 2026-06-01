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

          <ElTable
            v-loading="typeLoading"
            :data="typeList"
            row-key="id"
            highlight-current-row
            height="calc(100vh - 340px)"
            @row-click="selectType"
          >
            <ElTableColumn prop="name" label="名称" min-width="120" show-overflow-tooltip />
            <ElTableColumn prop="code" label="编码" min-width="130" show-overflow-tooltip />
            <ElTableColumn prop="itemCount" label="项" width="60" />
            <ElTableColumn prop="status" label="状态" width="80">
              <template #default="{ row }">
                <ElTag :type="row.status === 'ACTIVE' ? 'success' : 'info'">
                  {{ statusLabel(row.status) }}
                </ElTag>
              </template>
            </ElTableColumn>
            <ElTableColumn label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <ElButton link type="primary" @click.stop="openTypeDialog(row)">编辑</ElButton>
                <ElButton link type="danger" @click.stop="deleteType(row)">删除</ElButton>
              </template>
            </ElTableColumn>
          </ElTable>

          <ElPagination
            v-model:current-page="typePagination.current"
            v-model:page-size="typePagination.size"
            class="dict-pagination"
            layout="prev, pager, next"
            :total="typePagination.total"
            @current-change="loadTypes"
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

          <ElTable
            v-loading="dataLoading"
            :data="dataList"
            row-key="id"
            height="calc(100vh - 340px)"
            empty-text="请选择左侧字典类型"
          >
            <ElTableColumn prop="label" label="标签" min-width="130" show-overflow-tooltip />
            <ElTableColumn prop="value" label="值" min-width="130" show-overflow-tooltip />
            <ElTableColumn prop="sort" label="排序" width="80" />
            <ElTableColumn prop="status" label="状态" width="90">
              <template #default="{ row }">
                <ElTag :type="row.status === 'ACTIVE' ? 'success' : 'info'">
                  {{ statusLabel(row.status) }}
                </ElTag>
              </template>
            </ElTableColumn>
            <ElTableColumn prop="remark" label="备注" min-width="150" show-overflow-tooltip />
            <ElTableColumn label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <ElButton link type="primary" @click="openDataDialog(row)">编辑</ElButton>
                <ElButton link type="danger" @click="deleteData(row)">删除</ElButton>
              </template>
            </ElTableColumn>
          </ElTable>

          <ElPagination
            v-model:current-page="dataPagination.current"
            v-model:page-size="dataPagination.size"
            class="dict-pagination"
            layout="prev, pager, next"
            :total="dataPagination.total"
            @current-change="loadData"
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
  import { ElMessage, ElMessageBox } from 'element-plus'

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

  const typeDialogVisible = ref(false)
  const dataDialogVisible = ref(false)
  const typeForm = reactive<Partial<DictTypeItem>>({ status: 'ACTIVE' })
  const dataForm = reactive<Partial<DictDataItem>>({ status: 'ACTIVE', sort: 0 })

  onMounted(() => {
    loadTypes()
  })

  function statusLabel(value: string) {
    return statusOptions.find((item) => item.value === value)?.label || value
  }

  async function loadTypes() {
    typeLoading.value = true
    try {
      const result = await fetchGetDictTypeList({
        current: typePagination.current,
        size: typePagination.size,
        ...typeSearch
      })
      typeList.value = result.records
      typePagination.total = result.total
      if (!selectedType.value && result.records.length) {
        selectType(result.records[0])
      } else if (selectedType.value) {
        const latest = result.records.find((item) => item.id === selectedType.value?.id)
        if (latest) selectedType.value = latest
      }
    } finally {
      typeLoading.value = false
    }
  }

  async function loadData() {
    if (!selectedType.value) {
      dataList.value = []
      dataPagination.total = 0
      return
    }
    dataLoading.value = true
    try {
      const result = await fetchGetDictDataList({
        current: dataPagination.current,
        size: dataPagination.size,
        typeId: selectedType.value.id,
        ...dataSearch
      })
      dataList.value = result.records
      dataPagination.total = result.total
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
    Object.assign(typeForm, row || { id: undefined, name: '', code: '', status: 'ACTIVE', remark: '' })
    typeDialogVisible.value = true
  }

  function openDataDialog(row?: DictDataItem) {
    if (!selectedType.value) return
    Object.assign(dataForm, row || { id: undefined, label: '', value: '', sort: 0, status: 'ACTIVE', remark: '' })
    dataDialogVisible.value = true
  }

  async function submitType() {
    if (!typeForm.name || !typeForm.code) {
      ElMessage.warning('请填写字典名称和编码')
      return
    }
    submitting.value = true
    try {
      const payload = {
        name: typeForm.name,
        code: typeForm.code,
        status: typeForm.status || 'ACTIVE',
        remark: typeForm.remark || ''
      }
      if (typeForm.id) await fetchUpdateDictType(typeForm.id, payload)
      else await fetchCreateDictType(payload)
      typeDialogVisible.value = false
      await loadTypes()
    } finally {
      submitting.value = false
    }
  }

  async function submitData() {
    if (!selectedType.value) return
    if (!dataForm.label || !dataForm.value) {
      ElMessage.warning('请填写字典标签和值')
      return
    }
    submitting.value = true
    try {
      const payload = {
        typeId: selectedType.value.id,
        label: dataForm.label,
        value: dataForm.value,
        sort: dataForm.sort || 0,
        status: dataForm.status || 'ACTIVE',
        remark: dataForm.remark || ''
      }
      if (dataForm.id) await fetchUpdateDictData(dataForm.id, payload)
      else await fetchCreateDictData(payload)
      dataDialogVisible.value = false
      await Promise.all([loadTypes(), loadData()])
    } finally {
      submitting.value = false
    }
  }

  async function deleteType(row: DictTypeItem) {
    await ElMessageBox.confirm(`确定删除字典类型“${row.name}”吗？其字典项会一并删除。`, '删除确认', {
      type: 'warning'
    })
    await fetchDeleteDictType(row.id)
    if (selectedType.value?.id === row.id) {
      selectedType.value = null
      dataList.value = []
      dataPagination.total = 0
    }
    await loadTypes()
  }

  async function deleteData(row: DictDataItem) {
    await ElMessageBox.confirm(`确定删除字典项“${row.label}”吗？`, '删除确认', {
      type: 'warning'
    })
    await fetchDeleteDictData(row.id)
    await Promise.all([loadTypes(), loadData()])
  }
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
    }

    .dict-pagination {
      justify-content: flex-end;
      margin-top: 12px;
    }
  }
</style>
