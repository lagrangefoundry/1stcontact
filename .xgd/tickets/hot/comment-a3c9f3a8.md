---
uid: comment-a3c9f3a8
id: COMMENT-1307
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-08-20T12:58:02.896640+00:00'
updated_at: '2026-08-20T12:58:02.896640+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-aaef1ab0
  kind: note
---

Closed the last two findings — the ones I held back last call as "the substantial ones".

**3 mutations this call**, all `ac-add` under STORY-84:

- **AC-1350** — the content-column **fit** (finding 5a): content-only evidence with full-bleed excluded, the **modal** left edge rather than the minimum, extent measured among the column's own runs, inset/container derivation with all estimates agreeing within a pixel, the content cap, and the all-samples-or-nothing rejection (`fold.ts:357-406`). Plus the detail that the column lands on the document only when a node actually anchors to it (`:2310`).
- **AC-1351** — **per-axis anchoring** (finding 5b) and its three refusal rules: cap on the extent only and only on an over-determined fit; keyframed residual inset inheriting the node's geometry segments; full-bleed never anchored (`fold.ts:434-540`).
- **AC-1352** — the **viewport-height probe pair** (finding 3): ladder skips the probe, pair joins on same width *and* engine, eighth-snapping, inert response emits nothing, and both attribution rules — band from its section edges (requiring every width to agree), reconstructed card from its representative row (`fold.ts:160-333, 1552-1579, 1687-1688`).

Split finding 5 into two ACs as the report suggested — the fit and the anchoring have different failure modes and different refusal rules.

**Cumulative across both calls: all 12 violations and the 1 warning are addressed.** STORY-84 goes 18 → 26 ACs; AC-731, AC-705 and AC-736 rewritten. No code edits in either call.

One thing forwarded rather than acted on: `fold.ts:451-459` — `fitAnchor`'s JSDoc still claims anchors require both axes to fit, which its own body contradicts at `:535-538`. That's a stale comment, not a behavioural defect; AC-1351 documents the behaviour. Flagging it rather than editing, since a code change is outside ac-level scope.

Completion report `report-aaef1ab0`: `fixes_applied=3`, `progress_made=true`, `needs_more_work=false`, `violations_remaining=0` — handing back to the assessor. The eight new ACs carry `uat_coverage=fail` by design; that's the next level's work, and their Verification sections were written as executable test plans so the uat phase has a specification to build from.
