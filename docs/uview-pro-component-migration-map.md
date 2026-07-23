# saas-mobile 现有页面可替换为 uView Pro 组件映射建议

> 基于 `saas-mobile/src/pages`、`src/components` 静态扫描生成，按“收益高 / 风险低”优先排序。
> 替换原则：不破坏现有业务逻辑，优先替换通用表现层组件，复杂业务组件保留自定义实现。

## 一、总体替换优先级

| 优先级 | 类型 | 说明 |
|------|------|------|
| P0 | 高收益低风险 | 按钮、图标、图片、加载、提示、空态、分割线、标签、步骤条等通用组件 |
| P1 | 中收益中风险 | 表单输入、开关、单选、复选、选择器、上传、搜索、倒计时、评分等交互组件 |
| P2 | 有收益需评估 | 轮播、宫格、日历、时间轴、索引列表、返回顶部等样式/交互较重组件 |
| P3 | 低收益高风险 | 列表卡片、业务弹窗、签名流程、GPS预约、面签结果等强业务耦合组件 |

## 二、按模块映射建议

### 2.1 车贷模块（carloan）

#### 2.1.1 工作台与首页
| 页面 | 当前实现 | 建议替换为 uView Pro | 替换收益 | 优先级 |
|------|---------|---------------------|---------|--------|
| `carloan/workbench` | 自定义宫格 + 图标 + 卡片 | `u-icon` + `u-grid` + `u-card` | 统一图标体系，减少自定义布局代码 | P0 |
| `home/home` | 原生 view + 图标 + 宫格 | `u-icon` + `u-grid` + `u-notice-bar` | 快速统一首页视觉 | P0 |

#### 2.1.2 进件与资料
| 页面 | 当前实现 | 建议替换为 uView Pro | 替换收益 | 优先级 |
|------|---------|---------------------|---------|--------|
| `precheck/applyInfo` | 自定义表单项 | `u-form` + `u-form-item` + `u-input` / `u-picker` | 表单校验/布局统一 | P1 |
| `precheck/carInfo` | 自定义输入 + 上传 | `u-input` + `u-upload` + `u-button` | 上传组件自带预览/裁剪能力 | P1 |
| `precheck/idInfo` | 自定义表单 | `u-form` + `u-input` + `u-upload` | 身份证上传体验一致 | P1 |
| `precheck/entryDetail` | 自定义详情卡片 | `u-cell` + `u-cell-group` + `u-divider` | 详情页样式快速统一 | P0 |
| `precheck/applyProgress` | 自定义步骤条 | `u-steps` + `u-icon` | 流程节点展示标准化 | P0 |
| `supplement/fileInfoSupplement` | 自定义上传 | `u-upload` + `u-button` | 上传交互统一 | P1 |
| `supplement/fileManage` | 自定义 ActionSheet + 搜索 | `u-action-sheet` + `u-search` | 操作菜单和搜索统一 | P1 |

#### 2.1.3 审批与签章
| 页面 | 当前实现 | 建议替换为 uView Pro | 替换收益 | 优先级 |
|------|---------|---------------------|---------|--------|
| `approval/pawnApprovalList` | 自定义列表 + 搜索 | `u-search` + `u-list` + `u-tag` | 列表页交互统一 | P1 |
| `signing/signCenter` | 自定义步骤 + 卡片 | `u-steps` + `u-card` + `u-button` | 签章流程更清晰 | P0 |
| `signing/faceSignResult` | 自定义结果页 | `u-icon` + `u-card` + `u-button` | 成功/失败状态统一 | P0 |

#### 2.1.4 贷后与订单
| 页面 | 当前实现 | 建议替换为 uView Pro | 替换收益 | 优先级 |
|------|---------|---------------------|---------|--------|
| `postloan/repaymentPlan` | 自定义卡片 + 输入 | `u-card` + `u-cell` + `u-input` | 还款计划展示统一 | P0 |
| `order-list/orderList` | 自定义列表 + 空态 | `u-empty` + `u-tag` + `u-card` | 订单状态展示统一 | P0 |

### 2.2 美食模块（food）
| 页面 | 当前实现 | 建议替换为 uView Pro | 替换收益 | 优先级 |
|------|---------|---------------------|---------|--------|
| `food/index/index` | 自定义宫格 + 搜索 | `u-search` + `u-grid` + `u-card` | 美食首页快速标准化 | P0 |
| `food/goods/list` | 自定义列表 + 图片 | `u-image` + `u-card` + `u-tag` | 商品卡片统一 | P0 |
| `food/order/cart` | 自定义开关 + 步进器 | `u-switch` + `u-number-box` + `u-subsection` | 购物车交互统一 | P1 |

### 2.3 阅读模块（reading）
| 页面 | 当前实现 | 建议替换为 uView Pro | 替换收益 | 优先级 |
|------|---------|---------------------|---------|--------|
| `reading/index/index` | 原生图标 + 倒计时 | `u-icon` + `u-count-down` + `u-swiper` | 阅读首页轻量化 | P0 |
| `reading/store/detail` | 自定义展开阅读 | `u-read-more` + `u-image` | 长文本展示标准化 | P0 |
| `reading/download/list` | 自定义列表 + 进度 | `u-line-progress` + `u-cell` | 下载列表状态统一 | P0 |

### 2.4 命理模块（mingli）
| 页面 | 当前实现 | 建议替换为 uView Pro | 替换收益 | 优先级 |
|------|---------|---------------------|---------|--------|
| `mingli/bazi/input` | 自定义输入 + 滑动 | `u-input` + `u-slider` + `u-switch` | 表单交互统一 | P1 |
| `mingli/history` | 自定义时间轴 | `u-time-line` + `u-cell` | 历史记录展示标准化 | P0 |
| `mingli/index` | 原生单选 + 图标 | `u-radio` + `u-icon` + `u-button` | 测算首页交互统一 | P1 |

### 2.5 信用模块（credit）
| 页面 | 当前实现 | 建议替换为 uView Pro | 替换收益 | 优先级 |
|------|---------|---------------------|---------|--------|
| `credit/index/index` | 原生轮播 + 倒计时 | `u-swiper` + `u-count-down` + `u-notice-bar` | 信用首页快速标准化 | P0 |
| `credit/query/result` | 自定义滑块 + 开关 | `u-slider` + `u-switch` + `u-rate` | 查询结果页交互统一 | P1 |

### 2.6 公共页面
| 页面 | 当前实现 | 建议替换为 uView Pro | 替换收益 | 优先级 |
|------|---------|---------------------|---------|--------|
| `auth/login` | 原生 input + 倒计时 | `u-input` + `u-count-down` + `u-button` + `u-checkbox` | 登录页体验统一 | P0 |
| `auth/transfer` | 原生表单 | `u-form` + `u-input` + `u-button` | 表单校验统一 | P1 |
| `my/my` | 原生列表 + 开关 | `u-cell` + `u-switch` + `u-icon` | 个人中心标准化 | P0 |
| `my/settings` | 原生开关列表 | `u-cell` + `u-switch` | 设置页统一 | P0 |
| `index/index` | 原生宫格 + 轮播 | `u-grid` + `u-swiper` + `u-notice-bar` | 门户首页快速统一 | P0 |

## 三、高频通用组件映射速查

| 当前实现特征 | 建议替换为 uView Pro | 适用场景 |
|-------------|---------------------|---------|
| `<button>` / `.btn` | `u-button` | 所有页面按钮 |
| 原生 `<input>` / `<textarea>` | `u-input` / `u-field` | 登录、表单、资料填写 |
| 原生 `<image>` | `u-image` | 商品图、头像、证件照 |
| `<icon>` / `.iconfont` | `u-icon` | 所有图标位 |
| 自定义 loading 动画 | `u-loading` / `u-loading-popup` | 加载状态 |
| 自定义 toast | `u-toast` | 成功/失败提示 |
| 自定义 modal / popup | `u-modal` / `u-popup` | 确认框、底部弹出层 |
| 原生 `<switch>` | `u-switch` | 设置、筛选 |
| 原生 checkbox | `u-checkbox` / `u-checkbox-group` | 协议同意、多选 |
| 原生 radio | `u-radio` / `u-radio-group` | 单选场景 |
| 自定义 tabs | `u-tabs` / `u-subsection` | 标签切换 |
| 自定义 steps | `u-steps` | 流程进度 |
| 自定义 swiper | `u-swiper` | 轮播图 |
| 自定义 grid | `u-grid` / `u-grid-item` | 宫格导航 |
| 原生 picker | `u-picker` / `u-select` | 选择器 |
| 原生 upload | `u-upload` | 图片/文件上传 |
| 原生 search | `u-search` | 搜索栏 |
| 自定义 empty | `u-empty` | 空数据态 |
| 自定义 divider | `u-divider` | 分割线 |
| 原生 countdown | `u-count-down` | 验证码倒计时 |
| 自定义 skeleton | `u-skeleton` | 骨架屏 |
| 自定义 back-top | `u-back-top` | 返回顶部 |
| 自定义 action-sheet | `u-action-sheet` | 底部操作菜单 |
| 自定义 notice | `u-notice-bar` | 滚动通知 |
| 自定义 read-more | `u-read-more` | 展开阅读 |
| 自定义 rate | `u-rate` | 评分 |
| 自定义 timeline | `u-time-line` | 时间轴 |
| 自定义 calendar | `u-calendar` | 日期选择 |

## 四、不建议贸然替换的部分

| 组件/页面 | 原因 |
|---------|------|
| `FileCard` | 强业务组件，包含文件类型/审核状态/预览逻辑 |
| `FlowRecordPopup` | 业务弹窗，流程记录展示与业务数据绑定 |
| `OrderCard` | 订单卡片，字段和状态机与业务强相关 |
| `ListCard` / `ListPage` | 基础列表容器，但内部可能封装了业务分页/筛选逻辑 |
| 签章类页面（`signMortgage`、`signBindCard`、`videoFaceSign`） | 交互复杂，涉及人脸/银行卡/GPS预约，建议保留自定义实现 |
| 征信查询结果页 | 滑块和动态结果展示较特殊，建议先评估再替换 |

## 五、建议落地顺序

1. **第一轮（P0）**：统一按钮、图标、图片、加载、空态、分割线、标签、步骤条，见效最快。
2. **第二轮（P1）**：统一表单输入、选择器、上传、搜索、开关、倒计时，提升交互一致性。
3. **第三轮（P2/P3）**：对轮播、日历、时间轴、业务卡片做逐个页面评估后替换。
