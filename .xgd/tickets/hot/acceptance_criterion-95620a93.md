---
uid: acceptance_criterion-95620a93
id: AC-1075
type: acceptance_criterion
title: A consumer granted only reading cannot reach any operation that changes the
  site
created_by: xgd
created_at: '2026-08-10T09:06:13.044555+00:00'
updated_at: '2026-08-10T09:15:03.896509+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-93905de4
  kind: behavior
  regression_only: false
---

## Criterion

Effect is declared per operation and gated independently of what is offered. A
consumer configured with only the reading group is offered the reading operations
and no writing ones, is told about no writing operation, and an attempt to invoke
one is refused with the site left byte-for-byte as it was.

## Verification

Build the surface with a grant of the reading group only. Assert a read operation
is offered and a write operation is not, and that the manual does not mention the
write. Invoke the write anyway: assert the answer reports it is not enabled or
that there is no write access, the draft file's bytes are unchanged, and the value
the write would have replaced still reads as before.