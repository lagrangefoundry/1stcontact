---
uid: acceptance_criterion-ec9db7f4
id: AC-1703
type: acceptance_criterion
title: 'A redirect chain is bounded: past a fixed limit the retrieval stops and says
  it redirected too many times'
created_by: martin-github@westhead.me
created_at: '2026-09-11T04:42:37.550807+00:00'
updated_at: '2026-09-11T04:58:07.392338+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-77f8fc9e
  kind: behavior
  regression_only: false
---

## Criterion

A chain of redirects is **bounded**: past a fixed limit the retrieval stops and is refused with a
message stating that the address redirected more than that many times and the attempt was stopped.

The bound is on the number of addresses actually reached, so a chain that redirects forever costs
a fixed, small number of retrievals and then ends — it is never followed indefinitely, and it does
not end by exhausting memory or by timing out.

## Verification

Drive the retrieval against a controlled responder that always answers with a redirect to a new
permitted address, counting how many times it is called. Assert the retrieval is refused, that the
message states the address redirected more than the limit, and that the number of calls is bounded
at the limit plus the initial retrieval — not unbounded and not an arbitrary larger number.