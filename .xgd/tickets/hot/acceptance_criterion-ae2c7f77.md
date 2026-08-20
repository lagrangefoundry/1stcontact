---
uid: acceptance_criterion-ae2c7f77
id: AC-1329
type: acceptance_criterion
title: The split cost nothing the single runtime provided and changed no assertion
created_by: xgd
created_at: '2026-08-20T05:10:51.268524+00:00'
updated_at: '2026-08-20T05:10:51.268524+00:00'
completed_at: null
last_field_updated: created_at
status: pending
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
- The set of failing tests is unchanged across the split and across storage becoming a port:
  re-running the same files against the pre-split configuration, and against the pre-port branch,
  yields the same files and the same counts. No assertion was rewritten to accommodate either
  change.

## Verification

Assert the Astro container-render tests pass in the filesystem runtime and that its configuration
still routes through Astro's own build configuration, with the same aliases and timeouts.
Assert the Workers runtime's configuration carries no Astro transform. Compare the failing set
before and after: same files, same counts, and a diff of the test sources showing no assertion
changed.
