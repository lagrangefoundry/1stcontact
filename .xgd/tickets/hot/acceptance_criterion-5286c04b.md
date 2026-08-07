---
uid: acceptance_criterion-5286c04b
id: AC-965
type: acceptance_criterion
title: An unconfigured origin and an unreachable origin are reported as distinct,
  explanatory failures
created_by: xgd
created_at: '2026-08-07T01:44:14.144764+00:00'
updated_at: '2026-08-07T21:19:38.025628+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

When the workspace host has no origin configured, the response explains that the
origin is unconfigured and names how to start it, with a status distinct from a
successful page. When an origin is configured but cannot be reached, the response
reports it as unreachable and names the address that was tried, with a status
distinct from the unconfigured case. Neither condition returns a blank page nor
a success status.

## Verification

Request the workspace host with no origin configured and assert the status
indicates the service is unavailable and the body names the command that starts
the origin. Repeat with an origin configured to an address nothing is listening
on and assert a different failure status, with the attempted address in the
body.