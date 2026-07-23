export interface RequestUser {
  userId: string;
  username: string;
  tenantId: string;
  roleIds?: string[];
  deptId?: string;
  deptScope?: number;
  permissions?: string[];
}
