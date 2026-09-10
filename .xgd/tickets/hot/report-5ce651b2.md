---
uid: report-5ce651b2
id: REPORT-3643
type: report
title: 'Capability-Intent Alignment: Money & Time Presentation: One Formatting Seam
  (level=uat)'
created_by: xgd
created_at: '2026-09-10T03:10:43.454355+00:00'
updated_at: '2026-09-10T03:10:43.454355+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-40a5527e
  level: uat
  violations: 2
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: Money & Time Presentation: One Formatting Seam
# Level: uat

**Result**: FAIL
**Violations**: 2
**Warnings**: 1
**Needs review**: 0

## Cumulative Intent Considered

The capability has one story, whose `intent_uid` is `bundle-b3b7c399`. No
standalone `REQ-152` ticket exists in the store — the bundle absorbed its
constituents, and its body carries each one verbatim. REQ-152 (offset 115564 in
the bundle body) is the constituent that created this capability's tree; REQ-151
is the constituent that supplies the locale identity this seam formats with.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-20 (`bundle-b3b7c399`), carrying REQ-152 | free_and_reconciled, merged at `eef7a8b4` | created 2026-08-24, completed 2026-08-31 | Created `packages/framework/src/intl.ts`: `formatMoney(amountMinor, currency, locale, options?)` and `formatDateTime(instant, timeZone, locale, options?)`; minor-unit scale from ICU rather than `/100`; exact decimal by string arithmetic; non-integer and non-ISO-4217 refusals; zone-less-instant and unknown-zone refusals; explicit offset admitted; `timeZoneName` pass-through; the determinism resolution recorded in DOC-34 §8.4, `buildInfo.ts` and `intl.ts` | YES |
| BUNDLE-20, carrying REQ-151 | (same bundle) | (same) | Site locale identity — the upstream dependency (CAP-104 / STORY-122). Out of this capability's scope | YES (dependency only) |

STORY-123 additionally records three **Reconciliation Decisions** (2026-08-31)
that formalize behaviour the landed code exhibits and REQ-152's body is silent
on: negative amounts, the options-pass-through boundary, and — finding 1 below —
that *"a syntactically well-formed but impossible instant is refused"*.

Level cascade: this is a `uat`-level check, so AC bodies are the working
reference. Intent and story body were consulted only for AC-1443, where the
implementation contradicts the AC (Step 2.5, tier 3).

## Alignment Ledger

Nine active ACs, each with exactly one matrix-keyed UAT in
`tests/reconciliation-money-time-formatting-seam.test.ts`. That suite was run:
**9 passed / 9**. `tests/test_UAT_FC_REQ-152_intl_seam.test.ts` was also run:
**15 passed / 15**.

| Element | Intents aligned to | Outcome |
|---|---|---|
| AC-1438 → `test_UAT_AC1438_…` (:90) | REQ-152 §1–2 | aligned — exact ICU strings for two locales and three currencies; both directions of the "neither argument answers for the other" claim asserted |
| AC-1439 → `test_UAT_AC1439_…` (:114) | REQ-152 §2 | aligned — JPY (0), KWD (3), EUR (2) on the identical `4999`, plus ISK in two differently-grouping locales. Assertions are exact strings and discriminate against a `/100` bug (verified: a `/100` ISK render is `4.999 kr.`, which fails `toBe('499.900 kr.')`) |
| AC-1440 → `test_UAT_AC1440_…` (:136) | REQ-152 §2 | aligned — `9007199254740991` renders `…409.91` and is asserted *not* to contain `409.90`; negation asserted to change only the sign |
| AC-1441 → `test_UAT_AC1441_…` (:162) | REQ-152 §2 | aligned — both refusals, the offending value, the argument-order hint, and an explicit "no value was produced" assertion |
| AC-1442 → `test_UAT_AC1442_…` (:193) | REQ-152 §3 | aligned — cross-date reading plus the 5/4/5-hour Dublin↔New York gap across the diverging 2026 transitions, all fixed literals |
| AC-1443 → `test_UAT_AC1443_…` (:234) | REQ-152 §3 + STORY-123 Reconciliation Decision 3 | **gap: findings 1 and 2** — the zone-less, date-only, unknown-zone and explicit-offset limbs are all correctly proven; the impossible-instant limb is proven only for the sub-class the code happens to handle |
| AC-1444 → `test_UAT_AC1444_…` (:277) | REQ-152 §3 + STORY-123 Reconciliation Decision 2 | aligned — zone-name pass-through, zone-override precedence (both directions), money style/currency-override precedence, a non-load-bearing option passing through, and the long-date/short-time default |
| AC-1445 → `test_UAT_AC1445_…` (:328) | REQ-152 §4 | aligned — both render paths compared file-by-file with a non-empty guard, plus the comment-stripped clock scan over `packages/framework/src` reporting offenders by path |
| AC-1446 → `test_UAT_AC1446_…` (:377) | REQ-152 §4 | aligned — `formatDateTime.length === 3`, the zero-arg call refused, the export list pinned to exactly two names, and the recorded resolution asserted in both `buildInfo.ts` and `intl.ts` on flattened prose. Structural in shape, but AC-1446's own Verification prescribes exactly these checks — the claim *is* an absence-of-API claim |

Coverage: every active AC has a substantive UAT. Exclusivity: one duplicate
suite (finding 3).

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | AC-1443 / `packages/framework/src/intl.ts:184-187` | code-issue | The seam refuses a shaped-but-impossible instant only when `new Date(instant)` yields NaN. A **day-of-month overflow** has the right shape (matches `INSTANT`, `intl.ts:60`) and yields a *valid* `Date`, because ECMAScript's date-time parser builds the day via a rolling `MakeDay` with no days-in-month check. Verified against Node 22 by replicating `intl.ts:178-191` exactly: `2026-02-30T12:00:00Z` → formatted as **"2 March 2026 at 12:00"**; `2026-04-31T12:00:00Z` → **"1 May 2026 at 13:00"**; `2026-02-29T12:00:00Z` (2026 is not a leap year) → **"1 March 2026 at 12:00"**. AC-1443 states such a value "is refused rather than formatted into whatever the runtime makes of it", and STORY-123's third Reconciliation Decision states the landed code refuses it. It does not. This is the capability's own unrecoverable-failure class: a booking silently moved two days and baked into an immutable snapshot | Validate the calendar date before formatting — e.g. round-trip the parsed instant's UTC year/month/day back against the literal's `\d{4}-\d{2}-\d{2}` prefix and throw the existing `is not a real date-time` error on mismatch. Keep the current NaN check for out-of-range components |
| 2 | violation | consistency | AC-1443 / `tests/reconciliation-money-time-formatting-seam.test.ts:250` | uat-edit | The impossible-instant limb is exercised with `'2026-13-01T00:00:00Z'` and `'2026-10-28T25:00:00Z'` only. Both are out-of-range *component* values, which is precisely the sub-class `intl.ts` does refuse; the day-of-month overflow class is absent. The test therefore passes while the AC's claim is false, so the AC reads as proven when it is not | Add the day-overflow cases to the `impossible` array — `'2026-02-30T12:00:00Z'`, `'2026-04-31T12:00:00Z'`, `'2026-02-29T12:00:00Z'`. Expect this to fail until finding 1 is fixed; that failure is the point |
| 3 | warning | exclusivity | `tests/test_UAT_FC_REQ-152_intl_seam.test.ts` vs `tests/reconciliation-money-time-formatting-seam.test.ts` | uat-edit (retire) | Two suites verify the same scenarios in the same shape — same imports, same vitest node environment, same starter-site fixture. All 15 tests in the REQ-keyed file are a strict subset of the 9 AC-keyed tests, and in several cases strictly weaker: `toContain('4.999')`/`toContain('499')` for KWD/ISK vs `toBe('KWD 4.999')`/`toBe('499.900 kr.')`; `toContain('GMT')` vs `toBe('12:00 GMT')`. Not different shapes (unit vs integration vs browser) — the same shape twice. Coding Standards §1/§4: one authoritative location, delete what a replacement supersedes | Retire `tests/test_UAT_FC_REQ-152_intl_seam.test.ts`; the AC-keyed suite already carries every claim it makes. Confirm no evidence set still names it before deleting |

## Notes for the Editor

**Finding 1 could in principle be resolved the other way — do not.** One could
narrow AC-1443 and STORY-123's third Reconciliation Decision to match the code
("an instant the runtime cannot represent is refused") instead of fixing the
code. That is the wrong direction. The Reconciliation Decision's own stated
rationale is that *"the whole reason to validate at this boundary is that the
failure is unrecoverable once published, and 'shaped correctly' is not the same
claim as 'real'"* — and a Feb-30 booking rendering as 2 March is exactly that
harm. Narrowing the AC would preserve an unrecoverable failure mode inside a
capability whose entire premise is refusing them. Fix the code; the matrix is
right.

**Findings 1 and 2 are one repair, in order.** Adding the test cases first makes
the gap visible; fixing `intl.ts` closes it. Fixing only the test (by choosing
cases that pass) or only the code (leaving the class untested) each leaves the
matrix claiming something unproven.

**Everything else in this capability is in good order.** The AC-keyed suite is
unusually strong for a reconciliation artifact: exact ICU strings rather than
substring probes, negative assertions that pin the specific wrong answer
(`not.toContain('409.90')`, `not.toContain('49.99')`), a non-empty guard before
the byte-comparison loop, and prose flattening so the recorded-contract
assertions survive re-wrapping. The three Reconciliation Decisions in STORY-123
each landed as a real AC limb with a real assertion behind it — two of the three
correctly, and the third is finding 1.

**Suite health.** Both suites were executed in this worktree and both are green
as they stand (`9/9` and `15/15`). Finding 1 is not a failing test; it is a
claim no test currently attacks, confirmed by direct probe of the exact
validation path.
