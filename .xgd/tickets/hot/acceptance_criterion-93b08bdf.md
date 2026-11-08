---
uid: acceptance_criterion-93b08bdf
id: AC-2437
type: acceptance_criterion
title: A reveal on a panel is not emitted while a reveal on its contents is
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T13:09:35.695379+00:00'
updated_at: '2026-11-08T13:09:35.695379+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-e214a00d
  kind: behavior
  regression_only: false
---

## Criterion
When a node carrying `dialog` also declares a scroll `reveal`, the render emits no reveal pre-state or reveal behaviour for that panel, so it never sits at zero opacity. A `reveal` declared on a node inside the panel is still emitted as usual.

## Verification
Render a panel with a reveal and a child with a reveal. Assert the panel carries no reveal marker or pre-state rule and the child does.