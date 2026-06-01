# 嗨车无忧（CarLoanH5）产品需求文档

> 文档版本：v1.0  
> 产品名称：嗨车无忧  
> 文档类型：PRD（Product Requirements Document）  
> 目标平台：H5、微信小程序、Android App、iOS App、鸿蒙  

---

## 目录

1. [项目概述](#1-项目概述)
2. [产品定位](#2-产品定位)
3. [用户角色](#3-用户角色)
4. [功能架构](#4-功能架构)
5. [功能需求详述](#5-功能需求详述)
6. [非功能需求](#6-非功能需求)
7. [数据模型](#7-数据模型)
8. [接口规范](#8-接口规范)
9. [页面清单](#9-页面清单)
10. [状态管理](#10-状态管理)
11. [附录](#11-附录)

---

## 1. 项目概述

### 1.1 项目背景

嗨车无忧是一款面向汽车贷款/金融业务的移动端应用，服务于业务员（销售/客户经理）开展汽车金融业务的完整流程。应用覆盖从客户线索获取、身份认证、车辆评估、贷款申请、审批跟踪到签约放款的全生命周期管理。

### 1.2 技术栈

| 层级 | 技术选型 | 版本 |
|------|----------|------|
| 跨平台框架 | uni-app | 3.0 |
| 前端框架 | Vue | 3.4 |
| 开发语言 | TypeScript | 5.9 |
| 构建工具 | Vite | 5.2.8 |
| UI 组件库 | uview-pro | ^0.6.1 |
| 状态管理 | Pinia + pinia-plugin-persistedstate | 2.2.4 |
| 样式方案 | SCSS + UnoCSS | - |
| 路由 | vue-router | 4.5.1 |
| 国际化 | vue-i18n | 9.1.9 |
| 包管理器 | pnpm | >= 7.30 |

### 1.3 支持平台

- H5（浏览器访问）
- 微信小程序
- Android App（uni-app 打包）
- iOS App（uni-app 打包）
- 鸿蒙 App（HarmonyOS）
- 支付宝/百度/抖音/QQ/快手/京东/飞书/小红书/钉钉小程序

---

## 2. 产品定位

### 2.1 产品目标

为汽车金融业务人员提供一站式移动办公工具，实现：
- 客户信息快速采集与身份认证
- 车辆信息录入与评估
- 贷款进件在线提交与跟踪
- 审批流程实时查看
- 电子签约与视频面签
- 订单全生命周期管理

### 2.2 核心价值

1. **移动化办公** - 业务员可随时随地处理业务，无需依赖 PC 端
2. **流程标准化** - 统一的进件流程，降低操作失误
3. **数据实时同步** - 与后端系统实时交互，状态即时更新
4. **多平台覆盖** - 一套代码适配多平台，降低维护成本

---

## 3. 用户角色

### 3.1 业务员（Sales）

- **描述**：一线销售人员/客户经理，主要负责客户拓展和进件提交
- **权限**：
  - 客户信息录入与编辑
  - 车辆信息录入
  - 贷款申请提交
  - 查看自己提交的订单状态
  - 执行视频面签/合同签署

### 3.2 系统特性

- 用户通过手机号+密码登录
- 支持 Token 自动刷新机制
- 登录状态持久化存储
- 401 未授权自动跳转登录页

---

## 4. 功能架构

```
嗨车无忧
├── 认证模块
│   └── 登录/登出
├── 首页（工作台）
│   ├── 业务快捷入口
│   ├── 待办事项
│   └── 数据统计概览
├── 客户管理
│   ├── 客户身份认证
│   ├── 身份证 OCR 识别
│   └── 联系人管理
├── 车辆管理
│   ├── 车辆信息录入
│   ├── VIN 识别
│   └── 车型查询
├── 进件管理
│   ├── 贷款申请
│   ├── 资料补全
│   ├── 产品选择
│   └── 申请提交
├── 审批管理
│   ├── 审批列表
│   ├── 审批详情
│   └── 审批状态跟踪
├── 签约管理
│   ├── 视频面签
│   ├── 合同签署
│   └── 签署结果
├── 订单管理
│   ├── 订单列表
│   ├── 订单详情
│   └── 订单状态跟踪
├── 线索管理
│   ├── 线索列表
│   └── 线索录入
├── 文件管理
│   ├── 文件上传
│   ├── 文件列表
│   └── 文件删除
└── 个人中心
    ├── 个人信息
    ├── 设置
    ├── FAQ
    ├── 隐私协议
    └── 用户协议
```

---

## 5. 功能需求详述

### 5.1 认证模块

#### 5.1.1 用户登录

| 项目 | 内容 |
|------|------|
| **功能名称** | 用户登录 |
| **功能描述** | 业务员通过手机号/用户名+密码登录系统 |
| **输入项** | 用户名/手机号、密码、验证码（可选） |
| **输出项** | Token、refreshToken、用户信息、过期时间 |
| **业务规则** | 1. 登录成功后存储 Token 到本地<br>2. Token 过期后自动使用 refreshToken 刷新<br>3. 登录失败显示错误提示 |
| **异常处理** | 401 未授权 → 清除登录态 → 跳转登录页 |

**接口：**
- `POST /m/login` - 登录
- `POST /auth/refresh` - Token 刷新
- `POST /auth/logout` - 登出
- `GET /auth/user/info` - 获取用户信息
- `POST /auth/sms/send` - 发送短信验证码

#### 5.1.2 登录状态管理

- Token 存储于 localStorage（跨会话持久化）
- 支持 Token 过期检测
- HTTP 请求自动携带 `M-Authorization: Bearer <token>` 请求头
- 401 响应统一触发登出流程

---

### 5.2 首页（工作台）

#### 5.2.1 工作台首页

| 项目 | 内容 |
|------|------|
| **功能名称** | 业务工作台 |
| **功能描述** | 展示业务快捷入口、待办事项、数据概览 |
| **页面路径** | `pages/business/workbench` |
| **核心内容** | 1. 快捷操作入口（新增进件、客户认证等）<br>2. 待处理任务提醒<br>3. 业务数据概览卡片 |

---

### 5.3 客户管理

#### 5.3.1 客户身份认证

| 项目 | 内容 |
|------|------|
| **功能名称** | 身份证信息录入与认证 |
| **功能描述** | 录入客户身份证信息，支持 OCR 自动识别 |
| **页面路径** | `pages/business/idInfo` |
| **输入项** | 姓名、性别、身份证号、身份证地址、有效期限、发证机关、民族 |
| **扩展信息** | 职业类型、居住状况、学历、婚姻状况、收入、供养子女数 |
| **OCR 功能** | 上传身份证正反面照片，自动识别并填充字段 |
| **业务规则** | 1. 身份证号为唯一标识<br>2. 身份证照片必须上传正反面<br>3. 身份认证状态：1成功 2失败 3补齐资料 其他未认证 |

**接口：**
- `POST /m/user/addOrUpdateIdCardInfo` - 保存身份证信息
- `POST /m/user/getIdCardInfo` - 获取身份证信息
- `POST /m/user/getIdCardOcr` - 身份证 OCR 识别

#### 5.3.2 联系人管理

| 项目 | 内容 |
|------|------|
| **功能名称** | 紧急联系人管理 |
| **功能描述** | 管理客户的亲属联系人及其他联系人 |
| **联系人类型** | 1：共借人；2：配偶；3：配偶且共借人；4：担保人 |
| **关系类型** | 1配偶 2父母 3子女 4朋友 5兄弟姐妹 6亲戚 7同事 8其他 |
| **输入项** | 联系人姓名、联系方式、身份证号、与客户关系 |

**接口：**
- `POST /m/user/addOrUpdateContact` - 添加/更新联系人
- `GET /m/user/getContacts` - 获取联系人列表
- `DELETE /m/user/deleteContact/{id}` - 删除联系人

#### 5.3.3 客户基础信息

| 项目 | 内容 |
|------|------|
| **功能名称** | 客户基础信息维护 |
| **功能描述** | 维护客户的完整基础档案 |
| **页面路径** | `pages/business/idInfoSupplement` |
| **信息项** | 公司单位名称、公司电话、公司地址、居住地址、常驻地址 |

**接口：**
- `POST /m/user/addOrUpdateUserBasic` - 保存用户基础信息
- `GET /m/user/getUserBasic` - 获取用户基础信息
- `GET /m/user/getUserList` - 获取用户列表

---

### 5.4 车辆管理

#### 5.4.1 车辆信息录入

| 项目 | 内容 |
|------|------|
| **功能名称** | 车辆信息录入 |
| **功能描述** | 录入客户贷款车辆信息 |
| **页面路径** | `pages/business/carInfo` |
| **输入项** | VIN 码、车型、车牌号、行驶里程、购车价格、车辆照片等 |
| **OCR 功能** | 上传车辆证件，自动识别车辆信息 |
| **车型查询** | 通过 VIN 码查询车型详细信息（对接第三方车辆数据服务） |

**接口：**
- `POST /m/vehicle/addOrUpdateVehicle` - 保存车辆信息
- `GET /m/vehicle/getVehicleInfo` - 获取车辆信息
- `POST /m/vehicle/getVehicleOcr` - 车辆 OCR 识别
- `POST /m/vehicleModel/requestVehicleModel` - VIN 查车型
- `GET /m/vehicle300/getByVin` - 第三方车辆数据查询

#### 5.4.2 车辆信息补全

| 项目 | 内容 |
|------|------|
| **功能名称** | 车辆信息补充 |
| **功能描述** | 对已有车辆信息进行补充完善 |
| **页面路径** | `pages/business/carInfoSupplement` |

---

### 5.5 进件管理

#### 5.5.1 贷款申请

| 项目 | 内容 |
|------|------|
| **功能名称** | 贷款进件申请 |
| **功能描述** | 提交客户贷款申请，包含客户信息、车辆信息、贷款方案 |
| **页面路径** | `pages/business/applyInfo` → `pages/business/applySubmit` |
| **前置条件** | 客户身份已认证、车辆信息已录入 |
| **输入项** | 贷款金额、贷款期限、还款方式、产品选择 |
| **业务流程** | 1. 选择客户 → 2. 确认车辆 → 3. 选择产品 → 4. 填写申请信息 → 5. 提交申请 |

**接口：**
- `POST /m/credit/apply` - 提交贷款申请
- `GET /m/product/getProductList` - 获取产品列表

#### 5.5.2 申请信息页

| 项目 | 内容 |
|------|------|
| **功能名称** | 申请信息填写 |
| **功能描述** | 填写贷款申请的详细信息 |
| **页面路径** | `pages/business/applyInfo` |

#### 5.5.3 申请提交结果

| 项目 | 内容 |
|------|------|
| **功能名称** | 申请提交结果 |
| **功能描述** | 展示申请提交后的结果状态 |
| **页面路径** | `pages/business/applyResult` |
| **状态** | 提交成功 / 提交失败 / 待补充资料 |

#### 5.5.4 进件列表

| 项目 | 内容 |
|------|------|
| **功能名称** | 进件列表查询 |
| **功能描述** | 查看所有已提交的进件申请 |
| **页面路径** | `pages/business/entryList`、`pages/business/applyListPage` |
| **筛选条件** | 时间范围、状态、客户姓名 |
| **列表字段** | 客户姓名、申请金额、提交时间、审批状态 |

**接口：**
- `GET /m/credit/getCreditList` - 获取授信列表
- `GET /m/credit/getCreditDetail/{id}` - 获取授信详情

#### 5.5.5 资料补全

| 项目 | 内容 |
|------|------|
| **功能名称** | 申请资料补全 |
| **功能描述** | 审批不通过或资料不全时，补充所需材料 |
| **页面路径** | `pages/business/supplementList`、`pages/business/supplementDetail` |
| **触发条件** | 审批状态为"需补件" |

**接口：**
- `GET /m/credit/getSupplementList` - 获取补件列表

---

### 5.6 审批管理

#### 5.6.1 审批列表

| 项目 | 内容 |
|------|------|
| **功能名称** | 审批状态查询 |
| **功能描述** | 查看所有进件的审批状态 |
| **页面路径** | `pages/business/approvalList` |
| **审批状态** | 1：待审批；2：审批通过；3：审批不通过；4：其他 |
| **列表字段** | 客户姓名、申请金额、提交时间、审批状态、审批备注 |

#### 5.6.2 申请详情

| 项目 | 内容 |
|------|------|
| **功能名称** | 申请详情查看 |
| **功能描述** | 查看单笔申请的完整信息 |
| **页面路径** | `pages/business/applyDetail` |
| **展示内容** | 客户信息、车辆信息、申请信息、审批记录、文件列表 |

---

### 5.7 签约管理

#### 5.7.1 面签列表

| 项目 | 内容 |
|------|------|
| **功能名称** | 面签任务列表 |
| **功能描述** | 查看待面签和已面签的任务 |
| **页面路径** | `pages/business/faceSignList` |
| **状态** | 待面签 / 面签中 / 面签完成 / 面签失败 |

#### 5.7.2 视频面签

| 项目 | 内容 |
|------|------|
| **功能名称** | 视频面签 |
| **功能描述** | 通过视频方式完成远程面签 |
| **页面路径** | `pages/business/videoFaceSign` |
| **业务流程** | 1. 发起面签 → 2. 视频通话 → 3. 身份核验 → 4. 签署确认 |

**接口：**
- `POST /m/signing/face/start` - 发起视频面签
- `GET /m/signing/face/detail/{flowId}` - 获取面签详情

#### 5.7.3 合同签署

| 项目 | 内容 |
|------|------|
| **功能名称** | 电子合同签署 |
| **功能描述** | 在线签署贷款合同 |
| **页面路径** | `pages/business/authSign` |
| **业务流程** | 1. 查看合同 → 2. 身份验证 → 3. 电子签名 → 4. 签署完成 |

**接口：**
- `POST /m/signing/contract/start` - 发起合同签署
- `GET /m/signing/contract/detail/{flowId}` - 获取合同详情

#### 5.7.4 签署结果

| 项目 | 内容 |
|------|------|
| **功能名称** | 签署结果展示 |
| **功能描述** | 展示面签/合同签署的结果 |
| **页面路径** | `pages/business/faceSignResult` |

---

### 5.8 订单管理

#### 5.8.1 订单列表

| 项目 | 内容 |
|------|------|
| **功能名称** | 订单列表 |
| **功能描述** | 查看所有业务订单 |
| **页面路径** | `pages/business/orderList` |
| **TabBar** | 是（底部导航第二项） |
| **筛选条件** | 时间范围、订单状态、客户姓名 |
| **列表字段** | 订单号、客户姓名、贷款金额、订单状态、创建时间 |

#### 5.8.2 订单信息补全

| 项目 | 内容 |
|------|------|
| **功能名称** | 订单信息补充 |
| **功能描述** | 对已有订单进行信息补充 |
| **页面路径** | `pages/business/orderInfoSupplement` |

---

### 5.9 线索管理

#### 5.9.1 线索列表

| 项目 | 内容 |
|------|------|
| **功能名称** | 客户线索列表 |
| **功能描述** | 管理潜在客户线索 |
| **页面路径** | `pages/business/leadList` |
| **列表字段** | 客户姓名、手机号、意向车型、跟进状态、创建时间 |

#### 5.9.2 线索录入

| 项目 | 内容 |
|------|------|
| **功能名称** | 新增线索 |
| **功能描述** | 录入新的客户线索 |
| **页面路径** | `pages/business/leadAdd` |
| **输入项** | 客户姓名、手机号、意向车型、预算、备注 |

---

### 5.10 文件管理

#### 5.10.1 文件上传

| 项目 | 内容 |
|------|------|
| **功能名称** | 文件上传 |
| **功能描述** | 上传业务相关文件（身份证、车辆证件、合同等） |
| **上传类型** | 图片（身份证、车辆照片）、PDF（合同） |
| **大小限制** | 10MB |
| **上传接口** | `POST /m/file/upload` |

#### 5.10.2 文件列表

| 项目 | 内容 |
|------|------|
| **功能名称** | 文件管理 |
| **功能描述** | 查看和管理已上传的文件 |
| **页面路径** | `pages/business/fileManage` |
| **功能** | 查看、删除、按类型筛选 |

**接口：**
- `GET /m/file/getFileList` - 获取文件列表
- `GET /m/file/getFileListByType` - 按类型获取文件列表
- `DELETE /m/file/deleteFile/{id}` - 删除文件

---

### 5.11 个人中心

#### 5.11.1 我的页面

| 项目 | 内容 |
|------|------|
| **功能名称** | 个人中心 |
| **功能描述** | 展示用户信息和功能入口 |
| **页面路径** | `pages/my/my` |
| **TabBar** | 是（底部导航第三项） |
| **内容** | 头像、用户名、组织信息、功能菜单 |

#### 5.11.2 设置

| 项目 | 内容 |
|------|------|
| **功能名称** | 系统设置 |
| **功能描述** | 应用相关设置 |
| **页面路径** | `pages/my/settings` |
| **功能项** | 语言切换、清除缓存、关于我们、退出登录 |

#### 5.11.3 其他页面

| 页面 | 路径 | 说明 |
|------|------|------|
| 关于我们 | `pages/my/about-me` | 应用信息、版本号 |
| 常见问题 | `pages/my/faq` | FAQ 列表 |
| 隐私协议 | `pages/my/privacy` | 隐私政策说明 |
| 用户协议 | `pages/my/agreement` | 用户服务协议 |

---

## 6. 非功能需求

### 6.1 性能需求

| 指标 | 要求 |
|------|------|
| 页面首屏加载时间 | <= 2s（3G 网络） |
| API 响应时间 | <= 3s |
| 图片加载 | 支持懒加载，占位图过渡 |
| 列表滚动 | 支持虚拟滚动，单次加载 20 条 |

### 6.2 兼容性需求

| 平台 | 最低版本要求 |
|------|-------------|
| 微信 | 基础库 2.19.0+ |
| Android | 5.0+ |
| iOS | 11.0+ |
| 鸿蒙 | HarmonyOS 2.0+ |
| H5 | Chrome 80+ / Safari 13+ |

### 6.3 安全需求

1. **数据传输** - 生产环境全站 HTTPS
2. **身份认证** - JWT Token + RefreshToken 双令牌机制
3. **敏感信息** - 身份证号、手机号脱敏展示
4. **文件安全** - 上传文件类型校验、大小限制
5. **本地存储** - Token 加密存储

### 6.4 用户体验

1. **Loading 状态** - 请求自动显示 Loading，避免重复提交
2. **错误提示** - 统一错误提示，包含错误码和友好文案
3. **空状态** - 列表为空时展示空状态插图
4. **网络异常** - 弱网/断网提示，支持重试
5. **暗黑模式** - 支持跟随系统/手动切换暗黑模式

### 6.5 国际化

- 支持简体中文、英文两种语言
- 通过 vue-i18n 实现
- 语言切换实时生效

---

## 7. 数据模型

### 7.1 用户模型

```typescript
interface UserInfo {
  id?: number;           // 用户ID/业务员ID
  userName?: string;     // 用户名
  phone?: string;        // 手机号
  orgId?: number;        // 组织ID
  orgName?: string;      // 组织名称
  pid?: number;          // 上级ID
  type?: number;         // 用户类型
  status?: number;       // 状态
  leaderName?: string;   // 上级负责人
  remark?: string;       // 备注
  createBy?: string;     // 创建人
  createTime?: string;   // 创建时间
  updateBy?: string;     // 更新人
  updateTime?: string;   // 更新时间
}
```

### 7.2 客户身份证信息

```typescript
interface IdCardInfo {
  id?: number;                    // 主键
  uuid?: string;                  // 客户唯一编码
  salesmanId?: number;            // 业务员ID
  telephone?: string;             // 手机号码
  idcardFront?: string;           // 身份证正面照片URL
  idcardBack?: string;            // 身份证反面照片URL
  personName?: string;            // 姓名
  gender?: number;                // 性别 1男 2女
  age?: number;                   // 年龄
  personIdcard?: string;          // 身份证号码
  personAddress?: string;         // 身份证地址
  personValidDateStart?: string;  // 有效起始日期
  personValidDateEnd?: string;    // 有效结束日期
  personValid?: number;           // 认证状态
  personIssuingAuthority?: string;// 发证机关
  personOccupation?: string;      // 职业类型
  dwellingCondition?: string;     // 居住状况
  degree?: string;                // 学位
  education?: string;             // 学历
  marriage?: string;              // 婚姻状况
  personIncome?: number;          // 收入（分）
  race?: string;                  // 民族
  isContract?: number;            // 是否签约
  workingName?: string;           // 工作单位
  workingTelephone?: string;      // 公司电话
  workingAddress?: string;        // 公司地址
  liveAddress?: string;           // 居住地址
  permanentAddress?: string;      // 常驻地址
  childrenNum?: number;           // 供养子女数
}
```

### 7.3 联系人信息

```typescript
interface ContactInfo {
  id?: number;                    // 主键
  userUuid: string;               // 客户唯一编码
  contactType?: number;           // 类型 1共借人 2配偶 3配偶且共借人 4担保人
  contactName?: string;           // 姓名
  contactTelephone?: string;      // 电话
  contactIdcard?: string;         // 身份证号
  contactRelationship?: number;   // 关系 1配偶 2父母 3子女 4朋友 5兄弟姐妹 6亲戚 7同事 8其他
}
```

### 7.4 车辆信息

```typescript
interface VehicleInfo {
  id?: number;            // 主键
  uuid?: string;          // 客户编码
  vin?: string;           // VIN码
  brand?: string;         // 品牌
  model?: string;         // 车型
  plateNumber?: string;   // 车牌号
  mileage?: number;       // 行驶里程
  price?: number;         // 购车价格
  // ... 其他车辆字段
}
```

---

## 8. 接口规范

### 8.1 统一响应格式

```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {}
}
```

### 8.2 HTTP 状态码

| 状态码 | 含义 | 处理 |
|--------|------|------|
| 200 | 请求成功 | 正常处理 |
| 401 | 未授权 | 清除登录态，跳转登录页 |
| 403 | 禁止访问 | 提示权限不足 |
| 404 | 资源不存在 | 提示资源不存在 |
| 500 | 服务器错误 | 提示系统繁忙 |

### 8.3 业务状态码

| 状态码 | 含义 |
|--------|------|
| 200 | 成功 |
| 401 | Token 失效/未登录 |
| 其他 | 按具体业务定义 |

### 8.4 接口清单

#### 认证模块

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /m/login | 登录 |
| POST | /auth/logout | 登出 |
| POST | /auth/refresh | 刷新 Token |
| GET | /auth/user/info | 获取用户信息 |
| POST | /auth/sms/send | 发送验证码 |

#### 用户模块

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /m/user/addOrUpdateUserBasic | 保存用户基础信息 |
| POST | /m/user/addOrUpdateIdCardInfo | 保存身份证信息 |
| POST | /m/user/getIdCardInfo | 获取身份证信息 |
| POST | /m/user/addOrUpdateContact | 保存联系人 |
| GET | /m/user/getContacts | 获取联系人列表 |
| DELETE | /m/user/deleteContact/{id} | 删除联系人 |
| GET | /m/user/getUserBasic | 获取用户基础信息 |
| GET | /m/user/getUserList | 获取用户列表 |
| POST | /m/user/getIdCardOcr | 身份证 OCR |

#### 车辆模块

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /m/vehicle/addOrUpdateVehicle | 保存车辆信息 |
| GET | /m/vehicle/getVehicleInfo | 获取车辆信息 |
| POST | /m/vehicle/getVehicleOcr | 车辆 OCR |
| POST | /m/vehicleModel/requestVehicleModel | VIN 查车型 |
| GET | /m/vehicle300/getByVin | 第三方车辆数据 |

#### 文件模块

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /m/file/upload | 文件上传 |
| GET | /m/file/getFileList | 获取文件列表 |
| GET | /m/file/getFileListByType | 按类型获取文件 |
| DELETE | /m/file/deleteFile/{id} | 删除文件 |

#### 授信/进件模块

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /m/credit/getCreditList | 授信列表 |
| GET | /m/credit/getSupplementList | 补件列表 |
| GET | /m/credit/getCreditDetail/{id} | 授信详情 |
| POST | /m/credit/apply | 提交申请 |
| GET | /m/product/getProductList | 产品列表 |

#### 签约模块

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /m/signing/face/start | 发起视频面签 |
| POST | /m/signing/contract/start | 发起合同签署 |
| GET | /m/signing/face/detail/{flowId} | 面签详情 |
| GET | /m/signing/contract/detail/{flowId} | 合同详情 |

#### 字典模块

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /m/dict/data/type/{dictType} | 获取字典数据 |

---

## 9. 页面清单

### 9.1 页面汇总

| 序号 | 页面名称 | 页面路径 | 类型 | TabBar |
|------|----------|----------|------|--------|
| 1 | 工作台 | pages/business/workbench | 业务 | 是 |
| 2 | 登录 | pages/auth/login | 认证 | 否 |
| 3 | 身份证信息 | pages/business/idInfo | 业务 | 否 |
| 4 | 车辆信息 | pages/business/carInfo | 业务 | 否 |
| 5 | 申请信息 | pages/business/applyInfo | 业务 | 否 |
| 6 | 申请结果 | pages/business/applyResult | 业务 | 否 |
| 7 | 身份证补全 | pages/business/idInfoSupplement | 业务 | 否 |
| 8 | 车辆补全 | pages/business/carInfoSupplement | 业务 | 否 |
| 9 | 新增线索 | pages/business/leadAdd | 业务 | 否 |
| 10 | 线索列表 | pages/business/leadList | 业务 | 否 |
| 11 | 进件列表 | pages/business/entryList | 业务 | 否 |
| 12 | 申请提交 | pages/business/applySubmit | 业务 | 否 |
| 13 | 审批列表 | pages/business/approvalList | 业务 | 否 |
| 14 | 面签列表 | pages/business/faceSignList | 业务 | 否 |
| 15 | 视频面签 | pages/business/videoFaceSign | 业务 | 否 |
| 16 | 面签结果 | pages/business/faceSignResult | 业务 | 否 |
| 17 | 合同签署 | pages/business/authSign | 业务 | 否 |
| 18 | 订单补全 | pages/business/orderInfoSupplement | 业务 | 否 |
| 19 | 文件补全 | pages/business/fileInfoSupplement | 业务 | 否 |
| 20 | 订单列表 | pages/business/orderList | 业务 | 是 |
| 21 | 文件管理 | pages/business/fileManage | 业务 | 否 |
| 22 | 申请列表页 | pages/business/applyListPage | 业务 | 否 |
| 23 | 补件列表 | pages/business/supplementList | 业务 | 否 |
| 24 | 补件详情 | pages/business/supplementDetail | 业务 | 否 |
| 25 | 申请详情 | pages/business/applyDetail | 业务 | 否 |
| 26 | 个人中心 | pages/my/my | 个人 | 是 |
| 27 | 关于我们 | pages/my/about-me | 个人 | 否 |
| 28 | 常见问题 | pages/my/faq | 个人 | 否 |
| 29 | 设置 | pages/my/settings | 个人 | 否 |
| 30 | 隐私协议 | pages/my/privacy | 个人 | 否 |
| 31 | 用户协议 | pages/my/agreement | 个人 | 否 |
| 32 | 首页演示 | pages/home/home | 演示 | 否 |
| 33 | uView 介绍 | pages/home/uview-intro | 演示 | 否 |
| 34 | HTTP 演示 | pages/home/http-demo | 演示 | 否 |
| 35 | Pinia 演示 | pages/home/pinia-demo | 演示 | 否 |
| 36 | 组件演示 | pages/home/components-demo | 演示 | 否 |

### 9.2 全局样式

```json
{
  "navigationBarTitleText": "嗨车无忧",
  "navigationStyle": "custom",
  "navigationBarBackgroundColor": "#000000"
}
```

---

## 10. 状态管理

### 10.1 Store 设计

| Store | 用途 | 持久化 | 存储方式 |
|-------|------|--------|----------|
| local | Token、refreshToken、userInfo | 是 | localStorage |
| session | Token、userInfo、orderInfo | 是 | sessionStorage |
| tabbar | TabBar 激活索引、徽标 | 是 | localStorage |
| counter | 示例计数器 | 否 | 内存 |

### 10.2 认证数据流

```
登录页 → 调用 login API → 存储 Token/用户信息 → 跳转工作台
   ↑                                              |
   └──────── 401 响应 ──→ 清除登录态 ──────────────┘
```

### 10.3 HTTP 拦截器逻辑

**请求拦截：**
1. 根据 meta.loading 显示/隐藏 Loading
2. 从 localStore 读取 token
3. 注入 `M-Authorization: Bearer <token>` 请求头

**响应拦截：**
1. 关闭 Loading
2. HTTP 状态码非 200 → 统一错误提示
3. 业务状态码非 200 → 统一错误提示
4. 401 状态 → 调用 logout → 跳转登录页
5. 成功 → 返回 response.data

---

## 11. 附录

### 11.1 环境配置

| 环境 | 配置文件 | API 基础地址 |
|------|----------|-------------|
| 开发 | .env.development | http://122.51.140.89:10088 |
| SIT | .env.sit | http://122.51.140.89:10088 |
| 生产 | .env.production | https://api.example.com |

### 11.2 构建命令

```bash
# 开发
pnpm dev:h5           # H5 开发
pnpm dev:mp-weixin    # 微信小程序开发
pnpm dev:app-android  # Android App 开发

# 构建
pnpm build:h5         # H5 生产构建
pnpm build:mp-weixin  # 微信小程序生产构建

# 质量检查
pnpm type-check       # TypeScript 类型检查
pnpm lint             # ESLint 检查
```

### 11.3 第三方服务

| 服务 | 用途 | 接口 |
|------|------|------|
| 身份证 OCR | 识别身份证信息 | /m/user/getIdCardOcr |
| 车辆 OCR | 识别车辆证件 | /m/vehicle/getVehicleOcr |
| 车型查询 | VIN 查车型 | /m/vehicleModel/requestVehicleModel |
| 车辆数据 | 第三方车辆信息 | /m/vehicle300/getByVin |

### 11.4 术语表

| 术语 | 说明 |
|------|------|
| 进件 | 贷款申请提交 |
| 面签 | 面对面/视频签约确认 |
| 授信 | 信用评估与额度审批 |
| 补件 | 补充申请材料 |
| VIN | 车辆识别代号（车架号） |
| OCR | 光学字符识别 |
| SIT | 系统集成测试环境 |

---

> 文档结束
