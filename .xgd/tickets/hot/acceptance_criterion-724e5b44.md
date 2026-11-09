---
uid: acceptance_criterion-724e5b44
id: AC-2509
type: acceptance_criterion
title: Oversized, over-many-field, over-long or wrongly typed submissions are refused
  before any check or write
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T00:30:27.534103+00:00'
updated_at: '2026-11-09T01:36:03.454016+00:00'
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
- A body with no (or an understated) declared length that turns out to be larger than 8 KiB: refused with `413` **without reading more than the cap**. The body stream is read with a running byte count and cancelled as soon as the count passes 8 KiB; it is never buffered whole (REQ-223 §6: a large body "must be rejected rather than read").
- More than 24 fields, or any single value longer than 4000 bytes: refused with `400`.
- A JSON body that is not a JSON object: refused with `400`.
- A content type that is neither JSON nor a form encoding: refused with `415`.

Non-string JSON values (objects, arrays, null) are dropped rather than stored.

## Verification
POST each malformed shape (large declared length, large chunked body, 25 fields, a 4001-byte field, a JSON array, `text/plain`) as a non-browser caller. Assert the status for each, and that the rate-limiter and verifier doubles recorded no call and nothing was written. For the bounded read: POST a body with no declared length whose `ReadableStream` never ends (it enqueues chunks on every pull), and assert the response is `413`, the stream was cancelled, and the bytes pulled from it before cancellation are no more than the cap plus one chunk.

> Tightened by the BUNDLE-42 test_fix plan (iteration 1, report-0758e7c5): this AC had been narrowed to the as-built unbounded read at reconciliation. Rung 1 of the resolution ladder decides it: REQ-223 §6 is in scope and requires a bounded read, so the code changes under a scoped code_frozen override on `apps/public-site/src/lead.ts`.
