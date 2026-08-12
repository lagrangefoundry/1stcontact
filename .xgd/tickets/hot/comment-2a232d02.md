---
uid: comment-2a232d02
id: COMMENT-946
type: comment
title: Claude response for reconciliation_uat_generation report
created_by: xgd
created_at: '2026-08-12T18:39:30.169656+00:00'
updated_at: '2026-08-12T18:39:30.169656+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-1e7986d2
  kind: note
---

Done.

## What I found

Of the story's 30 acceptance criteria, **29 already have UATs** in the existing suites (`reconciliation-copy-edit-gesture.test.ts`, `-gesture-modal`, `-form-presentation`, `-image-picker`, `req118-image-selection`). The free-coded REQ-135 commit had already amended the two rescoped criteria's tests (AC-1039, AC-1044) in place. Only the newly-added **AC-1123** had no coverage, so that is the one UAT written — writing duplicates for the other 29 would have been the "no extras" violation, not coverage.

## The UAT

`tests/reconciliation-copy-edit-parameter-sheet.test.ts` — one test, driving the real `mountEditor` / `defaultModal` / installed `webui-fields` against a real builder origin over HTTP, plus a real Chromium for the measured clause:

- **The split by descriptor, not by name or region kind** — the box/sheet partition is asserted against the descriptors the origin actually reports (`type === 'string'` vs the rest), not a hardcoded field list, so a split keyed on `text` or on the region kind would fail.
- **Sheet follows the box** in document order; Escape tears both down.
- **No words, no box** — a painted panel exposing only `backgroundImageUrl` renders a picker and no editing box.
- **Two forms, one edit** — words + a parameter changed, one POST to `/api/copy` carrying both, one `onSaved`, `changed === ['fontSizePx','text']`, read back through the real `1c copy get`; the unexposed `letterSpacingPx` axis is byte-unchanged.
- **Sheet-only edit saves** (the dirty state spans both instances); **nothing touched writes nothing** (no POST, no re-render, draft node identical).
- **Bounded and scrolling while Save stays reachable** — measured in Chromium. The viewport is derived from the sheet's own measured content rather than fixed: at a wide window four parameters never reach the `min(38vh, 340px)` ceiling, so the window is narrowed until the rows wrap and the bound genuinely binds, then `clientHeight < scrollHeight`, `overflow-y: auto`, sheet bottom inside the viewport, and Save inside the viewport and actually clicked.

Component-absent and browser-absent paths report loudly (`unverified(...)`) rather than skipping quietly, matching the sibling suites.

```
UATs generated for story story-3bf94bd4 (plan item 2 of 2)

Story: story-3bf94bd4
Test file(s) created:
  - tests/reconciliation-copy-edit-parameter-sheet.test.ts

Tests written: 1
Tests passed: 1
Tests failed: 0

test_files_created:
  - "tests/reconciliation-copy-edit-parameter-sheet.test.ts"
```

Regression scope run green: the four `reconciliation-copy-edit-*` suites + `test_UAT_FC_REQ-135_text_properties.test.ts` (31 tests) and `tests/naming.test.ts`. No runtime code and no existing test file was modified.

One item for the review step: `test_UAT_FC_REQ-135_words_sit_in_the_box_and_parameters_sit_beneath_it` in `tests/test_UAT_FC_REQ-135_text_properties.test.ts` is the FC orphan for AC-1123 and is now redundant with this UAT — it needs renaming or deletion to satisfy the FC orphan invariant.
