---
uid: acceptance_criterion-cde8431c
id: AC-1546
type: acceptance_criterion
title: A retrieved body over the ceiling is refused as it arrives, whatever the remote
  claimed about its size
created_by: xgd
created_at: '2026-09-04T03:53:51.833667+00:00'
updated_at: '2026-09-04T04:08:22.242779+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-70a922b9
  kind: behavior
  regression_only: false
---

## Criterion

The per-file ceiling is enforced on retrieved material as the bytes arrive, not only on what the
remote claimed about them.

- Where the remote declares a size above the ceiling, the retrieval is refused without pulling the
  body.
- Where the remote declares a size within the ceiling — or declares none at all — and then sends
  more, the retrieval is refused at the moment the count passes the ceiling, the remainder is not
  read, and no material is created.

The refusal carries the same over-the-ceiling message a client gets for an oversized file of their
own: the size, the limit, and what to do.

## Verification

Drive the retrieval entry point with a stand-in for the network. Serve a response declaring a size
above the ceiling and assert the refusal happens without the body being read. Serve a response
declaring a size well under the ceiling but streaming more than the ceiling, and a response
declaring no size at all and doing the same: assert both are refused with the size-and-limit
message, that reading stopped rather than draining the whole body, and that no material record
exists afterwards.