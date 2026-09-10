---
uid: report-f70928ca
id: REPORT-3642
type: report
title: 'Capability-Intent Alignment: Money & Time Presentation: One Formatting Seam
  (level=ac)'
created_by: xgd
created_at: '2026-09-10T03:04:51.547864+00:00'
updated_at: '2026-09-10T03:04:51.547864+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-40a5527e
  level: ac
  violations: 0
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: Money & Time Presentation: One Formatting Seam
# Level: ac

**Result**: PASS
**Violations**: 0
**Warnings**: 1
**Needs review**: 0

## Cumulative Intent Considered

The capability tree is single-origin. STORY-123 (`story-0598c150`) carries
`intent_uid = bundle-b3b7c399` (BUNDLE-20); the member of that bundle which
authored this capability is REQ-152. No AC under the story carries its own
`intent_uid` / `updated_by`, and a full-body scan of all 195 request/bug
tickets for `formatMoney`, `formatDateTime`, `intl.ts`, `REQ-152` and
`money_time` returns REQ-152 alone — no later intent has extended, refined or
retired any part of this seam.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-152 (`request-a03967f2`) | free_and_reconciled | created 2026-08-20, completed 2026-08-31 | The whole capability: `formatMoney` / `formatDateTime` as one shared seam; currency-derived minor-unit scale; exact string-arithmetic decimal; non-integer + non-ISO-4217 refusals; instant+IANA-zone time with zone-less / unknown-zone refusals and explicit-offset admission; `timeZoneName` pass-through; the render-determinism resolution recorded in DOC-34 §8.4, `buildInfo.ts` and `intl.ts` | YES |
| BUNDLE-20 (`bundle-b3b7c399`) | free_and_reconciled | created 2026-08-24, merged at `eef7a8b4` | Carrier only — bundles REQ-152 with REQ-143/145/146/147/148/149/150/151/153; no independent ask against this capability | YES (carrier) |
| REQ-151 | free_and_reconciled | — | Site locale identity (CAP-104 / STORY-122). Named as `depends_on` by REQ-152 and supplies the locale/currency/timezone this seam formats with; asks for no behaviour inside this capability | YES (upstream only) |

Comments checked: `comment-869ded75` (COMMENT-1433, the REQ-152 free-coding
dialogue). It records three implementation decisions — `formatSiteMoney`
wrappers written then deleted, DOC-34 §8.4 rather than §8.2, explicit offset
admitted as well as `Z` — all three of which are already reflected in the
story body and the AC set. It adds no ask and retires nothing.

## Alignment Ledger

STORY-123 is `story_kind = feature`, so ACs are expected. Its "In scope" list
has five items; the ledger below maps each AC to the story-body clause it
serves and to REQ-152's own AC numbering (from that ticket's Test plan table).

| Element | Intents aligned to | Outcome |
|---|---|---|
| AC-1438 `acceptance_criterion-f3306285` — locale decides placement/separators, currency decides symbol | REQ-152 (§What changed 1, AC-1) | aligned — matches story-body Money ¶ "Placement, grouping and separators come from the locale; the symbol and the decimal count come from the currency; neither can answer for the other" |
| AC-1439 `acceptance_criterion-22527da3` — minor-unit scale from the currency, never a fixed two | REQ-152 (§2 bullet 1, AC-2) | aligned — matches story-body "The scale is the currency's own minor-unit count, not a fixed two" |
| AC-1440 `acceptance_criterion-551cab00` — exactness at the top of the range, and negatives | REQ-152 (§2 bullet 2, AC-2) | aligned — exactness matches story-body "exact past the point where floating-point division silently drops a unit"; the negative-amount clause is the story's own Reconciliation Decision 1 ("Formalized as part of the exactness criterion"), correctly landed on this AC rather than a tenth |
| AC-1441 `acceptance_criterion-fe4fd532` — non-integer amount and non-ISO-4217 currency refused | REQ-152 (§2 bullet 3, AC-2) | aligned — including the "states the expected argument order" clause, which matches the intent's transposed-argument rationale |
| AC-1442 `acceptance_criterion-f8c14e88` — one instant renders as each zone's own local time, across divergent DST | REQ-152 (§3, AC-3) | aligned — matches story-body "An instant plus a zone survives the weeks in which two regions have left summer time on different dates" |
| AC-1443 `acceptance_criterion-e5d75d76` — zone-less / impossible / unknown-zone refused, explicit offset accepted | REQ-152 (§3, §Design decisions bullet 3, AC-3) | aligned — the three refusals are the intent's two (zone-less, unknown zone) plus the story's own Reconciliation Decision 3 (shaped-but-impossible instant); the offset-accepted clause matches the story-body "An explicit numeric offset is admitted" |
| AC-1444 `acceptance_criterion-99d4a678` — options honoured, currency and zone not overridable | REQ-152 (§3 bullet 3, AC-3) + story Reconciliation Decision 2 | aligned with one warning (finding 1) — the pass-through and the fixed-facts boundary are the story's Reconciliation Decision 2 verbatim; the trailing default-shape clause has no story-body support (see below) |
| AC-1445 `acceptance_criterion-86d58437` — byte-identical renders, and no render-path source reads the clock | REQ-152 (§4, AC-4) | aligned — covers both halves the story's Technical Context demands: "asserted on the artifact (the same source rendered twice, compared file by file, through both render paths) *and* structurally" |
| AC-1446 `acceptance_criterion-09480871` — no way to format "now"; the resolution recorded as a findable contract | REQ-152 (§4, §5, AC-5) | aligned — matches story-body in-scope items 4 and 5; verified against the artifacts it describes (`packages/framework/src/buildInfo.ts:10-18` names `intl.ts` and DOC-34 §8.4 and quotes the byte-deterministic rule; `packages/framework/src/intl.ts:27-47` carries the same rule at the seam's entrance) |

**Coverage of the story's "In scope" list** — all five items are addressed, none
orphaned:

| In-scope item | Covered by |
|---|---|
| The two formatting operations and their input contracts | AC-1438, AC-1439, AC-1440, AC-1442 |
| …and their refusals | AC-1441 (money), AC-1443 (time) |
| The pass-through of presentation options | AC-1444 |
| The byte-determinism of the render artifact | AC-1445 |
| The absence of any clock-reading form | AC-1446 (first ¶), AC-1445 (structural scan) |
| The recording of the resolution as a contract a module author will find | AC-1446 (second ¶) |

**Exclusivity**: no two ACs describe the same criterion. The two nearest pairs
were examined and are distinct: AC-1438 vs AC-1439 (which argument supplies the
symbol, vs what the scale is — AC-1438's title mentions "decimal count" but its
criterion and verification are entirely about symbol/placement/separators, which
is AC-1439's exclusive subject); and AC-1445 vs AC-1446 (artifact-level and
source-scan determinism, vs the absence of a clock-reading API plus the
documented contract).

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | consistency | AC-1444 `acceptance_criterion-99d4a678` | story-body-edit | AC-1444's closing clause — "When no presentation preference is given for a moment, a full readable date and a short time are shown" — asserts a default that neither the STORY-123 body nor REQ-152 states. The behaviour is real (`packages/framework/src/intl.ts:176`, `options` defaults to `{ dateStyle: 'long', timeStyle: 'short' }`), so this is a story-body completeness gap, not an AC error: STORY-123's Reconciliation Decision 2 formalised the options-pass-through boundary but omitted the default. Not a violation — the clause is implementation-grounded (chain of authority, tier 3) and sits inside the story's in-scope "pass-through of presentation options". | Add one sentence to STORY-123's Reconciliation Decision 2 recording that the moment operation defaults to a long date and a short time when the caller supplies no options, so the AC's default-shape clause traces to the story body rather than only to the code |
| 2 | info | coverage | AC-1445, AC-1446 | — | The determinism resolution is asserted against artifacts that exist and say what the ACs claim — `buildInfo.ts:10-18` and `intl.ts:27-47` both carry the byte-deterministic rule and cross-reference each other and DOC-34 §8.4 — so AC-1446's "recorded as a contract a module author will find" is currently satisfiable rather than aspirational | none |
| 3 | info | coverage | capability-40a5527e | — | The capability's "exactly one place" claim (a module that hand-rolls a symbol or a division authors a second number) has no structural AC of its own. This is correct at present: STORY-123's Out-of-scope explicitly records "No caller in the product formats money or a date today", so a no-other-formatting-site scan would be vacuous. Flagged for the successor capability, not for repair here | none |

## Notes for the Editor

- **This is the cleanest possible ledger shape**: one intent (REQ-152), one
  story, nine ACs, no retirements, no superseding intent, and no citation in
  any AC naming a delivery vehicle that has since been abandoned or deprecated.
  Step 2.5 (the stale-vehicle check) had nothing to fire against.
- **The three "Reconciliation Decisions" in STORY-123's body all landed on ACs
  rather than being dropped**: negative amounts → AC-1440, options boundary →
  AC-1444, shaped-but-impossible instant → AC-1443. Each was folded into an
  existing criterion rather than spawning a tenth AC, which is the right shape —
  they are refinements of a stated contract, not new behaviours.
- **The one warning is directional**: the AC is ahead of the story body, not
  behind it. If a future editor prefers to keep story bodies minimal, deleting
  the default-shape clause from AC-1444 would also resolve it — but that would
  lose a real, tested contract, so amending the story body is the better repair.
- **The AC set is finer-grained than REQ-152's own five ACs (9 vs 5)** and the
  expansion is faithful: REQ-152's AC-2 fanned out into AC-1439/1440/1441 and
  its AC-3 into AC-1442/1443/1444. Nothing in the intent's Test plan table is
  unrepresented in the matrix.
- **Upstream dependency is genuinely upstream**: STORY-123 leans on STORY-122 /
  CAP-104 for the resolved locale, currency, timezone and the shared judgement of
  which IANA zone ids are real (`intl.ts:1` imports `isKnownTimezone` from
  `@1stcontact/site-schema`). No AC here re-derives any of those, so there is no
  cross-capability exclusivity overlap with CAP-104.
