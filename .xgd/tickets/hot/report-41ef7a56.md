---
uid: report-41ef7a56
id: REPORT-3647
type: report
title: 'Capability-Intent Alignment: Money & Time Presentation: One Formatting Seam
  (level=uat)'
created_by: xgd
created_at: '2026-09-10T03:19:51.602805+00:00'
updated_at: '2026-09-10T03:19:51.602805+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-40a5527e
  level: uat
  violations: 0
  warnings: 0
  needs_review_count: 0
---

# Capability-Intent Alignment: Money & Time Presentation: One Formatting Seam
# Level: uat

**Result**: PASS
**Violations**: 0
**Warnings**: 0
**Needs review**: 0

Attempt 2 of this check (previous_attempt_count = 1). Both violations and the
one warning raised by `report-5ce651b2` (attempt 1) were re-verified against the
current tree rather than assumed closed; all three are confirmed repaired. No
new drift was found.

## Cumulative Intent Considered

The capability tree is single-origin. CAP-105 (`capability-40a5527e`) has exactly
one story, STORY-123 (`story-0598c150`, `story_kind = feature`, completed), whose
`intent_uid` is `bundle-b3b7c399` (BUNDLE-20). Neither the capability, the story,
nor any of the nine ACs carries an `updated_by` chain, so the ledger is one
intent — REQ-152, carried verbatim inside the bundle body.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-20 (`bundle-b3b7c399`), carrying REQ-152 | `free_and_reconciled`, merged at `eef7a8b4` | created 2026-08-24, completed 2026-08-31 | Created `packages/framework/src/intl.ts` — `formatMoney(amountMinor, currency, locale, options?)` and `formatDateTime(instant, timeZone, locale, options?)`; minor-unit scale from ICU rather than `/100`; exact decimal by string arithmetic; non-integer and non-ISO-4217 refusals; zone-less / unknown-zone refusals with explicit offset admitted; presentation-option pass-through; the render-determinism resolution recorded in DOC-34 §8.4, `buildInfo.ts` and `intl.ts` | YES |
| BUNDLE-20, carrying REQ-151 | (same bundle) | (same) | Site Locale Identity (CAP-104 / STORY-122) — supplies the locale/currency/timezone this seam formats with, and `isKnownTimezone`. Asks for no behaviour inside CAP-105 | YES (upstream only) |

STORY-123 additionally records three **Reconciliation Decisions** (2026-08-31)
formalizing behaviour REQ-152's body is silent on: negative amounts (folded into
AC-1440), the options-pass-through boundary (AC-1444), and the refusal of a
syntactically well-formed but impossible instant (AC-1443).

**Level cascade applied.** This is a `uat`-level check, so the nine AC bodies are
the working reference. Intent history was consulted only to confirm the ledger is
single-origin and to date the three Reconciliation Decisions that two ACs rest
on; no AC was found internally inconsistent, so no further escalation to intent
was required. Step 2.5 (tier-3 implementation check) was not triggered — no story
or AC text names an abandoned/deprecated/`wont_fix` ticket as a delivery vehicle.

## Evidence Run

`tests/reconciliation-money-time-formatting-seam.test.ts` was executed in this
worktree at the current tip (`e743178708`):

```
Test Files  1 passed (1)
     Tests  9 passed (9)
```

Nine active ACs, nine matrix-keyed UATs, one per AC, all passing. No test is
skipped, and no UAT is a bare structural/AST check — the two ACs that do carry a
structural claim (AC-1445's clock scan, AC-1446's recorded-contract clause) each
also assert real behaviour through the real entry points, because the AC itself
asks for both halves.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| AC-1438 → `test_UAT_AC1438_…` (`tests/reconciliation-money-time-formatting-seam.test.ts:90`) | REQ-152 | aligned — exact ICU strings for EUR in `en-IE` (`€49.99`) and `de-DE` (`49,99 €`), both directions of the "neither argument answers for the other" claim, plus three currencies in one locale yielding three distinct strings |
| AC-1439 → `test_UAT_AC1439_…` (`:114`) | REQ-152 | aligned — the identical `4999` through JPY (0 minor units), KWD (3) and EUR (2), each in a locale that uses it, plus ISK in `is-IS` and `en-US` so the claim is about the currency and not one locale's grouping. Assertions are exact strings and discriminate against a `/100` bug |
| AC-1440 → `test_UAT_AC1440_…` (`:136`) | REQ-152 + STORY-123 Reconciliation Decision 1 (negatives) | aligned — `9007199254740991` renders `$90,071,992,547,409.91` and is explicitly asserted *not* to contain `409.90`, the digit a float division drops; negation asserted in two locales to change only the sign, magnitude byte-identical |
| AC-1441 → `test_UAT_AC1441_…` (`:162`) | REQ-152 | aligned — fractional amount names the integer requirement and reports `49.99`; transposed arguments name ISO 4217, report `en-IE` and state the `(amountMinor, currency, locale)` order; an explicit assertion that neither attempt produced a value |
| AC-1442 → `test_UAT_AC1442_…` (`:193`) | REQ-152 | aligned — one instant read in Dublin and New York differing in hour *and* calendar date, then the 5 / 4 / 5-hour gap across the diverging 2026 EU and US transitions, asserted per-zone and again as the gap itself. Every instant is a fixed literal, so the check is date-independent |
| AC-1443 → `test_UAT_AC1443_…` (`:234`) | REQ-152 + STORY-123 Reconciliation Decision 3 | aligned — **previously the violation site, now closed.** Zone-less (`2026-11-01T02:30`, `…T02:30:00`) and date-only (`2026-11-01`) refusals name the marker-or-offset requirement and report the value; the impossible-instant limb now covers both classes — out-of-range components (`2026-13-01`, hour `25`) *and* the day-of-month overflow that ECMAScript's rolling `MakeDay` parses cleanly (`2026-02-30`, `2026-04-31`, `2026-02-29` in a non-leap year); a positive control (`2026-01-30`, `2028-02-29` both format) proves the refusal is of the impossible date rather than of the day number; `Europe/Dubland` names the time-zone as the problem; an explicit `+01:00` / `-04:00` offset formats to the same reading as the UTC-marked instant |
| AC-1444 → `test_UAT_AC1444_…` (`:296`) | REQ-152 + STORY-123 Reconciliation Decision 2 | aligned — `timeZoneName: 'short'` surfaces `12:00 GMT`; a `timeZone` option is asserted to lose to the argument in *both* directions; `{style:'decimal', currency:'USD'}` fails to strip or restate the currency for two different supplied currencies; a non-load-bearing option (`currencyDisplay:'code'`) does pass through, so the fixing is a boundary rather than a blanket refusal; the no-options default is asserted both as the literal `28 October 2026 at 12:00` and as equal to the explicit long/short pair |
| AC-1445 → `test_UAT_AC1445_…` (`:347`) | REQ-152 | aligned — the artifact claim is asserted on what ships: `renderSiteFiles` run twice over one in-memory `LoadedSite`, file names compared and then each file's bytes, with a guard that the render produced files at all; the standalone `renderL1Page` compared likewise. The structural half walks every `.ts` under `packages/framework/src` with comments stripped and asserts an empty offender list reported by path — verified non-vacuous: the three `new Date()` occurrences under that tree (`buildInfo.ts:7`, `intl.ts:29`, `intl.ts:154`) are all prose, which is exactly the distinction the AC draws, and `intl.ts`'s two real `new Date(...)` calls take an argument and so are not clock reads |
| AC-1446 → `test_UAT_AC1446_…` (`:396`) | REQ-152 | aligned — arity asserted at 3 and a zero-argument call asserted to throw, so no now-form exists; the module's whole export surface asserted to be exactly `formatDateTime` + `formatMoney` and no name matching `/now\|today\|current/i`, closing the second-export-by-another-name route. The recorded-contract half asserts `buildInfo.ts` carries `byte-deterministic`, "NEVER derived from the render clock", "rendered on the client or fetched at request time", and points at `intl.ts` / `formatDateTime` / DOC-34 §8.4; and that `intl.ts` states the same rule in the same terms at its own entrance |

### Attempt-1 findings, re-verified against the current tree

| Attempt-1 finding | Status now | Evidence |
|---|---|---|
| Violation 1 — AC-1443's impossible-instant limb proved only the sub-class the code happened to handle (`uat-edit`) | closed | `tests/reconciliation-money-time-formatting-seam.test.ts:255-273` carries the day-of-month-overflow class and a positive control |
| Violation 2 — `formatDateTime` formatted a 30-February instant rather than refusing it (`code-issue`) | closed | `packages/framework/src/intl.ts:167-172` (`isRealCalendarDate`, round-tripped through `setUTCFullYear` so leap years come from the runtime's calendar) and `:208-210` (the refusal now fires on a NaN parse *or* a day-of-month overflow). The suite passes on that code |
| Warning 3 — `tests/test_UAT_FC_REQ-152_intl_seam.test.ts` duplicated all nine AC-keyed UATs in the same shape (`uat-edit`, retire) | closed | File absent from `tests/`. No reference to `REQ-152_intl_seam` remains anywhere in `tests/`, `packages/`, `tools/`, `apps/`, `vitest.config.ts` or `package.json`, so nothing dangles |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| — | — | — | — | — | No violations, warnings or needs-review items. Nine active ACs, nine substantive UATs, one per AC, all passing; no duplicate coverage; each test exercises the behaviour its AC claims | none |
| 1 | info | consistency | AC-1443 | — | The impossible-instant repair from attempt 1 is present in both test and code, and the test's discrimination is real: the day-of-month class parses to a *valid* `Date` (30 February reads as 2 March), so a NaN-only check would pass the test-side assertion and fail the behaviour. The positive control prevents the repair from over-refusing | none |
| 2 | info | exclusivity | (whole capability) | — | The retired FC suite was the only duplicate; the remaining nine tests are one-per-AC with no two verifying the same scenario in the same shape | none |
| 3 | info | coverage | AC-1445 | — | The structural clock scan covers `packages/framework/src` — the "framework's render path" the AC names. Checked whether the scope leaves a real hole: the only `new Date()` calls under `tools/generate/src` are in `capture/pipeline.ts`, `publish/publish.ts`, `store/journal-model.ts` and `store/d1r2-store.ts` — capture, publish metadata and journal/store timestamps, none on the HTML render path, which is additionally covered behaviourally by the two-render byte comparison | none |

## Notes for the Editor

Nothing to repair at this level.

Two observations for whoever reads this ledger next:

- **The one-story tree is genuinely single-origin.** No later intent has extended,
  refined or retired any part of this seam, and no AC carries an independent
  `intent_uid`. A future check can treat REQ-152 (via `bundle-b3b7c399`) as the
  whole ledger unless an `updated_by` entry appears on CAP-105, STORY-123 or one
  of AC-1438…AC-1446.

- **Two ACs rest on STORY-123's Reconciliation Decisions rather than on REQ-152's
  body** — AC-1440's negative-amount clause and AC-1444's options-boundary clause,
  plus AC-1443's impossible-instant clause. All three decisions are dated
  2026-08-31 and recorded in the story body, so they are settled rather than
  ambiguous; a future check should not read the intent's silence on those points
  as drift.

- **File-name cosmetic, not drift**: the suite is named
  `reconciliation-money-time-formatting-seam.test.ts` while STORY-123 is
  `story_kind = feature`. The naming reflects the reconciliation-driven UAT
  generation run that authored it, not a story-kind mismatch. Not raised as a
  finding — it has no bearing on whether the tests evidence their ACs.
