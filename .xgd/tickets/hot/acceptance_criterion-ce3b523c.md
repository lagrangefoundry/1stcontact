---
uid: acceptance_criterion-ce3b523c
id: AC-1704
type: acceptance_criterion
title: A retrieved body past the per-file ceiling is refused even when the remote
  server understated or omitted its size
created_by: martin-github@westhead.me
created_at: '2026-09-11T04:42:42.259777+00:00'
updated_at: '2026-09-11T04:58:07.251277+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-77f8fc9e
  kind: behavior
  regression_only: false
---

## Criterion

A retrieved body larger than the platform's per-file ceiling is refused, **and the refusal does not
depend on the remote server being honest about the size.**

- Where the response declares a size above the ceiling, the retrieval is refused without pulling
  the body.
- Where the response declares no size, or declares one within the ceiling but then sends more than
  that, the retrieval is still refused: the body is counted as it arrives and the retrieval stops
  the moment the count passes the ceiling, rather than holding the whole body first.
- Either way the message states the size and the limit in units a person reads (megabytes, not raw
  byte counts) and suggests trying a smaller version, and no material is created.

## Verification

Drive the retrieval against a controlled responder. First have it declare a size above the ceiling
and assert the refusal, with the message naming both sizes in megabytes and offering a remedy.
Then have it declare no size at all while returning a body above the ceiling, and assert the same
refusal — this is the load-bearing half. Then have it declare a size within the ceiling while
returning a body above it, and assert the refusal again. In each case assert the account's material
count is unchanged.