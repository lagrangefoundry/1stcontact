---
uid: acceptance_criterion-ef710af6
id: AC-2278
type: acceptance_criterion
title: Provider unreachable, non-success status (with status and detail of at most
  300 chars) or accepted-without-id are each reported to the caller as a send error
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T17:32:14.014256+00:00'
updated_at: '2026-11-04T18:00:35.303942+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-7d255580
  kind: behavior
  regression_only: false
---

## Criterion
A failed provider send is reported to the caller as a send error, never as success: (a) when the provider cannot be reached, the error says the provider could not be reached and includes the underlying reason; (b) when the provider answers a non-success status, the error carries that HTTP status and includes the provider's response text truncated to at most 300 characters; (c) when the provider answers success but returns no usable message id, the error says no message id was returned so later delivery events could not be joined to it.

## Verification
With a credential configured, drive the provider double to (a) throw on request, (b) answer e.g. 422 with a long body, (c) answer 200 with a body lacking a string `id`. Assert each send rejects with a send error; for (b) assert the error's status is 422 and the detail portion is ≤ 300 characters; for (c) assert the message mentions the missing message id.