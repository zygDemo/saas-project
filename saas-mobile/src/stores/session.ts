import { defineStore } from "pinia";
import { tokenUtil } from "@/common/token";
import type { LoanBusinessNode } from "@/api/business";

type OrderInfo = Record<string, unknown> | null;

export interface TransferInfo {
  path?: string; // 跳转路径
  salesmanId?: string; // 业务员ID
  expirationTime?: string; // 过期时间
  roleTags?: string; // 角色标签  客户、业务员、管理员
  orderId?: string; // 订单ID
  creditOrderId?: string; // 授信订单ID
  uuid?: string; // 客户唯一编码
  businessType?: string; // 业务类型
}

const sessionStorageAdapter = {
  getItem: (key: string) => uni.getStorageSync(key),
  setItem: (key: string, value: string) => uni.setStorageSync(key, value),
  removeItem: (key: string) => uni.removeStorageSync(key),
};

export const useSessionStore = defineStore("session", {
  state: () => ({
    transferToken: "",
    orderInfo: null as OrderInfo,
    loanBusinessNodes: [] as LoanBusinessNode[],
    transferInfo: null as TransferInfo | null,
  }),
  getters: {
    isAuthenticated(): boolean {
      return Boolean(this.transferToken);
    },
  },
  actions: {
    setToken(token: string) {
      this.transferToken = tokenUtil.normalize(token);
    },
    /** 设置/合并更新 orderInfo */
    setOrderInfo(orderInfo: OrderInfo) {
      this.orderInfo = { ...(this.orderInfo || {}), ...orderInfo };
    },
    /** 设置中转页参数 */
    setTransferInfo(transferInfo: TransferInfo | null) {
      this.transferInfo = transferInfo;
    },
    /** 设置贷款业务节点枚举 */
    setLoanBusinessNodes(nodes: LoanBusinessNode[]) {
      this.loanBusinessNodes = nodes;
    },
    clearSession() {
      this.transferToken = "";
      this.orderInfo = null;
      this.transferInfo = null;
      this.loanBusinessNodes = [];
    },
  },
  persist: {
    key: "session-store",
    storage: ((globalThis as unknown) as { sessionStorage?: Storage }).sessionStorage || sessionStorageAdapter,
    paths: ["transferToken", "orderInfo", "transferInfo", "loanBusinessNodes"],
  },
});
