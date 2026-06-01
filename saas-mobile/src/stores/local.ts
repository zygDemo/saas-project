import { defineStore } from "pinia";

/** 登录用户信息 */
export interface UserInfo {
  /** 用户ID */
  userId: number | string;
  /** 部门ID */
  deptId?: number;
  /** 用户名 */
  userName?: string;
  /** 昵称 */
  nickName?: string;
  /** 手机号 */
  phonenumber?: string;
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
  },
  actions: {
    setToken(token: string) {
      this.token = token;
    },
    setRefreshToken(refreshToken: string) {
      this.refreshToken = refreshToken;
    },
    setUserInfo(userInfo: UserInfo | null) {
      this.userInfo = userInfo;
    },

    logout() {
      this.token = "";
      this.refreshToken = "";
      this.userInfo = null;
      this.loginTime = 0;
      this.expireTime = 0;
    },
  },
  persist: {
    key: "local-store",
    storage: (globalThis as any)?.localStorage || localStorageAdapter,
    paths: ["token", "refreshToken", "userInfo", "loginTime", "expireTime"],
  },
});
