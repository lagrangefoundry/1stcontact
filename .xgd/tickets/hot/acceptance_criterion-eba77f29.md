---
uid: acceptance_criterion-eba77f29
id: AC-2372
type: acceptance_criterion
title: 'On the Worker the looking surface is bound to the request''s business: captures
  are stored in and adopted from that business''s private bucket, and draft pictures
  come from the preview renderer at the deployment''s own origin, with no new HTTP
  route'
created_by: xgd
created_at: '2026-11-08T04:36:39.991915+00:00'
updated_at: '2026-11-08T10:14:59.488073+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-58b2cec4
  kind: behavior
  regression_only: false
---

## Criterion
When a Worker deployment has both a browser and the private bucket, a consultant session in the builder is offered the six looking operations for the business the request is admitted to. On that host:

- **Captures are the business's own private material.**
  - `capture_site` writes its bundle into that business's own private bucket, never into the bucket a site's published bytes are served from.
  - `list_references` and `describe_reference` see that business's references and no other business's.
  - A capture made in business A is not listed in, and cannot be pictured from, business B.
- **A finished capture is adopted as findable material.**
  - The bundle becomes a `reference` in the business's own material corpus, with a prose description, so it can later be found by what it is.
  - The capture's rights are marked third-party: no business domain is declared yet.
  - Adopting the same bundle again does not create a second reference.
  - Where adoption is unavailable or fails, the capture is still stored, and `capture_site` says it was not written up (`reference.adopted: false`, with the reason in `reference.why`).
- **Pictures of the draft, the page being edited and a published revision come from our own channels.**
  - They are rendered in process by the same renderer as the `/preview/*` route, at the deployment's own origin taken from the request, so the page's own assets resolve.
  - Their requests never leave the browser, and cannot come back as an Access challenge page.
- **Outside addresses go over the network.**
  - A `screenshot` of an outside address is not answered in process: its request goes to the network.
  - A `capture_site` gets no in-process answering at all: even a request the captured page makes to our own host goes to the network, so it is not answered out of our store.
- **No new route.** No HTTP route exposes the browser or any looking operation. The surface is reachable only as a tool call inside an admitted, business-scoped consultant turn.

## Verification
Inside workerd (`tests/reconciliation-assistant-looking-surface-business.workers.test.ts`), use the Worker's own router and chat routes with real D1/R2, an injected browser launcher, and the shared model double.
- `test_UAT_AC2372_capture_site_in_a_worker_turn_stores_in_the_businesss_bucket_and_adopts_it`: script a consultant turn in business A that calls `capture_site` on `http://oldbakery.test/` twice, then `list_references`. The injected puppeteer-shaped browser runs every request through the production driver's interception handler, and its page also requests A's own `/preview/<slug>/draft/` URL. Assert:
  - the first tool result reports the capture adopted (`adopted: true`, `created: true`, `why: null`);
  - the bundle's objects are in A's private bucket area (`t/<A>/ref/` in `BLOBS`), none are in `SITES`, none are under B, and A's reference store lists the bundle while B's does not;
  - a `reference` ticket for the bundle exists in A's corpus, marked `third_party`, carrying the describer's prose;
  - the second capture re-adopts with `created: false` and the same uid, and exactly one reference names the bundle;
  - `list_references` in the same turn shows the bundle;
  - the browser log shows the outside page and the request to our own host both continued to the network, and nothing fulfilled in process;
  - B has no reference for the bundle, and a turn in B neither lists it nor gets an image for it;
  - a `screenshot` of `https://outside.example/` in A returns an image, and its request was continued, not fulfilled.
- `test_UAT_AC2372_a_capture_that_cannot_be_adopted_is_still_stored_and_says_it_was_not_written_up`:
  - through a Worker turn whose index seam throws, assert that `capture_site` still stores the bundle in the business's bucket and reports `adopted: false`, `uid: null`, and the failure in `why`;
  - through `shot.ts` `fidelityDeps` with no adoption closure, assert that the capture is stored and `why` says it was stored but not indexed.
- `test_UAT_AC2372_captures_are_the_businesss_own_and_drafts_come_from_our_own_origin_with_no_new_route`:
  - assert the same storage, adoption and idempotence facts through the production adoption closure on a planted bundle;
  - script `screenshot` of `kind: draft`, and assert that the launcher navigated to the request's own origin, the page was fulfilled in process with the tenant's draft, and nothing at our origin was continued;
  - assert that unadmitted requests to any candidate looking path get the router's ordinary not-found answer and lease nothing, i.e. the route set is unchanged.
