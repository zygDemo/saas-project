import { defineStore } from "pinia";
import { computed, ref } from "vue";

export interface ReadingBookItem {
  id: string;
  title: string;
  author: string;
  cover: string;
  progress: number;
  lastReadChapter?: string;
  lastReadChapterId?: string;
  lastReadTime?: number;
  hasUpdate?: boolean;
  totalChapters: number;
  category: string;
  isVip?: boolean;
  isSerial?: boolean;
  wordCount?: string;
  desc?: string;
  views?: number;
  rating?: number;
}

export interface DownloadItem {
  id: string;
  title: string;
  author: string;
  cover: string;
  progress: number;
  downloadedSize: string;
  totalSize: string;
  speed: string;
  isPaused: boolean;
  completedTime?: string;
}

interface ReadingProgress {
  bookId: string;
  chapterId: string;
  page: number;
  progress: number;
  chapterTitle?: string;
  lastReadTime: number;
}

const fallbackBooks: ReadingBookItem[] = [
  {
    id: "1",
    title: "斗破苍穹",
    author: "天蚕土豆",
    cover: "/static/reading/covers/book1.svg",
    progress: 45,
    lastReadChapter: "第四章 云岚宗",
    lastReadChapterId: "1",
    lastReadTime: Date.now() - 1000 * 60 * 18,
    hasUpdate: true,
    totalChapters: 1648,
    category: "玄幻",
  },
  {
    id: "2",
    title: "凡人修仙传",
    author: "忘语",
    cover: "/static/reading/covers/book2.svg",
    progress: 12,
    lastReadChapter: "第一百二十章 炼器",
    lastReadChapterId: "2",
    lastReadTime: Date.now() - 1000 * 60 * 60 * 3,
    totalChapters: 2446,
    category: "仙侠",
  },
  {
    id: "3",
    title: "诡秘之主",
    author: "爱潜水的乌贼",
    cover: "/static/reading/covers/book3.svg",
    progress: 78,
    lastReadChapter: "第九百八十五章 源堡",
    lastReadChapterId: "3",
    lastReadTime: Date.now() - 1000 * 60 * 60 * 26,
    totalChapters: 1432,
    category: "奇幻",
  },
];

export const useReadingStore = defineStore(
  "reading",
  () => {
    const bookshelf = ref<ReadingBookItem[]>(fallbackBooks);
    const downloads = ref<DownloadItem[]>([]);
    const readingProgress = ref<ReadingProgress[]>([]);
    const totalReadCount = ref(15);
    const todayReadMinutes = ref(42);
    const purchasedChapters = ref<Record<string, Set<string>>>({});

    const bookshelfCount = computed(() => bookshelf.value.length);

    const isInBookshelf = (bookId: string | number) => {
      const id = String(bookId);
      return bookshelf.value.some((book) => book.id === id);
    };

    const addToBookshelf = (book: ReadingBookItem) => {
      const existing = bookshelf.value.find((item) => item.id === String(book.id));
      if (existing) {
        Object.assign(existing, { ...book, id: String(book.id) });
        return;
      }

      bookshelf.value.unshift({
        ...book,
        id: String(book.id),
        progress: book.progress ?? 0,
        hasUpdate: book.hasUpdate ?? false,
      });
    };

    const syncBookshelf = (books: ReadingBookItem[]) => {
      bookshelf.value = books.map((book) => ({
        ...book,
        id: String(book.id),
        progress: book.progress ?? 0,
        totalChapters: book.totalChapters ?? 0,
        category: book.category || "其他",
      }));
    };

    const removeFromBookshelf = (bookId: string | number) => {
      const id = String(bookId);
      bookshelf.value = bookshelf.value.filter((book) => book.id !== id);
      readingProgress.value = readingProgress.value.filter((item) => item.bookId !== id);
    };

    const updateBookProgress = (
      bookId: string | number,
      progress: number,
      chapter?: string,
      chapterId?: string | number,
    ) => {
      const id = String(bookId);
      const book = bookshelf.value.find((item) => item.id === id);
      if (!book) return;

      book.progress = Math.max(0, Math.min(100, Math.round(progress)));
      book.lastReadTime = Date.now();
      if (chapter) book.lastReadChapter = chapter;
      if (chapterId !== undefined) book.lastReadChapterId = String(chapterId);
      book.hasUpdate = false;
    };

    const saveReadingProgress = (
      bookId: string | number,
      chapterId: string | number,
      page: number,
      progress = 0,
      chapterTitle?: string,
    ) => {
      const normalizedBookId = String(bookId);
      const normalizedChapterId = String(chapterId);
      const existing = readingProgress.value.find((item) => item.bookId === normalizedBookId);

      const nextProgress: ReadingProgress = {
        bookId: normalizedBookId,
        chapterId: normalizedChapterId,
        page,
        progress: Math.max(0, Math.min(100, Math.round(progress))),
        chapterTitle,
        lastReadTime: Date.now(),
      };

      if (existing) {
        Object.assign(existing, nextProgress);
      } else {
        readingProgress.value.push(nextProgress);
      }

      updateBookProgress(normalizedBookId, nextProgress.progress, chapterTitle, normalizedChapterId);
    };

    const getReadingProgress = (bookId: string | number) => {
      return readingProgress.value.find((item) => item.bookId === String(bookId));
    };

    const hasPurchasedChapter = (bookId: string | number, chapterId: string | number) => {
      const bookKey = String(bookId);
      const chapterKey = String(chapterId);
      return !!purchasedChapters.value[bookKey]?.has(chapterKey);
    };

    const markChapterPurchased = (bookId: string | number, chapterId: string | number, _title?: string) => {
      const bookKey = String(bookId);
      const chapterKey = String(chapterId);
      if (!purchasedChapters.value[bookKey]) {
        purchasedChapters.value[bookKey] = new Set();
      }
      purchasedChapters.value[bookKey].add(chapterKey);
    };

    const downloadBook = (bookId: string | number, bookInfo?: Partial<ReadingBookItem>) => {
      const id = String(bookId);
      const book = bookInfo || bookshelf.value.find((item) => item.id === id);
      const existing = downloads.value.find((item) => item.id === id);

      if (existing) {
        if (existing.isPaused) {
          existing.isPaused = false;
          existing.speed = "1.2MB/s";
        }
        return;
      }

      downloads.value.unshift({
        id,
        title: book?.title || "未知书籍",
        author: book?.author || "未知作者",
        cover: book?.cover || "/static/reading/covers/default.svg",
        progress: 0,
        downloadedSize: "0MB",
        totalSize: "20.5MB",
        speed: "1.2MB/s",
        isPaused: false,
      });

      simulateDownload(id);
    };

    function simulateDownload(bookId: string) {
      const item = downloads.value.find((download) => download.id === bookId);
      if (!item) return;

      const interval = setInterval(() => {
        if (!downloads.value.some((download) => download.id === bookId)) {
          clearInterval(interval);
          return;
        }
        if (item.isPaused) return;
        if (item.progress >= 100) {
          clearInterval(interval);
          item.speed = "已完成";
          item.completedTime = new Date().toLocaleString("zh-CN");
          return;
        }

        item.progress = Math.min(100, item.progress + Math.floor(Math.random() * 10) + 1);
        item.downloadedSize = `${((item.progress / 100) * 20.5).toFixed(1)}MB`;
      }, 1000);
    }

    const pauseDownload = (bookId: string | number) => {
      const item = downloads.value.find((download) => download.id === String(bookId));
      if (item) {
        item.isPaused = true;
        item.speed = "0KB/s";
      }
    };

    const resumeDownload = (bookId: string | number) => {
      const item = downloads.value.find((download) => download.id === String(bookId));
      if (item) {
        item.isPaused = false;
        item.speed = "1.2MB/s";
        simulateDownload(item.id);
      }
    };

    const removeDownload = (bookId: string | number) => {
      downloads.value = downloads.value.filter((download) => download.id !== String(bookId));
    };

    const clearCompletedDownloads = () => {
      downloads.value = downloads.value.filter((download) => download.progress < 100);
    };

    return {
      bookshelf,
      downloads,
      readingProgress,
      totalReadCount,
      todayReadMinutes,
      bookshelfCount,
      isInBookshelf,
      addToBookshelf,
      syncBookshelf,
      removeFromBookshelf,
      updateBookProgress,
      saveReadingProgress,
      getReadingProgress,
      hasPurchasedChapter,
      markChapterPurchased,
      downloadBook,
      pauseDownload,
      resumeDownload,
      removeDownload,
      clearCompletedDownloads,
    };
  },
  {
    persist: true,
  },
);
