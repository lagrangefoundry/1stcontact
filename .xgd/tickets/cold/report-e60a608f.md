---
uid: report-e60a608f
id: REPORT-830
type: report
title: 'UAT Coverage: Framework Absolute-or-Overlay Value System'
created_by: xgd
created_at: '2026-07-23T10:04:48.892529+00:00'
updated_at: '2026-07-23T10:04:48.892529+00:00'
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

Chronological ledger of intents that touched this capability:

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-6 (REQ-58/59/61/62) | free_and_reconciled | 2026-07-19 | Original absolute-or-overlay capability, delivered via ~20 semantic-module colour/length/radius dials | YES (superseded) |
| REQ-79 | free_and_reconciled | 2026-07-22 | Framework pivot: L1 layout substrate + capability modules. Re-homes the absolute base onto L1 leaf literals; "one value = one literal field — no theme-role indirection in L1" | YES |
| REQ-84 | bundled (in reconciled BUNDLE-7) | 2026-07-22 | Strips the semantic layout modules (header/hero/footer/text-block/services-grid/layer) + their dials to L1 | YES |
| REQ-85 | free_and_reconciled | 2026-07-22 | Capability-module contract; carries the superseded-AC list (AC-660..665) | YES (retires old delivery) |
| BUNDLE-7 (REQ-63/79/82/83/84/+2) | free_and_reconciled | 2026-07-22 | Bundle that reconciled the pivot; story's `updated_by` | YES |

**Current cumulative intent**: The absolute (literal) side of the absolute-or-overlay model — originally delivered via ~20 module dials (BUNDLE-6) — is re-homed onto **L1 leaf axes** by the REQ-79/84/85 pivot. Each leaf carries the concrete value as a typed literal (hex-only colour; finite px length/geometry/radius), guaranteed well-formed and in range by the envelope validator and emitted verbatim by the single safe emitter. The named-overlay half is the parked L2 design library — delivered nowhere in the substrate. The old module-dial delivery (AC-660..665) is intentionally superseded, not lost.

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-80 | REQ-79, REQ-84, REQ-85 (BUNDLE-7); BUNDLE-6 (superseded origin) | aligned | Story body accurately describes the re-homing to L1 leaf literals, correctly frames AC-660..665 as an intentional supersession (not a lost-work overwrite), and correctly parks the named-overlay in L2. No stale claim; no missing behavior. |

## Findings — Categorized by Editor Action

No findings. Zero violations, zero warnings, zero needs_review.

## Notes for the Editor

- **AC-716 is a repointer AC** whose verification explicitly delegates detailed L1 axis/envelope behaviour to the L1 substrate story. Its own behavioural claim — every absolute literal (colour, length, radius) carried verbatim + malformed literal rejected — is substantively and directly proven by `tests/reconciliation-absolute-value-literals.test.ts::test_UAT_AC716_absolute_literals_carried_verbatim_and_malformed_rejected`. That UAT uses real entry points (`validateL1`, `renderL1Document`), asserts verbatim carry-through of all three hex forms (#rgb/#rrggbb/#rrggbbaa) plus font-size/line-height/letter-spacing/border-radius in the emitted CSS, and rejects 7 distinct malformed variants (rgb()/keyword/url() colours, non-finite and out-of-range length, negative radius, out-of-range geometry). It is not trivial, over-mocked, or structural, and it passes (verified this run).
- The claim is further reinforced (belt-and-braces) by the L1 substrate story's real-Chromium round-trip UATs (AC-682..688 in `tests/reconciliation-l1-substrate.test.ts` and the REQ-82 probes in `tests/req82-l1-substrate.test.ts`), which prove `capture(render(L1)) ≈ L1` for authored literal axes at all captured widths.
