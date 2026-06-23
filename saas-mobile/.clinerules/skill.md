---
name: skill
description: 三大元Skill集成指南 —— gstack（工程团队套件）、find-skills（发现技能）、skill-creator（创建技能）。当需要组建AI团队、发现新能力或自定义skill时使用本指南。覆盖从"找工具→用工具→造工具"的完整闭环。
---

# 🎯 元Skill三位一体

> 所有技能需求的起点：找现成 → 用现成 → 造专属

---

## 1️⃣ gstack —— AI工程团队套件

**定位**：一键配齐虚拟工程团队
**来源**：YC总裁Gary公开的工作流套件，23个子skill

### 核心角色Skill

| 角色     | Skill         | 用途                   |
| -------- | ------------- | ---------------------- |
| CEO      | `office`      | 评估产品想法、商业决策 |
| 设计师   | `design`      | UI/UX设计、视觉评审    |
| 安全官   | `security`    | 代码安全审计、漏洞扫描 |
| 工程师   | `investigate` | Bug修复、技术调研      |
| 产品经理 | `ship`        | 项目发布、版本管理     |
| ...      | ...           | 共23个角色             |

### 使用方式

```bash
# 安装完整套件
npm i -g gstack

# 调用特定角色（示例）
# "用investigate skill分析这个bug"
# "用office skill评估这个想法"
```

### 效果

Gary实测：代码产出速度是2013年的 **810倍**

---

## 2️⃣ find-skills —— 技能发现器

**定位**：根据需求自动搜索、筛选、安装skill
**优先级**：安装量1000+优先，低于100会提醒谨慎

### 核心命令

```bash
# 搜索skill
npx skills find "react performance"
npx skills find "pr review"
npx skills find "database backup"

# 安装skill
npx skills add <owner/repo@skill> -g -y

# 检查更新
npx skills check
npx skills update
```

### 搜索技巧

| 场景     | 搜索关键词                             |
| -------- | -------------------------------------- |
| Web开发  | react, nextjs, typescript, tailwind    |
| 测试     | testing, jest, playwright, e2e         |
| DevOps   | deploy, docker, kubernetes, ci-cd      |
| 文档     | docs, readme, changelog, api-docs      |
| 代码质量 | review, lint, refactor, best-practices |
| 设计     | ui, ux, design-system, accessibility   |

### 质量筛选规则

- ✅ **>=1000 installs**：优先推荐
- ⚠️ **<100 installs**：提醒谨慎，检查维护状态
- 🔍 **无结果**：建议直接用通用能力，或创建自定义skill

---

## 3️⃣ skill-creator —— 技能制造机

**定位**：创建、打包、发布自定义skill
**秘密武器**：description优化器（能大幅提升触发准确率）

### 快速开始

```bash
# 初始化新skill
scripts/init_skill.py my-skill --path skills/public --resources scripts,references

# 编辑 SKILL.md（关键！description决定触发准确率）
# 添加 scripts/ / references/ / assets/

# 打包skill
scripts/package_skill.py my-skill/
```

### Skill目录结构

```
my-skill/
├── SKILL.md          # 必须：name + description（触发关键）+ 使用指南
├── scripts/          # 可执行脚本（Python/Bash）
├── references/       # 参考文档（按需加载）
└── assets/           # 模板、图片等输出资源
```

### description优化秘诀

> ⚠️ 官方文档未公开，需读源码才能发现！

**好description的结构**：

```yaml
description: |
  这个skill做什么（功能描述）
  在什么情况下触发（场景1、场景2、场景3）
  与其他skill的区别（边界定义）
```

**示例**：

```yaml
# ❌ 差：太笼统
description: "Help with documents"

# ✅ 好：具体、有场景、有边界
description: |
  Comprehensive document creation, editing, and analysis with support
  for tracked changes, comments, formatting preservation, and text extraction.
  Use when Codex needs to work with professional documents (.docx files) for:
  (1) Creating new documents, (2) Modifying or editing content,
  (3) Working with tracked changes, (4) Adding comments,
  or any other document tasks
```

### 创建流程

1. **理解需求** → 用具体例子明确skill要解决的问题
2. **规划内容** → 确定scripts/references/assets
3. **初始化** → 运行 `init_skill.py`
4. **编写SKILL.md** → 重点优化description
5. **测试验证** → 实际运行脚本确保无bug
6. **打包发布** → 运行 `package_skill.py`

---

## 🔄 三位一体工作流

```
┌─────────────────┐
│   遇到新需求     │
└────────┬────────┘
         ▼
┌─────────────────┐     ┌─────────────────┐
│  find-skills     │────▶│  找到现成skill？  │
│  搜索现有技能    │     └────────┬────────┘
└─────────────────┘              │
                                 ▼
                    ┌─────────────────────┐
                    │  是 → gstack/直接用   │
                    │  否 → skill-creator   │
                    └─────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    ▼                         ▼
            ┌─────────────┐          ┌─────────────┐
            │  安装使用    │          │  创建自定义   │
            │  npx skills  │          │  init_skill  │
            │  add xxx     │          │  package_skill│
            └─────────────┘          └─────────────┘
                    │                         │
                    └────────────┬────────────┘
                                 ▼
                    ┌─────────────────────┐
                    │  完成任务，持续迭代   │
                    └─────────────────────┘
```

### 决策速查

| 情况                 | 行动                                      |
| -------------------- | ----------------------------------------- |
| "如何快速搭建AI团队" | 用 **gstack** → 一键配齐23个角色          |
| "有没有skill能做XX"  | 用 **find-skills** → `npx skills find XX` |
| "现有skill都不满足"  | 用 **skill-creator** → 自定义专属skill    |
| "description怎么写"  | 参考本文件优化秘诀，提升触发准确率        |

---

## 📦 常用命令速查

```bash
# ===== find-skills =====
npx skills find <关键词>          # 搜索
npx skills add <skill> -g -y      # 安装
npx skills check                   # 检查更新
npx skills update                  # 更新全部

# ===== skill-creator =====
scripts/init_skill.py <name> --path <dir> [--resources scripts,references,assets]
scripts/package_skill.py <skill-folder> [output-dir]

# ===== gstack =====
npm i -g gstack                    # 安装套件
# 调用方式：直接用skill名称触发，如 "用investigate分析bug"
```

---

## 💡 最佳实践

1. **先搜后用**：创建新skill前，先用 `find-skills` 确认是否已有现成方案
2. **description是灵魂**：好的description能让skill触发准确率大幅提升
3. **渐进式创建**：从具体例子出发，别造过于通用的skill
4. **保持精简**：SKILL.md < 500行，大数据放references/
5. **测试再打包**：脚本必须实际运行验证，别假设能work

---

_"找工具 → 用工具 → 造工具，所有需求都能从这个闭环延伸出来。"_
