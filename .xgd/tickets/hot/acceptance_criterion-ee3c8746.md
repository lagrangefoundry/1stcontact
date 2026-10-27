---
uid: acceptance_criterion-ee3c8746
id: AC-2022
type: acceptance_criterion
title: The consultant is offered the six looking operations beside the site-editing
  ones, from a separate read-only surface
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-10-27T19:41:55.541616+00:00'
updated_at: '2026-10-27T19:41:55.541616+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-58b2cec4
  kind: behavior
  regression_only: false
---

## Criterion
A consultant session whose deployment can take pictures is offered, as tools, exactly the six operations of the looking surface — `capture_site`, `list_references`, `describe_reference`, `screenshot`, `compare`, `check_fidelity` — in addition to its site-editing tools. The site-editing surface declaration contains none of these six operations, the looking surface is a separate declaration with its own name, and the instance configuration naming both validates without error.

## Verification
Construct a consultant toolbox with the looking surface composed; assert the offered tool names are the union of both declarations' operations and include all six; assert the site-editing declaration lists none of them; run author-time validation over the instance config and both declarations and assert it passes.
