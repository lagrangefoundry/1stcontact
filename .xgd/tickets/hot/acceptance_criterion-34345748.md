---
uid: acceptance_criterion-34345748
id: AC-2024
type: acceptance_criterion
title: A deployment missing either the browser binding or the private bucket still
  opens a session, with no looking operations offered
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-10-27T19:42:00.130589+00:00'
updated_at: '2026-11-08T10:14:20.031697+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-58b2cec4
  kind: behavior
  regression_only: false
  title: A deployment with no browser still opens a session with no looking operations
    offered; a Worker with no private bucket opens no chat at all, and the looking
    surface's own private-bucket check is defence in depth
---

## Criterion
A deployment that has nothing to look with still opens a consultant session, replays its transcript, and takes editing turns. That is:
- a Worker with no Browser Rendering binding (and no injected browser);
- a Node host with no known outside origin.

In that case:
- Its offered tools are the site-editing operations, plus the knowledge operations where configured.
- None of the six looking operations is offered, and the tool manual does not mention them.
- Session construction does not fail, and nothing fails on first use, even though the consultant's grant names the looking surface.

The grant is only ever narrowed by this, never widened: no surface that is not granted becomes available.

**A Worker with no private bucket (`BLOBS`) opens no chat at all.** The chat's transcript store is the ticket store, which needs `BLOBS` (REQ-160). So opening a session (`POST /api/ai/session`) and taking a turn (`POST /api/ai/prompt`) are both refused with the router's ordinary 500, whose `error` is the transcript store's sentence naming the missing binding (`The BLOBS binding is not configured…`). No browser is leased and the model is never asked. The failure is not cached: once the binding is configured, the same business opens a session.

**The looking surface's own `BLOBS` check is defence in depth.** `sessionFidelity` composes no looking surface without `BLOBS`, even where a browser is present. On a real deployment this check is never what decides, because the transcript store refuses first. It still guarantees that no capture could be kept anywhere but the private bucket if the transcript store ever stopped needing `BLOBS`.

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
- **Worker, no private bucket (real outcome)** (`test_UAT_AC2024_a_worker_with_a_browser_but_no_private_bucket_refuses_the_session_naming_the_missing_binding`). Inject a browser launcher, configure no `BLOBS`, and replace no router seam. Assert:
  - `/api/ai/session` answers 500 with no `sessionId`, and its `error` contains `The BLOBS binding is not configured`;
  - `/api/ai/prompt` answers 500 with the same sentence;
  - the launcher was never invoked and the model double saw no request;
  - with `BLOBS` restored, the same business's session opens ready.
- **Worker, defence in depth** (`test_AC2024_defence_in_depth_the_looking_surface_withholds_its_operations_without_a_private_bucket`). Assert that `sessionFidelity` returns `null` without `BLOBS` and a factory with it. Then supply the transcript store through the router's `tickets` seam so that only the surface's own check is in play, and run a `set_l1` turn. Assert that the session opens ready, the edit lands, `set_l1` is offered, no looking tool is offered, and no browser is leased.
- **Narrowing.** Compose the surface with a grant that omits it. Assert that the surface's operations are not offered.
