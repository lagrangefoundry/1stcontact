---
uid: acceptance_criterion-b5c65f03
id: AC-2442
type: acceptance_criterion
title: REF-l1 documents the overlay role, the action verb and the four modal rules
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T13:10:01.096350+00:00'
updated_at: '2026-11-08T13:25:14.889649+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-e214a00d
  kind: behavior
  regression_only: false
---

## Criterion
The generated REF-l1 reference shows the `dialog` role and its fields (backdrop, placement, dismissOnEscape, dismissOnBackdrop, ariaLabel), the `action` verb and its `opens`/`closes` shape, and the four modal structural rules (panel declares an id; exactly one verb; target exists and carries dialog; link and action exclusive), each with its explanatory prose. The reference-covers-source check reports no vocabulary gap for them.

## Verification
Generate REF-l1. Assert it contains the dialog and action entries with their fields and the four rule statements. Run the reference-covers-source check and assert it reports no missing terms.