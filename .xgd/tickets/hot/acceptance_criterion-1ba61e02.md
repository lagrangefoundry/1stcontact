---
uid: acceptance_criterion-1ba61e02
id: AC-1566
type: acceptance_criterion
title: An empty description is refused with a reason, and the description that was
  there survives
created_by: xgd
created_at: '2026-09-04T04:27:30.018512+00:00'
updated_at: '2026-09-04T04:45:38.038904+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-f775289b
  kind: behavior
  regression_only: false
---

## Criterion

A correction that submits nothing — an empty description, or one consisting only of whitespace — is
refused. The refusal carries a message saying why in the client's own terms: the description is the
only thing that makes the file findable.

The material's stored description is unchanged by a refused correction, and the material remains
findable by whatever it said before.

## Verification

Select a material with a description and submit an empty correction; assert the request is refused
rather than accepted, that the refusal message states the reason, and that the stored description is
byte-identical to what it was. Repeat with a correction consisting only of spaces and newlines and
assert the same refusal. Assert a search that matched the original description still matches it.