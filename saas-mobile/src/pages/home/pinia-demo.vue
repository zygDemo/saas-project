<script setup lang="ts">
import { storeToRefs } from "pinia";
import { $u } from "uview-pro";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useCounterStore, useLocalStore } from "@/stores";

const { t } = useI18n();

// 使用现有的counter store
const counterStore = useCounterStore();
const { count } = storeToRefs(counterStore);

// 使用 local store
const localStore = useLocalStore();
const { token, isAuthenticated } = storeToRefs(localStore);

// 功能示例
const examples = [
  {
    title: "基础计数器",
    desc: "演示状态管理和操作",
    icon: "plus-circle",
  },
  {
    title: "用户状态",
    desc: "用户登录状态管理",
    icon: "account",
  },
  {
    title: "数据持久化",
    desc: "Token持久化存储",
    icon: "download",
  },
  {
    title: "模块化设计",
    desc: "session/local分离存储",
    icon: "grid",
  },
];

// Pinia特性
const piniaFeatures = [
  "Vue3 Composition API支持",
  "TypeScript类型安全",
  "插件系统扩展",
  "开发工具集成",
  "状态持久化",
  "模块化store组织",
];

// 计数器操作
function increment() {
  counterStore.increment();
  $u.toast(`${t("demo.pinia.currentCount")}${counterStore.count}`);
}

function decrement() {
  counterStore.decrement();
  $u.toast(`${t("demo.pinia.currentCount")}${counterStore.count}`);
}

function reset() {
  counterStore.reset();
  $u.toast(t("demo.pinia.reset"));
}

// 登录状态操作
function logout() {
  localStore.logout();
  $u.toast(t("demo.pinia.loggedOut"));
}
</script>

<template>
  <app-page :nav-title="$t('demo.pinia.title')" show-nav-back>
    <view class="app-container">
      <!-- 标题介绍 -->
      <view class="u-m-b-20">
        <u-text :text="$t('demo.pinia.intro')" size="32rpx" bold />
        <u-gap />
        <u-text :text="$t('demo.pinia.introDesc')" size="26rpx" />
      </view>

      <!-- 功能概览 -->
      <view class="section">
        <u-text :text="$t('demo.pinia.featureDemo')" size="28rpx" bold />
        <u-gap />
        <view class="examples-grid">
          <view
            v-for="(example, index) in examples"
            :key="index"
            class="example-card"
          >
            <u-icon :name="example.icon" size="48rpx" color="primary" />
            <u-text :text="example.title" size="28rpx" bold />
            <u-text :text="example.desc" size="24rpx" />
          </view>
        </view>
      </view>

      <!-- 计数器演示 -->
      <view class="section">
        <u-card
          :title="$t('demo.pinia.basicCounter')"
          margin="0"
          border-radius="0"
          custom-class="counter-card"
        >
          <view class="counter-display">
            <u-text
              :text="$t('demo.pinia.currentCount')"
              size="28rpx"
              bold
              block
              align="center"
            />
            <u-text
              :text="count.toString()"
              size="48rpx"
              bold
              color="primary"
            />
          </view>

          <view class="counter-buttons">
            <u-button
              type="warning"
              size="mini"
              :disabled="count <= 0"
              @click="decrement"
            >
              {{ $t("demo.pinia.decrease") }}
            </u-button>
            <u-button type="primary" size="mini" @click="increment">
              {{ $t("demo.pinia.increase") }}
            </u-button>
            <u-button type="info" size="mini" @click="reset">
              {{ $t("demo.pinia.reset") }}
            </u-button>
          </view>
        </u-card>
      </view>

      <!-- 用户状态演示 -->
      <view class="section">
        <u-card
          :title="$t('demo.pinia.userStatus')"
          margin="0"
          border-radius="0"
        >
          <view class="user-status">
            <u-text text="Token状态" size="26rpx" />
            <u-text
              :text="token ? '已存在' : '空'"
              :type="token ? 'success' : 'warning'"
              size="26rpx"
              bold
            />
          </view>
          <view class="user-status">
            <u-text text="登录状态" size="26rpx" />
            <u-text
              :text="isAuthenticated ? '已认证' : '未认证'"
              :type="isAuthenticated ? 'success' : 'warning'"
              size="26rpx"
              bold
            />
          </view>

          <view class="user-buttons">
            <u-button
              type="warning"
              size="mini"
              :disabled="!token"
              @click="logout"
            >
              {{ $t("demo.pinia.logout") }}
            </u-button>
          </view>
        </u-card>
      </view>

      <!-- Pinia特性 -->
      <view class="section">
        <u-text :text="$t('demo.pinia.piniaFeatures')" size="28rpx" bold />
        <u-gap />
        <u-card
          margin="0"
          border-radius="0"
          :show-head="false"
          custom-class="features-card"
        >
          <view class="features-list">
            <view
              v-for="(feature, index) in piniaFeatures"
              :key="index"
              class="feature-item"
            >
              <u-icon name="checkmark-circle" color="success" size="28rpx" />
              <u-text :text="feature" size="26rpx" />
            </view>
          </view>
        </u-card>
      </view>
    </view>
  </app-page>
</template>

<style lang="scss" scoped>
.app-container {
  padding: 32rpx;

}

.section {
  margin-bottom: 48rpx;

  .section-title {
    margin-bottom: 24rpx;
    display: block;
  }
}

.examples-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
}

.example-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: $u-bg-white;
  padding: 24rpx;
  border-radius: 12rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
  text-align: center;
}

.counter-card {
  .counter-display {
    text-align: center;
    margin-bottom: 24rpx;
  }

  .counter-buttons {
    display: flex;
    justify-content: center;
    gap: 16rpx;
  }
}

.user-input {
  margin-bottom: 24rpx;
}

.user-status {
  margin-bottom: 24rpx;
}

.user-buttons {
  display: flex;
  gap: 16rpx;
}

.preferences-card {
  .preference-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24rpx;

    &:last-child {
      margin-bottom: 0;
    }

    .theme-buttons {
      display: flex;
      gap: 12rpx;
    }
  }
}

.persistence-card {
  .persistence-buttons {
    display: flex;
    gap: 16rpx;
  }
}

.features-card {
  .features-list {
    display: flex;
    flex-direction: column;
    gap: 16rpx;
  }

  .feature-item {
    display: flex;
    align-items: center;
    gap: 12rpx;
  }
}
</style>
