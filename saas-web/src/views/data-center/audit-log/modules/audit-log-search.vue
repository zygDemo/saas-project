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
  interface SearchForm {
    keyword: string
    module: string
    action: string
    userName: string
    status: string
  }

  interface Props {
    modelValue: SearchForm
  }

  interface Emits {
    (e: 'update:modelValue', value: SearchForm): void
    (e: 'search', params: SearchForm): void
    (e: 'reset'): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const searchBarRef = ref()

  // 表单数据双向绑定
  const formData = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  // 校验规则
  const rules = {}

  // HTTP 方法选项
  const methodOptions = [
    { label: 'GET', value: 'GET' },
    { label: 'POST', value: 'POST' },
    { label: 'PUT', value: 'PUT' },
    { label: 'PATCH', value: 'PATCH' },
    { label: 'DELETE', value: 'DELETE' }
  ]

  // 状态选项
  const statusOptions = [
    { label: '成功 (2xx)', value: 'success' },
    { label: '失败 (4xx/5xx)', value: 'fail' }
  ]

  // 模块选项（常用模块）
  const moduleOptions = [
    { label: '用户管理', value: 'user' },
    { label: '角色管理', value: 'role' },
    { label: '菜单管理', value: 'menu' },
    { label: '机构管理', value: 'org' },
    { label: '部门管理', value: 'dept' },
    { label: '产品配置', value: 'product' },
    { label: '资方配置', value: 'funder' },
    { label: '客户管理', value: 'customer' },
    { label: '进件管理', value: 'application' },
    { label: '数据中心', value: 'data-center' },
    { label: '认证授权', value: 'auth' },
    { label: '字典管理', value: 'dict' },
    { label: '文件管理', value: 'file' }
  ]

  // 表单配置
  const formItems = computed(() => [
    {
      label: '关键字',
      key: 'keyword',
      type: 'input',
      placeholder: '搜索描述、IP等',
      clearable: true
    },
    {
      label: '状态',
      key: 'status',
      type: 'select',
      props: {
        placeholder: '请选择状态',
        clearable: true,
        options: statusOptions
      }
    },
    {
      label: '模块',
      key: 'module',
      type: 'select',
      props: {
        placeholder: '请选择模块',
        clearable: true,
        filterable: true,
        options: moduleOptions
      }
    },
    {
      label: '方法',
      key: 'action',
      type: 'select',
      props: {
        placeholder: '请选择方法',
        clearable: true,
        options: methodOptions
      }
    },
    {
      label: '用户',
      key: 'userName',
      type: 'input',
      placeholder: '请输入用户名',
      clearable: true
    }
  ])

  // 事件
  function handleReset() {
    emit('reset')
  }

  async function handleSearch(params: Record<string, unknown>) {
    await searchBarRef.value.validate()
    emit('search', params as SearchForm)
  }
</script>
