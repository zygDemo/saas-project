import { computed, ref } from "vue";
import { useReadingApi } from "@/api/reading";
import type { ChapterLiteItem } from "@/api/reading";
import { useReadingStore } from "@/stores/reading";
import {
  cacheChapter,
  getCachedChapter,
} from "@/pages/reading/reader/reader-helpers";
import type { Chapter } from "@/pages/reading/reader/reader-helpers";
import { showConfirmDialog } from '@/composables/useGlobalLoadingToast'

/**
 * 阅读器章节内容加载、翻页导航、进度同步
 */
export function useReaderChapter(
  bookId: () => number,
  chapterId: (v?: number) => number,
  currentPage: (v?: number) => number,
) {
  const readingApi = useReadingApi();
  const readingStore = useReadingStore();

  const chapterList = ref<Chapter[]>([]);
  const chapterContent = ref("");
  const isContentLoading = ref(false);
  const totalChapters = ref(0);

  // ---- computed ----
  const currentChapter = computed(
    () =>
      chapterList.value.find(
        (c) => String(c.id) === String(chapterId()),
      ) || chapterList.value[0],
  );

  const currentChapterIndex = computed(() =>
    chapterList.value.findIndex(
      (c) => String(c.id) === String(chapterId()),
    ),
  );

  const hasPrevChapter = computed(() => currentChapterIndex.value > 0);
  const hasNextChapter = computed(
    () => currentChapterIndex.value < chapterList.value.length - 1,
  );

  const currentPages = computed(() => {
    const content = chapterContent.value;
    const pageSize = 500;
    const pages: string[] = [];
    for (let i = 0; i < content.length; i += pageSize) {
      pages.push(content.slice(i, i + pageSize));
    }
    return pages.length > 0 ? pages : [content];
  });

  // ---- 章节内容加载 ----
  async function loadChapterContent(
    targetBookId: string,
    targetChapterId: string,
  ): Promise<string> {
    const cached = getCachedChapter(targetBookId, targetChapterId);
    if (cached) return cached.content;

    const detail = await readingApi.getChapterDetail(targetChapterId);
    const content = detail?.data?.content || "";
    const title = detail?.data?.title || "";
    cacheChapter(targetBookId, targetChapterId, content, title);
    return content;
  }

  async function preloadAdjacentChapters(
    targetBookId: string,
    targetChapterId: string,
  ) {
    const idx = chapterList.value.findIndex(
      (c) => c.id === targetChapterId,
    );
    if (idx === -1) return;
    const toPreload: string[] = [];
    if (idx > 0) toPreload.push(chapterList.value[idx - 1].id);
    if (idx < chapterList.value.length - 1)
      toPreload.push(chapterList.value[idx + 1].id);
    for (const cid of toPreload) {
      if (!getCachedChapter(targetBookId, cid)) {
        try {
          const detail = await readingApi.getChapterDetail(cid);
          const c = detail?.data?.content || "";
          const t = detail?.data?.title || "";
          if (c) cacheChapter(targetBookId, cid, c, t);
        } catch {
          /* 静默 */
        }
      }
    }
  }

  // ---- 章节访问校验 & 购买 ----
  async function validateChapterAccess(chapter: Chapter): Promise<boolean> {
    if (!chapter.isVip) return true;
    if (readingStore.hasPurchasedChapter(bookId(), chapter.id)) return true;
    return new Promise((resolve) => {
      const ok = await showConfirmDialog({
        title: 'VIP 章节',
        message: '该章节为 VIP 付费内容，是否前往购买？',
        confirmText: '去购买',
        cancelText: '取消',
      });
      if (ok) {
        handlePurchaseChapter(chapter).then(() => resolve(false));
      } else {
        resolve(false);
      }
    });
  }

  async function handlePurchaseChapter(chapter: Chapter) {
    try {
      uni.showLoading({ title: "处理中..." });
      await readingApi.purchaseChapter(chapter.id);
      readingStore.markChapterPurchased(
        bookId(),
        chapter.id,
        chapter.title,
      );
      uni.hideLoading();
      uni.showToast({ title: "购买成功，已解锁章节", icon: "success" });
    } catch {
      uni.hideLoading();
      uni.showToast({ title: "购买失败，请重试", icon: "none" });
    }
  }

  // ---- 进度保存 ----
  let saveProgressTimer: ReturnType<typeof setTimeout> | null = null;

  function getSaveProgressPayload() {
    const nb = Number(bookId());
    const nc = Number(chapterId());
    if (!Number.isFinite(nb) || !Number.isFinite(nc)) return null;
    const totalPages = Math.max(currentPages.value.length, 1);
    const page = Math.max(0, Math.min(currentPage(), totalPages - 1));
    const progress =
      totalPages > 1
        ? Math.round((page / (totalPages - 1)) * 10000) / 100
        : 100;
    return { bookId: nb, chapterId: nc, page, progress };
  }

  function syncLocalProgress() {
    const payload = getSaveProgressPayload();
    if (!payload) return;
    readingStore.saveReadingProgress(
      payload.bookId,
      payload.chapterId,
      payload.page,
      payload.progress,
      currentChapter.value?.title,
    );
  }

  async function saveReadingProgress() {
    const payload = getSaveProgressPayload();
    if (!payload) return;
    readingStore.saveReadingProgress(
      payload.bookId,
      payload.chapterId,
      payload.page,
      payload.progress,
      currentChapter.value?.title,
    );
    const result = await readingApi.saveProgress(payload);
    if (result?.code !== undefined && result.code !== 200) throw result;
  }

  const debouncedSaveProgress = () => {
    if (saveProgressTimer) clearTimeout(saveProgressTimer);
    saveProgressTimer = setTimeout(async () => {
      try {
        await saveReadingProgress();
      } catch (e) {
        console.warn("保存阅读进度失败，已保留本地进度", e);
      }
    }, 2000);
  };

  return {
    chapterList,
    chapterContent,
    isContentLoading,
    totalChapters,
    currentChapter,
    currentChapterIndex,
    hasPrevChapter,
    hasNextChapter,
    currentPages,
    loadChapterContent,
    preloadAdjacentChapters,
    validateChapterAccess,
    handlePurchaseChapter,
    syncLocalProgress,
    saveReadingProgress,
    debouncedSaveProgress,
  };
}
