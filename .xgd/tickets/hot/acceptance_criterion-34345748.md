---
uid: acceptance_criterion-34345748
id: AC-2024
type: acceptance_criterion
title: A deployment that cannot take pictures still starts an editing assistant, with
  no looking operations offered
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-10-27T19:42:00.130589+00:00'
updated_at: '2026-10-30T20:12:07.120563+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-58b2cec4
  kind: behavior
  regression_only: false
---

## Criterion
When the deployment has no browser, a consultant session still opens and takes editing turns. A deployment has no browser when it is either:
- a Worker with no Browser Rendering binding, or
- a Node host with no known outside origin.

In that case:
- Its offered tools are the site-editing operations, plus the knowledge operations where configured.
- None of the six looking operations is offered.
- Session construction does not fail, even though the consultant's grant names the looking surface.

The grant is only ever narrowed by this, never widened: no surface that is not granted becomes available.

## Verification
Drive both hosts with the looking surface not composed but the standard consultant grant in place.
- **Node.** A Node host with no outside origin has no looking surface. Through the real Node host, run a consultant turn scripted to call `set_l1`. Assert:
  - the session constructs;
  - the edit lands in the workspace;
  - no looking tool is in the offered set.
- **Worker.** Inside workerd, use the Worker's own router and chat routes, with real D1/R2. Configure no `BROWSER` binding and inject no launcher. Run the same scripted `set_l1` turn. Assert:
  - the session opens ready;
  - `set_l1` is offered and no looking tool is;
  - the edit is read back from the tenant's store.
- **Narrowing.** Compose the surface, but with a grant that omits it. Assert that the surface's operations are not offered.
