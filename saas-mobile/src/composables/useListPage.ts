import { reactive, ref } from "vue";

export function useListPage<T>(options: {
  fetchFn: (params: any) => Promise<any>;
  defaultParams?: Record<string, any>;
  pageSize?: number;
  getRows?: (res: any) => T[];
  getTotal?: (res: any) => number;
}) {
  const {
    fetchFn,
    defaultParams = {},
    pageSize = 10,
    getRows = (res) => res.rows || res.data || [],
    getTotal = (res) => res.total || 0,
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

  const buildSearchParams = () => {
    const params: Record<string, any> = { ...defaultParams };
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
      const params = {
        ...buildSearchParams(),
        pageNum: pageNum.value,
        pageSize,
      };

      const res = await fetchFn(params);

      if (res?.code === 200) {
        const rows = getRows(res);
        if (isRefresh) {
          list.value = rows;
        } else {
          list.value.push(...rows);
        }
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

  const onScroll = (e: any) => {
    scrollTop.value = e.detail.scrollTop;
    showBackTop.value = e.detail.scrollTop > 400;
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