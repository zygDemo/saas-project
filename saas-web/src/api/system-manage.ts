import request from '@/utils/http'
import { AppRouteRecord } from '@/types/router'

export function fetchGetUserList(params: Api.SystemManage.UserSearchParams) {
  return request.get<Api.SystemManage.UserList>({
    url: '/user/list',
    params
  })
}

export function fetchCreateUser(params: Api.SystemManage.CreateUserParams) {
  return request.post<Api.SystemManage.UserListItem>({
    url: '/user/create',
    params,
    showSuccessMessage: true
  })
}

export function fetchUpdateUser(id: number, params: Api.SystemManage.UpdateUserParams) {
  return request.post<Api.SystemManage.UserListItem>({
    url: `/user/${id}`,
    params,
    showSuccessMessage: true
  })
}

export function fetchDeleteUser(id: number) {
  return request.post<{ id: number }>({
    url: `/user/${id}/delete`,
    showSuccessMessage: true
  })
}

export function fetchGetRoleList(params: Api.SystemManage.RoleSearchParams) {
  return request.get<Api.SystemManage.RoleList>({
    url: '/role/list',
    params
  })
}

export function fetchCreateRole(params: Api.SystemManage.CreateRoleParams) {
  return request.post<Api.SystemManage.RoleListItem>({
    url: '/role/create',
    params,
    showSuccessMessage: true
  })
}

export function fetchUpdateRole(id: number, params: Api.SystemManage.UpdateRoleParams) {
  return request.post<Api.SystemManage.RoleListItem>({
    url: `/role/${id}`,
    params,
    showSuccessMessage: true
  })
}

export function fetchDeleteRole(id: number) {
  return request.post<{ id: number }>({
    url: `/role/${id}/delete`,
    showSuccessMessage: true
  })
}

export function fetchGetRolePermissions(id: number) {
  return request.get<Api.SystemManage.RolePermission>({
    url: `/role/${id}/permissions`
  })
}

export function fetchSaveRolePermissions(
  id: number,
  params: Api.SystemManage.SaveRolePermissionParams
) {
  return request.post<Api.SystemManage.RolePermission>({
    url: `/role/${id}/permissions`,
    params,
    showSuccessMessage: true
  })
}

export function fetchGetMenuList() {
  return request.get<AppRouteRecord[]>({
    url: '/v3/system/menus'
  })
}

export function fetchCreateMenu(params: Api.SystemManage.SaveMenuParams) {
  return request.post<AppRouteRecord>({
    url: '/v3/system/menus',
    params
  })
}

export function fetchUpdateMenu(id: number, params: Api.SystemManage.SaveMenuParams) {
  return request.post<AppRouteRecord>({
    url: `/v3/system/menus/${id}`,
    params
  })
}

export function fetchDeleteMenu(id: number) {
  return request.post<{ id: number }>({
    url: `/v3/system/menus/${id}/delete`
  })
}

export function fetchCreatePermission(
  menuId: number,
  params: Api.SystemManage.SavePermissionParams
) {
  return request.post<Api.SystemManage.PermissionItem>({
    url: `/v3/system/menus/${menuId}/permissions`,
    params
  })
}

export function fetchUpdatePermission(id: number, params: Api.SystemManage.SavePermissionParams) {
  return request.post<Api.SystemManage.PermissionItem>({
    url: `/v3/system/menus/permissions/${id}`,
    params
  })
}

export function fetchDeletePermission(id: number) {
  return request.post<{ id: number }>({
    url: `/v3/system/menus/permissions/${id}/delete`
  })
}
