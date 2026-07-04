<template>
  <ElDialog
    v-model="visible"
    title="菜单权限"
    width="520px"
    align-center
    class="el-dialog-border"
    @close="handleClose"
  >
    <ElScrollbar height="70vh">
      <ElTree
        ref="treeRef"
        :data="processedMenuList"
        show-checkbox
        node-key="id"
        :default-expand-all="isExpandAll"
        :props="defaultProps"
        @check="handleTreeCheck"
      />
    </ElScrollbar>

    <template #footer>
      <ElButton @click="toggleExpandAll">
        {{ isExpandAll ? '全部收起' : '全部展开' }}
      </ElButton>
      <ElButton @click="toggleSelectAll">
        {{ isSelectAll ? '取消全选' : '全部选择' }}
      </ElButton>
      <ElButton type="primary" @click="savePermission">保存</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { fetchGetRolePermissions, fetchSaveRolePermissions } from '@/api/system-manage'
  import { useMenuStore } from '@/store/modules/menu'
  import { formatMenuTitle } from '@/utils/router'

  type RoleListItem = Api.SystemManage.RoleListItem

  interface Props {
    modelValue: boolean
    roleData?: RoleListItem
  }

  interface Emits {
    (e: 'update:modelValue', value: boolean): void
    (e: 'success'): void
  }

  interface MenuNode {
    id: string
    menuId?: number
    permissionId?: number
    label?: string
    meta?: {
      title?: string
      authList?: Array<{
        id?: number
        authMark: string
        title: string
      }>
    }
    children?: MenuNode[]
    isAuth?: boolean
    [key: string]: unknown
  }

  /** Raw menu item shape coming from the store (before processing) */
  interface MenuItemInput {
    id: string | number
    meta?: {
      title?: string
      authList?: Array<{
        id?: number
        authMark: string
        title: string
      }>
    }
    children?: MenuItemInput[]
    [key: string]: unknown
  }
  const props = withDefaults(defineProps<Props>(), {
    modelValue: false,
    roleData: undefined
  })

  const emit = defineEmits<Emits>()

  const { menuList } = storeToRefs(useMenuStore())
  const treeRef = ref()
  const isExpandAll = ref(true)
  const isSelectAll = ref(false)

  const visible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })

  const processedMenuList = computed<MenuNode[]>(() => {
    const processNode = (node: MenuItemInput): MenuNode => {
      const menuId = Number(node.id)
      const processed: MenuNode = {
        ...node,
        id: `menu-${menuId}`,
        menuId,
        label: formatMenuTitle(node.meta?.title)
      }

      const children = Array.isArray(node.children) ? node.children.map(processNode) : []
      const authNodes =
        node.meta?.authList?.map((auth: { id?: number; authMark: string; title: string }) => ({
          id: `perm-${auth.id}`,
          permissionId: auth.id,
          label: auth.title,
          isAuth: true
        })) || []

      if (children.length || authNodes.length) {
        processed.children = [...children, ...authNodes]
      }

      return processed
    }

    return (menuList.value as Array<Record<string, unknown>>).map(processNode)
  })

  const defaultProps = {
    children: 'children',
    label: (data: MenuNode) => data.label || formatMenuTitle(data.meta?.title || '') || ''
  }

  watch(
    () => props.modelValue,
    async (newVal) => {
      if (!newVal || !props.roleData) return

      const data = await fetchGetRolePermissions(props.roleData.roleId)
      const checkedKeys = [
        ...data.menuIds.map((id) => `menu-${id}`),
        ...data.permissionIds.map((id) => `perm-${id}`)
      ]

      nextTick(() => {
        treeRef.value?.setCheckedKeys(checkedKeys)
        handleTreeCheck()
      })
    }
  )

  const handleClose = () => {
    visible.value = false
    treeRef.value?.setCheckedKeys([])
    isSelectAll.value = false
  }

  const savePermission = async () => {
    if (!props.roleData) return

    const checkedNodes = treeRef.value?.getCheckedNodes(false, true) || []
    const menuIds = checkedNodes
      .filter((node: MenuNode) => !node.isAuth && node.menuId)
      .map((node: MenuNode) => Number(node.menuId))
    const permissionIds = checkedNodes
      .filter((node: MenuNode) => node.isAuth && node.permissionId)
      .map((node: MenuNode) => Number(node.permissionId))

    await fetchSaveRolePermissions(props.roleData.roleId, { menuIds, permissionIds })
    ElMessage.success('权限保存成功')
    emit('success')
    handleClose()
  }

  const toggleExpandAll = () => {
    const tree = treeRef.value
    if (!tree) return

    Object.values(tree.store.nodesMap).forEach((node: { expanded: boolean }) => {
      node.expanded = !isExpandAll.value
    })

    isExpandAll.value = !isExpandAll.value
  }

  const toggleSelectAll = () => {
    const tree = treeRef.value
    if (!tree) return

    tree.setCheckedKeys(isSelectAll.value ? [] : getAllNodeKeys(processedMenuList.value))
    isSelectAll.value = !isSelectAll.value
  }

  const getAllNodeKeys = (nodes: MenuNode[]): string[] => {
    const keys: string[] = []
    const traverse = (nodeList: MenuNode[]): void => {
      nodeList.forEach((node) => {
        keys.push(node.id)
        if (node.children?.length) traverse(node.children)
      })
    }
    traverse(nodes)
    return keys
  }

  const handleTreeCheck = () => {
    const tree = treeRef.value
    if (!tree) return

    const checkedKeys = tree.getCheckedKeys()
    const allKeys = getAllNodeKeys(processedMenuList.value)
    isSelectAll.value = checkedKeys.length === allKeys.length && allKeys.length > 0
  }
</script>
