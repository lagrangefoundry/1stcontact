---
uid: acceptance_criterion-5f0ef9a0
id: AC-2135
type: acceptance_criterion
title: Accepting the terms as JSON records the current version and the acceptance
  time
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T10:39:53.446249+00:00'
updated_at: '2026-11-01T10:46:02.907247+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-0cd18650
  kind: behavior
  regression_only: false
---

## Criterion
When an admitted person posts an acceptance to the accept endpoint with an `application/json` content type, the response is status 204 with no body. Their user record then holds the current terms version as the accepted version and the time of acceptance as an ISO-8601 timestamp. Both values are written together. Accepting again moves the timestamp forward and keeps the version.

## Verification
As an admitted, unaccepted person, POST `/api/terms/accept` with `content-type: application/json`. Assert 204 and an empty body, then read the person's row back from the database and assert the accepted version equals the current version and the acceptance timestamp is the (injected) acceptance time.