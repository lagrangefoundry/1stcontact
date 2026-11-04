---
uid: acceptance_criterion-42cf8f5a
id: AC-2295
type: acceptance_criterion
title: The delivery webhook refuses a correctly signed request whose timestamp is
  more than five minutes from now, so a captured request cannot be replayed
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T18:03:29.289204+00:00'
updated_at: '2026-11-04T18:14:37.656874+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-219b4217
  kind: behavior
  regression_only: false
---

## Criterion
A request whose signature verifies but whose timestamp header is more than 300 seconds before or after the server's current time, or is not a number, is refused with 401 "Refused." and changes no record. A request signed within the 300-second window is accepted.

## Verification
Sign a bounce event with a timestamp 301+ seconds in the past (and separately in the future) with a valid signature. Post it and assert 401 and an unchanged record. Sign the same event with a current timestamp and assert it is applied.