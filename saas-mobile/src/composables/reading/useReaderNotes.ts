import { ref } from "vue";
import { useReadingApi } from "@/api/reading";

/**
 * 阅读器笔记相关逻辑
 * 管理笔记弹窗、创建、加载
 */
export function useReaderNotes(
  bookId: () => number,
  chapterId: () => number,
) {
  const readingApi = useReadingApi();

  const showNotePopup = ref(false);
  const selectedText = ref("");
  const noteContent = ref("");
  const _noteColor = ref("#FFEB3B");
  const noteStartPos = ref(0);
  const noteEndPos = ref(0);
  const chapterNotes = ref<any[]>([]);

  async function loadChapterNotes() {
    try {
      const res = await readingApi.getNotesByChapter(bookId(), chapterId());
      chapterNotes.value = Array.isArray(res) ? res : (res?.data || []);
    } catch {
      chapterNotes.value = [];
    }
  }

  async function saveNote() {
    if (!selectedText.value && !noteContent.value) return;
    try {
      await readingApi.createNote({
        bookId: bookId(),
        chapterId: chapterId(),
        content: noteContent.value || "",
        startPos: noteStartPos.value,
        endPos: noteEndPos.value,
      });
      uni.showToast({ title: "笔记已保存", icon: "success" });
      showNotePopup.value = false;
      selectedText.value = "";
      noteContent.value = "";
      loadChapterNotes();
    } catch {
      uni.showToast({ title: "保存失败", icon: "none" });
    }
  }

  function onLongPress(_e: any) {
    // #ifdef H5
    const selection = window.getSelection?.();
    if (selection && selection.toString().trim()) {
      selectedText.value = selection.toString().trim();
      showNotePopup.value = true;
    }
    // #endif
  }

  return {
    showNotePopup,
    selectedText,
    noteContent,
    _noteColor,
    noteStartPos,
    noteEndPos,
    chapterNotes,
    loadChapterNotes,
    saveNote,
    onLongPress,
  };
}
