<template>
  <ElDialog
    v-model="visible"
    :title="dialogType === 'add' ? '新增角色' : '编辑角色'"
    width="480px"
    align-center
    @close="handleClose"
  >
    <ElForm ref="formRef" :model="form" :rules="rules" label-width="120px">
      <ElFormItem label="角色名称" prop="roleName">
        <ElInput v-model="form.roleName" placeholder="请输入角色名称" />
      </ElFormItem>
      <ElFormItem label="角色编码" prop="roleCode">
        <ElInput v-model="form.roleCode" placeholder="请输入角色编码" />
      </ElFormItem>
      <ElFormItem label="描述" prop="description">
        <ElInput
          v-model="form.description"
          type="textarea"
          :rows="3"
          placeholder="请输入角色描述"
        />
      </ElFormItem>
      <ElFormItem label="数据范围" prop="dataScope">
        <ElSelect v-model="form.dataScope" placeholder="请选择数据范围" style="width: 100%">
          <ElOption label="全部数据" value="ALL" />
          <ElOption label="本部门及下级" value="DEPT" />
          <ElOption label="仅自己" value="SELF" />
          <ElOption label="自定义部门" value="CUSTOM" />
        </ElSelect>
        <div class="data-scope-tip">{{ dataScopeTip }}</div>
      </ElFormItem>
      <ElFormItem v-if="form.dataScope === 'CUSTOM'" label="选择部门">
        <ElTree
          ref="deptTreeRef"
          :data="deptTree"
          show-checkbox
          node-key="id"
          default-expand-all
          :props="{ children: 'children', label: 'name' }"
          style="
            width: 100%;
            max-height: 240px;
            overflow-y: auto;
            border: 1px solid #dcdfe6;
            border-radius: 4px;
            padding: 8px;
          "
        />
      </ElFormItem>
      <ElFormItem label="启用">
        <ElSwitch v-model="form.enabled" />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton @click="handleClose">取消</ElButton>
      <ElButton type="primary" :loading="submitting" @click="handleSubmit">提交</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import {
    fetchCreateRole,
    fetchUpdateRole,
    fetchGetRoleDataScope,
    fetchSaveRoleDataScope,
    fetchGetDeptTree
  } from '@/api/system-manage'
  import type { FormInstance, FormRules } from 'element-plus'

  type RoleListItem = Api.SystemManage.RoleListItem
  type DeptTreeNode = Api.SystemManage.DeptTreeNode

  interface Props {
    modelValue: boolean
    dialogType: 'add' | 'edit'
    roleData?: RoleListItem
  }

  interface Emits {
    (e: 'update:modelValue', value: boolean): void
    (e: 'success'): void
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: false,
    dialogType: 'add',
    roleData: undefined
  })

  const emit = defineEmits<Emits>()

  const formRef = ref<FormInstance>()
  const deptTreeRef = ref()
  const submitting = ref(false)
  const deptTree = ref<DeptTreeNode[]>([])

  const visible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })

  const dataScopeTip = computed(() => {
    const tips: Record<string, string> = {
      ALL: '可查看所有数据',
      DEPT: '可查看本部门及下级部门的数据',
      SELF: '仅可查看自己创建的数据',
      CUSTOM: '可查看指定部门的数据'
    }
    return tips[form.dataScope] || ''
  })

  const rules = reactive<FormRules>({
    roleName: [
      { required: true, message: '请输入角色名称', trigger: 'blur' },
      { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
    ],
    roleCode: [
      { required: true, message: '请输入角色编码', trigger: 'blur' },
      { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
    ],
    description: [{ required: true, message: '请输入角色描述', trigger: 'blur' }]
  })

  const form = reactive({
    roleId: 0,
    roleName: '',
    roleCode: '',
    description: '',
    enabled: true,
    dataScope: 'ALL' as string
  })

  /** 加载部门树 */
  const loadDeptTree = async () => {
    try {
      deptTree.value = await fetchGetDeptTree()
    } catch {
      deptTree.value = []
    }
  }

  /** 加载角色数据权限配置 */
  const loadDataScope = async (roleId: number) => {
    try {
      const data = await fetchGetRoleDataScope(roleId)
      form.dataScope = data.dataScope || 'ALL'
      // 等部门树加载完后再设置选中状态
      await nextTick()
      if (form.dataScope === 'CUSTOM' && data.departmentIds?.length && deptTreeRef.value) {
        deptTreeRef.value.setCheckedKeys(data.departmentIds)
      }
    } catch {
      form.dataScope = 'ALL'
    }
  }

  watch(
    () => props.modelValue,
    async (newVal) => {
      if (newVal) {
        await loadDeptTree()
        await initForm()
      }
    }
  )

  watch(
    () => props.roleData,
    async (newData) => {
      if (newData && props.modelValue) {
        await initForm()
      }
    },
    { deep: true }
  )

  const initForm = async () => {
    if (props.dialogType === 'edit' && props.roleData) {
      Object.assign(form, {
        roleId: props.roleData.roleId,
        roleName: props.roleData.roleName,
        roleCode: props.roleData.roleCode,
        description: props.roleData.description,
        enabled: props.roleData.enabled,
        dataScope: props.roleData.dataScope || 'ALL'
      })
      await loadDataScope(props.roleData.roleId)
    } else {
      Object.assign(form, {
        roleId: 0,
        roleName: '',
        roleCode: '',
        description: '',
        enabled: true,
        dataScope: 'ALL'
      })
      nextTick(() => {
        deptTreeRef.value?.setCheckedKeys([])
      })
    }
  }

  const handleClose = () => {
    visible.value = false
    formRef.value?.resetFields()
    deptTreeRef.value?.setCheckedKeys([])
  }

  const handleSubmit = async () => {
    if (!formRef.value) return

    try {
      submitting.value = true
      await formRef.value.validate()

      // 获取选中的部门 ID
      const departmentIds =
        form.dataScope === 'CUSTOM' && deptTreeRef.value
          ? (deptTreeRef.value.getCheckedKeys() as number[])
          : []

      if (props.dialogType === 'add') {
        const role = await fetchCreateRole({
          roleName: form.roleName,
          roleCode: form.roleCode,
          description: form.description,
          enabled: form.enabled,
          dataScope: form.dataScope,
          departmentIds
        })
        // 如果是 CUSTOM 范围，单独保存数据权限（createRole 已处理，这里保险起见）
        if (form.dataScope === 'CUSTOM' && role?.roleId) {
          await fetchSaveRoleDataScope(role.roleId, { dataScope: form.dataScope, departmentIds })
        }
      } else {
        await fetchUpdateRole(form.roleId, {
          roleName: form.roleName,
          roleCode: form.roleCode,
          description: form.description,
          enabled: form.enabled,
          dataScope: form.dataScope,
          departmentIds
        })
      }

      const message = props.dialogType === 'add' ? '新增成功' : '修改成功'
      ElMessage.success(message)
      emit('success')
      handleClose()
    } catch (error) {
      console.log('表单验证失败:', error)
    } finally {
      submitting.value = false
    }
  }
</script>

<style scoped>
  .data-scope-tip {
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
    line-height: 1.4;
  }
</style>
