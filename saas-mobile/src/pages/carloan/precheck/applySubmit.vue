<template>
  <app-page nav-title="进件申请">
    <view class="apply-page">
      <!-- 产品选择 -->
      <view class="section-title">
        <view class="title-dot" />
        <u-text text="选择产品" size="32rpx" bold />
      </view>

      <view class="product-list">
        <view
          v-for="(product, index) in products"
          :key="index"
          class="product-card"
          :class="{ selected: selectedProduct === index }"
          @click="selectProduct(index)"
        >
          <view class="product-header">
            <text class="product-name">{{ product.name }}</text>
            <u-icon
              v-if="selectedProduct === index"
              name="checkmark-circle-fill"
              size="40rpx"
              color="var(--u-type-primary)"
            />
          </view>
          <view class="product-info">
            <text class="product-desc">{{ product.desc }}</text>
            <text class="product-rate">利率：{{ product.rate }}</text>
          </view>
        </view>
      </view>

      <!-- 进件资料 -->
      <view class="section-title">
        <view class="title-dot" />
        <u-text text="进件资料" size="32rpx" bold />
      </view>

      <view class="upload-section">
        <view class="upload-group">
          <text class="group-title">身份证照片</text>
          <view class="upload-grid">
            <view class="upload-item" @click="uploadImage('idFront')">
              <view class="upload-box">
                <u-image
                  v-if="images.idFront"
                  :src="images.idFront"
                  width="100%"
                  height="200rpx"
                  mode="aspectFill"
                />
                <view v-else class="upload-placeholder">
                  <u-icon name="plus" size="42" color="var(--u-type-primary)" />
                </view>
              </view>
              <text class="upload-text">人像面</text>
            </view>
            <view class="upload-item" @click="uploadImage('idBack')">
              <view class="upload-box">
                <u-image
                  v-if="images.idBack"
                  :src="images.idBack"
                  width="100%"
                  height="200rpx"
                  mode="aspectFill"
                />
                <view v-else class="upload-placeholder">
                  <u-icon name="plus" size="42" color="var(--u-type-primary)" />
                </view>
              </view>
              <text class="upload-text">国徽面</text>
            </view>
          </view>
        </view>

        <view class="upload-group">
          <text class="group-title">行驶证照片</text>
          <view class="upload-grid">
            <view class="upload-item" @click="uploadImage('carLicense')">
              <view class="upload-box">
                <u-image
                  v-if="images.carLicense"
                  :src="images.carLicense"
                  width="100%"
                  height="200rpx"
                  mode="aspectFill"
                />
                <view v-else class="upload-placeholder">
                  <u-icon name="plus" size="42" color="var(--u-type-primary)" />
                </view>
              </view>
              <text class="upload-text">行驶证主页</text>
            </view>
            <view class="upload-item" @click="uploadImage('carRegister')">
              <view class="upload-box">
                <u-image
                  v-if="images.carRegister"
                  :src="images.carRegister"
                  width="100%"
                  height="200rpx"
                  mode="aspectFill"
                />
                <view v-else class="upload-placeholder">
                  <u-icon name="plus" size="42" color="var(--u-type-primary)" />
                </view>
              </view>
              <text class="upload-text">行驶证副页</text>
            </view>
          </view>
        </view>

        <view class="upload-group">
          <text class="group-title">其他资料</text>
          <view class="upload-grid">
            <view class="upload-item" @click="uploadImage('bankStatement')">
              <view class="upload-box">
                <u-image
                  v-if="images.bankStatement"
                  :src="images.bankStatement"
                  width="100%"
                  height="200rpx"
                  mode="aspectFill"
                />
                <view v-else class="upload-placeholder">
                  <u-icon name="plus" size="42" color="var(--u-type-primary)" />
                </view>
              </view>
              <text class="upload-text">银行流水</text>
            </view>
            <view class="upload-item" @click="uploadImage('incomeProof')">
              <view class="upload-box">
                <u-image
                  v-if="images.incomeProof"
                  :src="images.incomeProof"
                  width="100%"
                  height="200rpx"
                  mode="aspectFill"
                />
                <view v-else class="upload-placeholder">
                  <u-icon name="plus" size="42" color="var(--u-type-primary)" />
                </view>
              </view>
              <text class="upload-text">收入证明</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 底部按钮 -->
      <view class="footer-btn">
        <u-button
          type="primary"
          shape="circle"
          :loading="submitLoading"
          @click="handleSubmit"
        >
          提交进件
        </u-button>
      </view>
    </view>
  </app-page>
</template>

<script setup>
import { $u } from "uview-pro";
import { reactive, ref } from "vue";

const selectedProduct = ref(-1);
const submitLoading = ref(false);

const products = [
  {
    name: "车贷 A 产品",
    desc: "最高可贷 50 万，期限 12-60 期",
    rate: "年化 8.5% 起",
  },
  {
    name: "车贷 B 产品",
    desc: "最高可贷 30 万，期限 12-48 期",
    rate: "年化 9.5% 起",
  },
  {
    name: "车贷 C 产品",
    desc: "最高可贷 20 万，期限 12-36 期",
    rate: "年化 10.5% 起",
  },
];

const images = reactive({
  idFront: "",
  idBack: "",
  carLicense: "",
  carRegister: "",
  bankStatement: "",
  incomeProof: "",
});

function selectProduct(index) {
  selectedProduct.value = index;
}

function uploadImage(type) {
  uni.chooseImage({
    count: 1,
    sizeType: ["compressed"],
    sourceType: ["camera", "album"],
    success: (res) => {
      const path = res.tempFilePaths?.[0];
      if (path) {
        images[type] = path;
        $u.toast("上传成功", "success");
      }
    },
  });
}

async function handleSubmit() {
  if (selectedProduct.value === -1) {
    $u.toast("请选择产品", "error");
    return;
  }

  if (!images.idFront || !images.idBack) {
    $u.toast("请上传身份证照片", "error");
    return;
  }

  submitLoading.value = true;
  try {
    // 模拟提交
    await new Promise((resolve) => setTimeout(resolve, 1000));
    $u.toast("进件提交成功", "success");
    setTimeout(() => {
      uni.navigateBack();
    }, 1500);
  } finally {
    submitLoading.value = false;
  }
}
</script>

<style lang="scss" scoped>
.apply-page {
  padding: 28rpx 24rpx 140rpx;
  background: linear-gradient(180deg, #f7f8f9 0%, #ffffff 100%);

}

.product-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-bottom: 32rpx;
}

.product-card {
  background: $u-bg-white;
  border-radius: 20rpx;
  padding: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(15, 23, 42, 0.05);
  border: 2rpx solid transparent;
  transition: all 0.3s;

  &.selected {
    border-color: var(--u-type-primary);
    background: linear-gradient(135deg, #f0f7ff, #e8f4ff);
  }
}

.product-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.product-name {
  font-size: 32rpx;
  font-weight: 700;
  color: $u-main-color;
}

.product-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.product-desc {
  font-size: 26rpx;
  color: $u-content-color;
}

.product-rate {
  font-size: 26rpx;
  color: #ff6b6b;
  font-weight: 700;
}

.upload-section {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  margin-bottom: 32rpx;
}

.upload-group {
  background: $u-bg-white;
  border-radius: 16rpx;
  padding: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(15, 23, 42, 0.05);
}

.group-title {
  font-size: 28rpx;
  font-weight: 700;
  color: $u-main-color;
  margin-bottom: 16rpx;
  display: block;
}

.upload-grid {
  display: flex;
  gap: 20rpx;
}

.upload-item {
  flex: 1;
}

.upload-box {
  height: 200rpx;
  border: 2rpx dashed rgba(var(--u-type-primary-rgb, 82, 64, 254), 0.35);
  border-radius: 18rpx;
  overflow: hidden;
  background: #f8f9fa;
}

.upload-placeholder {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-text {
  display: block;
  text-align: center;
  font-size: 26rpx;
  color: $u-tips-color;
  margin-top: 8rpx;
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .page-container { background-color: #121212; }
  .card { background-color: #1e1e1e; }
  .card-item { background-color: #1e1e1e; }
  .list-item { background-color: #1e1e1e; }
  .section { background-color: #1e1e1e; }
  .form-item { background-color: #1e1e1e; border-color: #2a2a2a; }
  .title { color: #e5e6eb; }
  .subtitle { color: #8b8c91; }
  .desc { color: #8b8c91; }
  .label { color: #b0b3b8; }
  .value { color: #e5e6eb; }
  .name { color: #e5e6eb; }
  .info { color: #b0b3b8; }
  .text { color: #e5e6eb; }
  .tip { color: #8b8c91; }
  .divider { background-color: #2a2a2a; }
  .border { border-color: #2a2a2a; }
  .input { background-color: #2a2a2a; color: #e5e6eb; }
  .textarea { background-color: #2a2a2a; color: #e5e6eb; }
  .picker { background-color: #2a2a2a; color: #e5e6eb; }
  .footer { background-color: #1e1e1e; }
}
</style>