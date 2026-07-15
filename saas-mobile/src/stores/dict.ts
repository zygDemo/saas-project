import { defineStore } from "pinia";

/** 字典选项 */
export interface DictOption {
  label: string;
  value: string | number;
  raw?: unknown;
}

/** 字典缓存项 */
interface DictCacheEntry {
  /** 字典选项列表 */
  options: DictOption[];
  /** 过期时间戳（ms），0 表示不过期 */
  expireAt: number;
  /** 是否正在加载（避免并发重复请求） */
  loading?: Promise<DictOption[]> | null;
}

/** 默认缓存有效期：10 分钟 */
const DEFAULT_TTL = 10 * 60 * 1000;

export const useDictStore = defineStore("dict", {
  state: () => ({
    /** 字典缓存 Map：dictType -> DictCacheEntry */
    cache: new Map<string, DictCacheEntry>(),
  }),

  getters: {
    /** 获取字典选项（如果缓存有效则返回，否则返回 null） */
    getOptions: (state) => {
      return (dictType: string): DictOption[] | null => {
        const entry = state.cache.get(dictType);
        if (!entry) return null;
        if (entry.expireAt > 0 && Date.now() > entry.expireAt) {
          return null;
        }
        return entry.options;
      };
    },
  },

  actions: {
    /**
     * 设置字典缓存
     * @param dictType 字典类型
     * @param options 字典选项列表
     * @param ttl 缓存有效期（ms），默认 10 分钟
     */
    setOptions(dictType: string, options: DictOption[], ttl: number = DEFAULT_TTL) {
      this.cache.set(dictType, {
        options,
        expireAt: ttl > 0 ? Date.now() + ttl : 0,
        loading: null,
      });
    },

    /**
     * 获取字典数据（带缓存 + 并发去重）
     * @param dictType 字典类型
     * @param fetcher 远程获取函数
     * @param ttl 缓存有效期（ms）
     */
    async fetchOptions(
      dictType: string,
      fetcher: () => Promise<DictOption[]>,
      ttl: number = DEFAULT_TTL,
    ): Promise<DictOption[]> {
      // 1. 检查缓存
      const cached = this.getOptions(dictType);
      if (cached) return cached;

      // 2. 检查是否有正在进行的请求（并发去重）
      // 检查与设置合并为同步原子操作，避免竞态：两个并发请求都通过了检查但都未看到对方的 loading
      const existing = this.cache.get(dictType);
      if (existing?.loading) {
        return existing.loading;
      }

      // 3. 同步创建 Promise 并立即写入 loading 状态，确保后续并发请求能看到
      let resolveLoading!: (options: DictOption[]) => void;
      let rejectLoading!: (err: Error) => void;
      const loadingPromise = new Promise<DictOption[]>((resolve, reject) => {
        resolveLoading = resolve;
        rejectLoading = reject;
      });

      // 立即存入 loading 状态（同步操作，JS 单线程保证原子性）
      this.cache.set(dictType, {
        options: [],
        expireAt: 0,
        loading: loadingPromise,
      });

      // 4. 异步发起新请求
      try {
        const options = await fetcher();
        this.setOptions(dictType, options, ttl);
        resolveLoading(options);
        return options;
      } catch (err) {
        const entry = this.cache.get(dictType);
        if (entry) entry.loading = null;
        rejectLoading(err instanceof Error ? err : new Error(String(err)));
        throw err;
      }
    },

    /** 清除指定字典缓存 */
    invalidate(dictType: string) {
      this.cache.delete(dictType);
    },

    /** 清除所有字典缓存 */
    clear() {
      this.cache.clear();
    },
  },
});
