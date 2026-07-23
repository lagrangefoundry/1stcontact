---
uid: report-1956d8ad
id: REPORT-825
type: report
title: 'Capability-Intent Alignment: Framework Absolute-or-Overlay Value System (level=story)'
created_by: xgd
created_at: '2026-07-23T09:47:28.664941+00:00'
updated_at: '2026-07-23T09:47:28.664941+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-6e088083
  level: story
  violations: 1
  warnings: 0
  needs_review_count: 0
---

# Capability-Intent Alignment: Framework Absolute-or-Overlay Value System
# Level: story

**Result**: FAIL
**Violations**: 1
**Warnings**: 0
**Needs review**: 0

## Cumulative Intent Considered

The capability (CAP-67, `framework_value_system`) has one story, STORY-80
(story-c490f1cf), whose `intent_uid` is bundle-ab9e0cb6 and `updated_by` is
bundle-31e474b9. Both bundles are `free_and_reconciled`. The source tickets
inside those bundles that touch this capability are the operative intents:

| Intent ID | Status | When (merged_at_commit) | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-58 (request-c2d25c7b) | free_and_reconciled | bundle-ab9e0cb6 (7a42e18) | gigabytealchemy pass-3 import; original module-dial delivery of the absolute base (AC-660..665 era) | YES (origin) |
| REQ-79 (request-87b26bca) | free_and_reconciled | bundle-31e474b9 (edeb1c2) | Framework pivot: L1 layout substrate; #2 "one value = one literal field, no theme-role indirection in L1"; #4 named overlay parked to L2 ("possibly never needed") | YES |
| REQ-84 (request-f243b6b9) | bundled → in bundle-31e474b9 (free_and_reconciled) | bundle-31e474b9 (edeb1c2) | DELETE layout modules `header/ hero/ footer/ text-block/ services-grid/ layer/` + ~20 layout dials; catalog reduces to `carousel` + `contact-form` | YES |
| REQ-85 (request-015e42ac) | free_and_reconciled | bundle-31e474b9 (edeb1c2) | Capability-module contract; **reframe** the two survivors `carousel` & `contact-form` (NOT delete); superseded-AC list | YES |

**Current cumulative intent for this capability**: the absolute base (the literal
side of the absolute-or-overlay model) is re-homed on L1 leaf axes — colour = hex
literal, length/geometry = finite px literal, radius = finite px literal — each
validated by the envelope. The prior module-dial delivery is intentionally
superseded by the pivot. The named-overlay half (palette role / named step /
named shape) is parked as the L2 design library and is NOT currently delivered.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-80 (story-c490f1cf) | REQ-58 (origin), REQ-79, REQ-84, REQ-85 | aligned on the operative claim (absolute base re-homed in L1 leaf literals; overlay parked in L2) — but story body's enumeration of deleted layout modules contradicts REQ-84 + REQ-85 (see Finding 1) |
| AC-716 ("L1 leaf axes carry the absolute (literal) value, validated by the envelope") | REQ-79, REQ-84 | aligned (repointer AC for the absolute-base capability; substantive L1-axis/envelope coverage owned by the L1 substrate story under another capability) |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | STORY-80 (story-c490f1cf) | story-body-edit | Story Description says: "the semantic *layout* modules (services-grid, text-block, **contact-form**, hero, header, footer) … were deleted (REQ-84)". Per REQ-84 (free_and_reconciled, bundle-31e474b9): deleted set is `header/ hero/ footer/ text-block/ services-grid/ layer/`, and "Catalog reduces to carousel + contact-form" — so **contact-form was NOT deleted**, and **`layer` WAS deleted but is omitted**. REQ-85 (free_and_reconciled) explicitly *reframes* contact-form as a live capability module. The story body also contradicts the capability body's own correct list (`header, hero, footer, text-block, services-grid, layer`). | In the story Description, replace "services-grid, text-block, contact-form, hero, header, footer" with the correct deleted set "header, hero, footer, text-block, services-grid, layer" (drop contact-form, add layer) — matching REQ-84 and the CAP-67 body. |

## Notes for the Editor

- This is a single, well-scoped story-body-edit. The correct reference text
  already exists verbatim in the capability body (CAP-67), which lists
  `header, hero, footer, text-block, services-grid, layer` — copy that list.
- The error inverts the status of a live artifact: contact-form is a **surviving
  capability module** (REQ-84 catalog + REQ-85 reframe), not a deleted layout
  module. Leaving it uncorrected would mislead future sessions into believing
  contact-form is gone. That is precisely the drift this ledger exists to prevent,
  hence violation rather than warning.
- The operative capability claim (absolute base = L1 leaf literals; overlay parked
  in L2) is correct and fully covers current cumulative intent. Coverage and
  exclusivity are clean: the single story + single repointer AC (AC-716) matches
  the single active capability; the parked L2 overlay is correctly NOT expressed
  as a deliverable (it is not active intent per REQ-79 #4).
