<template>
  <view class="progress-ring" :style="{ width: size + 'rpx', height: size + 'rpx' }">
    <canvas
      :style="{ width: size + 'rpx', height: size + 'rpx' }"
      :canvas-id="canvasId"
      id="progressRing"
      @ready="draw"
    />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";

const props = withDefaults(
  defineProps<{
    progress: number;
    size?: number;
    strokeWidth?: number;
    color?: string;
    bgColor?: string;
  }>(),
  {
    size: 48,
    strokeWidth: 4,
    color: "#667eea",
    bgColor: "#f0f0f0",
  }
);

const canvasId = ref("progressRing_" + Math.random().toString(36).slice(2, 8));

function draw() {
  const ctx = uni.createCanvasContext(canvasId.value);
  const dpr = uni.getSystemInfoSync().pixelRatio;
  const size = props.size * dpr;
  const stroke = props.strokeWidth * dpr;
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - stroke) / 2;

  ctx.scale(1, 1);
  ctx.setLineWidth(stroke);
  ctx.setLineCap("round");

  // 背景圆环
  ctx.setStrokeStyle(props.bgColor);
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  // 进度圆环
  const angle = (props.progress / 100) * Math.PI * 2 - Math.PI / 2;
  ctx.setStrokeStyle(props.color);
  ctx.beginPath();
  ctx.arc(cx, cy, r, -Math.PI / 2, angle);
  ctx.stroke();

  ctx.draw();
}

onMounted(() => {
  setTimeout(draw, 100);
});
</script>
