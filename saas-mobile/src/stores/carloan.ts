import { defineStore } from "pinia";

export interface CarloanApplicantSummary {
  uuid?: string;
  creditOrderId?: string;
  customerName?: string;
  customerPhone?: string;
  idCard?: string;
  nodeCode?: string;
  signStatus?: string;
}

export interface CarloanWorkbenchFilter {
  nodeCode?: string;
  keyword?: string;
  status?: string;
}

export interface CarloanDraftMap {
  [key: string]: Record<string, unknown>;
}

/** 页面级上下文：从路由 query 中提取的公共业务字段。 */
export interface CarloanPageContext {
  uuid: string;
  creditOrderId: string;
  customerName: string;
  customerPhone: string;
  nodeCode: string;
}

export const EMPTY_PAGE_CONTEXT: CarloanPageContext = {
  uuid: "",
  creditOrderId: "",
  customerName: "",
  customerPhone: "",
  nodeCode: "",
};

const sessionStorageAdapter = {
  getItem: (key: string) => uni.getStorageSync(key),
  setItem: (key: string, value: string) => uni.setStorageSync(key, value),
  removeItem: (key: string) => uni.removeStorageSync(key),
};

export const useCarloanStore = defineStore("carloan", {
  state: () => ({
    currentOrder: null as CarloanApplicantSummary | null,
    pageContext: { ...EMPTY_PAGE_CONTEXT } as CarloanPageContext,
    workbenchFilter: {} as CarloanWorkbenchFilter,
    latestQuery: {} as Record<string, unknown>,
    draftMap: {} as CarloanDraftMap,
  }),
  getters: {
    currentCreditOrderId: (state) => state.currentOrder?.creditOrderId || "",
    currentUuid: (state) => state.currentOrder?.uuid || "",
    ctxUuid: (state) => state.pageContext.uuid,
    ctxCreditOrderId: (state) => state.pageContext.creditOrderId,
    ctxCustomerName: (state) => state.pageContext.customerName,
    ctxCustomerPhone: (state) => state.pageContext.customerPhone,
    ctxNodeCode: (state) => state.pageContext.nodeCode,
  },
  actions: {
    /** 从路由 query 中同步页面上下文（统一字段映射：name→customerName, phone→customerPhone, orderNo→creditOrderId）。 */
    syncFromRouteQuery(query: Record<string, string | undefined>) {
      this.pageContext = {
        uuid: String(query?.uuid || ""),
        creditOrderId: String(query?.creditOrderId || query?.orderNo || ""),
        customerName: String(query?.customerName || query?.name || ""),
        customerPhone: String(query?.customerPhone || query?.phone || ""),
        nodeCode: String(query?.nodeCode || ""),
      };
    },
    setCurrentOrder(payload: CarloanApplicantSummary | null) {
      this.currentOrder = payload ? { ...this.currentOrder, ...payload } : null;
    },
    clearCurrentOrder() {
      this.currentOrder = null;
      this.pageContext = { ...EMPTY_PAGE_CONTEXT };
    },
    setWorkbenchFilter(payload: CarloanWorkbenchFilter) {
      this.workbenchFilter = { ...this.workbenchFilter, ...payload };
    },
    clearWorkbenchFilter() {
      this.workbenchFilter = {};
    },
    setLatestQuery(payload: Record<string, unknown>) {
      this.latestQuery = { ...payload };
    },
    saveDraft(key: string, payload: Record<string, unknown>) {
      this.draftMap = {
        ...this.draftMap,
        [key]: { ...payload },
      };
    },
    clearDraft(key?: string) {
      if (!key) {
        this.draftMap = {};
        return;
      }
      const next = { ...this.draftMap };
      delete next[key];
      this.draftMap = next;
    },
    reset() {
      this.currentOrder = null;
      this.pageContext = { ...EMPTY_PAGE_CONTEXT };
      this.workbenchFilter = {};
      this.latestQuery = {};
      this.draftMap = {};
    },
  },
  persist: {
    key: "carloan-store",
    storage: ((globalThis as unknown) as { sessionStorage?: Storage }).sessionStorage || sessionStorageAdapter,
    pick: ["currentOrder", "pageContext", "workbenchFilter", "latestQuery", "draftMap"],
  },
});
