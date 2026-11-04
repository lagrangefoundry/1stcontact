---
uid: acceptance_criterion-a4441768
id: AC-2296
type: acceptance_criterion
title: With no signing secret configured, the delivery webhook refuses every request
  rather than accepting unverified events
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T18:03:30.015252+00:00'
updated_at: '2026-11-04T18:03:30.015252+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-219b4217
  kind: behavior
  regression_only: false
---

## Criterion
When the deployment has no delivery-webhook signing secret (absent or blank), every POST to the webhook is refused with 401 "Refused." No body is acted on and no record is changed, even when the request carries well-formed headers and a body naming a real provider message id.

## Verification
Run the webhook with the secret unset. Post a request signed under some key and naming a seeded record's provider id. Assert 401 "Refused." and that the record's status is unchanged.
