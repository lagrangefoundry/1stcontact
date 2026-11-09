---
uid: acceptance_criterion-6cd3c79e
id: AC-2287
type: acceptance_criterion
title: An email record type is registered in each business's store with the contact,
  address, template, envelope, status, provider and timing fields, its status set
  is the one message status vocabulary including complained, and a record naming no
  address is refused
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T18:03:23.560619+00:00'
updated_at: '2026-11-09T00:57:22.828487+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-219b4217
  kind: behavior
  regression_only: false
---

## Criterion
The product's ticket type set includes an `email` type whose records carry:
- `contact_id` and `address_id`: required plain strings (identity keys, not ticket references);
- `template_key` (required) and `template_uid` (optional) as plain strings;
- `subject`, `from` and `to`, required;
- `status`: one of exactly `queued`, `sent`, `delivered`, `bounced`, `complained`, `failed`, defaulting to `queued`;
- optional `provider_id`, `sent_at` and `failure`, plus a required `queued_at`;
- a required body, which may be empty.

The registered `status` values are the same set as the message status vocabulary the send and webhook paths use. Each value in that vocabulary is accepted by the store, so a record can be moved to `complained` without a validation error. Any value outside it is refused.

Creating an `email` record that omits the address it was sent to is refused by the store, and no record is written.

## Verification
Read the registered product type set and assert the `email` type and its field contract as listed. Assert that its `status` enum equals the exported message status vocabulary, member for member, and includes `complained`. Move a stored `email` record to `complained` and assert the write succeeds. Attempt a status outside the vocabulary and assert it is refused. Attempt to create an `email` record without `address_id` in a business's store and assert the create is refused and a query for `email` records in that business returns nothing.
