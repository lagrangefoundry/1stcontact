---
uid: acceptance_criterion-7f2efc7a
id: AC-2292
type: acceptance_criterion
title: Sending is done only through the sender passed to the recording path, so a
  test drives it with a stub and no real mail can leave
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T18:03:27.088710+00:00'
updated_at: '2026-11-04T18:03:27.088710+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-219b4217
  kind: behavior
  regression_only: false
---

## Criterion
The recording send path delivers a message only by calling the sender it is given. It chooses no provider and needs no provider credential. When it is run with a capturing stub, the stub receives the one message, and no other outbound mail request is made from the send path.

## Verification
Run the send path in the test environment with no mail-provider credential configured and a capturing stub sender. Assert the stub received exactly one message with the expected envelope and that the record reached `sent` with the stub's provider id. Swap in a second stub and assert the call goes to it instead, which shows the sender is supplied by the caller.
