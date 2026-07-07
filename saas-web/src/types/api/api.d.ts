/**
 * API 接口类型定义模块
 *
 * 提供所有后端接口的类型定义
 *
 * ## 主要功能
 *
 * - 通用类型（分页参数、响应结构等）
 * - 认证类型（登录、用户信息等）
 * - 系统管理类型（用户、角色等）
 * - 全局命名空间声明
 *
 * ## 使用场景
 *
 * - API 请求参数类型约束
 * - API 响应数据类型定义
 * - 接口文档类型同步
 *
 * ## 注意事项
 *
 * - 在 .vue 文件使用需要在 eslint.config.mjs 中配置 globals: { Api: 'readonly' }
 * - 使用全局命名空间，无需导入即可使用
 *
 * ## 使用方式
 *
 * ```typescript
 * const params: Api.Auth.LoginParams = { userName: 'admin', password: '123456' }
 * const response: Api.Auth.UserInfo = await fetchUserInfo()
 * ```
 *
 * @module types/api/api
 * @author Art Design Pro Team
 */

declare namespace Api {
  /** 通用类型 */
  namespace Common {
    /** 分页参数 */
    interface PaginationParams {
      /** 当前页码 */
      current: number
      /** 每页条数 */
      size: number
      /** 总条数 */
      total: number
    }

    /** 通用搜索参数 */
    type CommonSearchParams = Pick<PaginationParams, 'current' | 'size'>

    /** 分页响应基础结构 */
    interface PaginatedResponse<T = unknown> {
      records: T[]
      current: number
      size: number
      total: number
    }

    /** 启用状态 */
    type EnableStatus = '1' | '2'
  }

  /** 认证类型 */
  namespace Auth {
    /** 登录参数 */
    interface LoginParams {
      userName: string
      password: string
    }

    /** 登录响应 */
    interface LoginResponse {
      token: string
      refreshToken: string
    }

    /** 用户信息 */
    interface UserInfo {
      buttons: string[]
      roles: string[]
      userId: number
      userName: string
      email: string
      avatar?: string
    }
  }

  /** 系统管理类型 */
  namespace SystemManage {
    /** 用户列表 */
    type UserList = Api.Common.PaginatedResponse<UserListItem>

    /** 用户列表项 */
    interface UserListItem {
      id: number
      avatar: string
      status: string
      userName: string
      userGender: string
      nickName: string
      userPhone: string
      userEmail: string
      orgId?: number
      orgName?: string
      deptId?: number
      deptName?: string
      userRoles: string[]
      createBy: string
      createTime: string
      updateBy: string
      updateTime: string
    }

    /** 用户搜索参数 */
    type UserSearchParams = Partial<
      Pick<
        UserListItem,
        'id' | 'userName' | 'userGender' | 'userPhone' | 'userEmail' | 'status' | 'orgId' | 'deptId'
      > &
        Api.Common.CommonSearchParams
    >

    /** 新增用户参数 */
    interface CreateUserParams {
      userName: string
      nickName?: string
      password: string
      email: string
      phone?: string
      gender?: string
      status?: string
      deptId?: number
      roleCodes: string[]
    }

    type UpdateUserParams = Partial<CreateUserParams>

    /** 角色列表 */
    type RoleList = Api.Common.PaginatedResponse<RoleListItem>

    /** 角色列表项 */
    interface RoleListItem {
      roleId: number
      roleName: string
      roleCode: string
      description: string
      enabled: boolean
      createTime: string
    }

    /** 角色搜索参数 */
    type RoleSearchParams = Partial<
      Pick<RoleListItem, 'roleId' | 'roleName' | 'roleCode' | 'description' | 'enabled'> &
        Api.Common.CommonSearchParams & {
          startTime: string | null
          endTime: string | null
        }
    >

    interface CreateRoleParams {
      roleName: string
      roleCode: string
      description?: string
      enabled?: boolean
    }

    type UpdateRoleParams = Partial<CreateRoleParams>

    interface RolePermission {
      roleId: number
      menuIds: number[]
      permissionIds: number[]
    }

    interface SaveRolePermissionParams {
      menuIds: number[]
      permissionIds: number[]
    }

    interface SaveMenuParams {
      parentId?: number | null
      path: string
      name: string
      component?: string
      title: string
      icon?: string
      sort?: number
      keepAlive?: boolean
      hidden?: boolean
      hiddenTab?: boolean
      link?: string
      iframe?: boolean
      roleCodes?: string[]
    }

    interface PermissionItem {
      id: number
      menuId: number
      title: string
      authMark: string
      roles: string[]
    }

    interface SavePermissionParams {
      title: string
      authMark: string
      roleCodes?: string[]
    }

    type DictTypeList = Api.Common.PaginatedResponse<DictTypeItem>

    interface DictTypeItem {
      id: number
      name: string
      code: string
      status: string
      remark?: string
      itemCount: number
      createTime: string
      updateTime: string
    }

    type DictTypeSearchParams = Partial<
      Pick<DictTypeItem, 'name' | 'code' | 'status'> & Api.Common.CommonSearchParams
    >

    interface SaveDictTypeParams {
      name: string
      code: string
      status?: string
      remark?: string
    }

    type DictDataList = Api.Common.PaginatedResponse<DictDataItem>

    interface DictDataItem {
      id: number
      typeId: number
      typeName: string
      typeCode: string
      label: string
      value: string
      sort: number
      status: string
      remark?: string
      createTime: string
      updateTime: string
    }

    type DictDataSearchParams = Partial<
      Pick<DictDataItem, 'typeId' | 'label' | 'value' | 'status'> & Api.Common.CommonSearchParams
    >

    interface SaveDictDataParams {
      typeId: number
      label: string
      value: string
      sort?: number
      status?: string
      remark?: string
    }

    type FileAssetList = Api.Common.PaginatedResponse<FileAssetItem>

    interface UploadImageResult {
      url: string
      fileName: string
      objectKey: string
      mimeType: string
      fileExt: string
      fileSize: number
      storageType: string
      uploadedBy?: number
    }

    interface FileAssetItem {
      id: number
      orgId?: number
      businessType?: string
      businessId?: number
      categoryCode: string
      categoryName: string
      fileName: string
      fileUrl: string
      objectKey?: string
      mimeType?: string
      fileExt?: string
      fileSize?: number
      storageType: string
      status: string
      uploadedBy?: number
      remark?: string
      createdAt: string
      updatedAt: string
    }

    type FileAssetSearchParams = Partial<
      Pick<
        FileAssetItem,
        'orgId' | 'businessType' | 'businessId' | 'categoryCode' | 'fileName' | 'status'
      > &
        Api.Common.CommonSearchParams
    >

    type SaveFileAssetParams = Partial<
      Pick<
        FileAssetItem,
        | 'orgId'
        | 'businessType'
        | 'businessId'
        | 'categoryCode'
        | 'categoryName'
        | 'fileName'
        | 'fileUrl'
        | 'objectKey'
        | 'mimeType'
        | 'fileExt'
        | 'fileSize'
        | 'storageType'
        | 'status'
        | 'uploadedBy'
        | 'remark'
      >
    >
    // ===== 系统参数管理 =====
    interface SystemParamItem {
      id: number
      group?: string
      name: string
      key: string
      value?: string
      type: string
      status: string
      remark?: string
      createTime: string
      updateTime: string
    }

    type SystemParamList = Api.Common.PaginatedResponse<SystemParamItem>
    type SystemParamSearchParams = Partial<
      Pick<SystemParamItem, 'group' | 'name' | 'key' | 'status'> & Api.Common.CommonSearchParams
    >
    type SaveSystemParamParams = Partial<
      Pick<SystemParamItem, 'group' | 'name' | 'key' | 'value' | 'type' | 'status' | 'remark'>
    >


// ===== 消息模板 =====
interface MsgTemplateItem {
  id: number
  name: string
  code: string
  channel: string
  scene: string
  title?: string
  content: string
  variables?: Record<string, unknown>
  status: string
  remark?: string
  createTime: string
  updateTime: string
}

type MsgTemplateList = Api.Common.PaginatedResponse<MsgTemplateItem>
type MsgTemplateSearchParams = Partial<
  Pick<MsgTemplateItem, 'name' | 'code' | 'channel' | 'scene' | 'status'> & Api.Common.CommonSearchParams
>
type SaveMsgTemplateParams = Partial<
  Pick<
    MsgTemplateItem,
    | 'name'
    | 'code'
    | 'channel'
    | 'scene'
    | 'title'
    | 'content'
    | 'variables'
    | 'status'
    | 'remark'
  >
>

    // ===== 公告管理 =====
    interface AnnouncementItem {
      id: number
      title: string
      content?: string
      type: string
      level: string
      status: string
      publishAt?: string
      expireAt?: string
      target?: string
      topFlag: boolean
      viewCount: number
      remark?: string
      createTime: string
      updateTime: string
    }

    type AnnouncementList = Api.Common.PaginatedResponse<AnnouncementItem>
    type AnnouncementSearchParams = Partial<
      Pick<AnnouncementItem, 'title' | 'type' | 'level' | 'status'> & Api.Common.CommonSearchParams
    >
    type SaveAnnouncementParams = Partial<
      Pick<
        AnnouncementItem,
        | 'title'
        | 'content'
        | 'type'
        | 'level'
        | 'status'
        | 'publishAt'
        | 'expireAt'
        | 'topFlag'
        | 'remark'
      >
    >

    // ===== 移动端模块配置 =====
    interface MobileModuleItem {
      key: string
      name: string
      icon: string
      desc: string
    }

    interface MobileConfigData {
      available: MobileModuleItem[]
      enabled: string[]
      defaultModule: string | null
      isMultiModule: boolean
    }

    interface UpdateMobileConfigParams {
      mobileModules: string[]
      defaultMobileModule?: string
    }

    /** 角色/用户级移动端模块配置 */
    interface EntityMobileConfigData {
      available: MobileModuleItem[]
      enabled: string[]
      defaultModule: string | null
      mobileMultiModule: boolean
      isMultiModule: boolean
      roleName?: string
      roles?: { roleId: number; roleName: string }[]
    }

    interface SaveEntityMobileConfigParams {
      mobileModules?: string[]
      mobileMultiModule?: boolean
      defaultMobileModule?: string
    }
  }
}
