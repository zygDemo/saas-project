<template>
  <app-page nav-title="隐私政策">
    <view class="privacy-page">
      <view class="content-card">
        <scroll-view scroll-y class="content-scroll">
          <rich-text :nodes="content" />
        </scroll-view>
      </view>
    </view>
  </app-page>
</template>

<script setup lang="ts">
import { ref } from "vue";

const content = ref(`
<h2>嗨车无忧隐私政策</h2>
<p><strong>更新日期：2026年4月9日</strong></p>
<p><strong>生效日期：2026年4月9日</strong></p>

<h3>引言</h3>
<p>嗨车无忧（以下简称"我们"）深知个人信息对您的重要性，我们会按照法律法规要求，采取相应的安全保护措施，尽力保护您的个人信息安全可控。</p>

<h3>1. 我们如何收集和使用您的个人信息</h3>
<p>为了向您提供服务，我们会收集以下信息：</p>
<ul>
  <li><strong>账户信息</strong>：手机号码、姓名、角色信息</li>
  <li><strong>业务信息</strong>：客户线索、贷款申请、车辆信息、身份证信息</li>
  <li><strong>设备信息</strong>：设备型号、操作系统版本、唯一设备标识符</li>
  <li><strong>日志信息</strong>：使用服务的时间、频率、操作记录</li>
</ul>

<h3>2. 我们如何使用您的个人信息</h3>
<p>我们会将收集的信息用于以下用途：</p>
<ul>
  <li>提供车贷业务管理相关服务</li>
  <li>处理贷款申请、审批流程</li>
  <li>客户线索跟踪与管理</li>
  <li>改进和优化服务体验</li>
  <li>保障账户安全和系统稳定</li>
</ul>

<h3>3. 我们如何共享、转让、公开披露您的个人信息</h3>
<p>我们不会主动将您的个人信息共享给任何第三方。如需共享，我们会事先征得您的同意。</p>

<h3>4. 我们如何保护您的个人信息</h3>
<p>我们已使用符合业界标准的安全防护措施保护您提供的个人信息，包括：</p>
<ul>
  <li>数据加密传输和存储</li>
  <li>严格的访问权限控制</li>
  <li>定期安全评估和审计</li>
</ul>

<h3>5. 您如何管理您的个人信息</h3>
<p>您可以通过以下方式管理您的信息：</p>
<ul>
  <li>在"我的-个人设置"中修改个人资料</li>
  <li>在"我的-清除缓存"中清除本地数据</li>
  <li>在"我的-退出登录"中结束会话</li>
</ul>

<h3>6. 未成年人保护</h3>
<p>我们的产品、网站和服务主要面向成人。如果没有父母或监护人的同意，未成年人不得创建自己的用户账户。</p>

<h3>7. 隐私政策的修订</h3>
<p>随着我们的业务发展，我们可能会适时对隐私政策进行修订。我们会通过适当方式通知您修订内容。</p>

<h3>8. 联系我们</h3>
<p>如果您对本隐私政策有任何疑问，请通过以下方式联系我们：</p>
<p>邮箱：privacy@haicheuyou.com</p>
<p>电话：400-XXX-XXXX</p>
`);
</script>

<style lang="scss" scoped>
.privacy-page {
  background: #f5f6f7;
  padding: 24rpx;
}

.content-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
}

.content-scroll {
  max-height: calc(100vh - 200rpx);

  :deep(h2) {
    font-size: 36rpx;
    font-weight: 700;
    color: #333;
    margin-bottom: 24rpx;
    padding-bottom: 16rpx;
    border-bottom: 2rpx solid #eee;
  }

  :deep(h3) {
    font-size: 32rpx;
    font-weight: 600;
    color: #333;
    margin-top: 32rpx;
    margin-bottom: 16rpx;
  }

  :deep(p) {
    font-size: 28rpx;
    color: #666;
    line-height: 1.8;
    margin-bottom: 16rpx;
  }

  :deep(ul) {
    padding-left: 32rpx;
    margin-bottom: 16rpx;

    li {
      font-size: 28rpx;
      color: #666;
      line-height: 2;
    }
  }

  :deep(strong) {
    color: #333;
    font-weight: 600;
  }
}
</style>
