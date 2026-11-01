---
uid: report-af435d1e
id: REPORT-789
type: report
title: 'UAT Coverage: Capability Module Contract & Catalog'
created_by: xgd
created_at: '2026-07-23T06:57:43.637564+00:00'
updated_at: '2026-07-23T06:57:43.637564+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-ce902be4
  violations: 0
  warnings: 1
  needs_review_count: 0
---

# UAT Coverage Assessment: Capability Module Contract & Catalog

**Result**: PASS
**AC verdicts**: 8 pass, 0 fail, 0 deprecated, 0 needs_review
**Story verdicts**: 1 pass, 0 fail, 0 stale, 0 needs_review
**Capability verdict**: pass

## Cumulative Intent Considered

Chronological ledger of intents that touched this capability (STORY-85 →
`intent_uid: bundle-31e474b9`):

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-7 (REQ-63+REQ-79+REQ-82+REQ-83+REQ-84 +2) | free_and_reconciled | merged @ edeb1c2c | The framework pivot: layout → L1 substrate (REQ-79/84); structured-only L1 security envelope (REQ-82); a "module" becomes a **capability** = vetted behavioural core + typed config + named L1 slots + conformance incl. isolation; the two survivors (carousel, contact-form) reframed onto the contract; shipped-client-JS asset folded once per page | YES |

No later intent retires any of this capability's behaviours. Every AC and the
story body is supported by the reconciled pivot bundle; nothing is stale,
deprecated, or unsupported.

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-85 | BUNDLE-7 (REQ-79 / REQ-82 / REQ-83 / REQ-84) | aligned | Story body's in-scope surface (config/slots/conformance contract, instance validation + slot-as-L1 security line, carousel + contact-form observable behaviour, shipped-client-JS asset, isolation dimension) is exactly what the reconciled pivot asked for. Out-of-scope items (L1 substrate, capture→L1 fold, future capabilities, deleted pre-pivot layout modules) are explicitly delegated to other stories — no stale claim of retired behaviour. |

## Findings — Categorized by Editor Action

| # | Severity | Level | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | uat | AC-702 | uat-edit | AC-702's Criterion has two arms: (a) a build that ships client behaviour emits exactly one folded `capabilities.js` referenced once per page, and (b) a build whose catalog ships **no** client behaviour emits neither asset nor reference. `test_UAT_AC702_...` proves arm (a) end-to-end via the real `cmdNew`/`cmdRender` pipeline, but proves arm (b) only indirectly — it asserts `getModuleClientJs().length > 0` (the emission gate is truthy) rather than driving an empty-catalog build and observing suppression. The negative arm is architecturally hard to reach (the fixed survivor catalog always ships client JS). Non-blocking; identical to the prior `check_uat_validation` Finding 1. | Add coverage of the suppression arm — either an empty/JS-free catalog render asserting no `capabilities.js` and no script reference, or a unit-level assertion that the emitter's empty-`getModuleClientJs()` branch writes neither. |

## Notes for the Editor

No violations and no needs_review — this capability passes the coverage gate.

Coverage is substantive across the board: every AC is exercised at a real
boundary, not through structural/naming assertions or by mocking the unit under
test —
- AC-697 / AC-698 drive the real `validateCapabilityConfig` / `validateCapabilitySlots` /
  `validateCapabilityInstance` with valid + single-defect fixtures (incl. the
  raw-markup slot-injection security case → slot-scoped violation).
- AC-699 / AC-701 render the real `carousel` / `contact-form` `.astro` cores
  through the Astro SSR container (the same path `tools/generate` uses).
- AC-700 drives the real shipped `client.js` (`advanceTrack` / `enhanceCarousel`)
  with an injectable timer and DOM element doubles — the code under test is real,
  only the DOM host is stubbed (no browser).
- AC-702 runs the real `cmdNew` → `cmdRender` generate pipeline into a tmpdir and
  inspects the emitted `capabilities.js` + per-page script reference.
- AC-703 exercises the real `assertModuleConforms` isolation harness — both the
  inert-degradation pass path and a throwing-core fixture producing a genuine
  `isolation.render-throws` violation (proving the dimension discriminates).
- AC-704 introspects each survivor's published contract for exactly the five
  conformance obligations — a declaration-check AC whose test matches its
  Verification wording exactly.

The single warning (AC-702 suppression arm) does not affect pass/fail and can be
folded into the next touch of that capability's tests.

