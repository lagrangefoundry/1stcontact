---
uid: comment-e267a7fd
id: COMMENT-2442
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-09-10T03:11:02.739855+00:00'
updated_at: '2026-09-10T03:11:02.739855+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-5ce651b2
  kind: note
---

**REPORT-3643** (`report-5ce651b2`) — **FAIL**: 2 violations, 1 warning, 0 needs_review.

## What I checked

CAP-105 has one story (STORY-123, `feature`), nine active ACs (AC-1438…AC-1446), and one matrix-keyed UAT per AC in `tests/reconciliation-money-time-formatting-seam.test.ts`. Intent is `bundle-b3b7c399` (BUNDLE-20, `free_and_reconciled`, merged at `eef7a8b4`) — no standalone REQ-152 ticket survives; the bundle carries its body verbatim.

Both suites run green in this worktree: the AC-keyed suite **9/9**, the free-coded `test_UAT_FC_REQ-152_intl_seam.test.ts` **15/15**.

## The findings

**1 — violation, `code-issue`.** AC-1443 and STORY-123's third Reconciliation Decision both state that a shaped-but-impossible instant is refused "rather than formatted into whatever the runtime makes of it". `packages/framework/src/intl.ts:184-187` refuses only instants that make `Date` yield NaN. A day-of-month overflow passes the shape regex and produces a *valid* Date, because ECMAScript's parser builds the day through a rolling `MakeDay`. I replicated the exact validation path against Node 22:

```
2026-02-30T12:00:00Z  →  "2 March 2026 at 12:00"
2026-04-31T12:00:00Z  →  "1 May 2026 at 13:00"
2026-02-29T12:00:00Z  →  "1 March 2026 at 12:00"   (2026 is not a leap year)
```

That is a booking date silently moved two days and baked into an immutable snapshot — the capability's own named unrecoverable-failure class.

**2 — violation, `uat-edit`.** `test_UAT_AC1443_…` (line 250) exercises the impossible-instant limb with `2026-13-01T00:00:00Z` and `2026-10-28T25:00:00Z` only — both out-of-range *component* values, exactly the sub-class the code does handle. The test passes while the AC's claim is false.

**3 — warning, exclusivity.** All 15 tests in `tests/test_UAT_FC_REQ-152_intl_seam.test.ts` are a strict subset of the 9 AC-keyed tests, same shape, and weaker in several places (`toContain('GMT')` vs `toBe('12:00 GMT')`). Candidate for retirement.

## Note for whoever fixes this

The report argues explicitly against the tempting inverse repair — narrowing AC-1443 to match the code. The Reconciliation Decision's own rationale is that "'shaped correctly' is not the same claim as 'real'", so narrowing the AC would preserve the very failure mode the capability exists to refuse. Fix the code; the matrix is right. Findings 1 and 2 are one repair in order: add the cases (they fail), then close the gap.

The other seven ACs are in good order — the AC-keyed suite uses exact ICU strings, negative assertions pinning the specific wrong answer, and prose flattening for the recorded-contract checks.

Only `.xgd/_changes/*` is modified (the report write); no tickets, tests, or code touched.
