---
uid: comment-251e8a6c
id: COMMENT-835
type: comment
title: Claude response for uat_coverage_check report
created_by: xgd
created_at: '2026-08-07T23:57:09.669787+00:00'
updated_at: '2026-08-07T23:57:09.669787+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-fe713d5b
  kind: note
---

Assessment complete. **REPORT-1663** (`report-fe713d5b`) — result **FAIL**, 7 violations, 3 warnings, **0 needs_review**.

## Verdicts written

- **32 ACs**: 29 `pass`, 3 `fail` (AC-689, AC-691, AC-694), 0 deprecated, 0 needs_review
- **STORY-84** `stale` · **STORY-86** `fail` · **CAP-71** `fail`

## What I verified myself

All 32 UATs re-run in this worktree: 6 files, 32 passed, 1.18s, none skipped at `it()` level. Every AC has exactly one substantive `test_UAT_AC<n>_*` driving a real entry point — no internal mocking, no structural stand-ins. **There is no `uat-add` gap at AC level**; every failure is a test silent on a named clause of its own AC, or a matrix element that must land first.

## The three coverage failures

1. **AC-691** — the height split (text leaves carry none; box/image leaves pin theirs) has **zero executable evidence anywhere in the repo** — confirmed by grep. If a regression started pinning text heights, all 32 UATs would still pass, and AC-707's content-robustness probe would be meaningless.
2. **AC-689** — the full-language clause is unexercised: `signalsFor()` emits one text run with `items/fields/images` all empty, so the capture path only ever folds one leaf kind.
3. **AC-694** — `chromiumAvailable()` probed directly → **false** here, so the AC's entire Verification skips; the always-run path has `FakeDriver` return the test's own `CANNED_HINTS`, bypassing the extractor under test. Three of six criterion dimensions are asserted on neither path.

## The needs_review from last round is discharged

REPORT-1321 held STORY-84 at `needs_review` because BUNDLE-10's fold behaviours were reconciled in tickets but absent from code. I verified they are all live today — `responsiveTextTracks`, `foldPadding`, `chipAxes`, `barBandFills`, the `section-band-*`/`card-*` hierarchy — each with a `test_UAT_FC_BUG*` test. No operator decision is needed; it converts to `stale`: a definite story-body-edit.

## Note on why this keeps failing

Findings 1, 2 and 4 are **third filings** (2026-08-05, 2026-08-07, now). `tests/reconciliation-l1-fold.test.ts` hasn't been touched since 2026-07-22 — no repair has been attempted. Three of the repairs are blocked by another, so the report gives an explicit sequence (**5 → 6, 7 → 1, 2, 3, 8 → 4**); findings 1 and 2 share one fixture in one file.
