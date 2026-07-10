---
uid: acceptance_criterion-43527d8b
id: AC-554
type: acceptance_criterion
title: Conformance check is an advisory no-op when no headless browser is available
created_by: xgd
created_at: '2026-07-10T00:15:39.405153+00:00'
updated_at: '2026-07-10T00:15:39.405153+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-a6962b23
  kind: behavior
  regression_only: false
---

## Criterion
On a runner where no headless browser is available (using the default driver), the conformance check completes without throwing — an advisory no-op — rather than hard-failing the module leaf that delegates to it. When a browser is available (or an explicit driver is supplied), the checks run and can fail as normal.

## Verification
Invoke the check on a runner with no browser present and the default driver and assert it resolves without error; invoke with an available/explicit driver and assert the checks actually execute.
