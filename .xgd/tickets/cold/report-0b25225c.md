---
uid: report-0b25225c
id: REPORT-915
type: report
title: 'Capability-Intent Alignment: Framework Absolute-or-Overlay Value System (level=ac)'
created_by: xgd
created_at: '2026-07-24T08:27:47.975576+00:00'
updated_at: '2026-07-24T08:27:47.975576+00:00'
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

## Cumulative Intent Considered

Chronological ledger of intents that touched this capability (via
`fields.intent_uid` / `fields.updated_by` on STORY-80, plus the pivot
intents cited in the story body):

| Intent ID | Status | When (merge commit) | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-79 / REQ-84 / REQ-85 (framework pivot) | reconciled (cited by story) | pre-story | Deleted semantic layout modules (header/hero/footer/text-block/services-grid/layer) + ~20 dials; re-homed absolute base on L1 leaf literals; principle "one value = one literal field — no theme-role indirection in L1" | YES (retired the module-dial delivery; established the L1 re-homing) |
| bundle-ab9e0cb6 → REQ-58 (gigabytealchemy re-import pass 3) | merged @ 7a42e182 | intent_uid | Originating intent for STORY-80's current form; absolute-base capability authorable via L1 literals | YES |
| bundle-31e474b9 → REQ-63 (capture/diff coverage audit) | merged @ edeb1c2c | updated_by | Every render-affecting CSS axis captured + measurable (dual of the expression audit) | YES |

At `ac` level the story body is the working reference and is internally
consistent, so the ledger above is confirmatory context rather than the
primary check.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-80 (story-c490f1cf, upgrade) | bundle-ab9e0cb6 (REQ-58), bundle-31e474b9 (REQ-63); pivot REQ-79/84/85 | aligned — story is the repointer keeping the absolute-base capability from being orphaned by the module-dial deletion |
| AC-716 (acceptance_criterion-1eaa93b8, behavior) | inherits STORY-80's intents | aligned — every clause traces to a story-body clause; correctly scopes detailed L1/envelope behaviour to the L1 substrate story |

## Findings

No violations, warnings, or needs-review items.

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | info | consistency | AC-716 | — | AC-716's three clauses (colour hex-only verbatim + non-hex rejected; length/geometry/radius finite-px verbatim + envelope bounds + out-of-range/non-finite rejected; named-overlay parked above L1) each map 1:1 to a STORY-80 body clause. No drift. | none |
| 2 | info | coverage | AC-716 | — | Single-AC coverage is intentional: STORY-80 is explicitly a "repointer" AC (module-dial delivery AC-660..665 superseded by the pivot per REQ-85); detailed L1 axis + envelope behaviour is owned by the L1 substrate story. Both the story body and AC-716's Verification state this delegation. Not a coverage gap. | none |
| 3 | info | exclusivity | STORY-80 | — | Only one AC under the story; no intra-story duplication possible. | none |

## Notes for the Editor

- STORY-80 is an `upgrade` whose post-pivot role is deliberately narrow: it exists
  so the absolute-base capability (formerly delivered by the deleted layout-module
  dials) is not orphaned. The single repointer AC (AC-716) is the correct shape for
  that role — do not expand it into per-leaf-kind or per-envelope-bound ACs, since
  the story body and AC both delegate that detail to the L1 substrate story. Adding
  such ACs would duplicate the L1 substrate story's coverage.
- The AC summarises the length bound as "within envelope bounds" where the story
  body gives the concrete "length ±100k". This is an accurate abstraction, not an
  inconsistency — no action needed.
