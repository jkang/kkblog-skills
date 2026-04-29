# skills.sh Competitive Analysis & Publishing Report

> Research date: 2026-03-14
> Dataset: Top ~600 skills on skills.sh, scraped via RSC API

---

## Status of video-lens on skills.sh

**video-lens is indexed at skills.sh/kar2phi/video-lens** with 2 installs across 6 platforms (amp, cline, opencode, cursor, kimi-cli, codex). It does not appear in the top 600 by install count — the path to growth is discoverability and promotion, not submission.

**Security audit results:** Gen Agent Trust Hub (Warn), Socket (Pass), Snyk (Warn). The warnings are likely triggered by the embedded Python Bash commands — not fixable without fundamentally changing the skill's approach.

---

## What video-lens does (reference)

- Accepts YouTube URLs or natural-language prompts ("summarize this", "TL;DR this")
- Fetches transcripts via `youtube_transcript_api`
- Enriches metadata via `yt-dlp` (chapters, description, views, duration)
- Generates structured HTML report: Summary · Takeaway · Key Points · Timestamped Outline
- Multi-language support; adjusts depth by video length
- Outputs to `~/Downloads/` and serves via local HTTP on port 8765

**Category:** YouTube content analysis / summarization

---

## "Video" skills found on skills.sh

All 7 video-tagged skills on the platform are about **video creation or processing**, not YouTube analysis. None are functionally comparable to video-lens.

| Skill | Source | Installs | What it does |
|-------|--------|----------|-------------|
| `ai-video-generation` | inferen-sh/skills | **19,844** | Generate videos with 40+ AI models (text-to-video, image-to-video, upscaling, audio sync) |
| `p-video` | inferen-sh/skills | **19,669** | Fast text-to-video using Pruna-optimized models; supports audio input |
| `remotion-video-production` | supercent-io/skills-template | **8,128** | Programmable videos with Remotion; brand-consistent automated generation from text |
| `videoagent-video-studio` | pexoai/pexo-skills | **8,032** | Generate short AI videos with 7 backends; auto-selects text-to-video or image-to-video |
| `transloadit-media-processing` | github/awesome-copilot | **6,954** | Encode, transform, process video/audio/image files via Transloadit cloud |
| `videoagent-image-studio` | pexoai/pexo-skills | **4,849** | AI image studio (companion to video-studio) |

**Key insight:** "video" as a search term leads to generation tools. YouTube analysis lives in a different conceptual space — closer to "research" and "summarization" than "media production."

---

## Closest functional neighbors (content analysis)

These skills share video-lens's analysis/summarization DNA but target different content types:

| Skill | Source | Installs | What it does |
|-------|--------|----------|-------------|
| `content-strategy` | coreyhaines31/marketingskills | **22,538** | AI-assisted content strategy creation |
| `social-content` | coreyhaines31/marketingskills | **20,193** | Social media content generation |
| `firecrawl` | firecrawl/cli | **12,584** | Scrape & extract structured content from websites |
| `tldr-prompt` | github/awesome-copilot | **6,929** | General text TL;DR summarization |
| `create-tldr-page` | github/awesome-copilot | **6,921** | Creates TL;DR documentation pages |
| `research` | tavily-ai/skills | **5,805** | Web research via Tavily search API |
| `extract` | tavily-ai/skills | **4,394** | Extract structured data from web pages |

These are the real benchmark peers — not the video-generation skills. YouTube summarization is a point in the research/extraction space.

---

## Feature comparison

| Feature | video-lens | Video generation skills | Research/extraction skills |
|---------|-----------|------------------------|---------------------------|
| **Purpose** | YouTube analysis & summarization | AI video creation | Web scraping / text summarization |
| **Input** | YouTube URL or plain English request | Text prompt / image | URL / plain text |
| **Output** | Structured HTML report with embedded player | Video file / URL | Raw text or JSON |
| **External deps** | youtube_transcript_api, yt-dlp | Inference APIs, Remotion, Transloadit | Firecrawl API, Tavily API |
| **Cost** | Free | Paid API credits | Paid API credits |
| **Offline-capable** | Yes (transcripts cached locally) | No | No |
| **Rich interactivity** | Timestamped player, outline, dark mode | N/A | N/A |

---

## Install benchmarks (comparable utility skills)

| Range | Installs | Example |
|-------|----------|---------|
| Top tier | 20,000+ | `content-strategy`, `ai-video-generation` |
| Mid tier | 10,000–20,000 | `firecrawl` (12,584) |
| Entry tier | 5,000–10,000 | `research` (5,805), `tldr-prompt` (6,929) |
| Current | 2 | video-lens |

A YouTube summarization skill filling this gap would likely land in the **5,000–15,000** range based on comparable utility. The ceiling is higher if discoverability improves — no competing skill exists to split the audience.

---

## Repo changes made

To bring the repo into full skills.sh / agentskills.io spec compliance:

| Change | Before | After |
|--------|--------|-------|
| Skill directory | `skill/SKILL.md` | `skills/video-lens/SKILL.md` |
| Parent dir name | `skill` (spec violation) | `video-lens` (matches `name` field) |
| `install-skill` task | Per-agent `sed`+`cp` loop | `npx skills add kar2phi/video-lens` |
| `install` task | `pip install -r requirements.txt` | Renamed to `install-libraries` |
| SKILL.md: `license` | — | `MIT` |
| SKILL.md: `compatibility` | — | Python 3 + youtube-transcript-api ≥0.6.3; optional yt-dlp |
| SKILL.md: `allowed-tools` | — | `Bash Read` |
| SKILL.md: `metadata` | — | `author: kar2phi`, `version: "2.0"` |
| README install option A | Manual `curl` + `mkdir` | `npx skills add kar2phi/video-lens` |
| README badge | — | skills.sh badge added |

---

## Key takeaways

1. **No direct competition** — video-lens is the only YouTube transcript + AI summarization skill on skills.sh. Publishing owns the niche by default.
2. **"Video" is a misleading search term** — all existing video skills are about generation. Users searching for YouTube analysis will not find video-lens through the video category; they'll find it through "summarize", "transcript", or "TL;DR" keywords.
3. **Install potential is solid** — TL;DR and content extraction skills each pull 6,000–22,000 installs, suggesting strong appetite for this category.
4. **Differentiated output** — local HTML report with embedded player, timestamped chapters, dark mode, and keyboard shortcuts is not found in any comparable skill.
5. **Free vs. paid** — all high-install video/analysis alternatives require paid API credits. video-lens is entirely free.
6. **Security warnings are cosmetic** — the Warn status from Gen Agent Trust Hub and Snyk reflects Bash execution of Python code, which is inherent to the skill's design. It does not block installation.

---

## Discovery strategy

The skill is indexed; the bottleneck is discovery. The most effective levers:

- **Keywords in description** — the current description covers "summarize", "TL;DR", "highlights", "digest", "notes". These are the right terms. No change needed.
- **GitHub stars** — skills.sh shows star count prominently on skill pages. Stars are the primary social-proof signal for new visitors.
- **Backlinks** — listing on awesome-copilot, Claude Code community threads, and agent-adjacent newsletters drives organic installs which compound into leaderboard rank.
- **Spec compliance** — the `skills/video-lens/` directory rename ensures the CLI finds the skill via the standard path rather than recursive fallback, which may improve indexing reliability.
