---
uid: acceptance_criterion-aecd6a53
id: AC-1057
type: acceptance_criterion
title: The conversation is stored through the store the site belongs to and replayed
  after the host that served it is gone
created_by: xgd
created_at: '2026-08-10T08:35:57.540058+00:00'
updated_at: '2026-11-01T02:50:55.114483+00:00'
completed_at: null
last_field_updated: body
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

Which store that is differs by host, and the criterion is about the property, not
the medium. On the deployed runtime the conversation is written through the same
account-bound ticket store the site's own tickets are read through, and the
conversation is itself a ticket there. On the host that runs on the operator's
machine it is a file held with the workspace. Neither is a location this host
composes for itself: the store is handed to it already bound to one account.

The archive holds only completed turns; the tier in front of it — the junction —
holds the turn in flight. Losing the host mid-turn never costs the conversation.
On the operator's local host the junction is itself a file held with the
workspace, beside the archive, so losing the host mid-turn does not cost the turn
in flight either: reopening replays the completed exchange followed by the turn
as far as it had got — the operator's message and the answer so far as one
assistant turn — and reports that a turn is live. Deleting the site's
conversation from the store, and reopening, yields an empty conversation — that
is where it lives, and there is no second copy elsewhere to fall back on.

## Verification

Speak a turn, discard all in-memory state as a restart or a replaced host would,
then re-open the site's conversation: it reports ready and replays both turns with
their original text and attribution. Do this on both hosts — the operator's local
one and the deployed one — since the store, not the host, is what the replay comes
from. Then remove the site's conversation from the store and re-open: the
conversation is empty, demonstrating the store is where it lived. On the deployed
host, "remove the conversation" means removing it from the ticket store the site
belongs to, because that is where it now is; on the local host, the file.

The junction's bound is its own observation, because a restart taken between
completed turns cannot reach it. On the local host, hold a turn open part-way
through — the model answering over time rather than instantly, so that "while a
turn is in flight" is a state something can stand in — and read from there: the
session's archived transcript already holds the completed conversation and does
not yet hold the answer being spoken, while the junction file under the
workspace's session directory does hold it. Then discard all in-memory state from
inside that turn and re-open: it reports ready, the completed exchange replays
intact with its original text and attribution, and it is followed by the
operator's in-flight message and an assistant turn carrying the answer as far as
it had been spoken, with live reported true.
