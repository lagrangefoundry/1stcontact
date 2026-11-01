---
uid: acceptance_criterion-10a2bf0f
id: AC-2136
type: acceptance_criterion
title: Acceptance not posted as JSON is refused 415 (non-POST 405) and leaves the
  record untouched
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T10:39:57.810566+00:00'
updated_at: '2026-11-01T10:46:02.688224+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-0cd18650
  kind: behavior
  regression_only: false
---

## Criterion
An acceptance posted without an `application/json` content type is refused with status 415 and a plain-text message stating that acceptance must be posted as `application/json`. This covers a missing content type and the three form-encodable types (`application/x-www-form-urlencoded`, `multipart/form-data`, `text/plain`). A non-POST request to the accept endpoint is refused with status 405. In every refused case the person's recorded accepted version and acceptance time are unchanged, and later navigations are still served the terms.

## Verification
As an admitted, unaccepted person, POST the accept endpoint with each form content type and with no content type, and GET the accept endpoint. Assert 415 (or 405 for GET), then read the user row back and assert the accepted version and timestamp are still empty, and that a navigation still receives the terms page.