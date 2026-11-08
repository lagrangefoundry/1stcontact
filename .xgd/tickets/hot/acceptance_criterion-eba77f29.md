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
updated_at: '2026-11-08T05:07:38.410123+00:00'
completed_at: null
last_field_updated: status
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
  - Where adoption is unavailable, the capture is still stored, and `capture_site` says it was not written up.
- **Pictures of the draft, the page being edited and a published revision come from our own channels.**
  - They are rendered in process by the same renderer as the `/preview/*` route, at the deployment's own origin taken from the request, so the page's own assets resolve.
  - Their requests never leave the browser, and cannot come back as an Access challenge page.
  - A capture or screenshot of an outside address gets no in-process answering: a page that names our host is not answered out of our store.
- **No new route.** No HTTP route exposes the browser or any looking operation. The surface is reachable only as a tool call inside an admitted, business-scoped consultant turn.

## Verification
Inside workerd, use the Worker's own router and chat routes with real D1/R2, an injected browser launcher, and the shared model double.
- Script a consultant turn in business A that calls `capture_site` on a fixture page. Assert:
  - the bundle's objects are in A's private bucket area;
  - a `reference` ticket describing it exists in A's corpus, marked third-party;
  - `list_references` in A shows it, while a turn in business B does not list it.
- Script `screenshot` of `kind: draft`. Assert that the launcher navigated to the request's own origin and that the image reflects the tenant's draft.
- Assert that unadmitted requests to any new looking path get the router's ordinary not-found or refusal, i.e. the route set is unchanged.