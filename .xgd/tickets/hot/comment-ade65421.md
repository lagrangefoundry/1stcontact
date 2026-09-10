---
uid: comment-ade65421
id: COMMENT-2631
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-09-10T23:14:27.734596+00:00'
updated_at: '2026-09-10T23:14:27.734596+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-657d1e9a
  kind: note
---

Report filed: **REPORT-3814** (`report-657d1e9a`) — **FAIL**, 2 violations / 3 warnings / 0 needs_review, `level=ac`, subject `capability-12fee326`.

## Verdict

**FAIL.** Both violations sit on STORY-101's ACs, both are the same drift shape, and **both were already named or deferred by the previous ac-level cycle** (report-20d419a4, 2026-08-16) and never repaired — the store holds no ac-level fix report at all, only story-level ones.

**V1 — AC-1028** (`acceptance_criterion-26ffac6d`, `ac-edit`): still says *"Framing (crop, scale, scrim, rotation, position), upload and image processing are not offered"*. REQ-136 (`free_and_reconciled`, merged `a23c4c51`) offers four of those five through this dialog — verified in code: `copyFieldsOf` returns `src`, `alt`, then `...framing.fields` (`packages/site-schema/src/l1/edit.ts:987-1005`), and `imageFramingFields` (`:823-860`) supplies Fill mode, Pan across/down, Shape, Corner rounding, Rotate (°), Scale (%) plus the colour adjustments. Three layers contradict the AC: the rewritten story body, its out-of-scope list (only zoom/crop, scrim, surface-background framing, drag handles), and **AC-1135 in the sibling story**, which requires rotation and framing to paint identically in both channels. `updated_at` is 39 minutes *before* the report that named it.

**V2 — AC-1140** (`acceptance_criterion-b04cbb23`, `ac-edit`): its Verification asserts *"the run's colour and family, which the sheet has no control for at all"*. REQ-140 gave the run's colour a control in the sheet (`edit.ts:969-984`, `colorField` → *Text colour*), and AC-1279 and AC-1123 both say so explicitly. The previous report flagged this parenthetical and deferred it to "REQ-140 reconciliation"; REQ-140 reconciled 2026-08-15 and the AC was never revisited. The stale claim has already propagated into the test layer verbatim (`tests/reconciliation-copy-edit-live-preview.test.ts:620-622`).

## Two things the editor must not do

- **Don't repair these on the story bodies.** Both were rewritten at 22:59Z and passed story level at 23:07Z. On these two subjects the body is correct and the AC is stale.
- **Don't narrow AC-1050, AC-1037 or AC-1038.** Those three run the *other* way — body thin, AC correct — and are already logged as story-level warnings (report-1321eb22 findings 1 and 2). I recorded them as findings 7 and 4 precisely so they don't get "resolved" by deprecating correct ACs.

STORY-98's 14 ACs are fully aligned — no finding. The previous cycle's AC-1138 violation **is** repaired and verified (finding 6); only its test *name* lags (warning 5). The repeating pattern across five cycles is the closed enumeration: an AC copying the output of a field-derivation this story doesn't own.
