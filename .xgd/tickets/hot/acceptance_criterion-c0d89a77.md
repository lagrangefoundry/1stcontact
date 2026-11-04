---
uid: acceptance_criterion-c0d89a77
id: AC-2290
type: acceptance_criterion
title: A failed send leaves the record as failed with the provider's reason, and the
  failure is returned rather than thrown
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T18:03:25.686834+00:00'
updated_at: '2026-11-04T18:03:25.686834+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-219b4217
  kind: behavior
  regression_only: false
---

## Criterion
When the sender throws or rejects, the send path does not throw. It returns the record with `status = failed` and `failure` holding the error's message text. The stored record shows the same, has no `provider_id` and no `sent_at`, and is the same record written as `queued` before the attempt. No send path produces a failure that leaves no record.

## Verification
Drive the send path with a stub sender that throws an error with a known message (e.g. "domain not verified"). Assert the call resolves rather than rejects, the returned record has `status = failed` and `failure` equal to that message, and the business's store holds exactly one `email` record for the message in that state.
