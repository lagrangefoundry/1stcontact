---
uid: acceptance_criterion-e7b38e03
id: AC-2289
type: acceptance_criterion
title: A successful send moves the record to sent and stores the provider's message
  id and a send time
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T18:03:24.961880+00:00'
updated_at: '2026-11-04T18:03:24.961880+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-219b4217
  kind: behavior
  regression_only: false
---

## Criterion
When the sender returns a provider message id, the same record (same uid, not a second record) ends with `status = sent`, `provider_id` equal to the id the provider returned, and a `sent_at` timestamp. The send path returns that record. Exactly one call reaches the sender, carrying the message's to, from, subject and body.

## Verification
Drive the send path with a stub sender that returns a known provider id. Assert the returned record and the stored record have `status = sent`, the expected `provider_id` and a non-empty `sent_at`. Assert there is one `email` record for the message and that the stub captured exactly one send with the message's envelope and body.
