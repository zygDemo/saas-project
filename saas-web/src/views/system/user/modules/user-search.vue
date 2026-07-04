<template>
  <ArtSearchBar
    ref="searchBarRef"
    v-model="formData"
    :items="formItems"
    :rules="rules"
    @reset="handleReset"
    @search="handleSearch"
  >
  </ArtSearchBar>
</template>

<script setup lang="ts">
  import { fetchBusinessList } from '@/api/business'

  interface Props {
    modelValue: Api.SystemManage.UserSearchParams
  }
  interface Emits {
    (e: 'update:modelValue', value: Api.SystemManage.UserSearchParams): void
    (e: 'search', params: Api.SystemManage.UserSearchParams): void
    (e: 'reset'): void
  }
  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  // 表单数据双向绑定
  const searchBarRef = ref()
  const formData = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  // 校验规则
  const rules = {
    // userName: [{ required: true, message: '请输入用户名', trigger: 'blur' }]
  }

  // 动态 options
  const statusOptions = ref<{ label: string; value: string; disabled?: boolean }[]>([])
  const orgOptions = ref<{ label: string; value: number }[]>([])
  const deptOptions = ref<{ label: string; value: number }[]>([])

  // 模拟接口返回状态数据
  function fetchStatusOptions(): Promise<typeof statusOptions.value> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { label: '在线', value: '1' },
          { label: '离线', value: '2' },
          { label: '异常', value: '3' },
          { label: '注销', value: '4' }
        ])
      }, 1000)
    })
  }

  onMounted(async () => {
    statusOptions.value = await fetchStatusOptions()
    const orgRes = await fetchBusinessList('org', { current: 1, size: 200, status: 'ACTIVE' })
    orgOptions.value = orgRes.records.map((item: Record<string, unknown>) => ({ label: item.name, value: item.id }))
  })

  watch(
    () => formData.value.orgId,
    async (orgId) => {
      formData.value.deptId = undefined
      if (!orgId) {
        deptOptions.value = []
        return
      }
      const deptRes = await fetchBusinessList('dept', { current: 1, size: 200, orgId })
      deptOptions.value = deptRes.records.map((item: Record<string, unknown>) => ({ label: item.name, value: item.id }))
    }
  )

  // 表单配置
  const formItems = computed(() => [
    {
      label: '用户名',
      key: 'userName',
      type: 'input',
      placeholder: '请输入用户名',
      clearable: true
    },
    {
      label: '手机号',
      key: 'userPhone',
      type: 'input',
      props: { placeholder: '请输入手机号', maxlength: '11' }
    },
    {
      label: '邮箱',
      key: 'userEmail',
      type: 'input',
      props: { placeholder: '请输入邮箱' }
    },
    {
      label: '状态',
      key: 'status',
      type: 'select',
      props: {
        placeholder: '请选择状态',
        options: statusOptions.value
      }
    },
    {
      label: '机构',
      key: 'orgId',
      type: 'select',
      props: {
        placeholder: '请选择机构',
        clearable: true,
        filterable: true,
        options: orgOptions.value
      }
    },
    {
      label: '部门',
      key: 'deptId',
      type: 'select',
      props: {
        placeholder: '请选择部门',
        clearable: true,
        filterable: true,
        disabled: !formData.value.orgId,
        options: deptOptions.value
      }
    },
    {
      label: '性别',
      key: 'userGender',
      type: 'radiogroup',
      props: {
        options: [
          { label: '男', value: '1' },
          { label: '女', value: '2' }
        ]
      }
    }
  ])

  // 事件
  function handleReset() {
    console.log('重置表单')
    emit('reset')
  }

  async function handleSearch(params: Api.SystemManage.UserSearchParams) {
    await searchBarRef.value.validate()
    emit('search', params)
    console.log('表单数据', params)
  }
</script>
