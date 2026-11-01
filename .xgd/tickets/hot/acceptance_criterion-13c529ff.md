---
uid: acceptance_criterion-13c529ff
id: AC-2151
type: acceptance_criterion
title: The unauthenticated loopback dev-open door cannot add a business (404)
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T11:57:11.937346+00:00'
updated_at: '2026-11-01T11:57:11.937346+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-387c9dfe
  kind: behavior
  regression_only: false
---

## Criterion
When the builder runs in unconfigured local development (no access team or audience configured, dev-open enabled), there is no verified identity. An add-a-business request with no identity token is refused with HTTP 404, the same response unprivileged callers get. Nothing is provisioned.

## Verification
Through the worker entry point with access configuration blank and dev-open set, submit an add-a-business request with no identity assertion. Assert status 404.
