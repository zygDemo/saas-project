<script setup lang="ts">
import { useLocale, useTheme } from 'uview-pro'
import { computed, onMounted, ref } from 'vue'
import AppUpdateNotice from '@/components/app-update-notice/app-update-notice.vue'
import { startUpdateNotice } from '@/common/update-notice'
import type { VersionInfo } from '@/common/update-notice';

const { darkMode, themes, currentTheme } = useTheme()
const { currentLocale } = useLocale()

const currentThemeName = computed(() => currentTheme.value?.name)
const currentLocaleName = computed(() => currentLocale.value?.name)

const updateNoticeRef = ref<InstanceType<typeof AppUpdateNotice>>()

function handleUpdate(versionInfo: VersionInfo) {
  updateNoticeRef.value?.show(versionInfo)
}

onMounted(() => {
  startUpdateNotice({ onUpdate: handleUpdate })
})
</script>

<template>
  <u-config-provider
    :dark-mode="darkMode" :themes="themes" :current-theme="currentThemeName"
    :current-locale="currentLocaleName"
  >
    <KuRootView />
    <u-toast global />
    <AppUpdateNotice ref="updateNoticeRef" />
  </u-config-provider>
</template>

<style lang="scss"></style>
