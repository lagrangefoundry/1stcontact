---
uid: acceptance_criterion-ae2c7f77
id: AC-1329
type: acceptance_criterion
title: The split cost nothing the single runtime provided
created_by: xgd
created_at: '2026-08-20T05:10:51.268524+00:00'
updated_at: '2026-08-20T16:14:06.221907+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-3f4a5f2b
  kind: behavior
  regression_only: false
---

## Criterion

Splitting the test runtimes cost nothing the single runtime provided.

- Behavior-module components still render through the Astro container API in the runtime that
  has a filesystem — the transform the single configuration existed for is intact.
- That runtime's includes, module aliases and timeouts are the ones it had before the split.
- The Workers runtime does not depend on the Astro transform, so a component-render test cannot
  be routed there by accident and pass for the wrong reason.
- No *behavioural* assertion is conditioned on which runtime it runs in: routing decides where a
  test runs, never what a behavioural test claims. The deliberate exception is the
  runtime-identity probes AC-1328 owns — a workers-marked file asserting the Workers user agent,
  an unmarked file asserting it is not — which exist to prove the routing happened and could not
  be runtime-independent without ceasing to prove it.

This criterion is about the routing axis only. Whether a store is observable from an assertion is
a separate claim, carried by AC-1325 and scoped there to the body of editing assertions — a
scoping this criterion must not widen, because the port's totality claim (AC-1321) includes one
question only the filesystem-backed adapter can be asked.

The before-and-after comparison of the failing set — the same files and the same counts against
the pre-split configuration and against the pre-port branch — is a one-time reconciliation
measurement and is recorded as such in the story's suite-state attribution, not as a criterion
re-checkable on a suite run.

## Verification

Assert the Astro container-render tests pass in the filesystem runtime and that its configuration
still routes through Astro's own build configuration, with the same aliases and timeouts. Assert
the Workers runtime's configuration carries no Astro transform. Assert over the routed test
sources that no *behavioural* assertion branches on the runtime it is executing in — the
expectation a behavioural test carries is the same one under either runtime — excluding the
runtime-identity probes AC-1328 requires, which assert the runtime by design.
