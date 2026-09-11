---
uid: acceptance_criterion-b0d14eb7
id: AC-1653
type: acceptance_criterion
title: No embedding model available is a second route to no knowledge operations,
  and the conversation still takes a turn
created_by: martin-github@westhead.me
created_at: '2026-09-11T03:13:16.341706+00:00'
updated_at: '2026-09-11T03:13:16.341706+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-a58a0974
  kind: behavior
  regression_only: false
---

## Criterion

There is a **second** route to a conversation with no knowledge operations, and it
is as ordinary as the first: a packed corpus is present, but no embedding model is
available to search it with.

Searching a corpus requires putting the question through the same model the
corpus was indexed with. Where that model cannot be reached, there is no search to
offer — so the conversation opens with its site operations, no knowledge
operation, and no error, exactly as one with nothing packed does. Asking for the
knowledge base under those conditions answers that there is none; it does not
raise, and it does not defer the failure to the first question the operator asks.

This is a **missing capability, not a missing product**. The alternative — a host
that refuses to start, or a session that throws the first time the assistant
reaches for a document — would trade an assistant that cannot look something up
for one that cannot be talked to at all, and a deployment that is merely missing a
binding is a configuration mistake rather than a broken build.

## Verification

With a packed corpus present and no embedding model available, ask for the
knowledge base: the answer is that there is none, and nothing raises. Then open a
conversation under the same conditions and run a turn: it opens, the site-changing
operations are offered, the set of knowledge operations offered is empty, the turn
reaches its completion, and no error is reported to the operator.
