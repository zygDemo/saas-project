<template>
  <ElDialog
    v-model="dialogVisible"
    :title="dialogType === 'add' ? '添加用户' : '编辑用户'"
    width="520px"
    align-center
  >
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="84px">
      <ElFormItem label="用户名" prop="userName">
        <ElInput v-model.trim="formData.userName" placeholder="请输入用户名" />
      </ElFormItem>
      <ElFormItem label="昵称" prop="nickName">
        <ElInput v-model.trim="formData.nickName" placeholder="请输入昵称" />
      </ElFormItem>
      <ElFormItem v-if="dialogType === 'add'" label="密码" prop="password">
        <ElInput
          v-model.trim="formData.password"
          type="password"
          show-password
          placeholder="请输入密码"
        />
      </ElFormItem>
      <ElFormItem label="手机号" prop="phone">
        <ElInput v-model.trim="formData.phone" placeholder="请输入手机号" />
      </ElFormItem>
      <ElFormItem label="邮箱" prop="email">
        <ElInput v-model.trim="formData.email" placeholder="请输入邮箱" />
      </ElFormItem>
      <ElFormItem label="性别" prop="gender">
        <ElSelect v-model="formData.gender" class="w-full">
          <ElOption label="男" value="男" />
          <ElOption label="女" value="女" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="状态" prop="status">
        <ElSelect v-model="formData.status" class="w-full">
          <ElOption label="在线" value="1" />
          <ElOption label="离线" value="2" />
          <ElOption label="异常" value="3" />
          <ElOption label="注销" value="4" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="所属机构" prop="orgId">
        <ElSelect
          v-model="formData.orgId"
          class="w-full"
          clearable
          filterable
          :loading="orgLoading"
          placeholder="请选择所属机构"
          @change="handleOrgChange"
        >
          <ElOption
            v-for="org in orgList"
            :key="org.id"
            :value="org.id"
            :label="String(org.name)"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="所属部门" prop="deptId">
        <ElSelect
          v-model="formData.deptId"
          class="w-full"
          clearable
          filterable
          :disabled="!formData.orgId"
          :loading="deptLoading"
          placeholder="请选择所属部门"
        >
          <ElOption
            v-for="dept in deptList"
            :key="dept.id"
            :value="dept.id"
            :label="String(dept.name)"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="角色" prop="roleCodes">
        <ElSelect
          v-model="formData.roleCodes"
          class="w-full"
          multiple
          :loading="roleLoading"
          placeholder="请选择角色"
        >
          <ElOption
            v-for="role in roleList"
            :key="role.roleCode"
            :value="role.roleCode"
            :label="role.roleName"
          />
        </ElSelect>
      </ElFormItem>
    </ElForm>

    <template #footer>
      <div class="dialog-footer">
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="handleSubmit">提交</ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { fetchBusinessList } from '@/api/business'
  import { fetchGetRoleList } from '@/api/system-manage'
  import type { DialogType } from '@/types'
  import type { FormInstance, FormRules } from 'element-plus'

  interface Props {
    visible: boolean
    type: DialogType
    userData?: Partial<Api.SystemManage.UserListItem>
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'submit', value: Api.SystemManage.CreateUserParams): void
  }

  type BusinessOption = {
    id: number
    name: string
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const roleList = ref<Api.SystemManage.RoleListItem[]>([])
  const orgList = ref<BusinessOption[]>([])
  const deptList = ref<BusinessOption[]>([])
  const roleLoading = ref(false)
  const orgLoading = ref(false)
  const deptLoading = ref(false)

  const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  const dialogType = computed(() => props.type)
  const formRef = ref<FormInstance>()

  const formData = reactive({
    userName: '',
    nickName: '',
    password: '123456',
    phone: '',
    email: '',
    gender: '男',
    status: '1',
    orgId: undefined as number | undefined,
    deptId: undefined as number | undefined,
    roleCodes: [] as string[]
  })

  const rules: FormRules = {
    userName: [
      { required: true, message: '请输入用户名', trigger: 'blur' },
      { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
    ],
    password: [
      { required: true, message: '请输入密码', trigger: 'blur' },
      { min: 6, max: 32, message: '长度在 6 到 32 个字符', trigger: 'blur' }
    ],
    phone: [
      { required: true, message: '请输入手机号', trigger: 'blur' },
      { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式', trigger: 'blur' }
    ],
    email: [
      { required: true, message: '请输入邮箱', trigger: 'blur' },
      { type: 'email', message: '请输入正确的邮箱', trigger: 'blur' }
    ],
    gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
    status: [{ required: true, message: '请选择状态', trigger: 'change' }],
    roleCodes: [{ required: true, message: '请选择角色', trigger: 'change' }]
  }

  const loadRoleList = async () => {
    roleLoading.value = true
    try {
      const res = await fetchGetRoleList({ current: 1, size: 100 })
      roleList.value = res.records
    } finally {
      roleLoading.value = false
    }
  }

  const loadOrgList = async () => {
    orgLoading.value = true
    try {
      const res = await fetchBusinessList<BusinessOption>('org', { current: 1, size: 200, status: 'ACTIVE' })
      orgList.value = res.records
    } finally {
      orgLoading.value = false
    }
  }

  const loadDeptList = async (orgId?: number) => {
    if (!orgId) {
      deptList.value = []
      return
    }
    deptLoading.value = true
    try {
      const res = await fetchBusinessList<BusinessOption>('dept', { current: 1, size: 200, orgId })
      deptList.value = res.records
    } finally {
      deptLoading.value = false
    }
  }

  const handleOrgChange = async () => {
    formData.deptId = undefined
    await loadDeptList(formData.orgId)
  }

  const initFormData = () => {
    const row = props.userData
    const isEdit = props.type === 'edit' && row

    Object.assign(formData, {
      userName: isEdit ? row?.userName || '' : '',
      nickName: isEdit ? row?.nickName || '' : '',
      password: '123456',
      phone: isEdit ? row?.userPhone || '' : '',
      email: isEdit ? row?.userEmail || '' : '',
      gender: isEdit ? row?.userGender || '男' : '男',
      status: isEdit ? row?.status || '1' : '1',
      orgId: isEdit ? row?.orgId : undefined,
      deptId: isEdit ? row?.deptId : undefined,
      roleCodes: isEdit && Array.isArray(row?.userRoles) ? row.userRoles : []
    })
  }

  watch(
    () => [props.visible, props.type, props.userData],
    async ([visible]) => {
      if (!visible) return

      initFormData()
      await Promise.all([loadRoleList(), loadOrgList(), loadDeptList(formData.orgId)])
      nextTick(() => {
        formRef.value?.clearValidate()
      })
    },
    { immediate: true }
  )

  const handleSubmit = async () => {
    if (!formRef.value) return

    await formRef.value.validate()
    emit('submit', {
      userName: formData.userName,
      nickName: formData.nickName,
      password: formData.password,
      phone: formData.phone,
      email: formData.email,
      gender: formData.gender,
      status: formData.status,
      deptId: formData.deptId,
      roleCodes: formData.roleCodes
    })
  }
</script>
