---
uid: acceptance_criterion-0c210b8f
id: AC-2345
type: acceptance_criterion
title: Sign-in mail to one person is capped at five links per rolling hour
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-07T08:23:11.528520+00:00'
updated_at: '2026-11-07T21:04:43.597459+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-e0ca0a36
  kind: behavior
  regression_only: false
---

## Criterion
Once five sign-in links have been issued to a person within the past hour, further requests for that person within the hour send no message and create no token. Each of those requests still returns the normal acknowledgement, and the cap event is written to the invocation log. After the window passes, a request sends a link again.

## Verification
Issue five requests for one known address and assert five messages. Assert that a sixth sends nothing and returns the same acknowledgement. Advance the clock past one hour and assert a seventh sends one message.