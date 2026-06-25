<template>
  <div class="sys-param-page art-full-height">
    <ElCard class="art-table-card">
      <template #header>
        <div class="card-header">
          <div>
            <h3>系统参数</h3>
            <p>管理系统配置项，支持按分组归类</p>
          </div>
          <ElButton v-auth="'add'" type="primary" @click="openDialog()">
            <ElIcon class="mr-1"><Plus /></ElIcon>新增参数
          </ElButton>
        </div>
      </template>

      <!-- 搜索栏 -->
      <ElForm :model="searchForm" class="search-form" inline>
        <ElFormItem label="分组">
          <ElInput v-model="searchForm.group" clearable placeholder="参数分组" style="width:140px" />
        </ElFormItem>
        <ElFormItem label="名称">
          <ElInput v-model="searchForm.name" clearable placeholder="参数名称" style="width:160px" />
        </ElFormItem>
        <ElFormItem label="键">
          <ElInput v-model="searchForm.key" clearable placeholder="参数键" style="width:160px" />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSelect v-model="searchForm.status" clearable placeholder="全部" style="width:110px">
            <ElOption label="启用" value="ACTIVE" />
            <ElOption label="停用" value="INACTIVE" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem>
          <ElButton type="primary" @click="loadData">查询</ElButton>
          <ElButton @click="resetSearch">重置</ElButton>
        </ElFormItem>
      </ElForm>

      <!-- 表格 -->
      <ArtTable
        :loading="loading"
        :data="records"
        :columns="columns"
        :pagination="pagination"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      />
    </ElCard>

    <!-- 新增/编辑弹窗 -->
    <ElDialog v-model="dialogVisible" :title="form.id ? '编辑参数' : '新增参数'" width="560px">
      <ElForm ref="formRef" :model="form" :rules="rules" label-width="90px">
        <ElFormItem label="参数分组">
          <ElInput v-model="form.group" placeholder="如 basic / security / sms" />
        </ElFormItem>
        <ElFormItem label="参数名称" prop="name">
          <ElInput v-model="form.name" placeholder="请输入参数名称" />
        </ElFormItem>
        <ElFormItem label="参数键" prop="key">
          <ElInput v-model="form.key" placeholder="如 sys.name" :disabled="!!form.id" />
        </ElFormItem>
        <ElFormItem label="参数值">
          <ElInput v-model="form.value" type="textarea" :rows="3" placeholder="请输入参数值" />
        </ElFormItem>
        <ElFormItem label="值类型">
          <ElSelect v-model="form.type" style="width: 100%">
            <ElOption label="字符串" value="STRING" />
            <ElOption label="数字" value="NUMBER" />
            <ElOption label="布尔" value="BOOLEAN" />
            <ElOption label="JSON" value="JSON" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSelect v-model="form.status" style="width: 100%">
            <ElOption label="启用" value="ACTIVE" />
            <ElOption label="停用" value="INACTIVE" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="备注">
          <ElInput v-model="form.remark" type="textarea" :rows="2" placeholder="可选" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="submitting" @click="handleSubmit">保存</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import {
    fetchGetSystemParamList,
    fetchCreateSystemParam,
    fetchUpdateSystemParam,
    fetchDeleteSystemParam
  } from '@/api/system-manage'
  import { ElMessage, ElMessageBox, ElTag, ElButton, Plus } from 'element-plus'
  import type { FormInstance, FormRules } from 'element-plus'

  defineOptions({ name: 'SystemParam' })

  type ParamItem = Api.SystemManage.SystemParamItem

  const loading = ref(false)
  const submitting = ref(false)
  const records = ref<ParamItem[]>([])
  const dialogVisible = ref(false)
  const formRef = ref<FormInstance>()

  const searchForm = reactive({ group: '', name: '', key: '', status: '' })
  const pagination = reactive({ current: 1, size: 20, total: 0 })

  const form = reactive({
    id: 0,
    group: '',
    name: '',
    key: '',
    value: '',
    type: 'STRING',
    status: 'ACTIVE',
    remark: ''
  })

  const rules: FormRules = {
    name: [{ required: true, message: '请输入参数名称', trigger: 'blur' }],
    key: [{ required: true, message: '请输入参数键', trigger: 'blur' }]
  }

  const typeLabel = (t: string) => ({ STRING: '字符串', NUMBER: '数字', BOOLEAN: '布尔', JSON: 'JSON' }[t] || t)

  const columns = computed(() => [
    { prop: 'group', label: '分组', width: 100, showOverflowTooltip: true },
    { prop: 'name', label: '名称', minWidth: 140, showOverflowTooltip: true },
    { prop: 'key', label: '参数键', minWidth: 160, showOverflowTooltip: true },
    { prop: 'value', label: '值', minWidth: 180, showOverflowTooltip: true },
    { prop: 'type', label: '类型', width: 80, formatter: (row: ParamItem) => h('span', typeLabel(row.type)) },
    {
      prop: 'status',
      label: '状态',
      width: 80,
      formatter: (row: ParamItem) =>
        h(ElTag, { type: row.status === 'ACTIVE' ? 'success' : 'info' }, () =>
          row.status === 'ACTIVE' ? '启用' : '停用'
        )
    },
    { prop: 'createTime', label: '创建时间', width: 160 },
    {
      prop: 'operation',
      label: '操作',
      width: 140,
      fixed: 'right' as const,
      formatter: (row: ParamItem) =>
        h('div', [
          h(ElButton, { link: true, type: 'primary', onClick: () => openDialog(row) }, () => '编辑'),
          h(ElButton, { link: true, type: 'danger', onClick: () => handleDelete(row) }, () => '删除')
        ])
    }
  ])

  async function loadData() {
    loading.value = true
    try {
      const res = await fetchGetSystemParamList({
        ...searchForm,
        current: pagination.current,
        size: pagination.size
      })
      records.value = res.records
      pagination.total = res.total
    } finally {
      loading.value = false
    }
  }

  function resetSearch() {
    Object.assign(searchForm, { group: '', name: '', key: '', status: '' })
    pagination.current = 1
    loadData()
  }

  function handleSizeChange(size: number) {
    pagination.size = size
    pagination.current = 1
    loadData()
  }

  function handleCurrentChange(page: number) {
    pagination.current = page
    loadData()
  }

  function openDialog(row?: ParamItem) {
    if (row) {
      Object.assign(form, {
        id: row.id,
        group: row.group || '',
        name: row.name,
        key: row.key,
        value: row.value || '',
        type: row.type,
        status: row.status,
        remark: row.remark || ''
      })
    } else {
      Object.assign(form, { id: 0, group: '', name: '', key: '', value: '', type: 'STRING', status: 'ACTIVE', remark: '' })
    }
    dialogVisible.value = true
  }

  async function handleSubmit() {
    const valid = await formRef.value?.validate().catch(() => false)
    if (!valid) return
    submitting.value = true
    try {
      const payload = { ...form }
      if (form.id) {
        await fetchUpdateSystemParam(form.id, payload)
      } else {
        await fetchCreateSystemParam(payload)
      }
      dialogVisible.value = false
      loadData()
    } finally {
      submitting.value = false
    }
  }

  async function handleDelete(row: ParamItem) {
    await ElMessageBox.confirm(, '提示', { type: 'warning' })
    await fetchDeleteSystemParam(row.id)
    loadData()
  }

  onMounted(loadData)
</script>

<style scoped>
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .card-header h3 {
    margin: 0;
    font-size: 16px;
  }
  .card-header p {
    margin: 4px 0 0;
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }
  .search-form {
    margin-bottom: 16px;
  }
</style>
