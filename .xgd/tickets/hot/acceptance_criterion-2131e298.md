---
uid: acceptance_criterion-2131e298
id: AC-1400
type: acceptance_criterion
title: The browser client, the shared components and the framework bridges are build
  artifacts, served behind the gate and never resolved per request
created_by: xgd
created_at: '2026-08-31T10:12:48.861144+00:00'
updated_at: '2026-08-31T10:12:48.861144+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
---

## Criterion

The workspace's own browser code, the shared UI components and the framework
bridges are **build artifacts**, produced by a build command before any request
arrives. No route type-strips, transpiles, or resolves a package while answering
a request; what an operator's browser receives is what the build wrote.

Three consequences are asserted rather than assumed:

- **The build is derived, not hardcoded.** The map of component entry points the
  workspace document declares is composed from each component's own declaration,
  so an upstream file move is a loud failure of the build rather than a broken
  reference in a browser. The precompiled presentation the render needs is
  reproducible: rebuilding it from its sources yields the same bytes, so an
  artifact that has gone stale is a failure at build time and not a page styled
  slightly wrong.
- **The artifacts are served behind the gate, never ahead of it.** They are
  reached by falling through the route table, which is what puts them behind the
  same verified identity as every route. Served ahead of the origin they would be
  served to anyone.
- **The fall-through stays last, and does not depend on an account.** An artifact
  request must succeed against a store that holds no account at all, because a
  build artifact has nothing to do with one; and no artifact may be answered in
  place of a route the workspace defines.

A build that has not been run says so, naming the command that runs it, rather
than answering as though the artifact simply did not exist.

## Verification

Request the workspace document and assert it references its client and its
components through the built map. Rebuild the derived artifacts from their
sources and assert the rebuilt bytes equal the ones the workspace serves —
non-vacuously, by asserting the artifacts are not empty.

Request an artifact as an admitted caller and assert it arrives; request the same
artifact as an unadmitted one and assert it is refused and that the refusal
carries none of the artifact's bytes. Request an artifact against a store holding
no account and assert it still arrives. Request a path the workspace defines as a
route and assert the route answers, not the artifact layer.

Assert no route resolves, transpiles or reads source at request time — as a
property of the sources reachable from the request path, not by observing one
successful request, since a specifier is resolved whether or not the branch
naming it runs.
