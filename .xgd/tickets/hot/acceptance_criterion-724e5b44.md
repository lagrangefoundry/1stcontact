---
uid: acceptance_criterion-724e5b44
id: AC-2509
type: acceptance_criterion
title: Oversized, over-many-field, over-long or wrongly typed submissions are refused
  before any check or write
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T00:30:27.534103+00:00'
updated_at: '2026-11-09T00:54:14.626742+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-f2e5032c
  kind: behavior
  regression_only: false
---

## Criterion
Malformed submissions are refused before any rate-limit check, verification or write:
- A body declared or found to be larger than 8 KiB: refused with `413`. A declared over-size length is refused without the body being read.
- More than 24 fields, or any single value longer than 4000 bytes: refused with `400`.
- A JSON body that is not a JSON object: refused with `400`.
- A content type that is neither JSON nor a form encoding: refused with `415`.

Non-string JSON values (objects, arrays, null) are dropped rather than stored.

## Verification
POST each malformed shape (large declared length, large chunked body, 25 fields, a 4001-byte field, a JSON array, `text/plain`) as a non-browser caller. Assert the status for each, and that the rate-limiter and verifier doubles recorded no call and nothing was written.