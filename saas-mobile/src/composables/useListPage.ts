import { reactive, ref } from "vue";

export interface UseListPageOptions<T> {
  fetchFn: (params: Record<string, unknown>) => Promise<unknown>;
  defaultParams?: Record<string, unknown>;
  pageSize?: number;
  getRows?: (res: unknown) => T[];
  getTotal?: (res: unknown) => number;
}

export function useListPage<T>(options: UseListPageOptions<T>) {
  const {
    fetchFn,
    defaultParams = {},
    pageSize = 10,
    getRows = (res: unknown): T[] => {
      const data = res as Record<string, unknown>;
      return ((data.rows || data.data || []) as unknown) as T[];
    },
    getTotal = (res: unknown): number => {
      const data = res as Record<string, unknown>;
      return (data.total || 0) as number;
    },
  } = options;

  const searchForm = reactive({
    keyword: "",
  });

  const list = ref<T[]>([]);
  const loading = ref(false);
  const pageNum = ref(1);
  const hasMore = ref(true);
  const isRefreshing = ref(false);
  const scrollTop = ref(0);
  const showBackTop = ref(false);
  const scrollTopValue = ref(0);

  const buildSearchParams = (): Record<string, unknown> => {
    const params: Record<string, unknown> = { ...defaultParams };
    const kw = searchForm.keyword.trim();
    if (kw) {
      if (/^\d{7,}$/.test(kw)) {
        params.phone = kw;
      } else {
        params.name = kw;
      }
    }
    return params;
  };

  const fetchList = async (isRefresh = false) => {
    if (loading.value) return;
    if (!isRefresh && !hasMore.value) return;

    loading.value = true;
    if (isRefresh) {
      pageNum.value = 1;
      hasMore.value = true;
    }

    try {
      const params: Record<string, unknown> = {
        ...buildSearchParams(),
        pageNum: pageNum.value,
        pageSize,
      };

      const res = (await fetchFn(params)) as Record<string, unknown>;

      if ((res as { code?: number }).code === 200) {
        const rows = getRows(res);
        list.value = isRefresh
          ? rows
          : [...(list.value as T[]), ...rows];
        hasMore.value = list.value.length < getTotal(res);
        pageNum.value++;
      }
    } catch (e) {
      console.error("获取列表失败", e);
    } finally {
      loading.value = false;
      if (isRefreshing.value) {
        isRefreshing.value = false;
      }
    }
  };

  const handleSearch = () => {
    fetchList(true);
  };

  const onRefresh = async () => {
    isRefreshing.value = true;
    try {
      await fetchList(true);
    } finally {
      isRefreshing.value = false;
    }
  };

  const loadMore = () => {
    fetchList(false);
  };

  const onScroll = (e: unknown) => {
    const detail = (e as { detail?: { scrollTop?: number } })?.detail;
    scrollTop.value = detail?.scrollTop ?? 0;
    showBackTop.value = (detail?.scrollTop ?? 0) > 400;
  };

  const backToTop = () => {
    scrollTopValue.value = scrollTop.value > 0 ? -1 : 0;
    requestAnimationFrame(() => {
      scrollTopValue.value = 0;
    });
  };

  return {
    searchForm,
    list,
    loading,
    hasMore,
    isRefreshing,
    scrollTopValue,
    showBackTop,
    fetchList,
    handleSearch,
    onRefresh,
    loadMore,
    onScroll,
    backToTop,
  };
}
