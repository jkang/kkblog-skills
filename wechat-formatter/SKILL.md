---
name: wechat-formatter
description: Formats Markdown content into HTML strictly adhering to the WeChat Official Account aesthetic styling rules.
metadata:
  author: KK
---

# WeChat Formatter Skill

This skill is responsible for transforming standard Markdown files (like blog posts) into a fully styled HTML document that can be directly copy-pasted into the WeChat Official Account rich text editor.

## Goal
To take an input Markdown content and produce an output HTML where every element (headings, paragraphs, lists, quotes, strong tags) has specific inline CSS perfectly matching the KKJM brand's WeChat aesthetic.

## Usage
Whenever the user requests to format a blog post for WeChat, or explicitly asks to use the `wechat-formatter` skill:

1. **Locate the source markdown file**: Identify the specific `.md` file in the workspace (e.g., `content/blogs/blog14.md`).
2. **Execute the Formatting Script**:
   Run the `format.js` script to process the markdown file and generate the styled HTML.
   ```bash
   node skills/wechat-formatter/scripts/format.js <path-to-markdown-file> <path-to-output-html>
   ```
   *Example:*
   ```bash
   cd <project-root>
   node skills/wechat-formatter/scripts/format.js content/blogs/blog14.md public/wechatblog14.html
   ```

## Styling Rules Handled by Script
The script uses `marked` to parse markdown. It overrides default renderers to inject the following exact inline styles based on the **Inspire Design System**:
- **Container**: Max width 667px, margin auto, using `MiSans` typography.
- **H2**: Starry Blues (`#10213E`), 22px, with a **Stacks SVG Icon** and Creative Blue left border.
- **H3**: Starry Blues, 20px, with a **Diamond Marker (◆)** and Creative Blue bottom underline.
- **H4**: **Badge style** with an **Arrow SVG Icon** and a Starry-to-Creative Blue gradient background.
- **Paragraphs**: 15px, Starry Blues (`#10213E`), line-height 1.8.
- **Blockquotes**: Tech Gray background (`#F5F5F6`), Amethyst (`#625D9C`) left border, muted text.
- **Lists**: Flexible layout with Creative Blue bullets.
- **Strong**: Amethyst (`#625D9C`) color with a Creative Blue subtle bottom border.
- **Tags**: Tech Gray background with Creative Blue outline.

## Verification
After generating the output HTML, confirm with the user if they want to preview it or if they need any manual adjustments to the generated styling.
