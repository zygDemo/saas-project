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

export function fetchGetDictTypeList(params: Api.SystemManage.DictTypeSearchParams) {
  return request.get<Api.SystemManage.DictTypeList>({
    url: '/dict/type/list',
    params
  })
}

export function fetchCreateDictType(params: Api.SystemManage.SaveDictTypeParams) {
  return request.post<Api.SystemManage.DictTypeItem>({
    url: '/dict/type/create',
    params,
    showSuccessMessage: true
  })
}

export function fetchUpdateDictType(id: number, params: Partial<Api.SystemManage.SaveDictTypeParams>) {
  return request.post<Api.SystemManage.DictTypeItem>({
    url: `/dict/type/${id}`,
    params,
    showSuccessMessage: true
  })
}

export function fetchDeleteDictType(id: number) {
  return request.post<{ id: number }>({
    url: `/dict/type/${id}/delete`,
    showSuccessMessage: true
  })
}

export function fetchGetDictDataList(params: Api.SystemManage.DictDataSearchParams) {
  return request.get<Api.SystemManage.DictDataList>({
    url: '/dict/data/list',
    params
  })
}

export function fetchCreateDictData(params: Api.SystemManage.SaveDictDataParams) {
  return request.post<Api.SystemManage.DictDataItem>({
    url: '/dict/data/create',
    params,
    showSuccessMessage: true
  })
}

export function fetchUpdateDictData(id: number, params: Partial<Api.SystemManage.SaveDictDataParams>) {
  return request.post<Api.SystemManage.DictDataItem>({
    url: `/dict/data/${id}`,
    params,
    showSuccessMessage: true
  })
}

export function fetchDeleteDictData(id: number) {
  return request.post<{ id: number }>({
    url: `/dict/data/${id}/delete`,
    showSuccessMessage: true
  })
}

export function fetchGetFileAssetList(params: Api.SystemManage.FileAssetSearchParams) {
  return request.get<Api.SystemManage.FileAssetList>({
    url: '/file/list',
    params
  })
}

export function fetchUploadImage(data: FormData) {
  return request.post<Api.SystemManage.UploadImageResult>({
    url: '/file/upload/image',
    data,
    showSuccessMessage: true
  })
}

export function fetchCreateFileAsset(params: Api.SystemManage.SaveFileAssetParams) {
  return request.post<Api.SystemManage.FileAssetItem>({
    url: '/file/create',
    params,
    showSuccessMessage: true
  })
}

export function fetchUpdateFileAsset(
  id: number,
  params: Api.SystemManage.SaveFileAssetParams
) {
  return request.post<Api.SystemManage.FileAssetItem>({
    url: `/file/${id}`,
    params,
    showSuccessMessage: true
  })
}

export function fetchDeleteFileAsset(id: number) {
  return request.post<{ id: number }>({
    url: `/file/${id}/delete`,
    showSuccessMessage: true
  })
}

export function fetchBatchDeleteFileAssets(ids: number[]) {
  return request.post<{ ids: number[]; count: number }>({
    url: '/file/batch-delete',
    params: { ids },
    showSuccessMessage: true
  })
}
