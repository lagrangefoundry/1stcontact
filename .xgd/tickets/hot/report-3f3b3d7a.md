---
uid: report-3f3b3d7a
id: REPORT-3644
type: report
title: 'Fix Money & Time Presentation: One Formatting Seam (uat) — attempt 1'
created_by: xgd
created_at: '2026-09-10T03:15:10.889897+00:00'
updated_at: '2026-09-10T03:15:10.889897+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-40a5527e
  level: uat
  fixes_applied: 3
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-e37a6b4a
---

# Fix Summary — Money & Time Presentation: One Formatting Seam (uat)

**Attempt**: 1
**Fixes applied this call**: 3
**Violations remaining**: 0
**Needs more work**: false

All three findings from report-5ce651b2 (2 violations + 1 warning) are closed in
this call. Findings 1 and 2 were applied as one repair in the prescribed order:
the test first, so the gap was visible as a real RED, then the code.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | uat-edit | AC-1443 (`acceptance_criterion-e5d75d76`) → `tests/reconciliation-money-time-formatting-seam.test.ts:248-273` | Added the day-of-month-overflow class to the `impossible` array — `2026-02-30T12:00:00Z`, `2026-04-31T12:00:00Z`, `2026-02-29T12:00:00Z` (2026 is not a leap year). Each limb now also asserts the failure reports the offending value. Added a positive control so the refusal is of the impossible *date*, not of the day number: `2026-01-30` and `2028-02-29` still format |
| 2 | code-issue | `packages/framework/src/intl.ts` | Added `isRealCalendarDate()` and made `formatDateTime`'s existing "not a real date-time" refusal fire on a day-of-month overflow as well as on a NaN parse |
| 3 | uat-edit (retire) | `tests/test_UAT_FC_REQ-152_intl_seam.test.ts` | Deleted (`git rm`). Precondition checked first — see below |

### Finding 1/2 — the RED, verbatim

Before the code change, the amended UAT failed exactly on the new class:

```
FAIL tests/reconciliation-money-time-formatting-seam.test.ts >
  test_UAT_AC1443_an_ambiguous_or_impossible_instant_and_an_unknown_zone_are_refused
AssertionError: 2026-02-30T12:00:00Z: expected [Function] to throw an error
```

This independently reproduces the assessor's Node-22 probe in this worktree: the
seam formatted a 30 February instant rather than refusing it.

### Finding 3 — the precondition the assessor named

"Confirm no evidence set still names it before deleting." Every reference to
`test_UAT_FC_REQ-152_intl_seam.test.ts` in the store is prose in a completed
artifact, not a live evidence set — `bundle-b3b7c399` (the merged free-coded
bundle's own record), `report-12841fa2`, `report-1a654cda`, `report-007870fd`,
`request-a03967f2`, `comment-e267a7fd` and `report-5ce651b2` itself. No task
ticket names it. No file in the repo outside `.xgd/` references it (grep over
`*.ts`, `*.mts`, `*.json`, `*.md` — no hits), so no runner or index dangles.

Test-name-level subset check before deleting, confirming the assessor's claim
that nothing unique was lost:

| Retired FC test | Superseding AC-keyed test |
|---|---|
| `money_locale_places_symbol_and_separator`, `money_currency_is_independent_of_locale` | `test_UAT_AC1438_…` (both directions, exact ICU strings) |
| `money_zero_and_three_minor_unit_currencies` | `test_UAT_AC1439_…` (JPY/KWD/EUR/ISK, exact) |
| `money_is_exact_beyond_float_precision`, `money_handles_a_negative_amount` | `test_UAT_AC1440_…` |
| `money_rejects_a_non_integer_amount`, `money_rejects_transposed_currency_and_locale` | `test_UAT_AC1441_…` |
| `datetime_same_instant_differs_by_zone`, `datetime_survives_diverging_dst_transitions` | `test_UAT_AC1442_…` |
| `datetime_rejects_a_wall_clock_string`, `datetime_rejects_an_unknown_zone` | `test_UAT_AC1443_…` |
| `datetime_surfaces_the_zone_abbreviation` | `test_UAT_AC1444_…` (`toBe('12:00 GMT')`, not `toContain`) |
| `render_twice_is_byte_identical`, `no_render_source_reads_the_ambient_clock` | `test_UAT_AC1445_…` |
| `build_info_points_at_the_determinism_rule` | `test_UAT_AC1446_…` |

## Code Edits

| File | Lines | Evidence chain |
|---|---|---|
| `packages/framework/src/intl.ts` | 151-173 (new `isRealCalendarDate`), 203-206 (refusal condition) | AC-1443 states a shaped-but-not-real date-time "is refused rather than formatted into whatever the runtime makes of it"; STORY-123's third Reconciliation Decision states the landed code refuses it; the amended UAT failed against current code (RED above) proving it did not. ECMAScript's date-time parser builds the day with a rolling `MakeDay` and never checks the month's length, so `2026-02-30T12:00:00Z` parsed to a *valid* Date reading 2 March — the NaN guard at the old line 185 catches an out-of-range component (month 13, hour 25) but not this class. Minimal change: the same error, one extra disjunct |

Implementation note: the day is validated by round-tripping the literal's
`YYYY-MM-DD` prefix through `setUTCFullYear` and comparing the year/month/day
back, so leap years come from the runtime's own calendar rather than a
hand-written table. `setUTCFullYear` rather than `Date.UTC` because the latter
maps a two-digit year into the 1900s and would answer the leap question for the
wrong year. The check runs only after `INSTANT.test` has passed, so the prefix
is known well-formed. It deliberately does not touch the offset-bearing path:
validation is of the *written* calendar date, so `2026-10-28T23:00:00-04:00`
(which is 29 October in UTC) is still accepted.

No production caller was affected — `formatDateTime` has no call site in the
product yet beyond the framework barrel export (`packages/framework/src/index.ts:103`);
the seam exists ahead of payments and calendar by design.

## Verification

- `npm test -- tests/reconciliation-money-time-formatting-seam.test.ts` — **9 passed / 9**
  after the code fix (the same suite was 1 failed / 8 passed with the test edit
  alone, which is the point).
- Both suites together, before the retirement — **24 passed / 24**, i.e. the code
  change broke nothing the free-coded suite asserted.
- AC-keyed suite re-run after deleting the FC file — **9 passed / 9**.
- `tsc --noEmit -p tsconfig.base.json` — zero errors in `intl.ts`. (The repo-wide
  run reports 1921 pre-existing errors, all `Cannot find name 'R2Bucket' /
  'D1Database' / 'ExportedHandler'`-class, from the base config not pulling in
  the workers types. Unrelated to this change and present before it.)
- AC-1445's clock scan over `packages/framework/src` still passes with the new
  `new Date(0)` probe in `intl.ts` — it is a validation path, not a render path,
  and takes its value from the argument, never from the ambient clock.

## Matrix Edits

None, deliberately. The report's Notes for the Editor are explicit that finding 1
must not be resolved by narrowing AC-1443 or STORY-123's third Reconciliation
Decision to match the code, because that would preserve an unrecoverable failure
mode inside a capability whose premise is refusing them. The matrix was right;
the code was wrong. `uat_coverage` was not touched — that field is owned by the
uat-coverage check/fix pair.

## needs_review Items Forwarded

None. The report carried `needs_review_count: 0`.
