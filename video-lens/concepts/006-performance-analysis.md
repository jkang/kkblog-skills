# Performance Analysis — video-lens Runtime

## Context

A 15-minute German YouTube video (BMW i3 Neue Klasse review) was processed through the full video-lens skill pipeline on 2026-03-19. Total wall-clock time: ~5 min 50 sec. This document records the breakdown, root causes, and proposed optimizations for future development work.

---

## Execution Summary

| Item | Detail |
|---|---|
| Video | BMW i3 Neue Klasse review (German, ~15 min) |
| Total runtime | ~5 min 50 sec |
| Tool chain | `fetch_transcript.py` → `fetch_metadata.py` → Claude content generation + heredoc → HTML write → gallery index update |
| Transcript source | YouTube auto-captions via `youtube-transcript-api` |
| Metadata source | `yt-dlp` |

---

## Time Breakdown

| Step | Phase | Estimated duration | % of total |
|---|---|---|---|
| 1 | `fetch_transcript.py` (transcript fetch + disk write) | ~20 sec | ~6% |
| 2 | `fetch_metadata.py` (yt-dlp metadata fetch + disk write) | ~25 sec | ~7% |
| 3 | Claude content generation + heredoc injection | ~4 min 30 sec | ~77% |
| 4 | HTML file write to disk | ~5 sec | ~1% |
| 5 | Gallery index update | ~30 sec | ~9% |

Steps 1 and 2 run **sequentially** despite being fully independent, adding ~45 seconds of avoidable wait.

---

## Root Cause Analysis

### Why Step 3 dominates (~77% of runtime)

Step 3 is a single synchronous Claude API call that must:

1. **Receive a large input context** — the full transcript (~15 min of speech) plus metadata JSON, injected inline via a shell heredoc. A 15-min German video produces roughly 3,000–5,000 words of transcript text. This alone is a substantial prompt.
2. **Generate a large output** — Summary, Takeaway, 6–8 Key Points each with analytical paragraphs, a full timestamped outline (often 15–25 entries), and Language metadata. This is a high token count response.
3. **Use heredoc injection** — the transcript and metadata are passed as raw text embedded in a shell `cat <<'EOF'` block rather than via a structured file read. This is not slower per se, but it tightly couples the prompt construction to the shell layer and makes the content volume harder to cap or paginate.

The combination of high input volume + high output volume + a single blocking API call means this step cannot be faster without either reducing content, parallelizing output, or splitting into sub-tasks.

---

## Optimization Proposals

### Fix 1 — Parallelize `fetch_transcript.py` and `fetch_metadata.py`

**What:** Run both Python scripts concurrently using `&` + `wait` in the skill shell layer, or issue both as parallel Bash tool calls.

**Why it works:** The two fetches are completely independent (different data sources, different output files). Today they run sequentially, wasting ~20–25 sec of pure wait time.

**Effort:** Low — a two-line shell change (`&` + `wait`), or two parallel `Bash` tool calls.

**Impact:** High — saves ~20–25 sec unconditionally on every run.

---

### Fix 2 — Replace heredoc with Write tool → temp JSON file

**What:** Instead of embedding the transcript and metadata inline in a heredoc shell command, write them to a temp JSON file first (using the `Write` tool), then pass the file path to the prompt.

**Why it works:** The heredoc approach embeds potentially thousands of words directly into a shell command string. This is brittle (quoting edge cases, shell escaping), and obscures the content volume from the skill logic. A structured file read decouples prompt construction from content size, makes the content inspectable, and opens the door to truncation or summarization before injection.

**Effort:** Medium — requires restructuring the prompt construction step and updating the skill's tool call sequence.

**Impact:** Medium — does not reduce API latency directly, but enables Fix 3 and improves reliability.

---

### Fix 3 — Cap content volume for short and medium videos

**What:** Truncate or summarize the transcript before injection based on video length. For videos under 20 minutes, cap the injected transcript at a token budget (e.g. 4,000 words / ~5,500 tokens). For videos under 10 minutes, reduce the Key Points count from 6–8 to 4–5 and the outline entry count proportionally.

**Why it works:** The current prompt sends the full transcript regardless of video length. A 15-minute video does not need the same depth of outline as a 90-minute conference talk. Reducing input + output token volume is the most direct lever on Step 3 latency.

**Effort:** Medium — requires length-aware prompt construction and updated length guidelines in the skill instructions.

**Impact:** High — for short/medium videos, could reduce Step 3 latency by 30–50%.

---

### Fix 4 — Sub-agent parallel content generation (optional, complex)

**What:** Split the content generation step into parallel sub-agent calls: one for Summary + Takeaway + Language, one for Key Points, one for the Timestamped Outline. Merge outputs before HTML render.

**Why it works:** The three output sections are largely independent once the transcript is available. Parallel generation could halve Step 3 wall time.

**Effort:** High — requires redesigning the skill architecture, handling merge logic, and managing sub-agent context passing. Risk of output inconsistency (e.g. outline and key points referencing different framings of the same topic).

**Impact:** Very high in theory (~50% of Step 3), but complexity and consistency risks make this a later-stage optimization. Not recommended until Fixes 1–3 are validated.

---

## Projected Impact

| Fix | Time saved | New estimated total | Notes |
|---|---|---|---|
| Fix 1 (parallelize fetches) | ~20–25 sec | ~5 min 25 sec | Safe, unconditional saving |
| Fix 2 (temp JSON file) | ~0 sec direct | — | Enabler for Fix 3 |
| Fix 3 (cap content volume) | ~1 min 20 sec–2 min 15 sec | ~3 min 10 sec–3 min 45 sec | Estimate for 15-min video; assumes 30–50% Step 3 reduction |
| Fix 4 (parallel sub-agents) | ~1 min–2 min | ~2 min 10 sec | High variance; not recommended yet |
| **Fixes 1–3 combined** | **~1 min 40 sec–2 min 40 sec** | **~3 min 10 sec–4 min 10 sec** | **Recommended target** |

---

## Recommendation

Implement **Fixes 1–3** in order:

1. **Fix 1** first — lowest effort, highest certainty, zero risk of regression.
2. **Fix 2** second — structural refactor that unlocks Fix 3 and improves maintainability.
3. **Fix 3** third — tune content caps against a sample of short (< 10 min), medium (10–30 min), and long (> 30 min) videos to validate quality is not degraded.

Hold **Fix 4** for a future cycle after the simpler wins are measured in production.
