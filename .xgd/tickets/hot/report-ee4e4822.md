---
uid: report-ee4e4822
id: REPORT-829
type: report
title: 'Capability-Intent Alignment: Framework Absolute-or-Overlay Value System (level=uat)'
created_by: xgd
created_at: '2026-07-23T10:00:15.436569+00:00'
updated_at: '2026-07-23T10:00:15.436569+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-6e088083
  level: uat
  violations: 0
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: Framework Absolute-or-Overlay Value System
# Level: uat

**Result**: PASS
**Violations**: 0
**Warnings**: 1
**Needs review**: 0

## Cumulative Intent Considered

Both intents that touched this capability's story tree are `free_and_reconciled`
(counted). Level cascade: story-level (REPORT-827) and ac-level (REPORT-828)
alignment checks both PASSED, so AC-716's body is the working reference here;
intent history consulted only to classify the one docstring-drift warning.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-6 (REQ-58+59+61+62) | free_and_reconciled | 2026-07-17 | Originating intent for CAP-67 / STORY-80 (absolute-or-overlay value base) | YES |
| BUNDLE-7 (REQ-63+79+82+83+84 +2) | free_and_reconciled | 2026-07-22 | Framework pivot (REQ-79 #2 "one value = one literal field — no theme-role indirection in L1"); deleted layout modules + dials (REQ-84); re-homed absolute base on L1 leaf literals | YES |

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-80 (story-c490f1cf, upgrade) | BUNDLE-6, BUNDLE-7 | aligned (story/ac levels passed upstream) |
| AC-716 (acceptance_criterion-1eaa93b8) | BUNDLE-6, BUNDLE-7 | aligned — verification calls for author→validate→render literals verbatim + reject malformed |
| test_UAT_AC716_absolute_literals_carried_verbatim_and_malformed_rejected (tests/reconciliation-absolute-value-literals.test.ts:26) | BUNDLE-6, BUNDLE-7 | aligned (test body); docstring header carries stale story-title text (warning #1) |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | consistency | tests/reconciliation-absolute-value-literals.test.ts:2-3 | uat-edit (docstring only) | Docstring quotes the retired story title "every colour, length, and radius dial accepts a literal or a named overlay" — the `literal OR named overlay` dial-union model. REQ-79 #2 (BUNDLE-7, free_and_reconciled, 2026-07-22) retired the union: L1 carries only the absolute literal, overlay parked in L2. Executable body is correct; only the comment drifted. | Update docstring lines 2-3 to STORY-80's current title ("Absolute values re-homed in L1 … named overlay parked in L2"); no test-logic change. |
| 2 | info | coverage | AC-716 / test_UAT_AC716_* | — | Single substantive UAT fully covers AC-716: 3 hex forms + 4 length/radius axes emitted verbatim; 7 rejection paths (non-hex rgb/keyword/url, NaN, font-size out-of-range, negative radius, geometry ±100k). Exercises real validateL1 + renderL1Document. Passes on real code (verified this run). | none |

## Notes for the Editor

- **UAT evidence is valid.** The test drives the real envelope validator and the
  single safe emitter — no internal mocking, no AST-only assertions. It was run
  during this assessment and passed (1 passed).
- The only drift is a cosmetic stale-title quote in the test docstring. It does
  not affect pass/fail (warning) but is worth an opportunistic fix: the quoted
  old title describes the `absolute OR role` union that REQ-79 explicitly
  rejected, so a future reader could mistake it for live intent. The corrective
  text is already present two lines below (lines 4-8 describe the correct
  literal-only re-homing), so the fix is a one-line title swap.
- No `code-issue`: production code (validateL1 rejection paths + renderL1Document
  verbatim carry-through) does exactly what the AC and test describe.

