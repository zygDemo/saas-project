export interface RequestUser {
  sub: number
  userName: string
  tenantId: number
  /** 用户所属机构（由部门 dept → org 推导，登录时写入 JWT） */
  orgId?: number
  roles: string[]
}
