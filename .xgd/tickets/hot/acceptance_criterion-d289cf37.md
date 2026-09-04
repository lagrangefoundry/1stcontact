---
uid: acceptance_criterion-d289cf37
id: AC-1545
type: acceptance_criterion
title: Every redirect hop is re-checked before it is followed, and the chain is bounded
created_by: xgd
created_at: '2026-09-04T03:53:50.743168+00:00'
updated_at: '2026-09-04T03:53:50.743168+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-70a922b9
  kind: behavior
  regression_only: false
---

## Criterion

The address rules are applied to **every hop**, not only to the address the caller supplied.

- Where a retrieval is redirected, each new address is checked against the same rules before it is
  requested. A permitted public address that redirects to a refused one is refused, and the refused
  address is never requested.
- A relative redirect target is resolved against the hop it came from, then checked.
- A redirect that names no destination is refused.
- The chain is bounded: a retrieval that keeps redirecting is stopped after a stated number of hops
  with a message saying so, rather than followed indefinitely.

Every such refusal names the address the caller originally asked for — what they will recognise —
and creates no material.

## Verification

Drive the retrieval entry point with a stand-in for the network that records every address
requested. Serve a permitted public address that redirects to a loopback address: assert the
retrieval is refused, that no material exists, and — the load-bearing assertion — that the recorder
shows the loopback address was never requested. Serve a relative redirect to a refused path and
assert it is resolved and then refused. Serve a redirect carrying no destination and assert a
refusal that says so. Serve a chain that redirects to itself and assert the retrieval stops after
the stated hop count with a message naming the limit, and that the recorder shows no more than that
many requests.
