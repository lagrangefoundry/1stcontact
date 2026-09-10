---
uid: comment-383fe497
id: COMMENT-2552
type: comment
title: Claude response for fix_uat_coverage report
created_by: xgd
created_at: '2026-09-10T15:50:34.126295+00:00'
updated_at: '2026-09-10T15:50:34.126295+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-dc389d54
  kind: note
---

All three violations are closed. Report: **REPORT-3753** (`report-dc389d54`).

## What I did

**Finding 1 — AC-731's three uncovered clause-clusters (uat-edit).** The evidence already existed under free-coded names; I re-attributed 10 tests to `test_UAT_AC731_*` rather than authoring a second copy, per the one-authoritative-location rule (and `fc_orphan_check.yaml`, which states FC tests get renamed to `test_UAT_AC<N>_*` once their intent is reconciled — BUG-19/20/21/REQ-88 are all `free_and_reconciled`). Test bodies untouched.

I deliberately left the two real-capture probes (`gigabytealchemy_footer`, `real_gigabytealchemy_badges`) as FC-named — both `return` early when the gitignored capture is absent, and importing a silently-skipping test into AC-731's evidence would reproduce finding 3's defect.

**Finding 2 — page-base ordering (uat-add).** Four new UATs in `tests/reconciliation-l1-fold-full-language.test.ts`. Each makes the extent rung and the count rung disagree, which the old fixture couldn't (its tallest band and most-common run fill were the same colour): tallest band beats 3-vs-1 run count; no-band → most-common run fill (with a canvas fill present to prove it isn't reached); neither → canvas; and a backdrop-only page where a 900px backdrop beats the more-common run fill (BUG-27). Verified against `tools/generate/src/l1/fold.ts:2107-2148`.

**Finding 3 — AC-694's silent Chromium return (uat-edit).** Now three layers: the unchanged `FakeDriver` contract probe; a new always-run derivation probe that evaluates the shipped `HINTS_SCRIPT` in page scope over a real jsdom document (all six dimensions computed by the extractor — ancestry, parent layout from the real cascade, authored units from the real `cssRules` scan, position, `repeatCount`, `@media`); and the engine probe hoisted to `it.skipIf(!HAS_CHROMIUM)` with `parentId`/`position`/`repeatCount` added. It now reports `↓ skipped` instead of green.

## Verification

13 files, **76 passed | 1 skipped**. The one skip is the fix — Chromium is unavailable in this sandbox, and that is now reported rather than hidden. No production source changed. `uat_coverage` set to `pass` on AC-731, AC-694 and STORY-84.

Finding 4 (eight ACs at `status: pending`) is untouched and forwarded — the report itself flags it as not this workflow's field.
