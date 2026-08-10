---
uid: acceptance_criterion-320ec80e
id: AC-1106
type: acceptance_criterion
title: 'The drawing validator is closed by construction: anything its grammar does
  not name is refused rather than skipped, and size and element counts are bounded'
created_by: xgd
created_at: '2026-08-10T09:34:42.334586+00:00'
updated_at: '2026-08-10T09:45:47.598082+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-b3de4571
  kind: behavior
  regression_only: false
---

## Criterion
Validation accounts for every byte of the document against a named grammar. A construct the grammar does not recognise — an unquoted attribute, a character-data section, a malformed tag, a document with a root that is not a drawing root — is refused rather than passed over, so a construct nobody anticipated fails closed. A document over the byte cap or over the element cap is refused; a document comfortably inside both caps is accepted.

## Verification
Assert a well-formed drawing validates. Assert each unrecognised-construct case is refused. Assert a document exceeding the element cap and a document exceeding the byte cap are each refused, while a detailed drawing well inside both caps is accepted.