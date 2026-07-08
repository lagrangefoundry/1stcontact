---
uid: acceptance_criterion-f2d83fd2
id: AC-421
type: acceptance_criterion
title: CI pipeline validates every pull request with build, tests, and dry-run deploys
created_by: xgd
created_at: '2026-07-08T19:04:41.861779+00:00'
updated_at: '2026-07-08T19:04:41.861779+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-0ceaf24d
  kind: behavior
  regression_only: false
---

## Criterion
The CI pipeline is triggered by pull requests and runs the workspace build, the test suite, and a dry-run deploy of both the public-site and control-app Workers, so a PR cannot be considered green unless all of these succeed.

## Verification
Inspect the CI pipeline definition and assert it triggers on pull requests and includes steps that run the workspace build, the test command, and dry-run deploys of both public-site and control-app.
