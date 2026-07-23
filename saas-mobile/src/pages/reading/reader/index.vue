<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { onLoad, onShareAppMessage, onUnload } from "@dcloudio/uni-app";
import { useReadingApi } from "@/api/reading";
import type { ChapterLiteItem } from "@/api/reading";
import { useReadingStore } from "@/stores/reading";
import type { Chapter, Bookmark } from "./reader-helpers";
import { useReaderNotes } from "@/composables/reading/useReaderNotes";
import { useReaderSettings } from "@/composables/reading/useReaderSettings";
import { useReaderBookmarks } from "@/composables/reading/useReaderBookmarks";
import { useReaderChapter } from "@/composables/reading/useReaderChapter";
import { showFailToast } from '@/composables/useGlobalLoadingToast'

const readingApi = useReadingApi();
const readingStore = useReadingStore();

const bookId = ref(0);
const chapterId = ref(0);
const currentPage = ref(0);

// ---- composables ----
const notes = useReaderNotes(() => bookId.value, () => chapterId.value);
const settings = useReaderSettings();
const bookmarks = useReaderBookmarks(
  () => bookId.value,
  () => chapterId.value,
  () => currentPage.value,
  () => chapter.value,
  () => chapterPages.value,
);
const chapter = useReaderChapter(
  () => bookId.value,
  (v?: number) => {
    if (v !== undefined) chapterId.value = v;
    return chapterId.value;
  },
  (v?: number) => {
    if (v !== undefined) currentPage.value = v;
    return currentPage.value;
  },
);

// aliases for template
const {
  showNotePopup, selectedText, noteContent, _noteColor,
  noteStartPos, noteEndPos, chapterNotes,
  loadChapterNotes, saveNote, onLongPress,
} = notes;

const {
  isNightMode, fontSize, lineHeight, bgColor, pageMode,
  brightness, isListenMode, isLandscape,
  bgColorStyle, textStyle, setPageMode, setLineHeight,
  toggleNightMode, decreaseFontSize, increaseFontSize,
  onBgColorChange, onBrightnessChange, toggleListenMode,
  detectOrientation,
} = settings;

const {
  bookmarks: bookmarkList, showBookmarkPopup, isBookmarked,
  checkBookmarkStatus, toggleBookmark, deleteBookmark, formatBookmarkTime,
} = bookmarks;

const {
  chapterList, chapterContent, isContentLoading, totalChapters,
  currentChapter, currentChapterIndex, hasPrevChapter, hasNextChapter,
  currentPages: chapterPages,
  loadChapterContent, preloadAdjacentChapters,
  validateChapterAccess, syncLocalProgress,
  saveReadingProgress, debouncedSaveProgress,
} = chapter;

// ---- UI state ----
const showToolbar = ref(false);
const showChapterPopup = ref(false);
const showSettingsPopup = ref(false);
const verticalScrollTop = ref(0);
const touchStartX = ref(0);
const touchStartY = ref(0);
const isAutoLoading = ref(false);

const toggleToolbar = () => { showToolbar.value = !showToolbar.value; };

const goBack = () => {
  try { (uni as unknown as { showStatusBar?: () => void }).showStatusBar?.(); } catch {}
  uni.navigateBack();
};

const shareBook = () => {
  showFailToast("请点击右上角分享");
};

onShareAppMessage(() => ({
  title: currentChapter.value?.title || "精彩好书",
  path: `/pages/reading/reader/index?bookId=${bookId.value}&chapterId=${chapterId.value}`,
}));

// ---- 翻页 & 导航 ----
const prevChapter = async () => {
  if (!hasPrevChapter.value) return;
  const prevIdx = currentChapterIndex.value - 1;
  chapterId.value = Number(chapterList.value[prevIdx].id);
  currentPage.value = 0;
  checkBookmarkStatus();
  chapterContent.value = await loadChapterContent(String(bookId.value), String(chapterId.value));
  preloadAdjacentChapters(String(bookId.value), String(chapterId.value));
  loadChapterNotes();
  debouncedSaveProgress();
};

const nextChapter = async () => {
  if (!hasNextChapter.value) return;
  const nextIdx = currentChapterIndex.value + 1;
  chapterId.value = Number(chapterList.value[nextIdx].id);
  currentPage.value = 0;
  checkBookmarkStatus();
  chapterContent.value = await loadChapterContent(String(bookId.value), String(chapterId.value));
  preloadAdjacentChapters(String(bookId.value), String(chapterId.value));
  loadChapterNotes();
  debouncedSaveProgress();
};

const onTouchStart = (e: TouchEvent) => {
  touchStartX.value = e.touches[0].clientX;
  touchStartY.value = e.touches[0].clientY;
};

const onTouchEnd = (ev: TouchEvent) => {
  if (pageMode.value === "vertical") return;
  const endX = ev.changedTouches[0].clientX;
  const endY = ev.changedTouches[0].clientY;
  const diffX = endX - touchStartX.value;
  const diffY = endY - touchStartY.value;
  if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY)) {
    if (diffX > 0) {
      if (currentPage.value > 0) currentPage.value--;
      else if (hasPrevChapter.value) prevChapter();
    } else {
      if (currentPage.value < chapterPages.value.length - 1) currentPage.value++;
      else if (hasNextChapter.value) nextChapter();
    }
  }
};

watch(pageMode, (newVal) => {
  currentPage.value = 0;
  if (newVal === "vertical") verticalScrollTop.value = 0;
});

// ---- 垂直滚动 ----
const onScrollToLower = async () => {
  if (hasNextChapter.value && !isAutoLoading.value) {
    isAutoLoading.value = true;
    try {
      const nextIdx = currentChapterIndex.value + 1;
      chapterId.value = Number(chapterList.value[nextIdx].id);
      chapterContent.value = await loadChapterContent(String(bookId.value), String(chapterId.value));
      preloadAdjacentChapters(String(bookId.value), String(chapterId.value));
      loadChapterNotes();
      verticalScrollTop.value = 0;
      checkBookmarkStatus();
    } catch (err) {
      console.error("vertical auto-load failed", err);
    } finally {
      isAutoLoading.value = false;
    }
  }
};

const onPageChange = async (changeEvent: { current: number; detail?: { current?: number } }) => {
  currentPage.value = changeEvent.detail?.current ?? changeEvent.current;
  checkBookmarkStatus();
  debouncedSaveProgress();
  if (
    currentPage.value >= chapterPages.value.length - 1 &&
    hasNextChapter.value && !isAutoLoading.value
  ) {
    isAutoLoading.value = true;
    try {
      const nextIdx = currentChapterIndex.value + 1;
      chapterId.value = Number(chapterList.value[nextIdx].id);
      currentPage.value = 0;
      chapterContent.value = await loadChapterContent(String(bookId.value), String(chapterId.value));
      preloadAdjacentChapters(String(bookId.value), String(chapterId.value));
      loadChapterNotes();
      checkBookmarkStatus();
      debouncedSaveProgress();
    } catch (err) {
      console.error("auto-load next chapter failed", err);
    } finally {
      isAutoLoading.value = false;
    }
  }
};

const onProgressChange = (e: { detail: { value: number } }) => {
  currentPage.value = e.detail.value;
  checkBookmarkStatus();
};

const resetScrollToTop = () => { verticalScrollTop.value = 0; };

// ---- 章节弹窗 ----
const showChapterList = () => { showChapterPopup.value = true; };

const jumpToChapter = async (ch: Chapter) => {
  if (await validateChapterAccess(ch)) {
    chapterId.value = Number(ch.id);
    currentPage.value = 0;
    showChapterPopup.value = false;
    checkBookmarkStatus();
    chapterContent.value = await loadChapterContent(String(bookId.value), String(ch.id));
    debouncedSaveProgress();
  }
};

const jumpToBookmark = (bm: Bookmark) => {
  if (String(bm.chapterId) !== String(chapterId.value)) {
    chapterId.value = Number(bm.chapterId);
  }
  currentPage.value = bm.page;
  showBookmarkPopup.value = false;
  checkBookmarkStatus();
  debouncedSaveProgress();
};

// ---- lifecycle ----
onLoad(async (options) => {
  if (options?.bookId) bookId.value = Number(options.bookId);
  if (options?.chapterId) chapterId.value = Number(options.chapterId);

  if (bookId.value) {
    try {
      const liteRes = await readingApi.getChaptersLite(bookId.value);
      const allItems = (liteRes as any)?.data?.items || liteRes.data || [];
      chapterList.value = allItems.map((item: ChapterLiteItem) => ({
        id: String(item.id),
        title: item.title,
        isVip: !!item.isVip,
      }));

      const localProgress = readingStore.getReadingProgress(bookId.value);
      let savedChapterId = localProgress?.chapterId || "";
      let savedPage = localProgress?.page || 0;

      if (!options?.chapterId) {
        try {
          const progressRes = await readingApi.getProgress(bookId.value);
          const saved = progressRes?.data;
          if (saved?.chapterId) {
            const exists = allItems.some(
              (item: ChapterLiteItem) => String(item.id) === String(saved.chapterId),
            );
            if (exists) {
              savedChapterId = String(saved.chapterId);
              savedPage = saved.page || 0;
            }
          }
        } catch { /* 无保存进度 */ }
      }

      if (!chapterId.value && savedChapterId) chapterId.value = Number(savedChapterId);
      if (!chapterId.value && allItems.length) {
        try { (uni as unknown as { hideStatusBar?: () => void }).hideStatusBar?.(); } catch {}
        chapterId.value = Number(allItems[0].id);
      }

      if (chapterId.value) {
        isContentLoading.value = true;
        try {
          chapterContent.value = await loadChapterContent(String(bookId.value), String(chapterId.value));
          preloadAdjacentChapters(String(bookId.value), String(chapterId.value));
          loadChapterNotes();
          if (savedPage > 0) {
            currentPage.value = Math.min(savedPage, Math.max(chapterPages.value.length - 1, 0));
          }
          syncLocalProgress();
        } finally {
          isContentLoading.value = false;
        }
      }
    } catch (e) {
      console.error("reader fetch error", e);
    }
  }

  totalChapters.value = chapterList.value.length;
  checkBookmarkStatus();
});

onUnload(() => {
  syncLocalProgress();
  saveReadingProgress().catch((e) => console.warn("保存阅读进度失败", e));
  settings.saveSettings();
});

detectOrientation();
uni.onWindowResize(() => { detectOrientation(); });

const showNoteEditor = () => {
  showFailToast("笔记功能开发中");
};
</script>

<template>
  <view class="reader-page" :class="{ 'night-mode': isNightMode, 'landscape-mode': isLandscape }">
    <!-- 顶部工具栏 -->
    <view
      v-show="showToolbar"
      class="toolbar top-toolbar"
      :class="{ show: showToolbar }"
      @click.stop
    >
      <view
        class="toolbar-left"
        role="button"
        tabindex="0"
        @click="goBack"
        @keyup.enter="goBack"
      >
        <u-icon name="arrow-left" color="#fff" size="40" />
      </view>
      <text class="toolbar-title">{{ currentChapter?.title || "" }}</text>
      <view class="toolbar-right">
      <view class="toolbar-btn" @click="showNoteEditor">
        <u-icon name="edit-pen" color="#fff" size="40" />
      </view>
        <u-icon
          name="share"
          color="#fff"
          size="40"
          role="button"
          tabindex="0"
          @click="shareBook"
          @keyup.enter="shareBook"
        />
      </view>
    </view>

    <!-- 阅读区域 -->
    <view
      class="reader-content"
      @click="toggleToolbar"
      @touchstart="onTouchStart"
      @touchend="onTouchEnd"
    >
      <!-- 水平翻页模式 (滑动/覆盖) -->
      <swiper
        v-if="pageMode !== 'vertical'"
        class="chapter-swiper"
        :current="currentPage"
        :duration="pageMode === 'cover' ? 350 : 200"
        :style="{ background: bgColorStyle }"
        @change="onPageChange"
      >
        <swiper-item v-for="(page, idx) in currentPages" :key="idx">
          <scroll-view class="page-scroll" scroll-y>
            <view class="page-content">
              <text class="chapter-title-text">{{
                currentChapter?.title || ""
              }}</text>
              <view
                v-for="(paragraph, pIdx) in getPageParagraphs(page)"
                :key="pIdx"
                class="content-paragraph"
              >
                <text :style="textStyle">{{ paragraph }}</text>
              </view>
            </view>
          </scroll-view>
        </swiper-item>
      </swiper>
        <!-- 上下滚动模式 (连续滚动) -->
        <scroll-view
          v-else
          :key="chapterId"
          class="vertical-scroll-reader"
          scroll-y
          :scroll-top="verticalScrollTop"
          :lower-threshold="150"
          :style="{ background: bgColorStyle }"
          @scroll="onVerticalScroll"
          @scrolltolower="onScrollToLower"
        >
          <view class="vertical-content">
            <text class="chapter-title-text">{{
              currentChapter?.title || ""
            }}</text>
            <view
              v-for="(paragraph, pIdx) in chapterParagraphs"
              :key="pIdx"
              class="content-paragraph"
            >
              <text :style="textStyle">{{ paragraph }}</text>
            </view>
            <view v-if="hasNextChapter" class="load-more-hint">
              <text class="load-more-text">— 上拉加载下一章 —</text>
            </view>
          </view>
        </scroll-view>
    </view>

    <!-- 底部工具栏 -->
    <view
      v-show="showToolbar"
      class="toolbar bottom-toolbar"
      :class="{ show: showToolbar }"
      @click.stop
    >
      <!-- 上一章/下一章 -->
      <view class="chapter-nav">
        <view
          class="nav-btn"
          :class="{ disabled: !hasPrevChapter }"
          @click.stop="prevChapter"
        >
          <u-icon name="arrow-left" color="#fff" size="32" />
          <text>上一章</text>
        </view>
        <view
          class="nav-btn"
          role="button"
          tabindex="0"
          @click.stop="showChapterList"
          @keyup.enter="showChapterList"
        >
          <u-icon name="list" color="#fff" size="32" />
          <text>目录</text>
        </view>
        <view
          class="nav-btn"
          role="button"
          tabindex="0"
          @click.stop="toggleBookmark"
          @keyup.enter="toggleBookmark"
        >
          <u-icon
            :name="isBookmarked ? 'bookmark-fill' : 'bookmark'"
            :color="isBookmarked ? '#ffd43b' : '#fff'"
            size="32"
          />
          <text>书签</text>
        </view>
        <view
          class="nav-btn"
          role="button"
          tabindex="0"
          @click.stop="toggleListenMode"
          @keyup.enter="toggleListenMode"
        >
          <u-icon name="mic" color="#fff" size="32" />
          <text>听书</text>
        </view>
        <view
          class="nav-btn"
          :class="{ disabled: !hasNextChapter }"
          @click.stop="nextChapter"
        >
          <text>下一章</text>
          <u-icon name="arrow-right" color="#fff" size="32" />
        </view>
      </view>

      <!-- 进度条 -->
      <view class="progress-section">
        <text v-if="pageMode !== 'vertical'" class="progress-text">{{ currentPage + 1 }}/{{ currentPages.length }}</text>
        <slider
          v-if="pageMode !== 'vertical'"
          class="progress-slider"
          :value="currentPage"
          :max="currentPages.length - 1"
          :step="1"
          activeColor="var(--u-type-primary)"
          backgroundColor="rgba(255,255,255,0.2)"
          block-color="var(--u-type-primary)"
          :block-size="20"
          @change="onProgressChange"
        />
      </view>

      <!-- 设置 -->
      <view class="settings-section">
        <view
          class="setting-item"
          role="button"
          tabindex="0"
          @click.stop="toggleNightMode"
          @keyup.enter="toggleNightMode"
        >
          <u-icon
            :name="isNightMode ? 'info-circle-fill' : 'info-circle'"
            color="#fff"
            size="40"
          />
          <text>{{ isNightMode ? "日间" : "夜间" }}</text>
        </view>
        <view
          class="setting-item"
          role="button"
          tabindex="0"
          @click.stop="decreaseFontSize"
          @keyup.enter="decreaseFontSize"
        >
          <text class="font-btn">A-</text>
          <text>小字</text>
        </view>
        <view
          class="setting-item"
          role="button"
          tabindex="0"
          @click.stop="increaseFontSize"
          @keyup.enter="increaseFontSize"
        >
          <text class="font-btn large">A+</text>
          <text>大字</text>
        </view>
        <view
          class="setting-item"
          role="button"
          tabindex="0"
          @click.stop="showSettings"
          @keyup.enter="showSettings"
        >
          <u-icon name="setting" color="#fff" size="40" />
          <text>设置</text>
        </view>
      </view>
    </view>

    <!-- 章节目录弹窗 -->
    <u-popup v-model="showChapterPopup" mode="left">
      <view class="chapter-popup">
        <view class="popup-header">
          <text class="popup-title">目录</text>
          <text class="popup-sub">共{{ totalChapters }}章</text>
        </view>
        <scroll-view class="chapter-scroll" scroll-y>
          <view
            v-for="(chapter, idx) in chapterList"
            :key="idx"
            class="chapter-item"
            :class="{ active: chapter.id === currentChapter?.id }"
            @click="jumpToChapter(chapter)"
          >
            <text class="chapter-name">{{ chapter.title }}</text>
            <view v-if="chapter.isVip" class="vip-tag">VIP</view>
          </view>
        </scroll-view>
      </view>
    </u-popup>

    <!-- 设置弹窗 -->
    <u-popup v-model="showSettingsPopup" mode="bottom" border-radius="16">
      <view class="settings-popup" :style="{ background: bgColorStyle, color: bgColor === 'dark' ? '#c0c4cc' : '#333' }">
        <view class="settings-popup-header">
          <text class="settings-popup-title">阅读设置</text>
          <u-icon
            name="close"
            color="currentColor"
            size="40"
            role="button"
            tabindex="0"
            @click="showSettingsPopup = false"
            @keyup.enter="showSettingsPopup = false"
          />
        </view>

        <!-- 字体大小 -->
        <view class="setting-row-inline">
          <text class="setting-label-inline">字体大小</text>
          <view class="setting-control-inline">
            <view class="setting-btn" :class="{ disabled: fontSize <= 14 }" @click="decreaseFontSize">
              <text class="setting-btn-text">A-</text>
            </view>
            <text class="font-size-value">{{ fontSize }}px</text>
            <view class="setting-btn" :class="{ disabled: fontSize >= 28 }" @click="increaseFontSize">
              <text class="setting-btn-text large">A+</text>
            </view>
          </view>
        </view>

        <!-- 行间距 -->
        <view class="setting-row-inline">
          <text class="setting-label-inline">行间距</text>
          <view class="setting-pill-group">
            <view class="setting-pill" :class="{ active: lineHeight === 1.5 }" @click="setLineHeight(1.5)">
              <text class="pill-text">紧凑</text>
            </view>
            <view class="setting-pill" :class="{ active: lineHeight === 1.8 }" @click="setLineHeight(1.8)">
              <text class="pill-text">标准</text>
            </view>
            <view class="setting-pill" :class="{ active: lineHeight === 2.0 }" @click="setLineHeight(2.0)">
              <text class="pill-text">宽松</text>
            </view>
          </view>
        </view>

        <!-- 背景颜色 -->
        <view class="setting-row bg-setting-row">
          <text class="setting-label">背景颜色</text>
          <view class="bg-color-strip">
            <view
              v-for="color in bgColors"
              :key="color.value"
              class="bg-color-option"
              role="button"
              tabindex="0"
              :class="{ active: bgColor === color.value }"
              @click="onBgColorChange(color.value)"
            >
              <view class="bg-color-dot" :style="{ background: color.color }">
                <u-icon
                  v-if="bgColor === color.value"
                  name="checkmark"
                  :color="
                    color.value === 'dark' ? '#c0c4cc' : 'var(--u-type-primary)'
                  "
                  size="18"
                />
              </view>
              <text class="bg-color-name">{{ color.name }}</text>
            </view>
          </view>
        </view>

        <!-- 翻页方式 -->
        <view class="setting-row-inline">
          <text class="setting-label-inline">翻页方式</text>
          <view class="setting-pill-group">
            <view class="setting-pill" :class="{ active: pageMode === 'cover' }" @click="setPageMode('cover')">
              <text class="pill-text">覆盖</text>
            </view>
            <view class="setting-pill" :class="{ active: pageMode === 'slide' }" @click="setPageMode('slide')">
              <text class="pill-text">滑动</text>
            </view>
            <view class="setting-pill" :class="{ active: pageMode === 'vertical' }" @click="setPageMode('vertical')">
              <text class="pill-text">上下</text>
            </view>
          </view>
        </view>

        <!-- 亮度 -->
        <view class="setting-row-inline setting-row-last">
          <text class="setting-label-inline">亮度</text>
          <view class="setting-control-inline">
            <u-icon name="info-circle" :color="bgColor === 'dark' ? '#666' : '#909399'" size="22" />
            <slider
              class="brightness-slider"
              :value="brightness"
              :min="20"
              :max="100"
              activeColor="var(--u-type-primary)"
              :backgroundColor="bgColor === 'dark' ? '#333' : '#e8e8e8'"
              block-color="var(--u-type-primary)"
              :block-size="16"
              @change="onBrightnessChange"
            />
            <u-icon name="info-circle-fill" :color="bgColor === 'dark' ? '#999' : '#333'" size="22" />
          </view>
        </view>
      </view>
    </u-popup>

    <!-- 书签列表弹窗 -->
    <u-popup v-model="showBookmarkPopup" mode="bottom">
      <view class="bookmark-popup">
        <view class="popup-header">
          <text class="popup-title">书签</text>
          <text
            class="popup-close"
            role="button"
            tabindex="0"
            @click="showBookmarkPopup = false"
            @keyup.enter="showBookmarkPopup = false"
            >关闭</text>
        </view>
        <scroll-view class="bookmark-scroll" scroll-y>
          <view v-if="bookmarks.length === 0" class="empty-bookmarks">
            <u-icon name="bookmark" color="#ddd" size="80" />
            <text>暂无书签</text>
          </view>
          <view
            v-for="bookmark in bookmarks"
            :key="bookmark.id"
            class="bookmark-item"
            role="button"
            tabindex="0"
            @click="jumpToBookmark(bookmark)"
            @keyup.enter="jumpToBookmark(bookmark)"
          >
            <view class="bookmark-info">
              <text class="bookmark-chapter">{{ bookmark.chapterTitle }}</text>
              <text class="bookmark-content">{{ bookmark.content }}</text>
              <text class="bookmark-time">{{
                formatBookmarkTime(bookmark.time)
              }}</text>
            </view>
            <u-icon
              name="trash"
              color="#ff4757"
              size="32"
              @click.stop="deleteBookmark(bookmark)"
            />
          </view>
        </scroll-view>
      </view>
    </u-popup>

    <!-- 听书模式提示 -->
    <view v-if="isListenMode" class="listen-mode-toast">
      <view class="listen-content">
        <u-icon name="mic" color="var(--u-type-primary)" size="48" />
        <text class="listen-text">听书模式已开启</text>
        <text class="listen-hint">正在朗读中...</text>
        <u-button
          text="关闭听书"
          type="default"
          size="small"
          @click="toggleListenMode"
        />
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.reader-page {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #f7f1e7;

  &.night-mode {
    background: #121212;

    .content-text {
      color: #c8c8c8;
    }

    .content-paragraph {
      text {
        color: #c8c8c8;
      }
    }

    .chapter-title-text {
      text-wrap: balance;
      color: #8a8a8a;
    }
  }
}

.toolbar {
  position: fixed;
  left: 0;
  right: 0;
  z-index: 150;
  padding: 0 24rpx;
  transform: translateY(-100%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
  /* 毛玻璃效果 */
  background: rgba(24, 27, 34, 0.76);
  backdrop-filter: blur(22px);
  -webkit-backdrop-filter: blur(22px);
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.12);

  &.show {
    transform: translateY(0);
    pointer-events: auto;
  }
}

.top-toolbar {
  top: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 92rpx;
  padding-top: var(--status-bar-height);
}

.toolbar-left,
.toolbar-right {
  width: 80rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999rpx;
}

.toolbar-title {
  flex: 1;
  text-align: center;
  font-size: 28rpx;
  color: #fff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}

.bottom-toolbar {
  bottom: 0;
  padding-bottom: env(safe-area-inset-bottom);
  transform: translateY(100%);
  background: rgba(24, 27, 34, 0.78);
  backdrop-filter: blur(22px);
  -webkit-backdrop-filter: blur(22px);

  &.show {
    transform: translateY(0);
  }
}

.chapter-nav {
  display: flex;
  justify-content: space-around;
  padding: 22rpx 0 18rpx;
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.08);
}

.nav-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #fff;
  font-size: 22rpx;
  gap: 8rpx;
  min-width: 96rpx;
  padding: 10rpx 14rpx;
  border-radius: 18rpx;
  transition: background 0.2s;

  &:active {
    background: rgba(255, 255, 255, 0.1);
  }

  &.disabled {
    opacity: 0.35;
    pointer-events: none;
  }
}

.progress-section {
  display: flex;
  align-items: center;
  padding: 16rpx 24rpx 8rpx;
  gap: 20rpx;
}

.progress-text {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.7);
  width: 80rpx;
  font-variant-numeric: tabular-nums;
}

.progress-slider {
  flex: 1;
}

.settings-section {
  display: flex;
  justify-content: space-around;
  padding: 16rpx 0 24rpx;
  border-top: 1rpx solid rgba(255, 255, 255, 0.08);
}

.setting-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #fff;
  font-size: 20rpx;
  gap: 8rpx;
  min-width: 96rpx;
  padding: 10rpx 14rpx;
  border-radius: 18rpx;
  transition: background 0.2s;

  &:active {
    background: rgba(255, 255, 255, 0.1);
  }
}

.font-btn {
  font-size: 28rpx;
  font-weight: 600;

  &.large {
    font-size: 36rpx;
  }
}

.reader-content {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
}

.chapter-swiper {
  height: 100%;
}

.page-scroll {
  height: 100%;
}

.page-content {
  padding: 132rpx 52rpx 92rpx;
  min-height: 100%;
  box-sizing: border-box;
}

.chapter-title-text {
  text-wrap: balance;
  display: block;
  font-size: 34rpx;
  font-weight: 600;
  color: #2c2c2c;
  margin-bottom: 44rpx;
  text-align: center;
  line-height: 1.5;
}

.content-text {
  font-size: 18px;
  color: #333;
  line-height: 1.8;
  text-align: justify;
  text-indent: 2em;
  word-break: break-all;
  hyphens: auto;
}

/* 段落样式 - 每段首行缩进2字符 */
.content-paragraph {
  text-indent: 2em;
  margin-bottom: 0.8em;
  display: block;

  &:last-child {
    margin-bottom: 0;
  }

  text {
    display: block;
    text-align: justify;
    line-height: 1.8;
    color: #333;
  }
}

/* 减少动画 */
@media (prefers-reduced-motion: reduce) {
  .toolbar {
    transition: none !important;
  }
}

/* 垂直滚动阅读模式 */
.vertical-scroll-reader {
  width: 100%;
  height: 100%;
}

.vertical-content {
  padding: 42rpx 52rpx 140rpx;
  min-height: 100%;
}

.load-more-hint {
  padding: 48rpx 0 100rpx;
  text-align: center;
}

.load-more-text {
  font-size: 24rpx;
  color: #bbb;
  letter-spacing: 2rpx;
}

.chapter-popup {
  width: 590rpx;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 0 26rpx 26rpx 0;
  box-shadow: 16rpx 0 34rpx rgba(17, 24, 39, 0.1);
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx 30rpx 24rpx;
  border-bottom: 1rpx solid var(--app-border, #e8edf5);
  position: sticky;
  top: 0;
  background: #fff;
  z-index: 1;
}

.popup-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1a1a1a;
}

.popup-sub {
  font-size: 22rpx;
  color: var(--u-type-primary);
  background: rgba(var(--u-type-primary-rgb, 82, 64, 254), 0.08);
  padding: 6rpx 14rpx;
  border-radius: 999rpx;
}

.popup-close {
  font-size: 26rpx;
  color: var(--u-type-primary);
  padding: 8rpx 16rpx;
}

.chapter-scroll {
  flex: 1;
}

.chapter-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 26rpx 30rpx;
  border-bottom: 1rpx solid var(--app-border, #eef1f6);
  transition: background 0.15s;

  &:active {
    background: #f8f8f8;
  }

  &.active {
    background: rgba(var(--u-type-primary-rgb, 82, 64, 254), 0.08);

    .chapter-name {
      color: var(--u-type-primary);
      font-weight: 600;
    }
  }
}

.chapter-name {
  font-size: 28rpx;
  color: #333;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.vip-tag {
  font-size: 18rpx;
  padding: 2rpx 10rpx;
  background: linear-gradient(135deg, #f7b733, #fc4a1a);
  color: #fff;
  border-radius: 6rpx;
  flex-shrink: 0;
  margin-left: 12rpx;
  font-weight: 500;
}

/* 系统级深色模式 */
@media (prefers-color-scheme: dark) {
  .reader-page:not(.night-mode) {
    background: #121212;

    .chapter-title-text {
      color: #aaa;
    }

    .content-text {
      color: #c0c0c0;
    }
  }

  .setting-btn {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.06);
  }

  .setting-btn:active {
    background: rgba(255, 255, 255, 0.15);
  }

  .setting-btn-text {
    color: #c0c4cc;
  }

  .setting-pill {
    background: rgba(255, 255, 255, 0.08);
  }

  .pill-text {
    color: #b0b3b8;
  }
}

/* 应用内夜间模式 */
.night-mode {
  .toolbar {
    background: rgba(10, 10, 10, 0.9) !important;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }

  .chapter-popup {
    background: #1a1a1a;
    border-radius: 0 26rpx 26rpx 0;
    box-shadow: none;
  }

  .popup-header {
    background: #1a1a1a;
    border-bottom-color: #2a2a2a;
  }

  .popup-title {
    color: #e5e6eb;
  }

  .popup-sub {
    color: #666;
    background: #2a2a2a;
  }

  .popup-close {
    color: #8b9cf7;
  }

  .chapter-item {
    border-bottom-color: #222;

    &:active {
      background: #222;
    }

    &.active {
      background: rgba(102, 126, 234, 0.12);
    }
  }

  .chapter-name {
    color: #d0d0d0;
  }

  .settings-popup {
    background: #1a1a1a;
    color: #c0c4cc;
  }

  .settings-popup-header {
    border-bottom-color: rgba(255, 255, 255, 0.06);
  }

  .setting-label,
  .setting-label-inline {
    opacity: 0.65;
  }

  .bg-color-name {
    &.active {
      color: #8b9cf7;
    }
  }

  .bookmark-popup {
    background: #1a1a1a;
  }

  .bookmark-item {
    border-bottom-color: #222;
  }

  .bookmark-chapter {
    color: #d0d0d0;
  }

  .bookmark-content {
    color: #777;
  }

  .bookmark-time {
    color: #555;
  }

  .listen-content {
    background: rgba(20, 20, 20, 0.95);
  }

  .setting-pill-group .setting-pill {
    background: #2a2a2a;
    border-color: transparent;

    .pill-text {
      color: #999;
    }

    &.active {
      background: rgba(102, 126, 234, 0.25);
      border-color: rgba(102, 126, 234, 0.4);

      .pill-text {
        color: #8b9cf7;
      }
    }
  }

  .setting-btn {
    background: #2a2a2a;
    border-color: rgba(255, 255, 255, 0.06);

    .setting-btn-text {
      color: #aaa;
    }

    &.disabled {
      opacity: 0.3;
    }
  }
}

/* 设置行 - label + 控件同行 */
.setting-row-inline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18rpx;
}

.setting-label-inline {
  font-size: 26rpx;
  flex-shrink: 0;
  width: 120rpx;
  opacity: 0.7;
}

.setting-control-inline {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex: 1;
  justify-content: flex-end;
}

/* 设置按钮 - 字体大小 */
.setting-btn {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  background: rgba(var(--u-type-primary-rgb, 82, 64, 254), 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  border: 2rpx solid rgba(0, 0, 0, 0.04);
}

.setting-btn:active {
  background: rgba(0, 0, 0, 0.12);
  transform: scale(0.95);
}

.setting-btn.disabled {
  opacity: 0.4;
  pointer-events: none;
}

.setting-btn-text {
  font-size: 24rpx;
  font-weight: 600;
  color: #333;
  line-height: 1;
}

.setting-btn-text.large {
  font-size: 28rpx;
}

/* pill 按钮组 - 行间距、翻页方式 */
.setting-pill-group {
  display: flex;
  gap: 8rpx;
  flex: 1;
  justify-content: flex-end;
}

.setting-pill {
  padding: 10rpx 20rpx;
  border-radius: 28rpx;
  background: rgba(var(--u-type-primary-rgb, 82, 64, 254), 0.08);
  border: 2rpx solid transparent;
  transition: all 0.2s ease;
  min-width: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.setting-pill:active {
  transform: scale(0.95);
}

.setting-pill.active {
  background: var(--u-type-primary);
  border-color: var(--u-type-primary);
  box-shadow: 0 4rpx 12rpx rgba(var(--u-type-primary-rgb, 82, 64, 254), 0.3);
}

.pill-text {
  font-size: 24rpx;
  color: #666;
  line-height: 1.2;
}

.setting-pill.active .pill-text {
  color: #fff;
  font-weight: 600;
}

/* 设置弹窗 - 限制高度 */
.settings-popup {
  padding: 18rpx 28rpx 22rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  max-height: 55vh;
  overflow-y: auto;
  transition: background 0.3s ease;
  background: var(--app-surface, #fff);
  border-radius: 28rpx 28rpx 0 0;
}

.settings-popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12rpx 0 16rpx;
  margin-bottom: 12rpx;
  border-bottom: 1rpx solid var(--app-border, #e8edf5);
}

.settings-popup-title {
  font-size: 30rpx;
  font-weight: 600;
}

.setting-row {
  margin-bottom: 18rpx;
}

.setting-row-last {
  margin-bottom: 0;
}

.setting-label {
  display: block;
  font-size: 26rpx;
  margin-bottom: 10rpx;
  opacity: 0.7;
}

.font-size-control {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.line-height-control {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.page-mode-control {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.font-size-value {
  font-size: 26rpx;
  width: 72rpx;
  text-align: center;
}

.bg-setting-row {
  margin-bottom: 18rpx;
}

.bg-color-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8rpx;
  padding: 2rpx 0 0;
}

.bg-color-option {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6rpx;
}

.bg-color-dot {
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  border: 2rpx solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 1rpx 3rpx rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
}

.bg-color-option.active {
  .bg-color-dot {
    border-color: var(--u-type-primary);
    box-shadow: 0 0 0 3rpx rgba(var(--u-type-primary-rgb, 82, 64, 254), 0.2);
  }
}

.brightness-control {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.brightness-slider {
  flex: 1;
}

.bg-color-name {
  max-width: 70rpx;
  font-size: 16rpx;
  line-height: 1.2;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bg-color-option.active .bg-color-name {
  color: var(--u-type-primary);
  font-weight: 600;
}

/* 书签弹窗 */
.bookmark-popup {
  max-height: 70vh;
  display: flex;
  flex-direction: column;
  background: var(--app-surface, #fff);
  border-radius: 28rpx 28rpx 0 0;
  overflow: hidden;
}

.bookmark-scroll {
  flex: 1;
  max-height: 60vh;
}

.empty-bookmarks {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 0;
  color: #909399;
  font-size: 28rpx;
  gap: 16rpx;
}

.bookmark-item {
  display: flex;
  align-items: center;
  padding: 24rpx 28rpx;
  border-bottom: 1rpx solid var(--app-border, #e8edf5);
}

.bookmark-info {
  flex: 1;
  margin-right: 16rpx;
}

.bookmark-chapter {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #303133;
}

.bookmark-content {
  display: block;
  font-size: 24rpx;
  color: #606266;
  margin-top: 8rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bookmark-time {
  display: block;
  font-size: 22rpx;
  color: #909399;
  margin-top: 8rpx;
}

.bg-color-name {
  max-width: 70rpx;
  font-size: 18rpx;
  line-height: 1.2;
  color: #606266;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bg-color-option.active .bg-color-name {
  color: var(--u-type-primary);
  font-weight: 600;
}

/* 听书模式提示 */
.listen-mode-toast {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 200;
}

.listen-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(0, 0, 0, 0.85);
  padding: 40rpx 60rpx;
  border-radius: 20rpx;
  gap: 16rpx;
}

.listen-text {
  font-size: 32rpx;
  color: #fff;
  font-weight: 600;
}

.listen-hint {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.7);
}

// ==================== 横屏模式 ====================

.landscape-mode {
  .reader-content {
    // 横屏时阅读区域加大左右留白，提升阅读体验
    .page-content,
    .vertical-content {
      max-width: 70%;
      margin: 0 auto;
    }
  }

  .toolbar {
    &.top-toolbar {
      padding: 20rpx 80rpx;
    }
  }

  .bottom-toolbar {
    .chapter-nav {
      padding: 0 80rpx;
    }
  }

  // 横屏时工具条左右留白
  .settings-section {
    padding: 12rpx 80rpx;
  }
}

.note-popup {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}
.note-popup-content {
  width: 85%;
  background: #fff;
  border-radius: 16rpx;
  padding: 32rpx;
}
.note-popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}
.note-popup-title { font-size: 32rpx; font-weight: 600; }
.selected-text { background: #f5f5f5; padding: 16rpx; border-radius: 8rpx; margin-bottom: 20rpx; }
.selected-label { font-size: 24rpx; color: #999; }
.selected-content { font-size: 28rpx; margin-top: 8rpx; display: block; }
.color-picker { margin-bottom: 20rpx; }
.color-label { font-size: 24rpx; color: #666; margin-bottom: 12rpx; display: block; }
.color-options { display: flex; gap: 16rpx; }
.color-dot { width: 48rpx; height: 48rpx; border-radius: 50%; border: 3rpx solid transparent; }
.color-dot.active { border-color: #333; transform: scale(1.1); }
.note-textarea {
  width: 100%;
  min-height: 160rpx;
  border: 1rpx solid #e0e0e0;
  border-radius: 8rpx;
  padding: 16rpx;
  font-size: 28rpx;
  margin-bottom: 24rpx;
}
.note-actions { display: flex; gap: 20rpx; justify-content: flex-end; }
.note-btn { padding: 12rpx 40rpx; border-radius: 8rpx; font-size: 28rpx; border: none; }
.note-btn.cancel { background: #f5f5f5; color: #666; }
.note-btn.save { background: var(--u-type-primary, #2979ff); color: #fff; }
.toolbar-btn { padding: 8rpx 16rpx; }
</style>