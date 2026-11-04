---
uid: acceptance_criterion-45f6f3a9
id: AC-2291
type: acceptance_criterion
title: The stored body is the rendered text as sent, the record names both the template
  key and the template version, and a later template change does not alter it
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T18:03:26.387811+00:00'
updated_at: '2026-11-04T18:14:39.296709+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-219b4217
  kind: behavior
  regression_only: false
---

## Criterion
The record's body is exactly the rendered body that was handed to the sender, character for character. When the message came from a template ticket, the record stores both the template key and that template ticket's uid. Replacing or editing the template afterwards, and rendering it again, leaves the stored body and stored template uid of the earlier record unchanged. A message sent without a template uid is still recorded, with no template uid.

## Verification
Render a business template, send it through the recording path with a stub sender, then replace the template with different copy and render again. Assert the earlier record's body still equals the first rendered text and differs from the new render, and that its template key and template uid are the ones at send time. Send a message without a template uid and assert it is recorded with a null template uid.