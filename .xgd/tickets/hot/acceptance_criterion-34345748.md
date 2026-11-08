---
uid: acceptance_criterion-34345748
id: AC-2024
type: acceptance_criterion
title: A deployment that cannot take pictures still starts an editing assistant, with
  no looking operations offered
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-10-27T19:42:00.130589+00:00'
updated_at: '2026-11-08T04:35:59.666873+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-58b2cec4
  kind: behavior
  regression_only: false
  title: A deployment missing either the browser binding or the private bucket still
    opens a session, with no looking operations offered
---

## Criterion
A deployment that cannot look still opens a consultant session, replays its transcript, and takes editing turns. A deployment cannot look when it is any of:
- a Worker with no Browser Rendering binding (and no injected browser);
- a Worker with a browser but no private bucket for the client's material — there is nowhere private to keep what is looked at, and a capture must never be written where a site's published bytes live;
- a Node host with no known outside origin.

In that case:
- Its offered tools are the site-editing operations, plus the knowledge operations where configured.
- None of the six looking operations is offered, and the tool manual does not mention them.
- Session construction does not fail, and nothing fails on first use, even though the consultant's grant names the looking surface.

The grant is only ever narrowed by this, never widened: no surface that is not granted becomes available.

## Verification
Drive both hosts with the looking surface not composed but the standard consultant grant in place.
- **Node.** Use the real Node host with no outside origin. Run a consultant turn scripted to call `set_l1`. Assert:
  - the session constructs;
  - the edit lands in the workspace;
  - no looking tool is offered.
- **Worker, no browser.** Inside workerd, use the Worker's own router and chat routes with real D1/R2. Configure no `BROWSER` binding and inject no launcher. Run the same scripted `set_l1` turn. Assert:
  - the session opens ready;
  - `set_l1` is offered and no looking tool is;
  - the edit is read back from the tenant's store.
- **Worker, no private bucket.** Inject a browser launcher but configure no `BLOBS` binding. Assert the session opens, editing works, and no looking tool is offered.
- **Narrowing.** Compose the surface with a grant that omits it. Assert that the surface's operations are not offered.
