# 拟物化UI设计规范 v1.0

## 一、定义
拟物设计：复刻现实物品样貌，用户一眼看懂功能。搭配真实交互动画、操作音效，带来贴近现实的使用感受。

## 二、价值

| 维度 | 作用 |
|------|------|
| 视觉 | 丰富细节，提升画面质感 |
| 功能 | 直观传递功能寓意，清晰展现使用场景与交互逻辑 |

## 三、核心要素

### 1. 外观
- 阴影：多层阴影模拟真实光照（`box-shadow: 0 2px 4px rgba(0,0,0,0.1), 0 8px 16px rgba(0,0,0,0.1)`）
- 渐变：微妙渐变模拟材质反光
- 纹理：轻微噪点/纹理增加真实感（`background-image: url(noise.png)` + 低透明度）
- 圆角：符合现实物品边缘（按钮/卡片 4-8px，大容器 12-16px）

### 2. 交互
- 按下效果：`transform: scale(0.97)` + 阴影收紧
- 悬浮反馈：阴影扩散，轻微上浮
- 切换动画：150-250ms ease-out
- 音效：可选，按钮点击、开关切换等场景

### 3. 色彩
- 主色：饱和度适中（60-70%），避免纯色
- 背景：浅灰/米白（`#f5f5f5` ~ `#fafafa`），非纯白
- 文字：深灰（`#333`）而非纯黑，减少刺眼感

## 四、组件示例

```css
/* 拟物按钮 */
.skeuo-btn {
  background: linear-gradient(180deg, #fff 0%, #e6e6e6 100%);
  border: 1px solid #ccc;
  border-radius: 6px;
  box-shadow: 
    0 1px 2px rgba(0,0,0,0.1),
    inset 0 1px 0 rgba(255,255,255,0.6);
  padding: 8px 16px;
  cursor: pointer;
  transition: all 0.15s ease-out;
}
.skeuo-btn:active {
  transform: scale(0.97);
  box-shadow: 
    0 1px 2px rgba(0,0,0,0.1),
    inset 0 2px 4px rgba(0,0,0,0.1);
}

/* 拟物卡片 */
.skeuo-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 
    0 2px 4px rgba(0,0,0,0.06),
    0 8px 16px rgba(0,0,0,0.06);
  padding: 20px;
}

/* 拟物输入框 */
.skeuo-input {
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.08);
  padding: 8px 12px;
  outline: none;
}
.skeuo-input:focus {
  border-color: #4a90d9;
  box-shadow: 
    inset 0 1px 3px rgba(0,0,0,0.08),
    0 0 0 2px rgba(74,144,217,0.2);
}
```

## 五、应用场景

| 场景 | 拟物程度 | 原因 |
|------|----------|------|
| 工具类App（计算器、时钟） | 高 | 用户期待现实隐喻 |
| 仪表盘/数据展示 | 中 | 适量拟物提升质感，避免干扰数据 |
| 后台管理系统 | 低 | 优先信息密度，拟物仅用于关键交互 |
| 极简内容类（阅读、笔记） | 低 | 扁平为主，拟物点缀 |

## 六、注意事项

1. **克制使用**：过度拟物导致界面臃肿，只在关键元素使用
2. **性能考量**：多层阴影/渐变消耗GPU，移动端注意
3. **无障碍**：确保对比度达标（WCAG AA标准）
4. **一致性**：同一产品内拟物风格统一，避免混搭

## 七、参考资源

- Apple iOS 6 及更早版本（经典拟物）
- Windows Aero（玻璃拟态）
- Dribbble 搜索 "skeuomorphism"
