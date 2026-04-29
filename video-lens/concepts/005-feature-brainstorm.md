# Feature Brainstorm — video-lens v3 Roadmap Ideas

## Context

video-lens v2.0 is stable: transcript fetch → AI analysis → interactive HTML report with embedded player, timestamped outline, dark mode, keyboard shortcuts, and Markdown export. The skill is the only YouTube summarization tool on skills.sh but has low discoverability (2 installs per concepts/003). This document catalogues potential features, additions, and improvements — organised by category with feasibility and impact notes — to inform the next development cycle.

---

## A. Content & Analysis Enhancements

### A1. Transcript panel (synced to player)

**What:** Display the raw transcript in a scrollable panel that auto-highlights the current line as the video plays. Click any line to seek.

**Why:** The transcript is already fetched but never shown. For study, language learning, and accessibility, seeing the source text alongside the summary is a major UX win. Makes the report a complete reference — no need to leave it.

**Feasibility:** Medium. The transcript text and timestamps are available at render time. Needs a new HTML section, JS to sync with the YouTube iframe API (already wired up), and CSS for highlight/scroll behaviour. Could reuse the outline's `data-t` seek logic.

---

### A2. Quote extraction

**What:** Pull 3–5 of the most quotable or memorable lines from the video. Display as styled pull-quotes in the report.

**Why:** High shareability — users can copy a compelling quote for social media, presentations, or notes. Requires zero UI engineering; it's a prompt-only addition with a small template block.

**Feasibility:** Easy. Add a `QUOTES` section to the prompt (Step 3) and a `{{QUOTES}}` placeholder to the template. The LLM already reads the full transcript.

---

### A3. Follow-up questions

**What:** Generate 3–5 thoughtful questions the viewer might want to explore after watching. Oriented toward active learning and further research.

**Why:** Turns the report from a passive summary into a study tool. Particularly valuable for educational content, lectures, and conference talks.

**Feasibility:** Easy. Prompt-only change + small template section.

---

### A4. Multi-video comparison mode

**What:** Accept 2–3 YouTube URLs and produce a single report comparing their positions. Side-by-side Key Points showing agreement, disagreement, and unique contributions.

**Why:** High-value power-user feature. Use case: "compare these two takes on AI regulation" or "what do these three tutorials cover differently?"

**Feasibility:** Hard. Requires multi-transcript fetching, a new comparison prompt structure, a different HTML layout (columns or diff-style), and changes to the render pipeline. Major scope expansion.

---

### A5. Speaker attribution for interviews/panels

**What:** Detect and label speakers (Speaker A / Speaker B, or by name if identifiable) in conversation-style videos. Colour-code Key Points by speaker.

**Why:** Podcasts and panels are among the most-summarised video types, and the flat transcript makes it hard to attribute ideas. Even approximate attribution (based on topic shifts and transcript patterns) would add value.

**Feasibility:** Hard. YouTube auto-captions don't include speaker labels. Would need heuristic detection (sentence structure, topic shifts) or integration with a diarisation service. Prompt-only approximation ("attribute points to speakers when identifiable") is low-effort but unreliable.

---

### A6. Difficulty / audience level indicator

**What:** Auto-detect whether content is beginner, intermediate, or advanced. Display a small badge in the meta line.

**Why:** Helps users triage videos before committing time. Low-cost signal.

**Feasibility:** Easy. Prompt-only addition — ask the LLM to assess and emit a `DIFFICULTY:` line. One badge element in the template.

---

### A7. Re-summarise with different focus

**What:** "Re-summarise this but focus on the technical details" or "...for a non-technical audience." Regenerate content from a cached transcript with a different analytical lens.

**Why:** Different readers want different things from the same video. A product manager and an engineer would want very different summaries of a technical keynote.

**Feasibility:** Medium. Requires transcript caching (see E2) so re-runs don't re-fetch. The prompt would accept an optional `FOCUS:` parameter. Template and pipeline unchanged.

---

### A8. Concept map / knowledge graph

**What:** Generate a simple visual diagram showing relationships between key concepts. Rendered as a Mermaid.js diagram or inline SVG embedded in the report.

**Why:** Visual thinkers get a quick spatial overview of how ideas connect. Particularly valuable for dense educational content.

**Feasibility:** Medium. Mermaid.js can be included via CDN. The LLM would emit a `CONCEPT_MAP:` block in Mermaid syntax. Risk: LLM-generated diagrams can be noisy or poorly laid out.

---

## B. Template & UI Improvements

### B1. Copy-to-clipboard per section

**What:** Small clipboard icon next to Summary, Takeaway, and Key Points headers. One click copies that section as clean plain text.

**Why:** Daily utility — paste summaries into Slack, email, notes. Nearly zero effort to implement.

**Feasibility:** Very easy. A few lines of JS using `navigator.clipboard.writeText()` + a small icon button in each section header.

---

### B2. Print-friendly stylesheet

**What:** `@media print` CSS rules that hide the player and controls, expand all outline details, use black-on-white, and format for A4/Letter paper.

**Why:** Some users want a physical or PDF printout. Currently, printing the report would look broken (player iframe, dark mode, split panels).

**Feasibility:** Very easy. Pure CSS, no script or template changes.

---

### B3. Expand/collapse all outline entries

**What:** A toggle button above the outline to expand or collapse all detail sentences at once.

**Why:** Currently each entry must be clicked individually. Bulk expand is useful for scanning; bulk collapse for a clean timeline view.

**Feasibility:** Very easy. One button, a few lines of JS toggling all `.outline-detail` elements.

---

### B4. Timestamp deep-links

**What:** Support `#t=123` URL fragments. When the report loads with a fragment, auto-seek the player to that time and highlight the relevant outline entry.

**Why:** Enables sharing specific moments: "check this report at #t=1847 for the part about X."

**Feasibility:** Easy. Parse `location.hash` on load, call `player.seekTo()`, trigger outline highlight. Minimal JS.

---

### B5. Font size controls

**What:** A/A+ buttons or a slider for adjusting the right-panel body text size. Persist preference to localStorage.

**Why:** Accessibility and comfort. Some users find the default size too small on high-DPI screens; others want it smaller to see more at once.

**Feasibility:** Very easy. CSS custom property + JS toggle + localStorage.

---

### B6. Highlight + annotate

**What:** Let users highlight text in the report and add personal sticky notes. Persist to localStorage keyed by video ID.

**Why:** Transforms the report from a read-once summary into an active study artifact. Particularly valuable for students and researchers.

**Feasibility:** Medium-hard. Requires text range selection handling, annotation UI (popover or sidebar), and a localStorage data model for highlights. Libraries like `mark.js` could help.

---

### B7. Report index page

**What:** Auto-generated index at `http://localhost:8765/` listing all reports in `~/Downloads/` with titles, dates, video thumbnails, and links.

**Why:** After generating multiple reports, there's no way to browse them. The server already runs — it just needs a landing page.

**Feasibility:** Easy-medium. A small script or the serve script itself generates an `index.html` by scanning `*video-lens*.html` files and extracting `<title>` tags and video IDs (for thumbnails).

---

### B8. Reading time estimate

**What:** "3 min read" badge near the report title, estimating time to read the summary content (not watch the video).

**Why:** Quick signal for triaging reports. Easy mental model: "I have 2 minutes, is this report short enough?"

**Feasibility:** Very easy. Word count at render time → divide by 200 wpm → display in meta line.

---

### B9. Mobile-optimised outline

**What:** On narrow screens (currently single-column), show the outline as a collapsible bottom sheet or floating button rather than burying it in the scroll.

**Why:** The outline is one of the most useful sections but on mobile it's far down the page. A floating entry point would keep it accessible.

**Feasibility:** Medium. CSS + JS for a bottom-sheet pattern. Responsive design consideration.

---

## C. Export & Integration

### C1. PDF export

**What:** One-click PDF generation using `window.print()` with the print stylesheet (B2), or a lightweight library like `html2pdf.js`.

**Why:** Natural companion to the print stylesheet. Users want to save reports for offline reading or archival.

**Feasibility:** Easy (if B2 is done first). Button triggers `window.print()`. For higher quality, could use Puppeteer server-side, but that's heavier.

---

### C2. Notion / Obsidian export

**What:** Export button that outputs Markdown formatted specifically for Notion (with toggle blocks for outline) or Obsidian (with YAML frontmatter, tags derived from key points, wikilinks for concepts).

**Why:** Many knowledge workers keep a second brain in Notion or Obsidian. The existing Markdown export is generic — tool-specific formatting would save manual cleanup.

**Feasibility:** Easy-medium. Markdown export already exists; this is a variant with different formatting rules per target.

---

### C3. Anki flashcard export

**What:** Generate flashcards from Key Points. Front = bold term/concept, Back = explanation + analytical paragraph. Export as Anki-compatible CSV or `.apkg`.

**Why:** Active recall is the most effective study method. Turning key points into flashcards is a natural extension for students and lifelong learners.

**Feasibility:** Medium. CSV export is simple (comma-separated front/back). `.apkg` format requires a Python library (`genanki`) but the script infrastructure already exists.

---

### C4. Self-contained shareable HTML

**What:** Generate a fully self-contained HTML file with all CSS/JS inlined and the YouTube player replaced by a thumbnail + "Watch on YouTube" link. No localhost dependency.

**Why:** The current report requires `localhost:8765` for the embedded player. A self-contained version could be emailed, hosted on a static site, or opened from Finder.

**Feasibility:** Medium. Inline the CSS (already mostly inline). Replace the iframe player with a static thumbnail + link. The interactive player features would be lost but the content would be fully readable.

---

### C5. Apple Notes integration (macOS)

**What:** "Send to Apple Notes" button that uses `osascript` (AppleScript) to create a new note with the formatted summary.

**Why:** Many Mac users live in Apple Notes. One-click export beats copy-paste.

**Feasibility:** Easy-medium. AppleScript can create notes with HTML body. Would need a small helper script called via the report's JS (or a separate CLI command).

---

## D. Player & Viewing Experience

### D1. Picture-in-picture

**What:** Button to pop the video into a floating PiP window while scrolling through the report content.

**Why:** On single-monitor setups or when the right panel is long, the video scrolls out of view. PiP keeps it visible. The YouTube iframe API supports `requestPictureInPicture()` on the underlying `<video>` element (though cross-origin iframe limitations may require workarounds).

**Feasibility:** Medium. Works natively on some browsers via the PiP API. May need the YouTube player's internal `<video>` element, which is cross-origin restricted. Fallback: a "pop out" button that opens the video in a small separate window.

---

### D2. Playback bookmarks

**What:** A "bookmark" button in the player controls. Clicking it drops a timestamped marker. Bookmarks appear in the outline with a distinct icon and persist to localStorage.

**Why:** While watching, users often think "I want to come back to this." Currently they'd have to note the time manually.

**Feasibility:** Medium. JS for the button + timestamp capture + localStorage model. Rendering bookmarks in the outline requires DOM manipulation.

---

### D3. Loop segment

**What:** Select a start/end time to loop a video segment. Useful for language learning, practising along with a tutorial, or re-watching a complex explanation.

**Why:** Niche but high-value for the language learning and music/tutorial audiences.

**Feasibility:** Easy-medium. YouTube iframe API supports `player.seekTo()` + a `timeupdate`-style polling loop to detect when the end time is reached.

---

### D4. Auto-pause at chapter boundaries

**What:** Toggle: "Pause at each chapter" — the video pauses when it reaches the next outline entry's timestamp, giving the viewer time to read or take notes.

**Why:** Turns passive watching into active study. Pairs well with the annotate feature (B6).

**Feasibility:** Easy. Poll `player.getCurrentTime()` against outline timestamps. Already have the time-sync logic for outline highlighting.

---

## E. Workflow & Pipeline

### E1. Batch / playlist processing

**What:** Accept a YouTube playlist URL or a text file of video URLs. Generate individual reports + a combined index page linking them all.

**Why:** Power-user feature. "Summarise this conference playlist" or "process my Watch Later queue."

**Feasibility:** Medium-hard. Playlist URL parsing (yt-dlp can extract playlist video IDs). Sequential or parallel report generation. Index page generation (similar to B7). Would need changes to SKILL.md's single-video assumption.

---

### E2. Transcript caching

**What:** Cache fetched transcripts locally (e.g., `~/.cache/video-lens/VIDEO_ID.json`) so re-runs don't re-fetch from YouTube.

**Why:** Speeds up iteration. Enables re-summarisation with different focus (A7). Reduces rate-limiting risk on YouTube's transcript API.

**Feasibility:** Easy. Small change to `fetch_transcript.py`: check cache dir first, write result after fetch.

---

### E3. Timestamp-range summaries

**What:** "Summarise from 15:00 to 45:00" — filter the transcript to a time range before analysis.

**Why:** Long livestreams, multi-topic podcasts, and conference recordings often have only one relevant segment. Summarising the full 3-hour video wastes tokens and dilutes quality.

**Feasibility:** Easy. Filter transcript lines by timestamp in `fetch_transcript.py` (accept `--start` and `--end` args). Prompt unchanged — it just sees less text.

---

### E4. Non-YouTube platform support

**What:** Extend to Vimeo, Twitch VODs, or podcast RSS feeds. For platforms without transcripts, use Whisper (local or API) for transcription.

**Why:** Major scope expansion but dramatically widens the audience. Many users watch content across platforms.

**Feasibility:** Hard. Each platform has different APIs/scraping requirements. Whisper integration is a separate pipeline. Would benefit from a plugin architecture.

---

## F. Quality & Infrastructure

### F1. A/B testing framework for prompt quality

**What:** Automated evaluation: run the same video through two prompt variants, compare outputs on metrics (coverage, conciseness, faithfulness, overlap). Report which variant is better.

**Why:** Prompt changes (like those in concepts/002 and concepts/004) are currently validated manually. An eval framework would make iteration faster and evidence-based.

**Feasibility:** Medium. Extend `test_e2e.py` with a comparison mode. Define scoring rubrics (could use LLM-as-judge). Would need a set of reference videos.

---

### F2. Accessibility audit

**What:** Full screen reader testing, ARIA landmarks, focus management, keyboard navigation audit, `prefers-reduced-motion` support.

**Why:** The template has some ARIA but hasn't been formally audited. Accessibility is both ethical and a quality signal.

**Feasibility:** Easy-medium. Mostly CSS and HTML attribute work. The keyboard shortcuts system should announce state changes to screen readers.

---

### F3. Lazy-load YouTube iframe

**What:** Don't load the YouTube iframe until the user clicks play or scrolls to the player area. Show a static thumbnail placeholder initially.

**Why:** Faster initial page load. YouTube's iframe loads significant JS. On metered connections, this saves bandwidth for users who only want to read.

**Feasibility:** Easy. Replace iframe `src` with `data-src` + thumbnail image. Swap on click or IntersectionObserver.

---

### F4. Error recovery UX

**What:** If the YouTube player fails to load (network issue, video removed, embed disabled), show a graceful fallback: video thumbnail, title, and a "Watch on YouTube" link instead of a broken iframe.

**Why:** Reports are saved as files and may outlive the video. A broken iframe is a poor experience.

**Feasibility:** Easy. YouTube iframe API has error events. Fallback to a thumbnail (derived from video ID: `https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg`) + link.

---

## G. Growth & Discoverability

### G1. Animated README demo

**What:** Record a GIF or short video showing the full flow: paste URL → report appears → interact with player and outline.

**Why:** Per concepts/003, discoverability is the bottleneck, not capability. A compelling visual demo is the single highest-leverage growth action.

**Feasibility:** Very easy. Screen recording + compression. No code changes.

---

### G2. Gallery / showcase page

**What:** A public web page showing 3–5 example reports (with sanitised content) to demonstrate output quality. Link from GitHub README.

**Why:** "Show don't tell" for potential users evaluating the skill.

**Feasibility:** Easy. Generate reports for a few public videos, host as static HTML on GitHub Pages.

---

### G3. Browser extension

**What:** Chrome/Firefox extension that adds a "Summarise with video-lens" button to YouTube video pages.

**Why:** Meets users where they already are. Reduces friction from "copy URL → open terminal → paste" to one click.

**Feasibility:** Medium-hard. Extension scaffold is straightforward but the bridge to Claude CLI (or an API endpoint) requires design decisions. Could open Raycast/terminal, or could call a local HTTP endpoint.

---

### G4. GitHub stars / backlinks campaign

**What:** Actively seek GitHub stars, get listed on awesome-lists, write a blog post, post on relevant subreddits and forums.

**Why:** Per concepts/003, comparable skills have 5K–22K installs purely through better discoverability.

**Feasibility:** Very easy. Marketing effort, not engineering.

---

## Priority Matrix

### Tier 1 — Quick wins (< 1 hour each, high daily utility)

| ID | Feature | Type |
|----|---------|------|
| B1 | Copy-to-clipboard per section | Template JS |
| B2 | Print-friendly stylesheet | Template CSS |
| B3 | Expand/collapse all outline | Template JS |
| B4 | Timestamp deep-links | Template JS |
| B8 | Reading time estimate | Render script + template |
| F3 | Lazy-load YouTube iframe | Template HTML/JS |
| G1 | Animated README demo | Non-code |

### Tier 2 — Medium effort, high impact

| ID | Feature | Type |
|----|---------|------|
| A1 | Transcript panel | Template + prompt |
| A2 | Quote extraction | Prompt + template |
| B7 | Report index page | Serve script |
| E2 | Transcript caching | Python script |
| E3 | Timestamp-range summaries | Python script + prompt |
| F4 | Error recovery UX | Template JS |
| A6 | Difficulty indicator | Prompt + template |

### Tier 3 — Larger projects, strategic value

| ID | Feature | Type |
|----|---------|------|
| A7 | Re-summarise with focus | Prompt + caching |
| C2 | Notion/Obsidian export | Template JS |
| C3 | Anki flashcard export | Template JS or script |
| C4 | Self-contained HTML | Render script |
| D1 | Picture-in-picture | Template JS |
| E1 | Batch/playlist processing | Pipeline rework |
| F1 | A/B eval framework | Test infrastructure |

### Tier 4 — Ambitious / exploratory

| ID | Feature | Type |
|----|---------|------|
| A4 | Multi-video comparison | Full new mode |
| A5 | Speaker attribution | Hard NLP problem |
| A8 | Concept map | LLM + Mermaid.js |
| B6 | Highlight + annotate | Complex UI |
| E4 | Non-YouTube platforms | Major expansion |
| G3 | Browser extension | New artifact |
