---
uid: comment-f2500ce6
id: COMMENT-1087
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-16T07:40:20.610157+00:00'
updated_at: '2026-08-16T07:40:20.610157+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-13bc38e7
  kind: note
---

Report **REPORT-2088** (`report-13bc38e7`) created — **FAIL**: 5 violations, 1 warning, 0 needs_review.

## What drifted

Four of five violations are on **STORY-84 (the fold)**, and four of six findings trace to **REQ-88** — a large, multi-round intent whose body grew by append after the story was last touched. Everything it added late is missing from the matrix.

1. **BUG-18 responsive text tracks** — the fold emits per-width keyframe tracks for varying `fontSizePx`/`lineHeightPx`/`letterSpacingPx` (`fold.ts:607-642`, applied at 1853). AC-691 states BUG-18's *root cause* as the rule: "typography axes are taken from its widest present sample."
2. **BUG-17 / REQ-88 padding** — `foldPadding` (`fold.ts:552`) and `responsivePaddingTracks` (`fold.ts:657`) are live; neither the story body nor any AC mentions padding.
3. **BUG-20/BUG-21 self-painting runs + REQ-88 captured surface rect** — a pill badge or padded control paints itself and emits no backing box (`fold.ts:1003-1029`), and a card's box is the captured `SurfaceShape` rect (`fold.ts:1610-1625`). AC-731 and the body still say every differing run folds a backing box carrying "the run's geometry" — the exact shape BUG-21 blamed for 2x-height buttons.
4. **REQ-88 viewport-height response** — the fold consumes height probes and derives `{yFactor, heightFactor}` (`fold.ts:249-287`). The story describes a width ladder only; no AC in the capability mentions viewport height.
5. **`1c repro` has no owning story** — REQ-88's materialization verb (writes the site, mirrors assets, idempotent) plus BUG-23's localization, which BUG-23 explicitly placed in `cmdRepro` and not the fold. A sweep of all 30 stories and 424 ACs found no owner; CAP-70's AC-805 covers only the background-image handle binding.
6. *(warning)* STORY-86 cites CAP-72 for the values-diff duplicate-text pairing; CAP-72 is the deprecated Behavior Module Contract capability. That pairing lives in CAP-63 / STORY-75.

Findings 1 and 3 are the sharper kind — the matrix positively *states* behaviour the intent retired, so a UAT written faithfully to either would pin the pre-fix behaviour.

STORY-86 is otherwise aligned, and the two stories pass exclusivity: the one shared concern (the fold-residual channel) is split consistently in both bodies. REQ-97/REQ-104's evaluator work is recorded in the ledger but not raised — CAP-70's STORY-81 explicitly owns the renderer↔analytic-gate mode cascade.
