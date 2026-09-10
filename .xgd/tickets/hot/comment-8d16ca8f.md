---
uid: comment-8d16ca8f
id: COMMENT-2443
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-09-10T03:15:28.005840+00:00'
updated_at: '2026-09-10T03:15:28.005840+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-3f3b3d7a
  kind: note
---

All three findings from `report-5ce651b2` are closed. Completion report: **REPORT-3644** (`report-3f3b3d7a`) — `fixes_applied: 3`, `progress_made: true`, `needs_more_work: false`, `violations_remaining: 0`.

**Findings 1 + 2 — one repair, in the prescribed order.**

Test first (`tests/reconciliation-money-time-formatting-seam.test.ts:248-273`): added the day-of-month-overflow class to AC-1443's `impossible` array (`2026-02-30`, `2026-04-31`, `2026-02-29` — 2026 is not a leap year), plus an assertion that the failure reports the offending value, plus a positive control (`2026-01-30`, `2028-02-29` still format) so the refusal targets the impossible date, not the day number. That produced a real RED in this worktree, independently reproducing the assessor's probe:

```
AssertionError: 2026-02-30T12:00:00Z: expected [Function] to throw an error
```

Code second (`packages/framework/src/intl.ts`): added `isRealCalendarDate()` and made the existing `is not a real date-time` refusal fire on it as well as on a NaN parse. It round-trips the literal's `YYYY-MM-DD` prefix through `setUTCFullYear` (not `Date.UTC`, which maps a two-digit year into the 1900s and would answer the leap question for the wrong year). It validates the *written* calendar date only, so an offset-bearing instant whose UTC date differs (`2026-10-28T23:00:00-04:00`) is still accepted. I did not narrow AC-1443 or STORY-123's third Reconciliation Decision — the report's Notes for the Editor rule that direction out, and the matrix was right.

**Finding 3 — retired `tests/test_UAT_FC_REQ-152_intl_seam.test.ts`** after checking the precondition: every store reference is prose in a completed artifact (the merged bundle, four reports, one comment, one request), no task ticket names it, and nothing in the repo outside `.xgd/` references it. I also mapped all 15 retired test names onto their superseding AC-keyed tests before deleting; nothing unique was lost.

**Verification** (all run, output read): AC-keyed suite 9/9 after the fix (1 failed/8 passed with the test edit alone); both suites together 24/24 before the retirement; AC-keyed suite 9/9 again after it. `tsc --noEmit` reports zero errors in `intl.ts` — the 1921 repo-wide errors are the pre-existing `Cannot find name 'R2Bucket'`-class from the base config not pulling in workers types, unrelated and present before this change.

`uat_coverage` was left untouched — that field belongs to the uat-coverage check/fix pair, not to this prompt.
