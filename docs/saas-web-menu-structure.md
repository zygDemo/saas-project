# saas-web 菜单结构文档

> 更新时间：2026/6/18
> 基于 `saas-web/src/router/modules/` 下各模块路由配置整理

---

## 一、静态路由（无需权限，不在侧边栏显示）

| 路由 | 说明 |
|------|------|
| `/auth/login` | 登录页 |
| `/auth/register` | 注册页 |
| `/auth/forget-password` | 忘记密码 |
| `/403` | 无权限页 |
| `/404` | 页面未找到 |
| `/500` | 服务器错误 |
| `/outside/iframe/:path` | iframe 内嵌页面 |

---

## 二、动态菜单路由（需登录 + 权限）

### 1. 📊 仪表盘 (`/dashboard`)

- **权限**：`R_SUPER`, `R_ADMIN`
- **图标**：`ri:pie-chart-line`

| 子菜单 | 路径 | 图标 | 说明 |
|--------|------|------|------|
| 控制台 | `console` | `ri:home-smile-2-line` | 固定标签页 |
| 分析页 | `analysis` | `ri:align-item-bottom-line` | |
| 电商数据 | `ecommerce` | `ri:bar-chart-box-line` | |

---

### 2. 💼 车贷业务 (`/business`)

- **权限**：`R_SUPER`, `R_ADMIN`, `R_SALES_MANAGER`, `R_SALES`, `R_APPROVER`, `R_FINANCE`, `R_CS_COLLECTION`
- **图标**：`ri:briefcase-4-line`
- **组件**：统一使用 `/business/common-list`，通过 `phaseCode` 区分阶段

| 子菜单 | 路径 | phaseCode | 角色限制 |
|--------|------|-----------|----------|
| 线索管理 | `lead` | 900 | 全部角色 |
| 预审阶段 | `pre-review` | 1000 | 全部角色 |
| 补件阶段 | `supplement` | 1400 | 全部角色 |
| 风控审批 | `approval` | 2000 | `R_SUPER`, `R_ADMIN`, `R_APPROVER` |
| 资方终审 | `funder-review` | 3000 | 全部角色 |
| 客户签约 | `signing` | 4000 | 全部角色 |
| 请款放款 | `disbursement` | 5000 | `R_SUPER`, `R_ADMIN`, `R_FINANCE`, `R_SALES_MANAGER` |
| 贷后阶段 | `post-loan` | 6000 | `R_SUPER`, `R_ADMIN`, `R_FINANCE`, `R_CS_COLLECTION`, `R_SALES_MANAGER` |
| 报表统计 | `reports` | 7000 | `R_SUPER`, `R_ADMIN`, `R_FINANCE`, `R_CS_COLLECTION`, `R_SALES_MANAGER` |

---

### 3. 🗄️ 基础数据 (`/base-data`)

- **权限**：`R_SUPER`, `R_ADMIN`, `R_SALES_MANAGER`, `R_SALES`, `R_APPROVER`, `R_FINANCE`
- **图标**：`ri:database-2-line`
- **组件**：统一使用 `/business/common-list`，通过 `businessModule` 区分模块

| 子菜单 | 路径 | businessModule | 角色限制 |
|--------|------|----------------|----------|
| 机构管理 | `org` | `org` | `R_SUPER`, `R_ADMIN` |
| 部门管理 | `dept` | `dept` | `R_SUPER`, `R_ADMIN` |
| 产品管理 | `product` | `product` | 全部角色 |
| 资方管理 | `funder` | `funder` | 全部角色 |
| 流程配置 | `flow-config` | `flow-config` | `R_SUPER`, `R_ADMIN` |

---

### 4. ⭐ 客户管理 (`/customer-mgmt`)

- **权限**：`R_SUPER`, `R_ADMIN`, `R_SALES_MANAGER`, `R_SALES`, `R_APPROVER`, `R_FINANCE`
- **图标**：`ri:user-star-line`
- **组件**：统一使用 `/business/common-list`，通过 `businessModule` 区分模块

| 子菜单 | 路径 | businessModule |
|--------|------|----------------|
| 线索管理 | `lead` | `lead` |
| 客户档案 | `customer` | `customer` |

---

### 5. 📈 数据中心 (`/data-center`)

- **权限**：`R_SUPER`, `R_ADMIN`
- **图标**：`ri:database-2-line`

| 子菜单 | 路径 | 图标 |
|--------|------|------|
| 数据统计 | `stats` | `ri:bar-chart-grouped-line` |
| 审计日志 | `audit-log` | `ri:file-shield-line` |

---

### 6. 📱 页面模板 (`/template`)

- **权限**：所有用户
- **图标**：`ri:apps-2-line`

| 子菜单 | 路径 | 图标 | 说明 |
|--------|------|------|------|
| 卡片 | `cards` | `ri:wallet-line` | |
| 横幅 | `banners` | `ri:rectangle-line` | |
| 图表 | `charts` | `ri:bar-chart-box-line` | |
| 地图 | `map` | `ri:map-pin-line` | |
| 聊天 | `chat` | `ri:message-3-line` | |
| 日历 | `calendar` | `ri:calendar-2-line` | |
| 价格 | `pricing` | `ri:money-cny-box-line` | 全屏页面 |

---

### 7. 🧩 组件 (`/widgets`)

- **权限**：所有用户
- **图标**：`ri:apps-2-add-line`

| 子菜单 | 路径 | 图标 | 标记 |
|--------|------|------|------|
| 图标 | `icon` | `ri:palette-line` | |
| 图片裁剪 | `image-crop` | `ri:screenshot-line` | |
| Excel | `excel` | `ri:download-2-line` | |
| 视频 | `video` | `ri:vidicon-line` | |
| 数字动画 | `count-to` | `ri:anthropic-line` | |
| 富文本编辑器 | `wang-editor` | `ri:t-box-line` | |
| 水印 | `watermark` | `ri:water-flash-line` | |
| 右键菜单 | `context-menu` | `ri:menu-2-line` | |
| 二维码 | `qrcode` | `ri:qr-code-line` | |
| 拖拽 | `drag` | `ri:drag-move-fill` | |
| 文字滚动 | `text-scroll` | `ri:input-method-line` | |
| 烟花特效 | `fireworks` | `ri:magic-line` | 🔥 Hot |
| Element UI | iframe 外链 | `ri:apps-2-line` | |

---

### 8. ✨ 示例 (`/examples`)

- **权限**：所有用户
- **图标**：`ri:sparkling-line`

| 子菜单 | 路径 | 图标 | 说明 |
|--------|------|------|------|
| ├ 权限 | (目录) | `ri:fingerprint-line` | |
| │ ├ 切换角色 | `permission/switch-role` | `ri:contacts-line` | |
| │ ├ 按钮权限 | `permission/button-auth` | `ri:mouse-line` | 含 8 个权限按钮 |
| │ └ 页面权限 | `permission/page-visibility` | `ri:user-3-line` | 仅 `R_SUPER` |
| 标签页 | `tabs` | `ri:price-tag-line` | |
| 基础表格 | `tables/basic` | `ri:layout-grid-line` | |
| 表格 | `tables` | `ri:table-3` | |
| 表单 | `forms` | `ri:table-view` | |
| 搜索栏 | `form/search-bar` | `ri:table-line` | |
| 树形表格 | `tables/tree` | `ri:layout-2-line` | |
| Socket 聊天 | `socket-chat` | `ri:shake-hands-line` | |

---

### 9. 👤 系统管理 (`/system`)

- **权限**：`R_SUPER`, `R_ADMIN`
- **图标**：`ri:user-3-line`

| 子菜单 | 路径 | 图标 | 角色限制 | 按钮权限 |
|--------|------|------|----------|----------|
| 用户管理 | `user` | `ri:user-line` | `R_SUPER`, `R_ADMIN` | |
| 角色管理 | `role` | `ri:user-settings-line` | `R_SUPER` | |
| 菜单管理 | `menu` | `ri:menu-line` | `R_SUPER` | 新增/编辑/删除 |
| 字典管理 | `dict` | `ri:book-open-line` | `R_SUPER`, `R_ADMIN` | |
| 文件管理 | `file` | `ri:file-list-3-line` | `R_SUPER`, `R_ADMIN` | |
| 文件存储配置 | `file-config` | `ri:hard-drive-2-line` | `R_SUPER`, `R_ADMIN` | |

---

### 10. 📝 文章管理 (`/article`)

- **权限**：`R_SUPER`, `R_ADMIN`
- **图标**：`ri:book-2-line`

| 子菜单 | 路径 | 图标 | 按钮权限 | 说明 |
|--------|------|------|----------|------|
| 文章列表 | `article-list` | `ri:article-line` | 新增/编辑 | |
| 文章详情 | `detail/:id` | — | | 隐藏菜单 |
| 评论管理 | `comment` | `ri:mail-line` | | |
| 发布文章 | `publish` | `ri:telegram-2-line` | 发布 | |

---

### 11. ✅ 结果 (`/result`)

- **权限**：所有用户
- **图标**：`ri:checkbox-circle-line`

| 子菜单 | 路径 | 图标 |
|--------|------|------|
| 成功 | `success` | `ri:checkbox-circle-line` |
| 失败 | `fail` | `ri:close-circle-line` |

---

### 12. ⚠️ 异常 (`/exception`)

- **权限**：所有用户
- **图标**：`ri:error-warning-line`

| 子菜单 | 路径 | 说明 |
|--------|------|------|
| 403 | `403` | 全屏页面 |
| 404 | `404` | 全屏页面 |
| 500 | `500` | 全屏页面 |

---

### 13. 🛡️ 保障 (`/safeguard`)

- **权限**：所有用户
- **图标**：`ri:shield-check-line`

| 子菜单 | 路径 | 图标 |
|--------|------|------|
| 服务器 | `server` | `ri:hard-drive-3-line` |

---

### 14. 📖 帮助（顶级菜单）

| 菜单 | 说明 | 类型 |
|------|------|------|
| 官方文档 | 外链 | 外部链接 |
| 精简版 | 外链 | 外部链接 |
| 旧版 | 外链 | 外部链接 |
| 更新日志 | `/change/log` | 内部页面，显示版本 Badge |

---

## 三、角色权限总览

| 角色 | 标识 | 可见菜单范围 |
|------|------|-------------|
| 超级管理员 | `R_SUPER` | **全部菜单** |
| 管理员 | `R_ADMIN` | 除"角色管理"和"菜单管理"外的大部分菜单 |
| 销售经理 | `R_SALES_MANAGER` | 车贷业务、基础数据、客户管理 |
| 销售 | `R_SALES` | 车贷业务(部分)、基础数据(部分)、客户管理 |
| 审批人 | `R_APPROVER` | 车贷业务(部分)、基础数据(部分)、客户管理 |
| 财务 | `R_FINANCE` | 车贷业务(部分)、基础数据(部分)、客户管理 |
| 催收 | `R_CS_COLLECTION` | 车贷业务(贷后/报表) |

---

## 四、备注

1. **动态菜单加载**：所有动态菜单通过 `asyncRoutes` 加载，后端接口 `/saas/api/v3/system/menus` 返回的菜单数据决定用户最终看到的菜单。
2. **统一业务组件**：`车贷业务`、`基础数据`、`客户管理` 三个模块的子页面均复用 `/business/common-list.vue` 组件，通过 `phaseCode` 或 `businessModule` 参数区分。
3. **按钮权限**：通过 `authList` 配置，使用 `v-auth` 指令控制按钮显示。
4. **预置账号**：

| 账号 | 密码 | 角色 |
|------|------|------|
| `Super` | `123456` | `R_SUPER` |
| `Admin` | `123456` | `R_ADMIN` |
| `User` | `123456` | `R_USER` |