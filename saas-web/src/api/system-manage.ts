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
    data: params,
    showSuccessMessage: true
  })
}

export function fetchUpdateUser(id: number, params: Api.SystemManage.UpdateUserParams) {
  return request.post<Api.SystemManage.UserListItem>({
    url: `/user/${id}`,
    data: params,
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
    data: params,
    showSuccessMessage: true
  })
}

export function fetchUpdateRole(id: number, params: Api.SystemManage.UpdateRoleParams) {
  return request.post<Api.SystemManage.RoleListItem>({
    url: `/role/${id}`,
    data: params,
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
    data: params,
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
    data: params
  })
}

export function fetchUpdateMenu(id: number, params: Api.SystemManage.SaveMenuParams) {
  return request.post<AppRouteRecord>({
    url: `/v3/system/menus/${id}`,
    data: params
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
    data: params
  })
}

export function fetchUpdatePermission(id: number, params: Api.SystemManage.SavePermissionParams) {
  return request.post<Api.SystemManage.PermissionItem>({
    url: `/v3/system/menus/permissions/${id}`,
    data: params
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
    data: params,
    showSuccessMessage: true
  })
}

export function fetchUpdateDictType(id: number, params: Partial<Api.SystemManage.SaveDictTypeParams>) {
  return request.post<Api.SystemManage.DictTypeItem>({
    url: `/dict/type/${id}`,
    data: params,
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
    data: params,
    showSuccessMessage: true
  })
}

export function fetchUpdateDictData(id: number, params: Partial<Api.SystemManage.SaveDictDataParams>) {
  return request.post<Api.SystemManage.DictDataItem>({
    url: `/dict/data/${id}`,
    data: params,
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
    data: params,
    showSuccessMessage: true
  })
}

export function fetchUpdateFileAsset(
  id: number,
  params: Api.SystemManage.SaveFileAssetParams
) {
  return request.post<Api.SystemManage.FileAssetItem>({
    url: `/file/${id}`,
    data: params,
    showSuccessMessage: true
  })
}

export function fetchUpdateUserMobileConfig(
  userId: number,
  data: Api.SystemManage.SaveEntityMobileConfigParams
) {
  return request.put<Api.SystemManage.EntityMobileConfigData>({
    url: `/mobile-config/user/${userId}`,
    data,
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

// ===== 系统参数管理 =====
export function fetchGetSystemParamList(params: Api.SystemManage.SystemParamSearchParams) {
  return request.get<Api.SystemManage.SystemParamList>({
    url: '/system-param/list',
    params
  })
}

export function fetchCreateSystemParam(params: Api.SystemManage.SaveSystemParamParams) {
  return request.post<Api.SystemManage.SystemParamItem>({
    url: '/system-param/create',
    data: params,
    showSuccessMessage: true
  })
}

export function fetchUpdateSystemParam(id: number, params: Partial<Api.SystemManage.SaveSystemParamParams>) {
  return request.post<Api.SystemManage.SystemParamItem>({
    url: `/system-param/${id}`,
    data: params,
    showSuccessMessage: true
  })
}

export function fetchDeleteSystemParam(id: number) {
  return request.post<{ id: number }>({
    url: `/system-param/${id}/delete`,
    showSuccessMessage: true
  })
}

// ===== 公告管理 =====
export function fetchGetAnnouncementList(params: Api.SystemManage.AnnouncementSearchParams) {
  return request.get<Api.SystemManage.AnnouncementList>({
    url: '/announcement/list',
    params
  })
}

export function fetchGetAnnouncementById(id: number) {
  return request.get<Api.SystemManage.AnnouncementItem>({
    url: `/announcement/${id}`
  })
}

export function fetchCreateAnnouncement(params: Api.SystemManage.SaveAnnouncementParams) {
  return request.post<Api.SystemManage.AnnouncementItem>({
    url: '/announcement/create',
    data: params,
    showSuccessMessage: true
  })
}

export function fetchUpdateAnnouncement(id: number, params: Partial<Api.SystemManage.SaveAnnouncementParams>) {
  return request.post<Api.SystemManage.AnnouncementItem>({
    url: `/announcement/${id}`,
    data: params,
    showSuccessMessage: true
  })
}

export function fetchPublishAnnouncement(id: number) {
  return request.post<Api.SystemManage.AnnouncementItem>({
    url: `/announcement/${id}/publish`,
    showSuccessMessage: true
  })
}

export function fetchDeleteAnnouncement(id: number) {
  return request.post<{ id: number }>({
    url: `/announcement/${id}/delete`,
    showSuccessMessage: true
  })
}

// ─── 租户级移动端模块配置 ───
export function fetchGetMobileConfig() {
  return request.get<Api.SystemManage.MobileConfigData>({
    url: '/mobile-config'
  })
}

export function fetchUpdateMobileConfig(params: Api.SystemManage.UpdateMobileConfigParams) {
  return request.put<Api.SystemManage.MobileConfigData>({
    url: '/mobile-config',
    data: params,
    showSuccessMessage: true
  })
}

// ─── 角色级移动端模块配置 ───
export function fetchGetRoleMobileConfig(roleId: number) {
  return request.get<Api.SystemManage.EntityMobileConfigData>({
    url: `/mobile-config/role/${roleId}`
  })
}

export function fetchUpdateRoleMobileConfig(roleId: number, params: Api.SystemManage.SaveEntityMobileConfigParams) {
  return request.put<Api.SystemManage.EntityMobileConfigData>({
    url: `/mobile-config/role/${roleId}`,
    data: params,
    showSuccessMessage: true
  })
}

export function fetchResetRoleMobileConfig(roleId: number) {
  return request.put<Api.SystemManage.EntityMobileConfigData>({
    url: `/mobile-config/role/${roleId}/reset`,
    showSuccessMessage: true
  })
}

// ─── 用户级移动端模块配置 ───
export function fetchGetUserMobileConfig(userId: number) {
  return request.get<Api.SystemManage.EntityMobileConfigData>({
    url: `/mobile-config/user/${userId}`
  })
}

export function fetchResetUserMobileConfig(userId: number) {
  return request.put<Api.SystemManage.EntityMobileConfigData>({
    url: `/mobile-config/user/${userId}/reset`,
    showSuccessMessage: true
  })
}





