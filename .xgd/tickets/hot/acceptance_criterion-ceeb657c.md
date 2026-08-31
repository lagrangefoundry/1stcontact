---
uid: acceptance_criterion-ceeb657c
id: AC-1320
type: acceptance_criterion
title: No knowledge base to open is an ordinary state and is silent, on either host;
  one that was built and cannot be opened is reported
created_by: xgd
created_at: '2026-08-20T04:42:15.957143+00:00'
updated_at: '2026-08-31T10:37:30.302325+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-a58a0974
  kind: behavior
  regression_only: false
---

## Criterion

Never having a knowledge base to open is an ordinary state, not a fault. A
conversation opened where there is none runs exactly as it did before the corpus
existed — every site operation offered, no knowledge operation offered, nothing
reported missing to the operator and nothing failed. This covers two situations
that are the same to the operator: a workspace on which no corpus was ever built,
and the deployed host, where the corpus is reachable only from the operator's own
machine and so is simply absent. Neither is announced, because in neither is
anything wrong.

A knowledge base that **was** built and then cannot be opened is a different
situation and must not look the same: the conversation still opens and still works
on its site operations, and the origin says on its error output that the knowledge
base could not be opened and why, so the operator sees a cause rather than an
assistant that has quietly stopped knowing anything.

## Verification

On a workspace with no knowledge base built, open a conversation: it opens, the
site-changing and site-reading operations are offered, no knowledge operation is
offered, and no error is reported. Open a conversation on the deployed host and
observe the same three things — operations offered, no knowledge operation, no
error — so that absence there is demonstrated to be the ordinary state and not a
suppressed failure. Then damage a built knowledge base — or remove the credential
its index needs — and open a conversation again on the host that can reach it: it
still opens with its site operations, and the origin's error output names the
knowledge base as unopenable and gives the reason.
