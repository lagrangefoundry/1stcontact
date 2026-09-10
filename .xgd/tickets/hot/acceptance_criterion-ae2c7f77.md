---
uid: acceptance_criterion-ae2c7f77
id: AC-1329
type: acceptance_criterion
title: The split cost nothing the single runtime provided and changed no assertion
created_by: xgd
created_at: '2026-08-20T05:10:51.268524+00:00'
updated_at: '2026-09-10T06:33:03.351339+00:00'
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

- Behavior-module components still render in the runtime that has a filesystem — the render the
  single configuration existed for is intact; since REQ-148/REQ-150 the module is a plain
  function and the configuration is plain Vitest, so the runtimes are separated by the
  filesystem rather than by the transform.
- That runtime's includes, module aliases and timeouts are the ones it had before the split.
- The Workers runtime carries no Astro transform either, so a component-render test cannot be
  routed there by accident and pass for the wrong reason.

## Verification

Assert a behavior module renders in the filesystem runtime and that its configuration carries
the same aliases and timeouts it had before the split, with no Astro transform on either
project. Assert the Workers runtime's configuration carries no Astro transform.

## Recorded at reconciliation, not asserted

The set of failing tests was unchanged across the split and across storage becoming a port:
re-running the same files against the pre-split configuration, and against the pre-port branch,
yielded the same files and the same counts, and no assertion was rewritten to accommodate
either change. This is a one-time historical comparison against two configurations that no
longer exist, so it is not checkable by any test and is not part of the criterion above. It is
recorded here — and in STORY-118's Technical Context — as an observation made at the time.
