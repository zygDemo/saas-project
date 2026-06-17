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

const sessionStorageAdapter = {
  getItem: (key: string) => uni.getStorageSync(key),
  setItem: (key: string, value: string) => uni.setStorageSync(key, value),
  removeItem: (key: string) => uni.removeStorageSync(key),
};

export const useCarloanStore = defineStore("carloan", {
  state: () => ({
    currentOrder: null as CarloanApplicantSummary | null,
    workbenchFilter: {} as CarloanWorkbenchFilter,
    latestQuery: {} as Record<string, unknown>,
    draftMap: {} as CarloanDraftMap,
  }),
  getters: {
    currentCreditOrderId: (state) => state.currentOrder?.creditOrderId || "",
    currentUuid: (state) => state.currentOrder?.uuid || "",
  },
  actions: {
    setCurrentOrder(payload: CarloanApplicantSummary | null) {
      this.currentOrder = payload ? { ...this.currentOrder, ...payload } : null;
    },
    clearCurrentOrder() {
      this.currentOrder = null;
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
      this.workbenchFilter = {};
      this.latestQuery = {};
      this.draftMap = {};
    },
  },
  persist: {
    key: "carloan-store",
    storage: (globalThis as any)?.sessionStorage || sessionStorageAdapter,
    paths: ["currentOrder", "workbenchFilter", "latestQuery", "draftMap"],
  },
});
