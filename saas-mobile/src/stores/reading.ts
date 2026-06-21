import { defineStore } from "pinia";
import { ref, computed } from "vue";

interface BookItem {
  id: string;
  title: string;
  author: string;
  cover: string;
  progress: number;
  lastReadChapter?: string;
  hasUpdate?: boolean;
  totalChapters: number;
  category: string;
}

interface DownloadItem {
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
  lastReadTime: number;
}

export const useReadingStore = defineStore(
  "reading",
  () => {
    // 书架
    const bookshelf = ref<BookItem[]>([
      {
        id: "1",
        title: "斗破苍穹",
        author: "天蚕土豆",
        cover: "https://picsum.photos/seed/book1/200/280",
        progress: 45,
        lastReadChapter: "第四章 云岚宗",
        hasUpdate: true,
        totalChapters: 1648,
        category: "玄幻",
      },
      {
        id: "2",
        title: "凡人修仙传",
        author: "忘语",
        cover: "https://picsum.photos/seed/book2/200/280",
        progress: 12,
        lastReadChapter: "第一百二十章 炼器",
        hasUpdate: false,
        totalChapters: 2446,
        category: "仙侠",
      },
      {
        id: "3",
        title: "诡秘之主",
        author: "爱潜水的乌贼",
        cover: "https://picsum.photos/seed/book3/200/280",
        progress: 78,
        lastReadChapter: "第九百八十五章 源堡",
        hasUpdate: false,
        totalChapters: 1432,
        category: "玄幻",
      },
    ]);

    // 下载列表
    const downloads = ref<DownloadItem[]>([]);

    // 阅读进度
    const readingProgress = ref<ReadingProgress[]>([]);

    // 统计
    const totalReadCount = ref(15);
    const todayReadMinutes = ref(42);

    // 计算属性
    const bookshelfCount = computed(() => bookshelf.value.length);

    // 方法
    const isInBookshelf = (bookId: string) => {
      return bookshelf.value.some((book) => book.id === bookId);
    };

    const addToBookshelf = (book: BookItem) => {
      if (!isInBookshelf(book.id)) {
        bookshelf.value.unshift({
          ...book,
          progress: 0,
          hasUpdate: false,
        });
      }
    };

    const removeFromBookshelf = (bookId: string) => {
      bookshelf.value = bookshelf.value.filter((book) => book.id !== bookId);
    };

    const updateBookProgress = (bookId: string, progress: number, chapter?: string) => {
      const book = bookshelf.value.find((b) => b.id === bookId);
      if (book) {
        book.progress = progress;
        if (chapter) {
          book.lastReadChapter = chapter;
        }
      }
    };

    const saveReadingProgress = (bookId: string, chapterId: string, page: number) => {
      const existing = readingProgress.value.find((p) => p.bookId === bookId);
      if (existing) {
        existing.chapterId = chapterId;
        existing.page = page;
        existing.lastReadTime = Date.now();
      } else {
        readingProgress.value.push({
          bookId,
          chapterId,
          page,
          lastReadTime: Date.now(),
        });
      }
    };

    const getReadingProgress = (bookId: string) => {
      return readingProgress.value.find((p) => p.bookId === bookId);
    };

    const downloadBook = (bookId: string) => {
      const book = bookshelf.value.find((b) => b.id === bookId) || {
        id: bookId,
        title: "未知书籍",
        author: "未知",
        cover: "",
      };

      const existing = downloads.value.find((d) => d.id === bookId);
      if (existing) {
        if (existing.isPaused) {
          existing.isPaused = false;
          existing.speed = "1.2MB/s";
        }
        return;
      }

      downloads.value.unshift({
        id: bookId,
        title: "title" in book ? book.title : "未知书籍",
        author: "author" in book ? book.author : "未知",
        cover: "cover" in book ? book.cover : "",
        progress: 0,
        downloadedSize: "0MB",
        totalSize: "20.5MB",
        speed: "1.2MB/s",
        isPaused: false,
      });

      // 模拟下载进度
      simulateDownload(bookId);
    };

    const simulateDownload = (bookId: string) => {
      const item = downloads.value.find((d) => d.id === bookId);
      if (!item) return;

      const interval = setInterval(() => {
        if (item.isPaused) return;
        if (item.progress >= 100) {
          clearInterval(interval);
          item.completedTime = new Date().toLocaleString("zh-CN");
          return;
        }
        item.progress += Math.floor(Math.random() * 10) + 1;
        if (item.progress > 100) item.progress = 100;
        item.downloadedSize = ((item.progress / 100) * 20.5).toFixed(1) + "MB";
      }, 1000);
    };

    const pauseDownload = (bookId: string) => {
      const item = downloads.value.find((d) => d.id === bookId);
      if (item) {
        item.isPaused = true;
        item.speed = "0KB/s";
      }
    };

    const resumeDownload = (bookId: string) => {
      const item = downloads.value.find((d) => d.id === bookId);
      if (item) {
        item.isPaused = false;
        item.speed = "1.2MB/s";
      }
    };

    const removeDownload = (bookId: string) => {
      downloads.value = downloads.value.filter((d) => d.id !== bookId);
    };

    const clearCompletedDownloads = () => {
      downloads.value = downloads.value.filter((d) => d.progress < 100);
    };

    return {
      // 状态
      bookshelf,
      downloads,
      readingProgress,
      totalReadCount,
      todayReadMinutes,
      // 计算属性
      bookshelfCount,
      // 方法
      isInBookshelf,
      addToBookshelf,
      removeFromBookshelf,
      updateBookProgress,
      saveReadingProgress,
      getReadingProgress,
      downloadBook,
      pauseDownload,
      resumeDownload,
      removeDownload,
      clearCompletedDownloads,
    };
  },
  {
    persist: true,
  }
);
