---
uid: comment-bbaf75b2
id: COMMENT-880
type: comment
title: Claude response for uat_coverage_check report
created_by: xgd
created_at: '2026-08-09T08:22:07.764683+00:00'
updated_at: '2026-08-09T08:22:07.764683+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-dd339267
  kind: note
---

Assessment complete. **REPORT-1732 (`report-dd339267`) — result: FAIL**, 5 violations / 4 warnings / 0 needs_review.

## What I did

Rebuilt the intent ledger from BUNDLE-7 → 8 → 10 → 11 (all `free_and_reconciled`), confirmed BUNDLE-13/14/16 don't touch this capability, then judged all 32 ACs and both stories independently. I ran the evidence rather than trusting the index: **6 files, 32/32 tests pass**, one `test_UAT_AC<n>_*` per AC, every one driving a real entry point with no internal mocking.

**Verdicts written** to all 35 elements: 29 AC pass, 3 AC fail (AC-689, AC-691, AC-694), both stories fail, capability fail. Only STORY-84 changed value (`stale` → `fail`).

## The five violations

Three are AC-level coverage holes, all in one file (`tests/reconciliation-l1-fold.test.ts`, untouched since 2026-07-22) and all third-offence re-raises:

- **AC-689** — the full-language clause REQ-92 added is unexercised; the `FakeDriver` fixture carries one text run and empty `items`/`fields`/`images`.
- **AC-691** — the AC turns on a height distinction (text leaves carry no keyframe height, box/image leaves pin it). The test makes *no height assertion at all*. I traced it in code: `fold.ts:1741` calls `buildGeometry(false)` for text, `true` for image/box — a regression pinning text heights would leave all 32 UATs green.
- **AC-694** — I measured `chromiumAvailable()` directly in this worktree: **`false`**. So the substantive extraction assertions never run, and the always-run path only round-trips the test's own `CANNED_HINTS` back out of the fake driver — it mocks the thing under test.

Two are story-level and are the ones **never actioned in five attempts**, because each needs the matrix edited before a UAT name can exist:

- **STORY-86** — its body claims a third envelope violation, "pinned-box content overflow". It is shipped (`probes.ts:409-415`), but no AC states it and `grep` over `tests/` finds zero assertions on it. All 16 of STORY-86's ACs pass; the story still fails on its own independent judgment.
- **STORY-84** — BUG-18's `responsiveTextTracks()` and REQ-88's `responsivePadding` are shipped and reconciled, but the body describes neither. Evidence exists in `tests/bug18-responsive-text-axes.test.ts`, but as a free-coded test traceable to no AC.

## One judgment call worth flagging

I recorded findings 6–8 (AC-691's BUG-18 clause, AC-731's BUG-14 per-run model, AC-736's over-broad wording) as **warnings, not violations**. In all three the test asserts the shipped behavior correctly and the AC prose lags it — coverage, the property this check grades, is satisfied. Grading them as violations would fail the capability on defects no UAT editor can act on, which is a plausible contributor to the loop. They're categorized `ac-edit` so the editor still sees them.
