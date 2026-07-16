import { computed, ref } from 'vue'

export type MingliThemeMode = 'calm' | 'ritual' | 'glow'

const STORAGE_KEY = 'mingli_theme_mode'
const DEFAULT_THEME: MingliThemeMode = 'glow'

const THEME_LABELS: Record<MingliThemeMode, string> = {
  calm: '克制高级感',
  ritual: '国风仪式感',
  glow: '紫光感',
}

const THEME_CLASSES: Record<MingliThemeMode, string> = {
  calm: '',
  ritual: 'mingli-theme-ritual',
  glow: 'mingli-theme-glow',
}

function normalizeTheme(value: unknown): MingliThemeMode {
  if (value === 'calm' || value === 'ritual' || value === 'glow') return value
  return DEFAULT_THEME
}

export function getMingliThemeMode(): MingliThemeMode {
  try {
    return normalizeTheme(uni.getStorageSync(STORAGE_KEY))
  } catch {
    return DEFAULT_THEME
  }
}

export function setMingliThemeMode(mode: MingliThemeMode) {
  const next = normalizeTheme(mode)
  try {
    uni.setStorageSync(STORAGE_KEY, next)
  } catch {}
}

export function cycleMingliThemeMode(mode: MingliThemeMode): MingliThemeMode {
  return mode === 'calm' ? 'ritual' : mode === 'ritual' ? 'glow' : 'calm'
}

export function useMingliTheme() {
  const themeMode = ref<MingliThemeMode>(getMingliThemeMode())
  const themeClass = computed(() => THEME_CLASSES[themeMode.value])
  const themeLabel = computed(() => THEME_LABELS[themeMode.value])
  const setTheme = (mode: MingliThemeMode) => {
    themeMode.value = mode
    setMingliThemeMode(mode)
  }
  const toggleTheme = () => setTheme(cycleMingliThemeMode(themeMode.value))
  const options = [
    { label: '克制', value: 'calm' as const },
    { label: '国风', value: 'ritual' as const },
    { label: '紫光', value: 'glow' as const },
  ]
  return { themeMode, themeClass, themeLabel, themeOptions: options, setTheme, toggleTheme }
}
