---
uid: report-e88e23cb
id: REPORT-917
type: report
title: 'UAT Coverage: Framework Absolute-or-Overlay Value System'
created_by: xgd
created_at: '2026-07-24T08:34:40.238106+00:00'
updated_at: '2026-07-24T08:34:40.238106+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-6e088083
  violations: 0
  warnings: 0
  needs_review_count: 0
---

# UAT Coverage Assessment: Framework Absolute-or-Overlay Value System

**Result**: PASS
**AC verdicts**: 1 pass, 0 fail, 0 deprecated, 0 needs_review
**Story verdicts**: 1 pass, 0 fail, 0 stale, 0 needs_review
**Capability verdict**: pass

## Cumulative Intent Considered

Chronological ledger of intents that touched this capability. The story was
created by BUNDLE-6 (`intent_uid`) and last updated by BUNDLE-7 (`updated_by`);
both bundles are `free_and_reconciled` (count toward cumulative intent). The
load-bearing intents inside BUNDLE-7 are the framework-pivot REQs.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-6 (REQ-58/59/61/62) | free_and_reconciled | merged 7a42e18 | Created STORY-80 (absolute-base capability story) | YES |
| REQ-79 (in BUNDLE-7) | free_and_reconciled | merged edeb1c2 | Framework pivot: L1 substrate is the absolute base; "one value = one literal field — no theme-role indirection in L1"; L2 named-overlay parked (#4, "possibly never needed") | YES |
| REQ-82 (in BUNDLE-7) | free_and_reconciled | merged edeb1c2 | L1 layout substrate + envelope validator (hex-only colour, range-bounded numerics) | YES |
| REQ-84 (in BUNDLE-7) | free_and_reconciled | merged edeb1c2 | Deleted the semantic layout modules and their ~20 colour/length/radius dials (AC-660..665 superseded) | YES (retired old delivery) |
| REQ-85 (superseded-AC list) | free_and_reconciled | merged edeb1c2 | Records AC-660..665 as intentionally superseded, not lost-work | YES |
| BUNDLE-7 (REQ-63/79/82/83/84/+2) | free_and_reconciled | merged edeb1c2 | Updated STORY-80 to re-home the absolute base on L1 leaf literals; AC-716 is the repointer AC | YES |

**Current cumulative intent**: the absolute (literal) base of the
absolute-or-overlay model is ACTIVE, re-homed on L1 leaf axes (colour = hex-only
literal; length/geometry/radius = finite range-bounded px literal), guaranteed by
the envelope validator and carried verbatim by the single safe emitter. The
named-overlay half (L2 palette role / named step / named shape) is deliberately
NOT delivered (parked L2 library). The prior module-dial delivery (AC-660..665)
is intentionally retired.

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-80 | REQ-79, REQ-82, REQ-84, REQ-85 | aligned | Body correctly describes L1-literal delivery, correctly parks the L2 overlay as not-delivered, and frames the AC-660..665 module-dial deletion as intentional supersession (not lost work). No behavioral claim in the body is left uncovered. |

## Findings — Categorized by Editor Action

No findings. Zero violations, zero warnings, zero needs_review.

| # | Severity | Level | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| — | — | — | — | — | (none) | — |

## Evidence Detail

- **AC-716** ("L1 leaf axes carry the absolute (literal) value, validated by the
  envelope") — **pass**. Test
  `test_UAT_AC716_absolute_literals_carried_verbatim_and_malformed_rejected` in
  `tests/reconciliation-absolute-value-literals.test.ts` exercises the real
  entry points (`validateL1` from `packages/site-schema/src`, `renderL1Document`
  from `packages/framework/src`) with no mocking. It asserts (a) every literal is
  emitted verbatim — short/6-digit/8-digit hex colour, font-size, line-height,
  letter-spacing, border-radius — and (b) seven distinct malformed literals are
  each rejected by the validator (non-hex rgb()/keyword/url(), non-finite length,
  out-of-range font-size, negative radius, out-of-range geometry coordinate). The
  observations distinguish a correct implementation from a broken one (a
  re-deriving/rounding emitter or a permissive validator would fail). Confirmed
  passing: `vitest run` → 1 passed.

## Notes for the Editor

The `uat_index.json` `status: "missing"` on ac716 (and on all 68 indexed ACs in
this fresh regression worktree) reflects that the index has not been populated
with run results here — it is NOT a coverage or validity signal. The test file
exists and passes when executed. This is the known "regression worktree missing
UAT run-state" condition, not a gap for the editor to act on.
