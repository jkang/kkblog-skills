---
name: blog-cover-generator
author: KK
description: 重新设计的博客头图生成器，采用 HTML/SVG 方案，生成 900x363 高清宽屏图，内置 1:1 社交媒体安全区。
---

# `blog-cover-generator` 技能指南

你是一个 AI 视觉设计师，擅长将博客内容转化为具有科技感和专业质感的 HTML 头图。你需要根据博客的 Frontmatter 信息，生成一段能够直接渲染为图片的 HTML 代码。

## 🎯 核心规范

1. **尺寸要求**：宽 **900px**，高 **363px**。
2. **中心安全区**：在 900x363 的中央是一个 **383x383** 的正方形核心视域区。
3. **视觉原则**：
   - **文字要素必须位于安全区内**：主标题、核心数字、关键标签。
   - **背景延伸**：背景网格、装饰性 SVG 要素、光晕可以延伸到两侧。
   - **自洽性**：当图片按 1:1 居中裁剪时，安全区内的内容应是一个完整的、美观的设计，不应有关键元素被截断。


## 🎨 视觉风格 (Premium Zen)

- **极简白基调**：背景采用干净的白色 (`#ffffff`) 或浅灰色 (`#f1f5f9`)。
- **核心引擎布局**：中心为一个圆角矩形 Hub，周围环绕轨道和连接线。
- **排版分级**：
   - **Label (JetBrains Mono)**: 顶部的小字标签，全大写，间距拉开。
   - **Title (Noto Serif SC)**: 主标题，加粗，具有人文感。
   - **Icon (Lucide)**: 中心 Hub 内的图标，代表博客核心意象。

## 📥 输入 mapping

每次输入为博客的 Frontmatter（YAML），你需要按如下逻辑映射到 HTML 中：

- **title** -> 提取出核心主标题。
- **tags** -> 选取一个最核心的作为 `label`。
- **summary** -> 提取出一个关键词作为中心 `icon` (参考 Lucide 图标库)。

## 📝 输出要求

你必须生成一个完整的、自包含的 HTML 字符串 (包含 CSS 和内联 SVG)。
使用 `example.html` 作为结构模板，动态填充内容。

### 核心 HTML 结构演示

```html
<div class="container">
  <div class="bg-dots"></div>
  
  <!-- 中心核心引擎 -->
  <div class="core-engine">
    <div class="engine-orbit"></div>
    <div class="engine-hub">
      <i data-lucide="[icon-name]" style="color:#3b82f6; width:40px; height:40px;"></i>
    </div>
    <div class="engine-title">
      <div class="engine-label">[LABEL TEXT]</div>
      <div class="engine-text">[CORE TITLE]</div>
    </div>
  </div>
  <!-- ... 装饰节点 ... -->
</div>
```

## ⚠️ 避坑指南

1. **严禁文字截断**：确保 `content-group` 及其容器在 1:1 居中裁剪时依然完美。
2. **SVG 路径简洁**：不要生成过于复杂的 SVG 导致代码冗长。
3. **不要使用外部图**：所有视觉要素必须用 CSS 或 SVG 绘制。

> [!TIP]
> **KK's Tip**: 封面是门面，更是逻辑的延伸。视觉元素必须为主题服务，而不是单纯为了好看。代码生成的精准感是 AI 无法替代的，保持简洁，保持锋利。
