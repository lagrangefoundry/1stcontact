---
uid: acceptance_criterion-7d56c5fb
id: AC-2293
type: acceptance_criterion
title: A verified delivery event moves the matching record to delivered, and a verified
  bounce moves it to bounced with the provider's reason, in whichever business sent
  it
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T18:03:27.787642+00:00'
updated_at: '2026-11-04T18:14:38.417461+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-219b4217
  kind: behavior
  regression_only: false
---

## Criterion
A POST to the delivery webhook carrying a valid provider signature, a current timestamp and an event naming a provider message id that one of our `email` records holds:
- `email.delivered` → responds 200 and the record's `status` becomes `delivered`;
- `email.bounced` → responds 200, the record's `status` becomes `bounced`, its `failure` holds the provider's bounce message where one is given, and its contact id and address id are unchanged, so the bounced address stays identified.

The record is found in whichever registered business sent it, even when several businesses are registered. Records in other businesses are not modified.

## Verification
Seed two businesses, each with a `sent` record carrying a distinct provider id. Post a signed `email.bounced` for the second business's id with a bounce message. Assert 200, that the record has `status = bounced`, the bounce message as failure, and its original address id, and that the first business's record is unchanged. Repeat with `email.delivered` and assert `status = delivered`.