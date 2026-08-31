---
uid: acceptance_criterion-5500779b
id: AC-1468
type: acceptance_criterion
title: The shipped deployment depends on the cloud browser capability alone
created_by: xgd
created_at: '2026-08-31T22:53:36.614495+00:00'
updated_at: '2026-08-31T23:04:42.057775+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-080c6036
  kind: behavior
  regression_only: false
---

## Criterion

The deployed application builds and ships carrying only its cloud browser
dependency. Its shipped code resolves without the local toolchain's Node
browser-automation stack anywhere in its module graph, and that local stack is
declared as a dependency of the local toolchain only. The cloud browser library
is declared as a dependency of the deployed application, so a deploy resolves it
rather than discovering it missing.

Exactly one place in the codebase decides how a browser is acquired, so the
lease is the only lease.

## Verification

Walk the module graph from the deployed application's real entry point and from
the screenshot capability's own entry point, and assert neither reaches the
local browser-automation package by any route, direct or transitive.

Assert the cloud browser library is named in exactly one source file across the
repository, and that it appears in the deployed application's declared
dependencies.

This cannot be asserted by running anything: a deployment that pulled in the
local stack would fail at bundle time, in a deploy, long after every test had
passed.