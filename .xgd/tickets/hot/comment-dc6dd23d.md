---
uid: comment-dc6dd23d
id: COMMENT-770
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-08-07T17:04:59.848014+00:00'
updated_at: '2026-08-07T17:04:59.848014+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-415b9b22
  kind: note
---

All four actionable findings resolved in one pass — 5 mutations, 0 violations remaining.

**Root cause (findings 1, 2, 4):** REQ-118 reconciled into CAP-86 and CAP-88 but never into CAP-87, even though "click an image, pick a different one" is a gesture. One STORY-101 body rewrite fixed all three:

- Dropped `images` from Out of scope, replaced with the non-goals REQ-118 *does* still defer (framing, upload, processing)
- Restated "A form over that region's fields" kind-agnostically — the form is built from whatever the region exposes, and a region kind gaining fields reaches the operator through this loop with nothing in the gesture to change. No parallel image-gesture story; REQ-118's claim is one loop
- `CAP-84` → `STORY-98, in this capability` (CAP-84 is superseded)
- Also widened the Description's loop sentence and "The page updating", which would otherwise have re-narrowed to "the words" a line below the bullet that widened it
- Recorded `updated_by: request-66e4c630`, matching STORY-100's record of the same intent

**Finding 3 (AC-956):** the AC claimed byte-identity "without the edit channel" — falsified by the seam marker, which every channel emits. Restated as edit-channel artefacts plus the idempotence `reconciliation-edit-render-channel.test.ts:710` actually proves, and made the non-claim explicit. Retitled too; the title carried the same falsified claim.

**Finding 2's coverage gap:** added AC-1028 for the image click, including the current-handle-always-in-its-own-picker detail (a `<select>` omitting its own value silently swaps the image). Evidence tests already exist in `req118-image-selection.test.ts`; I named them in the report for the uat cycle rather than setting `uat_coverage`, since no AC on this story carries that field.

Verification: `npx vitest run tests/req118-image-selection.test.ts tests/reconciliation-edit-render-channel.test.ts` — 20 passed, 4 skipped. The skips are the WEBUI-gated origin half, the caveat already recorded in the story. The failure REQ-118 logged at `reconciliation-edit-render-channel.test.ts:316` no longer reproduces.

Two things forwarded, neither a finding: the stale index entry the assessor noted (STORY-98 still returned under CAP-84's filter — I left it alone rather than rewriting an already-correct field just to poke the index), and the uat-cycle check on `req117-copy-editing`'s AC1 exemplar. Report is `report-415b9b22`; `needs_more_work: false`.
