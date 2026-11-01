---
uid: acceptance_criterion-15d1c12f
id: AC-1052
type: acceptance_criterion
title: Opening a conversation answers with its identifier, the turns already spoken
  including any turn still in progress, the cursor reached, whether a turn is live,
  and whether a turn can be run
created_by: xgd
created_at: '2026-08-10T08:35:29.808231+00:00'
updated_at: '2026-11-01T02:37:48.170165+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-a58a0974
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
Naming a site opens that site's conversation and is the only operation that turns
a site into a conversation. The answer carries, as one answer:

- an identifier for the conversation;
- the turns already spoken, in order, each marked as the operator's or the
  assistant's — **including a turn still in progress, as far as it has got**, so
  that opening the conversation mid-turn shows what the operator was watching
  rather than the conversation with that turn missing;
- the cursor: the position in the conversation those turns were read up to, a
  non-negative number, which is the position a rejoin continues from;
- whether a turn is live — true exactly when a turn has started and not yet
  ended at that cursor, false otherwise;
- whether a turn can be run, with an operator-readable reason when it cannot.

Reading the turns needs no model key: a host that cannot run a turn still answers
with the whole conversation, including a turn in progress. A site with no
conversation yet answers with an empty list of turns, a cursor of zero and no live
turn, which is normal rather than an error.

## Verification
Open a conversation for a site that has never been used: the answer carries an
identifier, an empty turn list, cursor 0, live false, and reports it is ready.
Speak a turn to completion, then open the same site again: the answer carries the
same identifier and both turns, in order, attributed correctly, a cursor greater
than zero, and live false. Start a further turn and hold it after the assistant
has streamed part of its reply; open the site again: the answer carries the
operator's message and the partial assistant reply, and live is true. With no
model key configured, open a site that has a stored conversation: the full
transcript comes back.
