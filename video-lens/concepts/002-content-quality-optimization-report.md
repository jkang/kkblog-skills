# Content Quality Optimization Report

## Executive Summary

This report documents the investigation, design decisions, and implementation of quality optimizations to the video-lens SKILL.md prompt. Five structural issues were identified in the current output quality, five optimization strategies were evaluated, and a final implementation was selected that balances output quality against prompt complexity. All changes target Step 3 (content generation rules) and one consistency fix in Step 5 (template values table), totalling ~+10 lines — a deliberately minimal footprint.

---

## Background

The video-lens skill generates structured HTML reports from YouTube transcripts: a Summary, Takeaway, Key Points (with analytical paragraphs), and a timestamped Outline. A prior round of work merged the standalone Analysis section into Key Points as inline `<p>` paragraphs, eliminating the most egregious duplication (Analysis was a prose paraphrase of Key Points in the same order). However, that merge introduced new structural tensions and left the Summary/Takeaway overlap unaddressed.

---

## Issues Investigated

### Issue 1: Quality guideline contradicts the enriched format

**Problem:** The Conciseness guideline stated *"The Summary + Key Points should be scannable in 30 seconds."* After merging Analysis into Key Points, each bullet now carries a 2–4 sentence analytical paragraph. The 30-second scanability promise was no longer achievable for the full section — only for the headlines.

**Impact:** Low direct impact on output quality (the model doesn't literally time itself), but the contradiction creates ambiguity. A model trying to honour 30-second scanability might produce shallower paragraphs to keep total length down, undermining the purpose of the merge.

**Approaches considered:**
- *Remove the guideline entirely.* Risk: no scanability anchor at all; output length drifts upward over time.
- *Rewrite as a two-tier contract.* The headlines + Summary serve the "scan in 30 seconds" use case; paragraphs serve the "deep read" use case. This matches the actual template UX where paragraphs are visually secondary.

**Decision:** Two-tier contract. It preserves a concrete scanability target while honestly describing the format's structure. The added clause "Every sentence must earn its place" retains pressure against bloat.

---

### Issue 2: Summary and Takeaway convergence

**Problem:** For thesis-driven videos (keynotes, essays, opinion pieces), the Summary states the central argument and the Takeaway restates it in slightly different words. The prior Takeaway definition — *"key conclusion or lens to retain"* — is exactly what a good Summary already provides.

**Evidence:** In test outputs, the Summary listed a set of core qualities/principles and the Takeaway listed the same qualities with minor rephrasing. The two sections were functionally interchangeable.

**Approaches considered:**

| Approach | Pros | Cons |
|---|---|---|
| **A. Delete the Takeaway section entirely** | Eliminates overlap by design; simpler template | Loses the "so what?" framing that adds value for non-thesis videos (tutorials, interviews); requires template changes |
| **B. Merge Takeaway into Summary** (add a final sentence) | Single coherent block; no repetition | Overloads the Summary; loses the distinct visual callout in the template |
| **C. Redefine Takeaway with explicit differentiation rule** | Preserves both sections with distinct roles; no template changes | Relies on the model following the non-overlap instruction faithfully |
| **D. Make Takeaway conditional** (only render when distinct from Summary) | Avoids forced content; clean when absent | Adds branching logic to prompt and template; inconsistent report structure |

**Decision:** Approach C — explicit differentiation. The Takeaway was rewritten to require naming *"a concrete action, a non-obvious implication, or the one consequence worth remembering"* with the hard rule *"Never restate what the Summary already says."* For thesis-heavy videos where the thesis IS the takeaway, the prompt instructs: push past it — name a specific scenario where it applies or state what happens if you ignore it. This forces the model one level deeper rather than allowing paraphrase.

**Why not A or D:** The Takeaway section has genuine value in the template as a visually distinct callout. Removing it or making it conditional would require template changes and lose the consistent report structure users expect.

**Trade-off acknowledged:** This relies on the model's ability to find genuine differentiation. For extremely narrow single-thesis videos, the Takeaway may still feel adjacent to the Summary — but "adjacent with new specificity" is a significant improvement over "identical with different phrasing."

---

### Issue 3: Rigid Key Point counts tied to video length

**Problem:** The Length-Based Adjustments table prescribed rigid bullet counts by duration: 3–5 for short, 5–7 for medium, 5–7 for long, 6–7 for very long. This doesn't reflect how videos actually work:

- A 30-minute interview might contain 3 genuinely distinct ideas — forcing 5–7 bullets produces padding
- A 10-minute technical tutorial might pack 8 discrete techniques — capping at 3–5 loses content
- A 90-minute lecture might have 4 big ideas, each needing deep paragraphs — forcing 6–7 creates shallow coverage

**Approaches considered:**

| Approach | Pros | Cons |
|---|---|---|
| **A. Remove all count constraints** | Maximum flexibility; content-driven | Unpredictable variance; some runs produce 2 bullets, others 12; no quality floor |
| **B. Replace with a single soft range (3–8)** | Content-driven with guardrails; 3 prevents trivially short output, 8 prevents walls of text | Doesn't prevent all edge cases; model might default to middle of range |
| **C. Keep the table but widen ranges** (e.g. 3–8 for all lengths) | Familiar format; per-length guidance | Still ties count to length, just more loosely; doesn't solve the conceptual problem |
| **D. Use content-density heuristic** (e.g. "one bullet per major distinct idea") | Directly addresses the root cause | Too vague; no actionable guardrails for the model |

**Decision:** Approach B — soft range of 3–8 with the principle *"content density determines the count, not video length."* The table was repurposed to govern paragraph depth only (sentence counts scale with video length, since longer videos provide more material for deeper analysis). A note below the table reinforces: *"Key Point count is governed by content density (3–8 typical), not video length."*

**Why not A:** Removing all constraints was considered but rejected due to variance risk. In testing, unconstrained models occasionally produce 2 bullets for a 45-minute video or 11 for a 10-minute one. The 3–8 guardrails prevent both failure modes without imposing the rigidity that caused the original problem.

**Design insight:** The key realization was separating two concerns that were conflated in the original table: *how many bullets* (content-driven) vs. *how deep each paragraph* (length-driven, because longer videos provide more context to draw from). The revised table handles depth; the definition handles count.

---

### Issue 4: Mandatory analytical paragraphs and table conflicts

**Problem:** Two related tensions:
1. The `<li>` pattern specified *"2–4 sentence analytical paragraph"* as mandatory, but some bullets are self-contained facts, metrics, or procedural steps where a paragraph adds nothing.
2. The length table said short videos get *"1–2 sentence paragraphs"* — but 1 sentence is not meaningfully a "paragraph" and conflicts with the pattern's "2–4 sentence" specification.

**Approaches considered:**

| Approach | Pros | Cons |
|---|---|---|
| **A. Make `<p>` fully optional** (model decides) | Maximum flexibility | Risk of lazy output — model skips 4 of 5 paragraphs to save effort; undermines the analysis depth that justifies the format |
| **B. Keep mandatory, reduce minimum to 1 sentence** | Consistent structure; addresses the table conflict | Forces padding on self-contained facts; "1-sentence paragraph" is a contradiction in terms |
| **C. Default mandatory with tight escape hatch** | Preserves depth as the norm; allows omission only for a specific narrow category | Relies on model judgment to distinguish "genuinely adds nothing" from "analysis would be difficult" |
| **D. Make conditional based on video length** (short = optional, long = mandatory) | Simple rule; addresses the short-video problem | Doesn't solve the conceptual problem — a long video can also have self-contained facts |

**Decision:** Approach C — paragraph as default with a tight escape hatch. The added guidance reads: *"Omit it only when the bullet is a discrete fact, metric, or procedural step that the headline already fully explains — not because analysis would be difficult, but because it would genuinely add nothing."*

**Key design choice:** The clause *"not because analysis would be difficult, but because it would genuinely add nothing"* explicitly blocks the laziness escape route. Without it, the model could rationalize skipping any paragraph by claiming the headline is "already clear." The positive framing (discrete fact/metric/procedural step) gives a concrete category to match against rather than a subjective judgment call.

**Table resolution:** The revised table specifies *"1–2 sentences when included"* for short videos, resolving the conflict by acknowledging that paragraphs may not appear on every bullet while still providing depth guidance when they do.

---

### Issue 5: Paragraph scope bleed across Key Points

**Problem:** Analytical paragraphs had no constraint against discussing content that belongs in other Key Points. In test outputs, KP #1 ("Renaissance Developer framework") used its paragraph to pre-explain KPs #6 and #7, recreating intra-section duplication — the same content appeared twice in different bullets.

**Approaches considered:**

| Approach | Pros | Cons |
|---|---|---|
| **A. Hard isolation** ("never reference other Key Points") | Eliminates scope bleed completely | Creates artificially siloed bullets; prevents useful cross-references that create coherence |
| **B. Soft anchoring** ("develop your own point; brief connections fine, extended discussion not") | Prevents scope bleed while preserving coherence | Requires model judgment on "brief" vs. "extended" |
| **C. Post-generation deduplication instruction** ("after generating all Key Points, remove duplicated content") | Catches all duplication | Adds complexity; model may not effectively self-edit; risks removing useful reinforcement |

**Decision:** Approach B — soft scope anchoring. Two rules were added:

1. *"Each paragraph should develop its own point. Brief connections to other ideas are fine; extended discussion that belongs in a different bullet is not."* — This prevents scope bleed while allowing natural cross-references.

2. *"Each Key Point must add substance beyond what the Summary and Takeaway provide. Covering the same topic with new depth or specifics is expected; restating the same claim at the same level of detail is padding."* — This is the anti-padding rule, carefully worded to distinguish topical overlap (expected and fine) from depth overlap (padding).

**Critical nuance in the anti-padding rule:** An earlier formulation was *"if a Key Point only restates what the Summary says, delete it."* This was rejected because it would cause the model to avoid the video's central themes entirely — Key Points SHOULD develop what the Summary introduces, just with more depth and specificity. The final wording explicitly permits topical overlap while prohibiting depth-level restatement.

---

### Optimization: Video-type awareness for Key Points

**Problem:** The Summary section already had type-aware guidance (distinguishing opinion/analysis from instructional content), but Key Points was written as if all videos are idea-driven talks. A tutorial's Key Points should read like a recipe; an interview's Key Points should surface the guest's non-obvious claims — but the prompt gave no such guidance.

**Approaches considered:**

| Approach | Pros | Cons |
|---|---|---|
| **A. Full classification table** (5 video types × 2 columns: what Summary should do, what Key Points should do) | Comprehensive; covers keynotes, interviews, tutorials, news, debates | +10 lines for the table alone; misclassification risk for hybrid videos (a tutorial with interview segments); model must first classify then follow the right row |
| **B. Inline type-aware rules** (extend the existing pattern of "When the video introduces named frameworks...") | Lightweight (+2 lines); blends naturally for hybrid videos; no classification step | Doesn't cover all types (news, debates); less systematic |
| **C. Conditional sections** (different Key Points templates per video type) | Maximum type-awareness | Massive prompt complexity; classification errors cascade into wrong template |

**Decision:** Approach B — two inline rules added to the existing Key Points rules list:

1. *"When the video teaches step-by-step procedures or techniques, list them with enough detail to reproduce — concrete and actionable, not abstractly summarised."*
2. *"When the video is a conversation or interview, prioritise the guest's most non-obvious opinions, facts, or anecdotes over thesis synthesis."*

**Why not A:** The 5-row classification table was the original plan, but analysis of the failure mode — misclassification of hybrid videos — revealed a fundamental problem. A video that's 60% tutorial and 40% interview would need to be classified into one row, losing guidance for the other aspect. Inline rules activate independently based on content characteristics, not a single classification decision. They compose naturally: a tutorial-interview hybrid triggers both rules simultaneously.

**Coverage trade-off:** This approach doesn't explicitly cover news/explainer or debate/panel videos. This was accepted because: (a) those types are less common in the user's workflow, (b) the existing generic rules handle them adequately, and (c) adding rules for every type would approach the complexity of the table without its systematic structure. The two rules added cover the two most common failure modes observed in test outputs.

---

## Implementation Summary

### What changed in SKILL.md

| Location | Change | Lines added |
|---|---|---|
| Line 228 | Takeaway definition rewritten with differentiation rule | ~+2 net |
| Line 230 | Key Points count: "3–8 typical; content density determines count" | ~0 net (replacement) |
| After line 234 | Conditional `<p>` guidance with tight escape hatch | +1 |
| Lines 237–245 | Four new rules: two video-type, one scope-anchoring, one anti-padding | +4 |
| Line 264 | Conciseness guideline → two-tier contract | ~0 net (replacement) |
| Lines 272–279 | Revised table: paragraph depth only, no bullet counts; density note | +1 net |
| Line 323 | Step 5 KEY_POINTS row: reflects conditional paragraphs | ~0 net (replacement) |

**Total: ~+10 lines.** Lighter than the original plan's +18 because inline rules replaced the classification table.

### What did NOT change

- **Steps 1, 2, 2b, 4, 6** — Transcript fetching, metadata extraction, yt-dlp enrichment, filename generation, serve-and-open. No changes needed.
- **Template (template.html)** — No structural changes required. The conditional paragraph omission works within the existing `<li>` structure.
- **Summary guidance** — Already had adequate type-awareness (opinion/analysis vs. instructional).
- **Outline guidance** — No issues identified.
- **Error handling** — Unrelated to content quality.
- **Quality guidelines** (except Conciseness) — Accuracy, Faithfulness, Structure, Language fidelity, and Style remain unchanged.

### Step 5 consistency fix

The values table in Step 5 described KEY_POINTS as *"5–7 `<li>` tags... followed by a `<p>` analytical paragraph (2–4 sentences)"*. This was updated to *"`<li>` tags... each followed by a `<p>` analytical paragraph (may be omitted for discrete facts/steps)"* to align with the new conditional paragraph rule and content-driven count.

---

## Design Principles

Several principles guided the final decisions:

1. **Tight defaults with narrow escape hatches over loose guidelines.** The paragraph is mandatory by default; omission requires matching a specific category (discrete fact/metric/procedural step) AND passing a motivation test ("not because analysis would be difficult"). This prevents lazy degradation while allowing legitimate flexibility.

2. **Separate orthogonal concerns.** Bullet count (content-driven) and paragraph depth (length-driven) were conflated in the original table. Separating them allows each to be governed by its natural driver.

3. **Composition over classification.** Inline video-type rules that activate independently compose better for hybrid videos than a classification table that forces a single category assignment.

4. **Distinguish topical overlap from depth overlap.** The anti-padding rule explicitly permits Key Points to develop the same topics as the Summary — they should! — while prohibiting restatement at the same level of depth. This prevents the failure mode where the model avoids central themes to satisfy a naive "don't repeat the Summary" instruction.

5. **Minimal prompt footprint.** Every added line must address a demonstrated failure mode. The +10 line budget was a constraint, not an accident. Prompt complexity has diminishing returns and eventually degrades output quality as instructions compete for attention.

---

## Risk Assessment

| Risk | Likelihood | Mitigation |
|---|---|---|
| Model still produces Summary/Takeaway overlap for narrow single-thesis videos | Medium | The "push past it" instruction provides a concrete strategy; complete elimination may not be possible for all content |
| Model over-uses the paragraph escape hatch, producing mostly headline-only bullets | Low | The "not because analysis would be difficult" clause and "default" framing create strong pressure toward inclusion |
| Key Point count clusters at 5 (middle of 3–8 range) regardless of content | Medium | The explicit "content density determines the count" instruction and removal of per-length counts reduce anchoring; some default-to-middle tendency is expected |
| Scope-anchoring rule makes paragraphs feel disconnected | Low | "Brief connections to other ideas are fine" explicitly permits cross-references |
| Video-type rules don't cover edge cases (news, debates) | Low | Generic rules handle these adequately; the two added rules cover the most common observed failure modes |

---

## Conclusion

The five structural issues identified in the content quality review have all been addressed through targeted prompt modifications. The approach consistently favoured tight defaults with narrow escape hatches over loose guidelines, separated conflated concerns, and preferred compositional rules over classification systems. The total change footprint of ~+10 lines reflects a deliberate design constraint: every added instruction must address a specific, demonstrated failure mode without competing with existing prompt guidance for model attention.
