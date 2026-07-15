<!--
  虚拟滚动列表组件
  适用于长列表场景，只渲染可视区域内的元素，大幅减少 DOM 节点数

  用法：
  <VirtualList :items="list" :item-height="120" :height="600" @scroll="onScroll">
    <template #default="{ item, index }">
      <MyCard :data="item" :index="index" />
    </template>
  </VirtualList>
-->
<template>
  <scroll-view
    class="virtual-list"
    scroll-y
    :style="{ height: `${containerHeight}px` }"
    :scroll-top="scrollTopValue"
    :scroll-with-animation="false"
    @scroll="onScroll"
  >
    <!-- 占位元素：撑开总高度 -->
    <view class="virtual-list-phantom" :style="{ height: `${totalHeight}px` }">
      <!-- 可视区域内容 -->
      <view
        class="virtual-list-content"
        :style="{ transform: `translateY(${offsetY}px)` }"
      >
        <view
          v-for="item in visibleItems"
          :key="item.key ?? item.index"
          class="virtual-list-item"
          :style="{ height: `${itemHeight}px` }"
        >
          <slot :item="item.raw" :index="item.index" />
        </view>
      </view>
    </view>
  </scroll-view>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";

interface VirtualListItem<T> {
  index: number;
  raw: T;
  key: string | number | undefined;
}

const props = withDefaults(
  defineProps<{
    /** 数据源 */
    items: unknown[];
    /** 单项高度（rpx → px 由外部传入时转换） */
    itemHeight: number;
    /** 容器高度（px） */
    height: number;
    /** 预渲染的缓冲项数 */
    buffer?: number;
    /** 滚动位置（受控） */
    scrollTop?: number;
    /** key 字段名（默认用 index） */
    keyField?: string;
  }>(),
  {
    buffer: 5,
    scrollTop: 0,
    keyField: "",
  },
);

const emit = defineEmits<{
  (e: "scroll", scrollTop: number): void;
  (e: "reachBottom"): void;
}>();

// 内部滚动位置
const currentScrollTop = ref(0);

// 受控滚动位置
const scrollTopValue = computed(() => props.scrollTop);

// 容器高度
const containerHeight = computed(() => props.height);

// 安全的 itemHeight，防止除零
const safeItemHeight = computed(() => Math.max(1, props.itemHeight));

// 总高度
const totalHeight = computed(() => props.items.length * safeItemHeight.value);

// 可视区域起始索引
const startIndex = computed(() => {
  const start = Math.floor(currentScrollTop.value / safeItemHeight.value);
  return Math.max(0, start - props.buffer);
});

// 可视区域结束索引
const endIndex = computed(() => {
  const visibleCount = Math.ceil(props.height / safeItemHeight.value);
  const end = startIndex.value + visibleCount + props.buffer * 2;
  return Math.min(props.items.length, end);
});

// Y 轴偏移
const offsetY = computed(() => startIndex.value * props.itemHeight);

// 可见项列表
const visibleItems = computed<VirtualListItem<unknown>[]>(() => {
  const result: VirtualListItem<unknown>[] = [];
  for (let i = startIndex.value; i < endIndex.value; i++) {
    const raw = props.items[i];
    const key = props.keyField
      ? ((raw as Record<string, unknown>)?.[props.keyField] as
          string | number | undefined)
      : i;
    result.push({ index: i, raw, key });
  }
  return result;
});

// 监听滚动
function onScroll(event: { detail: { scrollTop: number } }) {
  const scrollTop = event.detail.scrollTop;
  currentScrollTop.value = scrollTop;
  emit("scroll", scrollTop);

  // 触底检测
  const remainingHeight = totalHeight.value - scrollTop - containerHeight.value;
  if (remainingHeight < props.itemHeight * 3) {
    emit("reachBottom");
  }
}

// 外部受控滚动
watch(
  () => props.scrollTop,
  (val) => {
    if (Math.abs(val - currentScrollTop.value) > 1) {
      currentScrollTop.value = val;
    }
  },
);
</script>

<style lang="scss" scoped>
.virtual-list {
  position: relative;
  overflow: hidden;
  -webkit-overflow-scrolling: touch;
}

.virtual-list-phantom {
  position: relative;
  width: 100%;
}

.virtual-list-content {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  will-change: transform;
}

.virtual-list-item {
  width: 100%;
  box-sizing: border-box;
}
</style>
