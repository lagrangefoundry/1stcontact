---
uid: report-5e099f33
id: REPORT-493
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-07-13T19:51:45.437636+00:00'
updated_at: '2026-07-13T19:51:45.437636+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-d9c2e655
  plan_item_index: '1'
---

All 7 acceptance criteria created and linked. The story maps cleanly to the operator's five stated requirement items (grouping, position-first-class, loud unpaired, spec vocabulary, primary read) plus the delivered supporting behaviours (kind-specific tables, clean collapse + non-object tail, structured report), with the item-4 spec-vocabulary divergence noted in Technical Context for regression.

```
Story #1 created for reconciliation bundle-d9c2e655

Story UID: story-74050e88 (STORY-67)
Title: Object-grouped fidelity comparison report
Type: feature
Capability: capability-7c7e5ec4 (CAP-56, "Fidelity Value-Diff Reporting")
Acceptance Criteria: 7 created
  - AC-575: groups deltas into one card per reference object, worst object first
  - AC-576: box position is a first-class parameter on every card
  - AC-577: unpaired objects reported loudly in both directions with counts
  - AC-578: expected column prints spec field names/units (paste-able)
  - AC-579: image/control objects carry kind-appropriate parameter tables
  - AC-580: clean objects collapse to a count; non-object deltas in a tail
  - AC-581: machine-readable report carries object cards + unpaired list

Progress: 1 of 8 plan items complete
```
