---
uid: request-16813fa3
id: REQ-306
type: request
title: A turn that dies uncatchably must still report legibly to the client
created_by: EPIC-16
created_at: '2026-09-22T23:13:21.139160+00:00'
updated_at: '2026-09-22T23:26:38.029327+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  priority: medium
  epic_parent: epic-96d8aca6
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-b5491bd4
---

## Why

When the Lagrange Foundry chat turn exceeded the isolate's memory, the customer was told
*"the connection to this reply was lost."* Nothing else. No error, no cause, no record.

The mechanism: `streamTurn` returns its `Response` before `start()` runs, so the headers are
already sent when the work begins. When the isolate is killed mid-stream the client receives a
**200 with an empty body and no terminal frame**. The `catch` that would render a readable
error never runs. The `finally` that flushes the audit dies with it. From the operator's side
the turn leaves no trace beyond a Cloudflare tail entry — which is where
`outcome=exceededMemory` was eventually found, by going and looking.

The same shape applies to the digest's own guard. `siteDigestSource` wraps its derivation in
`try/catch` on the stated principle that *"a failed read is silence, not a failed turn."* That
contract is sound and it does not hold: an OOM is not catchable, so the one failure mode that
path actually had was the one the guard could not see.

The memory faults themselves are covered elsewhere. **This ticket is about the fact that they
were invisible** — and would have been invisible whatever killed the isolate. A CPU-time
overrun, an eviction or a future unforeseen limit all produce the same unreadable silence.

## Required behaviour

1. A turn that ends without a terminal frame is **detected as a failure by the client**, rather
   than rendered as a lost connection. A stream that stops early is a distinguishable state,
   not an ambiguous one.
2. The customer is told something true and actionable. They need not be told about isolates or
   memory, but they must not be told the connection dropped when it did not.
3. The failure leaves a **durable operator-visible record** that does not depend on code running
   inside the dying isolate. A `finally` block cannot be the only path by which a turn's end is
   recorded.
4. The record is enough to identify the site, the session and the turn, so an operator can find
   it without reconstructing the incident from platform tails.
5. Repeated failures of the same kind are visible as a pattern rather than as isolated customer
   complaints. Lagrange Foundry failed every turn for a period before anyone established why.

## Scope

The implementer owns the mechanism. Plausible shapes include recording a turn's start before
the stream opens and reconciling it on completion, emitting a heartbeat the client can time
out against, or a terminal frame contract the client enforces. Any combination satisfying 1–5
is acceptable.

**Out of scope:** the memory faults that produced this particular incident — the per-turn
digest's asset reads, publish's snapshot handling, and the ladder's accumulation all have their
own requirements. This ticket must not be implemented as a fix for `exceededMemory`
specifically; it is about any uncatchable end of a turn.

Also out of scope: retrying a failed turn. Reporting is the requirement here; whether anything
should be retried is a separate question.

## Acceptance

- A turn whose isolate is killed mid-stream produces a readable failure for the customer and a
  durable record for the operator.
- The record exists without any code in the killed isolate having run after the kill.
- An operator can see that a given site is failing turns repeatedly without being told by the
  customer.