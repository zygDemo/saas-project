---
name: carloan-uniapp-coding
description: "CarLoanH5（嗨车无忧）uni-app 项目编码规范与开发约定。基于 uni-app 3 + Vue 3 + TypeScript + uview-pro 的汽车金融业务移动端项目。"
version: 1.0.0
author: Hermes Agent
license: MIT
metadata:
  hermes:
    tags: [uni-app, Vue3, TypeScript, uview-pro, Pinia, 汽车金融]
    related_skills: []
---

# CarLoanH5（嗨车无忧）编码规范

## 1. 项目概述

- **框架**：uni-app 3.0 + Vue 3.4（Composition API）
- **语言**：TypeScript 5.9（strict 模式）
- **UI 库**：uview-pro ^0.6.1
- **状态管理**：Pinia + pinia-plugin-persistedstate
- **样式**：SCSS + UnoCSS
- **构建工具**：Vite 5.2.8

---

## 2. 目录结构规范

```
src/
├── api/                # API 请求层（按业务域分组）
│   ├── index.ts        # 通用 API + 导出聚合
│   ├── auth.ts         # 认证相关（useXxxApi Composable 风格）
│   └── business.ts     # 业务相关（useXxxApi Composable 风格）
├── common/             # 公共工具、常量、拦截器、全局样式
│   ├── constant.ts     # 应用常量、平台判断
│   ├── env.ts          # 环境变量读取工具
│   ├── http.interceptor.ts   # HTTP 统一拦截器
│   ├── style.scss      # 全局 SCSS 样式
│   └── uview-pro.theme.ts    # uview-pro 自定义主题
├── components/         # 全局自定义组件（自动引入）
│   ├── app-form/       # 表单封装组件
│   ├── app-page/       # 页面包装器（导航栏、返回、过渡动画、TabBar）
│   ├── app-tabbar/     # 自定义底部 TabBar
│   └── app-confirm/    # 确认弹窗
├── composables/        # Vue Composables
│   └── useLang.ts      # 语言切换逻辑
├── enums/              # 业务常量（const 对象，非 enum）
│   └── nation.ts       # 民族常量
├── locale/             # 国际化配置
│   ├── index.ts        # vue-i18n 实例创建
│   └── lang/           # 翻译文件（zh-CN.json、en-US.json）
├── pages/              # 页面组件（按业务模块分组）
│   ├── auth/           # 登录页
│   ├── business/       # 核心业务页
│   ├── home/           # 首页及演示页
│   ├── layout/         # 布局组件页
│   └── my/             # 个人中心及设置页
├── static/             # 静态资源
├── stores/             # Pinia 状态管理
│   ├── index.ts        # Pinia 实例创建 + 持久化配置
│   ├── local.ts        # 本地持久化存储（Token、用户信息）
│   ├── session.ts      # 会话级存储（Token、订单信息）
│   ├── tabbar.ts       # TabBar 状态
│   └── counter.ts      # 示例计数器 Store
├── types/              # 全局 TypeScript 类型声明
│   └── env.d.ts        # Vite 环境变量类型声明
├── App.vue             # 根组件
├── main.ts             # 应用入口
├── manifest.json       # uni-app 平台清单
├── pages.json          # 页面路由、全局样式、TabBar
└── theme.json          # 暗黑/亮色模式主题 token
```

---

## 3. API 层编码规范

### 3.1 唯一风格：Composable 风格

项目所有 API 文件统一使用 Composable 风格（以 `useXxxApi()` 函数返回接口方法对象）。

```typescript
import { http } from "uview-pro";

export function useAuthApi() {
  return {
    login: (data: LoginData) => http.post<LoginResult>("/m/login", data),
    logout: () => http.post("/auth/logout"),
    refreshToken: (token: string) =>
      http.post<LoginResult>("/auth/refresh", { refreshToken: token }),
    getUserInfo: () => http.get<Record<string, unknown>>("/auth/user/info"),
  };
}

export interface LoginData {
  username?: string;
  phone?: string;
  password: string;
  code?: string;
  uuid?: string;
}

export interface LoginResult {
  token: string;
  refreshToken: string;
  expires: number;
  userInfo: Record<string, unknown>;
}
```

### 3.2 API 接口命名规范

- 使用 `useXxxApi()` 命名 Composable 函数
- 接口方法使用驼峰命名：`addOrUpdateUserBasic`、`getCreditList`
- RESTful 风格：GET 查询、POST 创建/更新、DELETE 删除
- 路径参数使用模板字符串：`` `/m/credit/getCreditDetail/${id}` ``
- 查询参数作为第二个对象参数：`http.get("/m/user/getContacts", { userUuid })`

### 3.3 类型定义规范

- 每个接口文件顶部定义相关的 TypeScript 接口
- 使用 JSDoc 注释说明字段含义，特别是枚举值
- 可选字段使用 `?` 标记
- 使用 `ApiResponse<T>` 包装响应类型

```typescript
/** API 通用响应包装 */
export interface ApiResponse<T = unknown> {
  code: number;
  msg?: string;
  data?: T;
}

/** 联系人信息（单条） */
export interface ContactInfo {
  /** 主键id */
  id?: number;
  /** 客户唯一编码 */
  userUuid: string;
  /** 联系人类型 1：共借人；2：配偶；3：配偶且共借人；4：担保人 */
  contactType?: number;
  /** 联系人姓名 */
  contactName?: string;
}
```

### 3.4 文件上传

文件上传不走 `http` 插件，使用独立封装的 `uploadFile`：

```typescript
import { uploadFile as uploadByUni } from "@/common/http.interceptor";

export function useBusinessApi() {
  return {
    uploadFile: (filePath: string) => uploadByUni(filePath, "/m/file/upload"),
    uploadImage: (filePath: string) => uploadByUni(filePath, "/m/file/upload"),
  };
}
```

---

## 4. 页面编码规范

### 4.1 页面模板结构

```vue
<template>
  <!-- 方式1：使用 app-page 组件（非 TabBar 页面） -->
  <app-page nav-title="页面标题">
    <view class="page-name">
      <!-- 页面内容 -->
    </view>
  </app-page>

  <!-- 方式2：使用 layout 组件（TabBar 页面） -->
  <layout :active-tab="0" nav-title="首页" show-tabbar>
    <view class="page-name">
      <!-- 页面内容 -->
    </view>
  </layout>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { onLoad, onShow } from "@dcloudio/uni-app";
import { $u } from "uview-pro";
import { storeToRefs } from "pinia";
import { useSessionStore } from "@/stores";
import { useBusinessApi } from "@/api/business";

const sessionStore = useSessionStore();
const { orderInfo } = storeToRefs(sessionStore);
const businessApi = useBusinessApi();

const submitLoading = ref(false);
const form = reactive({
  amount: "",
  periods: "",
});

onLoad((query) => {
  if (query.uuid) {
    sessionStore.setOrderInfo({ uuid: query.uuid });
  }
});
</script>

<style lang="scss" scoped>
.page-name {
  padding: 24rpx;
}
</style>
```

### 4.2 页面命名规范

- 页面目录按业务模块分组：`pages/business/`、`pages/my/`、`pages/auth/`
- 页面文件使用小写驼峰：`idInfo.vue`、`carInfo.vue`、`applyInfo.vue`
- 补全/补充页面以 `Supplement` 结尾：`idInfoSupplement.vue`
- 列表页面以 `List` 结尾：`orderList.vue`、`leadList.vue`
- 详情页面以 `Detail` 结尾：`applyDetail.vue`、`supplementDetail.vue`

### 4.3 v-for 必须配合 key

```vue
<!-- ✅ 使用稳定的唯一标识 -->
<li v-for="item in list" :key="item.id">
  {{ item.name }}
</li>

<!-- ❌ 避免使用 index 作为 key（除非列表纯展示且不变化） -->
<li v-for="(item, index) in list" :key="index">
  {{ item.name }}
</li>
```

### 4.4 重复项渲染规范（2 个以上必用循环）

模板中出现 2 个及以上结构相同的重复项时，必须使用 `v-for` 循环渲染，禁止硬编码重复结构。

**✅ 正确：使用 v-for**

```vue
<template>
  <!-- 表单字段循环 -->
  <u-form-item
    v-for="field in formFields"
    :key="field.key"
    :label="field.label"
    :required="field.required"
  >
    <u-input
      v-model="form[field.key]"
      :placeholder="field.placeholder"
      :type="field.type"
    />
  </u-form-item>

  <!-- 操作按钮循环 -->
  <view class="action-bar">
    <u-button
      v-for="btn in actionButtons"
      :key="btn.type"
      :type="btn.type"
      @click="btn.handler"
    >
      {{ btn.text }}
    </u-button>
  </view>

  <!-- Tab 选项循环 -->
  <view class="tab-list">
    <view
      v-for="tab in tabs"
      :key="tab.value"
      :class="['tab-item', { active: activeTab === tab.value }]"
      @click="activeTab = tab.value"
    >
      <u-icon :name="tab.icon" />
      <text>{{ tab.label }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
const formFields = [
  {
    key: "name",
    label: "姓名",
    placeholder: "请输入姓名",
    type: "text",
    required: true,
  },
  {
    key: "phone",
    label: "手机号",
    placeholder: "请输入手机号",
    type: "number",
    required: true,
  },
  {
    key: "idCard",
    label: "身份证号",
    placeholder: "请输入身份证号",
    type: "text",
    required: true,
  },
];

const actionButtons = [
  { type: "default", text: "取消", handler: handleCancel },
  { type: "primary", text: "提交", handler: handleSubmit },
];

const tabs = [
  { label: "待办", value: "todo", icon: "clock" },
  { label: "已办", value: "done", icon: "checkmark" },
  { label: "全部", value: "all", icon: "list" },
];
</script>
```

**❌ 错误：硬编码重复结构**

```vue
<!-- 禁止：2 个以上相同结构硬编码 -->
<u-form-item label="姓名" required>
  <u-input v-model="form.name" placeholder="请输入姓名" />
</u-form-item>
<u-form-item label="手机号" required>
  <u-input v-model="form.phone" placeholder="请输入手机号" />
</u-form-item>
<u-form-item label="身份证号" required>
  <u-input v-model="form.idCard" placeholder="请输入身份证号" />
</u-form-item>

<!-- 禁止：按钮硬编码 -->
<u-button type="default" @click="handleCancel">取消</u-button>
<u-button type="primary" @click="handleSubmit">提交</u-button>
```

**判断标准：**

- 模板中同一层级出现 **2 个及以上** 结构相同的元素 → 必须使用 `v-for`
- 仅当列表项为纯展示、无交互、数据永不变化时，可酌情保留硬编码（如静态说明文案）
- 配置数据建议提取到 `<script>` 中，保持模板简洁

### 4.5 导航规范

```typescript
// 普通跳转
uni.navigateTo({ url: "/pages/business/idInfo" });

// 跳转并携带参数
uni.navigateTo({ url: `/pages/business/applyInfo?uuid=${uuid}` });

// 返回上一页
uni.navigateBack({ delta: 1 });

// 重定向（登录后跳转首页）
uni.reLaunch({ url: "/pages/business/workbench" });

// 关闭当前页跳转
uni.redirectTo({ url: "/pages/business/applyResult" });
```

### 4.6 条件编译

项目广泛使用 uni-app 条件编译，针对不同平台写差异化代码：

```vue
<!-- #ifdef H5 -->
<!-- H5 专属代码 -->
<!-- #endif -->

<!-- #ifndef MP-ALIPAY -->
<!-- 非支付宝小程序代码 -->
<!-- #endif -->

// #ifdef MP-WEIXIN // 微信小程序专属代码 // #endif // #ifdef APP-PLUS // App
专属代码 // #endif
```

常用平台标识：`H5`、`MP-WEIXIN`、`APP-PLUS`、`APP-ANDROID`、`APP-IOS`、`APP-HARMONY`

---

## 5. 状态管理规范

### 5.1 唯一风格：Option Store

项目所有 Pinia Store 统一使用 Option Store 风格（`defineStore(id, options)`）。

```typescript
import { defineStore } from "pinia";

const localStorageAdapter = {
  getItem: (key: string) => uni.getStorageSync(key),
  setItem: (key: string, value: string) => uni.setStorageSync(key, value),
  removeItem: (key: string) => uni.removeStorageSync(key),
};

export const useLocalStore = defineStore("local", {
  state: () => ({
    token: "",
    refreshToken: "",
    userInfo: null as UserInfo | null,
    loginTime: 0,
    expireTime: 0,
  }),
  getters: {
    isExpired: (state) => {
      return state.expireTime ? Date.now() >= state.expireTime : false;
    },
    isAuthenticated(): boolean {
      return Boolean(this.token) && !this.isExpired;
    },
  },
  actions: {
    setToken(token: string) {
      this.token = token;
    },
    logout() {
      this.token = "";
      this.refreshToken = "";
      this.userInfo = null;
      this.loginTime = 0;
      this.expireTime = 0;
    },
  },
  persist: {
    key: "local-store",
    storage: (globalThis as any)?.localStorage || localStorageAdapter,
    paths: ["token", "refreshToken", "userInfo", "loginTime", "expireTime"],
  },
});
```

### 5.2 Store 使用规范

```typescript
// 在组件中使用
import { useLocalStore, useSessionStore } from "@/stores";
import { storeToRefs } from "pinia";

const localStore = useLocalStore();
const sessionStore = useSessionStore();

// 使用 storeToRefs 解构响应式状态
const { token, userInfo } = storeToRefs(localStore);

// 直接调用 action
localStore.logout();
sessionStore.setOrderInfo({ uuid: "xxx" });
```

### 5.3 枚举替代（const 对象 + 类型）

项目禁止使用 TypeScript `enum`，统一使用 `const` 对象 + 类型推导替代。

**✅ 正确：const 对象 + as const**

```typescript
// 定义
const UserStatus = {
  ACTIVE: 1,
  INACTIVE: 0,
  BANNED: -1,
} as const;

type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

// 使用
const status: UserStatus = UserStatus.ACTIVE;

// 判断
if (status === UserStatus.ACTIVE) {
  // ...
}
```

**带标签的枚举（用于下拉选项、状态显示）**

```typescript
// 定义
const ContactType = {
  CO_BORROWER: { value: 1, label: "共借人" },
  SPOUSE: { value: 2, label: "配偶" },
  SPOUSE_AND_CO_BORROWER: { value: 3, label: "配偶且共借人" },
  GUARANTOR: { value: 4, label: "担保人" },
} as const;

type ContactTypeValue = (typeof ContactType)[keyof typeof ContactType]["value"];

// 使用
const contactType: ContactTypeValue = ContactType.CO_BORROWER.value;

// 获取标签
const getContactLabel = (value: ContactTypeValue) => {
  return (
    Object.values(ContactType).find((item) => item.value === value)?.label || ""
  );
};

// 转下拉选项
const contactOptions = Object.values(ContactType).map((item) => ({
  label: item.label,
  value: item.value,
}));
```

**❌ 错误：使用 enum**

```typescript
// 禁止
enum UserStatus {
  ACTIVE = 1,
  INACTIVE = 0,
  BANNED = -1,
}
```

**原因：**

- `enum` 编译后生成反向映射对象，增加包体积
- `const` 对象在编译期完全擦除，零运行时开销
- `as const` 保证值不可变，类型推导更精确
- 与项目现有代码风格一致（如 `common/constant.ts` 中的常量定义）

### 5.4 状态映射规范（2 个以上状态必用常量映射）

模板或逻辑中出现 **2 个以上状态分支**时，必须使用 `const` 对象进行状态映射，禁止写死散落的条件判断。

**✅ 正确：状态常量映射**

```typescript
// 定义状态映射常量
const AuditStatus = {
  PENDING: { value: 0, label: "待审核", color: "#E6A23C", tagType: "warning" },
  APPROVED: { value: 1, label: "已通过", color: "#67C23A", tagType: "success" },
  REJECTED: { value: 2, label: "已拒绝", color: "#F56C6C", tagType: "error" },
  CANCELLED: { value: 3, label: "已取消", color: "#909399", tagType: "info" },
} as const;

type AuditStatusValue = (typeof AuditStatus)[keyof typeof AuditStatus]["value"];

// 获取状态标签
const getAuditLabel = (value: AuditStatusValue) => {
  return (
    Object.values(AuditStatus).find((item) => item.value === value)?.label ||
    "未知"
  );
};

// 获取状态颜色
const getAuditColor = (value: AuditStatusValue) => {
  return (
    Object.values(AuditStatus).find((item) => item.value === value)?.color ||
    "#999"
  );
};

// 获取 tag 类型
const getAuditTagType = (value: AuditStatusValue) => {
  return (
    Object.values(AuditStatus).find((item) => item.value === value)?.tagType ||
    "info"
  );
};
```

```vue
<template>
  <!-- 状态标签展示 -->
  <u-tag :type="getAuditTagType(status)">{{ getAuditLabel(status) }}</u-tag>

  <!-- 状态颜色文本 -->
  <text :style="{ color: getAuditColor(status) }">{{
    getAuditLabel(status)
  }}</text>

  <!-- 条件渲染（仍需映射） -->
  <view v-if="status === AuditStatus.PENDING.value">
    <u-button type="primary" @click="handleAudit">去审核</u-button>
  </view>
  <view v-else-if="status === AuditStatus.REJECTED.value">
    <u-button type="warning" @click="handleReapply">重新申请</u-button>
  </view>
</template>
```

**按钮/操作映射示例：**

```typescript
const OrderActions = {
  PENDING_PAY: {
    status: 1,
    primaryBtn: { text: "立即支付", action: "pay" },
    secondaryBtn: { text: "取消订单", action: "cancel" },
  },
  PENDING_SHIP: {
    status: 2,
    primaryBtn: { text: "提醒发货", action: "remind" },
    secondaryBtn: { text: "申请退款", action: "refund" },
  },
  SHIPPED: {
    status: 3,
    primaryBtn: { text: "确认收货", action: "receive" },
    secondaryBtn: { text: "查看物流", action: "logistics" },
  },
  COMPLETED: {
    status: 4,
    primaryBtn: { text: "再次购买", action: "rebuy" },
    secondaryBtn: { text: "申请售后", action: "aftersale" },
  },
} as const;

// 获取当前状态的操作配置
const getOrderAction = (status: number) => {
  return Object.values(OrderActions).find((item) => item.status === status);
};
```

```vue
<template>
  <view class="action-bar">
    <u-button
      v-if="currentAction?.secondaryBtn"
      type="default"
      @click="handleAction(currentAction.secondaryBtn.action)"
    >
      {{ currentAction.secondaryBtn.text }}
    </u-button>
    <u-button
      v-if="currentAction?.primaryBtn"
      type="primary"
      @click="handleAction(currentAction.primaryBtn.action)"
    >
      {{ currentAction.primaryBtn.text }}
    </u-button>
  </view>
</template>

<script setup lang="ts">
const currentAction = computed(() => getOrderAction(orderStatus.value));

const handleAction = (action: string) => {
  switch (action) {
    case "pay":
      handlePay();
      break;
    case "cancel":
      handleCancel();
      break;
    case "remind":
      handleRemind();
      break;
    case "refund":
      handleRefund();
      break;
    case "receive":
      handleReceive();
      break;
    case "logistics":
      handleLogistics();
      break;
    case "rebuy":
      handleRebuy();
      break;
    case "aftersale":
      handleAftersale();
      break;
  }
};
</script>
```

**❌ 错误：散落的状态判断**

```vue
<template>
  <!-- 禁止：2 个以上状态用散落条件 -->
  <u-tag v-if="status === 0" type="warning">待审核</u-tag>
  <u-tag v-else-if="status === 1" type="success">已通过</u-tag>
  <u-tag v-else-if="status === 2" type="error">已拒绝</u-tag>
  <u-tag v-else type="info">已取消</u-tag>

  <!-- 禁止：颜色硬编码 -->
  <text v-if="status === 0" style="color: #E6A23C;">待审核</text>
  <text v-else-if="status === 1" style="color: #67C23A;">已通过</text>
  <text v-else-if="status === 2" style="color: #F56C6C;">已拒绝</text>

  <!-- 禁止：按钮逻辑散落 -->
  <view v-if="status === 1">
    <u-button @click="handlePay">立即支付</u-button>
    <u-button @click="handleCancel">取消订单</u-button>
  </view>
  <view v-else-if="status === 2">
    <u-button @click="handleRemind">提醒发货</u-button>
    <u-button @click="handleRefund">申请退款</u-button>
  </view>
  <view v-else-if="status === 3">
    <u-button @click="handleReceive">确认收货</u-button>
    <u-button @click="handleLogistics">查看物流</u-button>
  </view>
</template>
```

**判断标准：**

- 模板中出现 **2 个及以上** `v-if/v-else-if` 判断同一状态 → 必须使用常量映射
- 状态相关的 **颜色、文案、按钮、图标** 等有多处使用时 → 必须收拢到常量对象
- 仅当状态为 **布尔型（是/否）** 或只有 **1 个分支** 时，可保留简单条件判断

### 5.5 持久化配置

- `localStore`：使用 localStorage（跨会话持久化）
- `sessionStore`：使用 sessionStorage（会话级）
- 跨平台适配：使用 `uni.getStorageSync` / `uni.setStorageSync` 作为 storage adapter

---

## 6. HTTP 拦截器规范

### 6.1 请求拦截

```typescript
export const httpInterceptor: RequestInterceptor = {
  request: (config: RequestOptions) => {
    const meta: RequestMeta = config.meta || {};

    // 1. 显示 Loading
    if (meta.loading) {
      uni.showLoading({ title: "加载中...", mask: true });
    }

    // 2. 注入 Token
    const localStore = useLocalStore();
    if (localStore.token) {
      config.header["M-Authorization"] = `Bearer ${localStore.token}`;
    }

    return config;
  },

  response: (response: any) => {
    const meta: RequestMeta = response.config?.meta || {};

    // 1. 关闭 Loading
    if (meta.loading) {
      uni.hideLoading();
    }

    // 2. HTTP 状态码错误
    if (response.statusCode !== 200) {
      handleHttpError(response, meta);
      return false; // 阻断后续代码，进入 catch
    }

    // 3. 业务状态码错误
    if (response.data && response.data.code !== 200) {
      handleBusinessError(response, meta);
      return false;
    }

    // 4. 返回成功数据
    return response.data;
  },
};
```

### 6.2 错误处理

- HTTP 401 → 清除登录态 → `uni.reLaunch({ url: "/pages/auth/login" })`
- 业务 code 401 → 同上
- 其他错误 → `uni.showToast({ title: "错误信息", icon: "none" })`

### 6.3 请求配置

```typescript
export const httpRequestConfig: RequestConfig = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || "http://122.51.140.89:10088",
  header: { "content-type": "application/json" },
  meta: {
    originalData: true,
    toast: true,
    loading: true,
  },
};
```

---

## 7. 样式规范

### 7.1 单位规范

- 统一使用 `rpx` 作为尺寸单位（uni-app 响应式单位）
- 字体大小：`26rpx`、`28rpx`、`30rpx`、`32rpx`
- 间距：`16rpx`、`20rpx`、`24rpx`、`32rpx`
- 圆角：`8rpx`、`12rpx`、`16rpx`、`50rpx`（圆形按钮）

### 7.2 颜色规范

使用 uview-pro CSS 变量，不硬编码颜色值：

```scss
/* 正确 */
.color: var(--u-type-primary);
.background: $u-bg-white;

/* 错误 */
.color: #409eff;
```

常用变量：

- `--u-type-primary` - 主题色（海洋蓝 #409EFF）
- `--u-type-success` - 成功色
- `--u-type-warning` - 警告色
- `--u-type-error` - 错误色
- `$u-bg-white` - 白色背景
- `$u-main-color` - 主文字色

### 7.3 全局样式类

定义在 `common/style.scss` 中：

```scss
/* 底部固定按钮 */
.footer-btn {
  position: fixed;
  left: 24rpx;
  right: 24rpx;
  bottom: 10rpx;
  display: flex;
  gap: 24rpx;
  z-index: 100;
}

/* 竖杠标题 */
.section-title {
  font-weight: bold;
  color: #333;
  padding: 20rpx 0;
  padding-left: 24rpx;
  position: relative;
}
.section-title::before {
  content: "";
  position: absolute;
  top: 52%;
  left: 0;
  width: 7rpx;
  height: 29rpx;
  background: linear-gradient(
    180deg,
    var(--u-type-primary-dark),
    var(--u-type-primary)
  );
  border-radius: 4rpx;
  transform: translateY(-50%);
}
```

### 7.4 页面背景

- TabBar 页面使用渐变背景：

```scss
.has-tabbar {
  background-image: linear-gradient(
    135deg,
    rgba(var(--u-type-primary-rgb, 41, 121, 255), 0.04) 0%,
    rgba(var(--u-type-success-rgb, 25, 190, 107), 0.04) 40%,
    rgba(var(--u-type-warning-rgb, 255, 153, 0), 0.04) 100%
  );
}
```

---

## 8. 组件使用规范

### 8.1 uview-pro 组件

通过 `@uni-helper/vite-plugin-uni-components` 自动引入，无需手动 import：

```vue
<template>
  <u-button type="primary" shape="circle" @click="handleClick">提交</u-button>
  <u-input v-model="value" placeholder="请输入" />
  <u-form :model="form">
    <u-form-item label="姓名" required>
      <u-input v-model="form.name" />
    </u-form-item>
  </u-form>
  <u-image :src="url" width="200rpx" height="200rpx" mode="aspectFill" />
  <u-icon name="home" size="32" color="var(--u-type-primary)" />
  <u-popup v-model="show" mode="center">
    <!-- 弹窗内容 -->
  </u-popup>
</template>
```

### 8.2 自定义全局组件

|     | 组件           | 用途                                 | 示例                                            |
| --- | -------------- | ------------------------------------ | ----------------------------------------------- |
|     | `<app-page>`   | 页面包装器（导航栏、返回、过渡动画） | `<app-page nav-title="标题">`                   |
|     | `<layout>`     | TabBar 页面布局                      | `<layout :active-tab="0" show-tabbar>`          |
|     | `<AppForm>`    | 表单封装                             | `<AppForm v-model="form" :items="formItems" />` |
|     | `<app-tabbar>` | 底部 TabBar                          | 由 layout 组件自动引入                          |

### 8.3 组件封装与通信规范

#### 优先通过 Ref / 组件实例直接调用

组件封装时，优先暴露方法供父组件通过 `ref` 直接调用，而非依赖 `props` + `emit` 的繁琐双向传递。

**子组件定义暴露的方法：**

```vue
<script setup lang="ts">
import { ref } from "vue";

const visible = ref(false);
const formData = ref({});

// 打开弹窗并传入初始数据
const open = (data?: Record<string, unknown>) => {
  visible.value = true;
  if (data) formData.value = { ...data };
};

// 关闭弹窗并清空数据
const close = () => {
  visible.value = false;
  formData.value = {};
};

// 获取当前表单数据（供父组件提交前读取）
const getFormData = () => formData.value;

// 校验表单（返回布尔值）
const validate = () => {
  // ... 校验逻辑
  return true;
};

// 暴露给父组件
defineExpose({
  open,
  close,
  getFormData,
  validate,
});
</script>
```

**父组件通过 ref 调用：**

```vue
<template>
  <view>
    <u-button type="primary" @click="handleOpen">打开弹窗</u-button>

    <!-- 子组件 -->
    <ChildForm ref="childRef" />
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import ChildForm from "./ChildForm.vue";

const childRef = ref<InstanceType<typeof ChildForm>>();

const handleOpen = () => {
  // 直接调用子组件方法
  childRef.value?.open({ name: "初始值" });
};

const handleSubmit = async () => {
  // 先校验
  const isValid = childRef.value?.validate();
  if (!isValid) return;

  // 再获取数据
  const data = childRef.value?.getFormData();
  console.log("提交数据:", data);
};
</script>
```

#### 何时使用 Props / Emit

| 场景                           | 推荐方式         | 原因                             |
| ------------------------------ | ---------------- | -------------------------------- |
| 纯展示组件（如卡片、列表项）   | `props`          | 数据单向流动，简单清晰           |
| 需要父组件控制显隐/状态        | `ref` + 暴露方法 | 避免 `v-model` + `emit` 多层传递 |
| 表单/弹窗/复杂交互组件         | `ref` + 暴露方法 | 父组件主动调用，逻辑集中         |
| 事件通知（如点击、关闭后回调） | `emit`           | 通知父组件做后续操作             |

#### 组合式封装示例：表单 + 弹窗

```vue
<!-- IdCardForm.vue -->
<template>
  <u-popup v-model="visible" mode="center">
    <view class="form-popup">
      <u-form :model="form">
        <u-form-item label="姓名" required>
          <u-input v-model="form.name" />
        </u-form-item>
        <u-form-item label="身份证号" required>
          <u-input v-model="form.idCard" />
        </u-form-item>
      </u-form>
      <u-button type="primary" @click="handleConfirm">确认</u-button>
    </view>
  </u-popup>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";

const visible = ref(false);
const form = reactive({ name: "", idCard: "" });
let resolveFn: ((value: unknown) => void) | null = null;

const open = (data?: { name?: string; idCard?: string }) => {
  visible.value = true;
  if (data) {
    form.name = data.name || "";
    form.idCard = data.idCard || "";
  }
  return new Promise((resolve) => {
    resolveFn = resolve;
  });
};

const handleConfirm = () => {
  visible.value = false;
  resolveFn?.({ ...form });
  resolveFn = null;
};

defineExpose({ open });
</script>
```

```vue
<!-- 父组件中使用 -->
<template>
  <app-page nav-title="身份认证">
    <u-button type="primary" @click="handleEdit">编辑身份信息</u-button>
    <IdCardForm ref="idCardRef" />
  </app-page>
</template>

<script setup lang="ts">
import { ref } from "vue";
import IdCardForm from "./IdCardForm.vue";

const idCardRef = ref<InstanceType<typeof IdCardForm>>();

const handleEdit = async () => {
  const result = await idCardRef.value?.open({
    name: "张三",
    idCard: "110101199001011234",
  });
  console.log("弹窗返回结果:", result);
};
</script>
```

### 8.4 表单组件 AppForm 配置

```typescript
const formItems = [
  {
    key: "amount", // 字段名
    label: "申请金额(元)", // 标签
    placeholder: "请输入申请金额",
    type: "number", // text/number/textarea/password/date/region/select/checkbox/radio
    rules: [{ required: true, message: "请输入申请金额" }],
  },
  {
    key: "periods",
    label: "贷款期数",
    type: "select",
    options: [
      { label: "12期", value: 12 },
      { label: "24期", value: 24 },
    ],
  },
];
```

---

## 9. 环境变量规范

### 9.1 环境变量文件

| 文件               | 用途             |
| ------------------ | ---------------- |
| `.env.development` | 本地开发环境     |
| `.env.sit`         | SIT/UAT 测试环境 |
| `.env.production`  | 生产环境         |

### 9.2 已声明变量

```typescript
// src/types/env.d.ts
interface ImportMetaEnv {
  readonly VITE_APP_ENV: string;
  readonly VITE_API_BASE_URL: string;
  readonly VITE_IMAGE_BASE_URL: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_DEBUG: string;
  readonly VITE_UPLOAD_MAX_SIZE: string;
  readonly VITE_REQUEST_TIMEOUT: string;
}
```

### 9.3 读取方式

```typescript
import {
  getEnv,
  getEnvBoolean,
  getEnvNumber,
  isDev,
  isSit,
  isProd,
  API_BASE_URL,
} from "@/common/env";

// 字符串
const apiUrl = getEnv("VITE_API_BASE_URL", "http://default.com");

// 布尔值
const debug = getEnvBoolean("VITE_DEBUG", false);

// 数字
const timeout = getEnvNumber("VITE_REQUEST_TIMEOUT", 30000);

// 快捷判断
if (isDev) {
  /* 开发环境逻辑 */
}
```

---

## 10. 国际化规范

### 10.1 语言切换

```typescript
import { useLang } from "@/composables/useLang";

const { currentLang, switchLang } = useLang();

// 切换语言
switchLang("zh-CN"); // 或 "en-US"
```

### 10.2 模板中使用

```vue
<template>
  <text>{{ $t("hello") }}</text>
  <u-button :text="$t('submit')" />
</template>
```

---

## 11. 主题规范

### 11.1 当前主题

- 主题名称：`ocean`（海洋蓝）
- 默认模式：`light`（亮色模式）
- 支持暗黑模式切换

### 11.2 主题变量

```scss
// 主色
--u-type-primary: #409eff;
--u-type-primary-dark: #337ecc;
--u-type-primary-disabled: #a0cfff;
--u-type-primary-light: #ecf5ff;

// 功能色
--u-type-success: #67c23a;
--u-type-warning: #e6a23c;
--u-type-error: #f56c6c;
--u-type-info: #909399;
```

---

## 12. 开发工具与调试

### 12.1 vConsole

H5 环境下，URL 携带 `vConsole=1` 参数自动启用：

```
http://localhost:3000/?vConsole=1
```

### 12.2 构建命令

```bash
# 开发
pnpm dev:h5
pnpm dev:mp-weixin

# 构建
pnpm build:h5
pnpm build:mp-weixin

# 类型检查
pnpm type-check

# ESLint
pnpm lint
pnpm lint:fix
```

---

## 13. 常见代码模式

### 13.1 列表页面模式

```vue
<script setup>
const list = ref([]);
const loading = ref(false);
const isRefreshing = ref(false);
const hasMore = ref(true);
const pageNum = ref(1);
const pageSize = 10;

const fetchList = async (isRefresh = false) => {
  if (loading.value) return;
  loading.value = true;

  try {
    const params = { pageNum: pageNum.value, pageSize };
    const res = await businessApi.getCreditList(params);
    if (res?.code === 200) {
      const data = res.data?.list || [];
      if (isRefresh) {
        list.value = data;
      } else {
        list.value.push(...data);
      }
      hasMore.value = data.length === pageSize;
    }
  } finally {
    loading.value = false;
    isRefreshing.value = false;
  }
};

const onRefresh = () => {
  pageNum.value = 1;
  isRefreshing.value = true;
  fetchList(true);
};

const loadMore = () => {
  if (!hasMore.value || loading.value) return;
  pageNum.value++;
  fetchList();
};
</script>
```

### 13.2 表单提交模式

```vue
<script setup>
const submitLoading = ref(false);

const handleSubmit = async () => {
  if (submitLoading.value) return;

  // 表单校验
  if (!form.amount) {
    $u.toast("请输入申请金额", "error");
    return;
  }

  submitLoading.value = true;
  try {
    const res = await businessApi.creditApply({
      uuid,
      amount: Number(form.amount),
      periods: Number(form.periods),
    });

    if (res?.code === 200) {
      $u.toast("申请已提交！", "success");
      uni.navigateTo({ url: "/pages/business/applyResult" });
    }
  } finally {
    submitLoading.value = false;
  }
};
</script>
```

### 13.3 图片上传模式

```vue
<script setup>
const pickImage = async (type) => {
  const res = await uni.chooseImage({ count: 1 });
  const filePath = res.tempFilePaths[0];

  // 上传
  const uploadRes = await businessApi.uploadImage(filePath);
  if (uploadRes?.code === 200) {
    const url = uploadRes.data?.url;
    if (type === "front") {
      frontImage.value = url;
    } else {
      backImage.value = url;
    }
    // OCR 识别
    const ocrRes = await businessApi.getIdCardOcr(uploadRes.data?.objectKey);
    if (ocrRes?.code === 200) {
      Object.assign(idInfo, ocrRes.data);
    }
  }
};
</script>
```

---

## 14. 函数编码规范

### 14.1 单一职责：一个函数只调一个接口

**一个函数中只允许调用一个接口**。若页面需要多个接口数据，必须拆分为多个独立函数，由统一的 `initData` 聚合调用。

**✅ 正确：接口拆分 + initData 聚合**

```vue
<script setup lang="ts">
// 一进入页面就要调用的数据初始化函数统一命名为 initData
const initData = () => {
  fetchUserInfo();
  fetchOrderList();
  fetchConfig();
};

// 每个函数只调一个接口
const fetchUserInfo = async () => {
  const res = await businessApi.getUserInfo();
  if (res?.code === 200) {
    userInfo.value = res.data;
  }
};

const fetchOrderList = async () => {
  const res = await businessApi.getOrderList({ pageNum: 1, pageSize: 10 });
  if (res?.code === 200) {
    orderList.value = res.data?.list || [];
  }
};

const fetchConfig = async () => {
  const res = await businessApi.getSystemConfig();
  if (res?.code === 200) {
    config.value = res.data;
  }
};

// 页面加载时调用
onLoad(() => {
  initData();
});
</script>
```

**❌ 错误：一个函数内串/并行多个接口**

```vue
<script setup lang="ts">
// 禁止：一个函数里调多个接口
const initData = async () => {
  const userRes = await businessApi.getUserInfo();
  userInfo.value = userRes.data;

  const orderRes = await businessApi.getOrderList();
  orderList.value = orderRes.data?.list;

  const configRes = await businessApi.getSystemConfig();
  config.value = configRes.data;
};

// 禁止：Promise.all 合并多个不相关接口
const fetchAll = () => {
  Promise.all([
    businessApi.getUserInfo(),
    businessApi.getOrderList(),
    businessApi.getSystemConfig(),
  ]).then(([userRes, orderRes, configRes]) => {
    // ...
  });
};
</script>
```

### 14.2 函数声明统一使用箭头函数

所有函数统一使用 `const fn = () => {}` 的箭头函数形式，不使用 `function` 声明。

**✅ 正确**

```typescript
// 普通函数
const initData = () => {
  fetchUserInfo();
};

// 异步函数
const fetchUserInfo = async () => {
  const res = await businessApi.getUserInfo();
  if (res?.code === 200) {
    userInfo.value = res.data;
  }
};

// 带参数的函数
const handleSubmit = (formData: FormData) => {
  console.log(formData);
};

// 带返回值的函数
const getFullName = (user: User) => {
  return `${user.firstName} ${user.lastName}`;
};

// 单行简写
const double = (n: number) => n * 2;
```

**❌ 错误**

```typescript
// 禁止：function 声明
function initData() {
  fetchUserInfo();
}

// 禁止：async function
async function fetchUserInfo() {
  const res = await businessApi.getUserInfo();
  return res.data;
}
```

### 14.3 initData 命名规范

- **一进入页面就要调用的数据初始化函数，统一命名为 `initData`**
- `initData` 只做一件事：聚合调用各独立的数据获取函数
- `initData` 本身不直接调用接口，只调用其他函数
- 页面生命周期中统一入口：

```typescript
onLoad(() => {
  initData();
});

onShow(() => {
  // 需要每次显示都刷新的数据
  initData();
});
```

### 14.4 函数拆分原则

| 场景                                   | 处理方式                                     |
| -------------------------------------- | -------------------------------------------- |
| 页面初始化需多个接口                   | 拆分为多个单接口函数，由 `initData` 聚合调用 |
| 接口之间存在依赖（后一个需前一个结果） | 在独立函数中链式调用，仍保持外层单一职责     |
| 用户交互触发的数据刷新                 | 单独命名，如 `refreshList`、`reloadUserInfo` |
| 提交/保存类操作                        | 单独命名，如 `handleSubmit`、`handleSave`    |

**存在依赖关系的处理示例：**

```typescript
// 获取详情后，用详情中的 ID 获取附加信息
const fetchDetail = async () => {
  const res = await businessApi.getCreditDetail(id);
  if (res?.code === 200) {
    detail.value = res.data;
    // 依赖详情数据，调用下一个接口
    fetchAttachment(res.data.attachmentId);
  }
};

const fetchAttachment = async (attachmentId: string) => {
  const res = await businessApi.getAttachment(attachmentId);
  if (res?.code === 200) {
    attachment.value = res.data;
  }
};

const initData = () => {
  fetchDetail();
};
```

---

## 15. 注意事项

1. **组件自动引入** - uview-pro 和自定义组件通过 Vite 插件自动引入，无需手动 import
2. **路径别名** - 使用 `@/` 指向 `src/` 目录
3. **条件编译** - 平台差异代码使用 `<!-- #ifdef -->` 或 `// #ifdef`
4. **Token 注入** - HTTP 请求自动携带 Token，无需手动处理
5. **401 处理** - 统一在拦截器中处理未授权，组件中无需关心
6. **Loading 控制** - 通过 `meta.loading` 控制请求 Loading，默认开启
7. **无 Prettier** - 项目未配置 Prettier，依赖 ESLint 基础检查
8. **无单元测试** - 当前无测试框架，新增核心逻辑需手动验证
