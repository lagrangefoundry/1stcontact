---
uid: acceptance_criterion-b9871c04
id: AC-2275
type: acceptance_criterion
title: With a mail credential, a send is submitted once to the provider and returns
  the provider's own message id
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T17:32:09.150188+00:00'
updated_at: '2026-11-04T18:00:36.185236+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-7d255580
  kind: behavior
  regression_only: false
---

## Criterion
When the deployment holds a mail-provider credential, sending a message `{to, from, subject, body}` submits exactly one authenticated request to the provider (bearer credential; sender = `from`; recipients = a list containing only `to`; subject = `subject`) and resolves to `{ providerId }` where `providerId` is exactly the message id the provider returned.

## Verification
With a credential configured and the provider's endpoint replaced by a recording double that answers success with a known id, send one message. Assert one request was made to the provider's send endpoint with the bearer credential and the fields above, and that the returned `providerId` equals the double's id.