# KK Blog Skills

这组 Skill 专为 AI 辅助创作深度、高颜值的博客内容而设计。包含从洞察挖掘、内容撰写到视觉配图、公众号格式化的全流程工具。

## 📦 如何安装 (Installation)

要让你的 AI 助手（如 Antigravity, OpenCode/OpenWork Agent）使用这组 Skill，请按照以下步骤操作：

1. **克隆仓库**：
   将本仓库克隆到你本地的 Skill 目录下：
   ```bash
   git clone https://github.com/jkang/kkblog-skills.git
   ```

2. **配置工作区**：
   在你的 AI 助手的设置或配置文件（如 `.opencode/skills`）中，将该目录添加到 `skills` 路径中。

3. **刷新环境**：
   重新加载你的 AI 会话，助手将自动识别目录下的所有 `SKILL.md` 文件并加载相应功能。

## 🚀 如何使用 (Usage)

加载成功后，你只需在对话中通过自然语言指令触发：
- **深度洞察**："针对 [主题] 进行一次 Insights Deepdive，挖掘非共识观点。"
- **视频总结**："总结一下这个 YouTube 视频的核心观点：[URL]。作为博客引用素材"
- **博客写作**："针对 [主题] 按照我的风格要求来写一篇博客。"
- **去 AI 味改写**："帮我把这段文字改写得更自然，去掉 AI 感。"
- **生成封面图**："帮我为这篇文章生成一个 900x363 的博客封面图。"
- **格式化公众号**："把这篇 Markdown 转换成公众号格式的 HTML。"

> [!TIP]
> 每个子目录下都有详细的 `SKILL.md`，你可以直接阅读它们以了解更高级的参数和配置。

## 🛠 包含的 Skills

- `blog-writer`: AI 产品经理风格博客撰写
- `de-ai-writer`: 中文去 AI 味改写工具
- `insights-deepdive`: 苏格拉底式深度洞察挖掘
- `video-lens`: YouTube 视频摘要与洞察工具
- `blog-cover-generator`: 博客头图/封面生成
- `blog-infographic-generator`: 博客信息图/插图生成
- `wechat-formatter`: 微信公众号美化排版工具
- `blog-organizer`: 博客 Frontmatter 整理工具

---
MIT License | Created by KK
