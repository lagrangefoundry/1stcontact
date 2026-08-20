---
uid: acceptance_criterion-ceeb657c
id: AC-1320
type: acceptance_criterion
title: No knowledge base built is an ordinary state and is silent; one that was built
  and cannot be opened is reported
created_by: xgd
created_at: '2026-08-20T04:42:15.957143+00:00'
updated_at: '2026-08-20T05:03:43.188511+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-a58a0974
  kind: behavior
  regression_only: false
---

## Criterion
Never having built a knowledge base is an ordinary state, not a fault. A
conversation opened on a workspace with none runs exactly as it did before the
corpus existed — every site operation offered, no knowledge operation offered,
nothing reported missing to the operator and nothing failed. A knowledge base
that **was** built and then cannot be opened is a different situation and must not
look the same: the conversation still opens and still works on its site
operations, and the origin says on its error output that the knowledge base could
not be opened and why, so the operator sees a cause rather than an assistant that
has quietly stopped knowing anything.

## Verification
On a workspace with no knowledge base built, open a conversation: it opens, the
site-changing and site-reading operations are offered, no knowledge operation is
offered, and no error is reported. Then damage a built knowledge base — or remove
the credential its index needs — and open a conversation again: it still opens
with its site operations, and the origin's error output names the knowledge base
as unopenable and gives the reason.