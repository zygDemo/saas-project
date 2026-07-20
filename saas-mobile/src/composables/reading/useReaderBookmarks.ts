import { ref } from "vue";
import {
  loadBookmarks,
  saveBookmarkList,
  formatBookmarkTime,
} from "@/pages/reading/reader/reader-helpers";
import type { Bookmark } from "@/pages/reading/reader/reader-helpers";

/**
 * 阅读器书签相关逻辑
 * 管理书签的增删改查和跳转
 */
export function useReaderBookmarks(
  bookId: () => number,
  chapterId: () => number,
  currentPage: () => number,
  currentChapter: () => { id: string; title: string } | undefined,
  currentPages: () => string[],
) {
  const bookmarks = ref<Bookmark[]>(loadBookmarks());
  const showBookmarkPopup = ref(false);
  const isBookmarked = ref(false);

  function saveBookmarks() {
    saveBookmarkList(bookmarks.value);
  }

  function checkBookmarkStatus() {
    isBookmarked.value = bookmarks.value.some(
      (b) =>
        String(b.chapterId) === String(chapterId()) && b.page === currentPage(),
    );
  }

  function toggleBookmark() {
    if (isBookmarked.value) {
      const idx = bookmarks.value.findIndex(
        (b) =>
          String(b.chapterId) === String(chapterId()) &&
          b.page === currentPage(),
      );
      if (idx > -1) bookmarks.value.splice(idx, 1);
      isBookmarked.value = false;
      saveBookmarks();
      uni.showToast({ title: "已取消书签", icon: "success" });
    } else {
      const content =
        currentPages()[currentPage()]?.slice(0, 50) || "";
      bookmarks.value.unshift({
        id: Date.now().toString(),
        chapterId: String(chapterId()),
        chapterTitle: currentChapter()?.title || "",
        content: `${content}...`,
        page: currentPage(),
        time: Date.now(),
      });
      isBookmarked.value = true;
      saveBookmarks();
      uni.showToast({ title: "已添加书签", icon: "success" });
    }
  }

  function deleteBookmark(bookmark: Bookmark) {
    uni.showModal({
      title: "提示",
      content: "确定删除这个书签？",
      success: (res) => {
        if (res.confirm) {
          const idx = bookmarks.value.findIndex((b) => b.id === bookmark.id);
          if (idx > -1) bookmarks.value.splice(idx, 1);
          saveBookmarks();
          checkBookmarkStatus();
          uni.showToast({ title: "已删除", icon: "success" });
        }
      },
    });
  }

  return {
    bookmarks,
    showBookmarkPopup,
    isBookmarked,
    checkBookmarkStatus,
    toggleBookmark,
    deleteBookmark,
    formatBookmarkTime,
  };
}
