<template>
  <section class="reading-page-shell">
    <div class="reading-page-shell__header">
      <div class="reading-page-shell__title-wrap">
        <div class="reading-page-shell__icon" v-if="icon">
          <ArtSvgIcon :icon="icon" />
        </div>
        <div>
          <div class="reading-page-shell__eyebrow">{{ eyebrow }}</div>
          <h1 class="reading-page-shell__title">{{ title }}</h1>
          <p v-if="description" class="reading-page-shell__desc">{{ description }}</p>
        </div>
      </div>
      <div v-if="$slots.actions" class="reading-page-shell__actions">
        <slot name="actions" />
      </div>
    </div>

    <slot />
  </section>
</template>

<script setup lang="ts">
  defineOptions({ name: 'ReadingPageShell' })

  withDefaults(
    defineProps<{
      title: string
      description?: string
      icon?: string
      eyebrow?: string
    }>(),
    {
      eyebrow: 'READING CENTER'
    }
  )
</script>

<style scoped>
  .reading-page-shell {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding-bottom: 20px;
  }

  .reading-page-shell__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 16px 18px;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 10px;
    box-shadow: var(--el-box-shadow-light);
  }

  .reading-page-shell__title-wrap {
    display: flex;
    align-items: center;
    min-width: 0;
    gap: 12px;
  }

  .reading-page-shell__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    flex: 0 0 42px;
    font-size: 22px;
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    border: 1px solid var(--el-color-primary-light-7);
    border-radius: 10px;
  }

  .reading-page-shell__eyebrow {
    margin-bottom: 3px;
    font-size: 11px;
    font-weight: 600;
    line-height: 1;
    color: var(--el-text-color-secondary);
    letter-spacing: 0.08em;
  }

  .reading-page-shell__title {
    margin: 0;
    font-size: 20px;
    font-weight: 650;
    line-height: 1.25;
    color: var(--el-text-color-primary);
  }

  .reading-page-shell__desc {
    max-width: 680px;
    margin: 5px 0 0;
    font-size: 13px;
    line-height: 1.5;
    color: var(--el-text-color-secondary);
  }

  .reading-page-shell__actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;
  }

  :deep(.art-search-bar) {
    margin-bottom: 0;
  }

  :deep(.art-table-card) {
    margin-top: 0;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 10px;
    box-shadow: var(--el-box-shadow-light);
  }

  :deep(.art-table-card > .el-card__body) {
    display: flex;
    min-height: 0;
    flex-direction: column;
    gap: 14px;
  }

  @media (max-width: 768px) {
    .reading-page-shell__header {
      align-items: stretch;
      flex-direction: column;
      padding: 14px;
    }

    .reading-page-shell__actions {
      justify-content: flex-start;
    }
  }
</style>
