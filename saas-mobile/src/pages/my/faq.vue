<template>
  <app-page nav-title="帮助中心">
    <view class="faq-page">
      <!-- 常见问题分类 -->
      <view class="category-section">
        <view
          v-for="(category, index) in categories"
          :key="index"
          class="category-card"
        >
          <view class="category-header" @click="toggleCategory(index)">
            <view class="category-icon">
              <u-icon :name="category.icon" size="40" color="#fff" />
            </view>
            <text class="category-title">{{ category.title }}</text>
            <u-icon
              :name="category.expanded ? 'arrow-up' : 'arrow-down'"
              size="32"
              color="#999"
            />
          </view>
          <view v-if="category.expanded" class="category-body">
            <view
              v-for="(item, i) in category.items"
              :key="i"
              class="faq-item"
              @click="showDetail(item)"
            >
              <text class="faq-question">{{ item.question }}</text>
              <u-icon name="arrow-right" size="28" color="#999" />
            </view>
          </view>
        </view>
      </view>

      <!-- 联系客服 -->
      <view class="contact-section">
        <view class="contact-card">
          <u-icon name="service" size="48" color="var(--u-type-primary)" />
          <text class="contact-title">需要更多帮助？</text>
          <text class="contact-desc">联系我们的客服团队</text>
          <u-button type="primary" shape="circle" @click="contactService">
            联系客服
          </u-button>
        </view>
      </view>
    </view>

    <!-- 问题详情弹窗 -->
    <u-popup v-model="showDetailPopup" mode="center" border-radius="20" width="600rpx">
      <view class="detail-popup">
        <view class="detail-header">
          <text class="detail-title">{{ currentItem?.question }}</text>
          <u-icon name="close" size="40" @click="showDetailPopup = false" />
        </view>
        <scroll-view scroll-y class="detail-body">
          <rich-text :nodes="currentItem?.answer || ''" />
        </scroll-view>
      </view>
    </u-popup>
  </app-page>
</template>

<script setup lang="ts">
import { ref } from "vue";

const showDetailPopup = ref(false);
const currentItem = ref<any>(null);

// 常见问题分类
const categories = ref([
  {
    title: "账户相关",
    icon: "account",
    expanded: true,
    items: [
      {
        question: "如何修改登录密码？",
        answer: "<p>进入\"我的\"页面，点击\"设置\"，可以修改个人信息和密码。</p>",
      },
      {
        question: "忘记密码怎么办？",
        answer: "<p>在登录页面点击\"忘记密码\"，输入注册时的手机号，通过短信验证码重置密码。</p>",
      },
      {
        question: "如何修改个人信息？",
        answer: "<p>进入\"我的\"页面，点击\"设置\"，可以修改姓名、联系方式等基本信息。</p>",
      },
    ],
  },
  {
    title: "业务操作",
    icon: "file-text",
    expanded: false,
    items: [
      {
        question: "如何提交贷款申请？",
        answer: "<p>进入\"工作台\"，点击\"进件\"模块，按照提示依次填写客户信息、车辆信息、申请信息，上传相关资料后提交即可。</p>",
      },
      {
        question: "如何查看审批进度？",
        answer: "<p>进入\"工作台\"，点击\"审批\"模块，选择对应的订单即可查看审批进度。</p>",
      },
      {
        question: "如何补充客户资料？",
        answer: "<p>进入\"工作台\"，点击\"资料补充\"模块，选择客户资料或车辆资料，按照提示上传缺失的材料即可。</p>",
      },
    ],
  },
  {
    title: "订单管理",
    icon: "list",
    expanded: false,
    items: [
      {
        question: "如何查看订单列表？",
        answer: "<p>点击底部导航栏的\"订单\"tab，即可查看所有订单列表。支持按状态筛选和关键词搜索。</p>",
      },
      {
        question: "订单状态有哪些？",
        answer: "<p>订单状态包括：待处理、审核中、已通过、已拒绝、已放款。</p>",
      },
    ],
  },
  {
    title: "系统设置",
    icon: "setting",
    expanded: false,
    items: [
      {
        question: "如何切换主题？",
        answer: "<p>进入\"我的\"页面，点击\"设置\"，在主题设置中选择喜欢的主题。</p>",
      },
      {
        question: "如何开启消息通知？",
        answer: "<p>进入\"我的\"页面，点击\"设置\"，在通知设置中开启消息通知权限。</p>",
      },
    ],
  },
]);

function toggleCategory(index: number) {
  categories.value[index].expanded = !categories.value[index].expanded;
}

function showDetail(item: any) {
  currentItem.value = item;
  showDetailPopup.value = true;
}

function contactService() {
  uni.showToast({
    title: "客服电话：400-XXX-XXXX",
    icon: "none",
    duration: 3000,
  });
}
</script>

<style lang="scss" scoped>
.faq-page {

  background: #f5f6f7;
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.category-section {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.category-card {
  background: #fff;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
}

.category-header {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 28rpx 24rpx;
  background: linear-gradient(
    135deg,
    rgba(var(--u-type-primary-rgb), 0.05),
    transparent
  );
  border-bottom: 1rpx solid #f0f0f0;

  &:active {
    opacity: 0.8;
  }
}

.category-icon {
  width: 64rpx;
  height: 64rpx;
  border-radius: 12rpx;
  background: linear-gradient(135deg, var(--u-type-primary), #6bd3ff);
  display: flex;
  align-items: center;
  justify-content: center;
}

.category-title {
  flex: 1;
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.category-body {
  padding: 16rpx 24rpx;
}

.faq-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }

  &:active {
    opacity: 0.7;
  }
}

.faq-question {
  flex: 1;
  font-size: 28rpx;
  color: #666;
  line-height: 1.6;
}

.contact-section {
  margin-top: 20rpx;
}

.contact-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 40rpx 32rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
}

.contact-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #333;
}

.contact-desc {
  font-size: 26rpx;
  color: #999;
  margin-bottom: 20rpx;
}

.detail-popup {
  padding: 32rpx;
  max-height: 600rpx;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24rpx;
  padding-bottom: 20rpx;
  border-bottom: 2rpx solid #eee;
}

.detail-title {
  flex: 1;
  font-size: 30rpx;
  font-weight: 700;
  color: #333;
  line-height: 1.6;
  margin-right: 16rpx;
}

.detail-body {
  max-height: 400rpx;
  
  :deep(p) {
    font-size: 28rpx;
    color: #666;
    line-height: 1.8;
    margin-bottom: 12rpx;
  }
}
</style>
