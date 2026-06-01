import { defineStore } from "pinia";
import { tokenUtil } from "@/common/token";

/** 登录用户信息 */
export interface UserInfo {
  /** 用户ID */
  userId: number | string;
  /** 部门ID */
  deptId?: number | string;
  /** 机构ID */
  orgId?: number | string;
  /** 机构名称 */
  orgName?: string;
  /** 用户名 */
  userName?: string;
  /** 兼容 SaaS 新接口用户名字段 */
  username?: string;
  /** 真实姓名 */
  realName?: string;
  /** 昵称 */
  nickName?: string;
  /** 手机号 */
  phonenumber?: string;
  /** 兼容旧移动端手机号字段 */
  phone?: string;
  /** 兼容旧移动端业务员 UUID */
  uuid?: string;
  /** 兼容旧移动端角色字段 */
  role?: string;
  /** 邮箱 */
  email?: string;
  /** 头像 */
  avatar?: string;
  /** 是否管理员 */
  admin?: boolean;
  /** 是否系统管理员 "0"否 "1"是 */
  isAdmin?: string;
  /** 性别 "0"男 "1"女 "2"未知 */
  sex?: string;
  /** 状态 */
  status?: string;
  /** 删除标志 */
  delFlag?: string;
  /** 最后登录IP */
  loginIp?: string;
  /** 最后登录时间 */
  loginDate?: string;
  /** 密码更新时间 */
  pwdUpdateDate?: string;
  /** 角色列表 */
  roles?: SysRole[];
  /** 角色ID列表 */
  roleIds?: number[];
  /** SaaS 角色编码列表 */
  roleKeys?: string[];
  /** 按钮/接口权限标识 */
  permissions?: string[];
  /** 岗位ID列表 */
  postIds?: number[];
  /** 部门信息 */
  dept?: SysDept;
  /** 创建人 */
  createBy?: string;
  /** 创建时间 */
  createTime?: string;
  /** 更新人 */
  updateBy?: string;
  /** 更新时间 */
  updateTime?: string;
  /** 备注 */
  remark?: string;
}

/** 角色信息 */
export interface SysRole {
  /** 角色ID */
  roleId: number;
  /** 角色名称 */
  roleName?: string;
  /** 角色权限字符串 */
  roleKey?: string;
  /** 角色排序 */
  roleSort?: number;
  /** 数据范围 */
  dataScope?: string;
  /** 状态 */
  status?: string;
  /** 菜单树选择项是否关联显示 */
  menuCheckStrictly?: boolean;
  /** 部门树选择项是否关联显示 */
  deptCheckStrictly?: boolean;
  /** 是否管理员 */
  admin?: boolean;
}

/** 部门信息 */
export interface SysDept {
  /** 部门ID */
  deptId: number;
  /** 部门名称 */
  deptName?: string;
  /** 父部门ID */
  parentId?: number;
  /** 祖级列表 */
  ancestors?: string;
  /** 显示顺序 */
  orderNum?: number;
  /** 负责人 */
  leader?: string;
  /** 联系电话 */
  phone?: string;
  /** 邮箱 */
  email?: string;
  /** 状态 */
  status?: string;
  /** 删除标志 */
  delFlag?: string;
}

const localStorageAdapter = {
  getItem: (key: string) => uni.getStorageSync(key),
  setItem: (key: string, value: string) => uni.setStorageSync(key, value),
  removeItem: (key: string) => uni.removeStorageSync(key),
};

export const useLocalStore = defineStore("local", {
  state: () => ({
    token: "",
    refreshToken: "",
    userInfo: null as UserInfo | null,
    orgId: "" as number | string,
    deptId: "" as number | string,
    roles: [] as SysRole[],
    roleKeys: [] as string[],
    permissions: [] as string[],
    loginTime: 0,
    expireTime: 0,
  }),
  getters: {
    isExpired: (state) => {
      return state.expireTime ? Date.now() >= state.expireTime : false;
    },
    isAuthenticated(): boolean {
      return Boolean(this.token) && !this.isExpired;
    },
    hasRefreshToken(): boolean {
      return Boolean(this.refreshToken);
    },
    currentOrgId(): number | string {
      return this.orgId || this.userInfo?.orgId || "";
    },
  },
  actions: {
    setToken(token: string) {
      this.token = tokenUtil.normalize(token);
    },
    setRefreshToken(refreshToken: string) {
      this.refreshToken = refreshToken;
    },
    setUserInfo(userInfo: UserInfo | null) {
      this.userInfo = userInfo;
      this.orgId = userInfo?.orgId || "";
      this.deptId = userInfo?.deptId || "";
      this.roles = userInfo?.roles || [];
      this.roleKeys = userInfo?.roleKeys || this.roles.map((role) => role.roleKey || "").filter(Boolean);
      this.permissions = userInfo?.permissions || [];
    },
    setAuthContext(context: {
      orgId?: number | string;
      deptId?: number | string;
      roles?: SysRole[];
      roleKeys?: string[];
      permissions?: string[];
      expires?: number;
      expireTime?: number;
    }) {
      this.orgId = context.orgId || this.orgId;
      this.deptId = context.deptId || this.deptId;
      this.roles = context.roles || this.roles;
      this.roleKeys = context.roleKeys || this.roleKeys;
      this.permissions = context.permissions || this.permissions;
      if (context.expires || context.expireTime) {
        const expires = context.expireTime || context.expires || 0;
        this.expireTime = expires > 10_000_000_000 ? expires : Date.now() + expires * 1000;
      }
      this.loginTime = Date.now();
    },
    hasRole(roleKey: string) {
      return this.roleKeys.includes(roleKey) || this.roles.some((role) => role.roleKey === roleKey);
    },
    hasPermission(permission: string) {
      return this.permissions.includes(permission) || this.permissions.includes("*:*:*");
    },

    logout() {
      this.token = "";
      this.refreshToken = "";
      this.userInfo = null;
      this.orgId = "";
      this.deptId = "";
      this.roles = [];
      this.roleKeys = [];
      this.permissions = [];
      this.loginTime = 0;
      this.expireTime = 0;
    },
  },
  persist: {
    key: "local-store",
    storage: (globalThis as any)?.localStorage || localStorageAdapter,
    paths: [
      "token",
      "refreshToken",
      "userInfo",
      "orgId",
      "deptId",
      "roles",
      "roleKeys",
      "permissions",
      "loginTime",
      "expireTime",
    ],
  },
});
