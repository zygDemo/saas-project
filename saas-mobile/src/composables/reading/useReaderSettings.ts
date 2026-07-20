import { computed, ref, watch } from "vue";
import {
  bgColors,
  loadSettings,
  STORAGE_KEY,
} from "@/pages/reading/reader/reader-helpers";

/**
 * 阅读器设置相关逻辑
 * 管理字体、背景、夜间模式、亮度等
 */
export function useReaderSettings() {
  const saved = loadSettings();
  const isNightMode = ref(saved?.isNightMode ?? false);
  const fontSize = ref(saved?.fontSize ?? 18);
  const lineHeight = ref(saved?.lineHeight ?? 1.8);
  const bgColor = ref(saved?.bgColor ?? "default");
  const pageMode = ref(saved?.pageMode ?? "slide");
  const brightness = ref(saved?.brightness ?? 80);
  const isListenMode = ref(false);
  const isLandscape = ref(false);

  const bgColorStyle = computed(() => {
    const color = bgColors.find((c) => c.value === bgColor.value);
    return color?.color || "#f5f0e6";
  });

  const textStyle = computed(() => ({
    fontSize: `${fontSize.value}px`,
    lineHeight: lineHeight.value,
  }));

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

  watch(
    [fontSize, lineHeight, bgColor, pageMode, brightness, isNightMode],
    () => saveSettings(),
  );

  const setPageMode = (mode: string) => {
    pageMode.value = mode;
  };

  const setLineHeight = (val: number) => {
    lineHeight.value = val;
  };

  const toggleNightMode = () => {
    isNightMode.value = !isNightMode.value;
    bgColor.value = isNightMode.value ? "dark" : "default";
  };

  const decreaseFontSize = () => {
    if (fontSize.value > 14) fontSize.value -= 2;
  };

  const increaseFontSize = () => {
    if (fontSize.value < 28) fontSize.value += 2;
  };

  const onBgColorChange = (color: string) => {
    bgColor.value = color;
    isNightMode.value = color === "dark";
  };

  const onBrightnessChange = (val: number) => {
    brightness.value = val;
  };

  const toggleListenMode = () => {
    isListenMode.value = !isListenMode.value;
    uni.showToast({
      title: isListenMode.value ? "听书模式已开启" : "听书模式已关闭",
      icon: "none",
    });
  };

  function detectOrientation() {
    try {
      const winInfo = (uni.getWindowInfo?.() || uni.getSystemInfoSync()) as {
        windowWidth: number;
        windowHeight: number;
      };
      isLandscape.value = (winInfo.windowWidth || 0) > (winInfo.windowHeight || 0);
    } catch {
      // ignore
    }
  }

  return {
    isNightMode,
    fontSize,
    lineHeight,
    bgColor,
    pageMode,
    brightness,
    isListenMode,
    isLandscape,
    bgColorStyle,
    textStyle,
    saveSettings,
    setPageMode,
    setLineHeight,
    toggleNightMode,
    decreaseFontSize,
    increaseFontSize,
    onBgColorChange,
    onBrightnessChange,
    toggleListenMode,
    detectOrientation,
  };
}
