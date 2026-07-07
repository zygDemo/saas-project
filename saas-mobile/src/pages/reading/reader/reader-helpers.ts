export const STORAGE_KEY = "reader_settings";
export const BOOKMARK_STORAGE_KEY = "reader_bookmarks";
export const CHAPTER_CACHE_PREFIX = "reader_ch_cache_";
export const MAX_CACHED_CHAPTERS = 50;

export interface Chapter {
  id: string;
  title: string;
  isVip: boolean;
  content?: string;
}

export interface Bookmark {
  id: string;
  chapterId: string;
  chapterTitle: string;
  content: string;
  page: number;
  time: number;
}

export interface ChapterCacheEntry {
  content: string;
  title: string;
  time: number;
}

export const bgColors = [
  { value: "default", color: "#f5f0e6", name: "默认" },
  { value: "warm", color: "#efe5d5", name: "暖纸" },
  { value: "green", color: "#dce8d4", name: "护眼" },
  { value: "blue", color: "#dce4ee", name: "淡蓝" },
  { value: "pink", color: "#f0dcd8", name: "粉色" },
  { value: "yellow", color: "#eee0c4", name: "羊皮" },
  { value: "gray", color: "#e6e6e6", name: "浅灰" },
  { value: "dark", color: "#1e1e1e", name: "暗黑" },
];

export function loadSettings() {
  try {
    const saved = uni.getStorageSync(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // ignore
  }
  return null;
}

export function loadBookmarks(): Bookmark[] {
  try {
    const saved = uni.getStorageSync(BOOKMARK_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

export function saveBookmarkList(bookmarks: Bookmark[]) {
  try {
    uni.setStorageSync(BOOKMARK_STORAGE_KEY, JSON.stringify(bookmarks));
  } catch {
    // ignore
  }
}

export function getChapterCacheKey(bookId: string, chapterId: string): string {
  return `${CHAPTER_CACHE_PREFIX}${bookId}_${chapterId}`;
}

export function getCachedChapter(bookId: string, chapterId: string): ChapterCacheEntry | null {
  try {
    const raw = uni.getStorageSync(getChapterCacheKey(bookId, chapterId));
    if (raw) {
      const entry = JSON.parse(raw) as ChapterCacheEntry;
      if (Date.now() - entry.time < 7 * 24 * 60 * 60 * 1000) return entry;
      uni.removeStorageSync(getChapterCacheKey(bookId, chapterId));
    }
  } catch {
    // ignore
  }
  return null;
}

export function trimChapterCache() {
  try {
    const keys: string[] = uni.getStorageInfoSync().keys.filter((k) =>
      k.startsWith(CHAPTER_CACHE_PREFIX),
    );
    if (keys.length > MAX_CACHED_CHAPTERS) {
      const entries = keys
        .map((k) => {
          try {
            const raw = uni.getStorageSync(k);
            const entry = JSON.parse(raw) as ChapterCacheEntry;
            return { key: k, time: entry.time || 0 };
          } catch {
            return { key: k, time: 0 };
          }
        })
        .sort((a, b) => a.time - b.time);

      const toRemove = entries.slice(0, entries.length - MAX_CACHED_CHAPTERS);
      toRemove.forEach((e) => uni.removeStorageSync(e.key));
    }
  } catch {
    // ignore
  }
}

export function cacheChapter(bookId: string, chapterId: string, content: string, title: string) {
  if (!content || !bookId || !chapterId) return;
  try {
    const entry: ChapterCacheEntry = { content, title, time: Date.now() };
    uni.setStorageSync(getChapterCacheKey(bookId, chapterId), JSON.stringify(entry));
    trimChapterCache();
  } catch {
    // 存储空间不足时静默失败
  }
}

export function formatBookmarkTime(timestamp: number) {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  return `${days}天前`;
}
