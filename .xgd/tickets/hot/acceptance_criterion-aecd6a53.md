---
uid: acceptance_criterion-aecd6a53
id: AC-1057
type: acceptance_criterion
title: The conversation is stored through the store the site belongs to and replayed
  after the host that served it is gone
created_by: xgd
created_at: '2026-08-10T08:35:57.540058+00:00'
updated_at: '2026-09-10T22:10:56.925419+00:00'
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

A conversation's turns are persisted **through the store the site belongs to** —
not in a machine-wide location, and not beside a directory that only one host
has — and are replayed on the next open, including after the host that served
them is gone and everything it held in memory with it. What the assistant
remembers of the conversation is what the operator is shown.

The tier in front of that store holds only the turn in flight and is drained into
the store as the turn runs, so losing the host mid-turn costs that turn and never
the conversation. Deleting the site's conversation from the store, and reopening,
yields an empty conversation — that is where it lives, and there is no second copy
elsewhere to fall back on.

## Verification

Speak a turn, discard all in-memory state as a restart or a replaced host would,
then re-open the site's conversation: it reports ready and replays both turns with
their original text and attribution. Do this on both hosts — the operator's local
one and the deployed one — since the store, not the host, is what the replay comes
from. Then remove the site's conversation from the store and re-open: the
conversation is empty, demonstrating the store is where it lived.

The junction's bound is its own observation, because a restart taken between
completed turns cannot reach it. Hold a turn open part-way through — the model
answering over time rather than instantly, so that "while a turn is in flight" is
a state something can stand in — and read the store from there: it already holds
the completed conversation and does not yet hold the turn being spoken. Then
discard all in-memory state from inside that turn and re-open: the completed
exchange replays intact and well-formed, and the answer that was still being
spoken is not there. That is the cost stated exactly — the turn, and not the
conversation.
