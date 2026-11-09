---
uid: acceptance_criterion-75ebe8ba
id: AC-2511
type: acceptance_criterion
title: An asset-bearing form delivers its asset at most once per address, with authored
  content only
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T00:30:31.497818+00:00'
updated_at: '2026-11-09T01:24:11.931573+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-f2e5032c
  kind: behavior
  regression_only: false
---

## Criterion
A form whose published definition promises an asset (both an asset key and a URL) delivers it at most once, ever, per contact. On the first submission from an address, exactly one message record is created for that asset. It is addressed solely to the contact's primary address and rendered from the business's `asset` template with the asset's name and link. Its subject and body contain only authored content: nothing the visitor typed reaches a header or the body. An asset-sent event naming the asset and the message's status is added to the contact's history.

The email field is the one visitor-typed value that can reach the `To` header, so a value with a CR, LF or any other whitespace *inside* it is not an address: no contact is written, nothing is sent, and the response is the frozen acknowledgement. (Leading and trailing whitespace is trimmed before the check.)

A second submission from the same address for the same asset creates no message, and the response is unchanged. A form that declares no asset, or only half of one (a key without a URL, or a URL without a key), sends nothing.

## Verification
Submit the same address twice to an asset-bearing form, using a recording mail double. Count message records for that contact and asset by reading the message record, not the status code: expect one. Assert the recipient, the template and the absence of submitted text in the subject and body, and assert the asset-sent event. Submit to a no-asset form and a half-declared form and assert zero messages. Submit an address with an embedded CRLF (header-injection shape) and one with an embedded space to the asset-bearing form; assert the acknowledgement, zero messages sent and no contact written.
