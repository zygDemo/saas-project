<template>
  <u-modal
    v-model="show"
    title="提示"
    :content="content"
    show-cancel-button
    confirm-text="确认"
    cancel-text="取消"
    z-index="10090"
    @confirm="onConfirm"
    @cancel="onCancel"
  />
</template>

<script setup>
import { ref } from "vue";

const show = ref(false);
const content = ref("");
let callback = null;

/** 打开确认弹窗 */
function open(message, onConfirmCb) {
  callback = onConfirmCb;
  content.value = message;
  show.value = true;
}

function onConfirm() {
  show.value = false;
  if (callback) {
    const fn = callback;
    callback = null;
    fn();
  }
}

function onCancel() {
  show.value = false;
  callback = null;
}

defineExpose({ open });
</script>
