import { ref } from "vue";

interface ConfirmExpose {
  open: (message: string, onConfirm: () => void) => void;
}

/** 配合 <app-confirm ref="confirmRef" /> 使用 */
export function useConfirm() {
  const confirmRef = ref<ConfirmExpose | null>(null);

  /** 打开确认弹窗 */
  function confirm(message: string, onConfirm: () => void) {
    confirmRef.value?.open(message, onConfirm);
  }

  return { confirmRef, confirm };
}
