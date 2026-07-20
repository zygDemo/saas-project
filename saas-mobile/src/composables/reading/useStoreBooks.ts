import { computed, ref, watch } from "vue";
import { useReadingApi } from "@/api/reading";

export interface BookItem {
  id: string;
  title: string;
  author: string;
  cover: string;
  category: string;
  isSerial: boolean;
  isHot?: boolean;
  views: number;
  desc: string;
  totalChapters: number;
  wordCount: string;
  rating: number;
  originalPrice?: number;
}

export interface CategoryItem {
  id: string | number;
  name: string;
  parentId: string | number | null;
  realId?: string | number | null;
}

export interface SubTabItem {
  id: number;
  name: string;
  realId: string | number | null;
}

const formatWordCount = (count?: number) => {
  if (!count) return "";
  if (count >= 10000) return `${(count / 10000).toFixed(0)}万字`;
  return `${count}字`;
};

/**
 * 书城书籍列表：分页加载、分类筛选、搜索
 */
export function useStoreBooks() {
  const readingApi = useReadingApi();

  const keyword = ref("");
  const currentMainTab = ref(0);
  const currentSubTab = ref(0);
  const currentRankTab = ref(0);
  const currentFilter = ref("hot");
  const refreshing = ref(false);

  const currentPage = ref(1);
  const pageSize = ref(20);
  const totalCount = ref(0);
  const hasMore = ref(true);
  const isLoadingMore = ref(false);

  const subTabs = ref<SubTabItem[][]>([
    [
      { id: 0, name: "全部", realId: null },
      { id: 1, name: "玄幻", realId: null },
      { id: 2, name: "仙侠", realId: null },
      { id: 3, name: "都市", realId: null },
      { id: 4, name: "历史", realId: null },
      { id: 5, name: "科幻", realId: null },
      { id: 6, name: "游戏", realId: null },
      { id: 7, name: "悬疑", realId: null },
      { id: 8, name: "武侠", realId: null },
      { id: 9, name: "奇幻", realId: null },
    ],
    [
      { id: 0, name: "全部", realId: null },
      { id: 1, name: "现代言情", realId: null },
      { id: 2, name: "古代言情", realId: null },
      { id: 3, name: "仙侠奇缘", realId: null },
      { id: 4, name: "浪漫青春", realId: null },
      { id: 5, name: "悬疑推理", realId: null },
      { id: 6, name: "科幻空间", realId: null },
      { id: 7, name: "宫斗宅斗", realId: null },
      { id: 8, name: "经商种田", realId: null },
    ],
    [
      { id: 0, name: "全部", realId: null },
      { id: 1, name: "文学", realId: null },
      { id: 2, name: "小说", realId: null },
      { id: 3, name: "传记", realId: null },
      { id: 4, name: "历史", realId: null },
      { id: 5, name: "哲学", realId: null },
      { id: 6, name: "经济", realId: null },
      { id: 7, name: "科技", realId: null },
      { id: 8, name: "艺术", realId: null },
    ],
  ]);

  const currentSubTabs = computed(
    () => subTabs.value[currentMainTab.value] || subTabs.value[0],
  );

  const bookList = ref<BookItem[]>([]);

  const hotBooks = computed(() => {
    const hotList = bookList.value.filter((b) => b.isHot);
    return (hotList.length ? hotList : bookList.value).slice(0, 5);
  });

  const rankBooks = computed(() => {
    const books = [...bookList.value];
    switch (currentRankTab.value) {
      case 0:
        return books.sort((a, b) => b.views - a.views).slice(0, 8);
      case 1:
        return books.sort((a, b) => b.rating - a.rating).slice(0, 8);
      case 2:
        return books.filter((b) => !b.isSerial).slice(0, 8);
      case 3:
        return books.reverse().slice(0, 8);
      default:
        return books.slice(0, 8);
    }
  });

  const filteredBooks = computed(() => {
    const kw = keyword.value.trim().toLowerCase();
    const catId = currentSubTab.value;
    return bookList.value
      .filter((book) => {
        const targetCat = currentSubTabs.value[catId];
        const categoryMatched = catId === 0 || book.category === targetCat?.name;
        const keywordMatched =
          !kw ||
          book.title.toLowerCase().includes(kw) ||
          book.author.toLowerCase().includes(kw) ||
          book.desc.toLowerCase().includes(kw);
        return categoryMatched && keywordMatched;
      })
      .sort((a, b) => {
        if (currentFilter.value === "hot") return b.views - a.views;
        if (currentFilter.value === "new") return 0;
        if (currentFilter.value === "finish")
          return a.isSerial === b.isSerial ? 0 : a.isSerial ? 1 : -1;
        if (currentFilter.value === "serial")
          return a.isSerial === b.isSerial ? 0 : a.isSerial ? -1 : 1;
        return 0;
      });
  });

  async function fetchCategories() {
    try {
      const res = await readingApi.getCategories();
      const cats = (res?.data ?? []) as CategoryItem[];
      if (Array.isArray(cats) && cats.length > 0) {
        const topLevelCats = cats.filter(
          (c) => c.parentId === null || c.parentId === 0,
        );
        if (topLevelCats.length > 0) {
          const firstGroup: SubTabItem[] = [
            { id: 0, name: "全部", realId: null },
          ];
          topLevelCats.forEach((cat, idx) => {
            firstGroup.push({ id: idx + 1, name: cat.name, realId: cat.id });
          });
          subTabs.value = [
            firstGroup,
            [
              { id: 0, name: "全部", realId: null },
              ...cats
                .filter((c) => c.parentId === 1)
                .map(
                  (c, i) =>
                    ({ id: i + 1, name: c.name, realId: c.id }) as SubTabItem,
                ),
            ],
            [
              { id: 0, name: "全部", realId: null },
              ...cats
                .filter((c) => c.parentId === 2)
                .map(
                  (c, i) =>
                    ({ id: i + 1, name: c.name, realId: c.id }) as SubTabItem,
                ),
            ],
          ];
        }
      }
    } catch {
      // 使用内置分类
    }
  }

  async function fetchBooks(kw?: string, append = false) {
    if (isLoadingMore.value) return;
    if (!append) currentPage.value = 1;
    const page = append ? currentPage.value : 1;
    isLoadingMore.value = true;
    try {
      const params: Record<string, unknown> = { page, pageSize: pageSize.value };
      if (kw) params.keyword = kw;
      if (currentSubTab.value > 0) {
        const cat = currentSubTabs.value?.[currentSubTab.value];
        if (cat?.realId) params.categoryId = cat.realId;
      }
      const res = await readingApi.getBooks(params);
      if (res?.code === 200 && res.data?.items) {
        const items = res.data.items.map((item: any) => ({
          id: String(item.id),
          title: item.title || "",
          author: item.author || "未知",
          cover: item.cover || "/static/reading/covers/default.svg",
          category: item.category?.name || "其他",
          isSerial: item.isSerial ?? false,
          isHot: item.isHot ?? false,
          views: item.readCount || 0,
          desc: item.desc || "",
          totalChapters: item.chapterCount || 0,
          wordCount: formatWordCount(item.wordCount),
          rating: Number(item.rating) || 0,
        }));
        if (append) {
          bookList.value.push(...items);
        } else {
          bookList.value = items;
        }
        totalCount.value = res.data.total || 0;
        hasMore.value = bookList.value.length < totalCount.value;
        currentPage.value = page + 1;
      }
    } catch (e) {
      console.error("获取图书列表失败", e);
    } finally {
      isLoadingMore.value = false;
    }
  }

  const onRefresh = async () => {
    refreshing.value = true;
    hasMore.value = true;
    isLoadingMore.value = false;
    try {
      await fetchBooks();
      uni.showToast({ title: "已刷新", icon: "success" });
    } finally {
      refreshing.value = false;
    }
  };

  const onLoadMore = () => {
    if (hasMore.value && !isLoadingMore.value) {
      fetchBooks(keyword.value.trim() || undefined, true);
    }
  };

  const switchMainTab = (idx: number) => {
    currentMainTab.value = idx;
    currentSubTab.value = 0;
    hasMore.value = true;
    fetchBooks(keyword.value.trim() || undefined);
  };

  const switchSubTab = (idx: number) => {
    currentSubTab.value = idx;
    hasMore.value = true;
    fetchBooks(keyword.value.trim() || undefined);
  };

  let lastManualSearchTime = 0;
  let searchTimer: ReturnType<typeof setTimeout> | null = null;

  const onSearch = () => {
    lastManualSearchTime = Date.now();
    currentMainTab.value = 0;
    currentSubTab.value = 0;
    fetchBooks(keyword.value.trim() || undefined);
  };

  watch(keyword, (newVal) => {
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      if (Date.now() - lastManualSearchTime < 600) return;
      if (newVal.trim()) {
        currentMainTab.value = 0;
        currentSubTab.value = 0;
        fetchBooks(newVal.trim());
      } else {
        fetchBooks();
      }
    }, 500);
  });

  return {
    keyword,
    currentMainTab,
    currentSubTab,
    currentRankTab,
    currentFilter,
    refreshing,
    hasMore,
    isLoadingMore,
    subTabs,
    currentSubTabs,
    bookList,
    hotBooks,
    rankBooks,
    filteredBooks,
    fetchCategories,
    fetchBooks,
    onRefresh,
    onLoadMore,
    switchMainTab,
    switchSubTab,
    onSearch,
  };
}
