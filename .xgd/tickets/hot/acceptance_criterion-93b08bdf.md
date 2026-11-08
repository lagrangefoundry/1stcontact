---
uid: acceptance_criterion-93b08bdf
id: AC-2437
type: acceptance_criterion
title: A reveal on a panel is not emitted while a reveal on its contents is
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T13:09:35.695379+00:00'
updated_at: '2026-11-08T13:25:14.654040+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-e214a00d
  kind: behavior
  regression_only: false
---

## Criterion
When a node carrying `dialog` also declares a scroll `reveal`, the render emits no reveal pre-state rule and no reveal transition for that panel, so it never sits at zero opacity. No stylesheet rule keys the panel's class on the motion marker (`data-l1-motion`) or the revealed state (`l1-in`). The panel may still carry the observer's handle class, but that handle is inert, because no rule acts on it. A `reveal` declared on a node inside the panel is still emitted as usual: the child carries the reveal handle and its pre-state rule.

## Verification
Render a panel with a reveal and a child with a reveal. Assert the stylesheet has no pre-state rule, no transition and no motion-marker or revealed-state rule for the panel's class. Assert the child carries the reveal handle and its `html[data-l1-motion] … :not(.l1-in) { opacity: 0 … }` pre-state rule.