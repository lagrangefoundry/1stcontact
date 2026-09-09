---
uid: comment-9279c568
id: COMMENT-2374
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-09-09T23:32:34.802054+00:00'
updated_at: '2026-09-09T23:32:34.802054+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-7617e6fa
  kind: note
---

Done. **8 mutations**, closing all 11 violations and all 3 warnings from REPORT-43e0f0f2. Completion report: **REPORT-3581** (`report-7617e6fa`), `needs_more_work: false`.

## What changed

**Consistency (findings 9–12)** — the cheap, long-carried ones:
- **STORY-124**: `Filed under CAP-102` → `CAP-63`. This is the defect CAP-63's own body predicted would keep resurfacing as an overlap cluster until a step permitted to edit content fixed it.
- **CAP-63 Scope bullet 4**: REQ-89's conditional Astro-container clause replaced with REQ-150's unconditional form, matching STORY-79 guarantees 4/5.
- **STORY-76**: the authoring half is now marked superseded legacy (REQ-84 deleted the host modules; `resolveSurfaceGradient` has zero production callers), with the live L1 axis routed to CAP-70. Paired in the same call with **AC-637** deprecated — it was carrying an invented `lifecycle: deprecated` while still `status: active`, so it was still counted; the top-level enum is now set.
- Retired capability names scrubbed from all five pre-consolidation stories.

**Coverage (findings 1–8)** — eight live behaviours that no story described:
- **STORY-75** gains five closures placed where the related content lives, not appended: per-text-node run geometry (BUG-25) into item 1, split-control surface attribution (BUG-22) into item 4, the band overlay read through the colour probe (BUG-24) before item 9's exclusion that depends on it, the offline re-extract (BUG-16) at the head of item 7 — with the fontLoad correction reworded as the *remainder after* it, resolving the tension the assessor flagged — and the adjacent-row `gap` axis (REQ-73) with its band-padding supersession.
- **STORY-76** gains REQ-72 as item 0: in-browser hex resolution, framed as the precondition the stop-position axis stands on.
- **STORY-77** absorbs the largest unowned surface — ladder persistence, `--multi-viewport`, `--collapse`, and finding 7's previously unhomed `--clusters`. I homed clustering here rather than on STORY-75 (the report left the choice open) because `formatClusterReport` calls `collapseMultiViewport` on its first line; the three views are one stack.

**Fields (finding 13)**: BUNDLE-10 (`bundle-4ff83a8b`) now appears on a story for the first time anywhere in the matrix — the assessor's named systemic root under findings 2–5.

No code edits; the assessor recorded no `code-issue` findings. I did re-read `fidelity.ts:429-530` and the REQ-73 sites in `values-diff.ts` directly so the added text states landed behaviour rather than paraphrasing the report. All eight writes were read back and asserted programmatically — retired strings absent, new strings present, all passing.

One item forwarded for level=ac: **AC-638** is an authoring criterion on the same superseded content-field path as the deprecated AC-637. I left it active because the finding named only AC-637 and validating a value's shape isn't the same claim as rendering it on a deleted module — but it deserves a look rather than a silent deprecation from me.
