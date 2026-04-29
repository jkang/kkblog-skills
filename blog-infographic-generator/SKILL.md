---
name: blog-infographic-generator
author: KK
description: |
  通过编写高颜值 HTML/CSS 代码并进行浏览器截图，快速生成专业、美观的博客或报告配图。
  
  Triggers when user mentions:
  - "生成插图"
  - "制作信息图"
  - "generate infographic"
  - "create blog illustration"
  - "HTML 配图生成"
---

# Blog Infographic Generator

该技能旨在利用前端开发技术（HTML5, Tailwind CSS, Lucide Icons）的高灵活性，替代传统的绘图工具，生成具备“高级感”和“专业度”的插图。

## 核心设计规范 (Design System)

为了确保产出的插图符合项目的统一审美，必须遵循以下视觉规范：

### 1. 基础环境
- **背景**: 深色基调为主（如 `bg-slate-950` 或 `#0f172a`）。
- **容器**: 使用 `800px` 固定宽度（适合主流博客与微信排版）。
- **圆角**: 统一使用大圆角（如 `rounded-3xl` 或 `24px`）。
- **边框**: 极细深色边框（`border-slate-800/50`），增加玻璃质感。

### 2. 配色方案 (Color Palette)
- **主色 (Primary)**: 紫色/靛蓝色系 (`from-violet-500 to-indigo-600`)。
- **正向/成功 (Success)**: 翡翠绿/青色系 (`from-emerald-400 to-teal-600`)。
- **警示/强调 (Warning)**: 琥珀色/橙色系 (`from-amber-400 to-orange-500`)。
- **辅助色**: 渐变色文字（使用 `bg-clip-text text-transparent`）。

### 3. 玻璃拟态 (Glassmorphism)
- 背景模糊：`backdrop-blur-sm`。
- 光晕效果：在背景层放置模糊的径向渐变（`radial-gradient`）作为氛围灯光。

## 标准工作流

### 第一步：构思与解构
将非结构化的需求解构为可视化模块。例如：
- **对比类**: 使用左右对等布局（`grid-cols-2`）。
- **演进类**: 使用带箭头的横向或纵向流转布局。
- **矩阵类**: 使用四象限或 2x2 网格。

### 第二步：编写 HTML (Code First)
使用 CDN 引入 Tailwind CSS 和 Lucide Icons，确保代码自包含。

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
        body { font-family: 'Inter', sans-serif; background: #020617; }
        .infographic-container { width: 800px; padding: 48px; position: relative; overflow: hidden; }
    </style>
</head>
<body>
    <div class="infographic-container bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl">
        <!-- 内容层 -->
        <div class="relative z-10">
            <span class="text-xs font-bold tracking-widest text-violet-400 uppercase">Category</span>
            <h1 class="text-3xl font-bold text-white mt-2">Title of Infographic</h1>
            <!-- 模块列表... -->
        </div>
        <!-- 背景光晕层 -->
        <div class="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 blur-3xl rounded-full"></div>
    </div>
    <script>lucide.createIcons();</script>
</body>
</html>
```

### 第三步：捕捉与裁剪 (Capture)
1. **浏览器预览**: 使用 `browser_subagent` 打开 HTML。
2. **窗口调整**: 将浏览器视口调整为容器的精确尺寸（通常宽 800px，高度自适应）。
3. **滚动定位**: 确保目标容器完全展示在视口中央。
4. **截图保存**: 使用 `take_screenshot` 捕捉视口内容并保存为 `jpg`。

## 资产管理规范 (Asset Management)

为了确保插图能够更好地在博客系统中复用，必须遵循以下存储规则：

1. **博客文件夹存放**: 生成的 `.html` 文件应直接放置在对应的博客内容文件夹中。
   - 路径示例: `content/blogs/[blog-id]/[blog-id]_infographic.html`
2. **自动图像转换**: 使用配套的 `capture.js` 脚本将 HTML 转换为 JPG 图片，以便在无法运行 JS 的环境（如微信公众号）中使用。
   - 转换后的 JPG 路径: `content/blogs/[blog-id]/[blog-id]_infographic.jpg`

## 自动化截图指令 (Capture Automation)

在生成 HTML 后，必须运行以下命令生成 JPG：

```bash
# 进入项目根目录
cd /Users/superkkk/MyCoding/kkjm-homepage

# 运行截图 (自动识别高度并保存为同名 jpg)
node skills/blog-infographic-generator/scripts/capture.js content/blogs/[blog-id]/[blog-id]_infographic.html
```

## 适用场景
- **博客核心观点总结**: 用一页纸总结文章精华。
- **产品逻辑架构展示**: 用视觉化的方式解释复杂系统。
- **行业趋势对比图**: 替代平淡的表格，增加视觉冲击力。

## 开发者参考
- **布局参考**: `skills/blog-infographic-generator/examples/demo.html`
- **动效参考**: 使用 Tailwind 的 `hover:` 伪类增加交互暗示。
- **工具建议**: 配合 Lucide 图标集增强语义化表达。
