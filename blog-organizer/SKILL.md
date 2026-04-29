---
name: blog-organizer
description: 自动整理 content/blogs 下的博客文章，规范化 Frontmatter 并处理图片资源。当用户要求整理博客、修复博客格式或处理博客图片时使用。
---

# Blog Organizer Skill

该 Skill 用于自动化整理 `content/blogs` 目录下的 Markdown 博客文章，使其符合项目规范（参考 `blog1.md`）。

## 功能描述

1.  **Frontmatter 规范化**：
    *   检查并补充 `title`, `date`, `author`, `tags`, `summary`。
    *   `author` 默认为 "KKJM"。
    *   `tags` 默认为 `['AI', '产品经理']`。
    *   `summary` 自动从正文提取前 150 字。
    *   `date` 格式化为 "YYYY年M月D日"。

2.  **图片资源管理**：
    Skill 支持多种图片组织方式，并利用 API 路由直接访问 `content/blogs` 下的资源（无需复制到 `public`）：
    
    *   **子目录模式**（推荐）：
        *   识别与博客同名的子目录（如 `blog2.md` 对应 `content/blogs/blog2/`）。
        *   自动修正 Markdown 图片引用，使其指向正确的相对路径。
        
    *   **平铺模式**（便捷）：
        *   识别直接放在 `content/blogs/` 根目录下的图片文件。
        *   识别 Markdown 正文中引用的本地图片路径。
        *   修正引用路径为相对于 `content/blogs/` 的路径（如 `img.png`），以便 API 路由正确加载。

    *   **特殊路径映射模式**（兼容旧数据）：
        *   识别 Markdown 中形如 `/assets/img/news/-X.jpg` 的引用。
        *   自动查找对应子目录下的 `default-X.jpeg` (或 .jpg/.png) 文件。
        *   更新 Markdown 引用为 `slug/default-X.jpeg`。

    **处理结果**：
    *   不移动或复制图片文件（保留在 `content/blogs` 下）。
    *   自动更新 Markdown 正文中的图片引用路径，统一指向相对于 `content/blogs` 的路径。
    *   修正封面路径。
    *   处理 `cover` 字段，确保其指向有效的 `public` 路径。

## 使用方法

当需要整理博客时，运行以下脚本：

```bash
node skills/blog-organizer/scripts/organize_blogs.js
```

或者使用 npm 命令：

```bash
npm run organize-blogs
```

## 依赖

*   项目根目录下需存在 `content/blogs` 和 `public` 目录。
*   依赖 `gray-matter` 库解析 Frontmatter（项目中已安装）。
