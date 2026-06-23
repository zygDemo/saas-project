<template>
  <app-page nav-title="表单组件示例">
    <view class="demo-page">
      <!-- 示例 1：基础输入框 -->
      <view class="demo-section">
        <view class="section-title">示例 1：基础输入框</view>
        <app-form v-model="formData1" :items="inputItems" />
      </view>

      <!-- 示例 2：选择框 -->
      <view class="demo-section">
        <view class="section-title">示例 2：选择框</view>
        <app-form v-model="formData2" :items="selectItems" />
      </view>

      <!-- 示例 3：混合类型 -->
      <view class="demo-section">
        <view class="section-title">示例 3：混合类型（输入 + 选择 + 日期）</view>
        <app-form v-model="formData3" :items="mixedItems" />
      </view>

      <!-- 底部按钮 -->
      <view class="footer-btn">
        <u-button type="primary" shape="circle" @click="handleSubmit">
          提交数据
        </u-button>
      </view>
    </view>
  </app-page>
</template>

<script setup>
import { reactive, ref } from "vue";
import { $u } from "uview-pro";

// 示例 1：基础输入框配置
const inputItems = [
  {
    key: "name",
    label: "姓名",
    placeholder: "请输入姓名",
    required: true,
  },
  {
    key: "phone",
    label: "手机号",
    placeholder: "请输入手机号",
    inputType: "number",
    required: true,
  },
  {
    key: "age",
    label: "年龄",
    placeholder: "请输入年龄",
    inputType: "digit",
  },
];

// 示例 2：选择框配置
const selectItems = [
  {
    key: "gender",
    label: "性别",
    type: "select",
    placeholder: "请选择性别",
    required: true,
    options: [
      { label: "男", value: "male" },
      { label: "女", value: "female" },
    ],
  },
  {
    key: "education",
    label: "学历",
    type: "select",
    placeholder: "请选择学历",
    options: [
      { label: "高中及以下", value: "high_school" },
      { label: "大专", value: "college" },
      { label: "本科", value: "bachelor" },
      { label: "硕士", value: "master" },
      { label: "博士", value: "doctor" },
    ],
  },
  {
    key: "marriage",
    label: "婚姻状况",
    type: "select",
    placeholder: "请选择婚姻状况",
    options: ["未婚", "已婚", "离异", "丧偶"],
  },
];

// 示例 3：混合类型配置
const mixedItems = [
  {
    key: "orderNo",
    label: "订单编号",
    type: "text",
    placeholder: "请输入订单编号",
    required: true,
  },
  {
    key: "amount",
    label: "订单金额",
    label2: "万元",
    type: "digit",
    placeholder: "请输入金额",
    required: true,
  },
  {
    key: "product",
    label: "产品",
    type: "select",
    placeholder: "请选择产品",
    required: true,
    options: [
      { label: "龙优 C4-36", value: "c4_36" },
      { label: "龙优 C4-48", value: "c4_48" },
      { label: "龙优 C4-60", value: "c4_60" },
      { label: "标准 A-36", value: "a_36" },
      { label: "标准 A-48", value: "a_48" },
      { label: "标准 B-36", value: "b_36" },
    ],
  },
  {
    key: "purpose",
    label: "贷款用途",
    type: "select",
    placeholder: "请选择贷款用途",
    required: true,
    options: [
      { label: "装修", value: "decoration" },
      { label: "购车", value: "car" },
      { label: "旅游", value: "travel" },
      { label: "教育", value: "education" },
      { label: "医疗", value: "medical" },
      { label: "消费", value: "consumption" },
    ],
  },
  {
    key: "signDate",
    label: "签约日期",
    type: "date",
    placeholder: "请选择日期",
    required: true,
    mode: "date",
    startYear: 2024,
    endYear: 2030,
    formatter: "yyyy-mm-dd",
  },
  {
    key: "birthDate",
    label: "出生日期",
    type: "date",
    placeholder: "请选择出生日期",
    mode: "date",
    startYear: 1980,
    endYear: 2005,
    formatter: "yyyy 年 mm 月 dd 日",
  },
  {
    key: "signTime",
    label: "签约时间",
    type: "date",
    placeholder: "请选择时间",
    mode: "time",
    defaultTime: "2024-01-01 12:00:00",
  },
  {
    key: "datetime",
    label: "日期时间",
    type: "date",
    placeholder: "请选择日期时间",
    mode: "datetime",
    startYear: 2024,
    endYear: 2030,
    formatter: "yyyy-mm-dd hh:MM:ss",
  },
];

const formData1 = reactive({});
const formData2 = reactive({});
const formData3 = reactive({});

function handleSubmit() {
  console.log("表单 1 数据:", formData1);
  console.log("表单 2 数据:", formData2);
  console.log("表单 3 数据:", formData3);

  $u.toast("提交成功，查看控制台输出", "success");
}
</script>

<style lang="scss" scoped>
.demo-page {
  padding: 24rpx 24rpx 140rpx;
  background: #f5f6f7;

}

.demo-section {
  margin-bottom: 32rpx;
}
</style>
