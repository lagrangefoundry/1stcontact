---
uid: acceptance_criterion-ae2c7f77
id: AC-1329
type: acceptance_criterion
title: The split cost nothing the single runtime provided and changed no assertion
created_by: xgd
created_at: '2026-08-20T05:10:51.268524+00:00'
updated_at: '2026-08-20T15:59:39.437893+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-3f4a5f2b
  kind: behavior
  regression_only: false
---

## Criterion

Splitting the test runtimes cost nothing the single runtime provided, and changed no assertion.

- Behavior-module components still render through the Astro container API in the runtime that
  has a filesystem — the transform the single configuration existed for is intact.
- That runtime's includes, module aliases and timeouts are the ones it had before the split.
- The Workers runtime does not depend on the Astro transform, so a component-render test cannot
  be routed there by accident and pass for the wrong reason.
- No assertion is conditioned on which runtime it runs in or which store it was given: a file
  routed to the Workers runtime asserts exactly what it would assert in the filesystem runtime,
  and neither the split nor storage becoming a port introduced a runtime-dependent or
  store-dependent expectation. Routing decides where a test runs, never what it claims.

The before-and-after comparison of the failing set — the same files and the same counts against
the pre-split configuration and against the pre-port branch — is a one-time reconciliation
measurement and is recorded as such in the story's suite-state attribution, not as a criterion
re-checkable on a suite run.

## Verification

Assert the Astro container-render tests pass in the filesystem runtime and that its configuration
still routes through Astro's own build configuration, with the same aliases and timeouts. Assert
the Workers runtime's configuration carries no Astro transform. Assert over the routed test
sources that no assertion branches on the runtime it is executing in or on which store it was
handed — the expectation a test carries is the same one under either.
