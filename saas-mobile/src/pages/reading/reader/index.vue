<template>
  <view class="reader-page" :class="{ 'night-mode': isNightMode }">
    <!-- 顶部工具栏 -->
    <view
      v-show="showToolbar"
      class="toolbar top-toolbar"
      :class="{ show: showToolbar }"
      @click.stop
    >
      <view class="toolbar-left" @click="goBack">
        <u-icon name="arrow-left" color="#fff" size="40" />
      </view>
      <text class="toolbar-title">{{ currentChapter?.title || "" }}</text>
      <view class="toolbar-right">
        <u-icon name="share" color="#fff" size="40" @click="shareBook" />
      </view>
    </view>

    <!-- 阅读区域 -->
    <view
      class="reader-content"
      @click="toggleToolbar"
      @touchstart="onTouchStart"
      @touchend="onTouchEnd"
    >
      <swiper
        class="chapter-swiper"
        :current="currentPage"
        @change="onPageChange"
        :duration="200"
        :style="{ background: bgColorStyle }"
      >
        <swiper-item v-for="(page, idx) in currentPages" :key="idx">
          <scroll-view class="page-scroll" scroll-y>
            <view class="page-content">
              <text class="chapter-title-text">{{
                currentChapter?.title || ""
              }}</text>
              <text class="content-text" :style="textStyle">{{ page }}</text>
            </view>
          </scroll-view>
        </swiper-item>
      </swiper>
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
        <view class="nav-btn" @click.stop="showChapterList">
          <u-icon name="list" color="#fff" size="32" />
          <text>目录</text>
        </view>
        <view class="nav-btn" @click.stop="toggleBookmark">
          <u-icon
            :name="isBookmarked ? 'bookmark-fill' : 'bookmark'"
            :color="isBookmarked ? '#ffd43b' : '#fff'"
            size="32"
          />
          <text>书签</text>
        </view>
        <view class="nav-btn" @click.stop="toggleListenMode">
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
        <text class="progress-text"
          >{{ currentPage + 1 }}/{{ currentPages.length }}</text
        >
        <slider
          class="progress-slider"
          :value="currentPage"
          :max="currentPages.length - 1"
          :step="1"
          activeColor="var(--u-type-primary)"
          backgroundColor="rgba(255,255,255,0.2)"
          block-color="var(--u-type-primary)"
          block-size="20"
          @change="onProgressChange"
        />
      </view>

      <!-- 设置 -->
      <view class="settings-section">
        <view class="setting-item" @click.stop="toggleNightMode">
          <u-icon :name="isNightMode ? 'info-circle-fill' : 'info-circle'" color="#fff" size="40" />
          <text>{{ isNightMode ? "日间" : "夜间" }}</text>
        </view>
        <view class="setting-item" @click.stop="decreaseFontSize">
          <text class="font-btn">A-</text>
          <text>小字</text>
        </view>
        <view class="setting-item" @click.stop="increaseFontSize">
          <text class="font-btn large">A+</text>
          <text>大字</text>
        </view>
        <view class="setting-item" @click.stop="showSettings">
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
      <view class="settings-popup">
        <view class="settings-popup-header">
          <text class="settings-popup-title">阅读设置</text>
          <u-icon
            name="close"
            color="#909399"
            size="40"
            @click="showSettingsPopup = false"
          />
        </view>

        <!-- 字体大小 -->
        <view class="setting-row">
          <text class="setting-label">字体大小</text>
          <view class="font-size-control">
            <u-button
              text="A-"
              size="small"
              :disabled="fontSize <= 14"
              @click="decreaseFontSize"
            />
            <text class="font-size-value">{{ fontSize }}px</text>
            <u-button
              text="A+"
              size="small"
              :disabled="fontSize >= 28"
              @click="increaseFontSize"
            />
          </view>
        </view>

        <!-- 行间距 -->
        <view class="setting-row">
          <text class="setting-label">行间距</text>
          <view class="line-height-control">
            <u-button
              text="紧凑"
              size="small"
              :type="lineHeight === 1.5 ? 'primary' : 'default'"
              @click="lineHeight = 1.5"
            />
            <u-button
              text="标准"
              size="small"
              :type="lineHeight === 1.8 ? 'primary' : 'default'"
              @click="lineHeight = 1.8"
            />
            <u-button
              text="宽松"
              size="small"
              :type="lineHeight === 2.0 ? 'primary' : 'default'"
              @click="lineHeight = 2.0"
            />
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
              :class="{ active: bgColor === color.value }"
              @click="onBgColorChange(color.value)"
            >
              <view class="bg-color-dot" :style="{ background: color.color }">
                <u-icon
                  v-if="bgColor === color.value"
                  name="checkmark"
                  :color="color.value === 'dark' ? '#c0c4cc' : 'var(--u-type-primary)'"
                  size="18"
                />
              </view>
              <text class="bg-color-name">{{ color.name }}</text>
            </view>
          </view>
        </view>

        <!-- 翻页方式 -->
        <view class="setting-row">
          <text class="setting-label">翻页方式</text>
          <view class="page-mode-control">
            <u-button
              text="覆盖"
              size="small"
              :type="pageMode === 'cover' ? 'primary' : 'default'"
              @click="pageMode = 'cover'"
            />
            <u-button
              text="滑动"
              size="small"
              :type="pageMode === 'slide' ? 'primary' : 'default'"
              @click="pageMode = 'slide'"
            />
            <u-button
              text="上下"
              size="small"
              :type="pageMode === 'vertical' ? 'primary' : 'default'"
              @click="pageMode = 'vertical'"
            />
          </view>
        </view>

        <!-- 亮度 -->
        <view class="setting-row">
          <text class="setting-label">亮度</text>
          <view class="brightness-control">
            <u-icon name="info-circle" color="#909399" size="28" />
            <slider
              class="brightness-slider"
              :value="brightness"
              :min="20"
              :max="100"
              activeColor="var(--u-type-primary)"
              backgroundColor="#f0f0f0"
              block-color="var(--u-type-primary)"
              block-size="20"
              @change="onBrightnessChange"
            />
            <u-icon name="info-circle-fill" color="#303133" size="28" />
          </view>
        </view>
      </view>
    </u-popup>

    <!-- 书签列表弹窗 -->
    <u-popup v-model="showBookmarkPopup" mode="bottom">
      <view class="bookmark-popup">
        <view class="popup-header">
          <text class="popup-title">书签</text>
          <text class="popup-close" @click="showBookmarkPopup = false"
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
            @click="jumpToBookmark(bookmark)"
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
import { useReadingStore } from "@/stores/reading";
import { computed, ref, watch, onMounted, onUnmounted } from "vue";
import { onLoad, onUnload } from "@dcloudio/uni-app";

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

const readingStore = useReadingStore();
const showToolbar = ref(false);
const showChapterPopup = ref(false);
const showSettingsPopup = ref(false);
const showBookmarkPopup = ref(false);
const isNightMode = ref(false);
const isListenMode = ref(false);
const isBookmarked = ref(false);
const currentPage = ref(0);
const fontSize = ref(18);
const lineHeight = ref(1.8);
const bgColor = ref("default");
const pageMode = ref("slide");
const brightness = ref(80);
const bookId = ref("");
const chapterId = ref("");
const totalChapters = ref(0);
const touchStartX = ref(0);
const touchStartY = ref(0);

const bgColors = [
  { value: "default", color: "#f5f0e6", name: "默认" },
  { value: "warm", color: "#f0e6d3", name: "暖纸" },
  { value: "green", color: "#c7edcc", name: "护眼" },
  { value: "blue", color: "#d6e6f2", name: "淡蓝" },
  { value: "pink", color: "#f2d6d6", name: "粉色" },
  { value: "yellow", color: "#f5e6c8", name: "羊皮" },
  { value: "gray", color: "#e8e8e8", name: "浅灰" },
  { value: "dark", color: "#1a1a1a", name: "暗黑" },
];

const bgColorStyle = computed(() => {
  const color = bgColors.find((c) => c.value === bgColor.value);
  return color?.color || "#f5f0e6";
});

const chapterList = ref<Chapter[]>([
  { id: "1", title: "第一章 陨落的天才", isVip: false },
  { id: "2", title: "第二章 斗之气三段", isVip: false },
  { id: "3", title: "第三章 客人", isVip: false },
  { id: "4", title: "第四章 云岚宗", isVip: false },
  { id: "5", title: "第五章 萧薰儿", isVip: false },
  { id: "6", title: "第六章 炼丹", isVip: false },
  { id: "7", title: "第七章 异火榜", isVip: false },
  { id: "8", title: "第八章 修炼", isVip: false },
  { id: "9", title: "第九章 比试", isVip: false },
  { id: "10", title: "第十章 药老", isVip: true },
  { id: "11", title: "第十一章 突破", isVip: true },
  { id: "12", title: "第十二章 斗技", isVip: true },
]);

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
  fontSize: fontSize.value + "px",
  lineHeight: lineHeight.value,
}));

const onTouchStart = (e: TouchEvent) => {
  touchStartX.value = e.touches[0].clientX;
  touchStartY.value = e.touches[0].clientY;
};

const onTouchEnd = (e: TouchEvent) => {
  const endX = e.changedTouches[0].clientX;
  const endY = e.changedTouches[0].clientY;
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

onLoad((options) => {
  if (options?.bookId) {
    bookId.value = options.bookId;
  }
  if (options?.chapterId) {
    chapterId.value = options.chapterId;
  }
  totalChapters.value = chapterList.value.length;

  // 检查当前页是否已收藏书签
  checkBookmarkStatus();
});

onUnload(() => {
  // 保存阅读进度
  if (bookId.value && chapterId.value) {
    readingStore.saveReadingProgress(
      bookId.value,
      chapterId.value,
      currentPage.value,
    );
  }
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

const onPageChange = (e: any) => {
  currentPage.value = e.detail.current;
  checkBookmarkStatus();
};

const onProgressChange = (e: any) => {
  currentPage.value = e.detail.value;
  checkBookmarkStatus();
};

const prevChapter = () => {
  if (!hasPrevChapter.value) return;
  const prevIdx = currentChapterIndex.value - 1;
  chapterId.value = chapterList.value[prevIdx].id;
  currentPage.value = 0;
  checkBookmarkStatus();
};

const nextChapter = () => {
  if (!hasNextChapter.value) return;
  const nextIdx = currentChapterIndex.value + 1;
  chapterId.value = chapterList.value[nextIdx].id;
  currentPage.value = 0;
  checkBookmarkStatus();
};

const showChapterList = () => {
  showChapterPopup.value = true;
};

const jumpToChapter = (chapter: Chapter) => {
  chapterId.value = chapter.id;
  currentPage.value = 0;
  showChapterPopup.value = false;
  checkBookmarkStatus();
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

const onBrightnessChange = (e: any) => {
  brightness.value = e.detail.value;
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
      content: content + "...",
      page: currentPage.value,
      time: Date.now(),
    });
    isBookmarked.value = true;
    uni.showToast({ title: "已添加书签", icon: "success" });
  }
};

const checkBookmarkStatus = () => {
  isBookmarked.value = bookmarks.value.some(
    (b) => b.chapterId === chapterId.value && b.page === currentPage.value,
  );
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
    background: #1a1a1a;

    .content-text {
      color: #999;
    }

    .chapter-title-text {
      color: #666;
    }
  }
}

.toolbar {
  position: fixed;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.85);
  z-index: 150;
  padding: 0 24rpx;
  transform: translateY(-100%);
  transition: transform 0.3s ease;
  pointer-events: none;

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
  font-size: 32rpx;
  color: #fff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bottom-toolbar {
  bottom: 0;
  padding-bottom: env(safe-area-inset-bottom);
  transform: translateY(100%);

  &.show {
    transform: translateY(0);
  }
}

.chapter-nav {
  display: flex;
  justify-content: space-around;
  padding: 20rpx 0;
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.1);
}

.nav-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #fff;
  font-size: 24rpx;
  gap: 8rpx;

  &.disabled {
    opacity: 0.5;
  }
}

.progress-section {
  display: flex;
  align-items: center;
  padding: 20rpx 24rpx;
  gap: 20rpx;
}

.progress-text {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
  width: 80rpx;
}

.progress-slider {
  flex: 1;
}

.settings-section {
  display: flex;
  justify-content: space-around;
  padding: 20rpx 0;
  border-top: 1rpx solid rgba(255, 255, 255, 0.1);
}

.setting-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #fff;
  font-size: 22rpx;
  gap: 8rpx;
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
  padding: 120rpx 40rpx;
  min-height: 100%;
  box-sizing: border-box;
}

.chapter-title-text {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 40rpx;
  text-align: center;
}

.content-text {
  font-size: 18px;
  color: #333;
  line-height: 1.8;
  text-align: justify;
}

.chapter-popup {
  width: 600rpx;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx 24rpx;
  border-bottom: 1rpx solid #eee;
}

.popup-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #303133;
}

.popup-sub {
  font-size: 24rpx;
  color: #909399;
}

.popup-close {
  font-size: 28rpx;
  color: var(--u-type-primary);
}

.chapter-scroll {
  flex: 1;
}

.chapter-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 28rpx 24rpx;
  border-bottom: 1rpx solid #f5f5f5;

  &.active {
    background: rgba(102, 126, 234, 0.1);

    .chapter-name {
      color: var(--u-type-primary);
      font-weight: 600;
    }
  }
}

.chapter-name {
  font-size: 28rpx;
  color: #303133;
}

.vip-tag {
  font-size: 20rpx;
  padding: 2rpx 8rpx;
  background: #ffa502;
  color: #fff;
  border-radius: 4rpx;
}

.settings-popup {
  padding: 30rpx 24rpx;
  padding-bottom: calc(30rpx + env(safe-area-inset-bottom));
}

.setting-row {
  margin-bottom: 30rpx;
}

.setting-label {
  display: block;
  font-size: 28rpx;
  color: #303133;
  margin-bottom: 16rpx;
}

.font-size-control,
.line-height-control,
.page-mode-control {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.font-size-value {
  font-size: 28rpx;
  color: #606266;
  width: 80rpx;
  text-align: center;
}

.bg-setting-row {
  margin-bottom: 24rpx;
}

.bg-color-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10rpx;
  padding: 4rpx 0 0;
}

.bg-color-option {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.bg-color-dot {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  border: 2rpx solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 1rpx 3rpx rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
}

.bg-color-option.active {
  .bg-color-dot {
    border-color: var(--u-type-primary);
    box-shadow: 0 0 0 3rpx rgba(102, 126, 234, 0.16);
  }
}

.brightness-control {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.brightness-slider {
  flex: 1;
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

.settings-popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 0;
  margin-bottom: 20rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.settings-popup-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #303133;
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
