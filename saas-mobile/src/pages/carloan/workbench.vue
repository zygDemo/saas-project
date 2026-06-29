<template>
  <view class="workbench-redirect-page"></view>
</template>

<script setup>
import { onLoad } from "@dcloudio/uni-app";
import { APP_ROUTES } from "@/common/navigation";

onLoad(() => {
  uni.redirectTo({ url: APP_ROUTES.carloan.portal.workbench });
});
</script>
