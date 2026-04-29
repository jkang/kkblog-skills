# video-lens Content Quality Review

## What Was Found

**The core duplication pattern across the four original sections:**

| Section | Original role | Actual behavior |
|---|---|---|
| Summary | 2–4 sentence TL;DR | States thesis + 3 top ideas |
| Takeaway | "So what?" action/principle | Restates Summary with different framing |
| Key Points | Specific claims to take away | Mirrors Summary in first 2–3 bullets, then adds more |
| Analysis | What the video means | Rewrites Key Points as prose, same order |

The Analysis section was the worst offender — functionally a prose paraphrase of Key Points. We merged it in. Summary ↔ Takeaway overlap was not addressed.

---

## What Was Changed

- **Analysis removed.** Each Key Point now carries an analytical paragraph (`<p>`) inline — headline states the claim, paragraph adds context, causality, and implications.
- Template updated: nav, CSS spacing, SECTION_TOOLTIPS, Markdown export.
- Length table updated to remove the Analysis column.

---

## Issues — All Resolved

**1. Quality guideline contradicts the format** — RESOLVED
Conciseness guideline now reads: "Two-tier contract: Key Point headlines + Summary should be scannable in 30 seconds; analytical paragraphs reward deeper engagement."

**2. Summary and Takeaway still overlap** — RESOLVED
Takeaway definition rewritten with explicit differentiation rule: "must say something the Summary does not." Includes push-past-thesis guidance for keynotes/essays.

**3. The `<p>` paragraph is mandatory on every bullet** — RESOLVED
Added conditional escape hatch: paragraph is the default, omit only for discrete facts/metrics/procedural steps where the headline already fully explains.

**4. Length table conflicts with the `<li>` pattern** — RESOLVED
Table now specifies paragraph depth (sentence counts) without rigid bullet counts. Short videos get "1–2 sentences when included" — no longer conflicts with the pattern definition.

**5. Paragraph scope bleeds across Key Points** — RESOLVED
Added scope-anchoring rule: "Each paragraph should develop its own point. Brief connections to other ideas are fine; extended discussion that belongs in a different bullet is not." Added anti-padding rule distinguishing topical overlap (fine) from depth overlap (padding).

---

## Optimizations — All Implemented

**A. Loosen Key Points count constraints** — IMPLEMENTED
Replaced rigid per-length bullet counts with "3–8 typical; content density determines the count, not video length." Table now governs paragraph depth only.

**B. Fix the Takeaway's relationship to Summary** — IMPLEMENTED
Takeaway definition completely rewritten with explicit non-overlap constraint.

**C. Make the `<p>` paragraph conditional** — IMPLEMENTED
Added conditional guidance with tight escape hatch. "Not because analysis would be difficult, but because it would genuinely add nothing" blocks lazy omission.

**D. Add video-type awareness to section guidance** — IMPLEMENTED
Added two inline rules to Key Points: step-by-step procedures → concrete/reproducible detail; conversations/interviews → guest's non-obvious opinions over thesis synthesis. Lighter than a classification table, blends naturally for hybrid videos.

**E. Add a brief anti-padding test** — IMPLEMENTED
Added: "Each Key Point must add substance beyond what the Summary and Takeaway provide. Covering the same topic with new depth or specifics is expected; restating the same claim at the same level of detail is padding." Distinguishes topical overlap from depth overlap.
