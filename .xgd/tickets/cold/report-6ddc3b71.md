---
uid: report-6ddc3b71
id: REPORT-828
type: report
title: 'Capability-Intent Alignment: Framework Absolute-or-Overlay Value System (level=ac)'
created_by: xgd
created_at: '2026-07-23T09:56:36.254978+00:00'
updated_at: '2026-07-23T09:56:36.254978+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-6e088083
  level: ac
  violations: 0
  warnings: 0
  needs_review_count: 0
---

# Capability-Intent Alignment: Framework Absolute-or-Overlay Value System
# Level: ac

**Result**: PASS
**Violations**: 0
**Warnings**: 0
**Needs review**: 0

Level cascade honored: the story-level cycle for this capability PASSED on its
attempt 3 (REPORT-827, report-72e4f4b3). Per the cascade rule, STORY-80's body is
the working reference at ac level; intent history was consulted only to confirm the
story body is not internally ambiguous (it is not). No prior ac-level report exists
for this capability (REPORT-823/825/827 are story-level; 824/826 are story fixes),
so this is the first ac-level alignment record.

## Cumulative Intent Considered

Inherited from the story-level ledger (REPORT-827); reproduced for the drift record.
All operative intents are `free_and_reconciled`.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-58 (in bundle-ab9e0cb6) | free_and_reconciled | 7a42e18 | Origin: absolute-or-overlay delivered via ~20 semantic-module colour/length/radius dials (AC-660..665 era) | YES (origin, later superseded) |
| REQ-79 (in bundle-31e474b9) | free_and_reconciled | edeb1c2 | Framework pivot: #2 "one value = one literal field — no theme-role indirection in L1"; #4 named overlay = PARKED L2 library | YES — retires module-dial delivery; parks overlay |
| REQ-84 (in bundle-31e474b9) | free_and_reconciled | edeb1c2 | DELETE module dirs header/hero/footer/text-block/services-grid/layer + ~20 layout dials | YES — deletes the delivery vehicle |
| REQ-85 (in bundle-31e474b9) | free_and_reconciled | edeb1c2 | Behaviour-module contract; superseded-AC list marks AC-660..665 intentionally superseded (not lost) | YES |

Cumulative picture: the absolute-base capability survives the pivot, re-homed on L1
leaf literals; the named-overlay half is intentionally parked in L2 (not owed here).
STORY-80 (story_kind=upgrade, intent_uid=bundle-ab9e0cb6, updated_by=bundle-31e474b9)
carries exactly this: a single "repointer" AC keeping the absolute-base capability
from being orphaned by the module-dial deletion.

## Alignment Ledger

Matrix at ac level: CAP-67 → STORY-80 (upgrade) → AC-716 (single AC, kind=behavior).

| Element | Intents aligned to | Outcome |
|---|---|---|
| AC-716 (acceptance_criterion-1eaa93b8) | REQ-79, REQ-84, REQ-85 (via STORY-80) | aligned — accurately follows STORY-80 body across all three value types + envelope rejection; parked-overlay correctly noted as out-of-substrate |

## Findings

None. All three properties hold.

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| — | info | consistency | AC-716 | — | AC-716 mirrors STORY-80 exactly: hex-only colour literal emitted verbatim / non-hex rejected; finite px length·geometry·radius literal emitted verbatim / non-finite·out-of-range rejected (bounds font-size 1–400, geometry ±100k); named-overlay noted as authoring-layer convenience above L1, not substrate | none |
| — | info | coverage | STORY-80 | — | STORY-80 body explicitly designates ONE repointer AC and delegates detailed L1 axis/envelope coverage to the L1 substrate story. AC-716 covers colour + length/geometry/radius + validation rejection — the story's full behavioral surface. Parked L2 overlay is a non-deliverable (REQ-79 #4), correctly noted, so no AC is owed for it | none |
| — | info | exclusivity | AC-716 | — | Single AC under STORY-80; no intra-story duplication is possible | none |

## Notes for the Editor

- Nothing to repair. Single-AC coverage is by design, not a gap: STORY-80's Technical
  Notes state "this story's AC is the repointer for the absolute-base capability so it
  is not orphaned by the module-dial deletion," and delegate detailed L1 axis + envelope
  behaviour to the L1 Substrate + Safety Envelope capability/story. Splitting AC-716
  would duplicate that story's coverage (an exclusivity risk), so it is deliberately kept
  as one repointer AC.
- AC-716 status is `pending`; that is normal AC state and is not an ac-level alignment
  concern (test presence is a uat-level check).
- The named-overlay (palette role / named step / named shape) must remain absent from
  this capability's AC tree while REQ-79 #4 keeps it parked in L2. A future ac-add that
  introduced an overlay-role AC here would be drift unless a new reconciled intent
  unparks it.
