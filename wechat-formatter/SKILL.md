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
   cd /Users/superkkk/MyCoding/kkjm-homepage
   node skills/wechat-formatter/scripts/format.js content/blogs/blog14.md public/wechatblog14.html
   ```

## Styling Rules Handled by Script
The script uses `marked` to parse markdown. It overrides default renderers to inject the following exact inline styles:
- **Container**: Max width 667px, margin auto, with specific WeChat standard classes (`rich_media_content`, `js_underline_content`).
- **H2**: Bold, 22px, `#4A90E2` left border (4px), 12px left padding.
- **H3**: Bold, 20px, `#4A90E2` bottom border (2px), 100% width, margin auto.
- **H4**: Bold, 15px, white text on `#4A90E2` background, inline-block with padding.
- **Paragraphs**: 15px, `#343A40`, line-height 1.8, 16px vertical margins.
- **Blockquotes**: Gray background `#f8f9fa`, 12px padding, 12px border radius, gray text.
- **Lists**: Custom `<ul>`/`<ol>` reset styling with customized bullets/numbers in `#4A90E2` blue color.
- **Strong**: Bold text combined with `#4A90E2` color for emphasis.

## Verification
After generating the output HTML, confirm with the user if they want to preview it or if they need any manual adjustments to the generated styling.
