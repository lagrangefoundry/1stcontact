---
uid: acceptance_criterion-6de0af6b
id: AC-2510
type: acceptance_criterion
title: A deployment that cannot record a submission refuses with 503 rather than acknowledging
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T00:30:29.535371+00:00'
updated_at: '2026-11-09T00:54:14.376973+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-f2e5032c
  kind: behavior
  regression_only: false
---

## Criterion
When a deployment cannot record a submission, the endpoint refuses with `503` ("This site cannot take messages at the moment.") and never answers with the acknowledgement. This covers three cases:
- the internal write binding is absent
- the rate limiter is absent or errors
- the write itself fails unexpectedly

## Verification
Run the endpoint with the write binding removed, with the rate limiter removed, with a limiter that throws, and with a write binding that throws. Assert `503` with a body that differs from the acknowledgement in each case.