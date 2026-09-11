---
uid: acceptance_criterion-7ef52929
id: AC-1705
type: acceptance_criterion
title: A permitted retrieval yields the bytes and the bare content type, and the material
  records the final address it came from
created_by: martin-github@westhead.me
created_at: '2026-09-11T04:42:47.058735+00:00'
updated_at: '2026-09-11T04:42:47.058735+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-77f8fc9e
  kind: behavior
  regression_only: false
---

## Criterion

A permitted retrieval yields three things, and the material recorded from it carries the **final**
address:

- the retrieved bytes, whole and unmodified;
- the content type the response declared, **without its parameters** — the bare type, so that the
  downstream classification of what kind of file this is matches on the type alone and does not
  silently fail on a charset;
- the address the bytes finally came from — the **last** hop of any redirect chain, not the one the
  client supplied.

The material created from the retrieval records that final address as its source. Where a redirect
chain was followed, the recorded source is the destination that actually served the bytes; the
address the client asked for is not what is recorded as provenance, because a source naming an
address the platform was redirected away from would be a provenance record that is quietly wrong.

## Verification

Drive the retrieval against a controlled responder where the requested address redirects once to a
second permitted address that returns a known body with a content type carrying a charset
parameter. Assert the returned bytes decode to that body exactly, that the content type is the bare
type with the parameter stripped, and that the final address reported is the second address while
the requested address is still reported separately. Then request the same retrieval through the
platform's retrieval entry point and assert the created material's recorded source address is the
second address, not the first.
