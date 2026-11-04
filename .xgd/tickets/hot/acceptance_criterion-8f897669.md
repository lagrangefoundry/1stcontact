---
uid: acceptance_criterion-8f897669
id: AC-2298
type: acceptance_criterion
title: A verified event naming a message no business sent is answered 404 and creates
  or changes no record
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T18:03:31.366095+00:00'
updated_at: '2026-11-04T18:14:36.379664+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-219b4217
  kind: behavior
  regression_only: false
---

## Criterion
A correctly signed, current `email.delivered` or `email.bounced` event whose message id matches no `email` record in any active business gets HTTP 404 "No such message.". No `email` record is created in any business and no existing record changes.

## Verification
Seed one business with a record holding provider id A. Post a signed bounce for provider id B. Assert 404, that the count of `email` records is unchanged, and that record A's status is unchanged.