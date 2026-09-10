---
uid: report-1a654cda
id: REPORT-3641
type: report
title: 'Capability-Intent Alignment: Money & Time Presentation: One Formatting Seam
  (level=story)'
created_by: xgd
created_at: '2026-09-10T03:00:11.156564+00:00'
updated_at: '2026-09-10T03:00:11.156564+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-40a5527e
  level: story
  violations: 0
  warnings: 0
  needs_review_count: 0
---

# Capability-Intent Alignment: Money & Time Presentation: One Formatting Seam
# Level: story

**Result**: PASS
**Violations**: 0
**Warnings**: 0
**Needs review**: 0

## Cumulative Intent Considered

The capability tree is one story (STORY-123 / story-0598c150), whose
`intent_uid` is `bundle-b3b7c399` (BUNDLE-20). Neither the capability nor the
story carries an `updated_by` chain, and no AC under the story carries an
independent `intent_uid` — so the ledger is a single intent, and the relevant
constituent of that bundle is **REQ-152**.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-20 (`bundle-b3b7c399`) | free_and_reconciled | created 2026-08-24, completed 2026-08-31, `merged_at_commit` `eef7a8b4` | Container for REQ-143/145/146/147/148/149/150/151/152/153 | YES |
| └ REQ-152 — "Money and time representation, and the render-determinism resolution" | (in BUNDLE-20, free_and_reconciled) | 2026-08-31 | The only constituent scoped to CAP-105. Created the `packages/framework/src/intl.ts` seam (`formatMoney`, `formatDateTime`); money as `{amountMinor:int, currency:ISO 4217}` with ICU minor-unit scale and exact string-arithmetic decimal; instant + IANA zone with zone-less / unknown-zone refusals and `timeZoneName` pass-through; resolved the render-determinism conflict and recorded it in DOC-34 §8.4, `intl.ts` and `buildInfo.ts` | YES |
| └ REQ-151 — "Site locale identity, and rendered lang/dir" | (in BUNDLE-20, free_and_reconciled) | 2026-08-31 | Sibling constituent; scoped to **CAP-104** / STORY-122, not here. Supplies the locale/currency/timezone this seam formats with, and `isKnownTimezone` | YES (adjacent — bounds this capability, does not populate it) |

No retired, abandoned, deprecated or draft intent touches this capability. There
is therefore no behavior in the ledger that should have been withdrawn from the
story tree.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-123 (`story-0598c150`, feature, completed) | REQ-152 (via BUNDLE-20) | **aligned** — every clause of the story body traces to a REQ-152 statement, and every REQ-152 ask is expressed in the story |

Clause-by-clause trace of the story body against REQ-152:

| Story body clause | REQ-152 support |
|---|---|
| One shared seam, "the two formatting operations", "published from the framework's public surface" | §1 "Exported from the framework barrel. Two functions, no more". Verified: `packages/framework/src/index.ts:103` exports `formatMoney`, `formatDateTime` |
| Money held as minor-unit integer + ISO 4217 code, derived for display | §2 |
| Scale from the currency's own minor-unit count, not a fixed two | §2 "The divisor comes from ICU's minor-unit count for the currency, never a literal `/100`" |
| Decimal exact past float-division loss | §2 "built by **string arithmetic**, not division" |
| Non-integer amount and non-ISO-4217 currency refused (transposition guard) | §2 "A non-integer amount throws, and a currency that is not ISO 4217-shaped throws" |
| Locale decides placement/grouping/separators; currency decides symbol/decimal count; two arguments | §1/§2 + REQ-151's four-separate-fields rationale |
| Instant + IANA zone id; zone-less wall-clock refused; explicit offset admitted | §3 and the design decision "`formatDateTime` accepts an explicit offset, not only `Z`" |
| Unknown zone id refused, delegated to CAP-104's judgement of real zone ids | §3 "An unknown IANA id is refused (`Europe/Dubland`)". Verified: `intl.ts:1,188` imports and calls `isKnownTimezone` from `@1stcontact/site-schema` rather than re-deriving — the story's "does not re-derive any of them" claim holds |
| Pass-through of presentation options | §3 "`timeZoneName` is passed through" |
| Determinism conflict resolved, prohibition stands untouched, no way to format "now" | §4, verbatim including the quoted resolution |
| Determinism asserted on the artifact *and* structurally | §4 + the REQ-152 test plan's AC-4 row (two renders compared file by file, plus a structural no-`new Date()` check) |
| "the recording of the resolution as a contract a module author will find" (In scope) | §4 and §5. Verified: DOC-34 §8.4 carries the rule and points at `intl.ts`; §8.1/§8.2 name `formatMoney`/`formatDateTime`; `buildInfo.ts` header points at DOC-34 §8.4 and `intl.ts`; `intl.ts:27-47` carries the rule at the seam's own entrance |
| Out of scope: what a site declares (CAP-104/STORY-122); payments and calendar themselves | §Why (the seam exists ahead of both) |

**Coverage**: every REQ-152 ask is expressed. The nine active ACs
(AC-1438…AC-1446) partition the story's behavioral surface without leaving a
REQ-152 statement unclaimed — including the two asks that are easy to drop at
story level: §5's obligation-doc pointers (carried by the In-scope "recording of
the resolution" clause and AC-1446) and §4's "no clock-reading overload"
(AC-1446).

**Exclusivity**: CAP-105 holds a single story, so no intra-capability overlap is
possible. The one adjacent risk — overlap with STORY-122 (CAP-104), the sibling
constituent of the same bundle — is explicitly disclaimed on both sides:
STORY-123's Out-of-scope names "what a site declares (CAP-104 / STORY-122)" and
STORY-122's Out-of-scope names "turning values into text — formatting money and
instants is a separate capability that reads this one". The split is clean in
both directions.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | info | consistency | STORY-123 | — | The story's three "Reconciliation Decisions" (negative amounts; options pass through but the load-bearing facts do not; a well-formed but impossible instant is refused) are the correct handling of code-ahead-of-intent gaps: each is dated, labelled as a reconciliation decision, and folded into an existing criterion rather than asserted as original intent. No repair needed | none |
| 2 | info | consistency | STORY-123 | — | Minor characterisation nit only: the negative-amounts decision says REQ-152 "is silent on sign", but REQ-152's own test-plan table names "negative amounts" in its AC-2 coverage row. The resolution the story reached (fold sign into the exactness criterion, AC-1440) is identical to where REQ-152 put it, so the outcome is aligned and no behavior or AC changes | none — recorded for the ledger, not for repair |

## Notes for the Editor

Nothing to repair at story level.

Two things worth knowing for the downstream `ac` and `uat` cycles:

- **This capability has no caller in the product.** The story says so
  explicitly ("No caller in the product formats money or a date today") and
  REQ-152 says the seam exists deliberately ahead of payments and calendar. A
  UAT-level check must not read the absence of a production call site as missing
  coverage — the correct evidence shape here is direct exercise of the two
  exported functions plus the artifact/structural determinism assertions, which
  is what `tests/test_UAT_FC_REQ-152_intl_seam.test.ts` (16 cases) does.

- **Two ACs are provable only outside the seam's own module.** AC-1445
  (byte-identical renders, no render-path clock read) and AC-1446 (the
  determinism resolution recorded where a module author finds it) are assertions
  about the render artifact and about `buildInfo.ts` / DOC-34 §8.4 / `intl.ts`'s
  header respectively — not about `formatMoney`/`formatDateTime` return values.
  Both targets were verified to exist during this check.

- **STORY-123 carries no `uat_coverage` field**, unlike most completed stories in
  the matrix. That field is owned by the check/fix `uat_coverage` cycle, not by
  this one, and its absence is not an alignment finding — flagged only so the
  next cycle does not read it as drift.
