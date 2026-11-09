---
uid: acceptance_criterion-724e5b44
id: AC-2509
type: acceptance_criterion
title: Oversized, over-many-field, over-long or wrongly typed submissions are refused
  before any check or write
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T00:30:27.534103+00:00'
updated_at: '2026-11-09T01:24:10.216979+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-f2e5032c
  kind: behavior
  regression_only: false
---

## Criterion
Malformed submissions are refused before any rate-limit check, verification or write:
- A body whose declared `content-length` exceeds 8 KiB: refused with `413` without the body being read.
- A body with no (or an understated) declared length that turns out to be larger than 8 KiB: refused with `413`. **As built, this body is read in full before its size is checked** (see Divergence below).
- More than 24 fields, or any single value longer than 4000 bytes: refused with `400`.
- A JSON body that is not a JSON object: refused with `400`.
- A content type that is neither JSON nor a form encoding: refused with `415`.

Non-string JSON values (objects, arrays, null) are dropped rather than stored.

## Divergence from intent (recorded at reconciliation, 2026-11-08)
REQ-223 §6 says a large body "must be rejected rather than read". The code meets that only for a body that declares its length. An undeclared (chunked) body is read whole by `request.arrayBuffer()` (`apps/public-site/src/lead.ts:257-265`) and measured afterwards; the comment at `lead.ts:243-245` claiming the read is bounded is wrong. This AC states the narrowed, as-built behaviour. **Code issue flagged** (code frozen in this reconcile): read the body stream with a running byte cap and cancel it past 8 KiB; when that lands, this AC tightens to "refused without reading more than the cap" and gains a never-ending-stream UAT asserting cancellation near the cap.

## Verification
POST each malformed shape (large declared length, large chunked body, 25 fields, a 4001-byte field, a JSON array, `text/plain`) as a non-browser caller. Assert the status for each, and that the rate-limiter and verifier doubles recorded no call and nothing was written. (The chunked case proves the 413 only; it does not, and is not claimed to, prove a bounded read.)
