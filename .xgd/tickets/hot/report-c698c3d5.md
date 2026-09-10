---
uid: report-c698c3d5
id: REPORT-3648
type: report
title: 'UAT Coverage: Money & Time Presentation: One Formatting Seam'
created_by: xgd
created_at: '2026-09-10T03:26:12.835457+00:00'
updated_at: '2026-09-10T03:26:12.835457+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-40a5527e
  violations: 0
  warnings: 1
  needs_review_count: 0
---

# UAT Coverage Assessment: Money & Time Presentation: One Formatting Seam

**Result**: PASS
**AC verdicts**: 9 pass, 0 fail, 0 deprecated, 0 needs_review
**Story verdicts**: 1 pass, 0 fail, 0 stale, 0 needs_review
**Capability verdict**: pass

Evidence file: `tests/reconciliation-money-time-formatting-seam.test.ts` (432 lines,
9 UATs, one per AC). Executed this round: `npm test -- tests/reconciliation-money-time-formatting-seam.test.ts`
→ **9 passed / 9**, 313ms. Implementation under test: `packages/framework/src/intl.ts`
(215 lines, `formatMoney` + `formatDateTime`), reached by direct import — no mocking of
any kind anywhere in the file, internal or external.

## Cumulative Intent Considered

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-152 (`request-a03967f2`) | free_and_reconciled | created 2026-08-20, completed 2026-08-31 | The whole capability: one shared seam `formatMoney` / `formatDateTime` exported from the framework barrel; minor-unit scale from ICU rather than a literal `/100`; exact decimal by string arithmetic; non-integer + non-ISO-4217 refusals; instant + IANA zone with zone-less and unknown-zone refusals and explicit-offset admission; `timeZoneName` pass-through; the render-determinism resolution recorded in DOC-34 §8.4, `buildInfo.ts` and `intl.ts` | YES |
| BUNDLE-20 (`bundle-b3b7c399`) — STORY-123's `intent_uid`, carrying REQ-152 | free_and_reconciled, merged at `eef7a8b4` | created 2026-08-24, completed 2026-08-31 | Delivery vehicle; REQ-152 is its only member scoped to CAP-105 (the other four are REQ-143/145/146/147/148/149/150/151/153, scoped elsewhere) | YES |

**Ledger is single-origin.** A body scan across the ticket store for `formatMoney`,
`formatDateTime`, `intl.ts` and `REQ-152` returns REQ-152 and its own derived
artifacts alone — no later intent extended, modified or retired any part of the seam.
REQ-152's one comment (COMMENT-1433, the free-coding dialogue) records three
implementation decisions the story body already carries and adds no new ask and no
contradiction. Nothing in this capability is retired, so no AC is a deprecation
candidate.

Three behaviors the intent is silent on are covered by STORY-123's
`## Reconciliation Decisions` (all dated 2026-08-31) and are therefore
**reconciliation-decided → treated as active**, not as `needs_review`:
negative amounts (AC-1440), the options-pass-through boundary (AC-1444), and the
shaped-but-impossible instant (AC-1443).

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-123 (`story-0598c150`) | REQ-152 (via BUNDLE-20) | aligned | Every behavior in the story body traces to REQ-152 or to one of the story's own three `## Reconciliation Decisions`. One Technical Context claim — the seam is published from the framework's public surface — is intent-supported (REQ-152 §1 "Exported from the framework barrel") and true in the code (`packages/framework/src/index.ts:103`) but is not asserted by any test; recorded as warning 1, not a coverage gap in the AC set |

## AC-by-AC Coverage

| AC | Test (`tests/reconciliation-money-time-formatting-seam.test.ts`) | Verdict | Why it substantively covers |
|---|---|---|---|
| AC-1438 — locale decides placement/separators, currency decides symbol/decimals | `test_UAT_AC1438_…` (`:90`) | pass | Real `formatMoney` against real ICU: `€49.99` (en-IE) vs `49,99 €` (de-DE) proves locale owns placement and separator; three currencies in one locale yielding three distinct strings proves the symbol comes from the currency argument, not a platform table. Both directions of "neither argument answers for the other" are asserted |
| AC-1439 — minor-unit scale from the currency, never a fixed two | `test_UAT_AC1439_…` (`:114`) | pass | The identical integer 4999 through a 0-, 3- and 2-minor-unit currency (JPY `￥4,999`, KWD `4.999`, EUR `€49.99`), plus an explicit `not.toContain('49.99')` that a `/100` divisor would fail. A second zero-minor-unit currency (ISK) in two differently-grouping locales separates the currency claim from the locale claim, exactly as the AC's Verification clause asks |
| AC-1440 — exact at the top of range and for negatives | `test_UAT_AC1440_…` (`:136`) | pass | `formatMoney(9007199254740991, 'USD', 'en-US')` asserted to be `$90,071,992,547,409.91` **and** asserted not to contain `409.90` — the precise digit float division drops, so a regression to `amountMinor / 100` fails here. Negatives asserted in two locales, plus a magnitude-invariance-under-negation check at both the small and the max amount |
| AC-1441 — fractional amount or non-ISO-4217 currency refused | `test_UAT_AC1441_…` (`:162`) | pass | Both refusals driven through the real function; each failure asserted to name its requirement (`/integer count of minor units/`, `/ISO 4217/`), to report the offending value, and — for the transposition case — to state the argument order. The "nothing is returned" clause is asserted separately by capturing the return value across the throw |
| AC-1442 — one instant, each zone's local time, across diverging DST transitions | `test_UAT_AC1442_…` (`:193`) | pass | Calendar-date divergence asserted (1 Nov in Dublin vs 31 Oct in New York for one instant), then three fixed instants either side of the EU (25 Oct) and US (1 Nov) 2026 transitions with the Dublin↔New York gap asserted as 5 → 4 → 5. A fixed-offset implementation fails the middle assertion. All instants are literals, so the suite is date-independent |
| AC-1443 — ambiguous/impossible instant and unknown zone refused, explicit offset accepted | `test_UAT_AC1443_…` (`:234`) | pass | Three zone-less/date-only forms refused with the marker-or-offset message and the offending value; five shaped-but-impossible instants refused, including the dangerous `2026-02-30` class that ECMAScript's rolling `MakeDay` parses *cleanly* into 2 March; a negative control (`2026-01-30`, `2028-02-29`) proves the refusal targets impossibility rather than the day number; unknown zone refused naming `time-zone` and the id; and two explicit-offset instants asserted equal to the UTC-marked equivalent |
| AC-1444 — options honoured, currency and zone not overridable | `test_UAT_AC1444_…` (`:296`) | pass | `timeZoneName: 'short'` pass-through asserted (`12:00 GMT`); a `timeZone` override in the options bag asserted to lose to the argument in both directions (same options, two zone arguments, two different results — so the assertion cannot pass by accident); a `style: 'decimal', currency: 'USD'` override asserted not to strip or swap the currency; a non-load-bearing option (`currencyDisplay: 'code'`) asserted to pass through, so the boundary is a boundary and not a blanket refusal; and the no-options default asserted both literally and as equal to the explicit long/short pair |
| AC-1445 — byte-identical re-render, no render-path clock read | `test_UAT_AC1445_…` (`:347`) | pass | Both halves are real. The artifact half runs the real `renderSiteFiles` twice over the validated scaffolder site and compares the key set and then every file's bytes, guarded by `files.size > 0` against vacuity; the standalone `renderL1Page` is compared the same way. The mechanism half walks all **33** `.ts` files under `packages/framework/src`, strips comments (so prose stating the rule is not a false positive), and asserts an empty offender list reported by path |
| AC-1446 — no now-form, and the resolution is recorded | `test_UAT_AC1446_…` (`:396`) | pass | The load-bearing half is behavioral: arity asserted at 3, a zero-argument call asserted to throw, and the module's entire export surface asserted to be exactly `formatDateTime` + `formatMoney` with no name matching `/now\|today\|current/i` — closing the second-export-by-another-name route. The recorded-contract half is a prose assertion, which is the *only* possible evidence for a claim whose subject is documentation, and is what the AC's own Verification clause prescribes: `buildInfo.ts` asserted to carry `byte-deterministic`, "NEVER derived from the render clock", "rendered on the client or fetched at request time", and to point at `intl.ts` / `formatDateTime` / DOC-34 §8.4, with `intl.ts` asserted to state the same rule at its own entrance |

## Story-Level Judgment (independent of the AC roll-up)

STORY-123's body enumerates its promise as: *the two formatting operations, their input
contracts and their refusals; the pass-through of presentation options; the
byte-determinism of the render artifact; the absence of any clock-reading form; the
recording of the resolution as a contract a module author will find.* Each of those five
maps onto at least one AC with a green, real-entry-point test above, and the two
narrative claims the body makes beyond the AC list — that both operations delegate wholly
to ICU rather than hand-rolling symbols/separators/date order, and that the determinism
prohibition stands untouched while showing a date is no longer mistaken for breaking it —
are covered by AC-1438/1439's assertions against real ICU output for real locales and by
AC-1446 respectively. Verdict: **pass**, with one warning (below).

## Findings — Categorized by Editor Action

| # | Severity | Level | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | story | STORY-123 (`story-0598c150`) | uat-edit | The seam's *reachability* is untested. REQ-152 §1 says "Exported from the framework barrel" and STORY-123's Technical Context says "The seam is published from the framework's public surface, so a behavior module reaches it the same way it reaches any other framework facility." That is true in the code (`packages/framework/src/index.ts:103`), but the UAT imports from `packages/framework/src/intl` directly (`:5-6`), so deleting the barrel line would leave all nine UATs green while making the seam unreachable by the very modules it exists for. Not a violation: no AC claims the barrel export, the AC set was found complete against REQ-152 by the ac-level alignment check (REPORT-3642, pass), and every enumerated behavioral promise is covered | In `tests/reconciliation-money-time-formatting-seam.test.ts`, change AC-1446's export-surface assertion to run against the public barrel — `import * as framework from '../packages/framework/src'` — and assert both `formatMoney` and `formatDateTime` are present on it (keeping the existing `intlSeam` two-exports-and-no-more assertion as-is, since that claim is about the module, not the barrel). One-line addition; no AC or story-body change needed |

Zero violations. Zero needs_review — the intent ledger is single-origin and complete,
and the three behaviors it is silent on are each covered by an explicit
`## Reconciliation Decisions` entry in STORY-123, which is a decision already made by an
authorized stage and not mine to reopen. The BUG-1306 impact screen was therefore not
reached: there is no unreviewed silence in this capability.

## Notes for the Editor

- **Two ACs assert against source text, and in both cases that is correct rather than a
  structural-test smell.** AC-1445's clock scan and AC-1446's recorded-contract half read
  files, but each AC's *criterion* is itself a claim about the source: "no source file on
  the framework's render path obtains the current time from the ambient clock" and "the
  resolution is stated where a module author will encounter it". Both ACs' Verification
  clauses prescribe exactly this method, and in both cases the AC's other half is
  behavioral and load-bearing (the double-render byte comparison; the arity and
  export-surface assertions). Do not "upgrade" these to behavioral tests — there is no
  behavior to observe, and rewriting them would lose the check.
- **The suite is date-independent by construction.** Every instant is a fixed literal and
  the DST assertions are pinned to the 2026 EU/US transition dates, so the identical
  verdict holds whenever the suite is re-run. This matters for the determinism claim the
  capability is about.
- **The one warning is a reachability gap, not a behavior gap.** It is worth fixing
  because it is a one-line test change that closes a silent failure mode, but it does not
  block the capability and requires no ticket edits.
