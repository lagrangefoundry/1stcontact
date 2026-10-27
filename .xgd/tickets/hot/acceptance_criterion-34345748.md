---
uid: acceptance_criterion-34345748
id: AC-2024
type: acceptance_criterion
title: A deployment that cannot take pictures still starts an editing assistant, with
  no looking operations offered
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-10-27T19:42:00.130589+00:00'
updated_at: '2026-10-27T19:42:00.130589+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-58b2cec4
  kind: behavior
  regression_only: false
---

## Criterion
When the deployment has no browser — a Worker with no Browser Rendering binding, or a Node host with no known outside origin — a consultant session still opens and takes editing turns: its offered tools are the site-editing (and, where configured, knowledge) operations, none of the six looking operations is offered, and session construction does not fail even though the consultant's grant names the looking surface. The grant is only ever narrowed by this, never widened: no surface that is not granted becomes available.

## Verification
Construct a consultant session with the looking surface not composed but the standard consultant grant in place; assert construction succeeds, a site-editing tool runs and changes the site, and no looking tool is in the offered set. Repeat with a grant that omits a composed surface and assert that surface's operations are not offered.
