<template>
  <app-page nav-title="用户协议">
    <view class="agreement-page">
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
<h2>嗨车无忧用户协议</h2>
<p><strong>更新日期：2026年4月9日</strong></p>
<p><strong>生效日期：2026年4月9日</strong></p>

<h3>特别提示</h3>
<p>欢迎您使用嗨车无忧服务！本协议是您与嗨车无忧平台之间关于使用本服务所订立的协议。请您仔细阅读本协议的全部条款，特别是免除或者限制责任的条款、法律适用和争议解决条款。</p>

<h3>1. 服务说明</h3>
<p>嗨车无忧是一款面向车贷业务人员的移动办公管理平台，提供以下服务：</p>
<ul>
  <li>客户线索管理与跟踪</li>
  <li>贷款申请资料录入与提交</li>
  <li>贷款审批进度查询</li>
  <li>客户信息管理</li>
  <li>业务数据统计与分析</li>
</ul>

<h3>2. 账户注册与使用</h3>
<p>2.1 您需要提供真实、准确的手机号码进行注册。</p>
<p>2.2 您应妥善保管账户密码，不得将账户转让给他人使用。</p>
<p>2.3 您应对通过您的账户进行的所有活动承担责任。</p>
<p>2.4 如发现账户被他人非法使用，应立即通知我们。</p>

<h3>3. 用户行为规范</h3>
<p>您在使用本服务时，应遵守法律法规，不得利用本服务从事以下行为：</p>
<ul>
  <li>上传虚假信息或伪造资料</li>
  <li>侵犯他人知识产权或合法权益</li>
  <li>干扰或破坏本服务的正常运行</li>
  <li>利用本服务从事任何违法犯罪活动</li>
  <li>其他违反法律法规的行为</li>
</ul>

<h3>4. 知识产权</h3>
<p>本服务的所有内容，包括但不限于文字、图片、音频、视频、图表、标识、版面设计、电子文档、软件程序等，其著作权和知识产权归嗨车无忧所有。</p>

<h3>5. 隐私保护</h3>
<p>我们重视用户隐私保护。有关个人信息保护的规定，请参见我们的《隐私政策》。</p>

<h3>6. 免责声明</h3>
<p>6.1 因不可抗力、系统故障、网络中断等原因导致的服务中断或数据丢失，我们不承担责任。</p>
<p>6.2 用户因操作不当或违反本协议规定导致的损失，我们不承担责任。</p>

<h3>7. 协议修改</h3>
<p>我们有权根据需要不时地修订本协议，修订后的协议会在平台内公布。若您继续使用本服务，即表示您同意接受修订后的协议内容。</p>

<h3>8. 法律适用与争议解决</h3>
<p>本协议的成立、执行和解释及争议的解决均应适用中华人民共和国法律。如双方就本协议内容或其执行发生任何争议，应尽量友好协商解决。</p>

<h3>9. 联系我们</h3>
<p>如果您对本协议有任何疑问，请通过以下方式联系我们：</p>
<p>邮箱：support@haicheuyou.com</p>
<p>电话：400-XXX-XXXX</p>
`);
</script>

<style lang="scss" scoped>
.agreement-page {
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
