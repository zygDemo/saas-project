import request from '@/utils/http'

export interface Organization {
  id: number
  tenantId: number
  name: string
  code: string
  status: string
  createdAt: string
  updatedAt: string
}

export interface OrgQuery {
  keyword?: string
  status?: string
  page?: number
  size?: number
}

/** 获取机构列表 */
export function fetchOrgList(params: OrgQuery) {
  return request.get<{ list: Organization[]; total: number }>({
    url: '/org/list',
    params
  })
}

/** 获取机构详情 */
export function fetchOrgDetail(id: number) {
  return request.get<Organization>({ url: `/org/${id}` })
}

/** 创建机构 */
export function fetchCreateOrg(data: Record<string, unknown>) {
  return request.post({ url: '/org', data })
}

/** 更新机构 */
export function fetchUpdateOrg(id: number, data: Record<string, unknown>) {
  return request.post({ url: `/org/${id}`, data })
}

/** 删除机构 */
export function fetchDeleteOrg(id: number) {
  return request.post({ url: `/org/${id}/delete` })
}

/** 启用机构 */
export function fetchEnableOrg(id: number) {
  return request.post({ url: `/org/${id}/enable` })
}

/** 禁用机构 */
export function fetchDisableOrg(id: number) {
  return request.post({ url: `/org/${id}/disable` })
}
