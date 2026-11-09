---
uid: acceptance_criterion-75ebe8ba
id: AC-2511
type: acceptance_criterion
title: An asset-bearing form delivers its asset at most once per address, with authored
  content only
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T00:30:31.497818+00:00'
updated_at: '2026-11-09T00:30:31.497818+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-f2e5032c
  kind: behavior
  regression_only: false
---

## Criterion
A form whose published definition promises an asset (both an asset key and a URL) delivers it at most once, ever, per contact. On the first submission from an address, exactly one message record is created for that asset. It is addressed solely to the contact's primary address and rendered from the business's `asset` template with the asset's name and link. Its subject and body contain only authored content: nothing the visitor typed reaches a header or the body. An asset-sent event naming the asset and the message's status is added to the contact's history.

A second submission from the same address for the same asset creates no message, and the response is unchanged. A form that declares no asset, or only half of one (a key without a URL, or a URL without a key), sends nothing.

## Verification
Submit the same address twice to an asset-bearing form, using a recording mail double. Count message records for that contact and asset by reading the message record, not the status code: expect one. Assert the recipient, the template and the absence of submitted text in the subject and body, and assert the asset-sent event. Submit to a no-asset form and a half-declared form and assert zero messages.
