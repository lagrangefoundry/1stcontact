---
uid: report-6a03d263
id: REPORT-916
type: report
title: 'Capability-Intent Alignment: Framework Absolute-or-Overlay Value System (level=uat)'
created_by: xgd
created_at: '2026-07-24T08:30:04.077007+00:00'
updated_at: '2026-07-24T08:30:04.077007+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-6e088083
  level: uat
  violations: 0
  warnings: 0
  needs_review_count: 0
---

# Capability-Intent Alignment: Framework Absolute-or-Overlay Value System
# Level: uat

**Result**: PASS
**Violations**: 0
**Warnings**: 0
**Needs review**: 0

## Cumulative Intent Considered

Chronological ledger of intents that touched this capability (via STORY-80
`intent_uid` = BUNDLE-6 and `updated_by` = BUNDLE-7):

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-6 (REQ-58+59+62+61) | free_and_reconciled | originating | Created the absolute-or-overlay capability; delivered the absolute base via semantic layout-module dials (AC-660..665) | YES |
| BUNDLE-7 (REQ-63+79+82+83+84+2 more) | free_and_reconciled | pivot | Deleted the semantic layout modules + ~20 dials (REQ-84); re-homed the absolute base on L1 leaf axes as validated literals (REQ-79 #2, REQ-82 L1 substrate); parked the named-overlay half in the L2 design library; updated STORY-80 / AC-716 in place to repoint at L1 | YES (supersedes BUNDLE-6 delivery) |

Cumulative picture: the absolute-base capability survives; its *delivery* moved
from module dials to L1 leaf literals. The named-overlay affordance is parked in
L2 (not currently delivered). The matrix (capability body, STORY-80 body, AC-716)
uniformly reflects this post-pivot state.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-80 (story-c490f1cf, upgrade) | BUNDLE-6, BUNDLE-7 | aligned — body describes L1-rehomed absolute literals + parked L2 overlay; explicitly notes AC-660..665 superseded (intentional, per REQ-79/REQ-85) |
| AC-716 (acceptance_criterion-1eaa93b8) | BUNDLE-7 | aligned — criterion = L1 leaf axes carry hex-colour / finite-px literals verbatim, malformed rejected by envelope; consistent with story body |
| test_UAT_AC716_absolute_literals_carried_verbatim_and_malformed_rejected (tests/reconciliation-absolute-value-literals.test.ts) | AC-716 | aligned — substantive UAT via real entry points |

## Findings

None. No violations, warnings, or needs_review items.

Positive verification detail for the UAT (the sole uat-level element):

- **Consistency** — the test exercises exactly what AC-716 claims. It uses the
  real production entry points `validateL1` (packages/site-schema) and
  `renderL1Document` (packages/framework) — not an AST/structural check. It
  asserts verbatim carry-through of all three value types: colour in every hex
  form (`#f0a` short, `#0a0b0c` 6-digit, `#11223344` 8-digit), length literals
  (`font-size: 42px`, `line-height: 50px`, `letter-spacing: 3px`), and radius
  (`border-radius: 12px`). It asserts rejection of every malformed-literal class
  named in the AC: non-hex colour as `rgb()`, keyword, and `url()`; non-finite
  length (NaN); out-of-range font-size (5000 > 400); negative radius; and
  out-of-range geometry coordinate (200000 > 100k).
- **Coverage** — AC-716 (the only active AC on the only feature/upgrade story) has
  one substantive UAT. No behavioural surface of the AC is left unexercised.
- **Exclusivity** — a single UAT; no redundant same-shape duplicate.
- Test executed green during this check (vitest: 1 file / 1 test passed).

## Notes for the Editor

Nothing to repair. The BUNDLE-6 → BUNDLE-7 supersession is handled correctly in
the matrix: STORY-80's body flags the AC-660..665 module-dial delivery as an
intentional supersession (per the REQ-79 reconciliation note and the REQ-85
superseded-AC list), not a lost-work overwrite, and AC-716 is the repointer that
keeps the absolute-base capability from being orphaned by the module deletion.
The parked L2 named-overlay half is correctly described as not-currently-delivered
in all three matrix elements, matching REQ-79 #2 (no theme-role indirection in L1).
