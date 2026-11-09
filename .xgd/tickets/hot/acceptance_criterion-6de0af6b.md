---
uid: acceptance_criterion-6de0af6b
id: AC-2510
type: acceptance_criterion
title: A deployment that cannot record a submission refuses with 503 rather than acknowledging
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T00:30:29.535371+00:00'
updated_at: '2026-11-09T01:26:38.716977+00:00'
completed_at: null
last_field_updated: body
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
- the write itself fails unexpectedly (for example the control app's database is unavailable)

## Verification
Run the endpoint with the write binding removed, with the rate limiter removed, and with a limiter that throws. For the failing write, wire the real control-app `captureLead` as the write binding against a D1 binding that accepts statements but rejects every execution (a database outage); no control-app code is stubbed. Assert `503` with a body that differs from the acknowledgement in each case, and for the failing write that the failure is logged, no event is recorded and no mail is sent.
