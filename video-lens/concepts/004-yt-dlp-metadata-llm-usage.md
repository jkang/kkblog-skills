# 004 — yt-dlp Metadata → LLM Usage (v2)

> Evolved from `concepts/yt-dlp-metadata-llm-usage.md`. Incorporates counterarguments and unresolved questions from a review session. This document is the starting point for implementation — read it instead of v1.

---

## Status quo

The skill already passes two yt-dlp signals to the LLM:

- **`YTDLP_DESC_HTML`** — video description (creator-written)
- **`YTDLP_CHAPTERS`** — chapter data (JSON array of `{start_time, title}`)

Current SKILL.md guidance has three structural problems:

1. **Duplication.** Description guidance appears twice in nearly identical form (Step 2b line ~201 and Step 3 intro line ~213). Neither instance gives section-specific hooks.
2. **Vagueness.** "Use where it adds substantive information" is not actionable. The LLM has no criteria for deciding when description content is substantive vs. noise.
3. **Chapters are Outline-only.** Chapter data is only used to anchor the Outline. Its signals about vocabulary, depth, and structure are ignored for Key Points, Takeaway, and Summary.

---

## What these inputs carry

### Description

The description is the creator speaking *about* their content (intent), vs. the transcript which is the creator speaking *within* their content. It contains:

| Content type | Example | Potential use |
|---|---|---|
| Opening framing | "In this video I argue that..." | Summary — verify thesis |
| Explicit outcomes | "You'll learn X, Y, Z" / "Key lesson:" | Takeaway — creator's stated intent |
| Named entities | Frameworks, tools, books, people | Key Points — explicit creator vocabulary |
| Timestamp lines | `0:00 Intro` / `5:30 Topic X` | Outline — fallback chapters |
| Promotional copy | Subscribe CTAs, hashtags, affiliate links | Discard |

### Chapters

| Signal | Implication |
|---|---|
| Chapter titles | Creator's own vocabulary for segments |
| Relative chapter length | Depth signal: longer chapters warrant more coverage |
| Last chapter(s) | Often contain conclusion — Takeaway signal |
| Chapter count | Rough lower bound for Key Points |

---

## Proposed changes (from v1)

### Change 1: Trim Step 2b to parse-only

Remove LLM guidance from the description bullet. Step 2b is a parsing step — it should say *what the data is*, not *how to use it*.

### Change 2: Remove duplicate in Step 3 intro

Delete the paragraph starting "When `YTDLP_DESC_HTML` is non-empty..." (line ~213).

### Change 3: Add `#### Using yt-dlp metadata` subsection in Step 3

Insert before "Produce these four sections:" with section-specific hooks:

- **Summary:** Use description's opening framing to verify/sharpen the thesis sentence.
- **Takeaway:** If description includes "you'll learn..." or "key lesson:" language, match or build on it.
- **Key Points:** Mine description for named frameworks, tools, people — include when they appear substantively in transcript.
- **Outline (fallback):** If chapters are empty but description has timestamp lines, use those as chapter anchors.
- **Discard list:** Promotional copy, affiliate links, hashtag blocks, subscribe/follow/like CTAs, boilerplate.
- **Chapter guidance:** Use chapter titles as preferred vocabulary in Key Points; let chapter length signal depth; check final chapter for Takeaway.

Full proposed text is in `concepts/yt-dlp-metadata-llm-usage.md` under "Change 3".

---

## Counterarguments

These challenges were raised during review. None are resolved — they need to be addressed before implementing.

### 1. The LLM may already filter noise well with vague instructions

The current vague guidance ("disregard promotional copy") might work *because* it's vague. LLMs handle "ignore the junk" as a general instruction reasonably well. Adding section-specific hooks like "use the description's opening lines for Summary thesis" could *increase* noise leakage by telling the LLM to actively mine the description rather than passively filtering it.

**Risk:** We go from "mostly ignore bad descriptions" to "actively try to extract value from bad descriptions."

### 2. Most descriptions are worthless — is the complexity justified?

A large fraction of YouTube descriptions are 90%+ promotional garbage. For these videos, we add ~30 lines of detailed SKILL.md instructions that accomplish nothing — the LLM reads them, processes them, and finds nothing to apply. That's wasted prompt budget and added cognitive load on every run for a signal that only helps on a minority of videos.

**Question:** What's the actual distribution of description quality across videos users run through the skill?

### 3. "Verify or sharpen the thesis" is risky with clickbait

Many creators write clickbait descriptions that don't match content. "I'll reveal the ONE secret that..." could bias the Summary toward sensationalism even with "verify" language. The word "verify" implies the description is likely correct — it's more of a nudge than a gate.

**Mitigation needed:** Stronger language that treats the description as a *hypothesis* to check against transcript evidence, not a claim to verify.

### 4. Chapter vocabulary might reduce quality

Creator-chosen chapter titles are often SEO-optimized, vague ("The Truth About X"), or styled for clicks rather than clarity. Instructing the LLM to *prefer* these as "vocabulary for Key Points" could produce worse terminology than what the LLM would naturally synthesize from the transcript.

**Risk:** We're privileging creator marketing language over the LLM's ability to name concepts clearly.

### 5. "Each substantial chapter → at least one Key Point" creates forced padding

This rule structurally couples chapters to key points. A video might have 8 chapters but only 4 genuinely important ideas. The current approach — let content density drive key point count (3–8 bullets) — is arguably better. Forcing chapter→key-point mapping could produce filler.

**Recommendation:** Drop this rule, or soften to "use chapter count as a *rough signal*, not a minimum."

### 6. Is there evidence the current approach actually fails?

The concept doc identifies structural problems (duplication, vagueness). But are current outputs actually degraded by this? If outputs are already good, restructuring the prompt is risk without demonstrated reward. This is the most fundamental question.

**Action needed:** Run 3–4 diverse videos through the current skill and evaluate whether description/chapter signals are being underutilised in practice. Compare against what the proposed changes would produce.

### 7. Timestamp fallback parsing is fragile

Asking the LLM to detect timestamp patterns in free-text descriptions is error-prone. Descriptions use inconsistent formatting and false positives could produce a broken outline. This is the lowest-value, highest-risk change.

**Recommendation:** Drop the timestamp fallback or implement it as a structured pre-processing step outside the LLM (in the yt-dlp wrapper), not as a prompt instruction.

---

## Revised recommendation

The v1 concept doc's analysis is sound — the structural problems are real. But the counterarguments suggest a more cautious implementation:

### Implement with confidence
- **Change 1** (trim Step 2b) — pure cleanup, no risk
- **Change 2** (remove duplicate) — pure cleanup, no risk

### Implement with modifications
- **Change 3** (section-specific hooks) — implement but:
  - Soften description guidance: treat it as a hypothesis, not a source to verify
  - Drop "each chapter → at least one Key Point" rule
  - Make chapter vocabulary a suggestion, not a preference
  - Add an escape hatch: "If the description is mostly promotional, skip it entirely"

### Defer or drop
- **Timestamp fallback** — fragile; defer until there's evidence of demand
- **Chapter→Key Point minimum** — creates padding; drop

### Before implementing anything
- **Test first.** Run 3–4 videos with diverse description quality through the current skill. Identify concrete examples where output would improve with the proposed changes. Without evidence, this is an aesthetic refactor.

---

## Files to edit (when ready)

- `skills/video-lens/SKILL.md` — only file changed
- Run `task install-skill-local AGENT=claude` after editing to test
- Run `task install-skill` after pushing to deploy
