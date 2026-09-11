---
uid: acceptance_criterion-ceeb657c
id: AC-1320
type: acceptance_criterion
title: No knowledge base packed is an ordinary state and is silent, on either host;
  one that was built and cannot be opened is reported
created_by: xgd
created_at: '2026-08-20T04:42:15.957143+00:00'
updated_at: '2026-09-10T21:47:12.165414+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-a58a0974
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

Never having a knowledge base to open is an ordinary state, not a fault. A
conversation opened where there is none runs exactly as it did before the corpus
existed — every site operation offered, no knowledge operation offered, a turn
that runs to its completion, nothing reported missing to the operator and nothing
failed.

The situation this covers is a corpus that was never built, or was built and
never packed into the application — which is the shape every fresh checkout ships
in, and the reason the packed module is written whether or not there is anything
to put in it. It is not announced, because nothing is wrong.

**The deployed host is no longer an instance of it.** A conversation served there
reaches the same packed corpus one on the operator's own machine does, so absence
there means what it means anywhere else — nothing was packed — rather than "this
is the deployed host, where the corpus cannot be reached at all".

A knowledge base that **was** built and then cannot be opened is a different
situation and must not look the same: the conversation still opens and still works
on its site operations, and the origin says on its error output that the knowledge
base could not be opened and why, so the operator sees a cause rather than an
assistant that has quietly stopped knowing anything.

## Verification

Open a conversation where nothing has been packed: it opens, the site-changing and
site-reading operations are offered, no knowledge operation is offered, a turn
runs to its completion, and no error is reported. Repeat with a corpus present but
no embedding model available and observe the same four things, so that route to
absence is demonstrated to be equally ordinary and not a suppressed failure —
asserting the offered knowledge operations are empty rather than merely that the
turn survived. Then damage a built knowledge base — or remove the credential its
index needs — and open a conversation again on the host that can reach it: it
still opens with its site operations, and the origin's error output names the
knowledge base as unopenable and gives the reason.