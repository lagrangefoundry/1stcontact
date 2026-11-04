---
uid: acceptance_criterion-75a0a2be
id: AC-2288
type: acceptance_criterion
title: Sending a message writes the record as queued, naming the contact and the specific
  address, before the provider is asked to send
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T18:03:24.283472+00:00'
updated_at: '2026-11-04T18:03:24.283472+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-219b4217
  kind: behavior
  regression_only: false
---

## Criterion
When a message is sent through the recording send path, an `email` record exists in that business's store with `status = queued`, a `queued_at` timestamp, and the contact id, address id, template key, subject, from, to and body as given. This is observable from inside the provider call: at the moment the sender is invoked, the business's store already holds exactly one `email` record for that message with status `queued`.

A message whose subject is empty or whitespace is still recorded. Its `subject` field keeps the value as given, and the record's title reads "(no subject)".

## Verification
Drive the send path with a capturing stub sender. Inside the stub, query the business's `email` records and assert one exists with `status = queued` and the contact id and address id given. After the call, assert the record's contact id and address id match the message. Repeat with an empty subject and assert a record is written.
