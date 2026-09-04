---
uid: acceptance_criterion-ceeb657c
id: AC-1320
type: acceptance_criterion
title: No knowledge base to open is an ordinary silent state on either host; one that
  was built and cannot be opened is reported
created_by: xgd
created_at: '2026-08-20T04:42:15.957143+00:00'
updated_at: '2026-09-04T03:03:06.736913+00:00'
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
reported missing to the operator and nothing failed.

This covers the same two situations on either host, and the deployed host is no
longer one of them by nature. A workspace on which no corpus was ever built has
none; and a deployed release has none when it was built without a corpus, or when
the model binding its searches would be embedded through is not configured for
that deployment. Both are silent, because in neither is anything wrong: a builder
that cannot answer a question about the design documents is still a builder,
whereas one that will not start is not. In particular, a release whose knowledge
base is absent must still open conversations and take turns rather than fail to
come up.

A knowledge base that **was** built and then cannot be opened is a different
situation and must not look the same: the conversation still opens and still works
on its site operations, and the origin says on its error output that the knowledge
base could not be opened and why, so the operator sees a cause rather than an
assistant that has quietly stopped knowing anything.

## Verification

On a workspace with no knowledge base built, open a conversation: it opens, the
site-changing and site-reading operations are offered, no knowledge operation is
offered, and no error is reported.

Then, inside the deployed runtime, take a turn against a release carrying no
knowledge base: the turn runs to its completion, the site operations are offered,
no knowledge operation is offered, and nothing is reported as missing. Separately,
supply a corpus but withhold the embedding binding the searches would need, and
observe the same outcome — no knowledge to open, and no error — rather than a
conversation that refuses to start.

Then damage a built knowledge base — or remove the credential its index needs —
and open a conversation again on the host that can reach it: it still opens with
its site operations, and the origin's error output names the knowledge base as
unopenable and gives the reason.
