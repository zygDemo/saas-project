<template>
  <view class="reader-page" :class="{ 'night-mode': isNightMode }">
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
        @change="onPageChange"
        :duration="pageMode === 'cover' ? 350 : 200"
        :style="{ background: bgColorStyle }"
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
        <text v-if="pageMode !== 'vertical'" class="progress-text"
          >{{ currentPage + 1 }}/{{ currentPages.length }}</text
        >
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
            >关闭</text
          >
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

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { onLoad, onUnload } from "@dcloudio/uni-app";
import { useReadingApi } from "@/api/reading";

// 本地存储 key
const STORAGE_KEY = "reader_settings";

interface Chapter {
  id: string;
  title: string;
  isVip: boolean;
  content?: string;
}

interface Bookmark {
  id: string;
  chapterId: string;
  chapterTitle: string;
  content: string;
  page: number;
  time: number;
}

// 从本地存储读取设置
function loadSettings() {
  try {
    const saved = uni.getStorageSync(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // ignore
  }
  return null;
}

const readingApi = useReadingApi();
const showToolbar = ref(false);
const showChapterPopup = ref(false);
const showSettingsPopup = ref(false);
const showBookmarkPopup = ref(false);

// 初始化设置（优先从本地存储读取）
const savedSettings = loadSettings();
const isNightMode = ref(savedSettings?.isNightMode ?? false);
const fontSize = ref(savedSettings?.fontSize ?? 18);
const lineHeight = ref(savedSettings?.lineHeight ?? 1.8);
const bgColor = ref(savedSettings?.bgColor ?? "default");
const pageMode = ref(savedSettings?.pageMode ?? "slide");
const brightness = ref(savedSettings?.brightness ?? 80);

const isListenMode = ref(false);
const isBookmarked = ref(false);
const currentPage = ref(0);
const verticalScrollTop = ref(0);
const bookId = ref("");
const chapterId = ref("");
const totalChapters = ref(0);
const touchStartX = ref(0);
const touchStartY = ref(0);

const bgColors = [
  { value: "default", color: "#f5f0e6", name: "默认" },
  { value: "warm", color: "#efe5d5", name: "暖纸" },
  { value: "green", color: "#dce8d4", name: "护眼" },
  { value: "blue", color: "#dce4ee", name: "淡蓝" },
  { value: "pink", color: "#f0dcd8", name: "粉色" },
  { value: "yellow", color: "#eee0c4", name: "羊皮" },
  { value: "gray", color: "#e6e6e6", name: "浅灰" },
  { value: "dark", color: "#1e1e1e", name: "暗黑" },
];

const bgColorStyle = computed(() => {
  const color = bgColors.find((c) => c.value === bgColor.value);
  return color?.color || "#f5f0e6";
});

const chapterList = ref<Chapter[]>([]);

const bookmarks = ref<Bookmark[]>([
  {
    id: "1",
    chapterId: "1",
    chapterTitle: "第一章 陨落的天才",
    content: "三十年河东，三十年河西，莫欺少年穷！",
    page: 0,
    time: Date.now() - 3600000,
  },
]);

const currentChapter = computed(() => {
  return (
    chapterList.value.find((c) => c.id === chapterId.value) ||
    chapterList.value[0]
  );
});

const currentChapterIndex = computed(() => {
  return chapterList.value.findIndex((c) => c.id === chapterId.value);
});

const hasPrevChapter = computed(() => currentChapterIndex.value > 0);
const hasNextChapter = computed(
  () => currentChapterIndex.value < chapterList.value.length - 1,
);

// 模拟章节内容
const chapterContent = ref(
  `斗气大陆，加玛帝国，乌坦城。

萧家大厅之中，一位少年坐在角落，他的目光有些空洞，似乎在思考着什么。

"萧炎，斗之气三段！"

测试台上，一位老者大声宣布着测试结果，声音中带着一丝惋惜。

大厅中顿时响起一片哗然之声。

"三段？怎么可能！萧炎可是萧家百年来最年轻的斗者啊！"

"是啊，三年前他可是九段斗之气，怎么会跌落到三段？"

"唉，真是可惜了，本来还以为他能成为萧家的骄傲呢。"

少年缓缓站起身，他的脸上没有太多的表情，似乎早已习惯了这样的议论。

他叫萧炎，曾经是萧家最耀眼的天才，四岁修炼，十岁九段斗之气，十一岁成为斗者。

然而三年前，他的修为突然停滞不前，甚至开始倒退，从九段跌落到三段。

没有人知道原因，包括他自己。

"萧炎哥哥。"

一个清脆的声音响起，一位少女走了过来，她有着一双灵动的眼睛，脸上带着关切的神情。

"没事，薰儿。"萧炎微微一笑，"我已经习惯了。"

萧薰儿，萧家的养女，也是萧炎最亲近的人之一。

"走吧，我们回去。"萧炎说着，向大厅外走去。

夕阳西下，少年的背影显得有些落寞，但他的眼神中却闪烁着不屈的光芒。

三十年河东，三十年河西，莫欺少年穷！

回到自己的房间，萧炎坐在床边，从怀中取出一枚古朴的戒指。

这枚戒指是他母亲留下的遗物，三年来他一直带在身上。

"又失败了吗？"萧炎喃喃自语，手指轻轻摩挲着戒指。

突然，戒指发出一丝微弱的光芒，萧炎的眼睛猛地睁大。

"这是……"

一个苍老的声音从戒指中传出："小子，你终于发现了吗？"

萧炎吓了一跳，差点把戒指扔出去。

"别怕，老夫不会害你。"那声音继续说道，"老夫名为药尘，你可以叫我药老。"

"药尘？"萧炎愣住了，"你是……药尊者？"

药尘，曾经的斗气大陆第一炼药师，号称药尊者，二十年前突然消失，没有人知道他去了哪里。

"不错，正是老夫。"药尘的声音中带着一丝得意，"你的修为之所以倒退，是因为老夫在吸收你的斗之气。"

萧炎的脸色一变："你说什么？"

"别急，听老夫说完。"药尘说道，"你的体质很特殊，是天生的炼药师体质，老夫吸收你的斗之气，是为了帮你打下更好的基础。"

"从今天开始，老夫会教你真正的修炼之法，让你重新成为天才。"

萧炎的眼中闪过一丝光芒，他知道，自己的命运从这一刻开始改变了。`,
);

const currentPages = computed(() => {
  // 模拟分页：每页约 500 字
  const content = chapterContent.value;
  const pageSize = 500;
  const pages = [];
  for (let i = 0; i < content.length; i += pageSize) {
    pages.push(content.slice(i, i + pageSize));
  }
  return pages.length > 0 ? pages : [content];
});

const textStyle = computed(() => ({
  fontSize: `${fontSize.value}px`,
  lineHeight: lineHeight.value,
}));

// 将章节内容按段落分割
function splitIntoParagraphs(text: string): string[] {
  if (!text) return [];
  // 按空行分割段落，过滤掉纯空白的段落
  return text.split(/\n\s*\n/).map(p => p.trim()).filter(p => p !== '');
}

// 当前章节的段落数组
const chapterParagraphs = computed(() => {
  return splitIntoParagraphs(chapterContent.value);
});

// 将分页内容也按段落分割
function getPageParagraphs(pageText: string): string[] {
  return splitIntoParagraphs(pageText);
}

// 保存设置到本地存储
function saveSettings() {
  try {
    uni.setStorageSync(
      STORAGE_KEY,
      JSON.stringify({
        fontSize: fontSize.value,
        lineHeight: lineHeight.value,
        bgColor: bgColor.value,
        pageMode: pageMode.value,
        brightness: brightness.value,
        isNightMode: isNightMode.value,
      }),
    );
  } catch {
    // ignore
  }
}

// 监听设置变化并保存到本地存储
watch(
  [fontSize, lineHeight, bgColor, pageMode, brightness, isNightMode],
  () => {
    saveSettings();
  },
);

// 切换翻页模式
const setPageMode = (mode: string) => {
  pageMode.value = mode;
};

// 切换行间距
const setLineHeight = (val: number) => {
  lineHeight.value = val;
};

// 切换翻页模式时重置页码
watch(pageMode, (newVal, _oldVal) => {
  currentPage.value = 0;
  if (newVal === "vertical") {
    verticalScrollTop.value = 0;
  }
});

const onTouchStart = (e: TouchEvent) => {
  touchStartX.value = e.touches[0].clientX;
  touchStartY.value = e.touches[0].clientY;
};

const checkBookmarkStatus = () => {
  isBookmarked.value = bookmarks.value.some(
    (b) => b.chapterId === chapterId.value && b.page === currentPage.value,
  );
};

// 防抖保存进度
let saveProgressTimer: ReturnType<typeof setTimeout> | null = null;
const debouncedSaveProgress = () => {
  if (saveProgressTimer) clearTimeout(saveProgressTimer);
  saveProgressTimer = setTimeout(async () => {
    if (bookId.value && chapterId.value) {
      try {
        await readingApi.saveProgress({
          bookId: bookId.value,
          chapterId: chapterId.value,
          page: currentPage.value,
        });
      } catch (e) {
        console.error("保存阅读进度失败", e);
      }
    }
  }, 2000);
};

const prevChapter = async () => {
  if (!hasPrevChapter.value) return;
  const prevIdx = currentChapterIndex.value - 1;
  chapterId.value = chapterList.value[prevIdx].id;
  currentPage.value = 0;
  checkBookmarkStatus();
  const detail = await readingApi.getChapterDetail(chapterId.value);
  chapterContent.value = detail.data?.content || "";
  debouncedSaveProgress();
};

const nextChapter = async () => {
  if (!hasNextChapter.value) return;
  const nextIdx = currentChapterIndex.value + 1;
  chapterId.value = chapterList.value[nextIdx].id;
  currentPage.value = 0;
  checkBookmarkStatus();
  const detail = await readingApi.getChapterDetail(chapterId.value);
  chapterContent.value = detail.data?.content || "";
  debouncedSaveProgress();
};

const onTouchEnd = (ev: TouchEvent) => {
  // 垂直模式下不处理水平滑动
  if (pageMode.value === "vertical") return;

  const endX = ev.changedTouches[0].clientX;
  const endY = ev.changedTouches[0].clientY;
  const diffX = endX - touchStartX.value;
  const diffY = endY - touchStartY.value;

  // 水平滑动超过 50px 才触发翻页
  if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY)) {
    if (diffX > 0) {
      // 向右滑动，上一页
      if (currentPage.value > 0) {
        currentPage.value--;
      } else if (hasPrevChapter.value) {
        prevChapter();
      }
    } else {
      // 向左滑动，下一页
      if (currentPage.value < currentPages.value.length - 1) {
        currentPage.value++;
      } else if (hasNextChapter.value) {
        nextChapter();
      }
    }
  }
};

onLoad(async (options) => {
  if (options?.bookId) {
    bookId.value = String(options.bookId);
  }
  if (options?.chapterId) {
    chapterId.value = String(options.chapterId);
  }

  if (bookId.value) {
    try {
      // 使用轻量接口一次性加载全部章节目录（仅 id/title/sort）
      const liteRes = await readingApi.getChaptersLite(bookId.value);
      const allItems = liteRes.data?.items || [];

      chapterList.value = allItems.map((item: any) => ({
        id: String(item.id),
        title: item.title,
        isVip: false,
      }));

      // 先尝试读取已保存的阅读进度（仅请求一次）
      let savedChapterId = "";
      let savedPage = 0;
      if (!options?.chapterId) {
        // 只有当 URL 没有指定章节时才恢复进度
        try {
          const progressRes = await readingApi.getProgress(bookId.value);
          const saved = progressRes?.data;
          if (saved?.chapterId) {
            const exists = allItems.some(
              (item: any) => String(item.id) === String(saved.chapterId),
            );
            if (exists) {
              savedChapterId = String(saved.chapterId);
              savedPage = saved.page || 0;
            }
          }
        } catch {
          // 无保存进度
        }
      }

      // 确定要加载的章节
      if (!chapterId.value && savedChapterId) {
        chapterId.value = savedChapterId;
      }
      if (!chapterId.value && allItems.length) {
        chapterId.value = String(allItems[0].id);
      }

      if (chapterId.value) {
        const detail = await readingApi.getChapterDetail(chapterId.value);
        chapterContent.value = detail.data?.content || "";
        // 恢复保存的页码
        if (savedPage > 0) {
          currentPage.value = savedPage;
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
  // 离开页面时立即保存进度（不防抖）
  if (bookId.value && chapterId.value) {
    readingApi.saveProgress({
      bookId: bookId.value,
      chapterId: chapterId.value,
      page: currentPage.value,
    }).catch((e) => console.error("保存阅读进度失败", e));
  }
  // 最后保存一次设置
  saveSettings();
});

const toggleToolbar = () => {
  showToolbar.value = !showToolbar.value;
};

const goBack = () => {
  uni.navigateBack();
};

const shareBook = () => {
  uni.showShareMenu({
    withShareTicket: true,
    menus: ["shareAppMessage", "shareTimeline"],
  });
};

const isAutoLoading = ref(false);

const onVerticalScroll = (_scrollEvent: any) => {
  // scroll-view 滚动事件，实际加载通过 scrolltolower 触发
};

const resetScrollToTop = () => {
  // 通过 :key="chapterId" 变化会重建 scroll-view，自动回到顶部
  verticalScrollTop.value = 0;
};

const onScrollToLower = async () => {
  // 滚动到底部，自动加载下一章
  if (hasNextChapter.value && !isAutoLoading.value) {
    isAutoLoading.value = true;
    try {
      const nextIdx = currentChapterIndex.value + 1;
      chapterId.value = chapterList.value[nextIdx].id;
      const detail = await readingApi.getChapterDetail(chapterId.value);
      chapterContent.value = detail.data?.content || "";
      // 滚动到新章节顶部
      resetScrollToTop();
      checkBookmarkStatus();
    } catch (err) {
      console.error("vertical auto-load failed", err);
    } finally {
      isAutoLoading.value = false;
    }
  }
};

const onPageChange = async (changeEvent: any) => {
  currentPage.value = changeEvent.detail.current;
  checkBookmarkStatus();
  debouncedSaveProgress();
  // 滑到最后一页时自动加载下一章
  if (
    currentPage.value >= currentPages.value.length - 1 &&
    hasNextChapter.value &&
    !isAutoLoading.value
  ) {
    isAutoLoading.value = true;
    try {
      const nextIdx = currentChapterIndex.value + 1;
      chapterId.value = chapterList.value[nextIdx].id;
      currentPage.value = 0;
      const detail = await readingApi.getChapterDetail(chapterId.value);
      chapterContent.value = detail.data?.content || "";
      checkBookmarkStatus();
      debouncedSaveProgress();
    } catch (err) {
      console.error("auto-load next chapter failed", err);
    } finally {
      isAutoLoading.value = false;
    }
  }
};

const onProgressChange = (progressEvent: any) => {
  currentPage.value = progressEvent.detail.value;
  checkBookmarkStatus();
};

const showChapterList = () => {
  showChapterPopup.value = true;
};

const jumpToChapter = async (chapter: Chapter) => {
  chapterId.value = chapter.id;
  currentPage.value = 0;
  showChapterPopup.value = false;
  checkBookmarkStatus();
  const detail = await readingApi.getChapterDetail(chapterId.value);
  chapterContent.value = detail.data?.content || "";
  debouncedSaveProgress();
};

const toggleNightMode = () => {
  isNightMode.value = !isNightMode.value;
  bgColor.value = isNightMode.value ? "dark" : "default";
};

const decreaseFontSize = () => {
  if (fontSize.value > 14) {
    fontSize.value -= 2;
  }
};

const increaseFontSize = () => {
  if (fontSize.value < 28) {
    fontSize.value += 2;
  }
};

const showSettings = () => {
  showSettingsPopup.value = true;
};

const onBgColorChange = (color: string) => {
  bgColor.value = color;
  if (color === "dark") {
    isNightMode.value = true;
  } else {
    isNightMode.value = false;
  }
};

const onBrightnessChange = (brightnessEvent: any) => {
  brightness.value = brightnessEvent.detail.value;
  // 实际项目中这里可以调整屏幕亮度
};

const toggleBookmark = () => {
  if (isBookmarked.value) {
    // 删除当前页书签
    const idx = bookmarks.value.findIndex(
      (b) => b.chapterId === chapterId.value && b.page === currentPage.value,
    );
    if (idx > -1) {
      bookmarks.value.splice(idx, 1);
    }
    isBookmarked.value = false;
    uni.showToast({ title: "已取消书签", icon: "success" });
  } else {
    // 添加书签
    const content = currentPages.value[currentPage.value]?.slice(0, 50) || "";
    bookmarks.value.unshift({
      id: Date.now().toString(),
      chapterId: chapterId.value,
      chapterTitle: currentChapter.value?.title || "",
      content: `${content}...`,
      page: currentPage.value,
      time: Date.now(),
    });
    isBookmarked.value = true;
    uni.showToast({ title: "已添加书签", icon: "success" });
  }
};

const deleteBookmark = (bookmark: Bookmark) => {
  uni.showModal({
    title: "提示",
    content: "确定删除这个书签？",
    success: (res) => {
      if (res.confirm) {
        const idx = bookmarks.value.findIndex((b) => b.id === bookmark.id);
        if (idx > -1) {
          bookmarks.value.splice(idx, 1);
        }
        checkBookmarkStatus();
        uni.showToast({ title: "已删除", icon: "success" });
      }
    },
  });
};

const jumpToBookmark = (bookmark: Bookmark) => {
  if (bookmark.chapterId !== chapterId.value) {
    chapterId.value = bookmark.chapterId;
  }
  currentPage.value = bookmark.page;
  showBookmarkPopup.value = false;
  checkBookmarkStatus();
  debouncedSaveProgress();
};

const formatBookmarkTime = (timestamp: number) => {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  return `${days}天前`;
};

const toggleListenMode = () => {
  isListenMode.value = !isListenMode.value;
  if (isListenMode.value) {
    uni.showToast({ title: "听书模式已开启", icon: "none" });
    // 实际项目中这里可以调用 TTS API 进行语音朗读
  } else {
    uni.showToast({ title: "听书模式已关闭", icon: "none" });
  }
};
</script>

<style scoped lang="scss">
.reader-page {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #f5f0e6;

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
  background: rgba(0, 0, 0, 0.82);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);

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
  height: 88rpx;
  padding-top: var(--status-bar-height);
}

.toolbar-left,
.toolbar-right {
  width: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toolbar-title {
  flex: 1;
  text-align: center;
  font-size: 30rpx;
  color: #fff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
  letter-spacing: 1rpx;
}

.bottom-toolbar {
  bottom: 0;
  padding-bottom: env(safe-area-inset-bottom);
  transform: translateY(100%);
  background: rgba(0, 0, 0, 0.82);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);

  &.show {
    transform: translateY(0);
  }
}

.chapter-nav {
  display: flex;
  justify-content: space-around;
  padding: 24rpx 0 20rpx;
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.08);
}

.nav-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #fff;
  font-size: 22rpx;
  gap: 8rpx;
  padding: 8rpx 20rpx;
  border-radius: 12rpx;
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
  padding: 8rpx 16rpx;
  border-radius: 12rpx;
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
  padding: 120rpx 48rpx 80rpx;
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
  letter-spacing: 2rpx;
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
  padding: 24rpx 48rpx 120rpx;
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
  width: 560rpx;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 0 16rpx 16rpx 0;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 28rpx 28rpx 24rpx;
  border-bottom: 1rpx solid #f0f0f0;
  position: sticky;
  top: 0;
  background: #fff;
  z-index: 1;
}

.popup-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1a1a1a;
  letter-spacing: 1rpx;
}

.popup-sub {
  font-size: 22rpx;
  color: #999;
  background: #f5f5f5;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
}

.popup-close {
  font-size: 26rpx;
  color: #667eea;
  padding: 8rpx 16rpx;
}

.chapter-scroll {
  flex: 1;
}

.chapter-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 26rpx 28rpx;
  border-bottom: 1rpx solid #f8f8f8;
  transition: background 0.15s;

  &:active {
    background: #f8f8f8;
  }

  &.active {
    background: rgba(102, 126, 234, 0.08);

    .chapter-name {
      color: #667eea;
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
    background: rgba(10, 10, 10, 0.92) !important;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }

  .chapter-popup {
    background: #1a1a1a;
    border-radius: 0 16rpx 16rpx 0;
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
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.06);
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
  background: rgba(0, 0, 0, 0.06);
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
  padding: 16rpx 24rpx 20rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  max-height: 55vh;
  overflow-y: auto;
  transition: background 0.3s ease;
}

.settings-popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12rpx 0 16rpx;
  margin-bottom: 12rpx;
  border-bottom: 1rpx solid rgba(0, 0, 0, 0.06);
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
  padding: 24rpx;
  border-bottom: 1rpx solid #f5f5f5;
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
</style>
